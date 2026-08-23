import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY is not set in environment variables.')
  }
  _resend = new Resend(key)
  return _resend
}

export interface SendWaitlistSignupParams {
  name: string
  email: string
  preference?: string
}

export interface SendWaitlistSignupResult {
  success: boolean
  id?: string
  error?: string
}

// Signups are sent TO you (the business owner), FROM your verified sender.
const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const TO = 'contact@tappedin.uk'

// Signup details are typed by the public, so escape them before they go in the
// email body. Keeps a stray < or & from breaking the layout.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendWaitlistSignup(
  params: SendWaitlistSignupParams
): Promise<SendWaitlistSignupResult> {
  const { name, email, preference } = params

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid signup email address.' }
  }

  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      // replyTo the person who signed up, so you can just hit "Reply" to reach them.
      replyTo: email,
      subject: 'New waitlist signup',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px;">
          <p style="font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin: 0 0 6px;">Tapped-In</p>
          <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 24px;">New waitlist signup</h1>
          <table cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="color: rgba(255,255,255,0.45); padding: 0 16px 8px 0;">Name</td>
              <td style="color: #ffffff; padding: 0 0 8px;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="color: rgba(255,255,255,0.45); padding: 0 16px 8px 0;">Email</td>
              <td style="color: #ffffff; padding: 0 0 8px;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="color: rgba(255,255,255,0.45); padding: 0 16px 8px 0;">Preference</td>
              <td style="color: #ffffff; padding: 0 0 8px;">${preference ? escapeHtml(preference) : 'Not given'}</td>
            </tr>
          </table>
        </div>
      `,
      headers: {
        'X-Entity-Ref-ID': `waitlist-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendWaitlistSignup] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendWaitlistSignup] Exception:', err)
    return { success: false, error: message }
  }
}
