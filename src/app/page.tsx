'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FOUNDERS_STRIPE_URL = 'https://buy.stripe.com/dRm8wR9TzeXvaRb5WvcfK00'

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
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  useReveal()
  const [scrolled, setScrolled]   = useState(false)
  const [isMobile, setIsMobile]   = useState(false)

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
            </nav>
          )}

          {/* CTA buttons */}
          <div style={{ display:'flex', gap: isMobile ? '.35rem' : '.6rem', alignItems:'center', flexShrink:0 }}>
            {/* Hide "Sign in" on mobile to avoid crowding */}
            {!isMobile && (
              <Link href="/login" className="btn-ghost" style={{ padding:'9px 18px', fontSize:'.82rem' }}>Sign in</Link>
            )}
<Link
  href="/dashboard"
  className="btn-ghost"
  style={{
  padding: isMobile ? "9px 16px" : "10px 22px",
  fontSize: isMobile ? ".75rem" : ".82rem",
  letterSpacing: isMobile ? ".08em" : ".12em",
  textDecoration: "none",
  }}
  >
  Dashboard
</Link>
            <Link
href={FOUNDERS_STRIPE_URL}

target="_blank"
rel="noopener noreferrer"
className="btn-primary"
style={{
padding: isMobile ? '9px 16px' : '10px 22px',
fontSize: isMobile ? '.75rem' : '.82rem',
letterSpacing: isMobile ? '.08em' : '.12em',
}}
>
{isMobile ? 'Pre-order' : 'Pre-order'}
</Link>
          </div>
        </div>
      </header>

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
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.63rem' : '.7rem', fontWeight:500, color:'rgba(255,255,255,.5)', letterSpacing:'.22em', textTransform:'uppercase' }}>Pre-order Founders Edition</span>
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
                A new standard<br />
                <span style={{ fontWeight:300, color:'rgba(255,255,255,.52)', letterSpacing:'0.02em' }}>of Networking.</span>
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
                <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">Pre-order Founders Edition</Link>
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
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '12px 22px' : '16px 42px' }}>Pre-order founders edition</Link>
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

            <div className="steps-grid reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:'rgba(255,255,255,0.055)', borderRadius:3, overflow:'hidden' }}>
              {[
                { n:'01', title:'Tap your card',     body:'Hold the Founder Edition to any phone. Opens your digital profile instantly — works on any device, no app required.' },
                { n:'02', title:'Share your profile', body:'Every card connects to your live digital profile — links, contact, portfolio, bio. Update anytime from your dashboard.' },
                { n:'03', title:'Track engagement',  body:'See every tap and link click in real time. Know exactly when and how people interact with your card.' },
              ].map((s,i)=>(
                <div key={i} style={{ background:'#060606', padding: isMobile ? '1.4rem 1.1rem' : 'clamp(1.75rem,3vw,2.5rem) clamp(1.25rem,2.5vw,2rem)', display:'flex', flexDirection:'column', gap:'.75rem' }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.65rem', fontWeight:400, letterSpacing:'.28em', color:'rgba(255,255,255,.18)', textTransform:'uppercase' }}>{s.n}</div>
                  <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.15rem' : 'clamp(1.3rem,2.5vw,1.65rem)', fontWeight:500, color:'#fff', marginTop:'.5rem', letterSpacing:'0.02em', textTransform:'uppercase' }}>{s.title}</h3>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.9rem', fontWeight:300, color:'rgba(255,255,255,.36)', lineHeight:1.72, letterSpacing:'0.01em' }}>{s.body}</p>
                </div>
              ))}
            </div>
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
 className="btn-primary" style={{ fontSize: '.84rem', padding: '13px 28px' }}>Pre-order Founders Edition</Link>
                </div>
              </div>

              {/* Mock profile card */}
              <div className="reveal d2" style={{ flex:'1 1 300px', maxWidth:380 }}>
                <div style={{ background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.7)' }}>
                  <div style={{ padding:'1.1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, letterSpacing:'.18em', color:'rgba(255,255,255,.2)', textTransform:'uppercase' }}>tappedin.uk/u/yourname</span>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 6px #4ade80' }} />
                      <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:500, color:'#4ade80', letterSpacing:'0.08em', textTransform:'uppercase' }}>Live</span>
                    </div>
                  </div>
                  <div style={{ padding:'2rem 1.5rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                    <div style={{ width:58, height:58, borderRadius:14, background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem', fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.1rem', fontWeight:600, color:'rgba(255,255,255,.45)', letterSpacing:'0.08em' }}>BP</div>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.35rem', fontWeight:500, color:'#fff', marginBottom:'.25rem', letterSpacing:'0.02em' }}>Ben Pinner</div>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:300, color:'rgba(255,255,255,.3)', marginBottom:'1.5rem', letterSpacing:'0.04em' }}>Founder, TAPPED-IN</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'.45rem', width:'100%' }}>
                      {['Portfolio','Instagram','Contact me'].map(l=>(
                        <div key={l} style={{ padding:'.6rem', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.05)', fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400, color:'rgba(255,255,255,.55)', letterSpacing:'0.04em', textTransform:'uppercase' }}>{l}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding:'.8rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.18)', letterSpacing:'0.08em', textTransform:'uppercase' }}>TAPPED-IN · Founder</span>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.16)', letterSpacing:'0.06em' }}>312 taps</span>
                  </div>
                </div>
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
 className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '12px 22px' : '16px 42px' }}>Pre-order Founders Edition</Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            6. FUTURE EDITIONS
        ════════════════════════════════════════════════════════════ */}
        <section id="editions" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(1.75rem,5vw,2.5rem)' : 'clamp(3.5rem,7vw,5rem)' }}>
              <div style={EB}>Coming Soon</div>
              <h2 style={H2}>Future editions.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.32)' }}>After the Founder Drop sells out.</span></h2>
              <p style={SUB}>Standard editions will only become available once all 100 Founder cards have been claimed. They are not available now.</p>
            </div>

            <div className="future-grid reveal" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:720, margin:'0 auto' }}>
              {[
                { label:'Standard PVC',   price:'£24.99' },
                { label:'Standard Metal', price:'£34.99' },
              ].map((ed,i)=>(
                <div key={i} style={{ background:'#070707', border:'1px solid rgba(255,255,255,0.04)', borderRadius:3, padding: isMobile ? '1.1rem .9rem' : 'clamp(1.5rem,3vw,2rem)', opacity:.4, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:2, padding:'3px 9px', fontFamily:'Oswald, Arial, sans-serif', fontSize:'.58rem', fontWeight:500, letterSpacing:'.2em', color:'rgba(255,255,255,.38)', textTransform:'uppercase' }}>Locked</div>
                  <div style={{ marginBottom:'1rem', pointerEvents:'none' }}>
                    <CardFront size="sm" scale={isMobile ? 0.78 : 1} />
                  </div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:400, color:'rgba(255,255,255,.2)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:'.5rem' }}>{ed.label}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight:600, color:'#fff', marginBottom:'.3rem', letterSpacing:'0.02em' }}>{ed.price}</div>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.84rem', fontWeight:300, color:'rgba(255,255,255,.22)', lineHeight:1.65, letterSpacing:'0.01em' }}>Coming soon. Not available until Founder Edition sells out.</p>
                </div>
              ))}
            </div>

            <p className="reveal" style={{ textAlign:'center', fontFamily:'Oswald, Arial, sans-serif', fontSize:'.75rem', fontWeight:400, color:'rgba(255,255,255,.18)', marginTop:'1.5rem', letterSpacing:'.1em', textTransform:'uppercase' }}>
              These editions will be announced when the Founder Drop is sold out.
            </p>
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
              Limited to 100 individually numbered cards. Founder Editon pre-orders are live now.
            </p>
            <div className="reveal d3 final-cta-btns" style={{ display:'flex', gap:'.75rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding:'16px 40px' }}>Pre-orders are live</Link>
              <Link href="/u/benpinner" className="btn-ghost">View demo profile</Link>
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
                <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:300, color:'rgba(255,255,255,.18)', lineHeight:1.7, letterSpacing:'0.01em' }}>A new standard of Networking. Premium NFC digital identity for creators and professionals.</p>
              </div>
              <div className="footer-links" style={{ display:'flex', gap:'4rem', flexWrap:'wrap' }}>
                {[
                  { head:'Drop',    links:[['#product','The Card'],['#how-it-works','How it works'],['#editions','Editions'],['/u/benpinner','Demo profile']] },
                  { head:'Account', links:[['/signup','Pre-order'],['/login','Sign in'],['/dashboard','Dashboard']] },
                  { head:'Follow',  links:[['https://www.instagram.com/tappedinspace/','Instagram ↗']] },
                ].map(col=>(
                  <div key={col.head} style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:500, letterSpacing:'.26em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:'.2rem' }}>{col.head}</div>
                    {col.links.map(([href,label])=>
                      href.startsWith('#')
                        ? <a key={href} href={href} className="footer-link">{label}</a>
                        : <Link key={href} href={href} className="footer-link">{label}</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:'1.5rem', flexWrap:'wrap', gap:'.5rem' }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.14)', letterSpacing:'0.04em' }}>© 2025 Tapped-In. All rights reserved.</span>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:400, color:'rgba(255,255,255,.1)', letterSpacing:'0.06em', textTransform:'uppercase' }}>tappedin.uk</span>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
