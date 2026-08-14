import { Resend } from 'resend'
import FounderConfirmationEmail from '@/emails/FounderConfirmation'

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

export interface SendFounderConfirmationParams {
  to: string
  customerName?: string
  orderNumber?: string
  editionNumber?: string | number
  allocationTotal?: number
}

export interface SendFounderConfirmationResult {
  success: boolean
  id?: string
  error?: string
}

const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const REPLY_TO = 'contact@tappedin.uk'
const SUBJECT = 'Welcome to the TAPPED-IN Founders Edition'

export async function sendFounderConfirmation(
  params: SendFounderConfirmationParams
): Promise<SendFounderConfirmationResult> {
  const { to, customerName, orderNumber, editionNumber } = params

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' }
  }

  // Pass the raw edition number straight through — the email template formats it
  // once as "N / 100". (allocationTotal stays in the params type for the caller
  // but is no longer needed here.)

  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: SUBJECT,
      react: FounderConfirmationEmail({
        customerName,
        orderNumber,
        editionNumber,
      }),
      headers: {
        'X-Entity-Ref-ID': orderNumber ?? `founders-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendFounderConfirmation] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendFounderConfirmation] Exception:', err)
    return { success: false, error: message }
  }
}