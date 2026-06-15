import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendFounderConfirmation } from '@/lib/email/sendFounderConfirmation'
import { sendStandardConfirmation } from '@/lib/email/sendStandardConfirmation'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Standard PVC card product ID ─────────────────────────────────────────────
// This is the Stripe Product ID for the Standard PVC card (Stripe → Products →
// Standard PVC → "prod_..."). Matching on product ID means a price change won't
// break this. If it's empty/wrong, PVC orders fall through to the Founders flow.
const PVC_PRODUCT_ID = 'prod_UhzE8eaEZgXQiR'

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

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // 1. Only continue if paid
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'not paid' })
  }

  const recipient =
    session.customer_details?.email ||
    session.customer_email ||
    undefined

  if (!recipient) {
    console.warn('[stripe/webhook] No recipient email on session', session.id)
    return NextResponse.json({ received: true, skipped: 'no email' })
  }

  const customerName =
    session.customer_details?.name?.trim().split(' ')[0] || undefined

  const orderNumber = session.id ? session.id.slice(-8).toUpperCase() : undefined

  // ── Determine which product was purchased ──────────────────────────────────
  // checkout.session.completed doesn't include line items, so fetch them.
  const stripeClient = getStripe()
  let purchasedProductId: string | undefined
  try {
    const lineItems = await stripeClient.checkout.sessions.listLineItems(session.id, { limit: 1 })
    const priceProduct = lineItems.data[0]?.price?.product
    purchasedProductId = typeof priceProduct === 'string' ? priceProduct : priceProduct?.id
  } catch (err) {
    console.error('[stripe/webhook] Could not fetch line items:', err)
  }

  // ── STANDARD PVC ORDER ──────────────────────────────────────────────────────
  // A plain one-off purchase: send the Standard confirmation email and stop.
  // No Founders card is allocated.
  if (purchasedProductId && purchasedProductId === PVC_PRODUCT_ID) {
    const standardResult = await sendStandardConfirmation({
      to: recipient,
      customerName,
      orderNumber,
      cardName: 'Standard PVC',
    })

    if (!standardResult.success) {
      console.error('[stripe/webhook] Standard email send failed:', standardResult.error)
      return NextResponse.json({ received: true, emailed: false, error: standardResult.error })
    }

    return NextResponse.json({ received: true, emailed: true, id: standardResult.id, type: 'standard' })
  }

  // ── FOUNDERS ORDER (default — unchanged) ────────────────────────────────────
  const supabase = createAdminClient()

  // 2. Prevent duplicate processing
  const { data: existingOrder } = await supabase
    .from('founder_orders')
    .select('id, card_id, allocation_number')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log('[stripe/webhook] Session already processed:', session.id)
    return NextResponse.json({ received: true, skipped: 'already processed' })
  }

  // 3. Find the first available Founder card
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('card_id, status')
    .eq('batch_id', 'founders-edition-2026')
    .eq('status', 'unclaimed')
    .order('card_id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (cardError) {
    console.error('[stripe/webhook] Error fetching founder card:', cardError)
    return NextResponse.json({ received: true, emailed: false, error: cardError.message }, { status: 500 })
  }

  // 4. If no cards remain — sold out
  if (!card) {
    console.warn('[stripe/webhook] No founder cards remaining for session:', session.id)
    return NextResponse.json({ received: true, emailed: false, error: 'Sold out' })
  }

  // 7. Extract allocation number from card_id e.g. "founders-edition-004" → 4
  const allocationNumber = parseInt(card.card_id.split('-').pop() ?? '0', 10)

  // 5. Update card status to 'reserved'
  const { error: updateError } = await supabase
    .from('cards')
    .update({ status: 'reserved' })
    .eq('card_id', card.card_id)
    .eq('status', 'unclaimed') // guard against race condition

  if (updateError) {
    console.error('[stripe/webhook] Error reserving card:', updateError)
    return NextResponse.json({ received: true, emailed: false, error: updateError.message }, { status: 500 })
  }

  // 6. Create founder_orders row
  const { error: orderError } = await supabase
    .from('founder_orders')
    .insert({
      stripe_session_id: session.id,
      customer_email: recipient,
      customer_name: session.customer_details?.name ?? null,
      card_id: card.card_id,
      allocation_number: allocationNumber,
      status: 'confirmed',
    })

  if (orderError) {
    console.error('[stripe/webhook] Error creating founder_order:', orderError)
    // Card is already reserved — log but continue so email still sends
  }

  // 8. Send confirmation email with allocation number
  const result = await sendFounderConfirmation({
    to: recipient,
    customerName,
    orderNumber,
    editionNumber: allocationNumber,
    allocationTotal: 100,
  })

  if (!result.success) {
    console.error('[stripe/webhook] Email send failed:', result.error)
    return NextResponse.json({ received: true, emailed: false, error: result.error })
  }

  return NextResponse.json({
    received: true,
    emailed: true,
    id: result.id,
    card_id: card.card_id,
    allocation: allocationNumber,
  })
}
