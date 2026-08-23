'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN · CARD SETUP GUIDE  (/setup)
//
// Standalone page. The global stylesheet, GRAIN texture, useReveal hook,
// InstallPhoneMockup and the EB/H2/SUB tokens below are copied verbatim from
// src/app/page.tsx so this page renders with the identical look and feel.
// Nothing here imports from the landing page, so the landing page is untouched.
// ─────────────────────────────────────────────────────────────────────────────

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html  { scroll-behavior: smooth; background: #050505; }
  body  { background: #050505; color: #fff; font-family: 'Oswald', Arial, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(255,255,255,0.1); }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: #050505; }
  ::-webkit-scrollbar-thumb { background: #1c1c1c; }

  /* ── Keyframes ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes navDrop  { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes cardFloat {
    0%,100% { transform: perspective(1200px) rotateY(-7deg) rotateX(3deg) translateY(0px) translateZ(0); }
    50%      { transform: perspective(1200px) rotateY(-7deg) rotateX(3deg) translateY(-12px) translateZ(0); }
  }
  @keyframes cardFloatBack {
    0%,100% { transform: perspective(1200px) rotateY(7deg) rotateX(-3deg) translateY(0px) translateZ(0); }
    50%      { transform: perspective(1200px) rotateY(7deg) rotateX(-3deg) translateY(-12px) translateZ(0); }
  }
  @keyframes glowPulse {
    0%,100% { opacity:.4; transform:scale(1); }
    50%      { opacity:.75; transform:scale(1.06); }
  }
  @keyframes scanBeam {
    0%   { top: 6%; opacity:0; }
    6%   { opacity:1; }
    94%  { opacity:1; }
    100% { top: 94%; opacity:0; }
  }
  @keyframes dotBlink {
    0%,100% { opacity:.2; }
    50%      { opacity:1; }
  }
  @keyframes shimmerSlide {
    0%   { background-position:-400px 0; }
    100% { background-position:400px 0; }
  }

  /* ── Reviews ── */
  @keyframes revScroll { from { transform:translateX(0); } to { transform:translateX(calc(-50% - 13px)); } }
  .ti-rev-rail{ -webkit-mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent); mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent); }
  .ti-rev-track{ display:flex; gap:26px; width:max-content; padding:8px 13px; animation:revScroll 48s linear infinite; }
  .ti-rev-rail--static{ -webkit-mask-image:none; mask-image:none; }
  .ti-rev-track--static{ width:auto; justify-content:center; flex-wrap:wrap; animation:none; }
  .ti-rev-rail:hover .ti-rev-track{ animation-play-state:paused; }
  .ti-rev-card{ transition:border-color .4s ease, transform .4s ease; }
  .ti-rev-card:hover{ border-color:rgba(255,255,255,0.18); transform:translateY(-4px); }
  @media (prefers-reduced-motion: reduce){ .ti-rev-track{ animation:none; } }

  /* ── Scroll reveal ── */
  .reveal { opacity:0; transform:translateY(28px); transition: opacity .85s cubic-bezier(0.16,1,0.3,1), transform .85s cubic-bezier(0.16,1,0.3,1); }
  .reveal.in { opacity:1; transform:translateY(0); }
  .d1{transition-delay:.06s} .d2{transition-delay:.12s} .d3{transition-delay:.18s}
  .d4{transition-delay:.24s} .d5{transition-delay:.30s} .d6{transition-delay:.36s}

  /* ── Buttons ── */
  .btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:15px 34px; background:#fff; color:#000;
    font-family:'Oswald', Arial, sans-serif; font-size:.88rem; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none; white-space:nowrap;
    border-radius:3px;
    transition: background .18s, transform .18s cubic-bezier(0.16,1,0.3,1), box-shadow .18s;
    position:relative; overflow:hidden;
  }
  .btn-primary:hover { background:#e6e6e6; transform:translateY(-2px); box-shadow:0 12px 40px rgba(255,255,255,0.18); }
  .btn-primary:active { transform:translateY(0); }

  .btn-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:14px 28px; background:transparent; color:rgba(255,255,255,.6);
    font-family:'Oswald', Arial, sans-serif; font-size:.88rem; font-weight:500;
    letter-spacing:.08em; text-transform:uppercase;
    border-radius:3px; border:1px solid rgba(255,255,255,.15);
    cursor:pointer; text-decoration:none; white-space:nowrap;
    transition: color .18s, border-color .18s, transform .18s cubic-bezier(0.16,1,0.3,1);
  }
  .btn-ghost:hover { color:#fff; border-color:rgba(255,255,255,.35); transform:translateY(-1px); }

  .nav-link {
    color:rgba(255,255,255,.4); text-decoration:none;
    font-family:'Oswald', Arial, sans-serif;
    font-size:.84rem; font-weight:400; letter-spacing:.06em; text-transform:uppercase;
    transition:color .2s;
  }
  .nav-link:hover { color:rgba(255,255,255,.88); }

  .footer-link {
    color:rgba(255,255,255,.25); text-decoration:none;
    font-family:'Oswald', Arial, sans-serif;
    font-size:.8rem; font-weight:400; letter-spacing:.04em;
    transition:color .2s;
  }
  .footer-link:hover { color:rgba(255,255,255,.6); }
  .ti-ig-link:hover { color:rgba(255,255,255,.65) !important; }
  .footer-social:hover { color:#fff !important; border-color:rgba(255,255,255,0.25) !important; background:rgba(255,255,255,0.045) !important; }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; scroll-behavior: auto !important; }
    .reveal { opacity:1 !important; transform:none !important; transition:none !important; }
  }

  /* ── Tablet (≤ 960px) ── */
  @media (max-width: 960px) {
    .hero-cols    { flex-direction:column !important; align-items:center !important; text-align:center; }
    .hero-ctas    { justify-content:center !important; }
    .hero-stats   { justify-content:center !important; }
    .card-pair    { flex-direction:column !important; align-items:center !important; }
    .steps-grid   { grid-template-columns:1fr 1fr !important; }
    .profile-cols { flex-direction:column !important; }
    .founder-cols { grid-template-columns:1fr !important; }
    .future-grid  { grid-template-columns:1fr !important; }
  }

  /* ── Mobile (≤ 768px) — CSS-only overrides for classes with no conflicting inline style ── */
  @media (max-width: 768px) {
    .steps-grid  { grid-template-columns:1fr !important; }
    .detail-strip { grid-template-columns:1fr 1fr !important; }
    .footer-cols  { flex-direction:column !important; gap:2rem !important; }
    .footer-links { gap:2rem !important; }
    .hero-ctas    {
      flex-direction:column !important;
      align-items:stretch !important;
      gap:.55rem !important;
    }
    .hero-ctas .btn-primary { padding:13px 20px !important; font-size:.82rem !important; text-align:center !important; }
    .hero-ctas .btn-ghost   { padding:11px 20px !important; font-size:.78rem !important; text-align:center !important; }
    .hero-stats   { gap:1.5rem !important; }
    .final-cta-btns { flex-direction:column !important; align-items:stretch !important; }
    .final-cta-btns .btn-primary { padding:13px 20px !important; font-size:.82rem !important; text-align:center !important; }
    .final-cta-btns .btn-ghost   { padding:11px 20px !important; font-size:.78rem !important; text-align:center !important; }
  }

  @media (max-width: 540px) {
    .detail-strip { grid-template-columns:1fr !important; }
    .future-grid  { grid-template-columns:1fr !important; }
  }
`

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')

    // threshold:0 fires as soon as 1px enters the viewport.
    // rootMargin pre-triggers 60px before the element scrolls into view so
    // fast mobile scrolling never leaves elements permanently at opacity:0.
    const obs = new IntersectionObserver(
      es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
      }),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    )

    // Immediately reveal anything already visible on mount (no scroll needed).
    els.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in')
      } else {
        obs.observe(el)
      }
    })

    return () => obs.disconnect()
  }, [])
}

function InstallPhoneMockup({ scale = 1 }: { scale?: number }) {
  const W = Math.round(260 * scale)
  const H = Math.round(534 * scale)
  return (
    <div style={{
      position: 'relative',
      width: W,
      height: H,
      borderRadius: Math.round(42 * scale),
      background: 'linear-gradient(155deg, #1a1a1a 0%, #0d0d0d 50%, #141414 100%)',
      boxShadow:
        '0 0 0 1.5px rgba(255,255,255,0.07), 0 60px 120px rgba(0,0,0,0.92), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      padding: Math.round(7 * scale),
      flexShrink: 0,
    }}>
      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: GRAIN, backgroundSize: '180px 180px',
        borderRadius: 'inherit', pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Edge highlight */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1.5, zIndex: 3,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Screen */}
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: Math.round(36 * scale),
        background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.025)',
      }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: Math.round(11 * scale), left: '50%',
          transform: 'translateX(-50%)',
          width: Math.round(82 * scale), height: Math.round(24 * scale),
          borderRadius: Math.round(14 * scale),
          background: '#000',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          zIndex: 5,
        }} />

        {/* Status bar */}
        <div style={{
          position: 'absolute', top: Math.round(16 * scale), left: 0, right: 0,
          padding: `0 ${Math.round(22 * scale)}px`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'Oswald, Arial, sans-serif',
          fontSize: `${0.58 * scale}rem`, fontWeight: 500,
          color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em',
          zIndex: 4,
        }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: Math.round(4 * scale), alignItems: 'center' }}>
            <span style={{ width: Math.round(14 * scale), height: Math.round(7 * scale), borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.4)', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 1, background: 'rgba(255,255,255,0.4)', borderRadius: 0.5 }} />
            </span>
          </span>
        </div>

        {/* Dashboard preview behind sheet (dimmed) */}
        <div style={{
          position: 'absolute', inset: 0,
          padding: `${Math.round(54 * scale)}px ${Math.round(20 * scale)}px ${Math.round(20 * scale)}px`,
          opacity: 0.32,
        }}>
          <div style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: `${0.55 * scale}rem`, fontWeight: 500,
            letterSpacing: '0.22em', color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase', marginBottom: Math.round(10 * scale),
          }}>
            TAPPED-IN
          </div>
          <div style={{
            fontFamily: 'Oswald, Arial, sans-serif',
            fontSize: `${1.1 * scale}rem`, fontWeight: 600,
            color: '#fff', lineHeight: 1.15, marginBottom: Math.round(14 * scale),
          }}>
            Dashboard
          </div>
          {[0.7, 0.5, 0.6].map((w, i) => (
            <div key={i} style={{
              height: Math.round(36 * scale),
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: Math.round(8 * scale),
              marginBottom: Math.round(8 * scale),
              width: `${w * 100}%`,
            }} />
          ))}
        </div>

        {/* Share sheet — frosted */}
        <div style={{
          position: 'absolute', left: Math.round(8 * scale), right: Math.round(8 * scale),
          bottom: Math.round(8 * scale),
          borderRadius: Math.round(20 * scale),
          background: 'rgba(22,22,22,0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: `${Math.round(14 * scale)}px ${Math.round(14 * scale)}px ${Math.round(16 * scale)}px`,
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          zIndex: 6,
        }}>
          {/* Handle */}
          <div style={{
            width: Math.round(34 * scale), height: Math.round(4 * scale),
            background: 'rgba(255,255,255,0.18)', borderRadius: 99,
            margin: `0 auto ${Math.round(12 * scale)}px`,
          }} />

          {/* Profile row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: Math.round(10 * scale),
            padding: `${Math.round(8 * scale)}px ${Math.round(4 * scale)}px ${Math.round(12 * scale)}px`,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: Math.round(10 * scale),
          }}>
            <div style={{
              width: Math.round(34 * scale), height: Math.round(34 * scale),
              borderRadius: Math.round(7 * scale),
              background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Oswald, Arial, sans-serif',
              fontSize: `${0.5 * scale}rem`, fontWeight: 600,
              color: 'rgba(255,255,255,0.7)', letterSpacing: '0.14em',
            }}>TI</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Oswald, Arial, sans-serif',
                fontSize: `${0.62 * scale}rem`, fontWeight: 500,
                color: '#fff', letterSpacing: '0.02em',
                marginBottom: 2, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>tappedin.uk/dashboard</div>
              <div style={{
                fontFamily: 'Oswald, Arial, sans-serif',
                fontSize: `${0.5 * scale}rem`, fontWeight: 400,
                color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>Options ›</div>
            </div>
          </div>

          {/* Action rows */}
          {[
            { label: 'Copy', icon: '⧉', dim: true },
            { label: 'Add Bookmark', icon: '☆', dim: true },
            { label: 'Add to Home Screen', icon: '＋', highlight: true },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: `${Math.round(9 * scale)}px ${Math.round(4 * scale)}px`,
              borderRadius: Math.round(8 * scale),
              background: row.highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: row.highlight ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
              marginBottom: Math.round(2 * scale),
            }}>
              <span style={{
                fontFamily: 'Oswald, Arial, sans-serif',
                fontSize: `${0.65 * scale}rem`, fontWeight: row.highlight ? 500 : 400,
                color: row.highlight ? '#fff' : 'rgba(255,255,255,0.55)',
                letterSpacing: '0.01em',
              }}>{row.label}</span>
              <span style={{
                width: Math.round(22 * scale), height: Math.round(22 * scale),
                borderRadius: Math.round(5 * scale),
                background: row.highlight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: `${0.7 * scale}rem`,
                color: row.highlight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                fontWeight: 300,
              }}>{row.icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const EB: React.CSSProperties = {
  fontFamily:'Oswald, Arial, sans-serif',
  fontSize:'0.65rem', fontWeight:400,
  letterSpacing:'0.32em', textTransform:'uppercase',
  color:'rgba(255,255,255,.25)', marginBottom:'1rem',
}
const H2: React.CSSProperties = {
  fontFamily:'Oswald, Arial, sans-serif',
  fontWeight:500, color:'#fff',
  fontSize:'clamp(1.8rem, 4vw, 3.1rem)',
  letterSpacing:'0.01em', lineHeight:1.15,
  marginBottom:'1rem', textAlign:'center',
}
const SUB: React.CSSProperties = {
  fontFamily:'Oswald, Arial, sans-serif',
  fontSize:'.95rem', fontWeight:300,
  color:'rgba(255,255,255,.34)', lineHeight:1.75,
  maxWidth:480, margin:'0 auto', textAlign:'center', letterSpacing:'0.01em',
}

const CHAMP = '#E8C9A0'
const VIDEO_URL = 'https://youtube.com/shorts/Jr58Wntw25A'

type Step = { n: string; title: string; body: string; critical?: boolean }

const STEPS: Step[] = [
  { n: '01', title: 'Your card arrives', body: 'It lands in its Tapped-In packaging, ready to go. Nothing to charge, nothing to install.' },
  { n: '02', title: 'Take it out of the packaging', body: 'Slide the card out. That is all the unboxing there is.' },
  { n: '03', title: 'Tap the card to your phone', body: 'Hold your card against your phone to read it \u2014 no app needed. On iPhone, hold it near the top of the phone. On Android, hold it flat against the middle of the back. Your phone reads it in a second.' },
  { n: '04', title: 'Open the link that appears', body: 'A notification slides down on screen. Tap it to open your card\u2019s activation page.' },
  { n: '05', title: 'Tap \u201cCreate account and activate\u201d', body: 'This is the button that begins setup and ties the card to you.' },
  { n: '06', title: 'Enter your details', body: 'Your full name, email and a password \u2014 then tap \u201cCreate account and activate\u201d again to confirm.' },
  { n: '07', title: 'Set your username', body: 'You\u2019ll land on your dashboard. You MUST set your username to finish activating your card. Once that\u2019s done, you have full freedom to add your links and style your profile however you like.', critical: true },
  { n: '08', title: 'That\u2019s it \u2014 you\u2019re live', body: 'Next time you tap your card on ANY phone, your profile blooms instantly. Update your profile anytime from your dashboard \u2014 no need to re-tap or set the card up again.' },
]

export default function SetupPage() {
  useReveal()
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onResize = () => setIsMobile(window.innerWidth <= 768)

    onScroll()
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Shared section padding — same tokens as the landing page
  const SP = isMobile
    ? 'clamp(3rem,8vw,4.5rem) clamp(1.25rem,5vw,1.5rem)'
    : 'clamp(6rem,12vw,9rem) clamp(1.5rem,5vw,3rem)'

  const navGlass = isMobile || scrolled

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />

      {/* ──────────────────────────────────────────────────────────────
          NAV — same treatment as the landing page
      ────────────────────────────────────────────────────────────── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:200,
        padding: isMobile ? '0 1.25rem' : '0 clamp(1.5rem,5vw,3rem)',
        animation:'navDrop .65s cubic-bezier(0.16,1,0.3,1) both',
        transition:'background .3s, border-color .3s, backdrop-filter .3s',
        background: navGlass ? 'rgba(6,6,6,0.94)' : 'transparent',
        borderBottom: navGlass ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        backdropFilter: navGlass ? 'blur(20px) saturate(160%)' : 'none',
        WebkitBackdropFilter: navGlass ? 'blur(20px) saturate(160%)' : 'none',
      }}>
        <div style={{
          maxWidth:1200, margin:'0 auto',
          height: isMobile ? 56 : 68,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap: isMobile ? '.75rem' : '1.5rem',
        }}>
          <Link href="/" style={{
            fontFamily:'Oswald, Arial, sans-serif',
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight:600, letterSpacing:'0.28em',
            color:'#fff', textDecoration:'none',
            whiteSpace:'nowrap', textTransform:'uppercase',
          }}>TAPPED-IN</Link>
        </div>
      </header>

      <main>

        {/* ════════════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: isMobile
            ? 'calc(56px + clamp(2.75rem,9vw,4rem)) clamp(1.25rem,5vw,1.5rem) clamp(1.5rem,5vw,2.5rem)'
            : 'calc(68px + clamp(5rem,10vw,7.5rem)) clamp(1.5rem,5vw,3rem) clamp(2rem,5vw,3rem)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Grid backdrop — same treatment as hero / install on the landing page */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize:'72px 72px',
            WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 50% 40%, black 12%, transparent 72%)',
            maskImage:'radial-gradient(ellipse 80% 70% at 50% 40%, black 12%, transparent 72%)',
            opacity: isMobile ? 0.5 : 1,
          }} />
          <div style={{
            position:'absolute', top:'42%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:720, height:420,
            background:'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 65%)',
            filter:'blur(8px)', pointerEvents:'none',
          }} />

          <div style={{ maxWidth:1160, margin:'0 auto', position:'relative', zIndex:2, textAlign:'center' }}>
            <div className="reveal" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'5px 14px 5px 7px',
              background:'rgba(255,255,255,0.032)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:2,
              marginBottom: isMobile ? '1rem' : '1.5rem',
            }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'dotBlink 2s ease-in-out infinite' }} />
              <span style={{
                fontFamily:'Oswald, Arial, sans-serif',
                fontSize: isMobile ? '.63rem' : '.7rem',
                fontWeight:500, color:'rgba(255,255,255,.5)',
                letterSpacing:'.22em', textTransform:'uppercase',
              }}>Setup guide</span>
            </div>

            <h1 className="reveal d1" style={{
              fontFamily:'Oswald, Arial, sans-serif',
              fontWeight:500, color:'#fff',
              fontSize:'clamp(2rem, 5vw, 3.4rem)',
              letterSpacing:'0.01em', lineHeight:1.12,
              marginBottom:'1rem', textAlign:'center',
            }}>
              Setting up your<br />
              <span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>Tapped-In card.</span>
            </h1>

            <p className="reveal d2" style={SUB}>
              Your card is ready to bring to life. Follow these steps &mdash; it takes two minutes.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. THE STEPS
        ════════════════════════════════════════════════════════════ */}
        <section style={{ padding: isMobile ? '0 clamp(1.25rem,5vw,1.5rem) clamp(3rem,8vw,4.5rem)' : '0 clamp(1.5rem,5vw,3rem) clamp(6rem,12vw,9rem)' }}>
          <div style={{ maxWidth:780, margin:'0 auto', display:'flex', flexDirection:'column', gap:'.7rem' }}>

            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className={`reveal d${Math.min(i + 1, 6)}`}
                style={{
                  position:'relative',
                  background: s.critical
                    ? 'linear-gradient(148deg, rgba(232,201,160,0.075) 0%, rgba(232,201,160,0.025) 100%)'
                    : 'linear-gradient(148deg, rgba(14,14,14,0.85) 0%, rgba(8,8,8,0.9) 100%)',
                  backdropFilter:'blur(12px) saturate(140%)',
                  WebkitBackdropFilter:'blur(12px) saturate(140%)',
                  border: s.critical
                    ? `1px solid ${CHAMP}59`
                    : '1px solid rgba(255,255,255,0.055)',
                  borderRadius:3,
                  boxShadow: s.critical ? '0 24px 60px rgba(232,201,160,0.09)' : 'none',
                  padding: s.critical
                    ? (isMobile ? '1.35rem 1.1rem 1.25rem' : '1.6rem 1.75rem')
                    : (isMobile ? '1.1rem' : '1.25rem 1.5rem'),
                  marginTop: s.critical ? (isMobile ? '.75rem' : '1.1rem') : 0,
                  marginBottom: s.critical ? (isMobile ? '.75rem' : '1.1rem') : 0,
                  display:'flex',
                  alignItems:'flex-start',
                  gap: isMobile ? '.9rem' : '1.25rem',
                  overflow:'hidden',
                }}
              >
                {/* Top edge highlight */}
                <div style={{
                  position:'absolute', top:0, left:'6%', right:'6%', height:1,
                  background: s.critical
                    ? `linear-gradient(90deg, transparent, ${CHAMP}66 50%, transparent)`
                    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)',
                  pointerEvents:'none',
                }} />

                {/* Left accent bar — critical step only */}
                {s.critical && (
                  <div style={{
                    position:'absolute', top:0, bottom:0, left:0, width:3,
                    background:`linear-gradient(180deg, transparent, ${CHAMP}, transparent)`,
                    pointerEvents:'none',
                  }} />
                )}

                {/* Number */}
                <div style={{
                  flexShrink:0,
                  width: isMobile ? 36 : 42,
                  height: isMobile ? 36 : 42,
                  borderRadius:2,
                  background: s.critical ? 'rgba(232,201,160,0.12)' : 'rgba(255,255,255,0.025)',
                  border: s.critical ? `1px solid ${CHAMP}66` : '1px solid rgba(255,255,255,0.06)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Oswald, Arial, sans-serif',
                  fontSize: isMobile ? '.72rem' : '.78rem',
                  fontWeight:500,
                  letterSpacing:'.14em',
                  color: s.critical ? CHAMP : 'rgba(255,255,255,0.55)',
                }}>
                  {s.n}
                </div>

                {/* Copy */}
                <div style={{ flex:1, minWidth:0 }}>
                  {s.critical && (
                    <div style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      padding:'3px 10px 3px 7px',
                      background:'rgba(232,201,160,0.12)',
                      border:`1px solid ${CHAMP}59`,
                      borderRadius:2,
                      marginBottom:'.6rem',
                    }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:CHAMP, animation:'dotBlink 2s ease-in-out infinite' }} />
                      <span style={{
                        fontFamily:'Oswald, Arial, sans-serif',
                        fontSize:'.58rem', fontWeight:600, color:CHAMP,
                        letterSpacing:'.24em', textTransform:'uppercase',
                      }}>Important</span>
                    </div>
                  )}

                  <h3 style={{
                    fontFamily:'Oswald, Arial, sans-serif',
                    fontSize: s.critical
                      ? (isMobile ? '1.08rem' : '1.22rem')
                      : (isMobile ? '.98rem' : '1.08rem'),
                    fontWeight: s.critical ? 600 : 500,
                    color: s.critical ? CHAMP : '#fff',
                    letterSpacing:'0.02em',
                    textTransform:'uppercase',
                    marginBottom:'.35rem',
                    lineHeight:1.2,
                  }}>
                    {s.title}
                  </h3>

                  <p style={{
                    fontFamily:'Oswald, Arial, sans-serif',
                    fontSize: s.critical
                      ? (isMobile ? '.88rem' : '.92rem')
                      : (isMobile ? '.82rem' : '.86rem'),
                    fontWeight:300,
                    color: s.critical ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.38)',
                    lineHeight:1.68,
                    letterSpacing:'0.01em',
                  }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}

            {/* ── Video ── */}
            <div className="reveal d6" style={{
              marginTop: isMobile ? '1.5rem' : '2.25rem',
              padding: isMobile ? '1.5rem 1.25rem' : '2rem',
              background:'linear-gradient(148deg, rgba(14,14,14,0.85) 0%, rgba(8,8,8,0.9) 100%)',
              border:'1px solid rgba(255,255,255,0.055)',
              borderRadius:3,
              textAlign:'center',
            }}>
              <div style={{ ...EB, marginBottom:'.75rem' }}>Prefer to watch?</div>
              <p style={{
                fontFamily:'Oswald, Arial, sans-serif',
                fontSize: isMobile ? '.86rem' : '.92rem',
                fontWeight:300, color:'rgba(255,255,255,.38)',
                lineHeight:1.7, marginBottom:'1.35rem',
              }}>
                The whole setup, start to finish, in under a minute.
              </p>
              <a
                href={VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ fontSize: isMobile ? '.8rem' : '.88rem', padding: isMobile ? '13px 24px' : '15px 34px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink:0 }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                See the setup video
              </a>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. INSTALL — Add to Home Screen
            Copied from the landing page so it reads as the same section.
        ════════════════════════════════════════════════════════════ */}
        <section id="install" style={{ padding: SP, position: 'relative', overflow: 'hidden', borderTop:'1px solid rgba(255,255,255,0.045)', background:'#030303' }}>
          {/* Subtle grid backdrop — matches hero / final CTA treatment */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 12%, transparent 72%)',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 12%, transparent 72%)',
            opacity: isMobile ? 0.5 : 1,
          }} />
          {/* Soft glow */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 720, height: 460,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 65%)',
            filter: 'blur(8px)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 2 }}>

            {/* Header */}
            <div className="reveal" style={{ textAlign: 'center', marginBottom: isMobile ? 'clamp(2rem,5vw,3rem)' : 'clamp(3.5rem,7vw,5.5rem)' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px 5px 7px',
                background: 'rgba(255,255,255,0.032)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                marginBottom: isMobile ? '1rem' : '1.5rem',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#fff', animation: 'dotBlink 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily: 'Oswald, Arial, sans-serif',
                  fontSize: isMobile ? '.63rem' : '.7rem',
                  fontWeight: 500, color: 'rgba(255,255,255,.5)',
                  letterSpacing: '.22em', textTransform: 'uppercase',
                }}>Install on iPhone</span>
              </div>
              <h2 style={H2}>
                Your dashboard,<br />
                <span style={{ fontWeight: 300, color: 'rgba(255,255,255,.42)' }}>on your home screen.</span>
              </h2>
              <p style={SUB}>
                Add Tapped-In to your iPhone in four steps. No app store. No download. Just a tap.
              </p>
            </div>

            {/* Split layout: phone left, steps right (stacks on mobile) */}
            <div className="profile-cols reveal d1" style={{
              display: 'flex',
              gap: isMobile ? '2.5rem' : 'clamp(3rem,6vw,5.5rem)',
              alignItems: 'center', justifyContent: 'center',
              flexWrap: 'wrap',
            }}>

              {/* Phone column */}
              <div style={{
                flex: '0 1 auto',
                display: 'flex', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: isMobile ? -40 : -80,
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 65%)',
                  animation: 'glowPulse 5s ease-in-out infinite',
                  borderRadius: '50%', filter: 'blur(20px)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'relative',
                  animation: 'cardFloat 7s ease-in-out infinite',
                  transformOrigin: 'center',
                }}>
                  <InstallPhoneMockup scale={isMobile ? 0.78 : 1} />
                </div>
              </div>

              {/* Steps column */}
              <div style={{
                flex: '1 1 380px',
                maxWidth: isMobile ? '100%' : 460,
                display: 'flex', flexDirection: 'column',
                gap: '.65rem',
              }}>
                {[
                  { n: '01', title: 'Open in Safari',         body: 'Visit tappedin.uk/dashboard from your iPhone using Safari.' },
                  { n: '02', title: 'Tap the Share button',   body: 'Located at the bottom of the screen — the square with an arrow pointing up.' },
                  { n: '03', title: 'Add to Home Screen',     body: 'Scroll the share menu and select Add to Home Screen.' },
                  { n: '04', title: 'Instant access',         body: 'Your Tapped-In dashboard now lives on your home screen. Open it like any app.' },
                ].map((s, i) => (
                  <div
                    key={s.n}
                    className={`reveal d${i + 2}`}
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(148deg, rgba(14,14,14,0.85) 0%, rgba(8,8,8,0.9) 100%)',
                      backdropFilter: 'blur(12px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                      border: '1px solid rgba(255,255,255,0.055)',
                      borderRadius: 3,
                      padding: isMobile ? '1.1rem 1.1rem' : '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: isMobile ? '.9rem' : '1.25rem',
                      transition: 'border-color .3s, transform .3s cubic-bezier(0.16,1,0.3,1), background .3s',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Top edge highlight */}
                    <div style={{
                      position: 'absolute', top: 0, left: '6%', right: '6%', height: 1,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)',
                      pointerEvents: 'none',
                    }} />

                    {/* Number */}
                    <div style={{
                      flexShrink: 0,
                      width: isMobile ? 36 : 42,
                      height: isMobile ? 36 : 42,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Oswald, Arial, sans-serif',
                      fontSize: isMobile ? '.72rem' : '.78rem',
                      fontWeight: 500,
                      letterSpacing: '.14em',
                      color: 'rgba(255,255,255,0.55)',
                    }}>
                      {s.n}
                    </div>

                    {/* Copy */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'Oswald, Arial, sans-serif',
                        fontSize: isMobile ? '.98rem' : '1.08rem',
                        fontWeight: 500,
                        color: '#fff',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        marginBottom: '.35rem',
                        lineHeight: 1.2,
                      }}>
                        {s.title}
                      </h3>
                      <p style={{
                        fontFamily: 'Oswald, Arial, sans-serif',
                        fontSize: isMobile ? '.82rem' : '.86rem',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.38)',
                        lineHeight: 1.68,
                        letterSpacing: '0.01em',
                      }}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Footnote */}
                <div className="reveal d6" style={{
                  marginTop: '.65rem',
                  padding: isMobile ? '.85rem 1rem' : '.9rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  background: 'rgba(255,255,255,0.018)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 3,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.35)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'Oswald, Arial, sans-serif',
                    fontSize: isMobile ? '.72rem' : '.76rem',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.32)',
                    letterSpacing: '.06em',
                    lineHeight: 1.5,
                  }}>
                    iPhone only. Android users can pin via Chrome menu › Add to Home screen.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. FOOTER
        ════════════════════════════════════════════════════════════ */}
        <footer style={{
          borderTop:'1px solid rgba(255,255,255,0.045)',
          padding: isMobile ? '2.5rem 1.25rem 2rem' : 'clamp(3rem,6vw,5rem) clamp(1.5rem,5vw,3rem) 2.5rem',
          background:'#030303',
        }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="footer-cols" style={{ display:'flex', justifyContent:'space-between', gap:'3rem', marginBottom:'2.5rem', flexWrap:'wrap' }}>
              <div style={{ maxWidth:280 }}>
                <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.05rem', fontWeight:600, letterSpacing:'.3em', color:'#fff', marginBottom:'.7rem', textTransform:'uppercase' }}>TAPPED-IN</div>
                <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:300, color:'rgba(255,255,255,.18)', lineHeight:1.7, letterSpacing:'0.01em' }}>The New Standard for Networking. Premium NFC digital identity for creators and professionals.</p>
                <div style={{ display:'flex', gap:'.55rem', marginTop:'1.35rem' }}>
                  {[
                    { label:'Instagram', href:'https://www.instagram.com/tappedinspace/', icon:(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg>) },
                    { label:'TikTok', href:'https://www.tiktok.com/@tappedinspace', icon:(<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.7 3.6 3.8 3.9v2.4c-1.3 0-2.5-.4-3.6-1.1v5.7c0 3-2.2 5.2-5.1 5.2S6 18.8 6 16.1c0-2.6 2-4.8 4.7-4.9v2.5c-1.3.1-2.2 1.1-2.2 2.4 0 1.4 1 2.4 2.3 2.4 1.4 0 2.4-1 2.4-2.7V3h2.8z"/></svg>) },
                    { label:'LinkedIn', href:'https://www.linkedin.com/company/tappedinspace/', icon:(<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4z"/></svg>) },
                  ].map((soc)=>(
                    <a key={soc.label} href={soc.href} target="_blank" rel="noopener noreferrer" aria-label={soc.label} className="footer-social"
                      style={{ width:38, height:38, borderRadius:8, border:'1px solid rgba(255,255,255,0.09)', background:'rgba(255,255,255,0.02)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.45)', textDecoration:'none', transition:'color .2s, border-color .2s, background .2s' }}>
                      {soc.icon}
                    </a>
                  ))}
                </div>
              </div>
              <div className="footer-links" style={{ display:'flex', gap:'4rem', flexWrap:'wrap' }}>
                {[
                  { head:'Drop',    links:[['/','The Card'],['/insights','Blogs'],['/demo','Demo profile']] },
                  { head:'Account', links:[['/signup','Order'],['/login','Sign in'],['/dashboard','Dashboard']] },
                  { head:'Connect', links:[['/contact','Contact us'],['/pricing','Pricing']] },
                ].map(col=>(
                  <div key={col.head} style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:500, letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:'.2rem' }}>{col.head}</div>
                    {col.links.map(([href,label])=>
                      (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http'))
                        ? <a key={href} href={href} className="footer-link" {...(href.startsWith('http') ? { target:'_blank', rel:'noopener noreferrer' } : {})}>{label}</a>
                        : <Link key={href} href={href} className="footer-link">{label}</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:'1.5rem', flexWrap:'wrap', gap:'.5rem' }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.14)', letterSpacing:'0.04em' }}>© 2026 Tapped-In. All rights reserved.</span>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.1)', letterSpacing:'0.06em', textTransform:'uppercase' }}>tappedin.uk</span>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
