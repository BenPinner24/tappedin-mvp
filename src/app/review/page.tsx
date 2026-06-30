'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { colors, font, radius, spacing, borders, transitions } from '@/lib/design'
import ReviewTab from '@/components/ReviewTab'

export default function ReviewPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]         = useState(true)
  const [signedOut, setSignedOut]     = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)
  const [profile, setProfile]         = useState<{ display_name: string | null; role: string | null } | null>(null)
  const [hasCard, setHasCard]         = useState(false)
  const [isMobile, setIsMobile]       = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) {
          if (!cancelled) { setSignedOut(true); setLoading(false) }
          return
        }
        if (!cancelled) setUserId(uid)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, role')
          .eq('id', uid)
          .maybeSingle()
        if (!cancelled && profileData) setProfile(profileData)

        const { data: cardData } = await supabase
          .from('cards')
          .select('card_id')
          .eq('owner_user_id', uid)
          .limit(1)
          .maybeSingle()
        if (!cancelled) setHasCard(!!cardData)
      } catch {
        /* fall through to render */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  return (
    <main style={p.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes pgspin { to { transform: rotate(360deg); } }
        @keyframes pgfade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        *, *::before, *::after { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${colors.text.ghost}; }
        textarea:focus {
          border-color: ${colors.border.strong} !important;
          background: rgba(255,255,255,0.06) !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important;
        }
        .pg-back:hover { color: ${colors.white[90]} !important; }
      `}</style>

      <div style={p.shell}>
        <Link href="/dashboard" className="pg-back" style={p.back}>← Back to dashboard</Link>

        <div style={p.card}>
          <div style={p.header}>
            <p style={p.eyebrow}>Tapped-In</p>
            <h1 style={p.title}>Leave a review</h1>
            <p style={p.sub}>Real members, real cards. Your words help the next person decide.</p>
          </div>

          <div style={p.divider} />

          {loading ? (
            <div style={p.centered}><div style={p.spinner} /></div>
          ) : signedOut ? (
            <div style={p.centered}>
              <p style={p.stateTitle}>Please sign in first</p>
              <p style={p.stateText}>
                Reviews are open to Tapped-In cardholders. Sign in to your dashboard, then come back here.
              </p>
              <Link href="/dashboard" style={p.signInBtn}>Go to dashboard</Link>
            </div>
          ) : (
            <ReviewTab
              profile={profile}
              userId={userId}
              hasCard={hasCard}
              isMobile={isMobile}
            />
          )}
        </div>

        <div style={p.brandMark}>
          <span style={p.brandLogo}>TAPPED-IN</span>
          <span style={p.brandSlogan}>The New Standard for Networking.</span>
        </div>
      </div>
    </main>
  )
}

const p: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: colors.bg.page,
    color: colors.text.primary,
    fontFamily: font.sans,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    display: 'flex',
    justifyContent: 'center',
    padding: 'clamp(1.5rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)',
  },
  shell: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
  },
  back: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    textDecoration: 'none',
    transition: transitions.base,
    alignSelf: 'flex-start',
  },
  card: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    padding: 'clamp(1.5rem, 4vw, 2.25rem)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 8px 32px rgba(0,0,0,0.35)',
    animation: 'pgfade 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    marginBottom: spacing[5],
  },
  eyebrow: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.semibold,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: font.size['3xl'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: font.leading.tight,
  },
  sub: {
    fontSize: font.size.sm,
    color: colors.text.muted,
    fontWeight: font.weight.regular,
    lineHeight: font.leading.normal,
    marginTop: spacing[1],
  },
  divider: {
    height: '1px',
    background: colors.border.subtle,
    marginBottom: spacing[5],
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing[3],
    padding: `${spacing[6]} ${spacing[3]}`,
  },
  spinner: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.12)',
    borderTop: '2px solid rgba(255,255,255,0.7)',
    animation: 'pgspin 0.75s linear infinite',
  },
  stateTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: font.tracking.snug,
  },
  stateText: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    fontWeight: font.weight.light,
    maxWidth: '320px',
  },
  signInBtn: {
    marginTop: spacing[2],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing[3]} ${spacing[6]}`,
    borderRadius: radius.full,
    background: colors.white.full,
    color: '#000',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  },
  brandMark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: `${spacing[2]} 0`,
  },
  brandLogo: {
    fontSize: '0.6rem',
    fontWeight: font.weight.bold,
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.14)',
  },
  brandSlogan: {
    fontSize: font.size.xs,
    fontWeight: font.weight.light,
    color: 'rgba(255,255,255,0.1)',
  },
}
