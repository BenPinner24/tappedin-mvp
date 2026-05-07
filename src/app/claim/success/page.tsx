import Link from 'next/link'
import type { CSSProperties } from 'react'

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

export default function ClaimSuccessPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; min-height: 100vh; -webkit-font-smoothing: antialiased; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes riseUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkReveal {
          from { opacity: 0; transform: scale(0.72); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ringExpand {
          0%   { transform: scale(0.75); opacity: 0; }
          35%  { opacity: 1; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.55; }
        }

        .ti-page  { animation: fadeIn 0.5s ease both; }
        .ti-r1    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s  both; }
        .ti-r2    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s  both; }
        .ti-r3    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .ti-r4    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .ti-r5    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.52s both; }
        .ti-r6    { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.62s both; }

        .ti-icon  { animation: checkReveal 0.55s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .ti-ring1 { animation: ringExpand 2s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .ti-ring2 { animation: ringExpand 2s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        .ti-check {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: drawCheck 0.45s cubic-bezier(0.16,1,0.3,1) 0.65s forwards;
        }
        .ti-glow  { animation: glowPulse 5s ease-in-out infinite; }

        .ti-btn-primary {
          transition: background 0.18s ease,
                      transform 0.18s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.18s ease;
        }
        .ti-btn-primary:hover {
          background: #e4e4e4 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(255,255,255,0.14) !important;
        }
        .ti-btn-primary:active { transform: translateY(0); }

        .ti-btn-secondary { transition: opacity 0.18s; }
        .ti-btn-secondary:hover { opacity: 0.6 !important; }
      `}</style>

      <main className="ti-page" style={s.page}>

        {/* Background grid */}
        <div style={s.bgGrid} />

        {/* Ambient success glow */}
        <div className="ti-glow" style={s.bgGlow} />

        <div style={s.shell}>

          {/* Brand */}
          <div className="ti-r1" style={s.brandRow}>
            <span style={s.brandMark}>TAPPED-IN</span>
          </div>

          {/* Success icon */}
          <div style={s.iconSection}>
            <div style={s.ringsWrap}>
              <div className="ti-ring1" style={s.ring} />
              <div className="ti-ring2" style={s.ring} />
            </div>
            <div className="ti-icon" style={s.iconOuter}>
              <div style={s.iconInner}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    className="ti-check"
                    d="M5 12.5l5 5 9-9"
                    stroke="#4ade80"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Eyebrow */}
          <div className="ti-r2" style={s.eyebrowWrap}>
            <span style={s.eyebrow}>Card activated</span>
          </div>

          {/* Heading */}
          <div className="ti-r3">
            <h1 style={s.title}>Your card is now live.</h1>
          </div>

          {/* Body */}
          <div className="ti-r4">
            <p style={s.body}>
              Your NFC card is connected to your digital profile. Every tap now opens your presence — instantly, anywhere.
            </p>
          </div>

          {/* Divider */}
          <div className="ti-r5" style={s.divider} />

          {/* CTAs */}
          <div className="ti-r5" style={s.ctaGroup}>
            <Link href="/dashboard" className="ti-btn-primary" style={s.primaryBtn}>
              Open dashboard
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link href="/u/benpinner" className="ti-btn-secondary" style={s.secondaryBtn}>
              View live profile →
            </Link>
          </div>

          {/* Footer slogan */}
          <div className="ti-r6" style={s.footer}>
            <p style={s.slogan}>A new standard of Networking.</p>
          </div>

        </div>
      </main>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    top: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '300px',
    background: 'radial-gradient(ellipse, rgba(74,222,128,0.045) 0%, transparent 65%)',
    filter: 'blur(24px)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  shell: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },

  brandRow: {
    marginBottom: '2.5rem',
  },

  brandMark: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.2)',
  },

  iconSection: {
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.75rem',
  },

  ringsWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  ring: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '1px solid rgba(74,222,128,0.22)',
  },

  iconOuter: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    padding: '2px',
    background: 'linear-gradient(145deg, rgba(74,222,128,0.22) 0%, rgba(74,222,128,0.04) 100%)',
    position: 'relative',
    zIndex: 1,
  },

  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
    background: '#0a0a0a',
    border: '1px solid rgba(74,222,128,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(74,222,128,0.07)',
  },

  eyebrowWrap: {
    marginBottom: '0.55rem',
  },

  eyebrow: {
    fontFamily: 'monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: 'rgba(74,222,128,0.7)',
    textTransform: 'uppercase',
  },

  title: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.045em',
    color: '#fff',
    lineHeight: 1.05,
    marginBottom: '0.9rem',
  },

  body: {
    fontSize: '0.84rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 1.75,
    maxWidth: '290px',
    marginBottom: '2rem',
  },

  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.055)',
    marginBottom: '1.75rem',
  },

  ctaGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '2.5rem',
  },

  primaryBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0.88rem 1.5rem',
    borderRadius: '100px',
    background: '#fff',
    color: '#000',
    fontFamily: FONT,
    fontSize: '0.88rem',
    fontWeight: 700,
    textDecoration: 'none',
    letterSpacing: '0.01em',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },

  secondaryBtn: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.32)',
    textDecoration: 'none',
    letterSpacing: '0.01em',
  },

  footer: {
    textAlign: 'center',
  },

  slogan: {
    fontSize: '0.6rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.14)',
    letterSpacing: '0.04em',
    fontStyle: 'italic',
  },
}
