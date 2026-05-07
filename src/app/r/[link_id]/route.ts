import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RedirectRouteProps = {
  params: Promise<{
    link_id: string
  }>
}

export async function GET(request: Request, { params }: RedirectRouteProps) {
  const { link_id } = await params
  const supabase = await createClient()

  const { data: link, error: linkError } = await supabase
    .from('profile_links')
    .select('id, profile_id, label, url, is_active')
    .eq('id', link_id)
    .maybeSingle()

  if (linkError || !link || !link.url || !link.is_active) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const userAgent = request.headers.get('user-agent') || 'Unknown'

  await supabase.from('tap_events').insert({
    profile_id: link.profile_id,
    card_id: null,
    event_type: 'link_click',
    user_agent: userAgent,
    tapped_at: new Date().toISOString(),
    link_id: link.id,
    link_label: link.label || 'Untitled link',
    destination_url: link.url,
  })

  return NextResponse.redirect(normaliseUrl(link.url))
}

function normaliseUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `https://${url}`
}