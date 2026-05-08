// src/app/auth/callback/route.ts
//
// Called by Supabase after email confirmation.
//
// Critical behaviour:
//   1. Exchange the code for a session.
//   2. If card_id is in the `next` param (set by signup/login pages), redirect
//      to /claim/[card_id] so the now-authenticated user can claim their card.
//   3. Otherwise redirect to /dashboard.
//
// The card_id is threaded through the `next` query param because Supabase's
// OAuth/magic-link callback only preserves a single redirect URL.  We encode
// the claim path as the `next` value so it survives the email round-trip.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // `next` will be either `/claim/pvc-002` or `/dashboard`
      // Both are safe relative paths — we always use `origin` as the base.
      const redirectUrl = next.startsWith('/')
        ? `${origin}${next}`
        : `${origin}/dashboard`

      return NextResponse.redirect(redirectUrl)
    }
  }

  // Auth failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
