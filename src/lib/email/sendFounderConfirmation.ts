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
const SUBJECT = 'Your TAPPED-IN Founders Edition is reserved'

export async function sendFounderConfirmation(
  params: SendFounderConfirmationParams
): Promise<SendFounderConfirmationResult> {
  const { to, customerName, orderNumber, editionNumber, allocationTotal } = params

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' }
  }

  // Build the allocation string e.g. "4 of 100" if both values present
  const editionDisplay =
    editionNumber != null && allocationTotal != null
      ? `${editionNumber} of ${allocationTotal}`
      : editionNumber

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
        editionNumber: editionDisplay,
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