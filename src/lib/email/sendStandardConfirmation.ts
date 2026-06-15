import { Resend } from 'resend'
import StandardConfirmationEmail from '@/emails/StandardConfirmation'

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

export interface SendStandardConfirmationParams {
  to: string
  customerName?: string
  orderNumber?: string
  cardName?: string
}

export interface SendStandardConfirmationResult {
  success: boolean
  id?: string
  error?: string
}

const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const REPLY_TO = 'contact@tappedin.uk'
const SUBJECT = 'Your TAPPED-IN order is confirmed'

export async function sendStandardConfirmation(
  params: SendStandardConfirmationParams
): Promise<SendStandardConfirmationResult> {
  const { to, customerName, orderNumber, cardName } = params

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' }
  }

  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: SUBJECT,
      react: StandardConfirmationEmail({
        customerName,
        orderNumber,
        cardName,
      }),
      headers: {
        'X-Entity-Ref-ID': orderNumber ?? `standard-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendStandardConfirmation] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendStandardConfirmation] Exception:', err)
    return { success: false, error: message }
  }
}
