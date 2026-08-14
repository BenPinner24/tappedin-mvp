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

  const perksCell: React.CSSProperties = {
    padding: '0 32px 8px 32px',
  }

  const perkRow: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#c8c8c8',
    padding: '9px 0',
    borderBottom: '1px solid #141414',
  }

  const perkRowLast: React.CSSProperties = {
    ...perkRow,
    borderBottom: 'none',
  }

  const perkCheck: React.CSSProperties = {
    color: '#c9a86a',
    fontWeight: 600,
    paddingRight: '10px',
  }

  const upgradeNote: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.65,
    color: '#888888',
    margin: '18px 0 0 0',
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
        <title>Welcome to the TAPPED-IN Founders Edition</title>
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
          You are one of only 100. Your numbered Founders Edition card and lifetime perks are ready.
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
                        <p style={eyebrow}>Founders Edition · 1 of 100</p>
                        <h1 style={heading}>
                          {greeting}
                          <br />
                          <span style={headingLight}>You&apos;re one of the 100.</span>
                        </h1>
                        <p style={lead}>
                          There are only 100 Founders Edition cards, and one of them
                          is yours. Individually numbered, hand-finished, and never
                          reproduced. Being a Founder isn&apos;t just a card, it&apos;s a
                          permanent place at the start of something, with perks that
                          stay with you for life.
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
                              <td style={detailRowLabel}>Your Number</td>
                              <td style={detailRowValue}>
                                {editionNumber ? `${editionNumber} / 100` : '— / 100'}
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

                    {/* PERKS */}
                    <tr>
                      <td style={perksCell}>
                        <p style={sectionHeading}>Your Founder perks, free for life</p>

                        <div style={perkRow}>
                          <span style={perkCheck}>&#10003;</span>
                          Full analytics, so you can see every tap, view, and click
                        </div>
                        <div style={perkRow}>
                          <span style={perkCheck}>&#10003;</span>
                          Custom styling to make your profile unmistakably yours
                        </div>
                        <div style={perkRowLast}>
                          <span style={perkCheck}>&#10003;</span>
                          Connections, to save and grow your network
                        </div>

                        <p style={upgradeNote}>
                          Everything above is yours for life, at no ongoing cost. The
                          only thing not included is the portfolio gallery and media
                          storage, which you can add any time by upgrading to Silver
                          (£7.99/month) from your billing page. No pressure, it&apos;s
                          there if you ever want it.
                        </p>
                      </td>
                    </tr>

                    {/* DIVIDER */}
                    <tr>
                      <td style={dividerCell}>
                        <div style={divider}>&nbsp;</div>
                      </td>
                    </tr>

                    {/* STEPS */}
                    <tr>
                      <td style={{ ...stepsCell, paddingTop: '40px' }}>
                        <p style={sectionHeading}>Activating your card</p>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 01</p>
                          <p style={stepTitle}>Tap the right way round</p>
                          <p style={stepBody}>
                            Your card only taps from one side, and it&apos;s by design.
                            Tap with the front (the TAPPED-IN logo) facing down, so the
                            back, with your &ldquo;Founders Edition {editionNumber ? `${editionNumber}/100` : 'XXX/100'}&rdquo;,
                            is the side on show. Your number is always what people see
                            in the moment you connect.
                          </p>
                        </div>

                        <div style={stepBlock}>
                          <p style={stepNumber}>Step 02</p>
                          <p style={stepTitle}>Claim it to your profile</p>
                          <p style={stepBody}>
                            The first tap opens a short claim page. Sign in or create
                            your account and confirm, it takes seconds, no app required.
                            Your card is then linked to you, and your Founder perks are
                            applied automatically.
                          </p>
                        </div>

                        <div style={{ ...stepBlock, ...stepBlockLast }}>
                          <p style={stepNumber}>Step 03</p>
                          <p style={stepTitle}>Make it yours</p>
                          <p style={stepBody}>
                            Add your links, contact details, and styling from your
                            dashboard. Every future tap instantly shows your live
                            profile, ready whenever you are.
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