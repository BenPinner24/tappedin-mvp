import * as React from 'react'

interface FounderConfirmationEmailProps {
  customerName?: string
  orderNumber?: string
  editionNumber?: string | number
}

export function FounderConfirmationEmail({
  customerName,
  orderNumber,
  editionNumber,
}: FounderConfirmationEmailProps) {
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

  const eyebrow: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.32em',
    color: '#c9a86a',
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
    color: '#c9a86a',
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
    color: '#7a6442',
    textDecoration: 'none',
  }

  const greeting = customerName ? `Welcome, ${customerName}.` : 'Welcome.'

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>Your TAPPED-IN Founders Edition is reserved</title>
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
          Your place among the first 100 is secured. Your numbered Founders Edition card is being prepared.
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
                        <p style={eyebrow}>Founders Edition · Reserved</p>
                        <h1 style={heading}>
                          {greeting}
                          <br />
                          <span style={headingLight}>Your place is secured.</span>
                        </h1>
                        <p style={lead}>
                          You are now among the first 100 to hold a TAPPED-IN card.
                          Each one is individually numbered, hand-finished, and will
                          never be reproduced. Your reservation has been confirmed.
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
                              <td style={detailRowLabel}>Edition</td>
                              <td style={detailRowValue}>Founders</td>
                            </tr>
                            <tr>
                              <td style={detailRowLabel}>Allocation</td>
                              <td style={detailRowValue}>
                                {editionNumber ? `${editionNumber} / 100` : '1 of 100'}
                              </td>
                            </tr>
                            {orderNumber ? (
                              <tr>
                                <td style={detailRowLabel}>Reference</td>
                                <td style={detailRowValue}>{orderNumber}</td>
                              </tr>
                            ) : null}
                            <tr>
                              <td style={detailRowLabel}>Status</td>
                              <td style={detailRowValue}>Confirmed</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* STEPS */}
                    <tr>
                      <td style={stepsCell}>
                        <p style={sectionHeading}>What to expect</p>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 01</p>
                          <p style={stepTitle}>Production updates</p>
                          <p style={stepBody}>
                            We&apos;ll keep you informed by email as your numbered card
                            moves through finishing and dispatch.
                          </p>
                        </div>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 02</p>
                          <p style={stepTitle}>Activation, closer to launch</p>
                          <p style={stepBody}>
                            Activation instructions will arrive nearer to delivery.
                            Pairing your card to your profile takes seconds — no app
                            required.
                          </p>
                        </div>

                        <div style={{ ...stepBlock, ...stepBlockLast }}>
                          <p style={stepNumber}>Step 03</p>
                          <p style={stepTitle}>Your live profile</p>
                          <p style={stepBody}>
                            When the time comes, you&apos;ll be invited to set up your
                            digital profile — links, portfolio, contact, and more —
                            ready the moment your card is activated.
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
                        <p style={footerLine}>TAPPED-IN · Founders Edition</p>
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

export default FounderConfirmationEmail