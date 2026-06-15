import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// tier → Stripe Product ID (the four membership products)
const TIER_PRODUCTS: Record<string, string> = {
  bronze:   'prod_Ui0fOuIDHiNshg',
  silver:   'prod_Ui0g7f43Sy5AF8',
  gold:     'prod_Ui0icn6ymBMyNX',
  platinum: 'prod_Ui0iODipZ768Wq',
}

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
    const body = (await req.json()) as { tier?: string }
    const tier = body.tier
    if (!tier || !TIER_PRODUCTS[tier]) {
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

    // Find the active monthly price for this tier's product
    const prices = await stripe.prices.list({ product: TIER_PRODUCTS[tier], active: true, limit: 1 })
    const price = prices.data[0]
    if (!price) {
      return NextResponse.json({ error: 'No active price found for this plan.' }, { status: 500 })
    }

    // Reuse the user's Stripe customer, or create one and store it
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId: string | null = (profile?.stripe_customer_id as string | null) ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const origin = req.headers.get('origin') ?? 'https://tappedin.uk'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id, tier },
      subscription_data: { metadata: { user_id: user.id, tier } },
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.'
    console.error('[create-checkout]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
