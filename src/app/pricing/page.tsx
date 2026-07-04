'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ── Stripe checkout links ──────────────────────────────────────────────────
// Founders link is live. PVC + Metal get filled in once you create those
// products in Stripe (Phase 2). While a link is empty, its button shows
// "Coming soon" instead of "Pre-order".
const FOUNDERS_STRIPE_URL = 'https://buy.stripe.com/dRm8wR9TzeXvaRb5WvcfK00'
const PVC_STRIPE_URL = 'https://buy.stripe.com/dRm14pc1H16F9N7et1cfK03'
const METAL_STRIPE_URL = ''

// Multi-Pack (PVC bundles) — one person, one profile, several cards.
const PACK_3_URL = 'https://buy.stripe.com/fZu14p9Tz2aJf7r1GfcfK05'
const PACK_5_URL = 'https://buy.stripe.com/aFaaEZ7Lr2aJ9N73OncfK04'

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

type Card = {
  name: string
  price: string
  material: string
  tag?: string
  blurb: string
  url: string
  cta?: string
  founder?: boolean
  sub?: string
}

const CARDS: Card[] = [
  { name: 'The Tapped-In Card', price: '£34.99', material: 'Premium PVC', blurb: 'The everyday card, engineered for the strongest, most reliable tap on any phone. No app needed.', url: PVC_STRIPE_URL, cta: 'Buy now', sub: '3 months included, then £1/mo' },
  { name: 'Tapped-In Metal', price: '£49.99', material: 'Brushed metal', blurb: 'A heavier premium metal finish. Same instant digital profile, more presence.', url: METAL_STRIPE_URL },
  { name: 'Founders Edition', price: '£49.99', material: 'Matte black · numbered', tag: '100 only', blurb: '1 of 100, individually numbered. The first cards we ever made. Your card stays live for life with no monthly fee. Premium tiers are optional upgrades, the same as any card.', url: FOUNDERS_STRIPE_URL, cta: 'Order now', founder: true, sub: 'No monthly fee to stay live' },
]

type Pack = {
  name: string
  qty: number
  price: string
  rrp: string
  save: string
  per: string
  blurb: string
  url: string
  best?: boolean
}

const PACKS: Pack[] = [
  { name: '3-Pack', qty: 3, price: '£94.47', rrp: '£104.97', save: 'Save 10%', per: '£31.49 per card', blurb: 'For the wallet, the phone case, and the desk.', url: PACK_3_URL },
  { name: '5-Pack', qty: 5, price: '£148.71', rrp: '£174.95', save: 'Save 15%', per: '£29.74 per card', blurb: 'Cover every pocket — and keep spares to hand.', url: PACK_5_URL, best: true },
]

type Tier = {
  name: string
  price: string
  forWho: string
  features: string[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  { name: 'Bronze', price: '£1', forWho: 'Keep your card live', features: ['Live profile & unlimited links', 'Save Contact + QR code', 'Basic analytics (taps & clicks)', '3 profile images'] },
  { name: 'Silver', price: '£3.99', forWho: 'Creators & freelancers', features: ['Everything in Bronze', 'Detailed analytics dashboard', 'Profile themes & customisation', 'Portfolio page (~12 images, 1 GB)'] },
  { name: 'Gold', price: '£7.99', forWho: 'Professionals & brands', features: ['Everything in Silver', 'Lead capture — see who taps', 'Video uploads', '30 GB storage', 'Priority support'] },
  { name: 'Platinum', price: '£16.99', forWho: 'Teams & agencies', features: ['Everything in Gold', 'Multiple cards on one account', 'Team management', 'Pooled team analytics', '80 GB storage', 'Dedicated support'] },
]

const STEPS = [
  { n: '01', h: 'Get your card', b: 'A single one-time payment — the card is yours to keep, with no contract and no surprises.' },
  { n: '02', h: 'Everything included', b: 'Every feature we\u2019ve built is yours the moment you activate — nothing locked behind extra fees.' },
  { n: '03', h: 'Stay live for £1 — soon', b: 'A simple monthly plan to keep your card live long-term is on the way. Founders Edition stays free for life.' },
]

const FAQS = [
  { q: 'Which phones does it work on?', a: 'Tapped-In works with the NFC reader built into virtually any modern smartphone. On iPhone, hold the top of the phone to the card. On Android, use the centre of the back. There is no app to download, for you or the person you are sharing with.' },
  { q: 'Where exactly do I tap?', a: 'On iPhone, the NFC reader sits at the very top edge, so tap the card there. On Android it is usually the centre of the back. If nothing happens straight away, move the card slowly around that area so it lines up with the reader.' },
  { q: 'Is the Founders Edition single or double-sided?', a: 'The Founders Edition is single-sided by design, with the numbered collector\u2019s design on one face. The everyday PVC Tapped-In Card is the workhorse, built for the strongest, most reliable tap.' },
  { q: 'Is the Founders tap as strong as the standard card?', a: 'Honestly, no. The PVC Tapped-In Card has the strongest, most reliable tap because its material leaves the antenna unobstructed. The Founders Edition is a premium metal collector\u2019s card, so its tap can be a little more particular about positioning. For heavy daily use, reach for the PVC. The Founders is the keepsake.' },
  { q: 'What makes the Founders Edition special?', a: 'The Founders Edition is a true collector\u2019s item. It is the first 100 cards Tapped-In ever made, each individually numbered from 1 to 100. This edition will never be reproduced or restocked, so once all 100 are claimed, no more will ever exist. Owning one isn\u2019t just a card, it is a permanent piece of the brand\u2019s origin, held by only 100 people, ever.' },
  { q: 'Do I or the other person need an app?', a: 'No. Neither of you needs to install anything. Your card opens your profile straight in the browser, so anyone can receive it instantly.' },
  { q: 'What if someone\u2019s phone will not tap?', a: 'You are never stuck. Every profile also has its own QR code and a shareable link, so you can share it even if a tap does not land.' },
]

export default function PricingPage() {
  const [reveal, setReveal] = useState(false)
  useEffect(() => { setReveal(true) }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <main style={s.page}>
        <div aria-hidden="true" style={s.grain} />
        <div aria-hidden="true" style={s.glow} />

        {/* top bar */}
        <header style={s.topbar}>
          <Link href="/" style={s.logo}>TAPPED-IN</Link>
          <Link href="/" style={s.back}>← Back to site</Link>
        </header>

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* hero */}
          <section style={s.hero} className={reveal ? 'r show' : 'r'}>
            <p style={s.eyebrow}>Pricing</p>
            <h1 style={s.h1}>Everything included.<br /><span style={s.h1dim}>Yours for just £1 a month.</span></h1>
            <p style={s.sub}>Your TAPPED-IN card comes with full access to everything we&apos;ve built — nothing locked away, nothing extra to unlock. A simple £1/month plan to keep it live long-term is launching soon, with optional upgrades if you ever want more.</p>
          </section>

          {/* how it works */}
          <section style={s.section}>
            <div style={s.stepsGrid} className="steps">
              {STEPS.map((st, i) => (
                <div key={st.n} style={{ ...s.step, transitionDelay: `${i * 0.08}s` }} className={reveal ? 'r show' : 'r'}>
                  <span style={s.stepNum}>{st.n}</span>
                  <h3 style={s.stepH}>{st.h}</h3>
                  <p style={s.stepB}>{st.b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* cards */}
          <section style={s.section}>
            <p style={s.eyebrowCenter}>Choose your card</p>
            <h2 style={s.h2}>Yours to keep</h2>
            <div style={s.cardsGrid} className="cards">
              {CARDS.map((c, i) => {
                const live = !!c.url
                return (
                  <div key={c.name} style={{ ...s.card, ...(c.founder ? s.cardFounder : {}), transitionDelay: `${i * 0.08}s` }} className={reveal ? 'r show' : 'r'}>
                    {c.tag && <span style={{ ...s.tag, ...(c.founder ? s.tagFounder : {}) }}>{c.tag}</span>}
                    <h3 style={s.cardName}>{c.name}</h3>
                    <p style={s.cardMaterial}>{c.material}</p>
                    <p style={s.cardPrice}>{c.price}</p>
                    {c.sub && <p style={s.cardSub}>{c.sub}</p>}
                    <p style={s.cardBlurb}>{c.blurb}</p>
                    {live ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" style={c.founder ? s.buyPrimary : s.buy}>{c.cta || 'Order'}</a>
                    ) : (
                      <span style={s.buyDisabled}>Coming soon</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={s.cardsNote}>Every card comes with full access to everything we&apos;ve built. A £1/month plan to keep it live is coming soon — Founders Edition stays free for life.</p>
          </section>

          {/* multi-pack */}
          <section style={s.section}>
            <p style={s.eyebrowCenter}>Buy in packs</p>
            <h2 style={s.h2}>One profile. Every pocket.</h2>
            <p style={s.subCenter}>Keep a Tapped-In Card everywhere — wallet, phone case, desk. Every card in a pack opens the same profile with one tap, always in sync. The more you add, the less you pay per card.</p>
            <div style={s.packsGrid} className="packs">
              {PACKS.map((p) => {
                const best = !!p.best
                return (
                  <div key={p.name} style={{ ...s.card, ...(best ? s.cardFounder : {}) }} className={reveal ? 'r show' : 'r'}>
                    {best && <span style={{ ...s.tag, ...s.tagFounder }}>Best value</span>}
                    <h3 style={s.cardName}>{p.name}</h3>
                    <p style={s.cardMaterial}>{p.qty} PVC cards · one profile</p>
                    <p style={s.cardPrice}>{p.price}</p>
                    <p style={s.packMeta}><span style={s.packRrp}>{p.rrp}</span><span style={s.packSave}>{p.save}</span><span>{p.per}</span></p>
                    <p style={s.cardBlurb}>{p.blurb}</p>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={best ? s.buyPrimary : s.buy}>Order {p.name}</a>
                  </div>
                )
              })}
            </div>
            <p style={s.cardsNote}>Multi-Packs are PVC. All cards share one profile — so when the £1/month plan launches, that&apos;s one plan, never a fee per card. Need cards for a team, each with their own profile? Team Packs coming soon.</p>
          </section>

          {/* tiers */}
          <section style={s.section}>
            <p style={s.eyebrowCenter}>What&apos;s next</p>
            <h2 style={s.h2}>Monthly plans are coming</h2>
            <p style={s.subCenter}>Right now, every card includes full access to everything we&apos;ve built — your profile, unlimited links, QR, Save Contact, analytics and gallery, all included. These optional monthly plans are simply what&apos;s coming next.</p>
            <div style={s.tiersGrid} className="tiers">
              {TIERS.map((t, i) => (
                <div key={t.name} style={{ ...s.tier, ...(t.highlight ? s.tierHighlight : {}), transitionDelay: `${i * 0.06}s` }} className={reveal ? 'r show' : 'r'}>
                  <span style={s.tierBadge}>Soon</span>
                  <h3 style={s.tierName}>{t.name}</h3>
                  <p style={s.tierFor}>{t.forWho}</p>
                  <p style={s.tierPrice}>{t.price}<span style={s.tierPer}>/mo</span></p>
                  <div style={s.tierLine} />
                  <ul style={s.featList}>
                    {t.features.map((f) => (
                      <li key={f} style={s.feat}>
                        <span style={s.check}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p style={s.cardsNote}>Plans, prices and features shown here are planned and may change before launch.</p>
          </section>

          {/* terms */}
          <section style={s.section}>
            <div style={s.terms}>
              <p style={s.eyebrow}>How billing works</p>
              <p style={s.termsBody}>
                Your card is a one-time purchase, and it unlocks <strong style={s.strong}>full access to everything we&apos;ve built</strong> — yours from the moment you activate. We&apos;re rolling out a simple <strong style={s.strong}>£1/month plan (Bronze)</strong> to keep cards live long-term, with optional Silver, Gold and Platinum upgrades for more. <strong style={s.strong}>Founders Edition owners are set for life</strong> — Bronze free, no monthly fee, ever. We&apos;ll share full details before any monthly billing begins.
              </p>
            </div>
          </section>

          {/* faq */}
          <section style={s.section}>
            <h2 style={s.h2}>Questions</h2>
            <div style={s.faqWrap}>
              {FAQS.map((f) => (
                <div key={f.q} style={s.faq}>
                  <p style={s.faqQ}>{f.q}</p>
                  <p style={s.faqA}>{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* final cta */}
          <section style={s.finalCta}>
            <h2 style={s.h2}>Ready to tap in?</h2>
            <div style={s.ctaRow}>
              <a href={PVC_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={s.buyPrimary}>Order The Tapped-In Card</a>
              <a href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={s.buy}>Order Founders Edition</a>
            </div>
          </section>

          {/* footer */}
          <footer style={s.footer}>
            <span style={s.footerBrand}>TAPPED-IN</span>
            <span style={s.footerSlogan}>The New Standard for Networking.</span>
          </footer>

        </div>
      </main>
    </>
  )
}

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #030303; }
  .r { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(0.16,1,0.3,1), transform .7s cubic-bezier(0.16,1,0.3,1); }
  .r.show { opacity: 1; transform: translateY(0); }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
  .packs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; max-width: 720px; margin: 0 auto; }
  .tiers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  a.pricing-buy:hover, .pricing-buy:hover { opacity: .88; }
  @media (max-width: 920px) {
    .cards { grid-template-columns: 1fr; }
    .packs { grid-template-columns: 1fr; }
    .tiers { grid-template-columns: 1fr 1fr; }
    .steps { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .tiers { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    .r { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
`

const FF = `'Oswald', 'Arial Narrow', sans-serif`

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: FF, position: 'relative', overflow: 'hidden', WebkitFontSmoothing: 'antialiased', paddingBottom: '4rem' },
  grain: { position: 'fixed', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '220px 220px', pointerEvents: 'none', zIndex: 0 },
  glow: { position: 'fixed', top: '-160px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '460px', background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 68%)', filter: 'blur(10px)', pointerEvents: 'none', zIndex: 0 },

  topbar: { position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem clamp(1.25rem, 4vw, 3rem)', maxWidth: 1200, margin: '0 auto', width: '100%' },
  logo: { fontFamily: FF, fontSize: '.78rem', fontWeight: 600, letterSpacing: '.3em', color: '#fff', textDecoration: 'none' },
  back: { fontFamily: FF, fontSize: '.8rem', fontWeight: 400, letterSpacing: '.04em', color: 'rgba(255,255,255,.4)', textDecoration: 'none' },

  hero: { maxWidth: 760, margin: '0 auto', padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)', textAlign: 'center' },
  eyebrow: { fontFamily: FF, fontSize: '.68rem', fontWeight: 500, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '1.25rem' },
  eyebrowCenter: { fontFamily: FF, fontSize: '.68rem', fontWeight: 500, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '.85rem', textAlign: 'center' },
  h1: { fontFamily: FF, fontSize: 'clamp(2.4rem, 7vw, 4rem)', fontWeight: 600, lineHeight: 1.02, letterSpacing: '.005em', marginBottom: '1.5rem' },
  h1dim: { color: 'rgba(255,255,255,.4)', fontWeight: 300 },
  sub: { fontFamily: FF, fontSize: 'clamp(.95rem, 2vw, 1.1rem)', fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,.5)', maxWidth: 600, margin: '0 auto' },
  subCenter: { fontFamily: FF, fontSize: '1rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.45)', maxWidth: 560, margin: '0 auto 2.5rem', textAlign: 'center' },

  section: { maxWidth: 1100, margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 2rem) 0' },
  h2: { fontFamily: FF, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 600, letterSpacing: '.01em', textAlign: 'center', marginBottom: '2.5rem', lineHeight: 1.1 },

  stepsGrid: {},
  step: { padding: '1.75rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, background: 'linear-gradient(155deg, rgba(13,13,13,0.7), rgba(9,9,9,0.8))' },
  stepNum: { fontFamily: FF, fontSize: '1.4rem', fontWeight: 600, color: 'rgba(255,255,255,.18)', letterSpacing: '.05em' },
  stepH: { fontFamily: FF, fontSize: '1.15rem', fontWeight: 500, color: '#fff', margin: '.75rem 0 .5rem' },
  stepB: { fontFamily: FF, fontSize: '.9rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.45)' },

  cardsGrid: {},
  card: { position: 'relative', padding: '2rem 1.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, background: 'linear-gradient(155deg, rgba(14,14,14,0.9), rgba(9,9,9,0.95))', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' },
  cardFounder: { border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(155deg, rgba(22,22,22,0.95), rgba(11,11,11,0.98))' },
  tag: { position: 'absolute', top: 16, right: 16, fontFamily: FF, fontSize: '.58rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '4px 10px' },
  tagFounder: { color: '#000', background: '#fff', border: '1px solid #fff' },
  cardName: { fontFamily: FF, fontSize: '1.4rem', fontWeight: 600, color: '#fff', letterSpacing: '.01em' },
  cardMaterial: { fontFamily: FF, fontSize: '.72rem', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginTop: 4 },
  cardPrice: { fontFamily: FF, fontSize: '2.2rem', fontWeight: 600, color: '#fff', margin: '1.25rem 0 .25rem' },
  cardOnce: { fontSize: '.8rem', fontWeight: 300, color: 'rgba(255,255,255,.4)', letterSpacing: '.02em' },
  cardSub: { fontFamily: FF, fontSize: '.8rem', fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,.42)', letterSpacing: '.02em', marginBottom: '.5rem' },
  cardBlurb: { fontFamily: FF, fontSize: '.86rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.45)', marginBottom: '1.5rem', flex: 1 },
  buy: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: FF, fontSize: '.85rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s' },
  buyPrimary: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontFamily: FF, fontSize: '.85rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s' },
  buyDisabled: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,.3)', fontFamily: FF, fontSize: '.85rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase' },
  cardsNote: { fontFamily: FF, fontSize: '.82rem', fontWeight: 300, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: '1.75rem', lineHeight: 1.6 },
  packsGrid: {},
  packMeta: { fontFamily: FF, fontSize: '.8rem', fontWeight: 300, color: 'rgba(255,255,255,.5)', letterSpacing: '.02em', marginBottom: '.9rem', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  packRrp: { textDecoration: 'line-through', color: 'rgba(255,255,255,.3)' },
  packSave: { color: '#fff', fontWeight: 500 },

  tiersGrid: {},
  tier: { position: 'relative', padding: '1.75rem 1.4rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, background: 'linear-gradient(155deg, rgba(13,13,13,0.8), rgba(9,9,9,0.9))', display: 'flex', flexDirection: 'column' },
  tierHighlight: { border: '1px solid rgba(255,255,255,0.22)', background: 'linear-gradient(155deg, rgba(20,20,20,0.92), rgba(11,11,11,0.96))', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' },
  tierBadge: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontFamily: FF, fontSize: '.58rem', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#000', background: '#fff', borderRadius: 999, padding: '3px 12px' },
  tierName: { fontFamily: FF, fontSize: '1.2rem', fontWeight: 600, color: '#fff' },
  tierFor: { fontFamily: FF, fontSize: '.74rem', fontWeight: 400, color: 'rgba(255,255,255,.38)', letterSpacing: '.02em', marginTop: 2 },
  tierPrice: { fontFamily: FF, fontSize: '1.9rem', fontWeight: 600, color: '#fff', marginTop: '.9rem' },
  tierPer: { fontSize: '.78rem', fontWeight: 300, color: 'rgba(255,255,255,.4)' },
  tierLine: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '1.1rem 0' },
  featList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.6rem' },
  feat: { fontFamily: FF, fontSize: '.82rem', fontWeight: 300, color: 'rgba(255,255,255,.6)', lineHeight: 1.4, display: 'flex', gap: '8px', alignItems: 'flex-start' },
  check: { color: 'rgba(255,255,255,.5)', fontWeight: 500, flexShrink: 0 },

  terms: { maxWidth: 760, margin: '0 auto', padding: '2rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, background: 'rgba(255,255,255,0.015)' },
  termsBody: { fontFamily: FF, fontSize: '.92rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,.5)', marginTop: '1rem' },
  strong: { color: 'rgba(255,255,255,.85)', fontWeight: 500 },

  faqWrap: { maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  faq: { padding: '1.4rem 1.5rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(255,255,255,0.012)' },
  faqQ: { fontFamily: FF, fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '.5rem' },
  faqA: { fontFamily: FF, fontSize: '.88rem', fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,.45)' },

  finalCta: { maxWidth: 760, margin: '0 auto', padding: 'clamp(3rem, 7vw, 5rem) 1.5rem 2rem', textAlign: 'center' },
  ctaRow: { display: 'flex', gap: '.85rem', justifyContent: 'center', flexWrap: 'wrap' },

  footer: { maxWidth: 1100, margin: '3rem auto 0', padding: '2rem 1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  footerBrand: { fontFamily: FF, fontSize: '.6rem', fontWeight: 600, letterSpacing: '.3em', color: 'rgba(255,255,255,.16)' },
  footerSlogan: { fontFamily: FF, fontSize: '.7rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.12)' },
}
