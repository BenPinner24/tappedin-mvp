import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitlistSignup } from '@/lib/email/sendWaitlistSignup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC endpoint — anyone can sign up, so there is no admin gate here. The
// service-role client is used only to write the row server-side.
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const preference = String(body.preference ?? '').trim()

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Please fill in your name and email.' },
        { status: 400 }
      )
    }
    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // 1. STORE FIRST — the signup must never be lost to an email problem.
    const admin = createAdminClient()
    const { error: dbError } = await admin
      .from('waitlist')
      .insert({ name, email, preference: preference || null })

    if (dbError) {
      console.error('[api/waitlist] Insert failed:', dbError)
      return NextResponse.json(
        { success: false, error: 'Could not save your signup. Please try again.' },
        { status: 500 }
      )
    }

    // 2. THEN NOTIFY — logged but never fatal; the signup is already saved.
    try {
      const result = await sendWaitlistSignup({ name, email, preference })
      if (!result.success) {
        console.error('[api/waitlist] Notification email failed:', result.error)
      }
    } catch (mailErr) {
      console.error('[api/waitlist] Notification email exception:', mailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/waitlist] Exception:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
