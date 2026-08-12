import { Resend } from 'resend'
import SubscriptionWelcomeEmail from '@/emails/SubscriptionWelcome'

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

type Tier = 'bronze' | 'silver' | 'gold'

export interface SendSubscriptionWelcomeParams {
  to: string
  customerName?: string
  tier: Tier
  seats?: number
  renewalDate?: string
  orderNumber?: string
}

export interface SendSubscriptionWelcomeResult {
  success: boolean
  id?: string
  error?: string
}

const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const REPLY_TO = 'contact@tappedin.uk'

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}

export async function sendSubscriptionWelcome(
  params: SendSubscriptionWelcomeParams
): Promise<SendSubscriptionWelcomeResult> {
  const { to, customerName, tier, seats, renewalDate, orderNumber } = params

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' }
  }
  if (!tier || !TIER_LABEL[tier]) {
    return { success: false, error: 'Invalid or missing tier.' }
  }

  const subject = `Welcome to Tapped-In ${TIER_LABEL[tier]}`

  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      react: SubscriptionWelcomeEmail({
        customerName,
        tier,
        seats,
        renewalDate,
      }),
      headers: {
        'X-Entity-Ref-ID': orderNumber ?? `subscription-${tier}-${Date.now()}`,
      },
    })

    if (error) {
      console.error('[sendSubscriptionWelcome] Resend error:', error)
      return { success: false, error: error.message ?? 'Resend send failed.' }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email.'
    console.error('[sendSubscriptionWelcome] Exception:', err)
    return { success: false, error: message }
  }
}
