import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Comma-separated list of admin auth user IDs. Set ADMIN_USER_IDS in Vercel to
// add more admins. Defaults to the owner account so it works out of the box.
function adminIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? 'f16d9181-fe6c-4b2a-8bd2-46b1bb8d736a'
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

type AdminClient = ReturnType<typeof createAdminClient>

type Gate =
  | { ok: true; admin: AdminClient; userId: string }
  | { ok: false; status: number; error: string }

async function requireAdmin(req: Request): Promise<Gate> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return { ok: false, status: 401, error: 'Not signed in' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return { ok: false, status: 401, error: 'Invalid session' }
  if (!adminIds().includes(data.user.id)) return { ok: false, status: 403, error: 'Not authorised' }

  return { ok: true, admin, userId: data.user.id }
}

// List all reviews (newest first) for moderation.
export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.admin
    .from('reviews')
    .select('id, created_at, name, role, rating, quote, status')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data ?? [] })
}

// Update a review's status: approve, reject, or move back to pending.
export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: { id?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { id, status } = body
  const allowed = ['approved', 'rejected', 'pending']
  if (!id || typeof id !== 'string' || !status || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
  }

  const { error } = await gate.admin.from('reviews').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
