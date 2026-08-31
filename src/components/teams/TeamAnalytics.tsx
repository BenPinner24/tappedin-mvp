'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import LockOverlay from '@/components/LockOverlay'
import { colors, spacing, text, cards } from '@/lib/design'

// ─────────────────────────────────────────────────────────────────────────────
// TEAM ANALYTICS — the manager dashboard's insight layer.
// One fetch to /api/teams/analytics feeds every section; changing the range is
// the only thing that refetches.
//
// LAYOUT RULES (why this file looks the way it does):
//   · Every panel uses the same PANEL wrapper → identical outer spacing.
//   · Every panel uses the same PanelHead → title left, meta right, one rule.
//   · Charts are HTML-framed: the SVG draws the plot ONLY. Axis labels are HTML
//     laid out beside/below it, so text never scales with the viewBox, never
//     clips at the edges, and never collides with bars or the line.
//   · Axis gutters are fixed widths (Y_GUTTER), so plots align across panels.
//
// Free: the hero stat row.  Gold: everything below, inside the LockOverlay.
// ─────────────────────────────────────────────────────────────────────────────

const CHAMP = '#E8C9A0'
const CHAMP_DIM = 'rgba(232,201,160,0.32)'
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const Y_GUTTER = 40      // px reserved for y-axis numbers, shared by all charts
const SECTION_GAP = '1.25rem'

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
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

function shortDate(iso?: string): string {
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
}

// Round a max up to something that reads well on an axis (5, 10, 25, 50, 100…).
function niceMax(v: number): number {
  if (v <= 5) return 5
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (v <= mag * m) return Math.round(mag * m)
  }
  return Math.ceil(v / mag) * mag
}

// ── Shared shells: one panel style, one header style ─────────────────────────

function Panel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return <div style={{ ...cards.glass, ...st.panel, marginTop: first ? 0 : SECTION_GAP }}>{children}</div>
}

function PanelHead({ title, meta }: { title: string; meta?: React.ReactNode }) {
  return (
    <div style={st.panelHead}>
      <p style={st.panelTitle}>{title}</p>
      {meta ? <div style={st.panelMeta}>{meta}</div> : null}
    </div>
  )
}

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
        <span style={{ ...st.statValue, color: accent ? CHAMP : colors.text.primary }}>{shown.toLocaleString()}</span>
        {pct !== undefined && <TrendPill pct={pct} />}
      </div>
      <p style={st.statSub}>{sub}</p>
    </div>
  )
}

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} style={{ ...st.avatar, width: size, height: size }} />
  }
  return (
    <span style={{ ...st.avatar, ...st.avatarFallback, width: size, height: size, fontSize: size * 0.36 }}>
      {initials || '·'}
    </span>
  )
}

// ── Charts ───────────────────────────────────────────────────────────────────
// The SVG holds the plot only. Axis text is HTML, so it stays legible at every
// width and can never overlap the data or be clipped by the viewBox.

function ChartFrame({ yTicks, xTicks, children }: {
  yTicks: number[]              // top → bottom
  xTicks: string[]              // left → right
  children: React.ReactNode
}) {
  return (
    <>
      <div style={st.chartRow}>
        <div style={st.yAxis} aria-hidden="true">
          {yTicks.map((v, i) => (
            <span key={i} style={st.yTick}>{v.toLocaleString()}</span>
          ))}
        </div>
        <div style={st.plotArea}>{children}</div>
      </div>
      <div style={st.xAxis} aria-hidden="true">
        {xTicks.map((t, i) => (
          <span
            key={i}
            style={{
              ...st.xTick,
              textAlign: i === 0 ? 'left' : i === xTicks.length - 1 ? 'right' : 'center',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </>
  )
}

function TapsChart({ series }: { series: { day: string; taps: number }[] }) {
  const w = 600
  const h = 150
  const peak = Math.max(...series.map((s) => s.taps), 0)
  const max = niceMax(peak)
  const step = series.length > 1 ? w / (series.length - 1) : w
  const pts = series.map((s, i) => [i * step, h - (s.taps / max) * h] as const)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`

  // Four evenly spaced date ticks — never more, so they can't collide.
  const idx = [0, Math.floor((series.length - 1) / 3), Math.floor(((series.length - 1) * 2) / 3), series.length - 1]
  const xTicks = [...new Set(idx)].map((i) => shortDate(series[i]?.day))

  return (
    <ChartFrame yTicks={[max, Math.round(max / 2), 0]} xTicks={xTicks}>
      <svg viewBox={`0 0 ${w} ${h}`} style={st.plotSvg} preserveAspectRatio="none" aria-hidden="true" key={series.length}>
        <defs>
          <linearGradient id="tiTeamFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHAMP} stopOpacity="0.22" />
            <stop offset="100%" stopColor={CHAMP} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path className="ti-ta-area" d={area} fill="url(#tiTeamFill)" />
        <path
          className="ti-ta-line"
          d={line}
          fill="none"
          stroke={CHAMP}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </ChartFrame>
  )
}

// Vertical bar chart used for both weekday and hour distributions.
function BarChart({ bars, xTicks, highlight }: {
  bars: { key: string; value: number; label?: string; peak?: boolean }[]
  xTicks?: string[]
  highlight?: boolean
}) {
  const peak = Math.max(...bars.map((b) => b.value), 0)
  const max = niceMax(peak)
  return (
    <ChartFrame yTicks={[max, Math.round(max / 2), 0]} xTicks={xTicks ?? bars.map((b) => b.label ?? '')}>
      <div style={st.barPlot}>
        {bars.map((b, i) => (
          <div key={b.key} style={st.barSlot} title={`${b.label ?? b.key}: ${b.value}`}>
            <div
              className="ti-ta-vbar"
              style={{
                ...st.vBar,
                height: `${b.value > 0 ? Math.max((b.value / max) * 100, 4) : 0}%`,
                background: b.peak && highlight ? CHAMP : 'rgba(255,255,255,0.26)',
                animationDelay: `${i * 0.02}s`,
              }}
            />
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}

function Sparkline({ daily }: { daily: { day: string; taps: number }[] }) {
  if (daily.length < 2) return null
  const w = 300
  const h = 40
  const max = Math.max(1, ...daily.map((d) => d.taps))
  const step = w / (daily.length - 1)
  const line = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (d.taps / max) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={st.sparkSvg} preserveAspectRatio="none" aria-hidden="true">
      <path d={line} fill="none" stroke={CHAMP} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.85" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

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
  const hasTaps = (data?.summary.taps_in_range ?? 0) > 0

  const rangeToggle = (
    <div style={st.toggleWrap}>
      {([7, 30, 90] as RangeDays[]).map((d) => (
        <button key={d} onClick={() => setRange(d)} style={range === d ? st.toggleActive : st.toggleInactive}>
          {d}d
        </button>
      ))}
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── 1. Hero stats (free) ── */}
      <div className="ti-ta-stats" style={st.statGrid}>
        <StatCard label="Total team taps" value={s?.taps_in_range ?? 0} sub={rangeLabel} accent />
        <StatCard label="Active members" value={s?.active_members ?? 0} sub={`of ${s?.member_count ?? 0} in the team`} />
        <StatCard label="Taps this week" value={s?.taps_this_week ?? 0} sub={`vs ${s?.taps_last_week ?? 0} last week`} pct={data?.trends.week.pct ?? null} />
        <StatCard label="All-time taps" value={s?.taps_all_time ?? 0} sub="since launch" />
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
        <div style={st.stack}>

          {/* ── 2. Taps over time ── */}
          <Panel first>
            <PanelHead title="Taps over time" meta={rangeToggle} />
            {loading && !data ? (
              <div style={st.emptyState}><p style={st.emptyText}>Loading…</p></div>
            ) : !hasTaps ? (
              <div style={st.emptyState}>
                <p style={st.emptyText}>No taps in this period yet.</p>
                <p style={st.emptyHint}>Activity appears here as your team&apos;s cards are tapped.</p>
              </div>
            ) : (
              <TapsChart series={data?.series ?? []} />
            )}
          </Panel>

          {/* ── 5. Trends ── */}
          <div className="ti-ta-two" style={st.twoCol}>
            <div style={{ ...cards.glass, ...st.panel }}>
              <PanelHead title="Week over week" />
              <div style={st.trendRow}>
                <span style={st.trendBig}>{data?.trends.week.current ?? 0}</span>
                <TrendPill pct={data?.trends.week.pct ?? null} />
              </div>
              <p style={st.statSub}>{data?.trends.week.previous ?? 0} in the previous 7 days</p>
            </div>
            <div style={{ ...cards.glass, ...st.panel }}>
              <PanelHead title="Month over month" />
              <div style={st.trendRow}>
                <span style={st.trendBig}>{data?.trends.month.current ?? 0}</span>
                <TrendPill pct={data?.trends.month.pct ?? null} />
              </div>
              <p style={st.statSub}>{data?.trends.month.previous ?? 0} in the previous 30 days</p>
            </div>
          </div>

          {/* ── 3 + 4 + 6. Leaderboard, active/inactive, per-member detail ── */}
          <Panel>
            <PanelHead
              title="Team leaderboard"
              meta={
                <div style={st.pillRow}>
                  <span style={st.activePill}>{s?.active_members ?? 0} active</span>
                  {(s?.inactive_members ?? 0) > 0 && (
                    <span style={st.inactiveCountPill}>{s?.inactive_members} inactive</span>
                  )}
                </div>
              }
            />
            {(data?.members.length ?? 0) === 0 ? (
              <div style={st.emptyState}>
                <p style={st.emptyText}>No team members yet.</p>
                <p style={st.emptyHint}>Share your invite link and they&apos;ll appear here.</p>
              </div>
            ) : (
              <div style={st.memberList}>
                {(data?.members ?? []).map((m, i) => {
                  const maxTaps = Math.max(1, ...(data?.members ?? []).map((x) => x.taps))
                  const pct = Math.round((m.taps / maxTaps) * 100)
                  const isTop = i === 0 && m.taps > 0
                  const isOpen = openMember === m.user_id
                  return (
                    <div key={m.user_id} style={st.memberBlock}>
                      <button
                        className="ti-ta-row"
                        onClick={() => setOpenMember(isOpen ? null : m.user_id)}
                        style={st.memberBtn}
                        aria-expanded={isOpen}
                      >
                        <span style={st.rankBadge(isTop)}>{isTop ? '★' : i + 1}</span>
                        <Avatar url={m.avatar_url} name={m.display_name} />
                        <span style={st.memberIdentity}>
                          <span style={st.memberNameRow}>
                            <span style={st.memberName}>{m.display_name}</span>
                            {m.inactive && <span style={st.inactiveTag}>Inactive</span>}
                          </span>
                          <span style={st.memberSub}>
                            {m.role === 'manager' ? 'Manager · ' : ''}Last active {timeAgo(m.last_active)}
                          </span>
                        </span>
                        <span style={{ ...st.memberCount, color: isTop ? CHAMP : colors.text.primary }}>{m.taps}</span>
                        <span style={{ ...st.chevron, transform: isOpen ? 'rotate(180deg)' : 'none' }}>⌄</span>
                      </button>

                      <div style={st.barTrack}>
                        <div className="ti-ta-bar" style={{
                          ...st.barFill,
                          width: `${pct}%`,
                          background: isTop ? `linear-gradient(90deg, ${CHAMP_DIM}, ${CHAMP})` : 'rgba(255,255,255,0.45)',
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
                          <p style={st.detailHead}>Most-clicked links</p>
                          {m.top_links.length > 0 ? (
                            <div style={st.linkList}>
                              {m.top_links.map((l) => (
                                <div key={l.label} style={st.linkRow}>
                                  <span style={st.linkLabel}>{l.label}</span>
                                  <span style={st.linkCount}>{l.clicks}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={st.emptyHint}>No link clicks recorded yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* ── 7. Most-clicked links, team-wide ── */}
          <Panel>
            <PanelHead title="Most-clicked links" meta={<span style={st.metaText}>{rangeLabel}</span>} />
            {(data?.topLinks.length ?? 0) === 0 ? (
              <div style={st.emptyState}><p style={st.emptyText}>No link clicks in this period yet.</p></div>
            ) : (
              <div style={st.linkChartList}>
                {(data?.topLinks ?? []).map((l, i) => {
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
                          background: i === 0 ? `linear-gradient(90deg, ${CHAMP_DIM}, ${CHAMP})` : 'rgba(255,255,255,0.3)',
                          animationDelay: `${i * 0.05}s`,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* ── 8. Peak activity ── */}
          <Panel>
            <PanelHead
              title="Peak activity"
              meta={data?.peak.busiestDay ? (
                <span style={st.peakPill}>
                  Busiest: {WEEKDAYS[data.peak.busiestDay.weekday]}
                  {data.peak.busiestHour ? ` · ${hourLabel(data.peak.busiestHour.hour)}` : ''}
                </span>
              ) : undefined}
            />
            {!hasTaps ? (
              <div style={st.emptyState}><p style={st.emptyText}>Not enough data to show patterns yet.</p></div>
            ) : (
              <>
                <p style={st.chartCaption}>By day of week</p>
                <BarChart
                  highlight
                  bars={(data?.peak.byWeekday ?? []).map((d) => ({
                    key: `wd-${d.weekday}`,
                    value: d.taps,
                    label: WEEKDAYS[d.weekday],
                    peak: data?.peak.busiestDay?.weekday === d.weekday,
                  }))}
                  xTicks={WEEKDAY_INITIALS}
                />

                <div style={st.chartDivider} />

                <p style={st.chartCaption}>By hour of day</p>
                <BarChart
                  highlight
                  bars={(data?.peak.byHour ?? []).map((hr) => ({
                    key: `hr-${hr.hour}`,
                    value: hr.taps,
                    label: hourLabel(hr.hour),
                    peak: data?.peak.busiestHour?.hour === hr.hour,
                  }))}
                  xTicks={['12am', '6am', '12pm', '6pm', '11pm']}
                />
              </>
            )}
          </Panel>
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
  .ti-ta-bar  { transform-origin: left;   animation: ti-ta-grow .8s cubic-bezier(0.16,1,0.3,1) both; }
  .ti-ta-vbar { transform-origin: bottom; animation: ti-ta-rise .7s cubic-bezier(0.16,1,0.3,1) both; }
  .ti-ta-row  { transition: background .18s ease; }
  .ti-ta-row:hover { background: rgba(255,255,255,0.035); }

  .ti-ta-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
  .ti-ta-two   { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  @media (max-width: 900px) {
    .ti-ta-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ti-ta-two   { grid-template-columns: minmax(0, 1fr); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ti-ta-line { stroke-dashoffset: 0 !important; animation: none !important; }
    .ti-ta-area { opacity: 1 !important; animation: none !important; }
    .ti-ta-bar, .ti-ta-vbar { transform: none !important; animation: none !important; }
    .ti-ta-row { transition: none !important; }
  }
`

const st = {
  // Layout shells — one source of spacing for the whole dashboard.
  stack: { display: 'block' } as CSSProperties,
  panel: { padding: 'clamp(1.1rem, 3vw, 1.6rem)' } as CSSProperties,
  panelHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '0.75rem', flexWrap: 'wrap',
    paddingBottom: '0.85rem', marginBottom: '1.15rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as CSSProperties,
  panelTitle: {
    fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: colors.text.secondary,
  } as CSSProperties,
  panelMeta: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' } as CSSProperties,
  metaText: { fontSize: '0.72rem', color: colors.text.faint } as CSSProperties,

  statGrid: { marginTop: spacing['5'], marginBottom: SECTION_GAP } as CSSProperties,
  statCard: {
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '1.05rem 1.1rem', minWidth: 0,
  } as CSSProperties,
  statCardAccent: { background: 'rgba(232,201,160,0.05)', border: '1px solid rgba(232,201,160,0.2)' } as CSSProperties,
  statLabel: {
    fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
    color: colors.text.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  } as CSSProperties,
  statValueRow: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' } as CSSProperties,
  statValue: { fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  statSub: { fontSize: '0.71rem', color: colors.text.faint, marginTop: '0.4rem', lineHeight: 1.5 } as CSSProperties,

  twoCol: { marginTop: SECTION_GAP } as CSSProperties,
  trendRow: { display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' } as CSSProperties,
  trendBig: { fontSize: '1.55rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  trendPill: { fontSize: '0.68rem', fontWeight: 600, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' } as CSSProperties,
  trendNeutral: { fontSize: '0.68rem', fontWeight: 500, borderRadius: 999, padding: '2px 9px', color: colors.text.faint, background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' } as CSSProperties,

  pillRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' } as CSSProperties,
  activePill: { fontSize: '0.67rem', fontWeight: 600, borderRadius: 999, padding: '3px 10px', color: colors.accent.success, background: colors.accent.successBg, whiteSpace: 'nowrap' } as CSSProperties,
  inactiveCountPill: { fontSize: '0.67rem', fontWeight: 500, borderRadius: 999, padding: '3px 10px', color: colors.text.muted, background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' } as CSSProperties,
  peakPill: { fontSize: '0.69rem', fontWeight: 500, color: CHAMP, background: 'rgba(232,201,160,0.1)', border: '1px solid rgba(232,201,160,0.22)', borderRadius: 999, padding: '3px 11px', whiteSpace: 'nowrap' } as CSSProperties,

  toggleWrap: { display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: 3 } as CSSProperties,
  toggleActive: { fontSize: '0.69rem', fontWeight: 600, padding: '4px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#fff', color: '#000', fontFamily: 'inherit' } as CSSProperties,
  toggleInactive: { fontSize: '0.69rem', fontWeight: 500, padding: '4px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'transparent', color: colors.text.muted, fontFamily: 'inherit' } as CSSProperties,

  // ── Chart frame: fixed y gutter, plot fills the rest, x labels underneath ──
  chartRow: { display: 'flex', alignItems: 'stretch', gap: '0.6rem' } as CSSProperties,
  yAxis: {
    width: Y_GUTTER, flexShrink: 0,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingBottom: 1,
  } as CSSProperties,
  yTick: { fontSize: '0.64rem', color: colors.text.faint, lineHeight: 1, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  plotArea: { flex: 1, minWidth: 0, height: 150 } as CSSProperties,
  plotSvg: { width: '100%', height: '100%', display: 'block' } as CSSProperties,
  xAxis: {
    display: 'flex', justifyContent: 'space-between',
    marginLeft: Y_GUTTER + 10, marginTop: '0.65rem', gap: '0.5rem',
  } as CSSProperties,
  xTick: { fontSize: '0.64rem', color: colors.text.faint, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' } as CSSProperties,
  barPlot: { display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%', width: '100%' } as CSSProperties,
  barSlot: { flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'flex-end' } as CSSProperties,
  vBar: { width: '100%', borderRadius: 2, minHeight: 0 } as CSSProperties,
  chartCaption: { fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.text.muted, marginBottom: '0.9rem' } as CSSProperties,
  chartDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '1.6rem 0 1.25rem' } as CSSProperties,
  sparkSvg: { width: '100%', height: 40, display: 'block', marginTop: '0.9rem' } as CSSProperties,

  emptyState: { padding: '2.5rem 1rem', textAlign: 'center' } as CSSProperties,
  emptyText: { fontSize: '0.88rem', color: colors.text.muted } as CSSProperties,
  emptyHint: { fontSize: '0.75rem', color: colors.text.faint, marginTop: '0.4rem', lineHeight: 1.6 } as CSSProperties,
  errorBar: { marginBottom: SECTION_GAP, padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.82rem', color: colors.accent.error, background: colors.accent.errorBg, border: '1px solid rgba(248,113,113,0.25)' } as CSSProperties,

  // ── Leaderboard ──
  memberList: { display: 'flex', flexDirection: 'column', gap: '1.1rem' } as CSSProperties,
  memberBlock: { minWidth: 0 } as CSSProperties,
  memberBtn: {
    display: 'grid',
    gridTemplateColumns: 'auto auto minmax(0, 1fr) auto auto',
    alignItems: 'center', gap: '0.7rem', width: '100%',
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '0.3rem 0.35rem', borderRadius: 8, textAlign: 'left', fontFamily: 'inherit',
  } as CSSProperties,
  rankBadge: (isTop: boolean): CSSProperties => ({
    width: 22, height: 22, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.65rem', fontWeight: 700,
    background: isTop ? CHAMP : 'rgba(255,255,255,0.06)',
    color: isTop ? '#000' : colors.text.muted,
  }),
  avatar: { borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' } as CSSProperties,
  avatarFallback: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', color: colors.text.muted, fontWeight: 600 } as CSSProperties,
  memberIdentity: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 } as CSSProperties,
  memberNameRow: { display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flexWrap: 'wrap' } as CSSProperties,
  memberName: { fontSize: '0.88rem', fontWeight: 500, color: colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  memberSub: { fontSize: '0.68rem', color: colors.text.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  inactiveTag: { fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.text.muted, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' } as CSSProperties,
  memberCount: { fontSize: '0.95rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  chevron: { fontSize: '0.8rem', color: colors.text.faint, transition: 'transform .2s ease', lineHeight: 1 } as CSSProperties,

  barTrack: { height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: '0.55rem' } as CSSProperties,
  barFill: { height: '100%', borderRadius: 999 } as CSSProperties,

  detailPanel: { marginTop: '1rem', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 } as CSSProperties,
  detailStats: { display: 'flex', gap: '1.75rem', flexWrap: 'wrap' } as CSSProperties,
  detailNum: { fontSize: '1.15rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  detailLbl: { fontSize: '0.65rem', color: colors.text.faint, marginTop: 3 } as CSSProperties,
  detailHead: { fontSize: '0.63rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.text.muted, marginTop: '1.25rem', marginBottom: '0.6rem' } as CSSProperties,

  linkList: { display: 'flex', flexDirection: 'column' } as CSSProperties,
  linkChartList: { display: 'flex', flexDirection: 'column', gap: '1rem' } as CSSProperties,
  linkBlock: { minWidth: 0 } as CSSProperties,
  linkTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' } as CSSProperties,
  linkRow: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.045)' } as CSSProperties,
  linkLabel: { fontSize: '0.82rem', color: colors.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 } as CSSProperties,
  linkCount: { fontSize: '0.82rem', fontWeight: 600, color: colors.text.primary, fontVariantNumeric: 'tabular-nums', flexShrink: 0 } as CSSProperties,
}
