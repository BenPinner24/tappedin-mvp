import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ClaimPageProps = {
  params: Promise<{ card_id: string }>
}

type CardRecord = {
  card_id: string
  owner_user_id: string | null
  status: string | null
  nfc_url: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClaimCardPage({ params }: ClaimPageProps) {
  const { card_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: card } = await supabase
    .from('cards')
    .select('card_id, owner_user_id, status, nfc_url')
    .eq('card_id', card_id)
    .maybeSingle<CardRecord>()

  // ── Card not found
  if (!card) {
    return (
      <StateScreen
        icon="not-found"
        title="Card not found"
        body="This NFC card doesn't exist in our system yet. If you believe this is an error, contact support."
      />
    )
  }

  // ── Already claimed
  if (card.owner_user_id && card.status === 'claimed') {
    return (
      <StateScreen
        icon="claimed"
        title="Already claimed"
        body="This card is already connected to an account. If this is yours, sign in to access your dashboard."
        cta={{ label: 'Go to dashboard', href: '/dashboard' }}
      />
    )
  }

  // ── Claim action
  async function claimCard() {
    'use server'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { error } = await supabase
      .from('cards')
      .update({ owner_user_id: user.id, status: 'claimed' })
      .eq('card_id', card_id)
      .is('owner_user_id', null)

    if (error) throw new Error(error.message)

    redirect('/claim/success')
  }

  // ── Claim UI
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; min-height: 100vh; -webkit-font-smoothing: antialiased; }

        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.6; } }

        .ti-page  { animation: fadeIn 0.5s ease both; }
        .ti-panel { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .ti-row-1 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .ti-row-2 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.26s both; }
        .ti-row-3 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .ti-row-4 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .ti-row-5 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both; }

        .ti-claim-btn {
          transition: background 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s ease;
          cursor: pointer;
        }
        .ti-claim-btn:hover  { background: #e4e4e4 !important; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,255,255,0.14) !important; }
        .ti-claim-btn:active { transform: translateY(0); box-shadow: none !important; }

        .ti-login-link {
          transition: border-color 0.18s, color 0.18s, transform 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .ti-login-link:hover { border-color: rgba(255,255,255,0.22) !important; color: rgba(255,255,255,0.85) !important; transform: translateY(-1px); }

        .ti-glow { animation: shimmer 5s ease-in-out infinite; }
      `}</style>

      <main className="ti-page" style={s.page}>
        <div style={s.bgGrid} />
        <div className="ti-glow" style={s.bgGlow} />

        <div style={s.shell}>
          <div className="ti-panel" style={s.panel}>

            {/* Brand */}
            <div className="ti-row-1" style={s.brandRow}>
              <span style={s.brandMark}>TAPPED-IN</span>
            </div>

            {/* NFC icon */}
            <div className="ti-row-1" style={s.iconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1"/>
                <path d="M8.5 12.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6 12.5c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="12" cy="12.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>

            {/* Heading */}
            <div className="ti-row-2" style={s.headingBlock}>
              <p style={s.eyebrow}>NFC Card Activation</p>
              <h1 style={s.title}>Claim your card</h1>
              <p style={s.body}>
                Connect this physical card to your Tapped-In profile and start tracking real-world networking, instantly.
              </p>
            </div>

            {/* Card ID row */}
            <div className="ti-row-3" style={s.cardIdRow}>
              <span style={s.cardIdLabel}>Card ID</span>
              <span style={s.cardIdValue}>{card.card_id}</span>
            </div>

            {/* Divider */}
            <div className="ti-row-3" style={s.divider} />

            {/* CTA */}
            {user ? (
              <div className="ti-row-4">
                <form action={claimCard}>
                  <button type="submit" className="ti-claim-btn" style={s.claimBtn}>
                    Claim this card
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </form>
                <p style={s.userHint}>Claiming as <strong style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{user.email}</strong></p>
              </div>
            ) : (
              <div className="ti-row-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="/login" className="ti-claim-btn" style={s.claimBtn}>
                  Sign in to claim
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="/signup" className="ti-login-link" style={s.signupLink}>
                  No account? Create one →
                </a>
              </div>
            )}

            {/* Footer slogan */}
            <div className="ti-row-5" style={s.footer}>
              <p style={s.footerSlogan}>A new standard of Networking.</p>
            </div>

          </div>
        </div>
      </main>
    </>
  )
}

// ─── State Screen ─────────────────────────────────────────────────────────────

function StateScreen({
  icon,
  title,
  body,
  cta,
}: {
  icon: 'not-found' | 'claimed'
  title: string
  body: string
  cta?: { label: string; href: string }
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; min-height: 100vh; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .ti-s-page  { animation: fadeIn 0.5s ease both; }
        .ti-s-panel { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.06s both; }
        .ti-s-cta { transition: opacity 0.18s, transform 0.18s cubic-bezier(0.16,1,0.3,1); }
        .ti-s-cta:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
      <main className="ti-s-page" style={s.page}>
        <div style={s.bgGrid} />
        <div style={{ ...s.bgGlow, animationName: 'none' }} />
        <div style={s.shell}>
          <div className="ti-s-panel" style={s.panel}>
            <div style={s.brandRow}>
              <span style={s.brandMark}>TAPPED-IN</span>
            </div>

            <div style={{ ...s.iconWrap, marginBottom: '1.25rem' }}>
              {icon === 'not-found' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                  <path d="M12 8v4M12 16h.01" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(74,222,128,0.3)" strokeWidth="1.2"/>
                  <path d="M8 12l3 3 5-5" stroke="rgba(74,222,128,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            <p style={s.eyebrow}>NFC Card</p>
            <h1 style={{ ...s.title, marginBottom: '0.75rem' }}>{title}</h1>
            <p style={{ ...s.body, marginBottom: cta ? '1.75rem' : '0' }}>{body}</p>

            {cta && (
              <a href={cta.href} className="ti-s-cta" style={{ ...s.claimBtn, display: 'flex', marginBottom: 0 }}>
                {cta.label}
              </a>
            )}

            <div style={s.footer}>
              <p style={s.footerSlogan}>A new standard of Networking.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
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
    WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 74%)',
    maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 74%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  bgGlow: {
    position: 'fixed',
    top: '-80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '480px',
    height: '320px',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 65%)',
    filter: 'blur(16px)',
    pointerEvents: 'none',
    zIndex: 0,
    animationName: 'shimmer',
    animationDuration: '5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },

  shell: {
    width: '100%',
    maxWidth: '400px',
    position: 'relative',
    zIndex: 1,
  },

  panel: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '28px',
    padding: '2.25rem 2rem 2rem',
    boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.045) inset',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0',
  },

  brandRow: {
    marginBottom: '1.75rem',
  },

  brandMark: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.2)',
  },

  iconWrap: {
    marginBottom: '1.5rem',
    opacity: 0.9,
  },

  headingBlock: {
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },

  eyebrow: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.22)',
    textTransform: 'uppercase',
    marginBottom: '0.15rem',
  },

  title: {
    fontSize: '1.9rem',
    fontWeight: 700,
    letterSpacing: '-0.045em',
    color: '#fff',
    lineHeight: 1.05,
    marginBottom: '0.5rem',
  },

  body: {
    fontSize: '0.84rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 1.72,
    maxWidth: '300px',
    margin: '0 auto',
  },

  cardIdRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.9rem 1.1rem',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '1.25rem',
  },

  cardIdLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  cardIdValue: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: '0.06em',
  },

  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.055)',
    marginBottom: '1.25rem',
  },

  claimBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0.9rem 1.25rem',
    borderRadius: '100px',
    border: 'none',
    background: '#fff',
    color: '#000',
    fontFamily: FONT,
    fontSize: '0.88rem',
    fontWeight: 700,
    textDecoration: 'none',
    letterSpacing: '0.01em',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },

  signupLink: {
    display: 'block',
    textAlign: 'center',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.35)',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    padding: '0.55rem 0',
    borderRadius: '100px',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'border-color 0.18s, color 0.18s',
  },

  userHint: {
    marginTop: '0.75rem',
    fontSize: '0.72rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.22)',
    letterSpacing: '0.01em',
  },

  footer: {
    marginTop: '1.75rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    width: '100%',
    textAlign: 'center',
  },

  footerSlogan: {
    fontSize: '0.6rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.14)',
    letterSpacing: '0.04em',
    fontStyle: 'italic',
  },
}
