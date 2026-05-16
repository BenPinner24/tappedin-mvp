import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendFounderConfirmation } from '@/lib/email/sendFounderConfirmation'

// Stripe requires the raw body for signature verification.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.')
  _stripe = new Stripe(key)
  return _stripe
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set.')
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  let rawBody: string

  try {
    rawBody = await req.text()
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature.'
    console.error('[stripe/webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  // We only act on completed checkouts. Other events are acknowledged silently.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Only send for paid sessions.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'not paid' })
  }

  const recipient =
session.customer_details?.email ||
session.customer_email ||
undefined ||
undefined

  if (!recipient) {
    console.warn('[stripe/webhook] No recipient email on session', session.id)
    return NextResponse.json({ received: true, skipped: 'no email' })
  }

  const customerName =
    session.customer_details?.name?.trim().split(' ')[0] || undefined

  // Friendly order reference — last 8 chars of the session id, uppercased.
  const orderNumber = session.id ? session.id.slice(-8).toUpperCase() : undefined

  // Optional: pull edition number from session metadata if you set it in Stripe.
  const editionNumber =
    (session.metadata && session.metadata.edition_number) || undefined

  const result = await sendFounderConfirmation({
    to: recipient,
    customerName,
    orderNumber,
    editionNumber,
  })

  if (!result.success) {
    // Log but return 200 so Stripe doesn't retry forever for a downstream issue.
    console.error('[stripe/webhook] Email send failed:', result.error)
    return NextResponse.json({ received: true, emailed: false, error: result.error })
  }

  return NextResponse.json({ received: true, emailed: true, id: result.id })
}