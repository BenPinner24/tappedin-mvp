'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FOUNDERS_STRIPE_URL = 'https://buy.stripe.com/dRm8wR9TzeXvaRb5WvcfK00'

// ── EDIT ME ───────────────────────────────────────────────────────────────────
// Real number of Founder cards already claimed (0–100). Drives the
// "X / 100 claimed" counter + progress bar in the Founding section below.
const FOUNDERS_CLAIMED = 16
// Optional: real founder @handles to show a "Founding members" chip row.
// Leave as [] to hide the row entirely. e.g. ['@benpinner', '@studio.xyz']
const FOUNDING_MEMBERS: string[] = []
// ──────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────
// GLOBAL CSS
// IMPORTANT: React inline style={{}} always wins over stylesheet rules.
// Anything that varies per breakpoint is driven by the `isMobile` JS state flag
// so the correct value is set directly on the element. The CSS block below only
// handles classes that have NO conflicting inline style on the same property.
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

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// CARD COMPONENTS
// `scale` prop lets mobile sites render the card at e.g. 0.65× without changing
// the logical CardSize — keeps all internal proportions correct.
// ─────────────────────────────────────────────────────────────────────────────

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`
const STEP3_IMG = "data:image/jpeg;base64,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"

type CardSize = 'hero' | 'lg' | 'sm'
const DIMS: Record<CardSize, { w: number; r: number }> = {
  hero: { w: 400, r: 22 },
  lg:   { w: 370, r: 22 },
  sm:   { w: 240, r: 14 },
}

function NfcArcs({ size, up, scale = 1 }: { size: CardSize; up: boolean; scale?: number }) {
  const base = size === 'sm' ? 0.65 : 1
  const s = base * scale
  const W = Math.round(36 * s)
  const H = Math.round(3 * s)
  const GAP = Math.round(5 * s)
  return (
    <div style={{ display:'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems:'center', gap: GAP }}>
      {[1, 0.62, 0.35].map((op, i) => (
        <div key={i} style={{ width: W - i * Math.round(8 * s), height: H, borderRadius: H, background: `rgba(255,255,255,${op * 0.88})` }} />
      ))}
    </div>
  )
}

function CardFront({ size = 'lg', float = false, scanLine = false, scale = 1 }: { size?: CardSize; float?: boolean; scanLine?: boolean; scale?: number }) {
  const { w, r } = DIMS[size]
  const h = Math.round(w / 1.586)
  const sw = Math.round(w * scale)
  const sh = Math.round(h * scale)
  const sr = Math.round(r * scale)
  return (
    <div style={{
      position:'relative', width: sw, height: sh, borderRadius: sr,
      background:'linear-gradient(148deg, #191919 0%, #121212 30%, #0e0e0e 55%, #161616 85%, #1a1a1a 100%)',
      boxShadow: size === 'hero'
        ? '0 0 0 1.5px rgba(255,255,255,0.1), 0 2px 0 2px rgba(255,255,255,0.04), 0 60px 120px rgba(0,0,0,0.98), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)'
        : size === 'lg'
        ? '0 0 0 1px rgba(255,255,255,0.09), 0 40px 80px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.06)'
        : '0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.85)',
      animation: float ? 'cardFloat 7s ease-in-out infinite' : 'none',
      overflow:'hidden', flexShrink:0,
    }}>
      <div style={{ position:'absolute', inset:0, zIndex:1, opacity:.055, backgroundImage: GRAIN, backgroundSize:'180px 180px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1.5, zIndex:4, background:'linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.14) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.14) 70%, transparent 96%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, bottom:0, left:0, width:1, zIndex:4, background:'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, bottom:0, right:0, width:2.5, zIndex:4, background:'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2.5, zIndex:4, background:'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04))', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'48%', zIndex:2, background:'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius:`${sr}px ${sr}px 0 0`, pointerEvents:'none' }} />
      {scanLine && (
        <div style={{ position:'absolute', left:0, right:0, height:1, zIndex:5, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 35%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 65%, transparent)', animation:'scanBeam 5s ease-in-out infinite', pointerEvents:'none' }} />
      )}
      <div style={{ position:'absolute', inset:0, zIndex:3, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: size === 'sm' ? Math.round(6 * scale) : Math.round(9 * scale) }}>
        <NfcArcs size={size} up scale={scale} />
        <div style={{
          fontFamily:'Oswald, Arial, sans-serif', fontWeight:600,
          fontSize: `${(size === 'sm' ? 0.72 : size === 'hero' ? 1.1 : 1.0) * scale}rem`,
          letterSpacing: size === 'sm' ? '0.22em' : '0.28em',
          color:'rgba(255,255,255,0.9)', textTransform:'uppercase', lineHeight:1, userSelect:'none',
        }}>TAPPED-IN</div>
        <NfcArcs size={size} up={false} scale={scale} />
      </div>
    </div>
  )
}

function CardBack({ size = 'lg', float = false, scale = 1 }: { size?: CardSize; float?: boolean; scale?: number }) {
  const { w, r } = DIMS[size]
  const h = Math.round(w / 1.586)
  const sw = Math.round(w * scale)
  const sh = Math.round(h * scale)
  const sr = Math.round(r * scale)
  const pad = Math.round((size === 'sm' ? 14 : size === 'hero' ? 26 : 24) * scale)
  const stripH = Math.round((size === 'sm' ? 18 : 26) * scale)
  const stripW = Math.round(w * 0.46 * scale)
  const labelSize = `${(size === 'sm' ? 0.42 : 0.6) * scale}rem`
  const numSize = `${(size === 'sm' ? 0.4 : 0.58) * scale}rem`
  return (
    <div style={{
      position:'relative', width: sw, height: sh, borderRadius: sr,
      background:'linear-gradient(148deg, #232323 0%, #1d1d1d 25%, #1a1a1a 50%, #202020 75%, #242424 100%)',
      boxShadow: size === 'hero'
        ? '0 0 0 1.5px rgba(255,255,255,0.1), 0 2px 0 2px rgba(255,255,255,0.04), 0 60px 120px rgba(0,0,0,0.98), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
        : size === 'lg'
        ? '0 0 0 1px rgba(255,255,255,0.09), 0 40px 80px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.85)',
      animation: float ? 'cardFloatBack 7s ease-in-out infinite 1.2s' : 'none',
      overflow:'hidden', flexShrink:0,
    }}>
      <div style={{ position:'absolute', inset:0, zIndex:1, opacity:.085, backgroundImage: GRAIN, backgroundSize:'160px 160px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1.5, zIndex:4, background:'linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 70%, transparent 96%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, bottom:0, right:0, width:2.5, zIndex:4, background:'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 100%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2.5, zIndex:4, background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03))', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, right:0, width:'65%', height:'60%', zIndex:2, background:'radial-gradient(ellipse at 85% 10%, rgba(255,255,255,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top: pad, right: pad, zIndex:3, display:'flex', flexDirection:'column', alignItems:'flex-end', gap: size === 'sm' ? 3 : 5 }}>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: labelSize, fontWeight:600, letterSpacing:'0.14em', color:'rgba(255,255,255,0.9)', textTransform:'uppercase', lineHeight:1 }}>FOUNDER EDITION</div>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: numSize, fontWeight:500, letterSpacing:'0.1em', color:'rgba(255,255,255,0.72)', lineHeight:1 }}>1/100</div>
      </div>
      <div style={{ position:'absolute', bottom: pad, left: pad, display:'flex', alignItems:'center', gap: size === 'sm' ? 8 : 12, zIndex:3 }}>
        <div style={{ width: stripW, height: stripH, background:'rgba(255,255,255,0.9)', borderRadius:2, boxShadow:'0 1px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)' }} />
        <div style={{ display:'flex', alignItems:'center', gap: size === 'sm' ? 2 : 3 }}>
          {[0.3, 0.55, 0.8].map((op, i) => {
            const barH = Math.round((size === 'sm' ? 6 + i * 3 : 10 + i * 5) * scale)
            return <div key={i} style={{ width: size === 'sm' ? 1.5 : 2.5, height: barH, borderRadius:2, background:`rgba(255,255,255,${op})` }} />
          })}
        </div>
      </div>
    </div>
  )
}

// ── Desktop hero card — overflowing stat badges (fine on large screens)
function HeroCardDesktop() {
  return (
    <div style={{ position:'relative', maxWidth:420, margin:'0 auto' }}>
      <div style={{ position:'absolute', inset:'-90px', background:'radial-gradient(ellipse at 42% 52%, rgba(255,255,255,0.055) 0%, transparent 62%)', animation:'glowPulse 4.5s ease-in-out infinite', pointerEvents:'none', borderRadius:'50%', filter:'blur(22px)' }} />
      <CardFront size="hero" float scanLine />
      <div style={{ position:'absolute', top:-16, right:-14, zIndex:10, background:'rgba(10,10,10,0.92)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px', textAlign:'center', animation:'fadeIn 1s ease .9s both' }}>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.2rem', fontWeight:600, color:'#fff', lineHeight:1 }}>312</div>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'0.6rem', fontWeight:400, color:'rgba(255,255,255,.32)', marginTop:3, letterSpacing:'0.08em', textTransform:'uppercase' }}>taps this week</div>
      </div>
      <div style={{ position:'absolute', bottom:-14, left:-16, zIndex:10, background:'rgba(10,10,10,0.92)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px', textAlign:'center', animation:'fadeIn 1s ease 1.1s both' }}>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.2rem', fontWeight:600, color:'#fff', lineHeight:1 }}>89%</div>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'0.6rem', fontWeight:400, color:'rgba(255,255,255,.32)', marginTop:3, letterSpacing:'0.08em', textTransform:'uppercase' }}>click-through</div>
      </div>
    </div>
  )
}

// ── Mobile hero card — scaled down, badges in-flow (no negative positioning
//    that creates phantom height / blank gap below the section)
function HeroCardMobile() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', width:'100%' }}>
      <div style={{ position:'relative', display:'inline-block' }}>
        {/* Contained glow — no overflow */}
        <div style={{ position:'absolute', inset:-32, background:'radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.05) 0%, transparent 65%)', animation:'glowPulse 4.5s ease-in-out infinite', pointerEvents:'none', borderRadius:'50%', filter:'blur(14px)' }} />
        <CardFront size="hero" float scanLine scale={0.66} />
      </div>
      {/* Stat badges as normal flow elements — no absolute positioning */}
      <div style={{ display:'flex', gap:'.65rem', justifyContent:'center', animation:'fadeIn 1s ease .9s both' }}>
        {[{ n:'312', l:'taps this week' }, { n:'89%', l:'click-through' }].map(({ n, l }) => (
          <div key={l} style={{
            background:'rgba(12,12,12,0.96)', backdropFilter:'blur(16px)',
            WebkitBackdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:10,
            padding:'9px 14px', textAlign:'center',
          }}>
            <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.05rem', fontWeight:600, color:'#fff', lineHeight:1 }}>{n}</div>
            <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'0.58rem', fontWeight:400, color:'rgba(255,255,255,.32)', marginTop:3, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
// iPHONE MOCKUP — used in the Install section. Matte, minimal, on-brand.
// Renders a small device frame containing the "Add to Home Screen" sheet.
// ─────────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE TOKENS
// ─────────────────────────────────────────────────────────────────────────────
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
const DIVIDER: React.CSSProperties = {
  height:1, background:'rgba(255,255,255,0.055)',
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW-IT-WORKS MOCKUPS
// A reusable matte iPhone shell + three "screens": the tap moment, the live
// profile, and the analytics view. Same materials as the card + install mockup
// (gradient body, grain, edge highlight, dynamic island) so it reads as one
// product family. All sizing flows from `scale`.
// ─────────────────────────────────────────────────────────────────────────────
function PhoneShell({ scale = 1, children }: { scale?: number; children?: React.ReactNode }) {
  const W = Math.round(258 * scale)
  const H = Math.round(540 * scale)
  return (
    <div style={{
      position:'relative', width:W, height:H,
      borderRadius: Math.round(42 * scale),
      background:'linear-gradient(155deg, #1a1a1a 0%, #0d0d0d 50%, #141414 100%)',
      boxShadow:'0 0 0 1.5px rgba(255,255,255,0.07), 0 60px 120px rgba(0,0,0,0.92), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      padding: Math.round(7 * scale), flexShrink:0, isolation:'isolate',
    }}>
      <div style={{ position:'absolute', inset:0, opacity:0.06, backgroundImage:GRAIN, backgroundSize:'180px 180px', borderRadius:'inherit', pointerEvents:'none', zIndex:2 }} />
      <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1.5, zIndex:3, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)', pointerEvents:'none' }} />
      <div style={{
        position:'relative', width:'100%', height:'100%',
        borderRadius: Math.round(36 * scale),
        background:'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
        overflow:'hidden', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.025)',
      }}>
        {/* Dynamic island */}
        <div style={{ position:'absolute', top:Math.round(11 * scale), left:'50%', transform:'translateX(-50%)', width:Math.round(82 * scale), height:Math.round(24 * scale), borderRadius:Math.round(14 * scale), background:'#000', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.04)', zIndex:8 }} />
        {/* Status bar */}
        <div style={{ position:'absolute', top:Math.round(16 * scale), left:0, right:0, padding:`0 ${Math.round(22 * scale)}px`, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'Oswald, Arial, sans-serif', fontSize:`${0.58 * scale}rem`, fontWeight:500, color:'rgba(255,255,255,0.55)', letterSpacing:'0.04em', zIndex:7 }}>
          <span>9:41</span>
          <span style={{ display:'flex', gap:Math.round(4 * scale), alignItems:'center' }}>
            <span style={{ width:Math.round(14 * scale), height:Math.round(7 * scale), borderRadius:1.5, border:'1px solid rgba(255,255,255,0.4)', position:'relative' }}>
              <span style={{ position:'absolute', inset:1, background:'rgba(255,255,255,0.4)', borderRadius:0.5 }} />
            </span>
          </span>
        </div>
        {/* Screen content */}
        <div style={{ position:'absolute', inset:0, paddingTop:Math.round(44 * scale), display:'flex', flexDirection:'column' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function MockProfile({ scale = 1 }: { scale?: number }) {
  const r = (n: number) => Math.round(n * scale)
  const f = (n: number) => `${n * scale}rem`
  const links = [
    { l: 'Instagram', icon: <svg width={r(13)} height={r(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></svg> },
    { l: 'TikTok', icon: <svg width={r(13)} height={r(13)} viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.7 3.6 3.8 3.9v2.4c-1.3 0-2.5-.4-3.6-1.1v5.7c0 3-2.2 5.2-5.1 5.2S6 18.8 6 16.1c0-2.6 2-4.8 4.7-4.9v2.5c-1.3.1-2.2 1.1-2.2 2.4 0 1.4 1 2.4 2.3 2.4 1.4 0 2.4-1 2.4-2.7V3h2.8z" /></svg> },
    { l: 'Showreel', icon: <svg width={r(12)} height={r(12)} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> },
    { l: 'WhatsApp', icon: <svg width={r(13)} height={r(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21l1.6-4.2A8 8 0 1 1 8 19.5L3 21z" /></svg> },
  ]
  return (
    <PhoneShell scale={scale}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: `0 ${r(15)}px ${r(12)}px` }}>
        {/* Header: handle + Active */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: r(9) }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.42), letterSpacing: '.24em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' }}>TAPPED-IN</div>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.5), letterSpacing: '.04em', color: 'rgba(255,255,255,.42)' }}>@lucasgrey</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: r(4), padding: `${r(2)}px ${r(7)}px`, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 99, flexShrink: 0 }}>
            <div style={{ width: r(4), height: r(4), borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.44), fontWeight: 500, color: 'rgba(255,255,255,.7)', letterSpacing: '.08em' }}>Active</span>
          </div>
        </div>

        {/* Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: r(46), height: r(46), borderRadius: r(13), background: 'linear-gradient(145deg, #242424 0%, #0e0e0e 55%, #181818 100%)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 10px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.85), fontWeight: 600, color: 'rgba(255,255,255,.8)', letterSpacing: '0.06em', marginBottom: r(8) }}>LG</div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.42), letterSpacing: '.28em', color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', marginBottom: r(3) }}>Digital Profile</div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(1.1), fontWeight: 600, color: '#fff', letterSpacing: '0.01em', lineHeight: 1.05 }}>Lucas Grey</div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.54), fontWeight: 400, color: 'rgba(255,255,255,.4)', letterSpacing: '.04em', marginTop: r(2) }}>Director · Filmmaker</div>

          {/* Founder Edition badge */}
          <div style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid rgba(255,255,255,0.16)', borderRadius: r(6), overflow: 'hidden', marginTop: r(9) }}>
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.44), fontWeight: 500, color: 'rgba(255,255,255,.6)', letterSpacing: '.16em', textTransform: 'uppercase', padding: `${r(4)}px ${r(8)}px` }}>Founder Edition</span>
            <span style={{ width: 1, background: 'rgba(255,255,255,0.16)' }} />
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.46), fontWeight: 600, color: '#fff', letterSpacing: '.08em', padding: `${r(4)}px ${r(8)}px`, background: 'rgba(255,255,255,0.05)' }}>014 / 100</span>
          </div>

          {/* Bio */}
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.52), fontWeight: 300, color: 'rgba(255,255,255,.38)', lineHeight: 1.55, letterSpacing: '.01em', marginTop: r(9), maxWidth: '96%' }}>Film &amp; brand work for artists and labels.<br />London-based · Enquiries via DM.</div>
        </div>

        {/* Save contact (white, primary) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: r(6), marginTop: r(11), padding: `${r(10)}px`, borderRadius: r(9), background: '#fff', color: '#000' }}>
          <svg width={r(13)} height={r(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.6), fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Save contact</span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: `${r(10)}px 0` }} />

        {/* Link rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: r(6) }}>
          {links.map((b) => (
            <div key={b.l} style={{ display: 'flex', alignItems: 'center', padding: `${r(8)}px ${r(11)}px`, borderRadius: r(9), border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.022)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', width: r(16) }}>{b.icon}</span>
              <span style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.58), fontWeight: 500, color: 'rgba(255,255,255,.82)', letterSpacing: '.06em' }}>{b.l}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: f(0.58), width: r(16), textAlign: 'right' }}>↗</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: r(10), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.4), letterSpacing: '.22em', color: 'rgba(255,255,255,.26)', textTransform: 'uppercase' }}>TAPPED-IN</div>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.42), fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.2)' }}>The New Standard for Networking.</div>
          </div>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.44), color: 'rgba(255,255,255,.4)', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>Get your card →</span>
        </div>
      </div>
    </PhoneShell>
  )
}

function MockAnalytics({ scale = 1, isMobile = false }: { scale?: number; isMobile?: boolean }) {
  const r = (n: number) => Math.round(n * scale)
  const f = (n: number) => `${n * scale}rem`
  const bars = [0.42, 0.6, 0.5, 0.82, 0.7, 1, 0.56]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const stats = [
    { v: '1,204', l: 'Clicks' },
    { v: '86', l: 'Saved' },
    { v: '45', l: 'Avg / day' },
  ]
  const top = [
    { l: 'Instagram', c: 256, v: 0.82 },
    { l: 'Showreel', c: 168, v: 0.54 },
    { l: 'Book a shoot', c: 103, v: 0.33 },
  ]
  return (
    <PhoneShell scale={scale}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `0 ${r(15)}px ${r(15)}px` }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.5), letterSpacing: '.2em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' }}>Analytics</span>
          <div style={{ width: r(22), height: r(22), borderRadius: r(7), background: 'linear-gradient(145deg, #1c1c1c, #0e0e0e)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.42), fontWeight: 600, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em' }}>LG</div>
        </div>

        {/* Hero stat */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: r(7) }}>
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(2.1), fontWeight: 600, color: '#fff', lineHeight: 1 }}>312</span>
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.52), color: 'rgba(255,255,255,.32)', letterSpacing: '.12em', textTransform: 'uppercase' }}>taps</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: r(2), marginLeft: 'auto', fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.52), fontWeight: 500, color: '#4ade80', letterSpacing: '.04em' }}>▲ 18%</span>
          </div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.46), color: 'rgba(255,255,255,.26)', letterSpacing: '.14em', textTransform: 'uppercase', marginTop: r(3) }}>This week · vs 264 last</div>
        </div>

        {/* Bar chart */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: r(6), height: r(74) }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ height: `${b * 100}%`, background: i === 5 ? 'linear-gradient(180deg,#fff,rgba(255,255,255,0.72))' : 'rgba(255,255,255,0.14)', borderRadius: r(2), boxShadow: i === 5 ? '0 0 12px rgba(255,255,255,0.3)' : 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: r(6), marginTop: r(5) }}>
            {days.map((d, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.42), color: i === 5 ? 'rgba(255,255,255,.72)' : 'rgba(255,255,255,.22)', letterSpacing: '.04em' }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Mini stat row */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {stats.map((s, i) => (
            <div key={s.l} style={{ flex: 1, padding: `${r(9)}px 0`, textAlign: 'center', borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.84), fontWeight: 600, color: '#fff', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.4), color: 'rgba(255,255,255,.28)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: r(3) }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Top links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: r(8) }}>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.46), letterSpacing: '.2em', color: 'rgba(255,255,255,.28)', textTransform: 'uppercase' }}>Top links</div>
          {top.map((t) => (
            <div key={t.l}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: r(4) }}>
                <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.54), color: 'rgba(255,255,255,.62)', letterSpacing: '.03em' }}>{t.l}</span>
                <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.5), color: 'rgba(255,255,255,.34)' }}>{t.c} · {Math.round(t.v * 100)}%</span>
              </div>
              <div style={{ height: r(4), borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${t.v * 100}%`, height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.7))', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: r(6) }}>
          <div style={{ width: r(5), height: r(5), borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)', animation: 'dotBlink 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.46), color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Updated just now</span>
        </div>
      </div>
    </PhoneShell>
  )
}

function MockTap({ scale = 1 }: { scale?: number }) {
  const r = (n: number) => Math.round(n * scale)
  const f = (n: number) => `${n * scale}rem`
  return (
    <div style={{ position: 'relative', display: 'inline-block', paddingTop: r(60) }}>
      <PhoneShell scale={scale}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: r(12) }}>
          {/* Concentric ripples */}
          <div style={{ position: 'absolute', top: '47%', left: '50%', transform: 'translate(-50%,-50%)', width: r(190), height: r(190), pointerEvents: 'none' }}>
            {[1, 0.66, 0.36].map((s2, i) => (
              <div key={i} style={{ position: 'absolute', inset: `${(1 - s2) * 50}%`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', animation: `glowPulse ${3 + i * 0.6}s ease-in-out infinite` }} />
            ))}
          </div>
          {/* NFC mark */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: r(4), zIndex: 2 }}>
            {[0.3, 0.55, 0.85].map((op, i) => (
              <div key={i} style={{ width: r(34) - i * r(8), height: r(3), borderRadius: r(3), background: `rgba(255,255,255,${op})` }} />
            ))}
          </div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.78), fontWeight: 600, letterSpacing: '.3em', color: '#fff', textTransform: 'uppercase', zIndex: 2 }}>TAPPED-IN</div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: f(0.5), letterSpacing: '.24em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', zIndex: 2 }}>Connecting…</div>
        </div>
      </PhoneShell>
      {/* NFC contact glow where the card meets the phone */}
      <div style={{ position: 'absolute', top: r(42), left: '50%', width: r(150), height: r(150), transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 62%)', filter: 'blur(10px)', animation: 'glowPulse 3s ease-in-out infinite', pointerEvents: 'none', zIndex: 4, borderRadius: '50%' }} />
      {/* Card tapping the top edge — mostly above the phone, fully visible, clears the logo */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) rotate(-7deg)', filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.75))', zIndex: 20 }}>
        <CardFront size="sm" scale={0.82 * scale} />
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// PROFILE QR — distinct "scan to open" access card for the Digital Identity section.
// Decorative (non-scannable) QR built deterministically; light float + scan beam.
// ─────────────────────────────────────────────────────────────────────────────
function ProfileQR({ isMobile }: { isMobile: boolean }) {
  const N = 21
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7)
  const finderOn = (r: number, c: number) => {
    const ring = (br: number, bc: number) => {
      const rr = r - br, cc = c - bc
      if (rr === 0 || rr === 6 || cc === 0 || cc === 6) return true
      if (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) return true
      return false
    }
    if (r < 7 && c < 7) return ring(0, 0)
    if (r < 7 && c >= N - 7) return ring(0, N - 7)
    return ring(N - 7, 0)
  }
  const inLogo = (r: number, c: number) => r >= 8 && r <= 12 && c >= 8 && c <= 12
  let seed = 718
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  const mods: [number, number][] = []
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let on = false
    if (inFinder(r, c)) on = finderOn(r, c)
    else if (inLogo(r, c)) on = false
    else on = rnd() > 0.52
    if (on) mods.push([r, c])
  }
  const qrSize = isMobile ? 188 : 224

  return (
    <div style={{ position: 'relative', maxWidth: isMobile ? 320 : 380, margin: '0 auto' }}>
      <div style={{ position: 'absolute', inset: isMobile ? -28 : -60, background: 'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.05) 0%, transparent 62%)', filter: 'blur(20px)', animation: 'glowPulse 6s ease-in-out infinite', pointerEvents: 'none', borderRadius: '50%' }} />

      <div style={{
        position: 'relative',
        background: 'linear-gradient(155deg, rgba(14,14,14,0.96) 0%, rgba(9,9,9,0.98) 55%, rgba(12,12,12,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? 18 : 22,
        overflow: 'hidden',
        boxShadow: '0 50px 100px rgba(0,0,0,0.75), 0 20px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'cardFloat 7s ease-in-out infinite',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '180px 180px', pointerEvents: 'none', mixBlendMode: 'overlay' }} />

        {/* header */}
        <div style={{ padding: isMobile ? '.95rem 1.15rem' : '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.045)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.56rem' : '.6rem', fontWeight: 400, letterSpacing: '.18em', color: 'rgba(255,255,255,.22)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>tappedin.uk/u/lucasgrey</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px 3px 7px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.14)', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)', animation: 'dotBlink 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.55rem' : '.58rem', fontWeight: 500, color: 'rgba(74,222,128,0.85)', letterSpacing: '.16em', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>

        {/* QR */}
        <div style={{ padding: isMobile ? '1.5rem 1.15rem 1.25rem' : '2rem 1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: qrSize, height: qrSize }}>
            <div style={{ position: 'absolute', left: '4%', right: '4%', top: 0, height: 2, zIndex: 3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 50%, transparent)', boxShadow: '0 0 12px rgba(255,255,255,0.4)', animation: 'scanBeam 3.4s ease-in-out infinite', pointerEvents: 'none' }} />
            <svg width={qrSize} height={qrSize} viewBox={`0 0 ${N} ${N}`} style={{ display: 'block' }}>
              {mods.map(([r, c], i) => (
                <rect key={i} x={c + 0.09} y={r + 0.09} width={0.82} height={0.82} rx={0.26} fill="rgba(255,255,255,0.92)" />
              ))}
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '24%', height: '24%', borderRadius: 6, background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {[1, 0.6, 0.32].map((op, i) => (<div key={i} style={{ width: (isMobile ? 13 : 15) - i * 3, height: 2, borderRadius: 2, background: `rgba(255,255,255,${op})` }} />))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: isMobile ? '1.1rem' : '1.4rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.92rem' : '1.02rem', fontWeight: 500, color: '#fff', letterSpacing: '.02em' }}>Scan to open the profile</div>
            <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.66rem' : '.7rem', fontWeight: 300, color: 'rgba(255,255,255,.34)', letterSpacing: '.04em', marginTop: 4 }}>No app needed · works on any phone</div>
          </div>
        </div>

        {/* footer strip */}
        <div style={{ padding: isMobile ? '.75rem 1.15rem' : '.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.045)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.55rem' : '.6rem', fontWeight: 500, color: 'rgba(255,255,255,.22)', letterSpacing: '.18em', textTransform: 'uppercase' }}>QR · Custom URL</span>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? '.55rem' : '.6rem', fontWeight: 400, color: 'rgba(255,255,255,.2)', letterSpacing: '.08em' }}>Google-indexed</span>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  useReveal()
  const [scrolled, setScrolled]   = useState(false)
  const [isMobile, setIsMobile]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mockNonce, setMockNonce] = useState<Record<number, number>>({})

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onResize = () => setIsMobile(window.innerWidth <= 768)

    window.addEventListener('scroll', onScroll, { passive:true })
    window.addEventListener('resize', onResize, { passive:true })

    // Initialise synchronously
    onScroll()
    onResize()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Mobile menu: lock background scroll while open; auto-close on desktop.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!isMobile && menuOpen) setMenuOpen(false)
  }, [isMobile, menuOpen])

  // iOS Safari can fail to paint a heavily-composited element that first appears
  // below the fold (it only shows after a rotate). Force a one-off repaint of each
  // how-it-works phone the moment it scrolls into view — the same thing rotating does.
  useEffect(() => {
    if (!isMobile) return
    const mocks = Array.from(document.querySelectorAll('.howit-mock')) as HTMLElement[]
    if (!mocks.length) return
    let primed = false
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && primed) {
          const idx = Number((e.target as HTMLElement).dataset.idx)
          setMockNonce((prev) => (prev[idx] ? prev : { ...prev, [idx]: 1 }))
          obs.unobserve(e.target)
        }
      })
      primed = true
    }, { threshold: 0.01 })
    mocks.forEach((m) => obs.observe(m))
    return () => obs.disconnect()
  }, [isMobile])

  // Shared section padding — driven by JS so inline style values are correct
  const SP = isMobile
    ? 'clamp(3rem,8vw,4.5rem) clamp(1.25rem,5vw,1.5rem)'
    : 'clamp(6rem,12vw,9rem) clamp(1.5rem,5vw,3rem)'

  // Nav glass — always visible on mobile, scroll-triggered on desktop
  const navGlass = isMobile || scrolled

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />

      {/* ──────────────────────────────────────────────────────────────
          NAV
          Mobile: always glassed (never transparent), height 56px,
          "Sign in" hidden, "Reserve now" shrunk to "Reserve".
          Desktop: unchanged.
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
          maxWidth:1160, margin:'0 auto',
          height: isMobile ? 56 : 64,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap: isMobile ? '.75rem' : '2rem',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            fontFamily:'Oswald, Arial, sans-serif',
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight:600, letterSpacing:'0.28em',
            color:'#fff', textDecoration:'none',
            whiteSpace:'nowrap', textTransform:'uppercase',
          }}>TAPPED-IN</Link>

          {/* Desktop nav links */}
          {!isMobile && (
            <nav style={{ display:'flex', gap:'2rem', flex:1, justifyContent:'center' }}>
              {[['#product','The Card'],['#how-it-works','How it works'],['#profile','Profile'],['#editions','Editions']].map(([h,l])=>(
                <a key={h} href={h} className="nav-link">{l}</a>
              ))}
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/insights" className="nav-link">Insights</Link>
            </nav>
          )}

          {/* CTA buttons */}
          <div style={{ display:'flex', gap: isMobile ? '.4rem' : '.6rem', alignItems:'center', flexShrink:0 }}>
            {!isMobile && (
              <Link href="/login" className="btn-ghost" style={{ padding:'9px 18px', fontSize:'.82rem' }}>Sign in</Link>
            )}
            {!isMobile && (
              <Link href="/dashboard" className="btn-ghost" style={{ padding:'10px 22px', fontSize:'.82rem', letterSpacing:'.12em', textDecoration:'none' }}>Dashboard</Link>
            )}
            <Link
              href="/pricing"
              className="btn-primary"
              style={{
                padding: isMobile ? '9px 16px' : '10px 22px',
                fontSize: isMobile ? '.75rem' : '.82rem',
                letterSpacing: isMobile ? '.08em' : '.12em',
              }}
            >
              Order
            </Link>

            {/* Mobile hamburger */}
            {isMobile && (
              <button aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}
                style={{ display:'inline-flex', flexDirection:'column', justifyContent:'center', gap:5, width:44, height:42, padding:'0 11px', cursor:'pointer', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:3 }}>
                <span style={{ display:'block', height:1.5, background:'#fff', borderRadius:2 }} />
                <span style={{ display:'block', height:1.5, background:'#fff', borderRadius:2 }} />
                <span style={{ display:'block', height:1.5, background:'#fff', borderRadius:2 }} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu overlay (top-level so it covers the full viewport) */}
      {isMobile && menuOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, width:'100vw', height:'100dvh', zIndex:1000, background:'#050505', display:'flex', flexDirection:'column', padding:'1.25rem', overflowY:'auto', animation:'fadeIn .25s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:56, flexShrink:0 }}>
            <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1rem', fontWeight:600, letterSpacing:'.28em', color:'#fff', textTransform:'uppercase' }}>TAPPED-IN</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)}
              style={{ width:42, height:42, cursor:'pointer', position:'relative', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:3 }}>
              <span style={{ position:'absolute', top:'50%', left:'50%', width:16, height:1.5, background:'#fff', transform:'translate(-50%,-50%) rotate(45deg)' }} />
              <span style={{ position:'absolute', top:'50%', left:'50%', width:16, height:1.5, background:'#fff', transform:'translate(-50%,-50%) rotate(-45deg)' }} />
            </button>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:'.25rem', marginTop:'2rem' }}>
            {[['#product','The Card'],['#how-it-works','How it works'],['#profile','Profile'],['#editions','Editions']].map(([h,l])=>(
              <a key={h} href={h} onClick={() => setMenuOpen(false)}
                style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>
            ))}
            <Link href="/pricing" onClick={() => setMenuOpen(false)}
              style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Pricing</Link>
            <Link href="/insights" onClick={() => setMenuOpen(false)}
              style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Insights</Link>
          </nav>

          <div style={{ marginTop:'auto', paddingTop:'2rem', display:'flex', flexDirection:'column', gap:'.6rem' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-ghost" style={{ width:'100%', padding:'14px' }}>Sign in</Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-ghost" style={{ width:'100%', padding:'14px' }}>Dashboard</Link>
            <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ width:'100%', padding:'15px' }}>Order Founders Edition</Link>
          </div>
        </div>
      )}

      <main>

        {/* ════════════════════════════════════════════════════════════
            1. HERO
            Desktop: full-viewport, card floats to the right.
            Mobile:  natural height (no min-height:100vh), copy first,
                     scaled card below — no clipping, no black gap.
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          minHeight: isMobile ? 0 : '100vh',
          display:'flex', alignItems:'center',
          padding: isMobile
            ? '5.5rem 1.25rem 3rem'
            : 'clamp(8rem,16vw,12rem) clamp(1.5rem,5vw,3rem) clamp(5rem,10vw,7rem)',
          position:'relative', overflow:'hidden',
        }}>

          {/* Background grid */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'linear-gradient(rgba(255,255,255,0.017) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.017) 1px, transparent 1px)',
            backgroundSize:'72px 72px',
            WebkitMaskImage:'radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 72%)',
            maskImage:'radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 72%)',
            opacity: isMobile ? 0.4 : 1,
          }} />
          <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, background:'radial-gradient(ellipse, rgba(255,255,255,0.028) 0%, transparent 65%)', filter:'blur(4px)', pointerEvents:'none' }} />

          <div className="hero-cols" style={{
            maxWidth:1160, margin:'0 auto', width:'100%',
            display:'flex', alignItems:'center',
            gap: isMobile ? '2.25rem' : '5rem',
          }}>

            {/* Copy */}
            <div style={{ flex:'1 1 480px', maxWidth: isMobile ? '100%' : 570 }}>

              {/* Badge */}
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'5px 14px 5px 7px',
                background:'rgba(255,255,255,0.032)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2,
                marginBottom: isMobile ? '1rem' : '1.75rem',
                animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) both',
              }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'dotBlink 2s ease-in-out infinite' }} />
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.63rem' : '.7rem', fontWeight:500, color:'rgba(255,255,255,.5)', letterSpacing:'.22em', textTransform:'uppercase' }}>Order your Founders Edition card now</span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily:'Oswald, Arial, sans-serif',
                fontSize: isMobile ? 'clamp(2.1rem, 9.5vw, 2.9rem)' : 'clamp(3.4rem, 7vw, 6rem)',
                fontWeight:600,
                lineHeight: isMobile ? 1.06 : 1.0,
                letterSpacing:'0.01em', color:'#fff', textTransform:'uppercase',
                marginBottom: isMobile ? '.8rem' : '1.25rem',
                animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .08s both',
              }}>
                The New Standard<br />
                <span style={{ fontWeight:300, color:'rgba(255,255,255,.52)', letterSpacing:'0.02em' }}>for Networking.</span>
              </h1>

              {/* Body */}
              <p style={{
                fontFamily:'Oswald, Arial, sans-serif',
                fontSize: isMobile ? '.85rem' : 'clamp(.95rem,1.6vw,1.05rem)',
                fontWeight:300, color:'rgba(255,255,255,.4)',
                lineHeight:1.75, letterSpacing:'0.01em',
                maxWidth: isMobile ? '100%' : 440,
                marginBottom: isMobile ? '1.4rem' : '2.5rem',
                animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .18s both',
              }}>
                100 individually numbered matte black metal NFC identity cards. The first ever TAPPED-IN release. Never restocking. Once they&apos;re gone, they&apos;re gone.
              </p>

              {/* CTAs */}
              <div className="hero-ctas" style={{
                display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap',
                marginBottom: isMobile ? '1.4rem' : '2.75rem',
                animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .26s both',
              }}>
                <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">Order Founders Edition</Link>
                <Link href="/pricing" className="btn-ghost" style={{ borderColor:'rgba(255,255,255,.28)' }}>Standard PVC · £34.99</Link>
                <a href="#product" className="btn-ghost">View the card</a>
                <a
  href="https://www.instagram.com/tappedinspace/"
  target="_blank"
  rel="noopener noreferrer"
  className="btn-ghost"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '14px',
  }}
>

  <div
    style={{
      width: '28px',
      height: '28px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{ color: '#fff' }}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
    <span
      style={{
        fontSize: '.62rem',
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        opacity: .45,
        fontWeight: 600
      }}
    >
      Instagram
    </span>

    <span
      style={{
        fontSize: '.82rem',
        fontWeight: 600,
        letterSpacing: '-0.02em'
      }}
    >
      Follow the drop
    </span>
  </div>
</a>

              </div>

              {/* Stats */}
              <div style={{ animation:'fadeIn 1.2s ease .55s both' }}>
                <div style={{ ...DIVIDER, marginBottom: isMobile ? '.9rem' : '1.25rem' }} />
                <div className="hero-stats" style={{ display:'flex', gap:'2.75rem', flexWrap:'wrap' }}>
                  {[{n:'100', l:'Total ever made'},{n:'1/100', l:'Individually numbered'},{n:'£49.99', l:'One-time price'}].map((s,i)=>(
                    <div key={i}>
                      <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.35rem' : '1.75rem', fontWeight:600, color:'#fff', lineHeight:1, marginBottom:4, letterSpacing:'0.02em' }}>{s.n}</div>
                      <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.68rem', fontWeight:400, color:'rgba(255,255,255,.28)', letterSpacing:'.1em', textTransform:'uppercase' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card column
                Desktop: full-size with overflowing badges.
                Mobile:  scaled card + in-flow badges = zero phantom height. */}
            <div style={{
              flex:'1 1 360px',
              width: isMobile ? '100%' : undefined,
              maxWidth: isMobile ? '100%' : 460,
              animation:'fadeUp 1s cubic-bezier(0.16,1,0.3,1) .32s both',
            }}>
              {isMobile ? <HeroCardMobile /> : <HeroCardDesktop />}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. PRODUCT
        ════════════════════════════════════════════════════════════ */}
        <section id="product" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(2rem,5vw,3rem)' : 'clamp(4rem,8vw,6rem)' }}>
              <div style={EB}>The Founder Edition</div>
              <h2 style={H2}>Matte black metal.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>Individually numbered.</span></h2>
              <p style={SUB}>One of 100 in existence. Hand-finished matte metal. The first TAPPED-IN card ever released.</p>
            </div>

            {/* Card pair — lg cards scaled down on mobile, glow contained */}
            <div className="reveal card-pair" style={{ display:'flex', gap: isMobile ? '1.5rem' : 'clamp(2rem,5vw,4rem)', justifyContent:'center', alignItems:'flex-start', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>
              {[
                { label:'Front', comp: <CardFront size="lg" float scale={isMobile ? 0.6 : 1} /> },
                { label:'Back',  comp: <CardBack  size="lg" float scale={isMobile ? 0.6 : 1} /> },
              ].map(({ label, comp }) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ marginBottom:'1rem', position:'relative', display:'inline-block' }}>
                    <div style={{ position:'absolute', inset: isMobile ? -24 : -70, background:'radial-gradient(ellipse, rgba(255,255,255,0.045) 0%, transparent 65%)', animation:'glowPulse 4s ease-in-out infinite', borderRadius:'50%', filter:'blur(12px)', pointerEvents:'none' }} />
                    {comp}
                  </div>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.68rem', fontWeight:400, color:'rgba(255,255,255,.28)', letterSpacing:'.2em', textTransform:'uppercase' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Detail strip */}
            <div className="reveal detail-strip" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
              {[
                { l:'Material',   v:'Matte black metal',    s:'Premium aircraft-grade construction' },
                { l:'Edition',    v:'Founder — 1 of 100',   s:'Never restocking. Ever.' },
                { l:'Technology', v:'NFC + Digital Profile', s:'Tap-to-profile, no app needed' },
                { l:'Price',      v:'£49.99',                s:'One-time. No subscription.' },
              ].map((d,i)=>(
                <div key={i} style={{ background:'#080808', padding: isMobile ? '1rem .9rem' : 'clamp(1.25rem,2.5vw,1.75rem)', display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.22)', letterSpacing:'.22em', textTransform:'uppercase' }}>{d.l}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'clamp(.88rem,2vw,1.35rem)', fontWeight:500, color:'#fff', lineHeight:1.2, letterSpacing:'0.01em' }}>{d.v}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:300, color:'rgba(255,255,255,.3)', lineHeight:1.55, letterSpacing:'0.01em' }}>{d.s}</div>
                </div>
              ))}
            </div>

            <div className="reveal" style={{ textAlign:'center', marginTop: isMobile ? '1.75rem' : '3rem' }}>
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '12px 22px' : '16px 42px' }}>Order founders edition</Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. HOW IT WORKS
        ════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" style={{ padding: SP }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(1.75rem,5vw,2.5rem)' : 'clamp(3.5rem,7vw,5.5rem)' }}>
              <div style={EB}>Process</div>
              <h2 style={H2}>Three taps to everything.</h2>
              <p style={SUB}>No app. No friction. Your physical card does the work.</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 'clamp(2.5rem,8vw,3.5rem)' : 'clamp(4rem,9vw,7rem)' }}>
              {[
                { n:'01', title:'Tap your card',     body:'Hold the Founder Edition to any phone. Your digital profile opens instantly — any device, no app required.', detail:'Works on iPhone & Android', mock:<MockTap scale={isMobile ? 0.7 : 0.92} /> },
                { n:'02', title:'Share your profile', body:'Every card links to your live profile — links, contact, portfolio, bio. Update it any time from your dashboard.', detail:'Always up to date', mock:<MockProfile scale={isMobile ? 0.7 : 0.92} /> },
                { n:'03', title:'Track engagement',  body:'See every tap and link click in real time. Know exactly when and how people engage with your card.', detail:'Real-time analytics', mock: <img src={STEP3_IMG} alt="Real-time tap analytics dashboard" style={{ width: isMobile ? 191 : 237, height: 'auto', display: 'block' }} /> },
              ].map((s,i)=>(
                <div key={s.n} className="reveal" style={{
                  display:'flex',
                  flexDirection: isMobile ? 'column' : (i % 2 === 1 ? 'row-reverse' : 'row'),
                  alignItems:'center',
                  gap: isMobile ? '2rem' : 'clamp(3rem,7vw,6rem)',
                }}>
                  {/* Mockup column */}
                  <div style={{ flex: isMobile ? '0 0 auto' : '1 1 320px', display:'flex', justifyContent:'center', width: isMobile ? '100%' : undefined }}>
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <div style={{ position:'absolute', inset:-56, background:'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 65%)', filter:'blur(20px)', animation:'glowPulse 6s ease-in-out infinite', pointerEvents:'none', borderRadius:'50%' }} />
                      <div className="howit-mock" data-idx={i} key={`hm-${i}-${mockNonce[i] || 0}`} style={{ position:'relative' }}>{s.mock}</div>
                    </div>
                  </div>

                  {/* Text column */}
                  <div style={{ flex: isMobile ? '0 0 auto' : '1 1 380px', maxWidth: isMobile ? '100%' : 440, textAlign: isMobile ? 'center' : 'left' }}>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '2.6rem' : 'clamp(3rem,5vw,4.25rem)', fontWeight:600, color:'rgba(255,255,255,.3)', lineHeight:1, letterSpacing:'0.02em', marginBottom: isMobile ? '.4rem' : '.75rem' }}>{s.n}</div>
                    <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.4rem' : 'clamp(1.6rem,3vw,2.25rem)', fontWeight:500, color:'#fff', letterSpacing:'0.02em', textTransform:'uppercase', lineHeight:1.1, marginBottom:'1rem' }}>{s.title}</h3>
                    <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.92rem' : '1.02rem', fontWeight:300, color:'rgba(255,255,255,.42)', lineHeight:1.75, letterSpacing:'0.01em', marginBottom:'1.25rem', maxWidth: isMobile ? '100%' : 380, marginLeft: isMobile ? 'auto' : undefined, marginRight: isMobile ? 'auto' : undefined }}>{s.body}</p>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,.35)', flexShrink:0 }} />
                      <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.4)', letterSpacing:'.14em', textTransform:'uppercase' }}>{s.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3.5 FOUNDING — social proof via scarcity
        ════════════════════════════════════════════════════════════ */}
        <section id="founding" style={{ padding: SP, background:'#030303', position:'relative', overflow:'hidden' }}>
          {/* Soft glow */}
          <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:720, height:440, background:'radial-gradient(ellipse, rgba(255,255,255,0.022) 0%, transparent 65%)', filter:'blur(8px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:760, margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
              <div style={EB}>Founding 100</div>
              <h2 style={H2}>Once it&apos;s claimed,<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>it&apos;s gone for good.</span></h2>
              <p style={SUB}>Every Founder card is numbered 1–100 and tied to one person. No reprints. No second batch. And no monthly fee, unlike every other card out there.</p>
            </div>

            {/* Scarcity counter */}
            <div className="reveal d2" style={{
              maxWidth:560, margin:'0 auto', background:'#070707',
              border:'1px solid rgba(255,255,255,0.07)', borderRadius:4,
              padding: isMobile ? '1.5rem 1.25rem' : '2.25rem 2.5rem',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.1rem', flexWrap:'wrap', gap:'.5rem' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'.55rem' }}>
                  <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '2.4rem' : '3rem', fontWeight:600, color:'#fff', lineHeight:1, letterSpacing:'0.02em' }}>{FOUNDERS_CLAIMED}</span>
                  <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.95rem' : '1.1rem', fontWeight:300, color:'rgba(255,255,255,.35)', letterSpacing:'.06em', textTransform:'uppercase' }}>/ 100 claimed</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 6px rgba(74,222,128,0.6)', animation:'dotBlink 2s ease-in-out infinite' }} />
                  <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:500, color:'rgba(74,222,128,0.8)', letterSpacing:'.18em', textTransform:'uppercase' }}>Live</span>
                </div>
              </div>
              <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ width:`${Math.min(Math.max(FOUNDERS_CLAIMED, 0), 100)}%`, height:'100%', background:'linear-gradient(90deg, rgba(255,255,255,.45), #fff)', borderRadius:99 }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'.8rem' }}>
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.3)', letterSpacing:'.1em', textTransform:'uppercase' }}>{Math.max(100 - FOUNDERS_CLAIMED, 0)} remaining</span>
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.3)', letterSpacing:'.1em', textTransform:'uppercase' }}>Never restocking</span>
              </div>
            </div>

            <div className="reveal d3" style={{ textAlign:'center', marginTop: isMobile ? '1.75rem' : '2.25rem' }}>
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '13px 28px' : '16px 42px' }}>Claim your number →</Link>
            </div>

            {/* Differentiators — what the others can't say */}
            <div className="reveal d3" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden', marginTop: isMobile ? '2rem' : '3rem' }}>
              {[
                { h:'No subscription', s:'One payment. Keep it for good.' },
                { h:'Numbered 1–100', s:'Your serial is yours alone.' },
                { h:'Never restocking', s:'This batch is the only batch.' },
                { h:'Yours for life', s:'Profile stays live. Updates free.' },
              ].map((d,i)=>(
                <div key={i} style={{ background:'#070707', padding: isMobile ? '1.1rem .9rem' : 'clamp(1.25rem,2.5vw,1.6rem)', display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.92rem' : '1.02rem', fontWeight:500, color:'#fff', letterSpacing:'0.02em', textTransform:'uppercase', lineHeight:1.2 }}>{d.h}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:300, color:'rgba(255,255,255,.3)', lineHeight:1.55, letterSpacing:'0.01em' }}>{d.s}</div>
                </div>
              ))}
            </div>

            {/* Founding members — only renders if you add real handles above */}
            {FOUNDING_MEMBERS.length > 0 && (
              <div className="reveal d4" style={{ textAlign:'center', marginTop: isMobile ? '2rem' : '3rem' }}>
                <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:400, letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginBottom:'1rem' }}>Founding members</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', justifyContent:'center' }}>
                  {FOUNDING_MEMBERS.map((h)=>(
                    <span key={h} style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:400, color:'rgba(255,255,255,.55)', letterSpacing:'.04em', padding:'7px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:99 }}>{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. DIGITAL PROFILE
        ════════════════════════════════════════════════════════════ */}
        <section id="profile" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="profile-cols" style={{ display:'flex', gap:'clamp(3rem,6vw,6rem)', alignItems:'center', flexWrap:'wrap' }}>

              <div style={{ flex:'1 1 360px' }}>
                <div className="reveal" style={EB}>Your digital identity</div>
                <h2 className="reveal d1" style={{ ...H2, textAlign:'left', marginBottom:'1.25rem' }}>
                  Every card unlocks<br />
                  <span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>a premium profile.</span>
                </h2>
                <p className="reveal d2" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.95rem', fontWeight:300, color:'rgba(255,255,255,.36)', lineHeight:1.75, letterSpacing:'0.01em', marginBottom:'2rem', maxWidth:390 }}>
                  Your Founder Edition card opens a live digital profile — permanently linked, always up to date. Share links, contact details, portfolio, and more. Update it any time from your dashboard. No app needed.
                </p>
                <div className="reveal d3" style={{ display:'flex', flexDirection:'column', gap:'.65rem', marginBottom:'2.25rem' }}>
                  {['Unlimited smart links','Real-time tap analytics','Custom public profile URL','QR code download','SEO-indexed — Google finds you'].map((f,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,.28)', flexShrink:0 }} />
                      <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.9rem', fontWeight:400, color:'rgba(255,255,255,.44)', letterSpacing:'0.02em' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="reveal d4">
                  <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer"
 className="btn-primary" style={{ fontSize: '.84rem', padding: '13px 28px' }}>Order Founders Edition</Link>
                </div>
              </div>

              {/* Profile QR access card */}
              <div className="reveal d2" style={{
                flex: isMobile ? '1 1 100%' : '1 1 320px',
                maxWidth: isMobile ? 320 : 380,
                width: '100%',
                margin: isMobile ? '0 auto' : undefined,
              }}>
                <ProfileQR isMobile={isMobile} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            5. FOUNDER STATUS
        ════════════════════════════════════════════════════════════ */}
        <section style={{ padding: SP }}>
          <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
            <div className="reveal" style={EB}>Founder Status</div>
            <h2 className="reveal d1" style={H2}>
              You will be one of 100.<br />
              <span style={{ fontWeight:300, color:'rgba(255,255,255,.38)' }}>That number never changes.</span>
            </h2>
            <p className="reveal d2" style={{ ...SUB, marginBottom: isMobile ? '2rem' : '3.5rem' }}>
              Founder Edition owners are the first 100 people to hold a TAPPED-IN card. Each one is individually numbered. This edition will never be restocked or reproduced. It is a permanent record.
            </p>

            <div className="founder-cols reveal d3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden', marginBottom: isMobile ? '2rem' : '3rem' }}>
              {[
                { icon:'◈', h:'Permanently numbered',  b:'Your card carries a serial number from 1 to 100. No duplicates. No reprints.' },
                { icon:'◎', h:'First ever release',    b:'This is the first TAPPED-IN product. No cards existed before this drop.' },
                { icon:'⬡', h:'Early platform access', b:'Founders get priority access to every new platform feature as TAPPED-IN grows.' },
              ].map((c,i)=>(
                <div key={i} style={{ background:'#060606', padding: isMobile ? '1.25rem .9rem' : 'clamp(1.5rem,3vw,2rem)', display:'flex', flexDirection:'column', gap:'.65rem' }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.4rem', color:'rgba(255,255,255,.22)', marginBottom:'.2rem' }}>{c.icon}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.88rem' : '1.1rem', fontWeight:500, color:'#fff', letterSpacing:'0.03em', textTransform:'uppercase' }}>{c.h}</div>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.88rem', fontWeight:300, color:'rgba(255,255,255,.32)', lineHeight:1.7, letterSpacing:'0.01em' }}>{c.b}</p>
                </div>
              ))}
            </div>

            <div className="reveal d4">
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer"
 className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '12px 22px' : '16px 42px' }}>Order Founders Edition</Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            6. FUTURE EDITIONS
        ════════════════════════════════════════════════════════════ */}
        <section id="editions" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(1.75rem,5vw,2.5rem)' : 'clamp(3.5rem,7vw,5rem)' }}>
              <div style={EB}>Choose your card</div>
              <h2 style={H2}>Three editions.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.32)' }}>One platform.</span></h2>
              <p style={SUB}>Buy the card once with 3 months of full access included, then just £1/month keeps it live. <Link href="/pricing" style={{ color:'#fff', textDecoration:'underline', textUnderlineOffset:'3px' }}>See all plans &amp; tiers →</Link></p>
            </div>

            <div className="future-grid reveal" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:720, margin:'0 auto' }}>
              {[
                { label:'Standard PVC',   price:'£34.99', available:true,  note:'The everyday tap card. Premium matte finish — available now.' },
                { label:'Standard Metal', price:'£49.99', available:false, note:'Heavier premium metal finish. Coming soon.' },
              ].map((ed,i)=>{
                const inner = (
                  <div style={{ background:'#070707', border:`1px solid rgba(255,255,255,${ed.available ? 0.08 : 0.04})`, borderRadius:3, padding: isMobile ? '1.1rem .9rem' : 'clamp(1.5rem,3vw,2rem)', opacity: ed.available ? 1 : .4, position:'relative', overflow:'hidden', height:'100%' }}>
                    <div style={{ position:'absolute', top:12, right:12, background: ed.available ? '#fff' : 'rgba(255,255,255,0.06)', border:`1px solid ${ed.available ? '#fff' : 'rgba(255,255,255,0.07)'}`, borderRadius:2, padding:'3px 9px', fontFamily:'Oswald, Arial, sans-serif', fontSize:'.58rem', fontWeight:600, letterSpacing:'.2em', color: ed.available ? '#000' : 'rgba(255,255,255,.38)', textTransform:'uppercase' }}>{ed.available ? 'Available' : 'Locked'}</div>
                    <div style={{ marginBottom:'1rem', pointerEvents:'none' }}>
                      <CardFront size="sm" scale={isMobile ? 0.78 : 1} />
                    </div>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:400, color:'rgba(255,255,255,.4)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:'.5rem' }}>{ed.label}</div>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight:600, color:'#fff', marginBottom:'.3rem', letterSpacing:'0.02em' }}>{ed.price}</div>
                    <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.84rem', fontWeight:300, color:'rgba(255,255,255,.35)', lineHeight:1.65, letterSpacing:'0.01em' }}>{ed.note}</p>
                  </div>
                )
                return ed.available
                  ? <Link key={i} href="/pricing" style={{ textDecoration:'none', display:'block' }}>{inner}</Link>
                  : <div key={i}>{inner}</div>
              })}
            </div>

            <p className="reveal" style={{ textAlign:'center', marginTop:'1.5rem' }}>
              <Link href="/pricing" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.75rem', fontWeight:400, color:'rgba(255,255,255,.45)', letterSpacing:'.1em', textTransform:'uppercase', textDecoration:'none' }}>View all editions &amp; pricing →</Link>
            </p>
          </div>
        </section>
{/* ════════════════════════════════════════════════════════════
            6.5 INSTALL — Add to Home Screen
            Cinematic, matte, mobile-first. Slots between Editions
            and Final CTA. Uses existing tokens (EB, H2, SUB, SP, reveal).
        ════════════════════════════════════════════════════════════ */}
        <section id="install" style={{ padding: SP, position: 'relative', overflow: 'hidden' }}>
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
            7. FINAL CTA
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: isMobile ? '3.5rem 1.25rem' : 'clamp(7rem,14vw,11rem) clamp(1.5rem,5vw,3rem)',
          position:'relative', overflow:'hidden', textAlign:'center',
        }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)', maskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:640, height:400, background:'radial-gradient(ellipse, rgba(255,255,255,0.022) 0%, transparent 65%)', filter:'blur(6px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:2, maxWidth:640, margin:'0 auto' }}>
            <div className="reveal" style={EB}>Only 100 exist.</div>
            <h2 className="reveal d1" style={{
              fontFamily:'Oswald, Arial, sans-serif',
              fontSize: isMobile ? 'clamp(1.85rem,8vw,2.8rem)' : 'clamp(2.8rem,6.5vw,5rem)',
              fontWeight:600, color:'#fff', lineHeight:1.05,
              letterSpacing:'0.01em', textTransform:'uppercase',
              marginBottom:'1.25rem',
            }}>
              100 Founder cards.<br />
              <span style={{ fontWeight:300, color:'rgba(255,255,255,.38)', letterSpacing:'0.02em' }}>Never restocking.</span>
            </h2>
            <p className="reveal d2" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.86rem' : '.98rem', fontWeight:300, color:'rgba(255,255,255,.32)', lineHeight:1.78, letterSpacing:'0.01em', marginBottom: isMobile ? '2rem' : '2.75rem' }}>
              Limited to 100 individually numbered cards. Founder Edition pre-orders are live now.
            </p>
            <div className="reveal d3 final-cta-btns" style={{ display:'flex', gap:'.75rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding:'16px 40px' }}>Order now</Link>
              <Link href="/demo" className="btn-ghost">View demo profile</Link>
            </div>
            <div className="reveal d3" style={{ marginTop:'1.25rem', display:'flex', justifyContent:'center' }}>
              <a
                href="https://www.instagram.com/tappedinspace/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'inline-flex', alignItems:'center', gap:'8px',
                  fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400,
                  color:'rgba(255,255,255,.35)', letterSpacing:'.06em',
                  textDecoration:'none', transition:'color .2s',
                }}
                className="ti-ig-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
                </svg>
                Follow the drop on Instagram
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
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
              </div>
              <div className="footer-links" style={{ display:'flex', gap:'4rem', flexWrap:'wrap' }}>
                {[
                  { head:'Drop',    links:[['#product','The Card'],['#how-it-works','How it works'],['#editions','Editions'],['/insights','Insights'],['/demo','Demo profile']] },
                  { head:'Account', links:[['/signup','Order'],['/login','Sign in'],['/dashboard','Dashboard']] },
                  { head:'Connect', links:[['https://www.instagram.com/tappedinspace/','Instagram ↗'],['mailto:contact@tappedin.uk','Contact us']] },
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