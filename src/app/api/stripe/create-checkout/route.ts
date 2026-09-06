import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// PRICING (historical note): "First month up-front, then the tier rate."
//
// Because that model used a Stripe SUBSCRIPTION SCHEDULE (which
// can't be created directly by a hosted Checkout Session), we split it in two:
//
//   1. Here: open a Checkout Session in `mode: 'setup'`. Stripe's hosted page
//      collects and saves the customer's card. Nothing is charged yet. We carry
//      the chosen tier + seats in the setup intent metadata.
//
//   2. In the webhook (checkout.session.completed, mode=setup): we read that
//      metadata, grab the saved card, and create the subscription schedule
//      (phase 1 = the card price for 1 month → phase 2 = tier rate, ongoing).
//      Stripe then charged up-front and the tier rate from month two.
//
// Tiers here are Bronze / Silver / Gold only. Founder is separate.
//
// FOUNDER UPGRADE (separate path, see below): a Founder already paid their
// £49.99 entry and holds free legacy perks. If they choose gallery/storage they
// upgrade to Silver at the plain tier rate (£3.99/mo) with NO card charge.
// That is a normal `mode: 'subscription'` checkout (no schedule needed).
// ─────────────────────────────────────────────────────────────────────────────

// Valid tiers a customer can choose. (Validation only.)
const VALID_TIERS = ['bronze', 'silver', 'gold'] as const

// Silver £3.99 price ID (test/live auto-selected). Used by the Silver and
// Founder subscription-upgrade checkouts below.
const STRIPE_IS_TEST = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_')
const SILVER_PRICE = STRIPE_IS_TEST
  ? 'price_1UCgG2PjlQmJd4DeymVeKQhs' // TEST £3.99
  : 'price_1UCgBhPjlQmJd4DeEAiX5tnS' // LIVE £3.99

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
    const body = (await req.json()) as { tier?: string; founderUpgrade?: boolean; silverUpgrade?: boolean }
    const tier = body.tier
    const founderUpgrade = body.founderUpgrade === true
    const silverUpgrade = body.silverUpgrade === true

    if (!tier || !VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

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
      .select('stripe_customer_id, is_founder, subscription_tier, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle()

    // Already paying for Silver? Only tier 'silver' AND status 'active' counts.
    // Anything else (null, canceled, payment_failed, other tiers) is NOT blocked.
    const alreadyActiveSilver =
      billing?.subscription_tier === 'silver' && billing?.subscription_status === 'active'

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

    // ─────────────────────────────────────────────────────────────────────────
    // SILVER UPGRADE (new model) → any logged-in user upgrades to Silver at the
    // plain tier rate (£3.99/mo). A normal `mode: 'subscription'` checkout with a
    // clearly shown price — no setup-mode, no card-purchase schedule. The webhook's
    // subscription handler records silver/active on completion.
    // ─────────────────────────────────────────────────────────────────────────
    if (silverUpgrade) {
      // Already on active Silver — don't start a second subscription. Send them
      // to /billing to see and manage the plan they already have.
      if (alreadyActiveSilver) {
        return NextResponse.json({ url: `${origin}/billing` })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: SILVER_PRICE, quantity: 1 }],
        metadata: { user_id: user.id, tier: 'silver', silver_upgrade: 'true' },
        subscription_data: {
          metadata: { user_id: user.id, tier: 'silver', silver_upgrade: 'true' },
        },
        success_url: `${origin}/dashboard?upgraded=silver`,
        cancel_url: `${origin}/dashboard?upgrade=cancelled`,
      })

      return NextResponse.json({ url: session.url })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FOUNDER UPGRADE → straight Silver subscription, tier rate only, no card charge.
    // We verify is_founder SERVER-SIDE (never trust the client flag), and only
    // allow the Silver target (Gold is a separate teams product, not a personal
    // upgrade). A Founder is upgrading an existing free account, so this is a
    // plain subscription — no setup schedule.
    // ─────────────────────────────────────────────────────────────────────────
    if (founderUpgrade) {
      if (!billing?.is_founder) {
        return NextResponse.json({ error: 'Not eligible for a Founder upgrade.' }, { status: 403 })
      }
      if (tier !== 'silver') {
        return NextResponse.json({ error: 'Founders can upgrade to Silver only.' }, { status: 400 })
      }

      // Already on active Silver — don't start a second subscription. Send them
      // to /billing to see and manage the plan they already have.
      if (alreadyActiveSilver) {
        return NextResponse.json({ url: `${origin}/billing` })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: SILVER_PRICE, quantity: 1 }],
        metadata: { user_id: user.id, tier: 'silver', founder_upgrade: 'true' },
        subscription_data: {
          metadata: { user_id: user.id, tier: 'silver', founder_upgrade: 'true' },
        },
        success_url: `${origin}/billing?status=success`,
        cancel_url: `${origin}/billing?status=cancelled`,
      })

      return NextResponse.json({ url: session.url })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // No recognised checkout path. The old setup-mode "first month up-front,
    // then the tier rate" flow has been removed, so anything that is not a
    // Silver or Founder upgrade is rejected here. Nothing is created and
    // nothing is charged. The card purchase is a separate Stripe payment link.
    // ─────────────────────────────────────────────────────────────────────────
    return NextResponse.json({ error: 'Unsupported checkout request.' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.'
    console.error('[create-checkout]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
