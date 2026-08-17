'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import LockOverlay from '@/components/LockOverlay'
import { canAccess } from '@/lib/tiers'
import {
  colors,
  font,
  radius,
  spacing,
  shadows,
  borders,
  transitions,
  text,
  cards,
  buttons,
  layout,
} from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

type TapEvent = {
  id: string
  event_type: 'card_tap' | 'link_click' | string
  card_code: string | null
  link_id: string | null
  link_label: string | null
  destination_url: string | null
  tapped_at: string
  user_agent: string | null
}

type RangeKey = '7d' | '30d' | '90d' | 'all'

// ─── Config ────────────────────────────────────────────────────────────────────

const RANGE_CFG: Record<RangeKey, { label: string; days: number | null; nb: number; step: number | null }> = {
  '7d':  { label: '7 days',   days: 7,   nb: 7,  step: 1 },
  '30d': { label: '30 days',  days: 30,  nb: 15, step: 2 },
  '90d': { label: '90 days',  days: 90,  nb: 15, step: 6 },
  'all': { label: 'All time', days: null, nb: 16, step: null },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const DAY = 86400000

function dayStart(t: number | string): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
function calDaysAgo(iso: string): number {
  return Math.floor((dayStart(Date.now()) - dayStart(iso)) / DAY)
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / DAY)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function shortDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function deviceFromUA(ua: string | null): 'iOS' | 'Android' | 'Desktop' | 'Other' {
  if (!ua) return 'Other'
  const u = ua.toLowerCase()
  if (/iphone|ipad|ipod/.test(u)) return 'iOS'
  if (/android/.test(u)) return 'Android'
  if (/windows|macintosh|mac os|linux|cros/.test(u) && !/mobile/.test(u)) return 'Desktop'
  return 'Other'
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_LABELS = ['12a', '2', '4', '6', '8', '10', '12p', '2', '4', '6', '8', '10']
const DEVICE_COLORS: Record<string, string> = {
  iOS: '#ffffff',
  Android: 'rgba(255,255,255,0.45)',
  Desktop: 'rgba(255,255,255,0.22)',
  Other: 'rgba(255,255,255,0.12)',
}

type Analytics = {
  days: number
  taps: number
  clicks: number
  ctr: number
  avg: number
  dTaps: number | null
  dClicks: number | null
  dCtr: number | null
  dAvg: number | null
  chartTaps: number[]
  chartClicks: number[]
  chartLabels: string[]
  sparkTaps: number[]
  sparkClicks: number[]
  topLinks: { label: string; url: string | null; clicks: number; pct: number; last: string }[]
  devices: { name: string; count: number; pct: number; color: string }[]
  heat: number[][]
  heatMax: number
  peakLabel: string
  windowEvents: TapEvent[]
  totalInWindow: number
}

function pctDelta(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 100 : 0
  return Math.round(((cur - prev) / prev) * 100)
}

function bucketize(events: TapEvent[], nb: number, step: number): number[] {
  const arr = Array(nb).fill(0)
  events.forEach((e) => {
    const idx = nb - 1 - Math.floor(calDaysAgo(e.tapped_at) / step)
    if (idx >= 0 && idx < nb) arr[idx]++
  })
  return arr
}

function computeAnalytics(all: TapEvent[], rangeKey: RangeKey): Analytics {
  const cfg = RANGE_CFG[rangeKey]

  // window length in days
  let days = cfg.days ?? 1
  if (cfg.days == null) {
    const oldest = all.length ? all[all.length - 1].tapped_at : new Date().toISOString()
    days = Math.max(1, calDaysAgo(oldest) + 1)
  }

  const cur = all.filter((e) => calDaysAgo(e.tapped_at) < days)
  const curTaps = cur.filter((e) => e.event_type === 'card_tap')
  const curClicks = cur.filter((e) => e.event_type === 'link_click')

  const taps = curTaps.length
  const clicks = curClicks.length
  const ctr = taps > 0 ? Math.round((clicks / taps) * 100) : 0
  const avg = +(taps / days).toFixed(1)

  // previous equal-length window (not for all-time)
  let dTaps: number | null = null, dClicks: number | null = null, dCtr: number | null = null, dAvg: number | null = null
  if (cfg.days != null) {
    const prev = all.filter((e) => {
      const a = calDaysAgo(e.tapped_at)
      return a >= cfg.days! && a < cfg.days! * 2
    })
    const pTaps = prev.filter((e) => e.event_type === 'card_tap').length
    const pClicks = prev.filter((e) => e.event_type === 'link_click').length
    const pCtr = pTaps > 0 ? Math.round((pClicks / pTaps) * 100) : 0
    const pAvg = pTaps / cfg.days
    dTaps = pctDelta(taps, pTaps)
    dClicks = pctDelta(clicks, pClicks)
    dCtr = pctDelta(ctr, pCtr)
    dAvg = pctDelta(avg, pAvg)
  }

  // chart series
  const nb = cfg.nb
  const step = cfg.step ?? Math.max(1, Math.ceil(days / nb))
  const chartTaps = bucketize(curTaps, nb, step)
  const chartClicks = bucketize(curClicks, nb, step)
  const chartLabels = Array.from({ length: nb }, (_, i) =>
    i === nb - 1 ? 'Now' : shortDate((nb - 1 - i) * step)
  )

  // sparklines (12 compact buckets)
  const sStep = Math.max(1, Math.ceil(days / 12))
  const sparkTaps = bucketize(curTaps, 12, sStep)
  const sparkClicks = bucketize(curClicks, 12, sStep)

  // top links
  const linkMap = new Map<string, { label: string; url: string | null; clicks: number; lastTs: number }>()
  curClicks.forEach((e) => {
    const label = e.link_label || 'Link'
    const ts = new Date(e.tapped_at).getTime()
    const ex = linkMap.get(label)
    if (ex) {
      ex.clicks++
      if (ts > ex.lastTs) ex.lastTs = ts
    } else {
      linkMap.set(label, { label, url: e.destination_url, clicks: 1, lastTs: ts })
    }
  })
  const topLinks = Array.from(linkMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .map((l) => ({
      label: l.label,
      url: l.url,
      clicks: l.clicks,
      pct: clicks > 0 ? Math.round((l.clicks / clicks) * 100) : 0,
      last: formatRelativeTime(new Date(l.lastTs).toISOString()),
    }))

  // devices (from taps)
  const devMap = new Map<string, number>()
  curTaps.forEach((e) => {
    const d = deviceFromUA(e.user_agent)
    devMap.set(d, (devMap.get(d) || 0) + 1)
  })
  const devTotal = curTaps.length || 1
  const devices = Array.from(devMap.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / devTotal) * 100), color: DEVICE_COLORS[name] }))
    .sort((a, b) => b.count - a.count)

  // peak heatmap (7 days × 12 two-hour buckets)
  const heat: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0))
  curTaps.forEach((e) => {
    const d = new Date(e.tapped_at)
    const wd = (d.getDay() + 6) % 7 // Mon=0
    const hb = Math.floor(d.getHours() / 2)
    heat[wd][hb]++
  })
  let heatMax = 0, pWd = 0, pHb = 0
  for (let i = 0; i < 7; i++) for (let j = 0; j < 12; j++) {
    if (heat[i][j] > heatMax) { heatMax = heat[i][j]; pWd = i; pHb = j }
  }
  const peakLabel = heatMax === 0
    ? 'Not enough data yet'
    : `${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][pWd]}, ${HOUR_LABELS[pHb]}–${HOUR_LABELS[(pHb + 1) % 12]}`

  const windowEvents = [...cur].sort((a, b) => new Date(b.tapped_at).getTime() - new Date(a.tapped_at).getTime())

  return {
    days, taps, clicks, ctr, avg, dTaps, dClicks, dCtr, dAvg,
    chartTaps, chartClicks, chartLabels, sparkTaps, sparkClicks,
    topLinks, devices, heat, heatMax, peakLabel,
    windowEvents, totalInWindow: cur.length,
  }
}

// group consecutive same events for the activity feed
type Group = { type: string; title: string; sub: string; count: number; time: string }
function groupEvents(events: TapEvent[], filter: 'all' | 'card_tap' | 'link_click'): Group[] {
  const list = filter === 'all' ? events : events.filter((e) => e.event_type === filter)
  const groups: Group[] = []
  for (const e of list) {
    const isTap = e.event_type === 'card_tap'
    const key = isTap ? `tap:${e.card_code}` : `click:${e.link_label}`
    const title = isTap ? 'NFC card tapped' : (e.link_label || 'Link clicked')
    const sub = isTap
      ? (e.card_code || '')
      : (e.destination_url ? e.destination_url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 44) : '')
    const prev = groups[groups.length - 1]
    if (prev && (prev as Group & { _key?: string })._key === key) {
      prev.count++
    } else {
      groups.push(Object.assign({ type: e.event_type, title, sub, count: 1, time: formatRelativeTime(e.tapped_at) }, { _key: key }))
    }
    if (groups.length >= 18) break
  }
  return groups
}

// ─── Small animated number ─────────────────────────────────────────────────────

function useCountUp(target: number): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (prefersReduced()) { setV(target); return }
    let raf = 0
    const start = performance.now(), from = 0, dur = 750
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setV(from + (target - from) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

function Sparkline({ vals, color }: { vals: number[]; color: string }) {
  const w = 60, h = 22, max = Math.max(...vals, 1)
  const pts = vals.map((v, i) => `${(i / (vals.length - 1 || 1)) * w},${h - (v / max) * (h - 3) - 1.5}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

function Delta({ d, allTime }: { d: number | null; allTime?: boolean }) {
  if (d === null || allTime) return <span style={s.kpiSub}>All-time total</span>
  const dir = d > 0 ? 'up' : d < 0 ? 'down' : 'flat'
  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '–'
  const color = dir === 'up' ? colors.accent.success : dir === 'down' ? colors.accent.error : colors.text.muted
  const bg = dir === 'up' ? colors.accent.successBg : dir === 'down' ? colors.accent.errorBg : colors.white[5]
  return (
    <>
      <span style={{ ...s.delta, color, background: bg }}>{arrow} {Math.abs(d)}%</span>
      <span style={s.kpiSub}>vs prev. period</span>
    </>
  )
}

function StatCard({ label, value, suffix, raw, delta, allTime, spark, sparkColor }: {
  label: string; value: number; suffix?: string; raw?: boolean
  delta: number | null; allTime?: boolean; spark: number[]; sparkColor: string
}) {
  const animated = useCountUp(value)
  const shown = raw ? (prefersReduced() ? value.toFixed(1) : animated.toFixed(1)) : Math.round(animated).toString()
  return (
    <div style={s.statCard} className="ti-stat-card">
      <div style={s.statTop}>
        <p style={s.statLabel}>{label}</p>
        <div style={s.statSpark}><Sparkline vals={spark} color={sparkColor} /></div>
      </div>
      <div style={s.statNum}>{shown}{suffix}</div>
      <div style={s.kpiFoot}><Delta d={delta} allTime={allTime} /></div>
    </div>
  )
}

// ─── Chart ──────────────────────────────────────────────────────────────────

function Chart({ a, metric }: { a: Analytics; metric: 'taps' | 'clicks' }) {
  const vals = metric === 'taps' ? a.chartTaps : a.chartClicks
  const max = Math.max(...vals, 1)
  const [tip, setTip] = useState<{ x: number; y: number; i: number } | null>(null)

  // 7-day-style moving average
  const win = Math.max(2, Math.round(vals.length / 5))
  const avg = vals.map((_, i) => {
    let sum = 0, c = 0
    for (let k = Math.max(0, i - win + 1); k <= i; k++) { sum += vals[k]; c++ }
    return sum / c
  })
  const W = 600, H = 178
  const avgPts = avg.map((v, i) => `${(i / (vals.length - 1 || 1)) * W},${H - (v / max) * (H - 8) - 4}`).join(' L')
  const showEvery = Math.ceil(vals.length / 6)

  return (
    <div style={s.chartArea} key={metric}>
      <svg style={s.avgSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={`M${avgPts}`} className="ti-avgpath" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
      <div style={s.chartBars}>
        {vals.map((v, i) => {
          const h = Math.max((v / max) * 100, 1.5)
          const isLast = i === vals.length - 1
          const barStyle: CSSProperties = {
            ...s.bar,
            background: isLast
              ? `linear-gradient(180deg, ${colors.accent.success} 0%, rgba(74,222,128,0.2) 100%)`
              : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.07) 100%)',
          }
          ;(barStyle as Record<string, string | number>)['--h'] = `${h}%`
          return (
            <div
              key={i}
              style={s.barCol}
              onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, i })}
              onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, i })}
              onMouseLeave={() => setTip(null)}
            >
              <div className="ti-bar" style={barStyle} />
            </div>
          )
        })}
      </div>
      <div style={s.chartLabels}>
        {a.chartLabels.map((l, i) => (
          <span key={i} style={s.barLabel} className="ti-bar-label">
            {(i % showEvery === 0 || i === vals.length - 1) ? l : ''}
          </span>
        ))}
      </div>
      {tip && (
        <div style={{ ...s.tooltip, left: tip.x + 12, top: tip.y - 10 }}>
          <div style={s.ttDate}>{a.chartLabels[tip.i]}</div>
          <div style={s.ttRow}>
            <span style={{ ...s.ttDot, background: tip.i === vals.length - 1 ? colors.accent.success : '#fff' }} />
            {vals[tip.i]} {metric}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Donut ──────────────────────────────────────────────────────────────────

function Donut({ a }: { a: Analytics }) {
  const [mounted, setMounted] = useState(prefersReduced())
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const C = 2 * Math.PI * 46
  let offset = 0
  return (
    <div style={s.donutWrap}>
      <div style={s.donut}>
        <svg width="116" height="116" viewBox="0 0 116 116">
          <circle cx="58" cy="58" r="46" fill="none" stroke={colors.white[5]} strokeWidth="12" />
          {a.devices.map((d) => {
            const len = (d.pct / 100) * C
            const dash = `${len} ${C - len}`
            const thisOffset = offset
            offset += len
            return (
              <circle
                key={d.name}
                cx="58" cy="58" r="46" fill="none"
                stroke={d.color} strokeWidth="12"
                strokeDasharray={dash}
                strokeDashoffset={mounted ? -thisOffset : -C}
                transform="rotate(-90 58 58)"
                style={{ transition: prefersReduced() ? 'none' : 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
              />
            )
          })}
        </svg>
        <div style={s.donutCenter}>
          <span style={s.donutTotal}>{a.taps}</span>
          <span style={s.donutTLabel}>taps</span>
        </div>
      </div>
      <div style={s.devLegend}>
        {a.devices.length === 0 ? (
          <p style={s.emptyBody}>No device data yet.</p>
        ) : a.devices.map((d) => (
          <div key={d.name} style={s.devItem}>
            <span style={{ ...s.devDot, background: d.color }} />
            <span style={s.devName}>{d.name}</span>
            <span style={s.devVal}>{d.count}</span>
            <span style={s.devPct}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function Heatmap({ a }: { a: Analytics }) {
  let peakWd = -1, peakHb = -1, m = 0
  for (let i = 0; i < 7; i++) for (let j = 0; j < 12; j++) if (a.heat[i][j] > m) { m = a.heat[i][j]; peakWd = i; peakHb = j }
  return (
    <>
      <div style={s.heat}>
        <div />
        {HOUR_LABELS.map((h, i) => <div key={i} style={s.heatHr}>{h}</div>)}
        {WEEKDAYS.map((day, di) => (
          <div key={day} style={{ display: 'contents' }}>
            <div style={s.heatDay}>{day}</div>
            {a.heat[di].map((v, hi) => {
              const intensity = a.heatMax ? v / a.heatMax : 0
              const isPeak = di === peakWd && hi === peakHb && m > 0
              return (
                <div
                  key={hi}
                  className="ti-heat-cell"
                  style={{
                    ...s.heatCell,
                    background: `rgba(74,222,128,${(intensity * 0.85).toFixed(2)})`,
                    boxShadow: isPeak ? `0 0 0 1.5px ${colors.accent.success}` : 'none',
                    animationDelay: `${(di * 12 + hi) * 7}ms`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div style={s.heatCap}>Busiest window: <b style={{ color: colors.text.primary, fontWeight: font.weight.semibold }}>{a.peakLabel}</b></div>
    </>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function NfcIcon({ faint }: { faint?: boolean }) {
  const c = faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)'
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke={faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill={c} />
    </svg>
  )
}
function LinkIcon({ faint }: { faint?: boolean }) {
  const c = faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)'
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={s.emptyState}>
      <div style={s.emptyIcon}>{icon}</div>
      <p style={s.emptyTitle}>{title}</p>
      <p style={s.emptyBody}>{body}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [allEvents, setAllEvents] = useState<TapEvent[]>([])
  const [canSeeFull, setCanSeeFull] = useState(true)
  const [upgradeBusy, setUpgradeBusy] = useState(false)

  async function startSilverUpgrade() {
    if (upgradeBusy) return
    setUpgradeBusy(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'silver', silverUpgrade: true }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (err) {
      console.error('[silver upgrade]', err)
      setUpgradeBusy(false)
    }
  }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState<RangeKey>('30d')
  const [metric, setMetric] = useState<'taps' | 'clicks'>('taps')
  const [filter, setFilter] = useState<'all' | 'card_tap' | 'link_click'>('all')

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('tap_events')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('tapped_at', { ascending: false })
      if (data) setAllEvents(data)

      // Card activation date — needed for the first-month full-access window.
      const { data: cardRow } = await supabase
        .from('cards')
        .select('activated_at')
        .eq('owner_user_id', session.user.id)
        .limit(1)
        .maybeSingle()

      // Tier → can this user see the full analytics, or just the KPI headline?
      // Founder-safe + first-month-aware, matching the dashboard gating.
      const { data: billingRow } = await supabase
        .from('user_billing')
        .select('subscription_tier, subscription_status, is_founder')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setCanSeeFull(canAccess(
        billingRow?.subscription_tier,
        'full_analytics',
        billingRow?.subscription_status,
        !!billingRow?.is_founder,
        cardRow?.activated_at ?? null,
      ))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadAnalytics(false) }, [loadAnalytics])

  const a = useMemo(() => computeAnalytics(allEvents, range), [allEvents, range])
  const grouped = useMemo(() => groupEvents(a.windowEvents, filter), [a, filter])

  return (
    <main style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${colors.bg.page}; }

        @keyframes ti-fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ti-spin   { to { transform: rotate(360deg); } }
        @keyframes ti-pulse  { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
        @keyframes ti-grow   { from { height:0; } }
        @keyframes ti-heatIn { from { opacity:0; transform:scale(.4); } to { opacity:1; transform:scale(1); } }
        @keyframes ti-draw   { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }

        .ti-bar { height: var(--h); animation: ti-grow .7s cubic-bezier(0.16,1,0.3,1); }
        .ti-heat-cell { animation: ti-heatIn .4s cubic-bezier(0.16,1,0.3,1) both; }
        .ti-avgpath { stroke-dashoffset: 0; animation: ti-draw 1.1s ease .2s both; }
        .ti-fill { transition: width .8s cubic-bezier(0.16,1,0.3,1); }

        .ti-back-btn:hover    { background:#e4e4e4 !important; transform:translateY(-1px); }
        .ti-refresh-btn:hover { background:rgba(255,255,255,0.07) !important; border-color:${colors.border.default} !important; }
        .ti-stat-card:hover   { border-color:${colors.border.default} !important; transform:translateY(-2px); }
        .ti-link-row:hover    { background:${colors.white[5]} !important; }
        .ti-seg-btn:hover     { color:${colors.text.secondary}; }

        @media (max-width: 900px) {
          .ti-header  { flex-direction: column !important; align-items: flex-start !important; }
          .ti-stats   { grid-template-columns: 1fr 1fr !important; }
          .ti-content { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .ti-wrap   { padding: 2rem 1rem !important; }
          .ti-stats  { grid-template-columns: 1fr !important; }
          .ti-title  { font-size: ${font.size['3xl']} !important; }
          .ti-bar-label { display: none !important; }
          .ti-event-time { font-size: ${font.size['2xs']} !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ti-bar { height: var(--h) !important; }
        }
      `}</style>

      <div style={s.wrap} className="ti-wrap">

        {/* HEADER */}
        <div style={s.header} className="ti-header">
          <div style={s.headerLeft}>
            <p style={s.eyebrow}>Analytics</p>
            <h1 style={s.title} className="ti-title">Performance insights</h1>
            <p style={s.subtitle}>NFC tap history, link clicks, and real engagement for your digital profile.</p>
          </div>
          <div style={s.headerBtns} className="ti-header-btns">
            <button
              onClick={() => loadAnalytics(true)}
              disabled={refreshing || loading}
              className="ti-refresh-btn"
              style={{ ...s.refreshBtn, opacity: refreshing || loading ? 0.55 : 1, cursor: refreshing || loading ? 'not-allowed' : 'pointer' }}
            >
              {refreshing ? (<><span style={s.refreshSpinner} />Refreshing…</>) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 8A6 6 0 1 1 8 2" /><path d="M14 2v4h-4" />
                  </svg>
                  Refresh insights
                </>
              )}
            </button>
            <Link href="/dashboard" className="ti-back-btn" style={s.backBtn}>← Back to dashboard</Link>
          </div>
        </div>

        {loading ? (
          <div style={s.loadingWrap}><div style={s.spinner} /></div>
        ) : (
          <>
            {/* RANGE SELECTOR */}
            <div style={s.rangeBar}>
              <div style={s.segmented}>
                {(Object.keys(RANGE_CFG) as RangeKey[]).map((k) => (
                  <button
                    key={k}
                    className="ti-seg-btn"
                    onClick={() => setRange(k)}
                    style={{
                      ...s.segBtn,
                      background: range === k ? colors.white[5] : 'transparent',
                      border: range === k ? borders.default : '1px solid transparent',
                      color: range === k ? colors.text.primary : colors.text.muted,
                    }}
                  >
                    {RANGE_CFG[k].label}
                  </button>
                ))}
              </div>
              <span style={s.rangeNote}>{a.days} {a.days === 1 ? 'day' : 'days'} of activity · {a.totalInWindow} events</span>
            </div>

            {/* KPI GRID */}
            <div style={s.statsGrid} className="ti-stats">
              <StatCard label="Total NFC taps" value={a.taps} delta={a.dTaps} allTime={range === 'all'} spark={a.sparkTaps} sparkColor={colors.accent.success} />
              <StatCard label="Link clicks" value={a.clicks} delta={a.dClicks} allTime={range === 'all'} spark={a.sparkClicks} sparkColor="rgba(255,255,255,0.6)" />
              <StatCard label="Tap-to-click rate" value={a.ctr} suffix="%" delta={a.dCtr} allTime={range === 'all'} spark={a.sparkClicks} sparkColor="rgba(255,255,255,0.6)" />
              <StatCard label="Avg taps / day" value={a.avg} raw delta={a.dAvg} allTime={range === 'all'} spark={a.sparkTaps} sparkColor="rgba(255,255,255,0.6)" />
            </div>

            {/* GATED ANALYTICS (Chart onwards) */}
            <LockOverlay
              enabled={!canSeeFull}
              variant="locked"
              title="Unlock full analytics"
              message="See your trends over time, top links, device breakdown, peak activity and live feed. Upgrade to Silver to unlock the full picture."
              ctaLabel="Unlock with Silver"
              onCta={startSilverUpgrade}
              ctaBusy={upgradeBusy}
            >

            {/* CHART */}
            <div style={s.panel}>
              <div style={s.panelHeader}>
                <div>
                  <p style={s.sectionEyebrow}>{RANGE_CFG[range].label}</p>
                  <h3 style={s.sectionTitle}>Taps &amp; clicks over time</h3>
                </div>
                <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
                  <div style={s.toggle}>
                    {(['taps', 'clicks'] as const).map((m) => (
                      <button key={m} onClick={() => setMetric(m)} style={{ ...s.toggleBtn, background: metric === m ? colors.white[5] : 'transparent', color: metric === m ? colors.text.primary : colors.text.muted }}>{m}</button>
                    ))}
                  </div>
                  <div style={s.liveIndicator}><span style={s.liveDot} /><span style={s.liveLabel}>Live</span></div>
                </div>
              </div>
              {a.taps === 0 && a.clicks === 0 ? (
                <EmptyState icon={<NfcIcon faint />} title="No activity yet" body="Tap and click activity will appear here once your card is used." />
              ) : (
                <>
                  <Chart key={range} a={a} metric={metric} />
                  <div style={s.legend}>
                    <span style={{ ...s.legendDot, background: 'rgba(255,255,255,0.45)' }} /><span style={s.legendText}>{metric === 'taps' ? 'NFC taps' : 'Link clicks'} per period</span>
                    <span style={{ ...s.legendDot, background: colors.accent.success }} /><span style={s.legendText}>Most recent</span>
                    <span style={{ ...s.legendDot, background: 'rgba(255,255,255,0.3)' }} /><span style={s.legendText}>Moving average</span>
                  </div>
                </>
              )}
            </div>

            {/* TOP LINKS + DEVICES */}
            <div style={s.contentGrid} className="ti-content">
              <div style={s.panel}>
                <div style={s.panelHeader}>
                  <div><p style={s.sectionEyebrow}>By clicks</p><h3 style={s.sectionTitle}>Top links</h3></div>
                  {a.clicks > 0 && <div style={s.totalPill}>{a.clicks} clicks</div>}
                </div>
                {a.topLinks.length === 0 ? (
                  <EmptyState icon={<LinkIcon faint />} title="No link clicks yet" body="Click data appears as visitors interact with your profile links." />
                ) : (
                  <div style={s.topLinksList}>
                    {a.topLinks.slice(0, 6).map((link, i) => (
                      <div key={link.label} className="ti-link-row" style={s.topLinkRow}>
                        <div style={s.topLinkLeft}>
                          <div style={s.topLinkRank}>{i + 1}</div>
                          <div style={s.topLinkMeta}>
                            <p style={s.topLinkLabel}>{link.label}</p>
                            <p style={s.topLinkUrl}>
                              {link.url ? link.url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 32) + ' · ' : ''}{link.last}
                            </p>
                          </div>
                        </div>
                        <div style={s.topLinkRight}>
                          <span style={s.topLinkClicks}>{link.clicks}</span>
                          <div style={s.topLinkBarTrack}><div className="ti-fill" style={{ ...s.topLinkBar, width: `${link.pct}%` }} /></div>
                          <span style={s.topLinkPct}>{link.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.panel}>
                <div style={s.panelHeader}>
                  <div><p style={s.sectionEyebrow}>From user agent</p><h3 style={s.sectionTitle}>Devices</h3></div>
                </div>
                <Donut a={a} />
              </div>
            </div>

            {/* HEATMAP */}
            <div style={s.panel}>
              <div style={s.panelHeader}>
                <div><p style={s.sectionEyebrow}>When people tap</p><h3 style={s.sectionTitle}>Peak activity</h3></div>
              </div>
              {a.taps === 0 ? (
                <EmptyState icon={<NfcIcon faint />} title="No taps yet" body="Your busiest days and times will surface here." />
              ) : <Heatmap a={a} />}
            </div>

            {/* ACTIVITY */}
            <div style={s.panel}>
              <div style={s.panelHeader}>
                <div><p style={s.sectionEyebrow}>Live activity</p><h3 style={s.sectionTitle}>Recent activity</h3></div>
                <div style={s.toggle}>
                  {([['all', 'All'], ['card_tap', 'Taps'], ['link_click', 'Clicks']] as const).map(([f, lbl]) => (
                    <button key={f} onClick={() => setFilter(f)} style={{ ...s.toggleBtn, background: filter === f ? colors.white[5] : 'transparent', color: filter === f ? colors.text.primary : colors.text.muted }}>{lbl}</button>
                  ))}
                </div>
              </div>
              {grouped.length === 0 ? (
                <EmptyState icon={<NfcIcon faint />} title="No activity yet" body="NFC taps and link clicks will appear here as your card gets used." />
              ) : (
                <div style={s.eventsList}>
                  {grouped.map((g, i) => {
                    const isTap = g.type === 'card_tap'
                    return (
                      <div key={i} style={{ ...s.eventRow, animation: `ti-fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.03}s both` }}>
                        <div style={s.timelineDotWrap}>
                          <div style={{ ...s.timelineDot, background: i === 0 ? colors.accent.success : isTap ? colors.border.default : colors.border.strong, boxShadow: i === 0 ? `0 0 8px ${colors.accent.success}` : 'none' }} />
                          {i < grouped.length - 1 && <div style={s.timelineLine} />}
                        </div>
                        <div style={s.eventContent}>
                          <div style={s.eventLeft}>
                            <div style={s.eventIconWrap}>{isTap ? <NfcIcon /> : <LinkIcon />}</div>
                            <div style={{ minWidth: 0 }}>
                              <p style={s.eventTitle}>
                                {g.title}
                                {g.count > 1 && <span style={s.eventCount}>{g.count}×</span>}
                              </p>
                              {g.sub && <p style={s.eventSub}>{g.sub}</p>}
                            </div>
                          </div>
                          <p style={s.eventTime} className="ti-event-time">{g.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            </LockOverlay>

            {/* FOOTER */}
            <div style={s.footerBrand}>
              <span style={s.footerLogo}>TAPPED-IN</span>
              <span style={s.footerSlogan}>A new standard of Networking.</span>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: colors.bg.page, color: colors.text.primary, fontFamily: font.sans, WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: layout.maxWidth['3xl'], margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column', gap: spacing[6] },
  loadingWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing[20] },
  spinner: { width: '36px', height: '36px', borderRadius: radius.full, border: `1.5px solid ${colors.white[5]}`, borderTop: `1.5px solid ${colors.white[50]}`, animation: 'ti-spin 0.75s linear infinite' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[6], flexWrap: 'wrap', animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: spacing[2], flex: 1 },
  headerBtns: { display: 'flex', alignItems: 'center', gap: spacing[3], flexShrink: 0, flexWrap: 'wrap' },
  eyebrow: { ...text.eyebrow, fontSize: font.size.xs, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)' },
  title: { fontFamily: font.sans, fontSize: `clamp(${font.size['3xl']}, 5vw, ${font.size['5xl']})`, fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, color: colors.text.primary, lineHeight: font.leading.tight },
  subtitle: { fontSize: font.size.base, fontWeight: font.weight.light, color: colors.text.muted, lineHeight: font.leading.relaxed, maxWidth: '500px' },
  backBtn: { ...buttons.ghost, fontSize: font.size.sm, padding: `${spacing[3]} ${spacing[5]}`, transition: transitions.button, flexShrink: 0 },
  refreshBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: `${spacing[3]} ${spacing[5]}`, borderRadius: radius.full, border: borders.subtle, background: 'rgba(255,255,255,0.04)', color: colors.text.muted, fontFamily: font.sans, fontSize: font.size.sm, fontWeight: font.weight.semibold, transition: transitions.button, flexShrink: 0, whiteSpace: 'nowrap' },
  refreshSpinner: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTop: `1.5px solid ${colors.text.muted}`, animation: 'ti-spin 0.75s linear infinite', flexShrink: 0 },

  // range
  rangeBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4], flexWrap: 'wrap', animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.04s both' },
  segmented: { display: 'inline-flex', background: colors.bg.surface, border: borders.subtle, borderRadius: radius.full, padding: '3px', gap: '2px' },
  segBtn: { border: '1px solid transparent', cursor: 'pointer', fontFamily: font.sans, fontSize: font.size.sm, fontWeight: font.weight.semibold, letterSpacing: '0.02em', padding: `${spacing[2]} ${spacing[4]}`, borderRadius: radius.full, transition: `background ${transitions.smooth}, color ${transitions.smooth}` },
  rangeNote: { fontSize: font.size.xs, color: colors.text.faint, letterSpacing: '0.02em' },

  // kpi
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing[4], animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s both' },
  statCard: { background: colors.bg.surface, border: borders.subtle, borderRadius: radius['2xl'], padding: spacing[5], boxShadow: shadows.panel, transition: `transform 0.2s ease, border-color ${transitions.smooth}`, display: 'flex', flexDirection: 'column', gap: spacing[2], cursor: 'default' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  statLabel: { ...text.eyebrow, fontSize: font.size['2xs'], letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)' },
  statSpark: { flexShrink: 0, opacity: 0.9 },
  statNum: { fontFamily: font.sans, fontSize: font.size['4xl'], fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, color: colors.text.primary, lineHeight: 1 },
  kpiFoot: { display: 'flex', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  delta: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: font.size['2xs'], fontWeight: font.weight.bold, padding: '2px 6px', borderRadius: radius.full },
  kpiSub: { fontSize: font.size['2xs'], color: colors.text.faint },

  // panels
  panel: { ...cards.panel, borderRadius: radius['3xl'], padding: spacing[6], display: 'flex', flexDirection: 'column', gap: spacing[5], animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.12s both' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] },
  sectionEyebrow: { ...text.eyebrow, fontSize: font.size['2xs'], letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: spacing[1] },
  sectionTitle: { fontFamily: font.sans, fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: font.tracking.snug, lineHeight: font.leading.snug },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '5px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', background: colors.accent.success, boxShadow: `0 0 6px ${colors.accent.success}`, animation: 'ti-pulse 2s ease-in-out infinite' },
  liveLabel: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.accent.success, letterSpacing: font.tracking.wide },
  totalPill: { display: 'inline-flex', alignItems: 'center', padding: `${spacing[1]} ${spacing[3]}`, borderRadius: radius.full, background: colors.white[3], border: borders.subtle, fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.text.muted, letterSpacing: font.tracking.wide, flexShrink: 0 },

  // toggle / filter (shared)
  toggle: { display: 'inline-flex', gap: '4px', background: colors.white[3], border: borders.subtle, borderRadius: radius.full, padding: '3px', flexShrink: 0 },
  toggleBtn: { border: 'none', cursor: 'pointer', fontFamily: font.sans, fontSize: font.size['2xs'], fontWeight: font.weight.semibold, letterSpacing: '0.06em', textTransform: 'capitalize', padding: `${spacing['1.5']} ${spacing[3]}`, borderRadius: radius.full, transition: `background ${transitions.smooth}, color ${transitions.smooth}` },

  // chart
  chartArea: { position: 'relative', height: '200px' },
  avgSvg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: '22px', width: '100%', height: 'calc(100% - 22px)', pointerEvents: 'none', overflow: 'visible' },
  chartBars: { position: 'absolute', left: 0, right: 0, top: 0, bottom: '22px', display: 'flex', alignItems: 'flex-end', gap: '4px' },
  barCol: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer' },
  bar: { width: '100%', borderRadius: '4px 4px 2px 2px', minHeight: '2px' },
  chartLabels: { position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: '4px' },
  barLabel: { flex: 1, textAlign: 'center', fontSize: '0.52rem', color: colors.text.faint, fontWeight: font.weight.medium, whiteSpace: 'nowrap', overflow: 'hidden' },
  tooltip: { position: 'fixed', zIndex: 50, pointerEvents: 'none', background: colors.bg.raised, border: borders.default, borderRadius: radius.md, padding: '0.5rem 0.7rem', fontSize: font.size.xs, boxShadow: shadows.lg, whiteSpace: 'nowrap' },
  ttDate: { color: colors.text.muted, fontSize: font.size['2xs'], letterSpacing: '0.04em', marginBottom: '2px' },
  ttRow: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: font.weight.semibold, textTransform: 'capitalize' },
  ttDot: { width: '6px', height: '6px', borderRadius: '50%' },
  legend: { display: 'flex', alignItems: 'center', gap: spacing[2], paddingTop: spacing[3], borderTop: borders.subtle, flexWrap: 'wrap' },
  legendDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  legendText: { fontSize: font.size.xs, color: colors.text.muted, marginRight: spacing[3] },

  // content grid
  contentGrid: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: spacing[4] },

  // top links
  topLinksList: { display: 'flex', flexDirection: 'column', gap: spacing[2] },
  topLinkRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], padding: `${spacing['2.5']} ${spacing[2]}`, borderRadius: radius.md, transition: `background ${transitions.fast}`, cursor: 'default' },
  topLinkLeft: { display: 'flex', alignItems: 'center', gap: spacing[3], flex: 1, overflow: 'hidden' },
  topLinkRank: { width: '20px', height: '20px', borderRadius: radius.sm, background: colors.white[3], border: borders.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font.size['2xs'], fontWeight: font.weight.bold, color: colors.text.faint, flexShrink: 0 },
  topLinkMeta: { overflow: 'hidden', flex: 1 },
  topLinkLabel: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  topLinkUrl: { fontSize: font.size['2xs'], fontWeight: font.weight.regular, color: colors.text.faint, fontFamily: font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' },
  topLinkRight: { display: 'flex', alignItems: 'center', gap: spacing[2], flexShrink: 0 },
  topLinkClicks: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text.primary, minWidth: '24px', textAlign: 'right' },
  topLinkBarTrack: { width: '60px', height: '3px', borderRadius: '2px', background: colors.white[5], overflow: 'hidden' },
  topLinkBar: { height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, ${colors.accent.success}, rgba(74,222,128,0.4))` },
  topLinkPct: { fontSize: font.size['2xs'], fontWeight: font.weight.semibold, color: colors.text.muted, minWidth: '32px', textAlign: 'right' },

  // donut
  donutWrap: { display: 'flex', alignItems: 'center', gap: spacing[5] },
  donut: { position: 'relative', flexShrink: 0, width: '116px', height: '116px' },
  donutCenter: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  donutTotal: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, lineHeight: 1 },
  donutTLabel: { fontSize: font.size['2xs'], color: colors.text.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' },
  devLegend: { display: 'flex', flexDirection: 'column', gap: spacing[3], flex: 1 },
  devItem: { display: 'flex', alignItems: 'center', gap: spacing[2] },
  devDot: { width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0 },
  devName: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.secondary },
  devVal: { fontSize: font.size.sm, fontWeight: font.weight.bold, marginLeft: 'auto' },
  devPct: { fontSize: font.size.xs, color: colors.text.faint, minWidth: '30px', textAlign: 'right' },

  // heatmap
  heat: { display: 'grid', gridTemplateColumns: 'auto repeat(12, 1fr)', gap: '3px', alignItems: 'center' },
  heatHr: { fontSize: '0.5rem', color: colors.text.faint, textAlign: 'center' },
  heatDay: { fontSize: '0.56rem', color: colors.text.muted, fontWeight: font.weight.semibold, paddingRight: '6px', textAlign: 'right' },
  heatCell: { aspectRatio: '1', borderRadius: '3px' },
  heatCap: { fontSize: font.size.xs, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px' },

  // events
  eventsList: { display: 'flex', flexDirection: 'column' },
  eventRow: { display: 'flex', alignItems: 'flex-start', gap: spacing[4], cursor: 'default' },
  timelineDotWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '16px', width: '16px' },
  timelineDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, zIndex: 1 },
  timelineLine: { width: '1px', flex: 1, minHeight: '18px', background: colors.border.subtle, marginTop: '4px' },
  eventContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[4], flex: 1, padding: `${spacing[3]} 0`, borderBottom: borders.subtle, minWidth: 0 },
  eventLeft: { display: 'flex', alignItems: 'flex-start', gap: spacing[3], overflow: 'hidden', flex: 1 },
  eventIconWrap: { width: '28px', height: '28px', borderRadius: radius.sm, background: colors.white[3], border: borders.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' },
  eventTitle: { fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, lineHeight: font.leading.snug },
  eventCount: { display: 'inline-block', marginLeft: '7px', fontSize: font.size['2xs'], fontWeight: font.weight.bold, color: colors.accent.success, background: colors.accent.successBg, borderRadius: radius.full, padding: '1px 6px', verticalAlign: 'middle' },
  eventSub: { fontSize: font.size.xs, fontWeight: font.weight.regular, color: colors.text.muted, fontFamily: font.mono, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' },
  eventTime: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.faint, whiteSpace: 'nowrap', flexShrink: 0 },

  // footer
  footerBrand: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: `${spacing[4]} 0 ${spacing[2]}` },
  footerLogo: { fontFamily: font.mono, fontSize: '0.58rem', fontWeight: font.weight.bold, letterSpacing: '0.26em', color: 'rgba(255,255,255,0.12)' },
  footerSlogan: { fontFamily: font.sans, fontSize: font.size['2xs'], fontWeight: font.weight.light, color: 'rgba(255,255,255,0.1)', letterSpacing: font.tracking.wide, fontStyle: 'italic' },

  // empty
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `${spacing[10]} ${spacing[4]}`, gap: spacing[2] },
  emptyIcon: { opacity: 0.7, marginBottom: spacing[1], transform: 'scale(2)' },
  emptyTitle: { fontSize: font.size.base, fontWeight: font.weight.semibold, color: 'rgba(255,255,255,0.38)', letterSpacing: font.tracking.snug },
  emptyBody: { fontSize: font.size.xs, fontWeight: font.weight.light, color: colors.text.faint, lineHeight: font.leading.relaxed, maxWidth: '260px' },
}
