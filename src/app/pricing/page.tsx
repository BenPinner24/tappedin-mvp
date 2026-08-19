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
const MEMBER_CTA_HREF = PVC_STRIPE_URL

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
  { name: 'The Tapped-In Card', price: '£34.99', material: 'Premium PVC', blurb: 'The everyday card, engineered for the strongest, most reliable tap on any phone. No app needed.', url: MEMBER_CTA_HREF, cta: 'Get your card', sub: 'Card + first month of full access included' },
  { name: 'Tapped-In Metal', price: '£49.99', material: 'Brushed metal', blurb: 'A heavier premium metal finish. Same instant digital profile, more presence.', url: METAL_STRIPE_URL },
  { name: 'Founders Edition', price: '£49.99', material: 'Matte black · numbered', tag: '100 only', blurb: 'A numbered collector’s piece. 1 of 100 of the first metal cards we ever made. Owning it is the point: a permanent asset, held by only 100 people, ever. Tap it to reveal your number and show you hold one of the original 100. For everyday networking, the Tapped-In Card gives the strongest, most reliable tap.', url: FOUNDERS_STRIPE_URL, cta: 'Order now', founder: true, sub: 'A numbered collector’s card · Stays live for life' },
]

type Tier = {
  name: string
  price: string
  forWho: string
  features: string[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  { name: 'Bronze', price: 'Free', forWho: 'Your plan after month one', features: ['Your live card & digital profile', 'Core links, Save Contact & QR', 'Basic tap analytics', 'Connect with other members', 'No subscription needed — stays live free'] },
  { name: 'Silver', price: '£7.99', forWho: 'Optional upgrade', features: ['Everything in Bronze', 'Full analytics dashboard', 'Custom themes & advanced styling', 'Downloadable QR code', 'Portfolio gallery with storage (coming soon)', 'Priority support'], highlight: true },
]

const STEPS = [
  { n: '01', h: 'Get your card', b: 'Order your premium Tapped-In card today and make it yours — set up your profile in minutes.' },
  { n: '02', h: 'Tap to share', b: 'One tap shares your profile, links and contact details with anyone — no app needed, on either side.' },
  { n: '03', h: 'Upgrade only if you want', b: 'Your first month includes the full dashboard. After that your card stays live for free, and you can unlock the full toolkit any time for £7.99 a month. Change or cancel whenever you like.' },
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
            <h1 style={s.h1}>One tap.<br /><span style={s.h1dim}>Your whole world.</span></h1>
            <p style={s.sub}>A premium NFC card and a digital profile that shares everything about you in a single tap. Buy the card once — your first month of full access is included.</p>
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
                      <a href={c.url} {...(c.url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })} style={c.founder ? s.buyPrimary : s.buy}>{c.cta || 'Order'}</a>
                    ) : (
                      <span style={s.buyDisabled}>Coming soon</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={s.cardsNote}>Every card includes your first month of full access. After that your card stays live for free — upgrade to the full toolkit only if you want it.</p>
          </section>

          {/* tiers */}
          <section style={s.section}>
            <p style={s.eyebrowCenter}>Plans</p>
            <h2 style={s.h2}>Choose your plan</h2>
            <p style={s.subCenter}>Your first month is full access. After that, stay on the free Bronze plan or upgrade to Silver whenever you want more.</p>
            <div style={s.tiersGrid} className="tiers">
              {TIERS.map((t, i) => (
                <div key={t.name} style={{ ...s.tier, ...(t.highlight ? s.tierHighlight : {}), transitionDelay: `${i * 0.06}s` }} className={reveal ? 'r show' : 'r'}>
                  
                  <h3 style={s.tierName}>{t.name}</h3>
                  <p style={s.tierFor}>{t.forWho}</p>
                  <p style={s.tierPrice}>{t.price}{t.price !== 'Free' && <span style={s.tierPer}>/mo</span>}</p>
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
 
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <a href={MEMBER_CTA_HREF} target="_blank" rel="noopener noreferrer" style={s.buyPrimary}>Get your card</a>
            </div>

            {/* Teams call-out — links to the dedicated /business page */}
            <div style={s.teamsCallout} className={reveal ? 'r show' : 'r'}>
              <div style={s.teamsCalloutInner}>
                <div>
                  <p style={s.teamsEyebrow}>For Teams &amp; Agencies</p>
                  <h3 style={s.teamsTitle}>Equipping a whole team?</h3>
                  <p style={s.teamsBody}>Branded cards for every team member, a manager dashboard, and company-wide analytics. Built as its own package.</p>
                </div>
                <Link href="/business" style={s.teamsBtn}>Explore For Teams →</Link>
              </div>
            </div>
 
            <p style={s.cardsNote}>Existing cardholders are looked after, and early supporters keep their special status. Founders Edition owners keep their permanent collector&apos;s status.</p>
          </section>

          {/* terms */}
          <section style={s.section}>
            <div style={s.terms}>
              <p style={s.eyebrow}>How billing works</p>
              <p style={s.termsBody}>
                You buy your Tapped-In card once, for <strong style={s.strong}>£34.99</strong>, and that includes your <strong style={s.strong}>first month of full access</strong> to everything. After the first month, your card and profile <strong style={s.strong}>stay live for free</strong> on our Bronze plan, keeping the essentials for good. Want the full toolkit — advanced analytics, styling and your QR code? Upgrade to Silver for <strong style={s.strong}>£7.99 a month</strong>, whenever you like, and cancel anytime. There&apos;s <strong style={s.strong}>no forced subscription</strong>. <strong style={s.strong}>Existing cardholders are looked after</strong>, and Founders Edition owners keep their permanent collector&apos;s status, live for life.
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
              <a href={PVC_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={s.buyPrimary}>Get your card</a>
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
   .tiers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; max-width: 720px; margin: 0 auto; }
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
  cardSub: { fontFamily: FF, fontSize: '.8rem', fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,.42)', letterSpacing: '.02em', marginBottom: '.5rem' },
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
 
  teamsCallout: { marginTop: '1.75rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, background: 'linear-gradient(155deg, rgba(20,20,20,0.9), rgba(11,11,11,0.96))', padding: '2rem' },
  teamsCalloutInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' },
  teamsEyebrow: { fontFamily: FF, fontSize: '.62rem', fontWeight: 600, letterSpacing: '.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.6rem' },
  teamsTitle: { fontFamily: FF, fontSize: '1.5rem', fontWeight: 600, color: '#fff', letterSpacing: '.01em', marginBottom: '.5rem' },
  teamsBody: { fontFamily: FF, fontSize: '.9rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.5)', maxWidth: 480 },
  teamsBtn: { flexShrink: 0, display: 'inline-block', textAlign: 'center', padding: '13px 26px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontFamily: FF, fontSize: '.82rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s' },

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
