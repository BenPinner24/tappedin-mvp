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
}

const CARDS: Card[] = [
  { name: 'Standard PVC', price: '£34.99', material: 'Matte PVC', blurb: 'The everyday tap card. Premium matte finish, full platform access.', url: PVC_STRIPE_URL, cta: 'Buy now' },
  { name: 'Standard Metal', price: '£49.99', material: 'Brushed metal', blurb: 'Heavier premium metal card. Same digital profile, more presence.', url: METAL_STRIPE_URL },
  { name: 'Founders Edition', price: '£49.99', material: 'Matte black · numbered', tag: '100 only', blurb: '1 of 100, individually numbered. Bronze free for life — no monthly fee, ever.', url: FOUNDERS_STRIPE_URL, cta: 'Pre-order', founder: true },
]

type Tier = {
  name: string
  price: string
  forWho: string
  features: string[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  { name: 'Bronze', price: '£1', forWho: 'Keep your card live', features: ['Live profile & unlimited links', 'Save Contact + QR code', 'Basic taps & clicks count', '3 profile images'] },
  { name: 'Silver', price: '£3.99', forWho: 'Creators & freelancers', features: ['Everything in Bronze', 'Full analytics dashboard', 'Profile themes & customisation', 'Portfolio page (~12 images, 1 GB)', 'Remove TAPPED-IN branding'] },
  { name: 'Gold', price: '£7.99', forWho: 'Professionals & brands', highlight: true, features: ['Everything in Silver', 'Custom domain', 'Lead capture — see who taps', 'Booking / scheduling link', 'Video uploads', '30 GB storage', 'Priority support'] },
  { name: 'Platinum', price: '£16.99', forWho: 'Teams & agencies', features: ['Everything in Gold', 'Multiple cards on one account', 'Team management', 'Pooled team analytics', '80 GB storage', 'Dedicated support'] },
]

const STEPS = [
  { n: '01', h: 'Choose your card', b: 'A one-time payment. The card is yours to keep — no contract.' },
  { n: '02', h: '3 months, everything free', b: 'Full access to every feature, starting the day you activate your card.' },
  { n: '03', h: 'Then £1/month', b: 'Bronze keeps your card live and your data safe. Cancel anytime. Upgrade whenever you need more.' },
]

const FAQS = [
  { q: 'What happens after the 3 free months?', a: 'Your card moves to Bronze at £1/month, which keeps it active. If you choose not to continue, your profile simply pauses — visitors see a "reactivate" screen, and none of your data is deleted.' },
  { q: 'When do the 3 months start?', a: 'From the day you activate your card, not the day you buy it — so pre-orders never lose free time waiting for delivery.' },
  { q: 'Do Founders pay the monthly fee?', a: 'No. Founders Edition owners get Bronze free for life — the card stays active forever at no recurring cost. Upgrades to higher tiers are still optional.' },
  { q: 'Can I cancel?', a: 'Yes, anytime. There is no contract. Cancelling pauses your profile; your data is kept so you can reactivate later.' },
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
            <h1 style={s.h1}>Buy the card once.<br /><span style={s.h1dim}>Keep it for £1 a month.</span></h1>
            <p style={s.sub}>Every TAPPED-IN card is a one-time purchase with 3 months of full access included. After that, just £1/month keeps it live — or upgrade for more. No contract, cancel anytime.</p>
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
            <h2 style={s.h2}>One-time purchase</h2>
            <div style={s.cardsGrid} className="cards">
              {CARDS.map((c, i) => {
                const live = !!c.url
                return (
                  <div key={c.name} style={{ ...s.card, ...(c.founder ? s.cardFounder : {}), transitionDelay: `${i * 0.08}s` }} className={reveal ? 'r show' : 'r'}>
                    {c.tag && <span style={{ ...s.tag, ...(c.founder ? s.tagFounder : {}) }}>{c.tag}</span>}
                    <h3 style={s.cardName}>{c.name}</h3>
                    <p style={s.cardMaterial}>{c.material}</p>
                    <p style={s.cardPrice}>{c.price}<span style={s.cardOnce}> one-time</span></p>
                    <p style={s.cardBlurb}>{c.blurb}</p>
                    {live ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" style={c.founder ? s.buyPrimary : s.buy}>{c.cta || 'Pre-order'}</a>
                    ) : (
                      <span style={s.buyDisabled}>Coming soon</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={s.cardsNote}>Every card includes 3 months of full access from activation, then £1/month (Bronze) to stay live.</p>
          </section>

          {/* tiers */}
          <section style={s.section}>
            <p style={s.eyebrowCenter}>After your 3 months</p>
            <h2 style={s.h2}>Pick a plan that fits</h2>
            <p style={s.subCenter}>Your card always works at £1/month — the higher tiers just unlock more. Change or cancel anytime.</p>
            <div style={s.tiersGrid} className="tiers">
              {TIERS.map((t, i) => (
                <div key={t.name} style={{ ...s.tier, ...(t.highlight ? s.tierHighlight : {}), transitionDelay: `${i * 0.06}s` }} className={reveal ? 'r show' : 'r'}>
                  {t.highlight && <span style={s.tierBadge}>Popular</span>}
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
            <p style={s.cardsNote}>Annual billing (about 2 months free) coming soon on every tier.</p>
          </section>

          {/* terms */}
          <section style={s.section}>
            <div style={s.terms}>
              <p style={s.eyebrow}>How billing works</p>
              <p style={s.termsBody}>
                Your card is a one-time purchase. It includes <strong style={s.strong}>3 months of full premium access</strong>, starting when you activate it. After that, <strong style={s.strong}>£1/month (Bronze)</strong> keeps your card active and your data protected — you can cancel anytime, and cancelling simply pauses your public profile rather than deleting anything. Silver, Gold and Platinum are optional upgrades. <strong style={s.strong}>Founders Edition owners keep Bronze free for life</strong> and never pay a monthly fee.
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
              <a href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={s.buyPrimary}>Pre-order Founders Edition</a>
              <Link href="/demo" style={s.buy}>View demo profile</Link>
            </div>
          </section>

          {/* footer */}
          <footer style={s.footer}>
            <span style={s.footerBrand}>TAPPED-IN</span>
            <span style={s.footerSlogan}>A new standard of Networking.</span>
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
  .tiers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  a.pricing-buy:hover, .pricing-buy:hover { opacity: .88; }
  @media (max-width: 920px) {
    .cards { grid-template-columns: 1fr; }
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
  cardBlurb: { fontFamily: FF, fontSize: '.86rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.45)', marginBottom: '1.5rem', flex: 1 },
  buy: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: FF, fontSize: '.85rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s' },
  buyPrimary: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontFamily: FF, fontSize: '.85rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s' },
  buyDisabled: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,.3)', fontFamily: FF, fontSize: '.85rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase' },
  cardsNote: { fontFamily: FF, fontSize: '.82rem', fontWeight: 300, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: '1.75rem', lineHeight: 1.6 },

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
