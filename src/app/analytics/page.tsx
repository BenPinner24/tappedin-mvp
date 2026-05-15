'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
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

type TopLink = {
  label: string
  url: string | null
  clicks: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function buildBarData(events: TapEvent[]): number[] {
  const bars = Array(12).fill(0)
  const now  = Date.now()
  events.forEach((e) => {
    const daysAgo = Math.floor((now - new Date(e.tapped_at).getTime()) / 86400000)
    if (daysAgo < 12) bars[11 - daysAgo]++
  })
  return bars
}

function buildTopLinks(linkEvents: TapEvent[]): TopLink[] {
  const map = new Map<string, TopLink>()
  linkEvents.forEach((e) => {
    const label = e.link_label || 'Unknown link'
    if (map.has(label)) {
      map.get(label)!.clicks++
    } else {
      map.set(label, { label, url: e.destination_url, clicks: 1 })
    }
  })
  return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [allEvents,   setAllEvents]   = useState<TapEvent[]>([])
  const [cardTaps,    setCardTaps]    = useState(0)
  const [linkClicks,  setLinkClicks]  = useState(0)
  const [topLinks,    setTopLinks]    = useState<TopLink[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)

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

      if (!data) return

      const taps  = data.filter((e) => e.event_type === 'card_tap')
      const links = data.filter((e) => e.event_type === 'link_click')

      setAllEvents(data)
      setCardTaps(taps.length)
      setLinkClicks(links.length)
      setTopLinks(buildTopLinks(links))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadAnalytics(false) }, [loadAnalytics])

  // Derived stats
  const tapEvents  = allEvents.filter((e) => e.event_type === 'card_tap')
  const linkEvents = allEvents.filter((e) => e.event_type === 'link_click')
  const recentAll  = [...allEvents].sort(
    (a, b) => new Date(b.tapped_at).getTime() - new Date(a.tapped_at).getTime()
  ).slice(0, 25)

  const lastTap    = tapEvents[0]?.tapped_at ?? null
  const todayTaps  = tapEvents.filter((e) => {
    const d = new Date(e.tapped_at), now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  }).length

  const ctr        = cardTaps > 0 ? Math.round((linkClicks / cardTaps) * 100) : 0
  const tapBarData = buildBarData(tapEvents)
  const tapBarMax  = Math.max(...tapBarData, 1)
  const topLink    = topLinks[0]

  return (
    <main style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${colors.bg.page}; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity:.35; } 50% { opacity:.7; } }

        .ti-back-btn:hover    { background: #e4e4e4 !important; transform: translateY(-1px); }
        .ti-refresh-btn:hover { background: rgba(255,255,255,0.07) !important; border-color: ${colors.border.default} !important; }
        .ti-stat-card:hover   { border-color: ${colors.border.default} !important; transform: translateY(-2px); }
        .ti-link-row:hover    { background: ${colors.white[5]} !important; }

        @media (max-width: 900px) {
          .ti-header  { flex-direction: column !important; align-items: flex-start !important; }
          .ti-stats   { grid-template-columns: 1fr 1fr !important; }
          .ti-content { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .ti-wrap        { padding: 2rem 1rem !important; }
          .ti-stats       { grid-template-columns: 1fr !important; }
          .ti-title       { font-size: ${font.size['3xl']} !important; }
          .ti-bar-label   { display: none !important; }
          .ti-event-right { display: none !important; }
          .ti-header-btns { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>

      <div style={s.wrap} className="ti-wrap">

        {/* ── HEADER ── */}
        <div style={s.header} className="ti-header">
          <div style={s.headerLeft}>
            <p style={s.eyebrow}>Analytics</p>
            <h1 style={s.title} className="ti-title">Performance insights</h1>
            <p style={s.subtitle}>
              NFC tap history, link clicks, and real engagement for your digital profile.
            </p>
          </div>
          <div style={s.headerBtns} className="ti-header-btns">
            <button
              onClick={() => loadAnalytics(true)}
              disabled={refreshing || loading}
              className="ti-refresh-btn"
              style={{
                ...s.refreshBtn,
                opacity: refreshing || loading ? 0.55 : 1,
                cursor:  refreshing || loading ? 'not-allowed' : 'pointer',
              }}
            >
              {refreshing ? (
                <>
                  <span style={s.refreshSpinner} />
                  Refreshing…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 8A6 6 0 1 1 8 2"/>
                    <path d="M14 2v4h-4"/>
                  </svg>
                  Refresh insights
                </>
              )}
            </button>
            <Link href="/dashboard" className="ti-back-btn" style={s.backBtn}>
              ← Back to dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.spinner} />
          </div>
        ) : (
          <>
            {/* ── STAT CARDS ── */}
            <div style={s.statsGrid} className="ti-stats">

              <div style={s.statCard} className="ti-stat-card">
                <div style={s.statTop}>
                  <p style={s.statLabel}>Total NFC taps</p>
                  <div style={s.statIconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke={colors.accent.success} strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M5 12c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke={colors.accent.success} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
                      <circle cx="12" cy="12" r="1.5" fill={colors.accent.success}/>
                    </svg>
                  </div>
                </div>
                <div style={s.statNum}>{cardTaps}</div>
                <p style={s.statSub}>
                  {lastTap ? `Last tap ${formatRelativeTime(lastTap)}` : 'No taps yet'}
                </p>
              </div>

              <div style={s.statCard} className="ti-stat-card">
                <div style={s.statTop}>
                  <p style={s.statLabel}>Link clicks</p>
                  <div style={s.statIconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={colors.accent.success} strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={colors.accent.success} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div style={s.statNum}>{linkClicks}</div>
                <p style={s.statSub}>
                  {topLink ? `Top: ${topLink.label}` : 'No clicks yet'}
                </p>
              </div>

              <div style={s.statCard} className="ti-stat-card">
                <div style={s.statTop}>
                  <p style={s.statLabel}>Taps today</p>
                  <div style={s.statIconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="17" rx="2" stroke={colors.text.muted} strokeWidth="1.4"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke={colors.text.muted} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div style={s.statNum}>{todayTaps}</div>
                <p style={s.statSub}>Today&apos;s NFC engagement</p>
              </div>

              <div style={s.statCard} className="ti-stat-card">
                <div style={s.statTop}>
                  <p style={s.statLabel}>Tap-to-click rate</p>
                  <div style={s.statIconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={colors.text.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div style={{ ...s.statNum, color: ctr > 0 ? colors.text.primary : colors.text.muted }}>
                  {ctr}%
                </div>
                <p style={s.statSub}>Link clicks ÷ NFC taps</p>
              </div>

            </div>

            {/* ── CONTENT GRID ── */}
            <div style={s.contentGrid} className="ti-content">

              <div style={s.panel}>
                <div style={s.panelHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>Last 12 days</p>
                    <h3 style={s.sectionTitle}>Tap frequency</h3>
                  </div>
                  <div style={s.liveIndicator}>
                    <span style={s.liveDot} />
                    <span style={s.liveLabel}>Live</span>
                  </div>
                </div>

                {cardTaps === 0 ? (
                  <EmptyState
                    icon={<NfcIcon faint />}
                    title="No taps yet"
                    body="Tap activity will appear here once your card is used."
                  />
                ) : (
                  <>
                    <div style={s.chartArea}>
                      {tapBarData.map((val, i) => {
                        const pct     = Math.max((val / tapBarMax) * 100, 0)
                        const isToday = i === 11
                        return (
                          <div key={i} style={s.barCol}>
                            <div style={s.barTrack}>
                              <div style={{
                                ...s.barFill,
                                height: `${pct}%`,
                                background: isToday
                                  ? `linear-gradient(180deg, ${colors.accent.success} 0%, rgba(74,222,128,0.25) 100%)`
                                  : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)',
                                opacity: pct === 0 ? 0.07 : 1,
                              }} />
                            </div>
                            <span style={s.barLabel} className="ti-bar-label">
                              {i === 11 ? 'Today' : `${11 - i}d`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div style={s.chartLegend}>
                      <span style={s.legendDot} />
                      <span style={s.legendText}>NFC taps per day</span>
                      <span style={{ ...s.legendDot, background: colors.accent.success }} />
                      <span style={s.legendText}>Today</span>
                    </div>
                  </>
                )}
              </div>

              <div style={s.panel}>
                <div style={s.panelHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>By clicks</p>
                    <h3 style={s.sectionTitle}>Top links</h3>
                  </div>
                  {linkClicks > 0 && (
                    <div style={s.totalPill}>{linkClicks} clicks</div>
                  )}
                </div>

                {topLinks.length === 0 ? (
                  <EmptyState
                    icon={<LinkIcon faint />}
                    title="No link clicks yet"
                    body="Click data will appear here as visitors tap your card and interact with your profile links."
                  />
                ) : (
                  <div style={s.topLinksList}>
                    {topLinks.slice(0, 6).map((link, i) => {
                      const pct = Math.round((link.clicks / linkClicks) * 100)
                      return (
                        <div key={link.label} className="ti-link-row" style={s.topLinkRow}>
                          <div style={s.topLinkLeft}>
                            <div style={s.topLinkRank}>{i + 1}</div>
                            <div style={s.topLinkMeta}>
                              <p style={s.topLinkLabel}>{link.label}</p>
                              {link.url && (
                                <p style={s.topLinkUrl}>
                                  {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={s.topLinkRight}>
                            <span style={s.topLinkClicks}>{link.clicks}</span>
                            <div style={s.topLinkBarTrack}>
                              <div style={{ ...s.topLinkBar, width: `${pct}%` }} />
                            </div>
                            <span style={s.topLinkPct}>{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* ── ACTIVITY TIMELINE ── */}
            <div style={s.timelinePanel}>
              <div style={s.panelHeader}>
                <div>
                  <p style={s.sectionEyebrow}>Live activity</p>
                  <h3 style={s.sectionTitle}>Recent activity</h3>
                </div>
                {recentAll.length > 0 && (
                  <div style={s.totalPill}>{allEvents.length} events</div>
                )}
              </div>

              {recentAll.length === 0 ? (
                <div style={{ ...s.emptyState, padding: `${spacing[10]} ${spacing[4]}` }}>
                  <NfcIcon faint />
                  <p style={{ ...s.emptyTitle, marginTop: spacing[3] }}>No activity yet</p>
                  <p style={s.emptyBody}>
                    NFC taps and link clicks will appear here as your card gets used.
                  </p>
                </div>
              ) : (
                <div style={s.eventsList}>
                  {recentAll.map((event, i) => {
                    const isTap   = event.event_type === 'card_tap'
                    const isLink  = event.event_type === 'link_click'
                    const isFirst = i === 0

                    return (
                      <div key={event.id} style={{
                        ...s.eventRow,
                        animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.03}s both`,
                      }}>
                        <div style={s.timelineDotWrap}>
                          <div style={{
                            ...s.timelineDot,
                            background: isFirst
                              ? colors.accent.success
                              : isLink
                              ? colors.border.strong
                              : colors.border.default,
                            boxShadow: isFirst ? `0 0 8px ${colors.accent.success}` : 'none',
                          }} />
                          {i < recentAll.length - 1 && <div style={s.timelineLine} />}
                        </div>

                        <div style={s.eventContent}>
                          <div style={s.eventLeft}>
                            <div style={{
                              ...s.eventIconWrap,
                              borderColor: isLink ? colors.border.default : colors.border.subtle,
                            }}>
                              {isTap  && <NfcIcon />}
                              {isLink && <LinkIcon />}
                            </div>
                            <div>
                              <p style={s.eventTitle}>
                                {isTap  ? 'NFC card tapped' : ''}
                                {isLink ? (event.link_label ?? 'Link clicked') : ''}
                              </p>
                              <p style={s.eventSub}>
                                {isTap  && event.card_code ? event.card_code : ''}
                                {isLink && event.destination_url
                                  ? event.destination_url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 45)
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div style={s.eventRight} className="ti-event-right">
                            <p style={s.eventDate}>{formatDate(event.tapped_at)}</p>
                            <p style={s.eventTime}>{formatTime(event.tapped_at)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {allEvents.length > 25 && (
                    <div style={s.moreRow}>
                      <span style={s.moreText}>+{allEvents.length - 25} older events</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── FOOTER BRAND ── */}
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

// ─── Icon components ──────────────────────────────────────────────────────────

function NfcIcon({ faint }: { faint?: boolean }) {
  const c = faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)'
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke={faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill={c}/>
    </svg>
  )
}

function LinkIcon({ faint }: { faint?: boolean }) {
  const c = faint ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)'
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: colors.bg.page,
    color: colors.text.primary,
    fontFamily: font.sans,
    WebkitFontSmoothing: 'antialiased',
  },

  wrap: {
    maxWidth: layout.maxWidth['3xl'],
    margin: '0 auto',
    padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2.25rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
  },

  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[20],
  },

  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: radius.full,
    border: `1.5px solid ${colors.white[5]}`,
    borderTop: `1.5px solid ${colors.white[50]}`,
    animation: 'spin 0.75s linear infinite',
  },

  // ── Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[6],
    flexWrap: 'wrap',
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    flex: 1,
  },

  headerBtns: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexShrink: 0,
    flexWrap: 'wrap',
  },

  eyebrow: {
    ...text.eyebrow,
    fontSize: font.size.xs,
    letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.25)',
  },

  title: {
    fontFamily: font.sans,
    fontSize: `clamp(${font.size['3xl']}, 5vw, ${font.size['5xl']})`,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: font.leading.tight,
  },

  subtitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.light,
    color: colors.text.muted,
    lineHeight: font.leading.relaxed,
    maxWidth: '500px',
  },

  backBtn: {
    ...buttons.ghost,
    fontSize: font.size.sm,
    padding: `${spacing[3]} ${spacing[5]}`,
    transition: transitions.button,
    flexShrink: 0,
  },

  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: radius.full,
    border: borders.subtle,
    background: 'rgba(255,255,255,0.04)',
    color: colors.text.muted,
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.01em',
    transition: transitions.button,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },

  refreshSpinner: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderTop: `1.5px solid ${colors.text.muted}`,
    animation: 'spin 0.75s linear infinite',
    flexShrink: 0,
  } as CSSProperties,

  // ── Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: spacing[4],
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
  },

  statCard: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    boxShadow: shadows.panel,
    transition: `transform 0.2s ease, border-color ${transitions.smooth}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    cursor: 'default',
  },

  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statLabel: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.28)',
  },

  statIconWrap: {
    width: '28px',
    height: '28px',
    borderRadius: radius.sm,
    background: colors.white[3],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  statNum: {
    fontFamily: font.sans,
    fontSize: font.size['4xl'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: 1,
  },

  statSub: {
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.text.muted,
    letterSpacing: font.tracking.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // ── Content grid
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[4],
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both',
  },

  panel: {
    ...cards.panel,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
  },

  timelinePanel: {
    ...cards.panel,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  sectionEyebrow: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: spacing[1],
  },

  sectionTitle: {
    fontFamily: font.sans,
    fontSize: font.size.xl,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    lineHeight: font.leading.snug,
  },

  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },

  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: colors.accent.success,
    boxShadow: `0 0 6px ${colors.accent.success}`,
    animation: 'pulse 2s ease-in-out infinite',
  },

  liveLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.accent.success,
    letterSpacing: font.tracking.wide,
  },

  totalPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: radius.full,
    background: colors.white[3],
    border: borders.subtle,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    letterSpacing: font.tracking.wide,
    flexShrink: 0,
  },

  // ── Bar chart
  chartArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '5px',
    height: '120px',
  },

  barCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[2],
    height: '100%',
    justifyContent: 'flex-end',
  },

  barTrack: {
    width: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: '4px',
  },

  barFill: {
    width: '100%',
    borderRadius: `${radius.sm} ${radius.sm} 2px 2px`,
    minHeight: '4px',
    transition: 'height 0.5s cubic-bezier(0.16,1,0.3,1)',
  },

  barLabel: {
    fontSize: '0.55rem',
    color: 'rgba(255,255,255,0.2)',
    fontWeight: font.weight.medium,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },

  chartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTop: borders.subtle,
  },

  legendDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
    flexShrink: 0,
  },

  legendText: {
    fontSize: font.size.xs,
    color: colors.text.muted,
    fontWeight: font.weight.regular,
    marginRight: spacing[3],
  },

  // ── Top links
  topLinksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  },

  topLinkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[3]}`,
    borderRadius: radius.md,
    transition: `background ${transitions.fast}`,
    cursor: 'default',
  },

  topLinkLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
    overflow: 'hidden',
  },

  topLinkRank: {
    width: '20px',
    height: '20px',
    borderRadius: radius.sm,
    background: colors.white[3],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: font.size['2xs'],
    fontWeight: font.weight.bold,
    color: colors.text.faint,
    flexShrink: 0,
  },

  topLinkMeta: {
    overflow: 'hidden',
    flex: 1,
  },

  topLinkLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  topLinkUrl: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.regular,
    color: colors.text.faint,
    fontFamily: font.mono,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },

  topLinkRight: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    flexShrink: 0,
  },

  topLinkClicks: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    minWidth: '24px',
    textAlign: 'right',
  },

  topLinkBarTrack: {
    width: '60px',
    height: '3px',
    borderRadius: '2px',
    background: colors.white[5],
    overflow: 'hidden',
  },

  topLinkBar: {
    height: '100%',
    borderRadius: '2px',
    background: `linear-gradient(90deg, ${colors.accent.success}, rgba(74,222,128,0.4))`,
    transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
  },

  topLinkPct: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    minWidth: '32px',
    textAlign: 'right',
  },

  // ── Empty states
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: `${spacing[10]} ${spacing[4]}`,
    gap: spacing[2],
    flex: 1,
  },

  emptyIcon: {
    opacity: 0.7,
    marginBottom: spacing[1],
    transform: 'scale(2)',
  },

  emptyTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: font.tracking.snug,
  },

  emptyBody: {
    fontSize: font.size.xs,
    fontWeight: font.weight.light,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    maxWidth: '260px',
  },

  // ── Events timeline
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: spacing[2],
  },

  eventRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[4],
    cursor: 'default',
  },

  timelineDotWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: '16px',
    width: '16px',
  },

  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    zIndex: 1,
  },

  timelineLine: {
    width: '1px',
    flex: 1,
    minHeight: '18px',
    background: colors.border.subtle,
    marginTop: '4px',
  },

  eventContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[4],
    flex: 1,
    padding: `${spacing[3]} 0`,
    borderBottom: borders.subtle,
  },

  eventLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    overflow: 'hidden',
    flex: 1,
  },

  eventIconWrap: {
    width: '28px',
    height: '28px',
    borderRadius: radius.sm,
    background: colors.white[3],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },

  eventTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.normal,
    lineHeight: font.leading.snug,
  },

  eventSub: {
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.text.muted,
    fontFamily: font.mono,
    letterSpacing: font.tracking.wide,
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '340px',
  },

  eventRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    flexShrink: 0,
  },

  eventDate: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    whiteSpace: 'nowrap',
  },

  eventTime: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.regular,
    color: colors.text.faint,
    fontFamily: font.mono,
  },

  moreRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: `${spacing[4]} 0 ${spacing[2]}`,
  },

  moreText: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    letterSpacing: font.tracking.wide,
  },

  // ── Footer brand
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: `${spacing[4]} 0 ${spacing[2]}`,
  },

  footerLogo: {
    fontFamily: font.mono,
    fontSize: '0.58rem',
    fontWeight: font.weight.bold,
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.12)',
  },

  footerSlogan: {
    fontFamily: font.sans,
    fontSize: font.size['2xs'],
    fontWeight: font.weight.light,
    color: 'rgba(255,255,255,0.1)',
    letterSpacing: font.tracking.wide,
    fontStyle: 'italic',
  },
}