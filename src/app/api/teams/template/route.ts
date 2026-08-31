import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY PROFILE TEMPLATE  (/api/teams/template)
//
//   GET  → the manager's company template + company links
//   POST → upsert the template and replace the link set
//
// SECURITY: the company is resolved from the caller's OWN company_members row
// with role = 'manager'. It is never read from the request, so a manager can
// only ever read or write their own company's template.
//
// This route touches company_template and company_links ONLY. It does not read
// or write profiles, profile_links, or anything belonging to employees.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_LINKS = 50

type AdminClient = ReturnType<typeof createAdminClient>

type Gate =
  | { ok: true; admin: AdminClient; companyId: string; userId: string }
  | { ok: false; status: number; error: string }

// Same manager resolution the team dashboard and analytics route already use.
//
// CLIENT SPLIT (important — company_template and company_links are RLS'd to
// service_role only):
//   · the REGULAR client is used for exactly one thing — auth.getUser(), to
//     establish who is calling. It never touches a table.
//   · the SERVICE-ROLE client does every read and write, including the
//     company_members lookup.
// The security model is unchanged: the company still comes from the caller's
// own manager row, never from the request.
async function requireManager(): Promise<Gate> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: 'You need to be signed in.' }

  const admin = createAdminClient()

  const { data: managerRow, error } = await admin
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('role', 'manager')
    .limit(1)
    .maybeSingle<{ company_id: string }>()

  if (error) return { ok: false, status: 500, error: error.message }
  if (!managerRow) return { ok: false, status: 403, error: 'You are not a manager of a company.' }

  return { ok: true, admin, companyId: managerRow.company_id, userId: user.id }
}

type IncomingLink = {
  id?: string | null
  label?: string | null
  custom_label?: string | null
  url?: string | null
  icon?: string | null
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const gate = await requireManager()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const [{ data: templateRow, error: templateError }, { data: linkRows, error: linkError }] = await Promise.all([
    gate.admin
      .from('company_template')
      .select('company_id, theme_style, accent_color, button_style, background_style, updated_at')
      .eq('company_id', gate.companyId)
      .maybeSingle<{
        company_id: string
        theme_style: string | null
        accent_color: string | null
        button_style: string | null
        background_style: string | null
        updated_at: string | null
      }>(),
    gate.admin
      .from('company_links')
      .select('id, label, custom_label, url, icon, sort_order')
      .eq('company_id', gate.companyId)
      .order('sort_order', { ascending: true })
      .limit(MAX_LINKS),
  ])

  if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

  return NextResponse.json({
    // null template = nothing set up yet; the page shows its empty state.
    template: templateRow ?? null,
    links: linkRows ?? [],
    companyId: gate.companyId,
  })
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const gate = await requireManager()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: {
    theme_style?: string | null
    accent_color?: string | null
    button_style?: string | null
    background_style?: string | null
    links?: IncomingLink[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // ── Validate the links ──────────────────────────────────────────────────
  const incoming = Array.isArray(body.links) ? body.links : []
  if (incoming.length > MAX_LINKS) {
    return NextResponse.json({ error: `You can save up to ${MAX_LINKS} company links.` }, { status: 400 })
  }

  const cleaned: {
    company_id: string
    label: string | null
    custom_label: string | null
    url: string
    icon: string | null
    sort_order: number
  }[] = []

  for (const [i, raw] of incoming.entries()) {
    const url = (raw.url ?? '').trim()
    const label = (raw.label ?? '').trim()
    const customLabel = (raw.custom_label ?? '').trim()

    // A link with no URL is dropped rather than rejected — the editor always
    // has a blank row at the bottom and it shouldn't block a save.
    if (!url && !label && !customLabel) continue
    if (!url) {
      return NextResponse.json({ error: `Link ${i + 1} needs a URL.` }, { status: 400 })
    }
    if (!label && !customLabel) {
      return NextResponse.json({ error: `Link ${i + 1} needs a label.` }, { status: 400 })
    }

    cleaned.push({
      company_id: gate.companyId,
      label: label || null,
      custom_label: customLabel || null,
      url,
      icon: (raw.icon ?? '').trim() || null,
      sort_order: cleaned.length,   // resequenced from the order sent
    })
  }

  // ── 1. The style row (one per company) ──────────────────────────────────
  const asNullableString = (v: unknown): string | null => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t === '' ? null : t
  }

  const { error: templateError } = await gate.admin
    .from('company_template')
    .upsert({
      company_id: gate.companyId,
      theme_style: asNullableString(body.theme_style),
      accent_color: asNullableString(body.accent_color),
      button_style: asNullableString(body.button_style),
      background_style: asNullableString(body.background_style),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })

  if (templateError) {
    return NextResponse.json({ error: `Could not save the style: ${templateError.message}` }, { status: 500 })
  }

  // ── 2. The links, replaced as a set so ordering and deletions stick ─────
  const { error: deleteError } = await gate.admin
    .from('company_links')
    .delete()
    .eq('company_id', gate.companyId)

  if (deleteError) {
    return NextResponse.json({
      error: `The style was saved, but the links could not be updated: ${deleteError.message}`,
    }, { status: 500 })
  }

  if (cleaned.length > 0) {
    const { error: insertError } = await gate.admin.from('company_links').insert(cleaned)
    if (insertError) {
      return NextResponse.json({
        error: `The style was saved, but the links could not be written: ${insertError.message}. Please re-save.`,
      }, { status: 500 })
    }
  }

  // Read back so the page reflects exactly what is stored.
  const { data: linkRows } = await gate.admin
    .from('company_links')
    .select('id, label, custom_label, url, icon, sort_order')
    .eq('company_id', gate.companyId)
    .order('sort_order', { ascending: true })
    .limit(MAX_LINKS)

  return NextResponse.json({
    ok: true,
    savedLinks: cleaned.length,
    links: linkRows ?? [],
    message: `Saved. ${cleaned.length} company link${cleaned.length === 1 ? '' : 's'} and your style are live for the team.`,
  })
}
