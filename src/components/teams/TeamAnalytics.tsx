'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import LockOverlay from '@/components/LockOverlay'
import { colors, spacing, text, cards } from '@/lib/design'

// ─────────────────────────────────────────────────────────────────────────────
// TEAM ANALYTICS — the manager dashboard's insight layer.
// One fetch to /api/teams/analytics gives every section below its data, so
// changing the range is the only thing that ever refetches.
//
// Free: the hero stat row.
// Gold: everything below it, wrapped in the existing LockOverlay.
// ─────────────────────────────────────────────────────────────────────────────

const CHAMP = '#E8C9A0'
const CHAMP_DIM = 'rgba(232,201,160,0.35)'
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type RangeDays = 7 | 30 | 90

type LinkRow = { label: string; url: string | null; clicks: number }

type MemberRow = {
  user_id: string
  role: string
  display_name: string
  username: string | null
  avatar_url: string | null
  taps: number
  taps_90d: number
  clicks: number
  last_active: string | null
  inactive: boolean
  daily: { day: string; taps: number }[]
  top_links: LinkRow[]
}

type Payload = {
  days: number
  members: MemberRow[]
  series: { day: string; taps: number }[]
  summary: {
    taps_in_range: number
    taps_all_time: number
    taps_this_week: number
    taps_last_week: number
    member_count: number
    active_members: number
    inactive_members: number
    avg_per_member: number
  }
  trends: {
    week: { current: number; previous: number; pct: number | null }
    month: { current: number; previous: number; pct: number | null }
  }
  topLinks: LinkRow[]
  peak: {
    byWeekday: { weekday: number; taps: number }[]
    byHour: { hour: number; taps: number }[]
    busiestDay: { weekday: number; taps: number } | null
    busiestHour: { hour: number; taps: number } | null
  }
}

// ── Motion helpers ───────────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useCountUp(target: number, duration = 950): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    if (prefersReducedMotion()) { fromRef.current = target; setValue(target); return }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function hourLabel(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

// ── Small presentational pieces ──────────────────────────────────────────────

function TrendPill({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={st.trendNeutral}>New</span>
  if (pct === 0) return <span style={st.trendNeutral}>Level</span>
  const up = pct > 0
  return (
    <span style={{
      ...st.trendPill,
      color: up ? colors.accent.success : colors.accent.error,
      background: up ? colors.accent.successBg : colors.accent.errorBg,
    }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

function StatCard({ label, value, sub, pct, accent }: {
  label: string; value: number; sub: string; pct?: number | null; accent?: boolean
}) {
  const shown = useCountUp(value)
  return (
    <div style={{ ...st.statCard, ...(accent ? st.statCardAccent : null) }}>
      <p style={st.statLabel}>{label}</p>
      <div style={st.statValueRow}>
        <span style={{ ...st.statValue, color: accent ? CHAMP : colors.text.primary }}>
          {shown.toLocaleString()}
        </span>
        {pct !== undefined && <TrendPill pct={pct} />}
      </div>
      <p style={st.statSub}>{sub}</p>
    </div>
  )
}

function Avatar({ url, name, size = 34 }: { url: string | null; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} style={{ ...st.avatar, width: size, height: size }} />
  }
  return (
    <span style={{ ...st.avatar, width: size, height: size, ...st.avatarFallback, fontSize: size * 0.36 }}>
      {initials || '·'}
    </span>
  )
}

// Line chart that draws itself in on load.
function TapsChart({ series }: { series: { day: string; taps: number }[] }) {
  const w = 640
  const h = 170
  const max = Math.max(1, ...series.map((s) => s.taps)) * 1.15
  const step = series.length > 1 ? w / (series.length - 1) : w
  const pts = series.map((s, i) => [i * step, h - (s.taps / max) * h] as const)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const first = series[0]
  const last = series[series.length - 1]
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')

  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} style={st.chartSvg} aria-hidden="true" key={series.length}>
        <defs>
          <linearGradient id="tiTeamFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHAMP} stopOpacity="0.2" />
            <stop offset="100%" stopColor={CHAMP} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <path className="ti-ta-area" d={area} fill="url(#tiTeamFill)" />
        <path className="ti-ta-line" d={line} fill="none" stroke={CHAMP} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={st.chartAxis}>
        <span style={st.axisLabel}>{fmt(first?.day)}</span>
        <span style={st.axisLabel}>{fmt(last?.day)}</span>
      </div>
    </>
  )
}

// A member's own daily line, shown when their row is expanded.
function Sparkline({ daily }: { daily: { day: string; taps: number }[] }) {
  if (daily.length < 2) return null
  const w = 300
  const h = 44
  const max = Math.max(1, ...daily.map((d) => d.taps))
  const step = w / (daily.length - 1)
  const line = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (d.taps / max) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={st.sparkSvg} aria-hidden="true">
      <path d={line} fill="none" stroke={CHAMP} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  )
}

// ── The dashboard ────────────────────────────────────────────────────────────

export default function TeamAnalytics({ canSeeFull }: { canSeeFull: boolean }) {
  const [range, setRange] = useState<RangeDays>(30)
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMember, setOpenMember] = useState<string | null>(null)

  const load = useCallback(async (days: RangeDays) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/analytics?days=${days}`, { cache: 'no-store' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not load team analytics.')
        return
      }
      setData(await res.json())
    } catch {
      setError('Network error loading team analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(range) }, [load, range])

  const s = data?.summary
  const rangeLabel = `Last ${range} days`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── 1. Hero stats (free) ── */}
      <div className="ti-ta-grid" style={st.statGrid}>
        <StatCard
          label="Total team taps"
          value={s?.taps_in_range ?? 0}
          sub={rangeLabel}
          accent
        />
        <StatCard
          label="Active members"
          value={s?.active_members ?? 0}
          sub={`of ${s?.member_count ?? 0} in the team`}
        />
        <StatCard
          label="Taps this week"
          value={s?.taps_this_week ?? 0}
          sub={`vs ${s?.taps_last_week ?? 0} last week`}
          pct={data?.trends.week.pct ?? null}
        />
        <StatCard
          label="All-time taps"
          value={s?.taps_all_time ?? 0}
          sub="since launch"
        />
      </div>

      {error && <div style={st.errorBar}>{error}</div>}

      <LockOverlay
        enabled={!canSeeFull}
        variant="locked"
        title="Unlock the full team dashboard"
        message="See taps over time, your leaderboard, most-clicked links, peak activity and per-member breakdowns. Upgrade to Gold to unlock the full picture for your whole team."
        ctaLabel="Unlock with Gold"
        ctaHref="/business"
      >

        {/* ── 2. Taps over time ── */}
        <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
          <div style={st.sectionHead}>
            <p style={text.eyebrow}>Taps over time</p>
            <div style={st.toggleWrap}>
              {([7, 30, 90] as RangeDays[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  style={range === d ? st.toggleActive : st.toggleInactive}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {loading && !data ? (
            <div style={st.emptyState}><p style={text.bodyMuted}>Loading…</p></div>
          ) : (data?.summary.taps_in_range ?? 0) === 0 ? (
            <div style={st.emptyState}>
              <p style={text.bodyMuted}>No taps in this period yet.</p>
              <p style={{ ...text.caption, marginTop: spacing['1'] }}>
                Activity appears here as your team&apos;s cards are tapped.
              </p>
            </div>
          ) : (
            <TapsChart series={data?.series ?? []} />
          )}
        </div>

        {/* ── 5. Trends ── */}
        <div className="ti-ta-two" style={st.twoCol}>
          <div style={cards.glass}>
            <div style={st.sectionHead}><p style={text.eyebrow}>Week over week</p></div>
            <div style={st.trendRow}>
              <span style={st.trendBig}>{data?.trends.week.current ?? 0}</span>
              <TrendPill pct={data?.trends.week.pct ?? null} />
            </div>
            <p style={st.statSub}>
              {data?.trends.week.previous ?? 0} in the previous 7 days
            </p>
          </div>
          <div style={cards.glass}>
            <div style={st.sectionHead}><p style={text.eyebrow}>Month over month</p></div>
            <div style={st.trendRow}>
              <span style={st.trendBig}>{data?.trends.month.current ?? 0}</span>
              <TrendPill pct={data?.trends.month.pct ?? null} />
            </div>
            <p style={st.statSub}>
              {data?.trends.month.previous ?? 0} in the previous 30 days
            </p>
          </div>
        </div>

        {/* ── 3 + 4 + 6. Leaderboard, active/inactive, per-member detail ── */}
        <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
          <div style={st.sectionHead}>
            <p style={text.eyebrow}>Team leaderboard</p>
            <div style={st.pillRow}>
              <span style={st.activePill}>{s?.active_members ?? 0} active</span>
              {(s?.inactive_members ?? 0) > 0 && (
                <span style={st.inactiveCountPill}>{s?.inactive_members} inactive</span>
              )}
            </div>
          </div>

          {(data?.members.length ?? 0) === 0 ? (
            <div style={st.emptyState}>
              <p style={text.bodyMuted}>No team members yet.</p>
              <p style={{ ...text.caption, marginTop: spacing['1'] }}>
                Share your invite link and they&apos;ll appear here.
              </p>
            </div>
          ) : (
            (data?.members ?? []).map((m, i) => {
              const maxTaps = Math.max(1, ...(data?.members ?? []).map((x) => x.taps))
              const pct = Math.round((m.taps / maxTaps) * 100)
              const isTop = i === 0 && m.taps > 0
              const isOpen = openMember === m.user_id
              return (
                <div key={m.user_id} style={st.leaderRow}>
                  <button
                    className="ti-ta-row"
                    onClick={() => setOpenMember(isOpen ? null : m.user_id)}
                    style={st.leaderBtn}
                    aria-expanded={isOpen}
                  >
                    <span style={st.rankBadge(isTop)}>{isTop ? '★' : i + 1}</span>
                    <Avatar url={m.avatar_url} name={m.display_name} />
                    <span style={st.leaderName}>
                      <span style={{ color: colors.text.primary, fontWeight: 500 }}>{m.display_name}</span>
                      <span style={st.leaderMeta}>
                        {m.role === 'manager' ? 'Manager · ' : ''}Last active {timeAgo(m.last_active)}
                      </span>
                    </span>
                    {m.inactive && <span style={st.inactiveTag}>Inactive</span>}
                    <span style={{ ...st.leaderCount, color: isTop ? CHAMP : colors.text.primary }}>{m.taps}</span>
                    <span style={{ ...st.chevron, transform: isOpen ? 'rotate(180deg)' : 'none' }}>⌄</span>
                  </button>

                  <div style={st.barTrack}>
                    <div className="ti-ta-bar" style={{
                      ...st.barFill,
                      width: `${pct}%`,
                      background: isTop ? `linear-gradient(90deg, ${CHAMP_DIM}, ${CHAMP})` : 'rgba(255,255,255,0.5)',
                      animationDelay: `${i * 0.05}s`,
                    }} />
                  </div>

                  {isOpen && (
                    <div style={st.detailPanel}>
                      <div style={st.detailStats}>
                        <div><p style={st.detailNum}>{m.taps}</p><p style={st.detailLbl}>taps ({range}d)</p></div>
                        <div><p style={st.detailNum}>{m.taps_90d}</p><p style={st.detailLbl}>taps (90d)</p></div>
                        <div><p style={st.detailNum}>{m.clicks}</p><p style={st.detailLbl}>link clicks</p></div>
                      </div>
                      <Sparkline daily={m.daily} />
                      {m.top_links.length > 0 ? (
                        <>
                          <p style={{ ...text.caption, marginTop: spacing['3'] }}>Most-clicked links</p>
                          {m.top_links.map((l) => (
                            <div key={l.label} style={st.linkRow}>
                              <span style={st.linkLabel}>{l.label}</span>
                              <span style={st.linkCount}>{l.clicks}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p style={{ ...text.caption, marginTop: spacing['3'] }}>No link clicks recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── 7. Most-clicked links, team-wide ── */}
        <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
          <div style={st.sectionHead}>
            <p style={text.eyebrow}>Most-clicked links</p>
            <span style={text.caption}>{rangeLabel}</span>
          </div>
          {(data?.topLinks.length ?? 0) === 0 ? (
            <div style={st.emptyState}>
              <p style={text.bodyMuted}>No link clicks in this period yet.</p>
            </div>
          ) : (
            (data?.topLinks ?? []).map((l, i) => {
              const maxClicks = Math.max(1, ...(data?.topLinks ?? []).map((x) => x.clicks))
              return (
                <div key={l.label} style={st.linkBlock}>
                  <div style={st.linkTop}>
                    <span style={st.linkLabel}>{l.label}</span>
                    <span style={{ ...st.linkCount, color: i === 0 ? CHAMP : colors.text.primary }}>{l.clicks}</span>
                  </div>
                  <div style={st.barTrack}>
                    <div className="ti-ta-bar" style={{
                      ...st.barFill,
                      width: `${Math.round((l.clicks / maxClicks) * 100)}%`,
                      background: i === 0 ? `linear-gradient(90deg, ${CHAMP_DIM}, ${CHAMP})` : 'rgba(255,255,255,0.35)',
                      animationDelay: `${i * 0.05}s`,
                    }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── 8. Peak activity ── */}
        <div style={{ ...cards.glass, marginTop: spacing['5'], marginBottom: spacing['5'] }}>
          <div style={st.sectionHead}>
            <p style={text.eyebrow}>Peak activity</p>
            {data?.peak.busiestDay && (
              <span style={st.peakPill}>
                Busiest: {WEEKDAYS[data.peak.busiestDay.weekday]}
                {data.peak.busiestHour ? ` · ${hourLabel(data.peak.busiestHour.hour)}` : ''}
              </span>
            )}
          </div>
          {(data?.summary.taps_in_range ?? 0) === 0 ? (
            <div style={st.emptyState}><p style={text.bodyMuted}>Not enough data to show patterns yet.</p></div>
          ) : (
            <>
              <p style={{ ...text.caption, marginBottom: spacing['2'] }}>By day of week</p>
              <div style={st.weekdayGrid}>
                {(data?.peak.byWeekday ?? []).map((d) => {
                  const max = Math.max(1, ...(data?.peak.byWeekday ?? []).map((x) => x.taps))
                  const isPeak = data?.peak.busiestDay?.weekday === d.weekday && d.taps > 0
                  return (
                    <div key={d.weekday} style={st.weekdayCol} title={`${WEEKDAYS[d.weekday]}: ${d.taps}`}>
                      <div style={st.barTrackV}>
                        <div className="ti-ta-vbar" style={{
                          ...st.barFillV,
                          height: `${Math.max(Math.round((d.taps / max) * 100), d.taps > 0 ? 8 : 0)}%`,
                          background: isPeak ? CHAMP : 'rgba(255,255,255,0.28)',
                        }} />
                      </div>
                      <span style={{ ...st.weekdayLabel, color: isPeak ? colors.text.primary : colors.text.faint }}>
                        {WEEKDAYS[d.weekday][0]}
                      </span>
                    </div>
                  )
                })}
              </div>

              <p style={{ ...text.caption, margin: `${spacing['5']} 0 ${spacing['2']}` }}>By hour of day</p>
              <div style={st.hourGrid}>
                {(data?.peak.byHour ?? []).map((hRow) => {
                  const max = Math.max(1, ...(data?.peak.byHour ?? []).map((x) => x.taps))
                  const isPeak = data?.peak.busiestHour?.hour === hRow.hour && hRow.taps > 0
                  return (
                    <div key={hRow.hour} style={st.hourCol} title={`${hourLabel(hRow.hour)}: ${hRow.taps}`}>
                      <div style={st.barTrackV}>
                        <div className="ti-ta-vbar" style={{
                          ...st.barFillV,
                          height: `${Math.max(Math.round((hRow.taps / max) * 100), hRow.taps > 0 ? 8 : 0)}%`,
                          background: isPeak ? CHAMP : 'rgba(255,255,255,0.22)',
                        }} />
                      </div>
                      {hRow.hour % 6 === 0 && <span style={st.hourLabel}>{hourLabel(hRow.hour)}</span>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </LockOverlay>
    </>
  )
}

const CSS = `
  @keyframes ti-ta-draw { from { stroke-dashoffset: 1800 } to { stroke-dashoffset: 0 } }
  @keyframes ti-ta-in   { from { opacity: 0 } to { opacity: 1 } }
  @keyframes ti-ta-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  @keyframes ti-ta-rise { from { transform: scaleY(0) } to { transform: scaleY(1) } }

  .ti-ta-line { stroke-dasharray: 1800; stroke-dashoffset: 1800; animation: ti-ta-draw 1.6s cubic-bezier(0.16,1,0.3,1) .1s forwards; }
  .ti-ta-area { opacity: 0; animation: ti-ta-in 1s ease .8s forwards; }
  .ti-ta-bar  { transform-origin: left; animation: ti-ta-grow .8s cubic-bezier(0.16,1,0.3,1) both; }
  .ti-ta-vbar { transform-origin: bottom; animation: ti-ta-rise .7s cubic-bezier(0.16,1,0.3,1) both; }
  .ti-ta-row  { transition: background .18s ease; }
  .ti-ta-row:hover { background: rgba(255,255,255,0.03); }

  .ti-ta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
  .ti-ta-two  { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  @media (max-width: 860px) {
    .ti-ta-grid { grid-template-columns: 1fr 1fr; }
    .ti-ta-two  { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ti-ta-line { stroke-dashoffset: 0 !important; animation: none !important; }
    .ti-ta-area { opacity: 1 !important; animation: none !important; }
    .ti-ta-bar, .ti-ta-vbar { transform: none !important; animation: none !important; }
    .ti-ta-row { transition: none !important; }
  }
`

const st = {
  statGrid: { marginTop: spacing['5'] } as CSSProperties,
  statCard: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '1.1rem 1.15rem',
    minWidth: 0,
  } as CSSProperties,
  statCardAccent: {
    background: 'rgba(232,201,160,0.05)',
    border: '1px solid rgba(232,201,160,0.2)',
  } as CSSProperties,
  statLabel: {
    fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: colors.text.muted,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  } as CSSProperties,
  statValueRow: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.45rem', flexWrap: 'wrap' } as CSSProperties,
  statValue: { fontSize: '1.7rem', fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  statSub: { fontSize: '0.72rem', color: colors.text.faint, marginTop: '0.35rem' } as CSSProperties,

  trendPill: { fontSize: '0.68rem', fontWeight: 600, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' } as CSSProperties,
  trendNeutral: { fontSize: '0.68rem', fontWeight: 500, borderRadius: 999, padding: '2px 8px', color: colors.text.faint, background: 'rgba(255,255,255,0.05)' } as CSSProperties,
  trendRow: { display: 'flex', alignItems: 'baseline', gap: '0.6rem' } as CSSProperties,
  trendBig: { fontSize: '1.6rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums' } as CSSProperties,

  twoCol: { marginTop: spacing['5'] } as CSSProperties,
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: spacing['4'], flexWrap: 'wrap' } as CSSProperties,
  pillRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' } as CSSProperties,
  activePill: { fontSize: '0.68rem', fontWeight: 600, borderRadius: 999, padding: '3px 10px', color: colors.accent.success, background: colors.accent.successBg } as CSSProperties,
  inactiveCountPill: { fontSize: '0.68rem', fontWeight: 500, borderRadius: 999, padding: '3px 10px', color: colors.text.muted, background: 'rgba(255,255,255,0.05)' } as CSSProperties,
  peakPill: { fontSize: '0.7rem', fontWeight: 500, color: CHAMP, background: 'rgba(232,201,160,0.1)', border: '1px solid rgba(232,201,160,0.22)', borderRadius: 999, padding: '3px 11px' } as CSSProperties,

  toggleWrap: { display: 'flex', gap: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, padding: 3 } as CSSProperties,
  toggleActive: { fontSize: '0.7rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#fff', color: '#000', fontFamily: 'inherit' } as CSSProperties,
  toggleInactive: { fontSize: '0.7rem', fontWeight: 500, padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'transparent', color: colors.text.muted, fontFamily: 'inherit' } as CSSProperties,

  chartSvg: { width: '100%', height: 'auto', display: 'block', overflow: 'visible' } as CSSProperties,
  chartAxis: { display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' } as CSSProperties,
  axisLabel: { fontSize: '0.68rem', color: colors.text.faint } as CSSProperties,
  sparkSvg: { width: '100%', height: 44, display: 'block', marginTop: '0.75rem' } as CSSProperties,

  emptyState: { padding: '2.25rem 1rem', textAlign: 'center' } as CSSProperties,
  errorBar: { marginTop: spacing['4'], padding: '0.7rem 1rem', borderRadius: 10, fontSize: '0.82rem', color: colors.accent.error, background: colors.accent.errorBg, border: '1px solid rgba(248,113,113,0.25)' } as CSSProperties,

  leaderRow: { paddingBottom: '0.9rem', marginBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' } as CSSProperties,
  leaderBtn: {
    display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%',
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '0.35rem 0.4rem', borderRadius: 8, textAlign: 'left', fontFamily: 'inherit',
  } as CSSProperties,
  rankBadge: (isTop: boolean): CSSProperties => ({
    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.66rem', fontWeight: 700,
    background: isTop ? CHAMP : 'rgba(255,255,255,0.06)',
    color: isTop ? '#000' : colors.text.muted,
  }),
  avatar: { borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' } as CSSProperties,
  avatarFallback: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', color: colors.text.muted, fontWeight: 600 } as CSSProperties,
  leaderName: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 } as CSSProperties,
  leaderMeta: { fontSize: '0.68rem', color: colors.text.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties,
  inactiveTag: { fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.text.muted, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' } as CSSProperties,
  leaderCount: { fontSize: '0.95rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 } as CSSProperties,
  chevron: { fontSize: '0.8rem', color: colors.text.faint, transition: 'transform .2s ease', flexShrink: 0 } as CSSProperties,

  barTrack: { height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: '0.5rem' } as CSSProperties,
  barFill: { height: '100%', borderRadius: 999 } as CSSProperties,
  barTrackV: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' } as CSSProperties,
  barFillV: { width: '100%', borderRadius: 2 } as CSSProperties,

  detailPanel: { marginTop: '0.9rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 } as CSSProperties,
  detailStats: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' } as CSSProperties,
  detailNum: { fontSize: '1.15rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  detailLbl: { fontSize: '0.66rem', color: colors.text.faint, marginTop: 2 } as CSSProperties,

  linkBlock: { marginBottom: '0.9rem' } as CSSProperties,
  linkTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' } as CSSProperties,
  linkRow: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as CSSProperties,
  linkLabel: { fontSize: '0.82rem', color: colors.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 } as CSSProperties,
  linkCount: { fontSize: '0.82rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums', flexShrink: 0 } as CSSProperties,

  weekdayGrid: { display: 'flex', gap: '0.5rem', height: 90 } as CSSProperties,
  weekdayCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 } as CSSProperties,
  weekdayLabel: { fontSize: '0.66rem' } as CSSProperties,
  hourGrid: { display: 'flex', gap: 2, height: 70 } as CSSProperties,
  hourCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 } as CSSProperties,
  hourLabel: { fontSize: '0.58rem', color: colors.text.faint, whiteSpace: 'nowrap' } as CSSProperties,
}
