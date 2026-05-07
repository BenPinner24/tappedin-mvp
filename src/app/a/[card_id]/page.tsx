import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivateCardPageProps = {
  params: Promise<{ card_id: string }>
}

type CardRecord = {
  card_id: string
  owner_user_id: string | null
  status: string | null
  nfc_url: string | null
}

type ProfileRecord = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ActivateCardPage({ params }: ActivateCardPageProps) {
  const { card_id } = await params
  const supabase    = await createClient()

  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('card_id', card_id)
    .maybeSingle<CardRecord>()

  // ── Card does not exist in the system at all
  if (!card) {
    return <UnavailableCard />
  }

  // ── Card exists but is unclaimed — send to claim flow
  if (!card.owner_user_id || card.status !== 'claimed') {
    redirect(`/claim/${card_id}`)
  }

  // ── Card is claimed — fetch owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role')
    .eq('id', card.owner_user_id)
    .maybeSingle<ProfileRecord>()

  // ── Profile has no username yet — send to claim flow to complete setup
  if (!profile?.username) {
    redirect(`/claim/${card_id}`)
  }

  // ── Log tap event
  const requestHeaders = await headers()
  const userAgent      = requestHeaders.get('user-agent') || 'Unknown'

  await supabase.from('tap_events').insert({
    profile_id: profile.id,
    card_code:  card.card_id,
    event_type: 'card_tap',
    user_agent: userAgent,
    tapped_at:  new Date().toISOString(),
  })

  // ── Show premium activation screen then redirect to public profile
  return (
    <ActivationScreen
      username={profile.username}
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
      role={profile.role}
    />
  )
}

// ─── Activation Screen ────────────────────────────────────────────────────────

function ActivationScreen({
  username,
  displayName,
  avatarUrl,
  role,
}: {
  username: string
  displayName: string | null
  avatarUrl: string | null
  role: string | null
}) {
  const name     = displayName || username
  const initials = getInitials(name)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; min-height: 100vh; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes riseUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes avatarReveal {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.18; }
          50%  { transform: scale(1.18); opacity: 0.06; }
          100% { transform: scale(1);    opacity: 0.18; }
        }

        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }

        .ti-bg      { animation: fadeIn 0.6s ease both; }
        .ti-brand   { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .ti-avatar  { animation: avatarReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .ti-name    { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .ti-label   { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.48s both; }
        .ti-status  { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.56s both; }
        .ti-bar     { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.62s both; }
        .ti-footer  { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.72s both; }

        .ti-progress-fill {
          animation: progressFill 1.6s cubic-bezier(0.4,0,0.2,1) 0.85s both;
        }

        .ti-dot-1 { animation: dotBlink 1.4s ease 0.9s infinite; }
        .ti-dot-2 { animation: dotBlink 1.4s ease 1.1s infinite; }
        .ti-dot-3 { animation: dotBlink 1.4s ease 1.3s infinite; }

        .ti-pulse-ring {
          animation: pulseRing 3s ease-in-out 0.5s infinite;
        }
      `}</style>

      {/* Meta refresh — server-side redirect after 2s */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <meta httpEquiv="refresh" content={`2;url=/u/${username}`} />

      <main className="ti-bg" style={s.page}>
        {/* Background grid */}
        <div style={s.bgGrid} />

        {/* Top ambient glow */}
        <div style={s.bgGlow} />

        <div style={s.shell}>

          {/* Brand */}
          <div className="ti-brand" style={s.brandRow}>
            <span style={s.brandMark}>TAPPED-IN</span>
          </div>

          {/* Avatar with pulse ring */}
          <div className="ti-avatar" style={s.avatarSection}>
            <div style={s.pulseWrap}>
              <div className="ti-pulse-ring" style={s.pulseRing} />
              <div style={s.avatarOuter}>
                <div style={s.avatarInner}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} style={s.avatarImg} />
                  ) : (
                    <span style={s.avatarInitials}>{initials}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="ti-name" style={s.nameRow}>
            <h1 style={s.name}>{name}</h1>
            {role && <p style={s.role}>{role}</p>}
          </div>

          {/* Verified label */}
          <div className="ti-label" style={s.verifiedRow}>
            <div style={s.verifiedBadge}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={s.verifiedText}>Identity verified</span>
            </div>
          </div>

          {/* Status text */}
          <div className="ti-status" style={s.statusRow}>
            <span style={s.statusText}>Opening digital profile</span>
            <span style={s.statusDots}>
              <span className="ti-dot-1" style={s.dot} />
              <span className="ti-dot-2" style={s.dot} />
              <span className="ti-dot-3" style={s.dot} />
            </span>
          </div>

          {/* Progress bar */}
          <div className="ti-bar" style={s.barWrap}>
            <div style={s.barTrack}>
              <div className="ti-progress-fill" style={s.barFill} />
            </div>
          </div>

          {/* Footer */}
          <div className="ti-footer" style={s.footer}>
            <span style={s.footerSlogan}>A new standard of Networking.</span>
          </div>

        </div>
      </main>
    </>
  )
}

// ─── Unavailable Card ─────────────────────────────────────────────────────────

function UnavailableCard() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .ti-unavail { animation: fadeIn 0.5s ease both; }
        .ti-unavail-card { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
      `}</style>
      <main className="ti-unavail" style={s.page}>
        <div style={s.bgGrid} />
        <div style={s.bgGlow} />
        <div style={s.shell}>
          <div className="ti-unavail-card" style={s.unavailCard}>
            <div style={s.brandRow}>
              <span style={s.brandMark}>TAPPED-IN</span>
            </div>

            <div style={s.unavailIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>

            <p style={s.unavailEyebrow}>NFC CARD</p>
            <h1 style={s.unavailTitle}>Card unavailable</h1>
            <p style={s.unavailDesc}>
              This card does not exist in our system. If you believe this is an error, please contact support.
            </p>

            <a href="/" style={s.unavailCta}>Learn about Tapped-In →</a>

            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: '#030303',
    color: '#fff',
    fontFamily: FONT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
    position: 'relative',
    overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  },

  bgGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '56px 56px',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 75%)',
    maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 75%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  bgGlow: {
    position: 'fixed',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '350px',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 65%)',
    filter: 'blur(12px)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  shell: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    gap: '0',
  },

  // ── Brand
  brandRow: {
    marginBottom: '2.5rem',
    textAlign: 'center',
  },

  brandMark: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.2)',
  },

  // ── Avatar
  avatarSection: {
    marginBottom: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseWrap: {
    position: 'relative',
    width: '108px',
    height: '108px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    inset: '-12px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.22)',
    pointerEvents: 'none',
  },

  avatarOuter: {
    width: '100px',
    height: '100px',
    borderRadius: '28px',
    padding: '2px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)',
  },

  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: '26px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #1c1c1c, #111)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarInitials: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '-0.03em',
    fontFamily: FONT,
  },

  // ── Name
  nameRow: {
    textAlign: 'center',
    marginBottom: '1.25rem',
  },

  name: {
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    color: '#fff',
    lineHeight: 1.1,
    marginBottom: '0.35rem',
  },

  role: {
    fontSize: '0.82rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: '0.01em',
  },

  // ── Verified badge
  verifiedRow: {
    marginBottom: '1.75rem',
    display: 'flex',
    justifyContent: 'center',
  },

  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '100px',
    background: 'rgba(74,222,128,0.07)',
    border: '1px solid rgba(74,222,128,0.18)',
  },

  verifiedText: {
    fontSize: '0.72rem',
    fontWeight: 500,
    color: '#4ade80',
    letterSpacing: '0.04em',
  },

  // ── Status
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '1.25rem',
  },

  statusText: {
    fontSize: '0.75rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.03em',
  },

  statusDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },

  dot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
    display: 'inline-block',
  },

  // ── Progress bar
  barWrap: {
    width: '100%',
    maxWidth: '240px',
    marginBottom: '3rem',
  },

  barTrack: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '1px',
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    background: 'rgba(255,255,255,0.4)',
    borderRadius: '1px',
    width: '0%',
  },

  // ── Footer
  footer: {
    textAlign: 'center',
  },

  footerSlogan: {
    fontSize: '0.62rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.14)',
    letterSpacing: '0.04em',
    fontStyle: 'italic',
  },

  // ── Unavailable card
  unavailCard: {
    width: '100%',
    maxWidth: '380px',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '28px',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
  },

  unavailIcon: {
    marginBottom: '1.25rem',
    marginTop: '0.5rem',
    opacity: 0.7,
  },

  unavailEyebrow: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.22em',
    color: 'rgba(255,255,255,0.2)',
    marginBottom: '0.75rem',
  },

  unavailTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    color: '#fff',
    lineHeight: 1.1,
    marginBottom: '0.85rem',
  },

  unavailDesc: {
    fontSize: '0.82rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1.7,
    maxWidth: '280px',
    marginBottom: '1.75rem',
  },

  unavailCta: {
    display: 'inline-flex',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    padding: '0.6rem 1.25rem',
    borderRadius: '100px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    marginBottom: '2rem',
    transition: 'opacity 0.2s',
  },

  unavailFooter: {
    fontSize: '0.6rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: '0.04em',
    fontStyle: 'italic',
  },
}
