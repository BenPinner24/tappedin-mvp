import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// PRICING: "First month £34.99, then the tier rate."
//
// Because the £34.99-then-drop model uses a Stripe SUBSCRIPTION SCHEDULE (which
// can't be created directly by a hosted Checkout Session), we split it in two:
//
//   1. Here: open a Checkout Session in `mode: 'setup'`. Stripe's hosted page
//      collects and saves the customer's card. Nothing is charged yet. We carry
//      the chosen tier + seats in the setup intent metadata.
//
//   2. In the webhook (checkout.session.completed, mode=setup): we read that
//      metadata, grab the saved card, and create the subscription schedule
//      (phase 1 = £34.99 for 1 month → phase 2 = tier rate, ongoing). Stripe
//      then charges £34.99 immediately and the tier rate from month two.
//
// Tiers here are Bronze / Silver / Gold only. Founder is separate.
// ─────────────────────────────────────────────────────────────────────────────

// Valid tiers a customer can choose. (Validation only — the actual price IDs
// live in the webhook, where the schedule is built.)
const VALID_TIERS = ['bronze', 'silver', 'gold'] as const
const GOLD_MIN_SEATS = 5

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.')
  _stripe = new Stripe(key)
  return _stripe
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { tier?: string; seats?: number }
    const tier = body.tier

    if (!tier || !VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    // Gold is per-seat (min 5); everyone else is a single seat.
    const seats = tier === 'gold'
      ? Math.max(GOLD_MIN_SEATS, Number(body.seats) || GOLD_MIN_SEATS)
      : 1

    // Who is signed in?
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You need to be signed in.' }, { status: 401 })
    }

    const stripe = getStripe()
    const admin = createAdminClient()

    // Reuse the user's Stripe customer, or create one and store it.
    const { data: billing } = await admin
      .from('user_billing')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId: string | null = (billing?.stripe_customer_id as string | null) ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('user_billing')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    const origin = req.headers.get('origin') ?? 'https://tappedin.uk'

    // Setup-mode Checkout Session: hosted Stripe page saves the card, charges
    // nothing now. The webhook builds the schedule from this metadata.
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      currency: 'gbp',
      customer: customerId,
      client_reference_id: user.id,
      // metadata on the SESSION (handy) …
      metadata: { user_id: user.id, tier, seats: String(seats) },
      // …and on the SETUP INTENT, which is what the webhook reads back.
      setup_intent_data: {
        metadata: { user_id: user.id, tier, seats: String(seats) },
      },
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.'
    console.error('[create-checkout]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
