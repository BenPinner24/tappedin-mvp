import { Resend } from 'resend'
import MultipackConfirmationEmail from '@/emails/MultipackConfirmation'

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

export interface SendMultipackConfirmationParams {
  to: string
  customerName?: string
  orderNumber?: string
  packName?: string   // e.g. "3-Pack" or "5-Pack"
  quantity?: number   // 3 or 5
}

export interface SendMultipackConfirmationResult {
  success: boolean
  id?: string
  error?: string
}

const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const REPLY_TO = 'contact@tappedin.uk'
const SUBJECT = 'Your TAPPED-IN Multi-Pack is confirmed'

export async function sendMultipackConfirmation(
  params: SendMultipackConfirmationParams
): Promise<SendMultipackConfirmationResult> {
  const { to, customerName, orderNumber, packName, quantity } = params

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
      react: MultipackConfirmationEmail({
        customerName,
        orderNumber,
        packName,
        quantity,
      }),
      headers: {
        'X-Entity-Ref-ID': orderNumber ?? `multipack-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendMultipackConfirmation] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendMultipackConfirmation] Exception:', err)
    return { success: false, error: message }
  }
}
