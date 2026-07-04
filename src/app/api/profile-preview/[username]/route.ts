import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Returns the public preview fields for a reviewer's profile, read with the
// admin client server-side (so it works regardless of RLS, and no keys leak).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const clean = decodeURIComponent(username).trim().replace(/\/$/, '').toLowerCase()
  if (!clean) return NextResponse.json({ error: 'no username' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, headline, bio, avatar_url, accent_color')
    .ilike('username', clean)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: links } = await supabase
    .from('profile_links')
    .select('id, label, url, custom_label, position, is_active')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .limit(6)

  return NextResponse.json({
    username: profile.username,
    display_name: profile.display_name || profile.username || 'Creator',
    role: profile.role || profile.headline || '',
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    accent_color: profile.accent_color || '#52d6fc',
    links: (links || [])
      .filter((l: { label?: string | null; url?: string | null }) => l.label && l.url)
      .map((l: { id: string; label: string; custom_label?: string | null }) => ({
        id: l.id,
        label: l.custom_label || l.label,
      })),
  })
}
