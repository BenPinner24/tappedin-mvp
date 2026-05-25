import { createAdminClient } from '@/lib/supabase/admin'
import { notFound }     from 'next/navigation'
import type { CSSProperties } from 'react'

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

function detectKind(label: string, url: string): 'whatsapp' | 'email' | 'url' {
  const l = label.toLowerCase()
  if (l.includes('whatsapp') || l.includes('whats app') || url.includes('wa.me')) return 'whatsapp'
  if (l.includes('email') || l.includes('mail') || l.includes('contact') || url.includes('mail.google.com')) return 'email'
  return 'url'
}

function getLinkButtonStyle(buttonStyle: string | null): CSSProperties {
  if (buttonStyle === 'sharp') {
    return {
      background: 'rgba(255,255,255,0.96)',
      color: '#000',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: '6px',
    }
  }
  if (buttonStyle === 'outline') {
    return {
      background: 'transparent',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: '14px',
    }
  }
  if (buttonStyle === 'glass') {
    return {
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '14px',
    }
  }
  return {
    background: 'rgba(255,255,255,0.95)',
    color: '#000',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
  }
}

// ─── SVG icons (inline, no external deps) ─────────────────────────────────────

function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 12L12 2M12 2H5M12 2v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.533 5.859L0 24l6.322-1.51A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.365l-.358-.214-3.723.889.904-3.638-.233-.373A9.782 9.782 0 012.182 12C2.182 6.571 6.571 2.182 12 2.182S21.818 6.571 21.818 12 17.429 21.818 12 21.818z"/>
    </svg>
  )
}

function IconEmail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55 }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }}>
      <circle cx="7" cy="7" r="6"/>
      <path d="M7 1c0 0-2.5 2-2.5 6s2.5 6 2.5 6"/>
      <path d="M7 1c0 0 2.5 2 2.5 6s-2.5 6-2.5 6"/>
      <path d="M1 7h12"/>
    </svg>
  )
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
.select('id, username, display_name, bio, role, website, avatar_url, headline, theme_style, accent_color, button_style, background_style, is_public')
.ilike('username', cleanUsername)
.maybeSingle<Profile>()

console.log('PUBLIC PROFILE LOOKUP:', { cleanUsername, profile, error })

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

  const activeLinks = ((links || []) as ProfileLink[]).filter(
    (l) => l.label && l.url && l.is_active
  )

  const galleryItems = ((galleryData || []) as GalleryItem[]).filter(g => g.image_url)

  const displayName = profile.display_name || profile.username || 'Creator'
  const role        = profile.role || profile.headline || ''
  const handle      = profile.username ? `@${profile.username}` : ''
  const initials    = getInitials(displayName)
  const btnStyle    = getLinkButtonStyle(profile.button_style)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

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
        }
        .ti-link:active { transform: translateY(0px) !important; }
        .ti-site:hover  { opacity: 0.65 !important; }
        .ti-cta:hover   { opacity: 0.7 !important; }
        .ti-gallery-img { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }

        .ti-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.65rem;
        }

        @media (max-width: 480px) {
          .ti-card { padding: 1.5rem 1.1rem 1.75rem !important; }
          .ti-name { font-size: 2rem !important; }
          .ti-gallery-grid { grid-template-columns: 1fr; gap: 1rem; }
        }
        @media (min-width: 481px) and (max-width: 600px) {
          .ti-gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <main style={s.page}>
        {/* ── Background layer ── */}
        <div aria-hidden="true" style={s.bgGrid} />
        <div aria-hidden="true" style={s.bgGlow} />
        <div aria-hidden="true" style={s.bgGrain} />

        {/* ── Card shell ── */}
        <div style={s.shell}>
          <div className="ti-card" style={s.card}>

            {/* Card inner grain for depth */}
            <div aria-hidden="true" style={s.cardGrain} />

            {/* ── Top bar: brand + handle + live pill ── */}
            <div style={s.topBar}>
              <div style={s.topLeft}>
                <span style={s.brandMark}>TAPPED-IN</span>
                {handle && <span style={s.handle}>{handle}</span>}
              </div>
              <div style={s.livePill}>
                <span style={s.liveDot} />
                <span style={s.liveLabel}>Active</span>
              </div>
            </div>

            {/* ── Avatar ── */}
            <div style={s.avatarSection}>
              <div style={s.avatarRing}>
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
              {profile.bio && <p style={s.bio}>{profile.bio}</p>}
            </div>

            {/* ── Website ── */}
            {profile.website && (
  <a
    href={resolveHref(profile.website)}
    target="_blank"
    rel="noopener noreferrer"
    className="ti-site"
  >
    {profile.website.replace(/^https?:\/\//, '')}
  </a>
)}
                {profile.website && (
  <a
    href={resolveHref(profile.website)}
    target="_blank"
    rel="noopener noreferrer"
    style={s.website}
  >
    <IconGlobe />
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
                {activeLinks.map((link, i) => {
                  const kind = detectKind(link.label ?? '', link.url ?? '')
                  const isDefault = !profile.button_style || profile.button_style === 'default'
                  const iconColor = (isDefault || profile.button_style === 'sharp')
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(255,255,255,0.55)'

                  return (
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
    <span style={{ ...s.linkIconLeft, color: iconColor }}>
      {kind === 'whatsapp' && <IconWhatsApp />}
      {kind === 'email' && <IconEmail />}
      {kind === 'url' && <span style={{ width: 15, display: 'inline-block' }} />}
    </span>
    <span style={s.linkLabel}>{link.custom_label || link.label}</span>
    <span style={{ ...s.linkArrow, color: iconColor }}>
      <IconArrow />
    </span>
  </a>
)
                })}
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
                        {/* 4:5 frame using paddingBottom trick */}
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

const FF  = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`
const MONO = `'SF Mono', 'Fira Code', ui-monospace, monospace`

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
    fontFamily: MONO,
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.2)',
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
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
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
    fontFamily: FF,
    fontSize: '1.65rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '-0.03em',
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
    fontFamily: FF,
    fontSize: 'clamp(1.9rem, 6vw, 2.4rem)',
    fontWeight: 700,
    letterSpacing: '-0.035em',
    lineHeight: 1.05,
    color: '#fff',
    marginBottom: '0.45rem',
  },

  role: {
    fontFamily: FF,
    fontSize: '0.88rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: '0.01em',
    marginBottom: '0.8rem',
    lineHeight: 1.4,
  },

  bio: {
    fontFamily: FF,
    fontSize: '0.86rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1.72,
    maxWidth: '320px',
    whiteSpace: 'pre-line' as const,
  },

  website: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: 'rgba(255,255,255,0.38)',
    textDecoration: 'none',
    fontFamily: FF,
    fontSize: '0.78rem',
    fontWeight: 500,
    letterSpacing: '0.01em',
    marginBottom: '1.25rem',
    marginTop: '-0.25rem',
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

  // ── Featured Work gallery ──────────────────────────────────────────────────

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

  // 4:5 aspect ratio — padding-bottom trick
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

  // ── Footer brand mark ──────────────────────────────────────────────────────

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
    fontFamily: MONO,
    fontSize: '0.52rem',
    fontWeight: 700,
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.15)',
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