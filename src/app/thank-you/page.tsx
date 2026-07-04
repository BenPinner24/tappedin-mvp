'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #050505; }
  body { background: #050505; color: #fff; font-family: 'Oswald', Arial, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(255,255,255,0.1); }

  @keyframes successFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes successFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes successGlow {
    0%, 100% { opacity: .35; transform: translate(-50%, -50%) scale(1); }
    50%      { opacity: .65; transform: translate(-50%, -50%) scale(1.08); }
  }
  @keyframes successDotBlink {
    0%, 100% { opacity: .25; }
    50%      { opacity: 1; }
  }
  @keyframes successCheckDraw {
    from { stroke-dashoffset: 60; opacity: 0; }
    to   { stroke-dashoffset: 0;  opacity: 1; }
  }
  @keyframes successCircleDraw {
    from { stroke-dashoffset: 220; opacity: 0; }
    to   { stroke-dashoffset: 0;   opacity: 1; }
  }

  .s-fade-up    { animation: successFadeUp .9s cubic-bezier(0.16,1,0.3,1) both; }
  .s-fade-in    { animation: successFadeIn 1.2s ease both; }
  .s-delay-1    { animation-delay: .1s; }
  .s-delay-2    { animation-delay: .2s; }
  .s-delay-3    { animation-delay: .32s; }
  .s-delay-4    { animation-delay: .44s; }
  .s-delay-5    { animation-delay: .56s; }
  .s-delay-6    { animation-delay: .68s; }

  .s-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 15px 34px; background: #fff; color: #000;
    font-family: 'Oswald', Arial, sans-serif; font-size: .88rem; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase;
    border: none; cursor: pointer; text-decoration: none; white-space: nowrap;
    border-radius: 3px;
    transition: background .18s, transform .18s cubic-bezier(0.16,1,0.3,1), box-shadow .18s;
  }
  .s-btn-primary:hover {
    background: #e6e6e6;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(255,255,255,0.18);
  }
  .s-btn-primary:active { transform: translateY(0); }

  .s-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; background: transparent; color: rgba(255,255,255,.6);
    font-family: 'Oswald', Arial, sans-serif; font-size: .88rem; font-weight: 500;
    letter-spacing: .08em; text-transform: uppercase;
    border-radius: 3px; border: 1px solid rgba(255,255,255,.15);
    cursor: pointer; text-decoration: none; white-space: nowrap;
    transition: color .18s, border-color .18s, transform .18s cubic-bezier(0.16,1,0.3,1);
  }
  .s-btn-ghost:hover {
    color: #fff;
    border-color: rgba(255,255,255,.35);
    transform: translateY(-1px);
  }

  .s-check-circle {
    stroke-dasharray: 220;
    stroke-dashoffset: 220;
    animation: successCircleDraw 1s cubic-bezier(0.16,1,0.3,1) .3s forwards;
  }
  .s-check-tick {
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    animation: successCheckDraw .55s cubic-bezier(0.16,1,0.3,1) 1.05s forwards;
  }

  .s-ig-link { transition: color .2s; }
  .s-ig-link:hover { color: rgba(255,255,255,.65) !important; }

  @media (max-width: 768px) {
    .s-cta-row { flex-direction: column !important; align-items: stretch !important; }
    .s-cta-row .s-btn-primary,
    .s-cta-row .s-btn-ghost {
      width: 100%;
      padding: 13px 20px !important;
      font-size: .82rem !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .s-fade-up, .s-fade-in {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .s-check-circle, .s-check-tick {
      animation: none !important;
      stroke-dashoffset: 0 !important;
      opacity: 1 !important;
    }
    .s-glow { animation: none !important; }
    .s-dot  { animation: none !important; opacity: .7 !important; }
  }
`

export default function ThankYouPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    onResize()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const steps = [
    {
      n: '01',
      title: 'Confirmation by email',
      body: 'You\u2019ll get an email within minutes confirming your pack and its details, followed by an update the moment your cards are dispatched.',
    },
    {
      n: '02',
      title: 'Set up your profile',
      body: 'When your pack arrives, tap the first card on your phone to set up your profile in seconds \u2014 no app required.',
    },
    {
      n: '03',
      title: 'Add the rest',
      body: 'Tap each remaining card to link it to that same profile. One profile, in every pocket \u2014 wallet, phone case, desk \u2014 always in sync.',
    },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />

      <main style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile
          ? '5rem 1.25rem 4rem'
          : 'clamp(6rem,12vw,9rem) clamp(1.5rem,5vw,3rem)',
        overflow: 'hidden',
      }}>

        {/* Background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.017) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.017) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)',
          opacity: isMobile ? 0.4 : 1,
        }} />

        {/* Soft glow */}
        <div
          className="s-glow"
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: isMobile ? 520 : 900,
            height: isMobile ? 320 : 520,
            background:
              'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 35%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            animation: 'successGlow 6s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
          }}
        />

        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}>

          {/* Status badge */}
          <div className="s-fade-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px 5px 7px',
            background: 'rgba(255,255,255,0.032)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            marginBottom: isMobile ? '1.5rem' : '2rem',
          }}>
            <div
              className="s-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 6px #4ade80',
                animation: 'successDotBlink 2s ease-in-out infinite',
              }}
            />
            <span style={{
              fontFamily: 'Oswald, Arial, sans-serif',
              fontSize: isMobile ? '.63rem' : '.7rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,.55)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
            }}>
              Order Confirmed
            </span>
          </div>

          {/* Animated check mark */}
          <div className="s-fade-in s-delay-1" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isMobile ? '1.75rem' : '2.25rem',
          }}>
            <div style={{
              position: 'relative',
              width: isMobile ? 78 : 96,
              height: isMobile ? 78 : 96,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 60%, transparent 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <svg
                width={isMobile ? 44 : 54}
                height={isMobile ? 44 : 54}
                viewBox="0 0 80 80"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle className="s-check-circle" cx="40" cy="40" r="34" opacity="0.5" />
                <path className="s-check-tick" d="M26 41 L36 51 L55 31" />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h1 className="s-fade-up s-delay-2" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: isMobile
              ? 'clamp(1.8rem, 7.8vw, 2.6rem)'
              : 'clamp(2.6rem, 5vw, 3.8rem)',
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: '0.01em',
            color: '#fff',
            textTransform: 'uppercase',
            marginBottom: isMobile ? '.85rem' : '1.25rem',
          }}>
            Order confirmed.<br />
            <span style={{
              fontWeight: 300,
              color: 'rgba(255,255,255,.55)',
              letterSpacing: '0.02em',
            }}>
              Your Multi-Pack is on its way.
            </span>
          </h1>

          {/* Subhead */}
          <p className="s-fade-up s-delay-3" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: isMobile ? '.88rem' : '1rem',
            fontWeight: 300,
            color: 'rgba(255,255,255,.42)',
            lineHeight: 1.75,
            letterSpacing: '0.01em',
            maxWidth: 540,
            margin: '0 auto',
            marginBottom: isMobile ? '1.5rem' : '2rem',
          }}>
            Thanks for your order. Your Tapped-In Multi-Pack is confirmed and being prepared
            for dispatch. A confirmation email with your pack details is on its way.
          </p>

          {/* Info strip */}
          <div className="s-fade-up s-delay-4" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMobile ? '1.25rem' : '2rem',
            padding: isMobile ? '.85rem 1.1rem' : '1rem 1.5rem',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 3,
            marginBottom: isMobile ? '2.25rem' : '3rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { l: 'Pack',    v: 'Multi' },
              { l: 'Profile', v: 'One' },
              { l: 'Status',  v: 'Confirmed' },
            ].map((it, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: '.58rem',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,.25)',
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>{it.l}</div>
                <div style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: isMobile ? '.95rem' : '1.1rem',
                  fontWeight: 600,
                  color: '#fff',
                  letterSpacing: '0.02em',
                }}>{it.v}</div>
              </div>
            ))}
          </div>

          {/* Next steps heading */}
          <div className="s-fade-up s-delay-4" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: '.65rem',
            fontWeight: 400,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.28)',
            marginBottom: '.85rem',
          }}>
            What happens next
          </div>

          <h2 className="s-fade-up s-delay-4" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontWeight: 500,
            color: '#fff',
            fontSize: isMobile ? '1.4rem' : 'clamp(1.6rem, 3vw, 2.1rem)',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            marginBottom: isMobile ? '1.5rem' : '2.25rem',
            textTransform: 'uppercase',
          }}>
            One profile. Every pocket.
          </h2>

          {/* Steps */}
          <div className="s-fade-up s-delay-5" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 2,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
            textAlign: 'left',
            marginBottom: isMobile ? '2rem' : '2.75rem',
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                background: '#070707',
                padding: isMobile
                  ? '1.25rem 1.1rem'
                  : 'clamp(1.5rem,3vw,2rem) clamp(1.5rem,3vw,2rem)',
                display: 'flex',
                flexDirection: 'column',
                gap: '.55rem',
              }}>
                <div style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: '.62rem',
                  fontWeight: 400,
                  letterSpacing: '.28em',
                  color: 'rgba(255,255,255,.2)',
                  textTransform: 'uppercase',
                }}>
                  Step {s.n}
                </div>
                <h3 style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: isMobile ? '1.05rem' : '1.25rem',
                  fontWeight: 500,
                  color: '#fff',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  marginTop: '.15rem',
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: '.88rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,.4)',
                  lineHeight: 1.72,
                  letterSpacing: '0.01em',
                }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* One-profile-one-plan note */}
          <p className="s-fade-up s-delay-5" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: '.78rem',
            fontWeight: 400,
            color: 'rgba(255,255,255,.32)',
            letterSpacing: '0.04em',
            lineHeight: 1.7,
            maxWidth: 500,
            margin: '0 auto',
            marginBottom: isMobile ? '1.75rem' : '2.25rem',
          }}>
            All the cards in your pack open one profile &mdash; so when subscriptions launch,
            that&apos;s one plan, never a fee per card. Your confirmation email is on its way;
            if you don&apos;t see it within a few minutes, please check your spam folder.
          </p>

          {/* CTAs */}
          <div className="s-fade-up s-delay-6 s-cta-row" style={{
            display: 'flex',
            gap: '.75rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
          }}>
            <Link href="/login" className="s-btn-primary">
              Sign in to your dashboard
            </Link>
            <Link href="/" className="s-btn-ghost">
              Back to homepage
            </Link>
          </div>

          {/* Instagram follow */}
          <div className="s-fade-in s-delay-6" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
          }}>
            <a
              href="https://www.instagram.com/tappedinspace/"
              target="_blank"
              rel="noopener noreferrer"
              className="s-ig-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'Oswald, Arial, sans-serif',
                fontSize: '.82rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,.35)',
                letterSpacing: '.06em',
                textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              Follow the drop on Instagram
            </a>
          </div>

          {/* Footer line */}
          <p className="s-fade-in s-delay-6" style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: '.68rem',
            fontWeight: 400,
            color: 'rgba(255,255,255,.18)',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            marginTop: '.5rem',
          }}>
            TAPPED-IN \u00B7 Multi-Pack
          </p>
        </div>
      </main>
    </>
  )
}
