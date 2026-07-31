import { Resend } from 'resend'
import CompanyEnquiryEmail from '@/emails/CompanyEnquiry'

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

export interface SendCompanyEnquiryParams {
  companyName: string
  contactName: string
  email: string
  teamSize?: string
  message?: string
}

export interface SendCompanyEnquiryResult {
  success: boolean
  id?: string
  error?: string
}

// Enquiries are sent TO you (the business owner), FROM your verified sender.
const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const TO = 'contact@tappedin.uk'

export async function sendCompanyEnquiry(
  params: SendCompanyEnquiryParams
): Promise<SendCompanyEnquiryResult> {
  const { companyName, contactName, email, teamSize, message } = params

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid contact email address.' }
  }

  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      // replyTo the enquirer, so you can just hit "Reply" to reach them.
      replyTo: email,
      subject: `New company enquiry — ${companyName}`,
      react: CompanyEnquiryEmail({
        companyName,
        contactName,
        email,
        teamSize,
        message,
      }),
      headers: {
        'X-Entity-Ref-ID': `enquiry-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendCompanyEnquiry] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendCompanyEnquiry] Exception:', err)
    return { success: false, error: message }
  }
}
