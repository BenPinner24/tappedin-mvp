import { createAdminClient } from '@/lib/supabase/admin'
import SaveToNetworkButton from '@/components/SaveToNetworkButton'
import { notFound }     from 'next/navigation'
import type { CSSProperties } from 'react'
export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type PublicProfilePageProps = {
  params: Promise<{ username: string }>
}

type Profile = {
  id:               string
  username:         string | null
  display_name:     string | null
  bio:              string | null
  role:             string | null
  website:          string | null
  avatar_url:       string | null
  headline:         string | null
  theme_style:      string | null
  accent_color:     string | null
  button_style:     string | null
  background_style: string | null
  is_public?:       boolean | null
}

type ProfileLink = {
  id: string
  label: string
  url: string
  link_type: string | null
  custom_label?: string | null
  position: number
  is_active: boolean
}

type GalleryItem = {
  id:        string
  image_url: string
  caption:   string | null
  position:  number
}

type CardRow = {
  card_id:  string
  status:   string | null
  batch_id: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(value: string): string {
  const parts = value.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

function resolveHref(url: string): string {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

// Normalise a platform label ("X / Twitter" → "x_twitter", "Apple Music" → "apple_music")
function platformKey(label: string): string {
  return (label || '').toLowerCase().replace(/[\s/]+/g, '_')
}

function getLinkButtonStyle(
  buttonStyle: string | null,
  accent = '#52d6fc'
): CSSProperties {
  const border = `1px solid ${accent}`
  const glow = `0 0 14px ${accent}33`

  if (buttonStyle === 'sharp') {
    return {
      background: 'rgba(255,255,255,0.96)',
      color: '#000',
      border,
      borderRadius: '6px',
      boxShadow: glow,
    }
  }

  if (buttonStyle === 'outline') {
    return {
      background: 'transparent',
      color: '#fff',
      border,
      borderRadius: '14px',
      boxShadow: glow,
    }
  }

  if (buttonStyle === 'glass') {
    return {
      background: `${accent}22`,
      color: '#fff',
      border,
      borderRadius: '14px',
      boxShadow: glow,
    }
  }

  if (buttonStyle === 'soft_glow') {
    return {
      background: `${accent}18`,
      color: '#fff',
      border,
      borderRadius: '14px',
      boxShadow: `0 0 24px ${accent}55`,
    }
  }

  if (buttonStyle === 'minimal') {
    return {
      background: 'transparent',
      color: '#fff',
      borderBottom: `1px solid ${accent}`,
      borderRadius: '0px',
    }
  }

  return {
    background: `${accent}18`,
    color: '#fff',
    border,
    borderRadius: '14px',
    boxShadow: glow,
  }
}

// ─── vCard (Save Contact) — built server-side, downloaded via a data URI ───────
// Phone/email come through as links (WhatsApp → wa.me, Email → gmail/mailto,
// Custom → tel:/mailto:), so we read them straight off the saved link rows.

function escapeVCard(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function extractEmailFromUrl(url: string): string | null {
  if (!url) return null
  if (url.startsWith('mailto:')) return url.slice(7).split('?')[0] || null
  if (url.includes('mail.google.com')) {
    try { return new URL(url).searchParams.get('to') } catch { return null }
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url)) return url
  return null
}

function extractPhoneFromUrl(url: string): string | null {
  if (!url) return null
  if (url.startsWith('tel:')) return url.slice(4) || null
  const wa = url.match(/wa\.me\/(\d{6,15})/)
  if (wa) return `+${wa[1]}`
  return null
}

function buildVCardHref(opts: {
  username: string
  displayName: string
  role: string
  bio: string | null
  website: string | null
  links: ProfileLink[]
}): string {
  const { username, displayName, role, bio, website, links } = opts
  let email: string | null = null
  let phone: string | null = null
  const urls: string[] = []

  if (website) urls.push(resolveHref(website))

  for (const l of links) {
    if (!l.url) continue
    const e = extractEmailFromUrl(l.url)
    if (e && !email) { email = e; continue }
    const p = extractPhoneFromUrl(l.url)
    if (p && !phone) { phone = p; continue }
    if (/^https?:\/\//.test(l.url)) urls.push(l.url)
  }

  const [first, ...rest] = displayName.trim().split(' ')
  const last = rest.join(' ')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
    `FN:${escapeVCard(displayName)}`,
  ]
  if (role)  lines.push(`TITLE:${escapeVCard(role)}`)
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`)
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
  lines.push(`URL:https://tappedin.uk/u/${username}`)
  for (const u of urls) lines.push(`URL:${u}`)
  if (bio) lines.push(`NOTE:${escapeVCard(bio)}`)
  lines.push('END:VCARD')

  return `data:text/vcard;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

// ─── Founder Edition number, parsed from the owner's card ──────────────────────

// Founder Edition number — appears ONLY for genuine Founder Edition cards.
// Verified against live data: founders are "founders-edition-NNN"; business
// ("BUSINESS-NN") and standard PVC ("pvc-NNN") cards never match → no badge.
function parseFounderNumber(cards: CardRow[]): number | null {
  for (const c of cards) {
    const id = (c.card_id || '').trim().toLowerCase()
    const m = id.match(/^founders?-edition-0*(\d+)$/)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

// ─── SVG icons ─────────────────────────────────────────────────────────────────

function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 12L12 2M12 2H5M12 2v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconSaveContact() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Monochrome platform icons, keyed off the saved `label`. Covers every
// PLATFORM_OPTIONS value; anything unknown (incl. Custom) gets the link glyph.
function PlatformIcon({ label }: { label: string }) {
  const k = platformKey(label)
  const p = { width: 16, height: 16, 'aria-hidden': true as const, style: { display: 'block' } as CSSProperties }
  switch (k) {
    case 'instagram':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>)
    case 'tiktok':
      return (<svg viewBox="0 0 24 24" {...p} fill="currentColor"><path d="M16.5 3c.3 2 1.6 3.6 3.5 3.9V10c-1.4 0-2.7-.4-3.8-1.1v6.2c0 3.2-2.6 5.9-5.9 5.9S4.4 18.3 4.4 15s2.6-5.9 5.9-5.9c.3 0 .6 0 .9.1v3.2a2.8 2.8 0 101.9 2.6V3h3.4z"/></svg>)
    case 'youtube':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" stroke="none"/></svg>)
    case 'spotify':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.8c3-.8 6-.5 8.4.9M8 13c2.4-.6 4.7-.3 6.6.8M8.6 15.8c1.8-.4 3.5-.2 4.9.6"/></svg>)
    case 'soundcloud':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 14v3M7 11v6M10 9v8M13 11v6"/><path d="M16 17h2.5a2.5 2.5 0 000-5c-.2 0-.4 0-.6.1A4 4 0 0010 11" strokeLinejoin="round"/></svg>)
    case 'apple_music':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="17" r="2.5"/><path d="M10.5 17V6l8-1.6V14"/><circle cx="16" cy="14" r="2.5"/></svg>)
    case 'website':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z"/></svg>)
    case 'portfolio':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="M9 6.5V5a2 2 0 012-2h2a2 2 0 012 2v1.5M3 12h18"/></svg>)
    case 'linkedin':
      return (<svg viewBox="0 0 24 24" {...p} fill="currentColor"><path d="M6.1 8.6H3.4V21h2.7V8.6zM4.75 3.5A1.6 1.6 0 103 5.1a1.6 1.6 0 001.75-1.6zM21 13.8c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.95-2.95 1.6V8.6H11.6c.04.8 0 12.4 0 12.4h2.65v-6.9c0-.36 0-.72.13-.98.3-.72.93-1.46 2-1.46 1.4 0 1.97 1.06 1.97 2.62V21H21v-7.2z"/></svg>)
    case 'x_twitter':
    case 'twitter':
    case 'x':
      return (<svg viewBox="0 0 24 24" {...p} fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.2-5.4L6.5 21H3.5l7-8L2.8 3h6l3.8 5 4.9-5zm-1 16h1.6L8.1 4.6H6.4L16.5 19z"/></svg>)
    case 'whatsapp':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 20.5l1.4-4.3A8 8 0 1112 20a7.9 7.9 0 01-3.9-1l-4.6 1.5z" strokeLinejoin="round"/><path d="M9 9.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5.3.6 1.3 1.7 2.3 2.1.2.1.4.1.5 0l.6-.6c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.3.3.5 0 .9-.7 1.6-1.4 1.7-1.6.2-3.6-.9-5-2.3-1-1-1.9-2.3-1.8-3.6 0-.2 0-.3.1-.5z" fill="currentColor" stroke="none"/></svg>)
    case 'email':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>)
    case 'booking':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8.5 14h2M13.5 14h2M8.5 17.5h2M13.5 17.5h2"/></svg>)
    case 'reviews':
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5z"/></svg>)
    default:
      return (<svg viewBox="0 0 24 24" {...p} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 005 5l2-2M16 13l2-2a3.5 3.5 0 00-5-5l-2 2"/></svg>)
  }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const supabase = createAdminClient()

  const cleanUsername = decodeURIComponent(username)
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, role, website, avatar_url, headline, theme_style, accent_color, button_style, background_style')
    .ilike('username', cleanUsername)
    .maybeSingle<Profile>()

  if (error || !profile) notFound()

  // Public NFC profiles should be viewable
  // if (profile.is_public === false) notFound()

  const { data: links } = await supabase
    .from('profile_links')
    .select('id, label, url, link_type, custom_label, position, is_active')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const { data: galleryData } = await supabase
    .from('profile_gallery')
    .select('id, image_url, caption, position')
    .eq('profile_id', profile.id)
    .order('position', { ascending: true })
    .limit(3)

  // Founder Edition number (read-only; service-role read, no RLS impact).
  const { data: cardData } = await supabase
    .from('cards')
    .select('card_id, status, batch_id')
    .eq('owner_user_id', profile.id)

  const founderNumber = parseFounderNumber((cardData || []) as CardRow[])

  const activeLinks = ((links || []) as ProfileLink[]).filter(
    (l) => l.label && l.url && l.is_active
  )

  const galleryItems = ((galleryData || []) as GalleryItem[]).filter(g => g.image_url)

  const displayName = profile.display_name || profile.username || 'Creator'
  const role = profile.role || profile.headline || ''
  const handle = profile.username ? `@${profile.username}` : ''
  const initials = getInitials(displayName)

  const publicAccent = profile.accent_color || '#52d6fc'

  const btnStyle = getLinkButtonStyle(
    profile.button_style,
    publicAccent
  )

  // Icon/arrow colour adapts to the chosen button style (dark on white buttons).
  const isDefaultBtn = !profile.button_style || profile.button_style === 'default'
  const linkIconColor = (isDefaultBtn || profile.button_style === 'sharp')
    ? 'rgba(0,0,0,0.5)'
    : 'rgba(255,255,255,0.55)'

  const vcardHref = buildVCardHref({
    username: profile.username || cleanUsername,
    displayName,
    role,
    bio: profile.bio,
    website: profile.website,
    links: activeLinks,
  })

  const publicTheme = profile.theme_style || 'dark'
  const publicBackground = profile.background_style || 'solid_black'
  const styleKey = `${publicTheme} ${publicBackground}`
  const pageBackground =
    styleKey.includes('burgundy') ? '#120207' :
    styleKey.includes('navy') || styleKey.includes('midnight') ? '#020817' :
    styleKey.includes('emerald') || styleKey.includes('forest') ? '#020d08' :
    styleKey.includes('graphite') || styleKey.includes('carbon') ? '#101418' :
    '#030303'

  const cardBackground =
    publicBackground === 'frosted' || publicTheme.includes('glass')
      ? 'rgba(255,255,255,0.08)'
      : publicTheme === 'minimal'
        ? '#111'
        : '#0a0a0a'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: #030303;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes ti-scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ti-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ti-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.75; }
        }
        @keyframes ti-liveDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          50%      { box-shadow: 0 0 0 4px rgba(74,222,128,0); }
        }

        @media (hover: hover) {
          .ti-link:hover {
            transform: translateY(-2px) !important;
            filter: brightness(1.05);
          }
          .ti-gallery-img:hover {
            transform: scale(1.03);
          }
          .ti-save:hover { opacity: 0.92; transform: translateY(-1px); }
        }
        .ti-link:active { transform: translateY(0px) !important; }
        .ti-save:active { transform: translateY(0px) !important; }
        .ti-site:hover  { opacity: 0.65 !important; }
        .ti-cta:hover   { opacity: 0.7 !important; }
        .ti-gallery-img { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }

        .ti-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.65rem;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }

        @media (max-width: 480px) {
          .ti-card { padding: 1.5rem 1.1rem 1.75rem !important; }
          .ti-name { font-size: 2.1rem !important; }
          .ti-gallery-grid { grid-template-columns: 1fr; gap: 1rem; }
        }
        @media (min-width: 481px) and (max-width: 600px) {
          .ti-gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <main style={{ ...s.page, background: pageBackground }}>
        {/* ── Background layer ── */}
        <div aria-hidden="true" style={s.bgGrid} />
        <div aria-hidden="true" style={s.bgGlow} />
        <div aria-hidden="true" style={s.bgGrain} />

        {/* ── Card shell ── */}
        <div style={s.shell}>
          <div
            className="ti-card"
            style={{ ...s.card, background: cardBackground }}
          >

            {/* Card inner grain for depth */}
            <div aria-hidden="true" style={s.cardGrain} />

            {/* ── Top bar: brand + handle + live pill ── */}
            <div style={s.topBar}>
              <div style={s.topLeft}>
                <span style={s.brandMark}>TAPPED-IN</span>
                {handle && <span style={s.handle}>{handle}</span>}
              </div>
              <div
                style={{
                  ...s.livePill,
                  background: `${publicAccent}15`,
                  border: `1px solid ${publicAccent}`,
                  boxShadow: `0 0 12px ${publicAccent}33`,
                }}
              >
                <span style={{ ...s.liveDot, background: publicAccent }} />
                <span style={{ ...s.liveLabel, color: publicAccent }}>Active</span>
              </div>
            </div>

            {/* ── Avatar ── */}
            <div style={s.avatarSection}>
              <div
                style={{
                  ...s.avatarRing,
                  border: `1px solid ${publicAccent}`,
                  boxShadow: `0 0 18px ${publicAccent}55`,
                }}
              >
                <div style={s.avatarInner}>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      style={s.avatarImg}
                    />
                  ) : (
                    <span style={s.avatarInitials}>{initials}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Identity ── */}
            <div style={s.identity}>
              <p style={s.microLabel}>Digital profile</p>
              <h1 className="ti-name" style={s.name}>{displayName}</h1>
              {role && <p style={s.role}>{role}</p>}

              {founderNumber !== null && (
                <div style={s.founderBadge}>
                  <span style={s.founderLbl}>Founder Edition</span>
                  <span style={s.founderSep} />
                  <span style={s.founderNum}>{String(founderNumber).padStart(3, '0')} / 100</span>
                </div>
              )}

              {profile.bio && <p style={s.bio}>{profile.bio}</p>}
            </div>

            {/* ── Save contact (vCard) ── */}
            <a
              href={vcardHref}
              download={`${displayName.replace(/[^a-z0-9]+/gi, '-')}.vcf`}
              className="ti-save"
              style={s.saveContact}
            >
              <IconSaveContact />
              Save contact
            </a>
            
            <SaveToNetworkButton profileUserId={profile.id} profileName={displayName} />

            {/* ── Website ── */}
            {profile.website && (
              <a
                href={resolveHref(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                style={s.website}
                className="ti-site"
              >
                <PlatformIcon label="website" />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </span>
              </a>
            )}

            {/* ── Divider ── */}
            {activeLinks.length > 0 && <div style={s.divider} />}

            {/* ── Links ── */}
            {activeLinks.length > 0 && (
              <div style={s.linksGrid}>
                {activeLinks.map((link, i) => (
                  <a
                    key={link.id}
                    href={`/r/${link.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ti-link"
                    style={{
                      ...s.linkBtn,
                      ...btnStyle,
                      animationDelay: `${0.3 + i * 0.055}s`,
                      transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1), filter 0.15s ease, box-shadow 0.22s ease',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.06) inset',
                    }}
                  >
                    <span style={{ ...s.linkIconLeft, color: linkIconColor }}>
                      <PlatformIcon label={link.label} />
                    </span>
                    <span style={s.linkLabel}>{link.custom_label || link.label}</span>
                    <span style={{ ...s.linkArrow, color: linkIconColor }}>
                      <IconArrow />
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* Empty state */}
            {activeLinks.length === 0 && (
              <div style={s.emptyState}>
                <p style={s.emptyText}>No links yet.</p>
              </div>
            )}

            {/* ── Featured Work gallery ── */}
            {galleryItems.length > 0 && (
              <>
                <div style={{ ...s.divider, marginTop: '1.5rem' }} />
                <div style={s.gallerySection}>
                  <p style={s.galleryHeading}>Featured Work</p>
                  <div className="ti-gallery-grid">
                    {galleryItems.map((item, i) => (
                      <div
                        key={item.id}
                        style={{
                          ...s.galleryItem,
                          animationDelay: `${0.32 + i * 0.07}s`,
                        }}
                      >
                        <div style={s.galleryFrame}>
                          <img
                            src={item.image_url}
                            alt={item.caption ?? 'Featured work'}
                            className="ti-gallery-img"
                            style={s.galleryImg}
                          />
                        </div>
                        {item.caption && (
                          <p style={s.galleryCaption}>{item.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Footer brand mark ── */}
            <div style={s.footer}>
              <div style={s.footerDivider} />
              <div style={s.footerRow}>
                <span style={s.footerLeft}>
                  <span style={s.footerBrand}>TAPPED-IN</span>
                  <span style={s.footerSlogan}>A new standard of Networking.</span>
                </span>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ti-cta"
                  style={s.footerCta}
                >
                  Get your card →
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Brand display face (Oswald, matches the physical card) + neutral body (Inter).
// Variables are provided by next/font in layout.tsx; named fallbacks follow.
const DISPLAY = `var(--font-oswald), 'Oswald', 'Arial Narrow', sans-serif`
const FF      = `var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: '#030303',
    color: '#fff',
    fontFamily: FF,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'clamp(2rem,6vw,4rem) 1.25rem clamp(3rem,8vw,5rem)',
    position: 'relative',
    overflow: 'hidden',
  },

  bgGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: [
      'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '60px 60px',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 20%, black 20%, transparent 72%)',
    maskImage:       'radial-gradient(ellipse 80% 80% at 50% 20%, black 20%, transparent 72%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  bgGlow: {
    position: 'fixed',
    top: '-140px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '640px',
    height: '420px',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.032) 0%, transparent 68%)',
    filter: 'blur(8px)',
    animation: 'ti-pulse 6s ease-in-out infinite',
    pointerEvents: 'none',
    zIndex: 0,
  },

  bgGrain: {
    position: 'fixed',
    inset: 0,
    opacity: 0.038,
    backgroundImage: GRAIN,
    backgroundSize: '220px 220px',
    pointerEvents: 'none',
    zIndex: 0,
  },

  shell: {
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 1,
    animation: 'ti-scaleIn 0.65s cubic-bezier(0.16,1,0.3,1) both',
  },

  card: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '28px',
    padding: '1.75rem 1.75rem 2rem',
    boxShadow: [
      '0 40px 100px rgba(0,0,0,0.7)',
      '0 1px 0 rgba(255,255,255,0.045) inset',
      '0 0 0 1px rgba(255,255,255,0.03)',
    ].join(', '),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },

  cardGrain: {
    position: 'absolute',
    inset: 0,
    opacity: 0.025,
    backgroundImage: GRAIN,
    backgroundSize: '180px 180px',
    pointerEvents: 'none',
    borderRadius: '28px',
    zIndex: 0,
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    position: 'relative',
    zIndex: 1,
    animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
  },

  topLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  brandMark: {
    fontFamily: DISPLAY,
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: 'rgba(255,255,255,0.22)',
    textTransform: 'uppercase' as const,
    userSelect: 'none' as const,
  },

  handle: {
    fontFamily: FF,
    fontSize: '0.76rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: '0.01em',
  },

  livePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '9999px',
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.2)',
  },

  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#4ade80',
    animation: 'ti-liveDot 2.5s ease-in-out infinite',
  },

  liveLabel: {
    fontFamily: FF,
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#4ade80',
    letterSpacing: '0.04em',
  },

  avatarSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    position: 'relative',
    zIndex: 1,
    animation: 'ti-fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.08s both',
  },

  avatarRing: {
    width: '96px',
    height: '96px',
    borderRadius: '26px',
    padding: '2px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
    boxShadow: '0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
    flexShrink: 0,
  },

  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: '24px',
    overflow: 'hidden',
    background: 'linear-gradient(148deg, #1a1a1a, #111)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.06)',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },

  avatarInitials: {
    fontFamily: DISPLAY,
    fontSize: '1.85rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.04em',
    userSelect: 'none' as const,
  },

  identity: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '1.25rem',
    position: 'relative',
    zIndex: 1,
    animation: 'ti-fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.12s both',
  },

  microLabel: {
    fontFamily: FF,
    fontSize: '0.6rem',
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.2)',
    marginBottom: '0.55rem',
  },

  name: {
    fontFamily: DISPLAY,
    fontSize: 'clamp(2rem, 6.5vw, 2.5rem)',
    fontWeight: 600,
    letterSpacing: '0.005em',
    lineHeight: 1.04,
    color: '#fff',
    marginBottom: '0.45rem',
  },

  role: {
    fontFamily: FF,
    fontSize: '0.88rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: '0.01em',
    marginBottom: '0.85rem',
    lineHeight: 1.4,
  },

  founderBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    padding: '7px 13px',
    marginBottom: '0.9rem',
    borderRadius: '9px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
  },

  founderLbl: {
    fontFamily: DISPLAY,
    fontWeight: 500,
    fontSize: '0.62rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.7)',
  },

  founderSep: {
    width: '1px',
    height: '12px',
    background: 'rgba(255,255,255,0.18)',
  },

  founderNum: {
    fontFamily: DISPLAY,
    fontWeight: 600,
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: '#fff',
  },

  bio: {
    fontFamily: FF,
    fontSize: '0.86rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1.72,
    maxWidth: '320px',
    whiteSpace: 'pre-line' as const,
  },

  saveContact: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '0.9rem 1rem',
    marginBottom: '1.1rem',
    borderRadius: '14px',
    border: 'none',
    background: '#fff',
    color: '#0a0a0b',
    fontFamily: FF,
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    position: 'relative',
    zIndex: 1,
    animation: 'ti-fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.16s both',
  },

  website: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    color: 'rgba(255,255,255,0.38)',
    textDecoration: 'none',
    fontFamily: FF,
    fontSize: '0.78rem',
    fontWeight: 500,
    letterSpacing: '0.01em',
    marginBottom: '1.25rem',
    transition: 'opacity 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
    position: 'relative',
    zIndex: 1,
  },

  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.055)',
    marginBottom: '1.25rem',
    position: 'relative',
    zIndex: 1,
  },

  linksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    marginBottom: '1.75rem',
    position: 'relative',
    zIndex: 1,
  },

  linkBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.95rem 1.1rem',
    textDecoration: 'none',
    fontFamily: FF,
    fontSize: '0.93rem',
    fontWeight: 600,
    letterSpacing: '0.005em',
    boxSizing: 'border-box' as const,
    width: '100%',
    minHeight: '52px',
    animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },

  linkIconLeft: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '20px',
    flexShrink: 0,
  },

  linkLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
    padding: '0 0.5rem',
  },

  linkArrow: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: '20px',
    justifyContent: 'flex-end',
  },

  emptyState: {
    padding: '2rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },

  emptyText: {
    fontFamily: FF,
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic' as const,
    letterSpacing: '0.02em',
  },

  gallerySection: {
    position: 'relative',
    zIndex: 1,
    marginBottom: '1.75rem',
    animation: 'ti-fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both',
  },

  galleryHeading: {
    fontFamily: FF,
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.22)',
    marginBottom: '0.85rem',
    textAlign: 'center' as const,
  },

  galleryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  galleryFrame: {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: '125%',
    borderRadius: '9px',
    overflow: 'hidden' as const,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
  },

  galleryImg: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },

  galleryCaption: {
    fontFamily: FF,
    fontSize: '0.7rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.28)',
    lineHeight: 1.45,
    letterSpacing: '0.01em',
    textAlign: 'center' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },

  footer: {
    position: 'relative',
    zIndex: 1,
    animation: 'ti-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both',
  },

  footerDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.05)',
    marginBottom: '1rem',
  },

  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },

  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  footerBrand: {
    fontFamily: DISPLAY,
    fontSize: '0.56rem',
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: 'rgba(255,255,255,0.16)',
    textTransform: 'uppercase' as const,
  },

  footerSlogan: {
    fontFamily: FF,
    fontSize: '0.6rem',
    fontWeight: 300,
    fontStyle: 'italic' as const,
    letterSpacing: '0.03em',
    color: 'rgba(255,255,255,0.12)',
  },

  footerCta: {
    fontFamily: FF,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.32)',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    transition: 'opacity 0.2s ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
}
