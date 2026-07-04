import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let _resend: Resend | null = null
function getResend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set in environment variables.')
  _resend = new Resend(key)
  return _resend
}

const FROM = 'TAPPED-IN <contact@tappedin.uk>'
const TO = 'contact@tappedin.uk'

// Light in-memory rate limit (per warm serverless instance). Not bulletproof,
// but it blunts bursts without any external dependency.
const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60_000
  const max = 5
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > max
}

const clean = (s: string) => s.replace(/[<>]/g, '').trim()

export async function POST(req: Request) {
  let body: {
    name?: string
    email?: string
    enquiryType?: string
    message?: string
    company?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Bad request.' }, { status: 400 })
  }

  const { name, email, enquiryType, message, company } = body || {}

  // Honeypot — the hidden `company` field is invisible to humans. If it is
  // filled, it is a bot: pretend success, send nothing.
  if (company) return NextResponse.json({ success: true })

  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 })
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })
  if (!message || typeof message !== 'string' || message.trim().length < 10)
    return NextResponse.json({ success: false, error: 'Please write a short message (at least 10 characters).' }, { status: 400 })
  if (message.length > 5000)
    return NextResponse.json({ success: false, error: 'That message is a little too long.' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip))
    return NextResponse.json({ success: false, error: 'Too many messages just now. Please try again in a minute.' }, { status: 429 })

  const type = typeof enquiryType === 'string' && enquiryType ? clean(enquiryType) : 'General'

  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject: `New enquiry (${type}) from ${clean(name)}`,
      text:
        `New contact form enquiry\n\n` +
        `Name:  ${clean(name)}\n` +
        `Email: ${email}\n` +
        `Type:  ${type}\n\n` +
        `Message:\n${clean(message)}\n`,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return NextResponse.json({ success: false, error: 'Could not send right now. Please try again.' }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Exception:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
