import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Comma-separated list of admin auth user IDs. Set ADMIN_USER_IDS in Vercel to
// add more admins. Defaults to the owner account so it works out of the box.
function adminIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? 'f16d9181-fe6c-4b2a-8bd2-46b1bb8d736a,32407af9-ec4d-4d71-a582-d4b6405b9857'
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

// ─────────────────────────────────────────────────────────────────────────────
// GET — always returns the company list with a live card_count.
// With ?batch_id=... it ALSO returns every card in that batch so the page can
// preview them and show which are eligible before anything is written.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data: companyData, error: companyError } = await gate.admin
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })
    .limit(500)

  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 })

  const companyRows = (companyData ?? []) as { id: string; name: string }[]

  // Exact card_count per company. head:true fetches no rows, just the count,
  // so this stays accurate no matter how many cards exist.
  const companies = await Promise.all(
    companyRows.map(async (c) => {
      const { count, error } = await gate.admin
        .from('cards')
        .select('card_id', { count: 'exact', head: true })
        .eq('company_id', c.id)
      if (error) throw new Error(error.message)
      return { id: c.id, name: c.name, card_count: count ?? 0 }
    }),
  ).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Could not count company cards.'
    return message
  })

  if (typeof companies === 'string') {
    return NextResponse.json({ error: companies }, { status: 500 })
  }

  const batchId = new URL(req.url).searchParams.get('batch_id')?.trim() ?? ''
  if (!batchId) {
    return NextResponse.json({ companies, cards: null, batchId: null })
  }

  const { data: cardData, error: cardError } = await gate.admin
    .from('cards')
    .select('card_id, status, owner_user_id, company_id')
    .eq('batch_id', batchId)
    .order('card_id', { ascending: true })
    .limit(1000)

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 })

  return NextResponse.json({ companies, cards: cardData ?? [], batchId })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — stamp company_id onto (or clear it from) a batch of SPARE cards.
//
// Every write below is filtered by status='unclaimed' AND owner_user_id IS NULL.
// Those two conditions are non-negotiable: they make it structurally impossible
// for this tool to alter a card that a real customer has claimed or owns.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: { action?: string; companyId?: string; batchId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { action, companyId, batchId } = body
  const allowed = ['assign', 'unassign']
  if (!action || typeof action !== 'string' || !allowed.includes(action)) {
    return NextResponse.json({ error: 'Invalid action — must be "assign" or "unassign".' }, { status: 400 })
  }
  if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
    return NextResponse.json({ error: 'A companyId is required.' }, { status: 400 })
  }
  if (!batchId || typeof batchId !== 'string' || !batchId.trim()) {
    return NextResponse.json({ error: 'A batchId is required.' }, { status: 400 })
  }

  const company = companyId.trim()
  const batch = batchId.trim()

  if (action === 'assign') {
    // Spare cards only: right batch, unclaimed, no owner, not already assigned.
    const { data, error } = await gate.admin
      .from('cards')
      .update({ company_id: company })
      .eq('batch_id', batch)
      .eq('status', 'unclaimed')
      .is('owner_user_id', null)
      .is('company_id', null)
      .select('card_id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []) as { card_id: string }[]
    const affectedCardIds = rows.map((r) => r.card_id)
    return NextResponse.json({
      ok: true,
      action: 'assign',
      affectedCount: affectedCardIds.length,
      affectedCardIds,
      message: affectedCardIds.length === 0
        ? `0 cards matched — nothing changed. No card in batch "${batch}" is unclaimed, unowned and unassigned.`
        : `Assigned ${affectedCardIds.length} card${affectedCardIds.length === 1 ? '' : 's'} to this company.`,
    })
  }

  // unassign — only clears cards currently held by THIS company, and only if
  // they are still unclaimed and unowned.
  const { data, error } = await gate.admin
    .from('cards')
    .update({ company_id: null })
    .eq('batch_id', batch)
    .eq('company_id', company)
    .eq('status', 'unclaimed')
    .is('owner_user_id', null)
    .select('card_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as { card_id: string }[]
  const affectedCardIds = rows.map((r) => r.card_id)
  return NextResponse.json({
    ok: true,
    action: 'unassign',
    affectedCount: affectedCardIds.length,
    affectedCardIds,
    message: affectedCardIds.length === 0
      ? `0 cards matched — nothing changed. No card in batch "${batch}" is assigned to this company while still unclaimed and unowned.`
      : `Un-assigned ${affectedCardIds.length} card${affectedCardIds.length === 1 ? '' : 's'} from this company.`,
  })
}
