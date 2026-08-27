import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// TEAMS ROUTE GUARD (server component)
//
// /teams/page.tsx is a client component, so every check it makes happens in the
// browser — far too late to keep anyone out. This layout runs on the server
// first: if the visitor isn't a manager, they're redirected before the page's
// markup, JavaScript or team data is ever sent.
//
// Manager status is the ONLY test here: a company_members row with
// role = 'manager'. The role is filtered in the query, so a non-manager's row
// is never even returned.
// ─────────────────────────────────────────────────────────────────────────────

export default async function TeamsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: managerRow } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('role', 'manager')
    .limit(1)
    .maybeSingle()

  // Fails closed: no row, or a query error, sends them to their own dashboard.
  if (!managerRow) redirect('/dashboard')

  return <>{children}</>
}
