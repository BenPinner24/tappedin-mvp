import { NextResponse } from 'next/server'
import { sendCompanyEnquiry } from '@/lib/email/sendCompanyEnquiry'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const companyName = String(body.companyName ?? '').trim()
    const contactName = String(body.contactName ?? '').trim()
    const email = String(body.email ?? '').trim()
    const teamSize = String(body.teamSize ?? '').trim()
    const message = String(body.message ?? '').trim()

    // Basic validation
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { success: false, error: 'Please fill in company, name, and email.' },
        { status: 400 }
      )
    }
    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const result = await sendCompanyEnquiry({
      companyName,
      contactName,
      email,
      teamSize,
      message,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Could not send enquiry.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/company-enquiry] Exception:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
