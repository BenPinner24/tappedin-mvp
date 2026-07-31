'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  colors, font, radius, spacing,
  text, cards, buttons, layout, keyframes,
} from '@/lib/design'

type ViewState = 'loading' | 'need-login' | 'confirm' | 'already-member' | 'invalid' | 'joined'

export default function JoinPage() {
  const supabase = createClient()
  const params = useParams()
  const code = String(params.code ?? '').toUpperCase()

  const [view, setView] = useState<ViewState>('loading')
  const [companyName, setCompanyName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) { setView('need-login'); return }

      // Already in a company?
      const { data: membership } = await supabase
        .from('company_members').select('company_id').eq('user_id', user.id).maybeSingle()
      if (!active) return
      if (membership) { setView('already-member'); return }

      // Look up the company name via the safe function (works for non-members)
      const { data: name, error: lookupError } = await supabase
        .rpc('company_name_for_code', { code })
      if (!active) return

      if (lookupError || !name) { setView('invalid'); return }

      setCompanyName(name as string)
      setView('confirm')
    })()
    return () => { active = false }
  }, [supabase, code])

  async function handleJoin() {
    setError(null)
    setJoining(true)
    const { error: rpcError } = await supabase.rpc('join_company', { code })
    setJoining(false)
    if (rpcError) {
      if (rpcError.message === 'invalid_code') setView('invalid')
      else if (rpcError.message === 'already_in_company') setView('already-member')
      else setError(rpcError.message || 'Something went wrong. Please try again.')
      return
    }
    setView('joined')
  }

  return (
    <>
      <style>{keyframes.base}</style>
      <main style={pageStyle}>
        <div style={bgGrid} />
        <div style={shell}>
          <div style={brandRow}><span style={text.brandMark}>TAPPED-IN</span></div>

          {view === 'loading' && <div style={cards.glass}><p style={text.bodyMuted}>Loading…</p></div>}

          {view === 'need-login' && (
            <div style={{ ...cards.glass, textAlign: 'center' }}>
              <p style={{ ...text.eyebrow, marginBottom: spacing['3'] }}>Team invite</p>
              <h1 style={{ ...text.heading, marginBottom: spacing['3'] }}>Log in to join</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>
                You&apos;ve been invited to join a company on Tapped-In. Log in or create an account to continue.
              </p>
              <Link href={`/login?next=/join/${code}`} style={{ ...buttons.primary, marginBottom: spacing['3'] }}>Log in</Link>
              <div><Link href={`/signup?next=/join/${code}`} style={buttons.ghost}>Create an account</Link></div>
            </div>
          )}

          {view === 'confirm' && (
            <div style={{ ...cards.glass, textAlign: 'center', animation: 'ti-riseUp 0.6s ease both' }}>
              <p style={{ ...text.eyebrow, marginBottom: spacing['3'] }}>Team invite</p>
              <h1 style={{ ...text.heading, marginBottom: spacing['4'] }}>Join {companyName}?</h1>
              <p style={{ ...text.body, marginBottom: spacing['5'] }}>
                You&apos;re about to join <strong style={{ color: colors.text.primary }}>{companyName}</strong> on Tapped-In.
              </p>
              <div style={consentBox}>
                By joining, your card tap activity will be visible to your company&apos;s manager
                as part of their team dashboard. You can be removed by your manager at any time.
              </div>
              {error && <p style={{ ...text.caption, color: colors.accent.error, marginTop: spacing['4'] }}>{error}</p>}
              <button onClick={handleJoin} disabled={joining}
                style={{ ...buttons.primary, width: '100%', marginTop: spacing['6'], opacity: joining ? 0.6 : 1 }}>
                {joining ? 'Joining…' : `Join ${companyName}`}
              </button>
              <div style={{ marginTop: spacing['3'] }}>
                <Link href="/dashboard" style={buttons.ghost}>No thanks</Link>
              </div>
            </div>
          )}

          {view === 'already-member' && (
            <div style={{ ...cards.glass, textAlign: 'center' }}>
              <h1 style={{ ...text.heading, marginBottom: spacing['3'] }}>You&apos;re already in a company</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>
                Each account can belong to one company at a time. If you need to switch, ask your manager to remove you first.
              </p>
              <Link href="/dashboard" style={buttons.primary}>Back to dashboard</Link>
            </div>
          )}

          {view === 'invalid' && (
            <div style={{ ...cards.glass, textAlign: 'center' }}>
              <h1 style={{ ...text.heading, marginBottom: spacing['3'] }}>Invalid invite</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>
                This invite link or code isn&apos;t valid. Check with your manager for the correct one.
              </p>
              <Link href="/dashboard" style={buttons.primary}>Back to dashboard</Link>
            </div>
          )}

          {view === 'joined' && (
            <div style={{ ...cards.glass, textAlign: 'center', animation: 'ti-scaleIn 0.5s ease both' }}>
              <div style={successDot}>✓</div>
              <h1 style={{ ...text.heading, marginTop: spacing['4'], marginBottom: spacing['3'] }}>Welcome to {companyName}</h1>
              <p style={{ ...text.body, marginBottom: spacing['6'] }}>
                You&apos;ve joined the team. Your manager can now include your card in the company dashboard.
              </p>
              <Link href="/dashboard" style={buttons.primary}>Go to my dashboard</Link>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh', background: colors.bg.page, color: colors.text.primary,
  fontFamily: font.sans, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
const shell: CSSProperties = { width: '100%', maxWidth: layout.maxWidth.sm, position: 'relative', zIndex: 1 }
const brandRow: CSSProperties = { textAlign: 'center', marginBottom: spacing['8'] }
const consentBox: CSSProperties = {
  ...text.caption, textAlign: 'left', background: colors.white['3'],
  border: `1px solid ${colors.border.subtle}`, borderRadius: radius.lg,
  padding: '1rem 1.1rem', lineHeight: font.leading.relaxed, color: colors.text.secondary,
}
const successDot: CSSProperties = {
  width: '48px', height: '48px', borderRadius: radius.full, margin: '0 auto',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: colors.accent.successBg, border: `1px solid ${colors.accent.successBorder}`,
  color: colors.accent.success, fontSize: font.size.xl, fontWeight: font.weight.bold,
}