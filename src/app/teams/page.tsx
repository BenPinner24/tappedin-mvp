'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LockOverlay from '@/components/LockOverlay'
import TeamAnalytics from '@/components/teams/TeamAnalytics'
import { canAccess } from '@/lib/tiers'
import {
  colors, font, radius, spacing,
  text, inputs, cards, buttons, layout, keyframes,
} from '@/lib/design'

type ViewState = 'loading' | 'need-login' | 'not-enabled' | 'create' | 'dashboard'
type Member = { user_id: string; member_name: string; member_email: string; role: string; card_id: string | null }

// Champagne accent — brand tone used to make the #1 performer stand out

export default function TeamsPage() {
  const supabase = createClient()

  const [view, setView] = useState<ViewState>('loading')
  const [canSeeFullTeam, setCanSeeFullTeam] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [myCompanyName, setMyCompanyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [unassigned, setUnassigned] = useState<string[]>([])
  const [assignChoice, setAssignChoice] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Team membership + spare-card pool for the card-management section below.
  // All analytics now come from /api/teams/analytics via <TeamAnalytics />.
  const loadDashboardData = useCallback(async () => {
    const [{ data: mem }, { data: pool }] = await Promise.all([
      supabase.rpc('get_team_members'),
      supabase.rpc('get_unassigned_cards'),
    ])
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

        // Full team dashboard = the manager on Gold (or their first month).
        // Basic managers still get summary stats + management tools.
        const { data: mgrBilling } = await supabase
          .from('user_billing')
          .select('subscription_tier, subscription_status, is_founder')
          .eq('user_id', user.id)
          .maybeSingle()
        const { data: mgrCard } = await supabase
          .from('cards')
          .select('activated_at')
          .eq('owner_user_id', user.id)
          .limit(1)
          .maybeSingle()
        if (!active) return
        const _fullAccess = canAccess(
          mgrBilling?.subscription_tier,
          'manager_dashboard_full',
          mgrBilling?.subscription_status,
          !!mgrBilling?.is_founder,
          mgrCard?.activated_at ?? null,
          new Date(),
          true,
        )
        setCanSeeFullTeam(_fullAccess)

        await loadDashboardData()
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
    await loadDashboardData()
    setAssignChoice((prev) => { const n = { ...prev }; delete n[userId]; return n })
  }

  async function handleUnassign(cardId: string) {
    setBusy(cardId); setActionMsg(null)
    const { error: rpcError } = await supabase.rpc('unassign_card', { target_card_id: cardId })
    setBusy(null)
    if (rpcError) { setActionMsg(rpcError.message || 'Could not unassign card.'); return }
    await loadDashboardData()
  }

  // ─── Derived values still used by the shell ────────────────────────────────
  const teamMembers = members.filter((m) => m.role === 'employee')

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
              </div>

              <TeamAnalytics canSeeFull={canSeeFullTeam} />

              {/* ─── Company Profile Template ─── */}
              <Link href="/teams/template" className="ti-template-cta" style={templateCta}>
                <span style={templateIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C9A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2.5" />
                    <path d="M3 9h18" />
                    <path d="M9 9v12" />
                  </svg>
                </span>
                <span style={templateBody}>
                  <span style={templateTitle}>Company Profile Template</span>
                  <span style={templateSub}>Set the links and styling applied across your whole team&rsquo;s cards.</span>
                </span>
                <span style={templateChevron} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>

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

  /* Company Profile Template CTA */
  .ti-template-cta:hover { transform: translateY(-2px); border-color: rgba(232,201,160,0.42); background: linear-gradient(135deg, rgba(232,201,160,0.09) 0%, rgba(255,255,255,0.03) 100%); }
  @media (max-width: 560px) {
    .ti-template-cta { align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ti-template-cta { transition: none !important; }
    .ti-template-cta:hover { transform: none !important; }
  }

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

// Summary stat cards

// Daily chart

// Weekday

// Leaderboard

const rowName: CSSProperties = { ...text.body, color: colors.text.primary, fontWeight: font.weight.medium, display: 'inline-flex', alignItems: 'center' }
const memberRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing['3'], padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.border.subtle}`, flexWrap: 'wrap' }

const templateCta: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: spacing['4'],
  marginTop: spacing['5'], padding: '1.15rem 1.35rem',
  borderRadius: radius.lg, textDecoration: 'none',
  background: 'linear-gradient(135deg, rgba(232,201,160,0.055) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(232,201,160,0.2)',
  transition: 'transform .18s cubic-bezier(0.16,1,0.3,1), border-color .18s ease, background .18s ease',
}
const templateIcon: CSSProperties = {
  flexShrink: 0, width: 42, height: 42, borderRadius: radius.md,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(232,201,160,0.1)', border: '1px solid rgba(232,201,160,0.25)',
}
const templateBody: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }
const templateTitle: CSSProperties = { fontSize: '0.98rem', fontWeight: font.weight.bold, color: colors.text.primary, letterSpacing: '0.01em' }
const templateSub: CSSProperties = { ...text.caption, color: colors.text.faint, lineHeight: 1.55 }
const templateChevron: CSSProperties = { flexShrink: 0, color: '#E8C9A0', display: 'flex', alignItems: 'center' }

const inviteCodeBox: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['1'], padding: '1.25rem', borderRadius: radius.lg, background: colors.white['3'], border: `1px solid ${colors.border.subtle}`, marginBottom: spacing['4'] }
const inviteCodeLabel: CSSProperties = { ...text.eyebrow, fontSize: font.size['2xs'] }
const inviteCode: CSSProperties = { fontFamily: font.mono, fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, letterSpacing: '0.15em' }
const inviteLinkRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing['3'], padding: '0.6rem 0.6rem 0.6rem 1rem', borderRadius: radius.full, background: colors.white['3'], border: `1px solid ${colors.border.subtle}` }
const inviteLinkText: CSSProperties = { ...text.caption, fontFamily: font.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.text.secondary }
const copyBtn: CSSProperties = { ...buttons.primary, padding: '0.5rem 1.1rem', fontSize: font.size.sm, flexShrink: 0 }
const copyBtnDone: CSSProperties = { ...buttons.primary, padding: '0.5rem 1.1rem', fontSize: font.size.sm, flexShrink: 0, background: colors.accent.success, color: '#000' }
