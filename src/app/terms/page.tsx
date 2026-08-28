import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How TAPPEDIN SPACE LTD collects, uses, and protects your personal data across the Tapped-In website, cards, and services — in line with the UK GDPR and the Data Protection Act 2018.',
}

// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN · PRIVACY POLICY  (/privacy)
// Static server component — no client JS needed, so the page ships as markup
// and real <meta> tags. Oswald for structure (brand), Inter for the body copy,
// because a policy has to be read, not just looked at.
// ─────────────────────────────────────────────────────────────────────────────

const CHAMP = '#E8C9A0'
const OSWALD = "'Oswald', Arial, sans-serif"
const INTER = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #050505; }
  body { background: #050505; color: #fff; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(255,255,255,0.1); }

  .pp-ambient {
    position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background:
      radial-gradient(ellipse 120% 55% at 50% 0%, rgba(255,255,255,0.030), transparent 62%),
      linear-gradient(180deg, #060606 0%, #040404 55%, #050505 100%);
  }

  .pp-link { color: ${CHAMP}; text-decoration: none; border-bottom: 1px solid rgba(232,201,160,0.3); transition: border-color .2s, color .2s; }
  .pp-link:hover { color: #f2ddc0; border-bottom-color: rgba(232,201,160,0.7); }

  .pp-back { color: rgba(255,255,255,.4); text-decoration: none; font-family: ${OSWALD}; font-size: .78rem; font-weight: 400; letter-spacing: .12em; text-transform: uppercase; transition: color .2s; }
  .pp-back:hover { color: rgba(255,255,255,.85); }

  .pp-foot-link { color: rgba(255,255,255,.25); text-decoration: none; font-family: ${OSWALD}; font-size: .8rem; font-weight: 400; letter-spacing: .04em; transition: color .2s; }
  .pp-foot-link:hover { color: rgba(255,255,255,.6); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`

const h2: React.CSSProperties = {
  fontFamily: OSWALD,
  fontSize: 'clamp(1.05rem, 2.6vw, 1.3rem)',
  fontWeight: 600,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: '#fff',
  lineHeight: 1.3,
}

const body: React.CSSProperties = {
  fontFamily: INTER,
  fontSize: 'clamp(.92rem, 1.9vw, 1rem)',
  fontWeight: 300,
  lineHeight: 1.85,
  color: 'rgba(255,255,255,.55)',
  letterSpacing: '.005em',
}

const itemStyle: React.CSSProperties = {
  ...body,
  display: 'flex',
  gap: '.85rem',
  alignItems: 'flex-start',
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '.9rem', marginBottom: '1rem' }}>
        <span style={{ fontFamily: OSWALD, fontSize: '.8rem', fontWeight: 500, letterSpacing: '.14em', color: CHAMP, opacity: .75, flexShrink: 0 }}>{n}</span>
        <h2 style={h2}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
      {items.map((text, i) => (
        <div key={i} style={itemStyle}>
          <span aria-hidden="true" style={{ color: CHAMP, opacity: .5, flexShrink: 0, lineHeight: 1.85 }}>—</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  )
}

export default function TermsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pp-ambient" aria-hidden="true" />

      <main style={{ minHeight: '100vh', padding: 'clamp(2rem, 6vw, 3.5rem) clamp(1.25rem, 5vw, 2rem) 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: 'clamp(3rem, 8vw, 5rem)' }}>
            <Link href="/" style={{ fontFamily: OSWALD, fontSize: '1rem', fontWeight: 600, letterSpacing: '.28em', color: '#fff', textDecoration: 'none', textTransform: 'uppercase' }}>
              TAPPED-IN
            </Link>
            <Link href="/" className="pp-back">← Back to site</Link>
          </div>

          {/* Title */}
          <header>
            <div style={{ fontFamily: OSWALD, fontSize: '.62rem', fontWeight: 500, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '1rem' }}>
              Legal
            </div>
            <h1 style={{ fontFamily: OSWALD, fontSize: 'clamp(2rem, 7vw, 3.2rem)', fontWeight: 600, letterSpacing: '.01em', textTransform: 'uppercase', color: '#fff', lineHeight: 1.08 }}>
              Terms &amp; Conditions
            </h1>
            <p style={{ fontFamily: OSWALD, fontSize: '.8rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginTop: '1rem' }}>
              Last updated: 28 August 2026
            </p>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${CHAMP}55, rgba(255,255,255,0.05) 45%, transparent)`, margin: 'clamp(1.75rem, 4vw, 2.5rem) 0 0' }} />
          </header>

          {/* Intro */}
          <p style={{ ...body, marginTop: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of the Tapped-In website and services, operated by TAPPEDIN SPACE LTD (&ldquo;Tapped-In&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a company registered in England and Wales (company number 17213352), registered address 66 Paul Street, London EC2A 4NA. By using our website, buying our products, or activating a card, you agree to these Terms. If you do not agree, please do not use our services.
          </p>

          <Section n="1" title="Our products and services">
            <p style={body}>
              Tapped-In provides NFC business cards and digital profile services. Each card links to a digital profile that you control through your account. We may update, improve, or change features of the service over time.
            </p>
          </Section>

          <Section n="2" title="Your account">
            <p style={body}>
              To use certain features you must create an account. You are responsible for keeping your login details secure and for all activity under your account. You must provide accurate information and keep it up to date. You must be at least 18 years old, or have permission from a parent or guardian, to create an account.
            </p>
          </Section>

          <Section n="3" title="Orders and payment">
            <p style={body}>
              Prices are shown on our website and may change from time to time. Payment is processed securely by Stripe; we do not store your card details. An order is accepted once payment is confirmed. If we cannot fulfil an order, we will let you know and arrange a refund.
            </p>
          </Section>

          <Section n="4" title="Subscriptions">
            <p style={body}>
              Some features (such as Tapped-In Gold) are provided on a subscription basis. Subscriptions renew automatically until cancelled. You can cancel at any time; cancellation takes effect at the end of your current billing period. Where a free period is offered, charges begin after that period ends unless you cancel.
            </p>
          </Section>

          <Section n="5" title="Delivery">
            <p style={body}>
              We aim to dispatch physical cards promptly after an order is confirmed. Delivery times are estimates and not guaranteed. Risk in the physical product passes to you on delivery.
            </p>
          </Section>

          <Section n="6" title="Cancellations and refunds">
            <p style={body}>
              You may have the right to cancel an order under UK consumer law. Physical cards that are personalised or activated may not be returnable once used, except where faulty. If a product is faulty, contact us and we will repair, replace, or refund as appropriate. Nothing in these Terms affects your statutory rights.
            </p>
          </Section>

          <Section n="7" title="Acceptable use">
            <p style={body}>You agree not to misuse the service, including by: uploading unlawful, offensive, or infringing content; impersonating others; attempting to gain unauthorised access to our systems; or using the service in a way that could damage or disrupt it. We may suspend or terminate accounts that breach these Terms.</p>
          </Section>

          <Section n="8" title="Your content">
            <p style={body}>
              You retain ownership of the content you add to your profile. By adding content, you grant us permission to host and display it as part of providing the service. You are responsible for ensuring you have the right to use any content you upload.
            </p>
          </Section>

          <Section n="9" title="Intellectual property">
            <p style={body}>
              The Tapped-In name, brand, website, and design are owned by TAPPEDIN SPACE LTD and may not be copied or used without our permission.
            </p>
          </Section>

          <Section n="10" title="Availability">
            <p style={body}>
              We aim to keep the service available and reliable, but we do not guarantee uninterrupted access. We may carry out maintenance or make changes that temporarily affect availability.
            </p>
          </Section>

          <Section n="11" title="Our liability">
            <p style={body}>
              We provide the service with reasonable care and skill. To the extent permitted by law, we are not liable for indirect or unforeseeable losses, or for issues outside our reasonable control. Nothing in these Terms limits our liability where it would be unlawful to do so, including for death or personal injury caused by negligence, or for fraud.
            </p>
          </Section>

          <Section n="12" title="Privacy">
            <p style={body}>
              Our use of your personal data is explained in our Privacy Policy at <Link href="/privacy" className="pp-link">tappedin.uk/privacy</Link>, which forms part of these Terms.
            </p>
          </Section>

          <Section n="13" title="Changes to these Terms">
            <p style={body}>
              We may update these Terms from time to time. When we do, we will change the &ldquo;last updated&rdquo; date. Continued use of the service after changes means you accept the updated Terms.
            </p>
          </Section>

          <Section n="14" title="Governing law">
            <p style={body}>
              These Terms are governed by the laws of England and Wales, and any disputes will be subject to the courts of England and Wales.
            </p>
          </Section>

          <Section n="15" title="Contact">
            <p style={body}>
              For any questions about these Terms, contact us at <a href="mailto:contact@tappedin.uk" className="pp-link">contact@tappedin.uk</a>.
            </p>
          </Section>

          {/* Footer */}
          <footer style={{ marginTop: 'clamp(3.5rem, 9vw, 6rem)', paddingBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 50%, transparent)', marginBottom: '2rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontFamily: OSWALD, fontSize: '.72rem', fontWeight: 400, color: 'rgba(255,255,255,.16)', letterSpacing: '.04em' }}>
                © 2026 TAPPEDIN SPACE LTD
              </span>
              <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
                <Link href="/" className="pp-foot-link">Home</Link>
                <Link href="/privacy" className="pp-foot-link">Privacy Policy</Link>
                <a href="mailto:contact@tappedin.uk" className="pp-foot-link">Contact</a>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </>
  )
}
