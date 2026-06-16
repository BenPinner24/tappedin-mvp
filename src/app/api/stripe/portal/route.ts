import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You need to be signed in.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: billing } = await admin
      .from('user_billing')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId = (billing?.stripe_customer_id as string | null) ?? null
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account yet — choose a plan first.' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin = req.headers.get('origin') ?? 'https://tappedin.uk'

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not open billing portal.'
    console.error('[portal]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
