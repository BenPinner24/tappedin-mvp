'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  colors, font, radius, spacing,
  text, inputs, cards, buttons, layout, keyframes,
} from '@/lib/design'

type ViewState = 'loading' | 'need-login' | 'not-enabled' | 'create' | 'dashboard'
type RangeDays = 7 | 30 | 90
type Member = { user_id: string; member_name: string; member_email: string; role: string; card_id: string | null }

type Analytics = {
  days_back: number
  summary: { taps_this: number; taps_prev: number; taps_all: number; active_members: number } | null
  daily: { day: string; taps: number }[]
  by_member: { user_id: string; name: string; taps: number; last_active: string | null }[]
  by_weekday: { weekday: number; taps: number }[]
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  useEffect(() => {
    startRef.current = null
    let raf = 0
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function isInactive(iso: string | null, days: number): boolean {
  if (!iso) return true
  return Date.now() - new Date(iso).getTime() > days * 86400000
}

export default function TeamsPage() {
  const supabase = createClient()

  const [view, setView] = useState<ViewState>('loading')
  const [companyName, setCompanyName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [myCompanyName, setMyCompanyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [range, setRange] = useState<RangeDays>(30)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [copied, setCopied] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [unassigned, setUnassigned] = useState<string[]>([])
  const [assignChoice, setAssignChoice] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const loadDashboardData = useCallback(async (days: RangeDays) => {
    const [{ data: analyticsData }, { data: mem }, { data: pool }] = await Promise.all([
      supabase.rpc('get_company_analytics', { days_back: days }),
      supabase.rpc('get_team_members'),
      supabase.rpc('get_unassigned_cards'),
    ])
    setAnalytics((analyticsData as Analytics) ?? null)
    setMembers((mem as Member[]) ?? [])
    setUnassigned(((pool as { card_id: string }[]) ?? []).map((c) => c.card_id))
  }, [supabase])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) { setView('need-login'); return }

      const { data: membership } = await supabase
        .from('company_members').select('company_id, role')
        .eq('user_id', user.id).maybeSingle()
      if (!active) return

      if (membership) {
        const { data: company } = await supabase
          .from('companies').select('name, join_code').eq('id', membership.company_id).maybeSingle()
        if (!active) return
        setMyCompanyName(company?.name ?? 'Your company')
        setJoinCode(company?.join_code ?? '')
        await loadDashboardData(30)
        if (!active) return
        setView('dashboard')
        return
      }

      const { data: billing } = await supabase
        .from('user_billing').select('company_enabled')
        .eq('user_id', user.id).maybeSingle()
      if (!active) return
      setView(billing?.company_enabled ? 'create' : 'not-enabled')
    })()
    return () => { active = false }
  }, [supabase, loadDashboardData])

  // Reload analytics when range changes (dashboard only)
  const changeRange = async (days: RangeDays) => {
    setRange(days)
    await loadDashboardData(days)
  }

  async function handleCreate() {
    setError(null)
    const name = companyName.trim()
    if (name.length < 2) { setError('Please enter a company name.'); return }
    setSubmitting(true)
    const { error: rpcError } = await supabase.rpc('create_company', { company_name: name })
    setSubmitting(false)
    if (rpcError) {
      setError(rpcError.message === 'company_not_enabled'
        ? 'Your account is not enabled for company features yet.'
        : (rpcError.message || 'Something went wrong.'))
      return
    }
    window.location.reload()
  }

  const joinLink = typeof window !== 'undefined' ? `${window.location.origin}/join/${joinCode}` : ''

  async function copyLink() {
    try { await navigator.clipboard.writeText(joinLink); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  async function handleAssign(userId: string) {
    const cardId = assignChoice[userId]
    if (!cardId) return
    setBusy(userId); setActionMsg(null)
    const { error: rpcError } = await supabase.rpc('assign_card', { target_card_id: cardId, target_user_id: userId })
    setBusy(null)
    if (rpcError) { setActionMsg(rpcError.message || 'Could not assign card.'); return }
    await loadDashboardData(range)
    setAssignChoice((prev) => { const n = { ...prev }; delete n[userId]; return n })
  }

  async function handleUnassign(cardId: string) {
    setBusy(cardId); setActionMsg(null)
    const { error: rpcError } = await supabase.rpc('unassign_card', { target_card_id: cardId })
    setBusy(null)
    if (rpcError) { setActionMsg(rpcError.message || 'Could not unassign card.'); return }
    await loadDashboardData(range)
  }

  // ─── Derived analytics values ───────────────────────────────────────────────
  const summary = analytics?.summary
  const tapsThis = Number(summary?.taps_this ?? 0)
  const tapsPrev = Number(summary?.taps_prev ?? 0)
  const tapsAll = Number(summary?.taps_all ?? 0)
  const activeMembers = Number(summary?.active_members ?? 0)

  const daily = analytics?.daily ?? []
  const byMember = analytics?.by_member ?? []
  const byWeekday = analytics?.by_weekday ?? []

  const teamMembers = members.filter((m) => m.role === 'employee')
  const avgPerMember = teamMembers.length > 0 ? Math.round(tapsThis / teamMembers.length) : 0

  // Growth vs previous period
  const growthPct = tapsPrev > 0
    ? Math.round(((tapsThis - tapsPrev) / tapsPrev) * 100)
    : (tapsThis > 0 ? 100 : 0)
  const growthPositive = tapsThis >= tapsPrev

  // Peak day of week
  const peakWeekday = byWeekday.length > 0
    ? byWeekday.reduce((a, b) => (Number(b.taps) > Number(a.taps) ? b : a))
    : null

  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.taps)))
  const maxWeekday = Math.max(1, ...byWeekday.map((d) => Number(d.taps)))
  const maxMemberTaps = Math.max(1, ...byMember.map((m) => Number(m.taps)))

  const animatedTotal = useCountUp(tapsThis)

  const rangeLabel = range === 7 ? 'last 7 days' : range === 30 ? 'last 30 days' : 'last 90 days'

  return (
    <>
      <style>{keyframes.base + extraCss}</style>
      <main style={pageStyle}>
        <div style={bgGrid} />
        <div style={shell}>

          <div style={brandRow}><span style={text.brandMark}>TAPPED-IN</span></div>

          {view === 'loading' && <div style={cards.glass}><p style={text.bodyMuted}>Loading…</p></div>}

          {view === 'need-login' && (
            <div style={{ ...cards.glass, textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
              <h1 style={{ ...text.heading, marginBottom: spacing['3'] }}>Teams</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>Log in to manage your company.</p>
              <Link href="/login" style={buttons.primary}>Log in</Link>
            </div>
          )}

          {view === 'not-enabled' && (
            <div style={{ ...cards.glass, textAlign: 'center', maxWidth: 420, margin: '0 auto', animation: 'ti-riseUp 0.6s ease both' }}>
              <p style={{ ...text.eyebrow, marginBottom: spacing['3'] }}>Company package</p>
              <h1 style={{ ...text.heading, marginBottom: spacing['4'] }}>Cards for your whole team</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>
                Equip your team with premium NFC cards, all branded to your company, and see how they perform from one dashboard.
              </p>
              <a href="mailto:contact@tappedin.uk?subject=Company%20package%20enquiry" style={{ ...buttons.primary, width: '100%' }}>
                Enquire about the company package
              </a>
            </div>
          )}

          {view === 'create' && (
            <div style={{ ...cards.glass, maxWidth: 420, margin: '0 auto', animation: 'ti-riseUp 0.6s ease both' }}>
              <p style={{ ...text.eyebrow, marginBottom: spacing['3'] }}>Create your company</p>
              <h1 style={{ ...text.heading, marginBottom: spacing['3'] }}>Set up your team</h1>
              <p style={{ ...text.body, marginBottom: spacing['8'] }}>
                Create a company to manage cards for your team and see how they perform.
              </p>
              <div style={inputs.group}>
                <label style={inputs.label} htmlFor="companyName">Company name</label>
                <input id="companyName" type="text" value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Ltd" style={inputs.base} disabled={submitting} />
              </div>
              {error && <p style={{ ...text.caption, color: colors.accent.error, marginTop: spacing['3'] }}>{error}</p>}
              <button onClick={handleCreate} disabled={submitting}
                style={{ ...buttons.primary, width: '100%', marginTop: spacing['6'], opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Creating…' : 'Create company'}
              </button>
            </div>
          )}

          {view === 'dashboard' && (
            <div style={{ width: '100%', animation: 'ti-riseUp 0.6s ease both' }}>

              {/* ─── Header ─── */}
              <div style={headerRow}>
                <div>
                  <p style={text.eyebrow}>{myCompanyName}</p>
                  <h1 style={{ ...text.heading, marginTop: spacing['2'] }}>Team dashboard</h1>
                </div>
                <div style={toggleWrap}>
                  {([7, 30, 90] as RangeDays[]).map((d) => (
                    <button key={d} onClick={() => changeRange(d)} style={range === d ? toggleActive : toggleInactive}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Summary stat cards ─── */}
              <div className="ti-stat-grid" style={statGrid}>
                <div style={statCard}>
                  <p style={statLabel}>Total taps</p>
                  <div style={statValueRow}>
                    <span style={statValue}>{animatedTotal}</span>
                    {(tapsThis > 0 || tapsPrev > 0) && (
                      <span style={{ ...growthPill, color: growthPositive ? colors.accent.success : colors.accent.error, background: growthPositive ? colors.accent.successBg : colors.accent.errorBg }}>
                        {growthPositive ? '▲' : '▼'} {Math.abs(growthPct)}%
                      </span>
                    )}
                  </div>
                  <p style={statSub}>{rangeLabel}</p>
                </div>

                <div style={statCard}>
                  <p style={statLabel}>Active members</p>
                  <div style={statValueRow}><span style={statValue}>{activeMembers}</span></div>
                  <p style={statSub}>of {teamMembers.length} total</p>
                </div>

                <div style={statCard}>
                  <p style={statLabel}>Avg / member</p>
                  <div style={statValueRow}><span style={statValue}>{avgPerMember}</span></div>
                  <p style={statSub}>taps each</p>
                </div>

                <div style={statCard}>
                  <p style={statLabel}>All-time taps</p>
                  <div style={statValueRow}><span style={statValue}>{tapsAll}</span></div>
                  <p style={statSub}>since launch</p>
                </div>
              </div>

              {/* ─── Daily taps bar chart ─── */}
              <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
                <div style={sectionHead}>
                  <p style={text.eyebrow}>Taps over time</p>
                  <span style={{ ...text.caption }}>{rangeLabel}</span>
                </div>
                {daily.length === 0 ? (
                  <div style={emptyState}>
                    <p style={text.bodyMuted}>No taps in this period yet.</p>
                    <p style={{ ...text.caption, marginTop: spacing['1'] }}>Activity will appear here as your team&apos;s cards are tapped.</p>
                  </div>
                ) : (
                  <div style={chartWrap}>
                    <div style={chartBars}>
                      {daily.map((d, i) => {
                        const pct = Math.round((Number(d.taps) / maxDaily) * 100)
                        const label = new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        return (
                          <div key={d.day} style={chartCol} title={`${label}: ${d.taps} taps`}>
                            <div style={chartBarTrack}>
                              <div className="ti-cbar" style={{ ...chartBar, height: `${pct}%`, animationDelay: `${i * 0.03}s` }} />
                            </div>
                            <span style={chartCount}>{d.taps}</span>
                          </div>
                        )
                      })}
                    </div>
                    {daily.length <= 14 && (
                      <div style={chartLabels}>
                        {daily.map((d) => (
                          <span key={d.day} style={chartLabel}>
                            {new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Peak day + weekday pattern ─── */}
              <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
                <div style={sectionHead}>
                  <p style={text.eyebrow}>Engagement by day</p>
                  {peakWeekday && Number(peakWeekday.taps) > 0 && (
                    <span style={peakPill}>Peak: {WEEKDAY_LABELS[peakWeekday.weekday]}</span>
                  )}
                </div>
                {byWeekday.length === 0 ? (
                  <div style={emptyState}><p style={text.bodyMuted}>Not enough data to show day patterns yet.</p></div>
                ) : (
                  <div style={weekdayGrid}>
                    {[0, 1, 2, 3, 4, 5, 6].map((wd) => {
                      const entry = byWeekday.find((d) => d.weekday === wd)
                      const taps = entry ? Number(entry.taps) : 0
                      const pct = Math.round((taps / maxWeekday) * 100)
                      const isPeak = peakWeekday?.weekday === wd && taps > 0
                      return (
                        <div key={wd} style={weekdayCol}>
                          <div style={weekdayBarTrack}>
                            <div className="ti-cbar" style={{
                              ...weekdayBar,
                              height: `${Math.max(pct, taps > 0 ? 8 : 0)}%`,
                              background: isPeak ? colors.white.full : colors.white['30'],
                            }} />
                          </div>
                          <span style={{ ...weekdayLabel, color: isPeak ? colors.text.primary : colors.text.faint }}>
                            {WEEKDAY_LABELS[wd][0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ─── Team leaderboard ─── */}
              <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
                <div style={sectionHead}>
                  <p style={text.eyebrow}>Team leaderboard</p>
                  <span style={{ ...text.caption }}>{rangeLabel}</span>
                </div>
                {byMember.length === 0 ? (
                  <div style={emptyState}><p style={text.bodyMuted}>No team members with activity yet.</p></div>
                ) : (
                  byMember.map((m, i) => {
                    const taps = Number(m.taps)
                    const pct = Math.round((taps / maxMemberTaps) * 100)
                    const inactive = isInactive(m.last_active, range)
                    return (
                      <div key={m.user_id} style={{ ...leaderRow, animation: `ti-riseUp 0.5s ease ${i * 0.06}s both` }}>
                        <div style={leaderTop}>
                          <span style={leaderName}>
                            <span style={{ ...rankBadge, background: i === 0 && taps > 0 ? colors.white.full : colors.white['5'], color: i === 0 && taps > 0 ? '#000' : colors.text.muted }}>{i + 1}</span>
                            {m.name}
                            {inactive && taps === 0 && (
                              <span style={inactiveTag}>Inactive</span>
                            )}
                          </span>
                          <span style={leaderCount}>{taps}</span>
                        </div>
                        <div style={barTrack}>
                          <div className="ti-bar" style={{ ...barFill, width: `${pct}%`, animationDelay: `${i * 0.06 + 0.2}s` }} />
                        </div>
                        <div style={leaderMeta}>
                          <span style={{ ...text.caption, color: inactive ? colors.accent.warning : colors.text.muted }}>
                            Last active: {timeAgo(m.last_active)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* ─── Manage team members (assign/unassign) ─── */}
              <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing['5'] }}>
                  <p style={text.eyebrow}>Manage cards</p>
                  <span style={{ ...text.caption, color: colors.text.muted }}>
                    {unassigned.length} spare card{unassigned.length === 1 ? '' : 's'}
                  </span>
                </div>

                {teamMembers.length === 0 && (
                  <p style={text.bodyMuted}>No team members yet. Share your invite link below.</p>
                )}

                {teamMembers.map((m) => (
                  <div key={m.user_id} style={memberRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...rowName, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.member_name !== 'Unnamed' ? m.member_name : m.member_email}
                      </div>
                      {m.card_id ? (
                        <div style={{ ...text.caption, fontFamily: font.mono, color: colors.text.muted, marginTop: '2px' }}>{m.card_id}</div>
                      ) : (
                        <div style={{ ...text.caption, color: colors.accent.warning, marginTop: '2px' }}>No card assigned</div>
                      )}
                    </div>

                    {m.card_id ? (
                      <button
                        onClick={() => handleUnassign(m.card_id!)}
                        disabled={busy === m.card_id}
                        style={{ ...buttons.ghost, padding: '0.45rem 0.9rem', fontSize: font.size.sm, flexShrink: 0 }}
                      >
                        {busy === m.card_id ? 'Removing…' : 'Unassign'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: spacing['2'], flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          value={assignChoice[m.user_id] ?? ''}
                          onChange={(e) => setAssignChoice((prev) => ({ ...prev, [m.user_id]: e.target.value }))}
                          style={{ ...inputs.base, width: 'auto', minWidth: '130px', padding: '0.45rem 0.7rem', fontSize: font.size.sm }}
                          disabled={unassigned.length === 0}
                        >
                          <option value="">{unassigned.length === 0 ? 'No spare cards' : 'Choose card…'}</option>
                          {unassigned.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => handleAssign(m.user_id)}
                          disabled={!assignChoice[m.user_id] || busy === m.user_id}
                          style={{ ...buttons.primary, padding: '0.45rem 0.9rem', fontSize: font.size.sm, opacity: (!assignChoice[m.user_id] || busy === m.user_id) ? 0.5 : 1 }}
                        >
                          {busy === m.user_id ? 'Assigning…' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {unassigned.length > 0 && (
                  <div style={{ marginTop: spacing['4'], paddingTop: spacing['4'], borderTop: `1px solid ${colors.border.subtle}` }}>
                    <p style={{ ...text.caption, color: colors.text.muted }}>
                      Spare cards ready to assign: <span style={{ fontFamily: font.mono, color: colors.text.secondary }}>{unassigned.join(', ')}</span>
                    </p>
                  </div>
                )}

                {actionMsg && <p style={{ ...text.caption, color: colors.accent.error, marginTop: spacing['3'] }}>{actionMsg}</p>}
              </div>

              {/* ─── Invite your team ─── */}
              <div style={{ ...cards.glass, marginTop: spacing['5'] }}>
                <p style={{ ...text.eyebrow, marginBottom: spacing['3'] }}>Invite your team</p>
                <p style={{ ...text.body, marginBottom: spacing['5'] }}>
                  Share this link or code with your team. When they join, you can assign them a card above.
                </p>
                <div style={inviteCodeBox}>
                  <span style={inviteCodeLabel}>Join code</span>
                  <span style={inviteCode}>{joinCode}</span>
                </div>
                <div style={inviteLinkRow}>
                  <span style={inviteLinkText}>{joinLink}</span>
                  <button onClick={copyLink} style={copied ? copyBtnDone : copyBtn}>{copied ? 'Copied' : 'Copy link'}</button>
                </div>
              </div>

              <div style={{ marginTop: spacing['6'], textAlign: 'center' }}>
                <Link href="/dashboard" style={buttons.ghost}>Back to dashboard</Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

const extraCss = `
  @keyframes ti-barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes ti-barRise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  .ti-bar { transform-origin: left; animation: ti-barGrow 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .ti-cbar { transform-origin: bottom; animation: ti-barRise 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  select option { background-color: #141414; color: #ffffff; }

  /* Stat cards: 4-across on desktop, 2×2 on mobile */
  @media (max-width: 640px) {
    .ti-stat-grid { grid-template-columns: 1fr 1fr !important; }
  }
`

const pageStyle: CSSProperties = {
  minHeight: '100vh', background: colors.bg.page, color: colors.text.primary,
  fontFamily: font.sans, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden',
}
const bgGrid: CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
  backgroundSize: '56px 56px',
  WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',
  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',
  pointerEvents: 'none', zIndex: 0,
}
const shell: CSSProperties = { width: '100%', maxWidth: layout.maxWidth.lg, position: 'relative', zIndex: 1 }
const brandRow: CSSProperties = { textAlign: 'center', marginBottom: spacing['8'] }
const headerRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing['6'], gap: spacing['4'], flexWrap: 'wrap' }

const toggleWrap: CSSProperties = { display: 'flex', gap: '4px', background: colors.white['3'], borderRadius: radius.full, padding: '4px' }
const toggleBase: CSSProperties = { border: 'none', cursor: 'pointer', padding: '0.4rem 0.85rem', borderRadius: radius.full, fontFamily: font.sans, fontSize: font.size.sm, fontWeight: font.weight.semibold, transition: 'all 0.2s ease' }
const toggleActive: CSSProperties = { ...toggleBase, background: colors.white.full, color: '#000' }
const toggleInactive: CSSProperties = { ...toggleBase, background: 'transparent', color: colors.text.muted }

// Summary stat cards
const statGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing['3'] }
const statCard: CSSProperties = { background: colors.bg.surface, border: `1px solid ${colors.border.subtle}`, borderRadius: radius['2xl'], padding: '1.25rem 1.35rem', boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset' }
const statLabel: CSSProperties = { ...text.eyebrow, fontSize: font.size['2xs'], marginBottom: spacing['2'] }
const statValueRow: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: spacing['2'], flexWrap: 'wrap' }
const statValue: CSSProperties = { fontFamily: font.sans, fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }
const growthPill: CSSProperties = { fontSize: font.size['2xs'], fontWeight: font.weight.bold, padding: '2px 7px', borderRadius: radius.full, letterSpacing: '0.02em' }
const statSub: CSSProperties = { ...text.caption, color: colors.text.faint, marginTop: spacing['2'] }

const sectionHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['5'] }
const emptyState: CSSProperties = { padding: '1.5rem 0', textAlign: 'center' }

// Daily chart
const chartWrap: CSSProperties = { width: '100%' }
const chartBars: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px' }
const chartCol: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: spacing['2'], minWidth: 0 }
const chartBarTrack: CSSProperties = { width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }
const chartBar: CSSProperties = { width: '100%', maxWidth: '32px', background: 'linear-gradient(180deg, #fff, rgba(255,255,255,0.65))', borderRadius: '4px 4px 2px 2px', minHeight: '2px', boxShadow: '0 0 16px rgba(255,255,255,0.12)' }
const chartCount: CSSProperties = { fontSize: font.size['2xs'], fontWeight: font.weight.bold, color: colors.text.muted, fontVariantNumeric: 'tabular-nums' }
const chartLabels: CSSProperties = { display: 'flex', gap: '4px', marginTop: spacing['2'] }
const chartLabel: CSSProperties = { flex: 1, textAlign: 'center', fontSize: font.size['2xs'], color: colors.text.faint, fontVariantNumeric: 'tabular-nums', minWidth: 0 }

// Weekday
const peakPill: CSSProperties = { fontSize: font.size['2xs'], fontWeight: font.weight.bold, color: colors.text.primary, background: colors.white['5'], border: `1px solid ${colors.border.subtle}`, padding: '3px 10px', borderRadius: radius.full, letterSpacing: '0.04em' }
const weekdayGrid: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: spacing['3'], height: '120px' }
const weekdayCol: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: spacing['2'] }
const weekdayBarTrack: CSSProperties = { width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }
const weekdayBar: CSSProperties = { width: '100%', maxWidth: '40px', borderRadius: '4px 4px 2px 2px', minHeight: '2px' }
const weekdayLabel: CSSProperties = { fontSize: font.size.xs, fontWeight: font.weight.semibold }

// Leaderboard
const leaderRow: CSSProperties = { marginBottom: spacing['5'] }
const leaderTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing['2'] }
const leaderName: CSSProperties = { ...text.body, color: colors.text.primary, fontWeight: font.weight.medium, display: 'inline-flex', alignItems: 'center' }
const leaderCount: CSSProperties = { ...text.body, color: colors.text.primary, fontWeight: font.weight.bold, fontVariantNumeric: 'tabular-nums' }
const leaderMeta: CSSProperties = { marginTop: spacing['2'] }
const rankBadge: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: radius.full, marginRight: spacing['3'], fontSize: font.size['2xs'], fontWeight: font.weight.bold, flexShrink: 0 }
const inactiveTag: CSSProperties = { marginLeft: spacing['3'], fontSize: font.size['2xs'], fontWeight: font.weight.semibold, color: colors.accent.warning, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', padding: '2px 8px', borderRadius: radius.full, letterSpacing: '0.04em' }

const barTrack: CSSProperties = { width: '100%', height: '6px', background: colors.white['5'], borderRadius: radius.full, overflow: 'hidden' }
const barFill: CSSProperties = { height: '100%', background: colors.white['70'], borderRadius: radius.full }

const rowName: CSSProperties = { ...text.body, color: colors.text.primary, fontWeight: font.weight.medium, display: 'inline-flex', alignItems: 'center' }
const memberRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing['3'], padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.border.subtle}`, flexWrap: 'wrap' }

const inviteCodeBox: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['1'], padding: '1.25rem', borderRadius: radius.lg, background: colors.white['3'], border: `1px solid ${colors.border.subtle}`, marginBottom: spacing['4'] }
const inviteCodeLabel: CSSProperties = { ...text.eyebrow, fontSize: font.size['2xs'] }
const inviteCode: CSSProperties = { fontFamily: font.mono, fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, letterSpacing: '0.15em' }
const inviteLinkRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing['3'], padding: '0.6rem 0.6rem 0.6rem 1rem', borderRadius: radius.full, background: colors.white['3'], border: `1px solid ${colors.border.subtle}` }
const inviteLinkText: CSSProperties = { ...text.caption, fontFamily: font.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.text.secondary }
const copyBtn: CSSProperties = { ...buttons.primary, padding: '0.5rem 1.1rem', fontSize: font.size.sm, flexShrink: 0 }
const copyBtnDone: CSSProperties = { ...buttons.primary, padding: '0.5rem 1.1rem', fontSize: font.size.sm, flexShrink: 0, background: colors.accent.success, color: '#000' }
