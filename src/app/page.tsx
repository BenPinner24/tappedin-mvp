'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReviewProfileModal } from './_components/ReviewProfileModal'

const FOUNDERS_STRIPE_URL = 'https://buy.stripe.com/dRm8wR9TzeXvaRb5WvcfK00'
const STANDARD_STRIPE_URL = 'https://buy.stripe.com/dRm14pc1H16F9N7et1cfK03'

// ── EDIT ME ───────────────────────────────────────────────────────────────────
// Real number of Founder cards already claimed (0–100). Drives the
// "X / 100 claimed" counter + progress bar in the Founding section below.
const FOUNDERS_CLAIMED = 16
// Optional: real founder @handles to show a "Founding members" chip row.
// Leave as [] to hide the row entirely. e.g. ['@benpinner', '@studio.xyz']
const FOUNDING_MEMBERS: string[] = []
// Customer reviews for the "Don't take our word for it" section below.
// The section AUTO-HIDES until at least one review is listed here.
// Replace these examples with REAL reviews. Each: name, role, rating (1-5), quote.
const REVIEWS: { name: string; role: string; rating: number; quote: string; profile_username?: string | null; avatar_url?: string | null }[] = [
  // Empty on purpose. Real reviews will be loaded here once the submission system is live.
  // While this is empty, the reviews section below stays hidden.
]
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
const STEP3_IMG = "data:image/png;base64,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iHAEAMRioldFIxwBALEYATteLwQAkALJKD0RR6sBAGJWjgAAgHAEAEA4AgAgHAEAEI4AAAhHAACEIwAAwhEAAOEIAIBwBABAOAIAIBwBABCOAAAIRwAAhCMAACAcAQAmKRzRhTgApJ4xjSEzabGYlZV10003XXnllVVVVfn5+Xq93u/3W63WCxcufPzxx3//+9///ve/+3y+SVtqSqXy6quv3rRp08KFC8vKytLS0liWHR4eHhwcPHny5J49e955553Ozk6sXgDTF8NxXOykS09Plx4TLRZdLpfX652I+TMajf/93/999913azSaGA/r6en5wQ9+8Ktf/SoQCMh52YyMjL/85S9r1qwJmb5q1aojR47Efu5dd931+OOP5+fnx3iMz+d78cUXv/3tbyMiASafUqlUKBSjtJpZdnh4OHIsMkwi4RjxYRMUjgsXLnzttdcKCgpkPr6+vn7r1q0DAwOxH3bNNdc899xzhYWF4XfFDke1Wv3CCy986lOfkjk//f39t912W319PVZWgGkXjnHscxRFcTJ3L1ZXV+/cuVN+MhJCVq9e/fe//91gMER7QHFx8SuvvPLmm29GTMbYOI576aWX5CcjISQ7O/vdd99dsmQJVlaAaUdWOE5yLBJCNBrNX//61xgxFyNSn3322fDpubm5P/3pT0+dOnXTTTclNkvf+MY3Nm3aFO+zVCrVn/70pwQ+CABMg3CcfF//+tfLy8sTe+5tt922evVq6U+z2fz000+fPXv2/vvvVyqVib1mXl7ef/zHfyT23LKysi9+8YtY1QAQjuNQNt5///3R7h0YGNi1a1dDQ4Pf74/2mIceeki6vXXr1n//939Xq9VjmaUHH3xQpVKN5emj7gEBAITjKK6++urMzMyId7388stlZWXXXnvt2rVrq6urm5ubIz7suuuui310Oy4Mw9x2223Rdjj85je/WbduXXl5+ac+9anW1taID8vNzcWeRwCE41hdeeWVEaf7/f7/83/+j3RYvLW19Stf+UrER6rV6uXLl4/X/FRXV0c7gPPUU099+ctfPnjwYGdn59tvv33jjTdGq2eDW/oAgHBMMIwiTm9oaAg59P7BBx+MjIxEfPCcOXOivX5PT09c81NXVxdxutPp/O53vxs85ezZs7t374744KqqKqxtAAjHMSkuLo44PfwMREEQzpw5E/HBZrM5PMte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uVwul2vdunXRHsYwzL333ltfX9/T0zM8PHzkyJFvfvObarU6+DFXX331m2++2dHRMTQ0dOLEiccff1yn00V8tZdeesl12aOPPjpj1zmTyfSjH/3o9OnTIyMjHR0d27ZtW7VqVchjNm/evGPHjvb29pGRkebm5l/96lcFBQXYXOVQKBStra3SmiYt29tvv90VyZEjR7DQIppxY7YUFRU98sgjd911l5zxap577rm77rpL+rOqqqqqqmr9+vWbN2+mI13cddddzz33HMMw9AGzZs165JFHrrnmmiuuuMLj8QS/VF5e3vXXX48VTq/X7969e9asWfRPlUq1adOma6655pZbbnnvvffoxDvvvPNXv/qV9JTCwsI777xz48aNS5YsGRkZwTKM7cYbbzSbzeHTlUolFg4qx1h+9rOf3XPPPXKSce3atVIyut1uaQiHtWvXbt26lRBiNBp/9KMfSckoWbx48X333Rcy8e6778bwYYSQ++67jyaj3+//05/+1NLSQgjhOO473/kOfYBWq/3ud79Lbzc3N2/bto0ORZCXl3fnnXdiAY7qi1/8YsTpUji63W5LkBk4NgkdWAnhGIEgCA0NDaM+7F/+5V/ojYGBgYqKirKysgsXLtAp11xzDW1Qp6Wl0SkPPPBAcXHxuXPn6J+f/vSng1+K47i7776bEBJSTs5A69evpzeef/75e+65R8q7BQsWGI1GQsiaNWsyMzPpxBtuuOEzn/nM73//e/rn0qVLkX2xzZ07d926dYFAIHwMP5VKRW/8x3/8R26QDRs2IBYRjoQQ8stf/rKyslJODVJVVUVvvPrqq0NDQw6HQ4rU3NxcQkhFRQX90+fz/eEPf+jv73/99dfplMrKyuCX2rJlS35+vtVq3bdv3wzfetPT0+mN8+fPE0Kk3xvprurqavqn1Wpta2sjhLzyyitPPvnkk08++e677yL+YvvCF75ACNm1a1f4z7BCoZAW7AxcMnHFIjXjGno7d+4khJSUlIz6SJPJRG/09fXRG9nZ2cGrl1Q22my2QCBACBkaGqJTpLuCWzpvvPGGVBPNWL29vcFRKC1SQsjg4CAhRFpEDoeD3ti7d+/evXsRfKPSarWf+cxnCCEvv/zyihUrojWrZ1o7Ot5MnNHNapm+8Y1vbN26devWrX/5y18IIXl5eWvXrqV31dfXx17owXdVVlZeccUV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vz8zM5OOTEcfRjtwyc7OloarQzhOJYZhxqXPR4DprrOz0263E0JoJ800+EIqOJ1O5/P56CYTHJoR0SFDMjIyCgsLvV6vw+FgGKa5uZn2VqVSqdxutzSQCX1NjuMyMzMbGxsRjvHZvHnzjTfe+N5779XW1g4PD//4xz/2+/2bN2++4oor/H7/iy++eOrUqXvuuScvLy8vL++ZZ5556KGHsrOz77777sLCwt7e3v/5n//p6upSqVT33HNPVVXVwMDA3r176+rqvve9733pS1/KzMy8ePFiaWnpd7/73U2bNl155ZUcx9XX17/66quEkK985SsqlWpoaGju3Lkff/yxzWZbsGCB0+l85plnJrq3NIDJIYVdcXGx0+m02WyZmZkKhWLDhg16vb6jo+P48eMcx7Esu2LFiqysrMHBwYaGhhijyJ09e7aoqOjKK68khOzbty8QCFgslo8//piGbGZm5tGjR51OJyHEaDQajUaHw5GVlRUIBMY+uskESfaj1SdPnnz33XdLS0vz8vIMBsONN9741ltv7dix43Of+xwh5He/+113d/fx48cfeughQsiNN96oVCqffPJJtVq9efNm2uguLy//1re+dfbs2fXr1z/99NP0t7GgoMDlcu3cuTM3N/emm25644033nnnnY0bN+bm5kpv/cILL7z99tsrV67cs2fP008/XVFRgb6+IcWYTKbS0tLTp0/TUk6j0Zw7d+7EiROVlZV0RBCFQtHT09PQ0JCXl1deXi49Ua/XV1VVKZVKaUpJSUlaWtrhw4c7OztramqCR7tbsGCBw+Foa2tzOBytra1XX311fn5+c3NzdnZ2f3+/RqPZsGHDli1blixZgsoxDs3NzTzP0y+JVuNarfa9997r7u4Of3Bra2tjY2NPT09XVxcdwzonJ6e/v39oaKi1tXXlypX0h4u2KV577TVCSF5e3s6dO48dO5aRkUH3gPT09BBCBgcHaSe7oigODAzQpkfwqgCQAnuZli5dSrcOQkhLS0traytNyUWLFtGe7T0eD713eHiYbiOUVqutqqq6dOmS1FdhSUlJe3t7a2trf3//pk2bMjIyBgcH6SZWUFCwZ88eWpccPnz4xIkTfr9fEIRFixa1tLRUVFTwPH/gwIH169e3trYODQ2hcoyb1Wp97bXXbrrppi1btkTcA/L+++9funTp7rvvnjdvHu3N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"

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

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS CAROUSEL — coverflow. Centre review is sharp; neighbours peek blurred.
// Auto-advances every 4s; arrows/dots take control and restart the timer.
// Self-contained state + timer, so a tap can never freeze it.
// ─────────────────────────────────────────────────────────────────────────────
function ReviewsCarousel({ reviews, isMobile }: { reviews: { name: string; role: string; rating: number; quote: string; profile_username?: string | null; avatar_url?: string | null }[]; isMobile: boolean }) {
  const N = reviews.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [previewUser, setPreviewUser] = useState<string | null>(null)

  useEffect(() => {
    if (N <= 1 || paused) return
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setActive((a) => (a + 1) % N), 4000)
    return () => clearInterval(id)
  }, [N, paused, nonce])

  const go = (dir: number) => { setActive((a) => (a + dir + N) % N); setNonce((n) => n + 1) }
  const jump = (i: number) => { setActive(i); setNonce((n) => n + 1) }

  const cardW = isMobile ? 300 : 380
  const spacing = cardW * (isMobile ? 0.5 : 0.6)
  const stageH = isMobile ? 430 : 380

  const offsetOf = (i: number) => {
    let o = i - active
    if (o > N / 2) o -= N
    if (o < -N / 2) o += N
    return o
  }

  const arrowStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute', top: stageH / 2, transform: 'translateY(-50%)',
    [side]: isMobile ? 2 : 18, zIndex: 30,
    width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,10,10,0.72)', border: '1px solid rgba(255,255,255,0.14)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    color: 'rgba(255,255,255,0.85)', cursor: 'pointer', padding: 0,
    fontFamily: 'Oswald, Arial, sans-serif', fontSize: isMobile ? 20 : 24, lineHeight: 1,
    transition: 'background .25s, border-color .25s, color .25s',
  })

  return (
    <div
      style={{ position: 'relative', marginTop: isMobile ? 44 : 56, width: '100%' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: 'relative', height: stageH, maxWidth: 1120, margin: '0 auto', overflow: 'hidden' }}>
        {reviews.map((rv, i) => {
          const o = offsetOf(i)
          const abs = Math.abs(o)
          const isCentre = o === 0
          return (
            <div
              key={i}
              aria-hidden={!isCentre}
              style={{
                position: 'absolute', top: '50%', left: '50%', width: cardW,
                transform: 'translate(-50%, -50%) translateX(' + (o * spacing) + 'px) scale(' + (isCentre ? 1 : 0.85) + ')',
                opacity: abs <= 1 ? (isCentre ? 1 : 0.4) : 0,
                filter: isCentre ? 'blur(0px)' : 'blur(4px)',
                zIndex: 20 - abs,
                pointerEvents: isCentre ? 'auto' : 'none',
                transition: 'transform .6s cubic-bezier(0.16,1,0.3,1), opacity .55s ease, filter .55s ease',
              }}
            >
              <div onClick={() => { if (isCentre && rv.profile_username) setPreviewUser(rv.profile_username) }} onMouseEnter={(e) => { if (isCentre && rv.profile_username) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 22px 55px rgba(0,0,0,0.55)'; e.currentTarget.style.borderColor = 'rgba(232,225,210,0.4)' } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: isMobile ? '28px 26px' : '34px 32px 30px', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', cursor: (isCentre && rv.profile_username) ? 'pointer' : 'default', transition: 'transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s ease, border-color .3s ease' }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 20, fontSize: 15, letterSpacing: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ color: s <= rv.rating ? '#e8e1d2' : 'rgba(255,255,255,0.16)' }}>{'\u2605'}</span>
                  ))}
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.62, color: '#dedee3', fontWeight: 300, margin: '0 0 28px' }}>{rv.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald, Arial, sans-serif', fontWeight: 500, fontSize: 15, letterSpacing: '.04em', color: '#cfcfd6', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
                    {rv.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    {rv.avatar_url && (
                      <img src={rv.avatar_url} alt={rv.name} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{rv.name}</div>
                    <div style={{ fontSize: 13, color: '#9b9ba4', fontWeight: 300, marginTop: 3 }}>{rv.role}</div>
                  </div>
                </div>
                {rv.profile_username && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'Oswald, Arial, sans-serif', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#e8e1d2' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                    Tap to view live profile
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {N > 1 && (
        <>
          <button aria-label="Previous review" onClick={() => go(-1)} style={arrowStyle('left')}>‹</button>
          <button aria-label="Next review" onClick={() => go(1)} style={arrowStyle('right')}>›</button>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: isMobile ? 24 : 30 }}>
            {reviews.map((_, i) => (
              <button
                key={i}
                aria-label={'Go to review ' + (i + 1)}
                onClick={() => jump(i)}
                style={{
                  width: i === active ? 22 : 7, height: 7, borderRadius: 99, border: 'none',
                  cursor: 'pointer', padding: 0,
                  background: i === active ? '#e8e1d2' : 'rgba(255,255,255,0.18)',
                  transition: 'width .4s ease, background .4s ease',
                }}
              />
            ))}
          </div>
        </>
      )}
      {previewUser && (
        <ReviewProfileModal username={previewUser} onClose={() => setPreviewUser(null)} />
      )}
    </div>
  )
}

export default function HomePage() {
  const [liveReviews, setLiveReviews] = useState<{ name: string; role: string; rating: number; quote: string; profile_username?: string | null; avatar_url?: string | null }[]>([])
  useEffect(() => {
    const sb = createClient()
    sb.from('reviews')
      .select('name, role, rating, quote, profile_username, avatar_url')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data) setLiveReviews(data.map((r) => ({ name: r.name, role: r.role ?? '', rating: r.rating, quote: r.quote, profile_username: r.profile_username ?? null, avatar_url: r.avatar_url ?? null })))
      })
  }, [])
  const shownReviews = liveReviews.length > 0 ? liveReviews : REVIEWS
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
          maxWidth:1200, margin:'0 auto',
          height: isMobile ? 56 : 68,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap: isMobile ? '.75rem' : '1.5rem',
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
            <nav style={{ display:'flex', alignItems:'center', gap:'1.75rem' }}>
              {[['#product','The Card'],['#how-it-works','How it works'],['#profile','Profile'],['#editions','Editions'], ...(shownReviews.length > 0 ? [['#reviews','Reviews']] : [])].map(([h,l])=>(
                <a key={h} href={h} className="nav-link">{l}</a>
              ))}
             <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/business" className="nav-link">For Teams</Link>
              <Link href="/insights" className="nav-link">Blogs</Link>
            </nav>
          )}

          {/* CTA buttons */}
          <div style={{ display:'flex', gap: isMobile ? '.4rem' : '.75rem', alignItems:'center', flexShrink:0 }}>

            {!isMobile && (
             <Link href="/login" className="nav-link" style={{ padding:'0 .25rem' }}>Sign in</Link>
            )}
            {!isMobile && (
              <Link href="/dashboard" className="btn-ghost" style={{ padding:'10px 22px', fontSize:'.8rem', letterSpacing:'.12em', textDecoration:'none' }}>Dashboard</Link>
            )}
            {!isMobile && (
              <span style={{ width:1, height:22, background:'rgba(255,255,255,0.12)' }} />
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
            {[['#product','The Card'],['#how-it-works','How it works'],['#profile','Profile'],['#editions','Editions'], ...(shownReviews.length > 0 ? [['#reviews','Reviews']] : [])].map(([h,l])=>(
              <a key={h} href={h} onClick={() => setMenuOpen(false)}
                style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>
            ))}
            <Link href="/pricing" onClick={() => setMenuOpen(false)}
              style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Pricing</Link>
            <Link href="/business" onClick={() => setMenuOpen(false)}
              style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>For Teams</Link>
            <Link href="/insights" onClick={() => setMenuOpen(false)}
              style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.6rem', fontWeight:500, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', textDecoration:'none', padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Blogs</Link>
          </nav>

          <div style={{ marginTop:'auto', paddingTop:'2rem', display:'flex', flexDirection:'column', gap:'.6rem' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-ghost" style={{ width:'100%', padding:'14px' }}>Sign in</Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-ghost" style={{ width:'100%', padding:'14px' }}>Dashboard</Link>
            <Link href={STANDARD_STRIPE_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ width:'100%', padding:'15px' }}>GET TAPPED-IN</Link>
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
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.63rem' : '.7rem', fontWeight:500, color:'rgba(255,255,255,.5)', letterSpacing:'.22em', textTransform:'uppercase' }}>OUT NOW &middot; The Tapped-In Card</span>
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
                Tap your Tapped-In card to any phone and your whole digital profile opens instantly: links, contact, portfolio. No app, no friction. Engineered for a fast, reliable tap every time.
              </p>

              {/* CTAs */}
              <div className="hero-ctas" style={{
                display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap',
                marginBottom: isMobile ? '1.4rem' : '2.75rem',
                animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .26s both',
              }}>
                <Link href={STANDARD_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">GET TAPPED-IN</Link>
                <a href="#founding" className="btn-ghost" style={{ borderColor:'rgba(255,255,255,.28)' }}>Explore the Founder Edition</a>
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
              <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.74rem' : '.8rem', fontWeight:300, color:'rgba(255,255,255,.4)', letterSpacing:'.01em', lineHeight:1.6, maxWidth:440, marginBottom: isMobile ? '1.4rem' : '2.5rem' }}>&pound;34.99 &mdash; includes your card and first month of membership. Full membership plans launch September.</p>
              <div style={{ animation:'fadeIn 1.2s ease .55s both' }}>
                <div style={{ ...DIVIDER, marginBottom: isMobile ? '.9rem' : '1.25rem' }} />
                <div className="hero-stats" style={{ display:'flex', gap:'2.75rem', flexWrap:'wrap' }}>
                  {[{n:'Instant', l:'Tap to connect'},{n:'Any phone', l:'iPhone & Android'},{n:'No app', l:'Needed, ever'}].map((s,i)=>(
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
              <div style={EB}>The Tapped-In Card</div>
              <h2 style={H2}>Premium finish.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>Built to just work.</span></h2>
              <p style={SUB}>The everyday card, engineered for the strongest, most reliable tap on any phone. No app needed. A premium metal finish is coming soon.</p>
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
                { l:'Material',   v:'Premium PVC', s:'Unobstructed antenna, strongest tap' },
                { l:'Finish', v:'Matte black', s:'Metal finish coming soon' },
                { l:'Technology', v:'NFC + Digital Profile', s:'Tap-to-profile, no app needed' },
                { l:'Price', v:'£34.99', s:'Card + first month included' },
              ].map((d,i)=>(
                <div key={i} style={{ background:'#080808', padding: isMobile ? '1rem .9rem' : 'clamp(1.25rem,2.5vw,1.75rem)', display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.22)', letterSpacing:'.22em', textTransform:'uppercase' }}>{d.l}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'clamp(.88rem,2vw,1.35rem)', fontWeight:500, color:'#fff', lineHeight:1.2, letterSpacing:'0.01em' }}>{d.v}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:300, color:'rgba(255,255,255,.3)', lineHeight:1.55, letterSpacing:'0.01em' }}>{d.s}</div>
                </div>
              ))}
            </div>

                        <div className="reveal" style={{ textAlign:'center', marginTop: isMobile ? '1.75rem' : '3rem' }}>
              <Link href={STANDARD_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '12px 22px' : '16px 42px' }}>Order The Tapped-In Card</Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2.5 CHOOSE YOUR CARD (moved up)
        ════════════════════════════════════════════════════════════ */}
        <section id="editions" style={{ padding: SP }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(1.75rem,5vw,2.5rem)' : 'clamp(3.5rem,7vw,5rem)' }}>
              <div style={EB}>Choose your card</div>
              <h2 style={H2}>Three editions.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.32)' }}>One platform.</span></h2>
              <p style={SUB}>Your card includes your first month of membership. Full membership plans launch September. <Link href="/pricing" style={{ color:'#fff', textDecoration:'underline', textUnderlineOffset:'3px' }}>See all plans &amp; tiers →</Link></p>
            </div>

            <div className="future-grid reveal" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:720, margin:'0 auto' }}>
              {[
                { label:'The Tapped-In Card',   price:'£34.99', available:true,  note:'The everyday tap card. Premium matte finish — available now.' },
                { label:'Tapped-In Metal', price:'£49.99', available:false, note:'Heavier premium metal finish. Coming soon.' },
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
            2.6 PERSONAL vs TEAMS
        ════════════════════════════════════════════════════════════ */}
        <section id="who-its-for" style={{ padding: SP, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 50% 42%, black 12%, transparent 72%)', maskImage:'radial-gradient(ellipse 80% 70% at 50% 42%, black 12%, transparent 72%)', opacity: isMobile ? 0.5 : 1 }} />
          <div style={{ position:'absolute', top:'34%', left:'50%', transform:'translate(-50%,-50%)', width:760, height:460, background:'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 65%)', filter:'blur(8px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:1160, margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? 'clamp(2rem,5vw,3rem)' : 'clamp(3.5rem,7vw,5rem)' }}>
              <div style={EB}>Who it&apos;s for</div>
              <h2 style={H2}>One card for you.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>A whole platform for your team.</span></h2>
              <p style={SUB}>Whether you&apos;re networking solo or equipping an entire team, Tapped-In scales with you.</p>
            </div>

            <div className="future-grid reveal" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', maxWidth:940, margin:'0 auto' }}>

              <div style={{ position:'relative', background:'linear-gradient(155deg, rgba(14,14,14,0.96) 0%, rgba(9,9,9,0.98) 55%, rgba(12,12,12,0.96) 100%)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)', pointerEvents:'none', zIndex:5 }} />
                <div style={{ position:'relative', height:190, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 62%)', pointerEvents:'none' }} />
                  <div style={{ animation:'cardFloat 7s ease-in-out infinite', transform:'rotate(-6deg)' }}>
                    <CardFront size="sm" scale={0.82} />
                  </div>
                </div>
                <div style={{ padding: isMobile ? '1.5rem 1.25rem' : 'clamp(1.5rem,3vw,2.25rem)', display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.4)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:'.85rem' }}>For Individuals</div>
                  <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:600, color:'#fff', letterSpacing:'0.01em', lineHeight:1.1, marginBottom:'.75rem' }}>The Tapped-In Card</h3>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.9rem', fontWeight:300, color:'rgba(255,255,255,.4)', lineHeight:1.7, letterSpacing:'0.01em', marginBottom:'1.5rem' }}>Your own premium NFC card and live profile. Perfect for creators, freelancers and professionals who want to network like the future.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.6rem', marginBottom:'1.75rem' }}>
                    {['One tap to share everything','Your own live dashboard','First month of membership included'].map((f,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,.35)', flexShrink:0 }} />
                        <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.86rem', fontWeight:300, color:'rgba(255,255,255,.5)', letterSpacing:'0.01em' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'auto', display:'flex', alignItems:'baseline', gap:'.5rem', marginBottom:'1.25rem' }}>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.75rem', fontWeight:600, color:'#fff', letterSpacing:'0.02em' }}>£34.99</span>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:300, color:'rgba(255,255,255,.35)' }}>membership from Sept</span>
                  </div>
                  <Link href={STANDARD_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.85rem', padding:'14px 28px' }}>Get Tapped-In</Link>
                </div>
              </div>

              <div style={{ position:'relative', background:'linear-gradient(155deg, rgba(15,15,15,0.96) 0%, rgba(10,10,10,0.98) 55%, rgba(13,13,13,0.96) 100%)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 50%, transparent)', pointerEvents:'none', zIndex:5 }} />
                <div style={{ position:'relative', height:190, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.06) 0%, transparent 62%)', pointerEvents:'none' }} />
                  <div style={{ position:'relative', width:220, height:150, animation:'cardFloat 7s ease-in-out infinite' }}>
                    <div style={{ position:'absolute', top:24, left:6, transform:'rotate(-14deg)', opacity:.5 }}><CardFront size="sm" scale={0.62} /></div>
                    <div style={{ position:'absolute', top:14, left:34, transform:'rotate(-2deg)', opacity:.8 }}><CardFront size="sm" scale={0.62} /></div>
                    <div style={{ position:'absolute', top:4, left:64, transform:'rotate(9deg)' }}><CardFront size="sm" scale={0.62} /></div>
                  </div>
                </div>
                <div style={{ padding: isMobile ? '1.5rem 1.25rem' : 'clamp(1.5rem,3vw,2.25rem)', display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.85rem' }}>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, color:'rgba(255,255,255,.4)', letterSpacing:'.22em', textTransform:'uppercase' }}>For Teams &amp; Companies</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 8px 3px 7px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:2 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'dotBlink 2s ease-in-out infinite' }} />
                      <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.55rem', fontWeight:500, color:'rgba(255,255,255,.55)', letterSpacing:'.16em', textTransform:'uppercase' }}>Popular</span>
                    </div>
                  </div>
                  <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:600, color:'#fff', letterSpacing:'0.01em', lineHeight:1.1, marginBottom:'.75rem' }}>Tapped-In for Teams</h3>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.9rem', fontWeight:300, color:'rgba(255,255,255,.4)', lineHeight:1.7, letterSpacing:'0.01em', marginBottom:'1.5rem' }}>Equip your whole team with branded cards and a central dashboard. One consistent, premium identity across everyone.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.6rem', marginBottom:'1.75rem' }}>
                    {['Branded cards for every member','Central team dashboard','Volume pricing & free sample'].map((f,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,.35)', flexShrink:0 }} />
                        <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.86rem', fontWeight:300, color:'rgba(255,255,255,.5)', letterSpacing:'0.01em' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'auto', display:'flex', alignItems:'baseline', gap:'.5rem', marginBottom:'1.25rem' }}>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.75rem', fontWeight:600, color:'#fff', letterSpacing:'0.02em' }}>Custom</span>
                    <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:300, color:'rgba(255,255,255,.35)' }}>tailored to your team</span>
                  </div>
                  <Link href="/business" className="btn-ghost" style={{ fontSize:'.85rem', padding:'14px 28px', borderColor:'rgba(255,255,255,.28)' }}>Explore For Teams →</Link>
                </div>
              </div>
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
                { n:'01', title:'Tap your card',     body:'Hold your Tapped-In card to any phone and your digital profile opens instantly. No app, any device.', detail:'Works on iPhone & Android', mock:<MockTap scale={isMobile ? 0.7 : 0.92} /> },
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
{/* ════════════════════════════════════════════════════════════
            ABOUT — Our Story
        ════════════════════════════════════════════════════════════ */}
        <section id="about" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:820, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
              <div style={EB}>Our Story</div>
              <h2 style={H2}>Paper cards are dead.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>We built what comes next.</span></h2>
            </div>
            <div className="reveal d2" style={{ display:'flex', flexDirection:'column', gap:'1.4rem', maxWidth:640, margin:'0 auto', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>
              {[
                'Tapped-In started with a frustration. Handing out paper business cards that cost a fortune to print, only to watch them collect dust on someone\u2019s desk or get thrown away entirely. Most people never really wanted them in the first place. It wasn\u2019t just wasteful for the wallet. It was wasteful for the planet, printed on paper from felled trees, for something destined for the bin.',
                'So we built the new standard. One tap, and your whole profile is on their phone. Instant, premium, effortless. No paper, no printing, no waste. Every part of Tapped-In is built in house, from the ground up, with no third parties, so the experience stays exactly as premium as it should be.',
                'It began for creators, because that\u2019s who we are. Networking at events, fighting over loud music to get someone to add you on Instagram, repeating yourself, wasting the moment. Tapped-In fixes that. But it didn\u2019t stay there. Lawyers, estate agents and whole organisations started asking for it, so today the platform is built for creators and the businesses and teams who want to network like the future, not the past.',
              ].map((t,i)=>(
                <p key={i} style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.92rem' : '1.02rem', fontWeight:300, color:'rgba(255,255,255,.5)', lineHeight:1.85, letterSpacing:'0.01em', textAlign:'center' }}>{t}</p>
              ))}
            </div>
            <div className="reveal d3" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
              {[
                { h:'Instant', b:'One tap. Their phone opens your profile. No app, no friction.' },
                { h:'Sustainable', b:'No paper, no printing, no waste. Networking that doesn\u2019t cost the planet.' },
                { h:'Built in house', b:'Engineered from the ground up, with no third parties. Premium end to end.' },
              ].map((d,i)=>(
                <div key={i} style={{ background:'#070707', padding: isMobile ? '1.25rem 1rem' : 'clamp(1.5rem,3vw,2rem)', display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.98rem' : '1.1rem', fontWeight:500, color:'#fff', letterSpacing:'0.03em', textTransform:'uppercase' }}>{d.h}</div>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.86rem', fontWeight:300, color:'rgba(255,255,255,.32)', lineHeight:1.7, letterSpacing:'0.01em' }}>{d.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="founding" style={{ padding: SP, background:'#030303', position:'relative', overflow:'hidden' }}>
          {/* Soft glow */}
          <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:720, height:440, background:'radial-gradient(ellipse, rgba(255,255,255,0.022) 0%, transparent 65%)', filter:'blur(8px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:760, margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
              <div style={EB}>Founding 100</div>
              <h2 style={H2}>Once it&apos;s claimed,<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>it&apos;s gone for good.</span></h2>
              <p style={SUB}>The Founder Edition is a numbered metal collector&apos;s piece &mdash; 1 of 100, the first cards we ever made, never reproduced. Claim yours now and your card stays live for life with no monthly fee. From September, new Founders move to a member rate &mdash; so this free-for-life offer ends when the current run does.</p>
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
                { h:'No monthly fee', s:'Your card stays live free, for life.' },
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
                { icon:'◇', h:'Permanently numbered',  b:'Your card carries a serial number from 1 to 100. No duplicates. No reprints.' },
                { icon:'△', h:'First ever release',    b:'This is the first TAPPED-IN product. No cards existed before this drop.' },
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
        {/* Reviews — auto-hides until REVIEWS has entries (top of file) */}
        {shownReviews.length > 0 && (
        <section id="reviews" style={{ padding: SP, background:'#030303', position:'relative', overflow:'hidden' }}>
          <div style={{ maxWidth: 780, margin:'0 auto', padding:'0 24px', textAlign:'center' }}>
            <span style={{ display:'inline-block', fontFamily:'Oswald, Arial, sans-serif', fontWeight:500, textTransform:'uppercase', letterSpacing:'.34em', fontSize:12, color:'#7c7c85', marginBottom:22 }}>Reviews</span>
            <h2 style={{ fontFamily:'Oswald, Arial, sans-serif', fontWeight:600, fontSize:'clamp(34px,6vw,54px)', lineHeight:1.06, letterSpacing:'-0.01em', margin:'0 0 18px', color:'#fff' }}>Don&apos;t take our word for it.</h2>
            <p style={{ fontSize:'clamp(16px,2.3vw,18px)', lineHeight:1.6, color:'#9b9ba4', fontWeight:300, margin:'0 auto', maxWidth:'46ch' }}>Real members, real cards. Here&apos;s what happens when networking stops being paper.</p>
          </div>
          <ReviewsCarousel reviews={shownReviews} isMobile={isMobile} />
        </section>
        )}

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
              <Link href={STANDARD_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'.9rem', padding:'16px 40px' }}>Get Tapped-In</Link>
              <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ borderColor:'rgba(255,255,255,.28)' }}>Or claim a Founder card</Link>
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
                  { head:'Drop',    links:[['#product','The Card'],['#how-it-works','How it works'],['#editions','Editions'],['/insights','Blogs'],['/demo','Demo profile']] },
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