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

// ── MANAGER-BINDING HELPERS ─────────────────────────────────────────

type FoundUser = { id: string; email: string }

// Exact (case-insensitive) email match against auth.users. Uses the service-role
// admin API rather than a table query, since the auth schema isn't exposed to
// PostgREST. Pages through up to 10,000 accounts and stops as soon as it hits.
async function findUserByEmail(
  admin: AdminClient,
  email: string,
): Promise<{ user: FoundUser | null; error: string | null }> {
  const target = email.trim().toLowerCase()
  if (!target) return { user: null, error: null }

  const perPage = 1000
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return { user: null, error: error.message }
    const users = (data?.users ?? []) as { id: string; email?: string | null }[]
    const hit = users.find((u) => (u.email ?? '').trim().toLowerCase() === target)
    if (hit) return { user: { id: hit.id, email: hit.email ?? target }, error: null }
    if (users.length < perPage) break
  }
  return { user: null, error: null }
}

// A user "manages" a company iff a company_members row exists. ONE company per
// user is enforced system-wide, so ANY row here means the user is already taken.
async function membershipFor(
  admin: AdminClient,
  userId: string,
): Promise<{ row: { company_id: string; role: string } | null; error: string | null }> {
  const { data, error } = await admin
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)
    .limit(1)
  if (error) return { row: null, error: error.message }
  const rows = (data ?? []) as { company_id: string; role: string }[]
  return { row: rows[0] ?? null, error: null }
}

async function companyById(
  admin: AdminClient,
  companyId: string,
): Promise<{ row: { id: string; name: string } | null; error: string | null }> {
  const { data, error } = await admin
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .limit(1)
  if (error) return { row: null, error: error.message }
  const rows = (data ?? []) as { id: string; name: string }[]
  return { row: rows[0] ?? null, error: null }
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

  // ── Manager lookup (preview only — writes nothing) ──────────────────────
  const lookupEmail = new URL(req.url).searchParams.get('lookupEmail')?.trim() ?? ''
  let lookup: {
    email: string
    found: boolean
    userId: string | null
    alreadyInCompany: boolean
    existingCompanyId: string | null
    existingRole: string | null
    bindable: boolean
    message: string
  } | null = null

  if (lookupEmail) {
    const { user, error: findError } = await findUserByEmail(gate.admin, lookupEmail)
    if (findError) return NextResponse.json({ error: findError }, { status: 500 })

    if (!user) {
      lookup = {
        email: lookupEmail,
        found: false,
        userId: null,
        alreadyInCompany: false,
        existingCompanyId: null,
        existingRole: null,
        bindable: false,
        message: `No account found with the email "${lookupEmail}". They need to sign up first — nothing was created.`,
      }
    } else {
      const { row: membership, error: memberError } = await membershipFor(gate.admin, user.id)
      if (memberError) return NextResponse.json({ error: memberError }, { status: 500 })

      lookup = membership
        ? {
            email: user.email,
            found: true,
            userId: user.id,
            alreadyInCompany: true,
            existingCompanyId: membership.company_id,
            existingRole: membership.role,
            bindable: false,
            message: `${user.email} already belongs to a company (role: ${membership.role}). A user can only belong to one company, so they cannot be bound again.`,
          }
        : {
            email: user.email,
            found: true,
            userId: user.id,
            alreadyInCompany: false,
            existingCompanyId: null,
            existingRole: null,
            bindable: true,
            message: `${user.email} has an account and belongs to no company — ready to bind as a manager.`,
          }
    }
  }

  const batchId = new URL(req.url).searchParams.get('batch_id')?.trim() ?? ''
  if (!batchId) {
    return NextResponse.json({ companies, cards: null, batchId: null, lookup })
  }

  const { data: cardData, error: cardError } = await gate.admin
    .from('cards')
    .select('card_id, status, owner_user_id, company_id')
    .eq('batch_id', batchId)
    .order('card_id', { ascending: true })
    .limit(1000)

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 })

  return NextResponse.json({ companies, cards: cardData ?? [], batchId, lookup })
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

  let body: { action?: string; companyId?: string; batchId?: string; managerEmail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { action, companyId, batchId, managerEmail } = body
  const allowed = ['assign', 'unassign', 'bind_manager', 'unbind_manager']
  if (!action || typeof action !== 'string' || !allowed.includes(action)) {
    return NextResponse.json({ error: 'Invalid action — must be "assign", "unassign", "bind_manager" or "unbind_manager".' }, { status: 400 })
  }
  if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
    return NextResponse.json({ error: 'A companyId is required.' }, { status: 400 })
  }

  // ── MANAGER BINDING ──────────────────────────────────────────────
  // Handled before the batchId check: these actions take a managerEmail, not a
  // batch. Everything below this block is the original card logic, untouched.
  if (action === 'bind_manager' || action === 'unbind_manager') {
    if (!managerEmail || typeof managerEmail !== 'string' || !managerEmail.trim()) {
      return NextResponse.json({ error: 'A managerEmail is required.' }, { status: 400 })
    }

    const company = companyId.trim()
    const email = managerEmail.trim()

    const { row: companyRow, error: companyLookupError } = await companyById(gate.admin, company)
    if (companyLookupError) return NextResponse.json({ error: companyLookupError }, { status: 500 })
    if (!companyRow) {
      return NextResponse.json({ error: 'That company does not exist. Nothing was changed.' }, { status: 400 })
    }

    const { user, error: findError } = await findUserByEmail(gate.admin, email)
    if (findError) return NextResponse.json({ error: findError }, { status: 500 })
    if (!user) {
      return NextResponse.json({
        error: `No account found with the email "${email}". They need to sign up first — nothing was created.`,
      }, { status: 400 })
    }

    if (action === 'bind_manager') {
      // ONE company per user. Any existing row at all is a hard refusal.
      const { row: membership, error: memberError } = await membershipFor(gate.admin, user.id)
      if (memberError) return NextResponse.json({ error: memberError }, { status: 500 })
      if (membership) {
        return NextResponse.json({
          error: `${user.email} already belongs to a company (role: ${membership.role}). A user can only belong to one company — nothing was changed.`,
        }, { status: 400 })
      }

      const { data: insData, error: insError } = await gate.admin
        .from('company_members')
        .insert({ company_id: company, user_id: user.id, role: 'manager' })
        .select('company_id, user_id, role')
      if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })

      const inserted = (insData ?? []) as { company_id: string }[]
      if (inserted.length === 0) {
        return NextResponse.json({
          error: 'The manager row was not created — nothing changed. Please re-run the lookup and try again.',
        }, { status: 500 })
      }

      // company_enabled must be set whether or not a billing row already exists.
      const { error: billingError } = await gate.admin
        .from('user_billing')
        .upsert({ user_id: user.id, company_enabled: true }, { onConflict: 'user_id' })
        .select('user_id, company_enabled')
      if (billingError) {
        return NextResponse.json({
          error: `Bound ${user.email} as manager of ${companyRow.name}, BUT could not set company_enabled: ${billingError.message}. Set company_enabled=true for user_id ${user.id} manually.`,
        }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        action: 'bind_manager',
        affectedCount: 1,
        userId: user.id,
        email: user.email,
        companyId: companyRow.id,
        companyName: companyRow.name,
        companyEnabled: true,
        message: `${user.email} (user_id ${user.id}) is now a manager of ${companyRow.name}, and company_enabled is set to true.`,
      })
    }

    // unbind_manager — only removes a manager row for THIS company.
    const { data: delData, error: delError } = await gate.admin
      .from('company_members')
      .delete()
      .eq('company_id', company)
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .select('company_id, user_id, role')
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

    const removed = (delData ?? []) as { company_id: string }[]
    if (removed.length === 0) {
      return NextResponse.json({
        ok: true,
        action: 'unbind_manager',
        affectedCount: 0,
        userId: user.id,
        email: user.email,
        companyId: companyRow.id,
        companyName: companyRow.name,
        companyEnabled: null,
        message: `Nothing changed — ${user.email} is not a manager of ${companyRow.name}.`,
      })
    }

    const { error: billingOffError } = await gate.admin
      .from('user_billing')
      .upsert({ user_id: user.id, company_enabled: false }, { onConflict: 'user_id' })
      .select('user_id, company_enabled')
    if (billingOffError) {
      return NextResponse.json({
        error: `Removed ${user.email} as manager of ${companyRow.name}, BUT could not clear company_enabled: ${billingOffError.message}. Set company_enabled=false for user_id ${user.id} manually.`,
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      action: 'unbind_manager',
      affectedCount: removed.length,
      userId: user.id,
      email: user.email,
      companyId: companyRow.id,
      companyName: companyRow.name,
      companyEnabled: false,
      message: `${user.email} is no longer a manager of ${companyRow.name}, and company_enabled is set to false.`,
    })
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
