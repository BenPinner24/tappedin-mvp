import * as React from 'react'

interface StandardConfirmationEmailProps {
  customerName?: string
  orderNumber?: string
  cardName?: string
}

export function StandardConfirmationEmail({
  customerName,
  orderNumber,
  cardName,
}: StandardConfirmationEmailProps) {
  // Inline styles only — email clients strip <style> tags and most CSS classes.
  // Hex colors only (no rgba) for maximum client compatibility.

  const wrapper: React.CSSProperties = {
    margin: 0,
    padding: 0,
    width: '100%',
    backgroundColor: '#050505',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  }

  const container: React.CSSProperties = {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '0',
    backgroundColor: '#050505',
  }

  const headerCell: React.CSSProperties = {
    padding: '48px 32px 24px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #141414',
  }

  const logoText: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.38em',
    color: '#ffffff',
    textTransform: 'uppercase',
    margin: 0,
  }

  const heroCell: React.CSSProperties = {
    padding: '56px 32px 40px 32px',
    textAlign: 'center',
  }

  // Neutral silver accent for Standard (Founders uses gold #c9a86a)
  const eyebrow: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.32em',
    color: '#9a9a9a',
    textTransform: 'uppercase',
    margin: '0 0 24px 0',
  }

  const heading: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '30px',
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: '0.01em',
    color: '#ffffff',
    textTransform: 'uppercase',
    margin: '0 0 18px 0',
  }

  const headingLight: React.CSSProperties = {
    ...heading,
    fontWeight: 300,
    color: '#888888',
  }

  const lead: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#a8a8a8',
    margin: '0 auto',
    maxWidth: '440px',
  }

  const detailsCell: React.CSSProperties = {
    padding: '0 32px 40px 32px',
  }

  const detailsBox: React.CSSProperties = {
    border: '1px solid #1a1a1a',
    backgroundColor: '#0a0a0a',
    padding: '28px 24px',
  }

  const detailRowLabel: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.28em',
    color: '#5a5a5a',
    textTransform: 'uppercase',
    padding: '6px 0',
    verticalAlign: 'middle',
  }

  const detailRowValue: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    letterSpacing: '0.02em',
    padding: '6px 0',
    textAlign: 'right',
    verticalAlign: 'middle',
  }

  const sectionHeading: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.32em',
    color: '#9a9a9a',
    textTransform: 'uppercase',
    margin: '0 0 18px 0',
  }

  const stepsCell: React.CSSProperties = {
    padding: '0 32px 40px 32px',
  }

  const stepBlock: React.CSSProperties = {
    paddingBottom: '20px',
    borderBottom: '1px solid #141414',
    marginBottom: '20px',
  }

  const stepBlockLast: React.CSSProperties = {
    paddingBottom: 0,
    borderBottom: 'none',
    marginBottom: 0,
  }

  const stepNumber: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.32em',
    color: '#5a5a5a',
    textTransform: 'uppercase',
    margin: '0 0 6px 0',
  }

  const stepTitle: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '0.02em',
    margin: '0 0 8px 0',
  }

  const stepBody: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.65,
    color: '#888888',
    margin: 0,
  }

  // ── Setup section ──────────────────────────────────────────────────────
  // No panel, no border — presented like the other content sections: the
  // shared sectionHeading eyebrow, body copy, then the standard bulletproof
  // button. Same left-aligned rhythm and padding as the steps section.
  const setupCell: React.CSSProperties = {
    padding: '0 32px 40px 32px',
  }

  const setupLead: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#a8a8a8',
    margin: '0 0 24px 0',
  }

  const setupVideoLine: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#7a7a7a',
    margin: '20px 0 0 0',
  }

  const setupVideoLink: React.CSSProperties = {
    color: '#ffffff',
    textDecoration: 'underline',
  }

  const ctaCell: React.CSSProperties = {
    padding: '8px 32px 56px 32px',
    textAlign: 'center',
  }

  const ctaTable: React.CSSProperties = {
    margin: '0 auto',
    borderCollapse: 'separate',
  }

  const ctaButton: React.CSSProperties = {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    borderRadius: '2px',
  }

  const dividerCell: React.CSSProperties = {
    padding: '0 32px',
  }

  const divider: React.CSSProperties = {
    height: '1px',
    lineHeight: '1px',
    backgroundColor: '#141414',
    fontSize: 0,
  }

  const footerCell: React.CSSProperties = {
    padding: '32px 32px 48px 32px',
    textAlign: 'center',
  }

  const footerLine: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '11px',
    fontWeight: 400,
    letterSpacing: '0.18em',
    color: '#3a3a3a',
    textTransform: 'uppercase',
    margin: '0 0 10px 0',
  }

  const footerNote: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '11px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#3a3a3a',
    margin: 0,
  }

  const footerLink: React.CSSProperties = {
    color: '#7a7a7a',
    textDecoration: 'none',
  }

  const greeting = customerName ? `Welcome, ${customerName}.` : 'Welcome.'
  const cardLabel = cardName || 'Standard PVC'

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>Your TAPPED-IN order is confirmed</title>
      </head>
      <body style={wrapper}>
        {/* Preheader — hidden preview text */}
        <div
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
            fontSize: '1px',
            color: '#050505',
          }}
        >
          Your order is confirmed. Your TAPPED-IN card is being prepared for dispatch.
        </div>

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ backgroundColor: '#050505', width: '100%' }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '0' }}>
                <table
                  role="presentation"
                  width="560"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  style={container}
                >
                  <tbody>
                    {/* HEADER */}
                    <tr>
                      <td style={headerCell}>
                        <p style={logoText}>TAPPED-IN</p>
                      </td>
                    </tr>

                    {/* HERO */}
                    <tr>
                      <td style={heroCell}>
                        <p style={eyebrow}>Order Confirmed</p>
                        <h1 style={heading}>
                          {greeting}
                          <br />
                          <span style={headingLight}>Your card is on its way.</span>
                        </h1>
                        <p style={lead}>
                          Thank you for your order. Your {cardLabel} card is being
                          prepared and will be dispatched shortly. Your purchase
                          includes full access to every feature from the moment you
                          activate.
                        </p>
                      </td>
                    </tr>

                    {/* DETAILS */}
                    <tr>
                      <td style={detailsCell}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                          style={detailsBox}
                        >
                          <tbody>
                            <tr>
                              <td style={detailRowLabel}>Card</td>
                              <td style={detailRowValue}>{cardLabel}</td>
                            </tr>
                            {orderNumber ? (
                              <tr>
                                <td style={detailRowLabel}>Reference</td>
                                <td style={detailRowValue}>{orderNumber}</td>
                              </tr>
                            ) : null}
                            <tr>
                              <td style={detailRowLabel}>Included</td>
                              <td style={detailRowValue}>First month full access</td>
                            </tr>
                            <tr>
                              <td style={detailRowLabel}>Status</td>
                              <td style={detailRowValue}>Confirmed</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* SETTING UP YOUR CARD */}
                    <tr>
                      <td style={setupCell}>
                        <p style={sectionHeading}>Setting up your card</p>

                        <p style={setupLead}>
                          When your card arrives, setting it up takes two minutes.
                        </p>

                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ ...ctaTable, margin: 0 }}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ backgroundColor: '#ffffff', borderRadius: '2px' }}>
                                <a href="https://tappedin.uk/setup" style={ctaButton}>
                                  View the setup guide
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={setupVideoLine}>
                          Prefer to watch?{' '}
                          <a
                            href="https://youtube.com/shorts/Jr58Wntw25A"
                            style={setupVideoLink}
                          >
                            See the setup video
                          </a>
                        </p>
                      </td>
                    </tr>

                    {/* STEPS */}
                    <tr>
                      <td style={stepsCell}>
                        <p style={sectionHeading}>What to expect</p>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 01</p>
                          <p style={stepTitle}>Production &amp; dispatch</p>
                          <p style={stepBody}>
                            Your card is being prepared and dispatched to the address
                            you provided.
                          </p>
                        </div>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 02</p>
                          <p style={stepTitle}>Activation</p>
                          <p style={stepBody}>
                            Setting up your card takes just a couple of minutes — see
                            the setup guide above whenever you&apos;re ready.
                          </p>
                        </div>

                        <div style={{ ...stepBlock, ...stepBlockLast }}>
                          <p style={stepNumber}>Step 03</p>
                          <p style={stepTitle}>It&apos;s yours to keep.</p>
                          <p style={stepBody}>
                            Your card is yours — one purchase, no subscription. You get
                            full access to every feature to start, and your profile stays
                            live forever on our free plan. If you ever want extra
                            features, you can optionally upgrade to Silver — but you
                            never have to. No monthly fees required, ever.
                          </p>
                        </div>
                      </td>
                    </tr>

                    {/* CTA */}
                    <tr>
                      <td style={ctaCell}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={ctaTable}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ backgroundColor: '#ffffff', borderRadius: '2px' }}>
                                <a href="https://tappedin.uk" style={ctaButton}>
                                  Visit TAPPED-IN
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* DIVIDER */}
                    <tr>
                      <td style={dividerCell}>
                        <div style={divider}>&nbsp;</div>
                      </td>
                    </tr>

                    {/* FOOTER */}
                    <tr>
                      <td style={footerCell}>
                        <p style={footerLine}>TAPPED-IN</p>
                        <p style={footerNote}>
                          A new standard of networking.
                          <br />
                          Questions?{' '}
                          <a href="mailto:contact@tappedin.uk" style={footerLink}>
                            contact@tappedin.uk
                          </a>
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

export default StandardConfirmationEmail
