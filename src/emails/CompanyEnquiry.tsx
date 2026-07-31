import * as React from 'react'

interface CompanyEnquiryEmailProps {
  companyName?: string
  contactName?: string
  email?: string
  teamSize?: string
  message?: string
}

export function CompanyEnquiryEmail({
  companyName,
  contactName,
  email,
  teamSize,
  message,
}: CompanyEnquiryEmailProps) {
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
    padding: '8px 0',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
    paddingRight: '18px',
  }

  const detailRowValue: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    letterSpacing: '0.02em',
    padding: '8px 0',
    textAlign: 'right',
    verticalAlign: 'top',
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

  const messageCell: React.CSSProperties = {
    padding: '0 32px 40px 32px',
  }

  const messageBox: React.CSSProperties = {
    border: '1px solid #1a1a1a',
    backgroundColor: '#0a0a0a',
    padding: '24px',
  }

  const messageText: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#cccccc',
    margin: 0,
    whiteSpace: 'pre-wrap',
  }

  const ctaCell: React.CSSProperties = {
    padding: '8px 32px 56px 32px',
    textAlign: 'center',
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

  const company = companyName || 'A company'
  const replyHref = email ? `mailto:${email}` : 'https://tappedin.uk'

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>New company enquiry — TAPPED-IN</title>
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
          New company enquiry from {company}. Team size: {teamSize || 'not specified'}.
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
                        <p style={eyebrow}>New Company Enquiry</p>
                        <h1 style={heading}>
                          {company}
                          <br />
                          <span style={headingLight}>wants to talk teams.</span>
                        </h1>
                        <p style={lead}>
                          A new company enquiry has come in from the For Teams page.
                          Their details are below — just reply to this email to reach
                          them directly.
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
                              <td style={detailRowLabel}>Company</td>
                              <td style={detailRowValue}>{company}</td>
                            </tr>
                            {contactName ? (
                              <tr>
                                <td style={detailRowLabel}>Contact</td>
                                <td style={detailRowValue}>{contactName}</td>
                              </tr>
                            ) : null}
                            {email ? (
                              <tr>
                                <td style={detailRowLabel}>Email</td>
                                <td style={detailRowValue}>{email}</td>
                              </tr>
                            ) : null}
                            {teamSize ? (
                              <tr>
                                <td style={detailRowLabel}>Team size</td>
                                <td style={detailRowValue}>{teamSize}</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* MESSAGE */}
                    {message ? (
                      <tr>
                        <td style={messageCell}>
                          <p style={sectionHeading}>Their message</p>
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding={0}
                            cellSpacing={0}
                            border={0}
                            style={messageBox}
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <p style={messageText}>{message}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}

                    {/* CTA */}
                    <tr>
                      <td style={ctaCell}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 auto', borderCollapse: 'separate' }}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ backgroundColor: '#ffffff', borderRadius: '2px' }}>
                                <a href={replyHref} style={ctaButton}>
                                  Reply to {contactName || company}
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
                          Company enquiry via tappedin.uk/business
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

export default CompanyEnquiryEmail
