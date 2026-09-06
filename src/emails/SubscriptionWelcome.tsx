import * as React from 'react'

type Tier = 'bronze' | 'silver' | 'gold'

interface SubscriptionWelcomeEmailProps {
  customerName?: string
  tier?: Tier
  seats?: number
  renewalDate?: string // e.g. "7 September 2026"
}

// Per-tier content. Self-contained framing — each tier stands on its own,
// no "everything in the tier below" language (keeps the premium feel).
const TIERS: Record<Tier, {
  label: string
  monthly: string
  features: string[]
  teams?: boolean
}> = {
  bronze: {
    label: 'Bronze',
    monthly: '£3.99',
    features: [
      'Your live NFC card and digital profile',
      'Core profile links and one-tap Save Contact',
      'QR sharing',
      'Tap analytics',
      'Connect with other members',
    ],
  },
  silver: {
    label: 'Silver',
    monthly: '£3.99',
    features: [
      'Your live NFC card and digital profile',
      'Full analytics — trends, top links, devices, peak times, live feed',
      'Portfolio gallery with image storage',
      'Custom themes and styling',
      'Priority support',
    ],
  },
  gold: {
    label: 'Gold',
    monthly: '£4.99',
    teams: true,
    features: [
      'Live NFC cards and profiles for your whole team',
      'Manager dashboard with team-wide analytics',
      'Centralised team management',
      'Shared branding',
      'Priority support',
    ],
  },
}

export function SubscriptionWelcomeEmail({
  customerName,
  tier = 'bronze',
  seats = 1,
  renewalDate,
}: SubscriptionWelcomeEmailProps) {
  const t = TIERS[tier]

  // Ongoing price line. Gold is per seat, with the team total when >1.
  const ongoing = t.teams
    ? `${t.monthly} / month per member${seats > 1 ? ` (${seats} members — £${(4.99 * seats).toFixed(2)}/month)` : ''}`
    : `${t.monthly} / month`

  // ── styles (mirrors StandardConfirmation) ─────────────────────────────────
  const wrapper: React.CSSProperties = {
    margin: 0, padding: 0, width: '100%', backgroundColor: '#050505',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  }
  const container: React.CSSProperties = {
    maxWidth: '560px', margin: '0 auto', padding: '0', backgroundColor: '#050505',
  }
  const headerCell: React.CSSProperties = {
    padding: '48px 32px 24px 32px', textAlign: 'center', borderBottom: '1px solid #141414',
  }
  const logoText: React.CSSProperties = {
    fontSize: '14px', fontWeight: 600, letterSpacing: '0.38em', color: '#ffffff',
    textTransform: 'uppercase', margin: 0,
  }
  const heroCell: React.CSSProperties = { padding: '56px 32px 40px 32px', textAlign: 'center' }
  const eyebrow: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: '#9a9a9a',
    textTransform: 'uppercase', margin: '0 0 24px 0',
  }
  const heading: React.CSSProperties = {
    fontSize: '30px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '0.01em',
    color: '#ffffff', textTransform: 'uppercase', margin: '0 0 18px 0',
  }
  const headingLight: React.CSSProperties = { ...heading, fontWeight: 300, color: '#888888' }
  const lead: React.CSSProperties = {
    fontSize: '15px', fontWeight: 400, lineHeight: 1.7, color: '#a8a8a8',
    margin: '0 auto', maxWidth: '440px',
  }
  const detailsCell: React.CSSProperties = { padding: '0 32px 40px 32px' }
  const detailsBox: React.CSSProperties = {
    border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', padding: '28px 24px',
  }
  const detailRowLabel: React.CSSProperties = {
    fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', color: '#5a5a5a',
    textTransform: 'uppercase', padding: '6px 0', verticalAlign: 'middle',
  }
  const detailRowValue: React.CSSProperties = {
    fontSize: '14px', fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em',
    padding: '6px 0', textAlign: 'right', verticalAlign: 'middle',
  }
  const sectionHeading: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: '#9a9a9a',
    textTransform: 'uppercase', margin: '0 0 18px 0',
  }
  const featureCell: React.CSSProperties = { padding: '0 32px 40px 32px' }
  const featureRow: React.CSSProperties = {
    fontSize: '14px', fontWeight: 400, lineHeight: 1.5, color: '#c8c8c8',
    padding: '9px 0', borderBottom: '1px solid #141414',
  }
  const featureRowLast: React.CSSProperties = { ...featureRow, borderBottom: 'none' }
  const stepsCell: React.CSSProperties = { padding: '0 32px 40px 32px' }
  const stepBlock: React.CSSProperties = {
    paddingBottom: '20px', borderBottom: '1px solid #141414', marginBottom: '20px',
  }
  const stepBlockLast: React.CSSProperties = { paddingBottom: 0, borderBottom: 'none', marginBottom: 0 }
  const stepNumber: React.CSSProperties = {
    fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: '#5a5a5a',
    textTransform: 'uppercase', margin: '0 0 6px 0',
  }
  const stepTitle: React.CSSProperties = {
    fontSize: '15px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.02em', margin: '0 0 8px 0',
  }
  const stepBody: React.CSSProperties = {
    fontSize: '14px', fontWeight: 400, lineHeight: 1.65, color: '#888888', margin: 0,
  }
  const ctaCell: React.CSSProperties = { padding: '8px 32px 56px 32px', textAlign: 'center' }
  const ctaButton: React.CSSProperties = {
    display: 'inline-block', padding: '14px 32px', backgroundColor: '#ffffff', color: '#000000',
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
    textDecoration: 'none', borderRadius: '2px',
  }
  const dividerCell: React.CSSProperties = { padding: '0 32px' }
  const divider: React.CSSProperties = { height: '1px', lineHeight: '1px', backgroundColor: '#141414', fontSize: 0 }
  const footerCell: React.CSSProperties = { padding: '32px 32px 48px 32px', textAlign: 'center' }
  const footerLine: React.CSSProperties = {
    fontSize: '11px', fontWeight: 400, letterSpacing: '0.18em', color: '#3a3a3a',
    textTransform: 'uppercase', margin: '0 0 10px 0',
  }
  const footerNote: React.CSSProperties = {
    fontSize: '11px', fontWeight: 400, lineHeight: 1.7, color: '#3a3a3a', margin: 0,
  }
  const footerLink: React.CSSProperties = { color: '#7a7a7a', textDecoration: 'none' }

  const greeting = customerName ? `Welcome, ${customerName}.` : 'Welcome.'

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>{`Welcome to Tapped-In ${t.label}`}</title>
      </head>
      <body style={wrapper}>
        <div style={{ display: 'none', overflow: 'hidden', lineHeight: '1px', opacity: 0,
          maxHeight: 0, maxWidth: 0, fontSize: '1px', color: '#050505' }}>
          Your Tapped-In {t.label} membership is active. Your card is live.
        </div>

        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}
          style={{ backgroundColor: '#050505', width: '100%' }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '0' }}>
                <table role="presentation" width="560" cellPadding={0} cellSpacing={0} border={0} style={container}>
                  <tbody>
                    {/* HEADER */}
                    <tr><td style={headerCell}><p style={logoText}>TAPPED-IN</p></td></tr>

                    {/* HERO */}
                    <tr>
                      <td style={heroCell}>
                        <p style={eyebrow}>Membership Confirmed</p>
                        <h1 style={heading}>
                          {greeting}
                          <br />
                          <span style={headingLight}>You&apos;re on {t.label}.</span>
                        </h1>
                        <p style={lead}>
                          Your Tapped-In {t.label} membership is active and your card is
                          live. You now have the full {t.label} toolkit at {t.monthly}/month
                          — and your card stays live for as long as you&apos;re a member.
                        </p>
                      </td>
                    </tr>

                    {/* DETAILS */}
                    <tr>
                      <td style={detailsCell}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={detailsBox}>
                          <tbody>
                            <tr>
                              <td style={detailRowLabel}>Plan</td>
                              <td style={detailRowValue}>Tapped-In {t.label}</td>
                            </tr>
                            <tr>
                              <td style={detailRowLabel}>Monthly</td>
                              <td style={detailRowValue}>{ongoing}</td>
                            </tr>
                            {renewalDate ? (
                              <tr>
                                <td style={detailRowLabel}>Renews</td>
                                <td style={detailRowValue}>{renewalDate}</td>
                              </tr>
                            ) : null}
                            <tr>
                              <td style={detailRowLabel}>Status</td>
                              <td style={detailRowValue}>Active</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* WHAT'S INCLUDED */}
                    <tr>
                      <td style={featureCell}>
                        <p style={sectionHeading}>Your {t.label} membership</p>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                          <tbody>
                            {t.features.map((f, i) => (
                              <tr key={i}>
                                <td style={i === t.features.length - 1 ? featureRowLast : featureRow}>{f}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* HOW IT WORKS */}
                    <tr>
                      <td style={stepsCell}>
                        <p style={sectionHeading}>How your membership works</p>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 01</p>
                          <p style={stepTitle}>Your card is live now</p>
                          <p style={stepBody}>
                            Tap it against any phone and your profile opens instantly —
                            no app needed for the person receiving it.
                          </p>
                        </div>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 02</p>
                          <p style={stepTitle}>Everything is unlocked</p>
                          <p style={stepBody}>
                            Your {t.label} features are active now — set everything up
                            exactly how you want it from your dashboard.
                          </p>
                        </div>

                        <div style={{ ...stepBlock, ...stepBlockLast }}>
                          <p style={stepNumber}>Step 03</p>
                          <p style={stepTitle}>{t.label}, month to month</p>
                          <p style={stepBody}>
                            Your membership continues at {ongoing}. It keeps your card live
                            and your profile active — manage or cancel anytime from the billing
                            page in your account.
                          </p>
                        </div>
                      </td>
                    </tr>

                    {/* CTA */}
                    <tr>
                      <td style={ctaCell}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 auto', borderCollapse: 'separate' }}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ backgroundColor: '#ffffff', borderRadius: '2px' }}>
                                <a href="https://tappedin.uk/dashboard" style={ctaButton}>Open your dashboard</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* DIVIDER */}
                    <tr><td style={dividerCell}><div style={divider}>&nbsp;</div></td></tr>

                    {/* FOOTER */}
                    <tr>
                      <td style={footerCell}>
                        <p style={footerLine}>TAPPED-IN</p>
                        <p style={footerNote}>
                          A new standard of networking.
                          <br />
                          Questions?{' '}
                          <a href="mailto:contact@tappedin.uk" style={footerLink}>contact@tappedin.uk</a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export default SubscriptionWelcomeEmail
