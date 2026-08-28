import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DELETION — GDPR right to erasure  (POST /api/account/delete)
//
// SECURITY: the user id used for BOTH the RPC and the auth deletion comes only
// from the server-side session (supabase.auth.getUser()). Nothing is read from
// the request body, query string, or headers, so a caller can never delete
// anyone but themselves. This route deliberately accepts no input at all.
//
// ORDER (each step stops on failure — never leave someone half-deleted):
//   1. Identify the signed-in user server-side.
//   2. Look up their stripe_customer_id.
//   3. Cancel any live Stripe subscriptions. If this fails, STOP — nothing is
//      deleted, so they can retry without having lost data.
//   4. delete_my_account(user_id) — the atomic Postgres function.
//      If it raises user_owns_company, STOP and report it.
//   5. Delete the auth login.
// ─────────────────────────────────────────────────────────────────────────────

// Same lazy Stripe client pattern as the webhook route.
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.')
  _stripe = new Stripe(key)
  return _stripe
}

// Subscription states that are still live and should be cancelled. Anything
// already canceled or expired is left alone.
const LIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused']

export async function POST() {
  try {
    // ── 1. Who is signed in? (the ONLY source of the user id) ───────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'You need to be signed in.' }, { status: 401 })
    }
    const userId = user.id

    const admin = createAdminClient()

    // ── 2. Their Stripe customer, if they have one ──────────────────────────
    const { data: billing, error: billingError } = await admin
      .from('user_billing')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle<{ stripe_customer_id: string | null }>()

    if (billingError) {
      console.error('[account/delete] billing lookup failed:', billingError)
      return NextResponse.json({
        error: 'We could not check your billing details. Nothing has been deleted — please try again.',
      }, { status: 500 })
    }

    const customerId = billing?.stripe_customer_id ?? null

    // ── 3. Cancel live subscriptions BEFORE deleting anything ───────────────
    let cancelledSubscriptions = 0
    if (customerId) {
      try {
        const stripe = getStripe()
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
        for (const sub of subs.data) {
          if (!LIVE_STATUSES.includes(sub.status)) continue
          await stripe.subscriptions.cancel(sub.id)
          cancelledSubscriptions++
        }
      } catch (stripeErr) {
        // Stop here. Nothing has been deleted, so a retry is safe.
        const msg = stripeErr instanceof Error ? stripeErr.message : 'Unknown Stripe error.'
        console.error('[account/delete] Stripe cancellation failed:', stripeErr)
        return NextResponse.json({
          error: `We could not cancel your subscription, so nothing has been deleted. Please try again, or email contact@tappedin.uk. (${msg})`,
        }, { status: 502 })
      }
    }

    // ── 4. The atomic delete ────────────────────────────────────────────────
    const { error: rpcError } = await admin.rpc('delete_my_account', { target_user_id: userId })

    if (rpcError) {
      const detail = `${rpcError.message ?? ''} ${(rpcError as { details?: string }).details ?? ''} ${(rpcError as { hint?: string }).hint ?? ''}`
      if (detail.includes('user_owns_company')) {
        return NextResponse.json({
          error: 'You own a company account. Please transfer or close your company first — contact contact@tappedin.uk for help.',
        }, { status: 409 })
      }
      console.error('[account/delete] delete_my_account failed:', rpcError)
      return NextResponse.json({
        error: 'Something went wrong deleting your data, so nothing was removed. Please try again, or email contact@tappedin.uk.',
      }, { status: 500 })
    }

    // ── 5. Remove the login itself ──────────────────────────────────────────
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      // The data is gone but the login remains — say so plainly rather than
      // reporting a clean success.
      console.error('[account/delete] auth user deletion failed:', authDeleteError)
      return NextResponse.json({
        error: 'Your data has been deleted, but your login could not be removed. Please email contact@tappedin.uk and we will finish this for you.',
        dataDeleted: true,
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      cancelledSubscriptions,
      message: 'Your account and data have been deleted.',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Account deletion failed.'
    console.error('[account/delete]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
