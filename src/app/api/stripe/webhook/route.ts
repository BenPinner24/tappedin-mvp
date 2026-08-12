import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendFounderConfirmation } from '@/lib/email/sendFounderConfirmation'
import { sendStandardConfirmation } from '@/lib/email/sendStandardConfirmation'
import { sendMultipackConfirmation } from '@/lib/email/sendMultipackConfirmation'
import { sendSubscriptionWelcome } from '@/lib/email/sendSubscriptionWelcome'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// One-off card product (PVC) — sends the Standard email.
const PVC_PRODUCT_ID = 'prod_UhzE8eaEZgXQiR'

// Multi-Pack products (PVC bundles) → pack name + quantity. One profile, one email.
const PACK_PRODUCTS: Record<string, { packName: string; quantity: number }> = {
  prod_Up2tgzkQsZ7qeP: { packName: '3-Pack', quantity: 3 },
  prod_Up2uzzjNPusik9: { packName: '5-Pack', quantity: 5 },
}

// Subscription products → tier.
// Includes BOTH the old membership products AND the new schedule tier products,
// so the lifecycle handler resolves a tier correctly for scheduled subscriptions.
const PRODUCT_TIERS: Record<string, string> = {
  // old membership products
  prod_V1VjARhjAxCeWJ: 'bronze',
  prod_V1WoYYoJZn487E: 'silver',
  prod_V1Wqbuu3IJgqhG: 'gold',
  prod_V1WrzUsVIIMDVo: 'founder',
  // new schedule tier products — LIVE
  prod_V1vYRD2yT6sfdE: 'bronze',
  prod_V1vZCRT1fAnjvW: 'silver',
  prod_V1vZfKEjWVwApK: 'gold',
  // new schedule tier products — TEST
  prod_V1uSn6OaGAscev: 'bronze',
  prod_V1uS9Ez7SSdTpB: 'silver',
  prod_V1uTWK2HVOVq2H: 'gold',
}

// ── SUBSCRIPTION PRICES — auto-selected by mode (test vs live) ──────────────
// Uses the Stripe secret key to pick the matching IDs: sk_test_ → test prices,
// sk_live_ → live prices. Same file works locally and in production.
const STRIPE_IS_TEST = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_')
const FIRST_MONTH_PRICE = STRIPE_IS_TEST
  ? 'price_1U1qpMPjlQmJd4DejPmumeQF'  // TEST £34.99
  : 'price_1U1rh6PjlQmJd4De9vcVJC4l'  // LIVE £34.99
const TIER_PRICE: Record<string, string> = STRIPE_IS_TEST
  ? {
      bronze: 'price_1U1qdFPjlQmJd4DetCcCKSC3', // TEST £3.99
      silver: 'price_1U1qdoPjlQmJd4DeiNLhyn8I', // TEST £7.99
      gold:   'price_1U1qePPjlQmJd4Dekcqtlej9', // TEST £4.99
    }
  : {
      bronze: 'price_1U1rhYPjlQmJd4DeZwwdes01', // LIVE £3.99
      silver: 'price_1U1rhtPjlQmJd4De9zQHCHAe', // LIVE £7.99
      gold:   'price_1U1riXPjlQmJd4DeiPe9kdHq', // LIVE £4.99
    }

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.')
  _stripe = new Stripe(key)
  return _stripe
}

// Pull the tier from a subscription's first line item's product.
function tierFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0]
  const product = item?.price?.product
  const productId = typeof product === 'string' ? product : product?.id
  return productId ? (PRODUCT_TIERS[productId] ?? null) : null
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const cpe = (sub as { current_period_end?: number }).current_period_end
  return cpe ? new Date(cpe * 1000).toISOString() : null
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

  // ── SUBSCRIPTION LIFECYCLE (sync tier onto the user's profile) ──────────────
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const resolvedTier = tierFromSubscription(sub)
    const admin = createAdminClient()

    // Only overwrite the tier if we could resolve one — never clobber a good
    // tier with null (e.g. if the product map ever misses).
    const update: Record<string, unknown> = {
      subscription_status: sub.status,
      subscription_current_period_end: periodEndIso(sub),
    }
    if (resolvedTier) update.subscription_tier = resolvedTier

    await admin
      .from('user_billing')
      .update(update)
      .eq('stripe_customer_id', customerId)
    return NextResponse.json({ received: true, type: 'subscription_sync', status: sub.status })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const admin = createAdminClient()
    await admin
      .from('user_billing')
      .update({ subscription_status: 'canceled', subscription_tier: null })
      .eq('stripe_customer_id', customerId)
    return NextResponse.json({ received: true, type: 'subscription_deleted' })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // ── NEW SUBSCRIPTION SIGNUP (setup mode → build the schedule) ───────────────
  // Our membership checkout runs in `mode: 'setup'` (saves the card, charges
  // nothing). Here we read the tier/seats, attach the saved card, and create the
  // subscription schedule: £34.99 for month 1, then the tier rate from month 2.
  if (session.mode === 'setup') {
    const stripe = getStripe()
    const admin = createAdminClient()

    const userId = session.client_reference_id || session.metadata?.user_id || null
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null
    const tier = session.metadata?.tier ?? null
    const seats = Math.max(1, Number(session.metadata?.seats) || 1)

    if (!userId || !customerId || !tier || !TIER_PRICE[tier]) {
      console.error('[stripe/webhook] setup session missing data', {
        userId, customerId, tier, session: session.id,
      })
      return NextResponse.json({ received: true, error: 'setup session missing data' })
    }

    try {
      // 1. Get the saved payment method from the completed setup intent.
      const setupIntentId = typeof session.setup_intent === 'string'
        ? session.setup_intent
        : session.setup_intent?.id
      if (!setupIntentId) throw new Error('no setup_intent on session')

      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
      const paymentMethodId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id
      if (!paymentMethodId) throw new Error('no payment_method on setup intent')

      // 2. Make it the customer's default for invoices.
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      // 3. Create the two-phase schedule.
      //    Phase 1 = £34.99 for 1 month · Phase 2 = tier price × seats, ongoing.
      const schedule = await stripe.subscriptionSchedules.create({
        customer: customerId,
        start_date: 'now',
        end_behavior: 'release',
        default_settings: {
          default_payment_method: paymentMethodId,
          collection_method: 'charge_automatically',
        },
        phases: [
          {
            items: [{ price: FIRST_MONTH_PRICE, quantity: 1 }],
            duration: { interval: 'month', interval_count: 1 },
            proration_behavior: 'none',
          },
          {
            items: [{ price: TIER_PRICE[tier], quantity: seats }],
            proration_behavior: 'none',
          },
        ],
        metadata: { user_id: userId, tier, seats: String(seats) },
      })

      // 3b. Charge the £34.99 first-month invoice IMMEDIATELY, and track whether
      // it actually succeeded. We only grant access if the payment goes through.
      let firstPaymentPaid = false
      let subIdForCleanup: string | undefined
      try {
        const subId = typeof schedule.subscription === 'string'
          ? schedule.subscription
          : schedule.subscription?.id
        subIdForCleanup = subId
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice'] })
          const inv = sub.latest_invoice
          const invId = typeof inv === 'string' ? inv : inv?.id
          let invStatus = typeof inv === 'string' ? undefined : inv?.status
          if (invId && invStatus !== 'paid') {
            if (invStatus === 'draft') {
              await stripe.invoices.finalizeInvoice(invId)
            }
            const paid = await stripe.invoices.pay(invId)
            invStatus = paid.status
          }
          firstPaymentPaid = invStatus === 'paid'
        }
      } catch (payErr) {
        // Payment failed (declined, etc.). firstPaymentPaid stays false.
        console.error('[stripe/webhook] first-invoice payment failed:', payErr)
      }

      // ── PAYMENT FAILED → grant NO access, clean up the dangling subscription ──
      if (!firstPaymentPaid) {
        console.warn('[stripe/webhook] first payment not completed — not activating', {
          userId, customerId, tier,
        })
        // Cancel the schedule + subscription so there's no unpaid sub left behind.
        try {
          await stripe.subscriptionSchedules.cancel(schedule.id)
        } catch (cancelErr) {
          console.error('[stripe/webhook] could not cancel schedule after failed payment:', cancelErr)
        }
        try {
          if (subIdForCleanup) await stripe.subscriptions.cancel(subIdForCleanup)
        } catch { /* schedule cancel usually removes it; ignore */ }

        // Record the failed state — NOT active, no tier access.
        await admin
          .from('user_billing')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            subscription_tier: null,
            subscription_status: 'payment_failed',
          }, { onConflict: 'user_id' })

        return NextResponse.json({ received: true, type: 'payment_failed', tier })
      }

      // ── PAYMENT SUCCEEDED → activate + welcome email ─────────────────────────
      // The schedule creates a subscription, which fires
      // `customer.subscription.created` → the lifecycle handler above syncs
      // user_billing. We also set it here so the row is correct immediately.
      await admin
        .from('user_billing')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          subscription_tier: tier,
          subscription_status: 'active',
        }, { onConflict: 'user_id' })

      // Send the tier-aware welcome email. Wrapped so an email hiccup never
      // fails the webhook (the subscription itself is already done).
      try {
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          undefined
        if (email && (tier === 'bronze' || tier === 'silver' || tier === 'gold')) {
          const name = session.customer_details?.name?.trim().split(' ')[0] || undefined
          await sendSubscriptionWelcome({
            to: email,
            customerName: name,
            tier,
            seats,
          })
        } else {
          console.warn('[stripe/webhook] no email or bad tier for welcome:', { email, tier })
        }
      } catch (mailErr) {
        console.error('[stripe/webhook] welcome email failed:', mailErr)
      }

      return NextResponse.json({ received: true, type: 'schedule_created', tier })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'schedule creation failed'
      console.error('[stripe/webhook] schedule creation failed:', msg)
      return NextResponse.json({ received: true, error: msg }, { status: 500 })
    }
  }

  // ── SUBSCRIPTION CHECKOUT (legacy path — kept for safety) ───────────────────
  if (session.mode === 'subscription') {
    const userId = session.client_reference_id || session.metadata?.user_id || null
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
    let resolvedTier: string | null = session.metadata?.tier ?? null
    let status = 'active'
    let periodEnd: string | null = null

    try {
      if (session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const sub = await getStripe().subscriptions.retrieve(subId)
        status = sub.status
        periodEnd = periodEndIso(sub)
        if (!resolvedTier) resolvedTier = tierFromSubscription(sub)
      }
    } catch (e) {
      console.error('[stripe/webhook] could not retrieve subscription:', e)
    }

    if (userId) {
      const admin = createAdminClient()
      await admin
        .from('user_billing')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          subscription_tier: resolvedTier,
          subscription_status: status,
          subscription_current_period_end: periodEnd,
        }, { onConflict: 'user_id' })
    } else {
      console.warn('[stripe/webhook] subscription checkout with no user id:', session.id)
    }

    return NextResponse.json({ received: true, type: 'subscription_checkout', tier: resolvedTier })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ONE-OFF CARD PAYMENT (PVC / Founders) — unchanged
  // ════════════════════════════════════════════════════════════════════════════

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

  // Determine which product was purchased
  const stripeClient = getStripe()
  let purchasedProductId: string | undefined
  try {
    const lineItems = await stripeClient.checkout.sessions.listLineItems(session.id, { limit: 1 })
    const priceProduct = lineItems.data[0]?.price?.product
    purchasedProductId = typeof priceProduct === 'string' ? priceProduct : priceProduct?.id
  } catch (err) {
    console.error('[stripe/webhook] Could not fetch line items:', err)
  }

  // STANDARD PVC ORDER — send the Standard confirmation and stop.
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

  // MULTI-PACK ORDER — send the multipack confirmation and stop.
  // Placed before the Founders fallback so packs never touch the numbered cards.
  const pack = purchasedProductId ? PACK_PRODUCTS[purchasedProductId] : undefined
  if (pack) {
    const multipackResult = await sendMultipackConfirmation({
      to: recipient,
      customerName,
      orderNumber,
      packName: pack.packName,
      quantity: pack.quantity,
    })

    if (!multipackResult.success) {
      console.error('[stripe/webhook] Multipack email send failed:', multipackResult.error)
      return NextResponse.json({ received: true, emailed: false, error: multipackResult.error })
    }

    return NextResponse.json({ received: true, emailed: true, id: multipackResult.id, type: 'multipack', pack: pack.packName })
  }

  // FOUNDERS ORDER (default)
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

  // 7. Extract allocation number from card_id e.g. "founders-edition-004" -> 4
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
