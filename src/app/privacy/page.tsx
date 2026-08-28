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

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p style={{ fontFamily: OSWALD, fontSize: '.8rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginTop: '1rem' }}>
              Last updated: 28 August 2026
            </p>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${CHAMP}55, rgba(255,255,255,0.05) 45%, transparent)`, margin: 'clamp(1.75rem, 4vw, 2.5rem) 0 0' }} />
          </header>

          {/* Intro */}
          <p style={{ ...body, marginTop: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
            This Privacy Policy explains how TAPPEDIN SPACE LTD (&ldquo;Tapped-In&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your personal data when you use our website, cards, and services. We are committed to protecting your privacy and to handling your data responsibly and in line with our obligations under UK data protection law, including the UK GDPR and the Data Protection Act 2018.
          </p>

          <Section n="1" title="Who we are">
            <p style={body}>
              TAPPEDIN SPACE LTD is a company registered in England and Wales (company number 17213352), registered address 66 Paul Street, London EC2A 4NA. We are the &ldquo;data controller&rdquo; responsible for your personal data. For any questions about this policy or your data, contact us at: <a href="mailto:contact@tappedin.uk" className="pp-link">contact@tappedin.uk</a>.
            </p>
          </Section>

          <Section n="2" title="What personal data we collect">
            <p style={body}>Depending on how you use Tapped-In, we may collect:</p>
            <List items={[
              'Account data (your name, email address, and a securely stored/hashed password);',
              'Profile data (information you choose to add: display or brand name, job title, company, phone number, social links, website, profile photo or images, and any other contact details you add);',
              'Usage & analytics (card taps including when a card is tapped, profile views, link clicks, and engagement statistics);',
              'Payment data (billing status, subscription tier, and your Stripe customer ID — we do NOT store your card numbers; payments are handled securely by Stripe);',
              'Company (Teams) data (for business/team accounts: company names, which team members belong to which company, manager relationships, and the account and profile data of team members);',
              'Technical data (IP address, browser type, and similar information collected automatically, plus cookies — see Section 8).',
            ]} />
          </Section>

          <Section n="3" title="How and why we use your data (lawful basis)">
            <p style={body}>We only use your data where we have a lawful basis:</p>
            <List items={[
              'to create and run your account and provide the service you signed up for (performance of a contract);',
              'to process payments and manage subscriptions (performance of a contract);',
              'to show your public profile when your card is tapped (performance of a contract);',
              'to provide analytics about your card and profile (legitimate interests);',
              'to keep our service secure and prevent fraud or abuse (legitimate interests);',
              'to send you service/transactional emails such as order confirmations (performance of a contract);',
              'and to send marketing only if applicable and you have opted in (consent).',
            ]} />
          </Section>

          <Section n="4" title="Who we share your data with">
            <p style={body}>We use trusted third-party service providers (&ldquo;processors&rdquo;) who only process your data on our instructions:</p>
            <List items={[
              'Supabase (our database — securely stores your account, profile, and related data);',
              'Stripe (processes payments and subscriptions);',
              'Vercel (hosts our website and application);',
              'Resend (sends our service emails);',
              'Cloudflare (provides website security and performance).',
            ]} />
            <p style={body}>
              Your public profile is, by its nature, visible to anyone who taps your card or visits your profile link — but only the information you choose to make public. We do not sell your personal data to anyone.
            </p>
          </Section>

          <Section n="5" title="International transfers">
            <p style={body}>
              Some of our providers may process data outside the UK. Where they do, we rely on appropriate safeguards (such as UK-approved data transfer mechanisms) to ensure your data remains protected to UK standards.
            </p>
          </Section>

          <Section n="6" title="How long we keep your data">
            <p style={body}>
              We keep your personal data for as long as your account is active, or as long as needed to provide our services and meet legal, accounting, or reporting requirements. If you close your account or ask us to delete your data, we will delete or anonymise it, except where we are legally required to keep certain records (for example, transaction records for tax purposes).
            </p>
          </Section>

          <Section n="7" title="Your rights">
            <p style={body}>Under UK data protection law, you have the right to:</p>
            <List items={[
              'access the personal data we hold about you;',
              'ask us to correct inaccurate or incomplete data;',
              'ask us to delete your data (the “right to erasure”);',
              'object to or restrict certain processing;',
              'request a copy of your data in a portable format;',
              'and withdraw consent at any time (where we rely on consent).',
            ]} />
            <p style={body}>
              To exercise any of these rights, email <a href="mailto:contact@tappedin.uk" className="pp-link">contact@tappedin.uk</a>. We will respond within one month.
            </p>
          </Section>

          <Section n="8" title="Cookies">
            <p style={body}>
              We only use essential cookies that are necessary to run the site — for example, to keep you logged in. We do not use analytics, advertising, or tracking cookies, and we do not use any third-party tracking tools. Because we only use essential cookies, no cookie consent banner is required. You can control cookies through your browser settings, though disabling essential cookies may affect how the site works.
            </p>
          </Section>

          <Section n="9" title="How we protect your data">
            <p style={body}>
              We take the security of your data seriously. We use reputable, secure infrastructure providers, protect access to our systems, and store passwords in a securely hashed form. While no online service can be guaranteed 100% secure, we take reasonable steps to protect your information.
            </p>
          </Section>

          <Section n="10" title="Complaints">
            <p style={body}>
              If you have a concern about how we handle your data, please contact us first at <a href="mailto:contact@tappedin.uk" className="pp-link">contact@tappedin.uk</a> so we can put it right. We will acknowledge your complaint and respond within the timeframes required by law. You also have the right to complain to the UK&rsquo;s data protection regulator, the Information Commissioner&rsquo;s Office (ICO), at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="pp-link">ico.org.uk</a> or by calling their helpline.
            </p>
          </Section>

          <Section n="11" title="Changes to this policy">
            <p style={body}>
              We may update this policy from time to time. When we do, we will change the &ldquo;last updated&rdquo; date at the top. Significant changes will be communicated where appropriate.
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
                <Link href="/pricing" className="pp-foot-link">Pricing</Link>
                <a href="mailto:contact@tappedin.uk" className="pp-foot-link">Contact</a>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </>
  )
}
