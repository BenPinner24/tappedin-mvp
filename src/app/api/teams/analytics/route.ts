import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// TEAM ANALYTICS  (GET /api/teams/analytics?days=7|30|90)
//
// Everything the manager dashboard needs, aggregated server-side and returned
// as ONE payload. Four queries total, no N+1:
//   1. company_members for the manager's company
//   2. profiles for those members
//   3. tap_events for those members over the last 90 days (one .in() query)
//   4. an exact all-time tap count (head-only, no rows)
//
// SECURITY: the company is resolved from the signed-in user's own manager row.
// Nothing is read from the query string except the day range, which is
// validated against a fixed set.
// ─────────────────────────────────────────────────────────────────────────────

const WINDOW_DAYS = 90          // widest range we ever chart
const INACTIVE_DAYS = 14        // "not tapped in 14 days" → inactive
const ALLOWED_RANGES = [7, 30, 90]

type TapEvent = {
  profile_id: string | null
  tapped_at: string
  event_type: string | null
  link_label: string | null
  destination_url: string | null
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function daysAgoIso(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

// A click is any event carrying a link. Tap-only events have no link_label,
// so this distinguishes them without guessing at event_type's vocabulary.
function isLinkClick(e: TapEvent): boolean {
  return Boolean(e.link_label || e.destination_url)
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null // null = "no baseline"
  return Math.round(((current - previous) / previous) * 100)
}

export async function GET(req: Request) {
  try {
    // ── Who is asking, and which company do they manage? ────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { data: managerRow, error: managerError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .limit(1)
      .maybeSingle<{ company_id: string }>()

    if (managerError) return NextResponse.json({ error: managerError.message }, { status: 500 })
    if (!managerRow) return NextResponse.json({ error: 'Not a manager' }, { status: 403 })

    const companyId = managerRow.company_id

    const requested = Number(new URL(req.url).searchParams.get('days'))
    const days = ALLOWED_RANGES.includes(requested) ? requested : 30

    const admin = createAdminClient()

    // ── 1. The team ─────────────────────────────────────────────────────────
    const { data: memberData, error: memberError } = await admin
      .from('company_members')
      .select('user_id, role')
      .eq('company_id', companyId)
      .limit(500)
    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

    const members = (memberData ?? []) as { user_id: string; role: string }[]
    const ids = members.map((m) => m.user_id)

    if (ids.length === 0) {
      return NextResponse.json({
        days, members: [], series: [], summary: emptySummary(), trends: emptyTrends(),
        topLinks: [], peak: { byWeekday: [], byHour: [], busiestDay: null, busiestHour: null },
      })
    }

    // ── 2. Their profiles ───────────────────────────────────────────────────
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', ids)
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    const profiles = new Map<string, { username: string | null; display_name: string | null; avatar_url: string | null }>()
    for (const p of (profileData ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]) {
      profiles.set(p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url })
    }

    // ── 3. 90 days of events, one query ─────────────────────────────────────
    const { data: eventData, error: eventError } = await admin
      .from('tap_events')
      .select('profile_id, tapped_at, event_type, link_label, destination_url')
      .in('profile_id', ids)
      .gte('tapped_at', daysAgoIso(WINDOW_DAYS))
      .order('tapped_at', { ascending: true })
      .limit(50000)
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

    const events = (eventData ?? []) as TapEvent[]

    // ── 4. All-time total (count only, no rows) ─────────────────────────────
    const { count: allTimeCount } = await admin
      .from('tap_events')
      .select('profile_id', { count: 'exact', head: true })
      .in('profile_id', ids)

    // ── Aggregate ───────────────────────────────────────────────────────────
    const now = Date.now()
    const cutoff = (n: number) => now - n * 86400000
    const inRange = events.filter((e) => new Date(e.tapped_at).getTime() >= cutoff(days))

    // Daily series across the selected range, zero-filled so the chart is continuous.
    const dailyMap = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      dailyMap.set(d.toISOString().slice(0, 10), 0)
    }
    for (const e of inRange) {
      const k = dayKey(e.tapped_at)
      if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1)
    }
    const series = [...dailyMap.entries()].map(([day, taps]) => ({ day, taps }))

    // Week-over-week and month-over-month.
    const countBetween = (fromDaysAgo: number, toDaysAgo: number) =>
      events.filter((e) => {
        const t = new Date(e.tapped_at).getTime()
        return t >= cutoff(fromDaysAgo) && t < cutoff(toDaysAgo)
      }).length

    const thisWeek = countBetween(7, 0)
    const lastWeek = countBetween(14, 7)
    const thisMonth = countBetween(30, 0)
    const lastMonth = countBetween(60, 30)

    // Per-member rollup.
    const perMember = new Map<string, { taps: number; clicks: number; lastActive: string | null; daily: Map<string, number>; links: Map<string, { label: string; url: string | null; clicks: number }> }>()
    for (const id of ids) perMember.set(id, { taps: 0, clicks: 0, lastActive: null, daily: new Map(), links: new Map() })

    for (const e of events) {
      if (!e.profile_id) continue
      const m = perMember.get(e.profile_id)
      if (!m) continue
      m.taps++
      if (!m.lastActive || e.tapped_at > m.lastActive) m.lastActive = e.tapped_at
      const k = dayKey(e.tapped_at)
      m.daily.set(k, (m.daily.get(k) ?? 0) + 1)
      if (isLinkClick(e)) {
        m.clicks++
        const label = (e.link_label || e.destination_url || 'Link').trim()
        const existing = m.links.get(label)
        if (existing) existing.clicks++
        else m.links.set(label, { label, url: e.destination_url, clicks: 1 })
      }
    }

    const inactiveCutoff = cutoff(INACTIVE_DAYS)
    const memberRows = members.map((m) => {
      const agg = perMember.get(m.user_id)!
      const profile = profiles.get(m.user_id)
      const tapsInRange = [...agg.daily.entries()]
        .filter(([d]) => new Date(d).getTime() >= cutoff(days))
        .reduce((sum, [, v]) => sum + v, 0)
      return {
        user_id: m.user_id,
        role: m.role,
        display_name: profile?.display_name || profile?.username || 'Team member',
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
        taps: tapsInRange,
        taps_90d: agg.taps,
        clicks: agg.clicks,
        last_active: agg.lastActive,
        inactive: !agg.lastActive || new Date(agg.lastActive).getTime() < inactiveCutoff,
        daily: [...agg.daily.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, taps]) => ({ day, taps })),
        top_links: [...agg.links.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
      }
    }).sort((a, b) => b.taps - a.taps)

    // Team-wide link clicks.
    const linkMap = new Map<string, { label: string; url: string | null; clicks: number }>()
    for (const e of inRange) {
      if (!isLinkClick(e)) continue
      const label = (e.link_label || e.destination_url || 'Link').trim()
      const existing = linkMap.get(label)
      if (existing) existing.clicks++
      else linkMap.set(label, { label, url: e.destination_url, clicks: 1 })
    }
    const topLinks = [...linkMap.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 8)

    // Peak activity, from tapped_at.
    const byWeekday = Array.from({ length: 7 }, (_, i) => ({ weekday: i, taps: 0 }))
    const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, taps: 0 }))
    for (const e of inRange) {
      const d = new Date(e.tapped_at)
      byWeekday[d.getDay()].taps++
      byHour[d.getHours()].taps++
    }
    const busiestDay = byWeekday.reduce((a, b) => (b.taps > a.taps ? b : a), byWeekday[0])
    const busiestHour = byHour.reduce((a, b) => (b.taps > a.taps ? b : a), byHour[0])

    const activeCount = memberRows.filter((m) => !m.inactive).length

    return NextResponse.json({
      days,
      members: memberRows,
      series,
      summary: {
        taps_in_range: inRange.length,
        taps_all_time: allTimeCount ?? 0,
        taps_this_week: thisWeek,
        taps_last_week: lastWeek,
        member_count: memberRows.length,
        active_members: activeCount,
        inactive_members: memberRows.length - activeCount,
        avg_per_member: memberRows.length ? Math.round(inRange.length / memberRows.length) : 0,
      },
      trends: {
        week: { current: thisWeek, previous: lastWeek, pct: pctChange(thisWeek, lastWeek) },
        month: { current: thisMonth, previous: lastMonth, pct: pctChange(thisMonth, lastMonth) },
      },
      topLinks,
      peak: {
        byWeekday,
        byHour,
        busiestDay: busiestDay.taps > 0 ? busiestDay : null,
        busiestHour: busiestHour.taps > 0 ? busiestHour : null,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not load team analytics.'
    console.error('[teams/analytics]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function emptySummary() {
  return {
    taps_in_range: 0, taps_all_time: 0, taps_this_week: 0, taps_last_week: 0,
    member_count: 0, active_members: 0, inactive_members: 0, avg_per_member: 0,
  }
}

function emptyTrends() {
  return {
    week: { current: 0, previous: 0, pct: 0 },
    month: { current: 0, previous: 0, pct: 0 },
  }
}
