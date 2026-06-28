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

const GRAIN = `url("data:image/png;base64,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")`

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
                <div style={{ height: `${b * 100}%`, background: i === 5 ? 'linear-gradient(180deg,#fff,rgba(255,255,255,0.72))' : 'rgba(255,255,255,0.14)', borderRadius: r(2), boxShadow: (i === 5 && !isMobile) ? '0 0 12px rgba(255,255,255,0.3)' : 'none' }} />
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
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: isMobile ? 'none' : '0 0 6px rgba(74,222,128,0.6)', animation: isMobile ? 'none' : 'dotBlink 2s ease-in-out infinite' }} />
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
                { n:'03', title:'Track engagement',  body:'See every tap and link click in real time. Know exactly when and how people engage with your card.', detail:'Real-time analytics', mock:<MockAnalytics scale={isMobile ? 0.7 : 0.92} isMobile={isMobile} /> },
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
                      {!isMobile && <div style={{ position:'absolute', inset:-56, background:'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 65%)', filter:'blur(20px)', animation:'glowPulse 6s ease-in-out infinite', pointerEvents:'none', borderRadius:'50%' }} />}
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