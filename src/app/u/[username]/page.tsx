import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import {
  colors,
  font,
  radius,
  shadows,
  borders,
  gradients,
  transitions,
  text,
} from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

type PublicProfilePageProps = {
  params: Promise<{ username: string }>
}

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  role: string | null
  website: string | null
  avatar_url: string | null
  headline: string | null
  theme_style: string | null
  accent_color: string | null
  button_style: string | null
  background_style: string | null
  is_public?: boolean | null
}

type ProfileLink = {
  id: string
  label: string | null
  url: string | null
  link_type: string | null
  position: number | null
  is_active: boolean | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(value: string): string {
  const parts = value.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

function normaliseUrl(value: string): string {
  return value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `https://${value}`
}

function getButtonStyle(buttonStyle: string | null): CSSProperties {
  if (buttonStyle === 'sharp') {
    return {
      borderRadius: radius.lg,
      background: 'rgba(255,255,255,0.95)',
      color: '#000',
      border: `1px solid ${colors.border.strong}`,
    }
  }
  if (buttonStyle === 'outline') {
    return {
      borderRadius: radius.lg,
      background: 'transparent',
      color: colors.text.primary,
      border: borders.focus,
    }
  }
  if (buttonStyle === 'glass') {
    return {
      borderRadius: radius.lg,
      background: colors.white[5],
      color: colors.text.primary,
      border: borders.default,
    }
  }
  // default — solid white
  return {
    borderRadius: radius.lg,
    background: 'rgba(255,255,255,0.95)',
    color: '#000',
    border: borders.default,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, role, website, avatar_url, headline, theme_style, accent_color, button_style, background_style, is_public')
    .eq('username', username)
    .maybeSingle<Profile>()

  if (error || !profile) notFound()
  if (profile.is_public === false) notFound()

  const { data: links } = await supabase
    .from('profile_links')
    .select('id, label, url, link_type, position, is_active')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const activeLinks = ((links || []) as ProfileLink[]).filter(
    (l) => l.label && l.url && l.is_active
  )

  const displayName = profile.display_name || profile.username || 'Creator'
  const role        = profile.role || profile.headline || ''
  const handle      = profile.username ? `@${profile.username}` : ''
  const initials    = getInitials(displayName)
  const buttonStyle = getButtonStyle(profile.button_style)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: ${colors.bg.page};
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.7; }
          100% { opacity: 0.4; }
        }

        .ti-link-btn {
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.2s ease,
                      background 0.15s ease,
                      opacity 0.15s ease;
        }
        .ti-link-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.45) !important;
          opacity: 0.92;
        }
        .ti-link-btn:active { transform: translateY(0px); }

        .ti-website:hover { opacity: 0.7 !important; }
        .ti-footer-link:hover { opacity: 0.7 !important; }

        @media (max-width: 480px) {
          .ti-card { padding: 1.5rem 1.25rem 2rem !important; }
          .ti-name { font-size: 2.2rem !important; }
        }
      `}</style>

      <main style={s.page}>
        <div style={s.bgGrid} />
        <div style={s.bgGlow} />

        <div style={s.shell}>
          <div className="ti-card" style={s.card}>

            {/* ── Top bar ── */}
            <div style={s.topBar}>
              <div style={s.brandGroup}>
                <span style={s.brandMark}>TAPPED-IN</span>
                {handle && <span style={s.handle}>{handle}</span>}
              </div>
              <div style={s.activePill}>
                <span style={s.activeDot} />
                <span style={s.activeLabel}>Active</span>
              </div>
            </div>

            {/* ── Hero ── */}
            <div style={s.hero}>
              <div style={s.avatarOuter}>
                <div style={s.avatarInner}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} style={s.avatarImg} />
                  ) : (
                    <span style={s.avatarInitials}>{initials}</span>
                  )}
                </div>
              </div>

              <div style={s.identity}>
                <p style={s.microLabel}>Digital profile</p>
                <h1 className="ti-name" style={s.name}>{displayName}</h1>
                {role && <p style={s.role}>{role}</p>}
                {profile.bio && <p style={s.bio}>{profile.bio}</p>}
              </div>
            </div>

            {/* ── Website ── */}
            {profile.website && (
              <a
                href={normaliseUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="ti-website"
                style={s.website}
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 1c0 0-2.5 2-2.5 6s2.5 6 2.5 6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 1c0 0 2.5 2 2.5 6s-2.5 6-2.5 6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 7h12" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}

            {/* ── Links ── */}
            <div style={s.linksSection}>
              {activeLinks.length === 0 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyText}>No links yet.</p>
                </div>
              ) : (
                <div style={s.linksGrid}>
                  {activeLinks.map((link, i) => (
                    <a
                      key={link.id}
                      href={`/r/${link.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ti-link-btn"
                      style={{
                        ...s.linkBtn,
                        ...buttonStyle,
                        animationDelay: `${0.35 + i * 0.06}s`,
                      }}
                    >
                      <span style={s.linkLabel}>{link.label}</span>
                      <span style={s.linkArrow}>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M2 12L12 2M12 2H5M12 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={s.footer}>
              <div style={s.footerDivider} />
              <div style={s.footerRow}>
                <span style={s.footerLeft}>
                  <span style={s.footerBrand}>TAPPED-IN</span>
                  <span style={s.footerSlogan}>A new standard of Networking.</span>
                </span>
                <a
                  href="/"
                  className="ti-footer-link"
                  style={s.footerCta}
                  target="_blank"
                  rel="noopener noreferrer"
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

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: colors.bg.page,
    color: colors.text.primary,
    fontFamily: font.sans,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '2rem 1.25rem 4rem',
    position: 'relative',
    overflow: 'hidden',
  },

  bgGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: gradients.bgGrid,
    backgroundSize: '56px 56px',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 72%)',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 72%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  bgGlow: {
    position: 'fixed',
    top: '-120px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: gradients.bgGlow,
    filter: 'blur(8px)',
    pointerEvents: 'none',
    animation: 'shimmer 5s ease-in-out infinite',
    zIndex: 0,
  },

  shell: {
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1,
    animation: 'scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
  },

  card: {
    width: '100%',
    background: colors.bg.surface,
    border: borders.default,
    borderRadius: radius['4xl'],
    padding: '1.75rem 1.75rem 2rem',
    boxShadow: shadows.card,
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Top bar
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
  },

  brandGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  brandMark: {
    ...text.brandMark,
    fontSize: '0.6rem',
    letterSpacing: '0.24em',
    color: colors.text.faint,
  },

  handle: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    letterSpacing: '0.01em',
    fontFamily: font.sans,
  },

  activePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: radius.full,
    background: colors.accent.successBg,
    border: `1px solid ${colors.accent.successBorder}`,
  },

  activeDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: colors.accent.success,
    boxShadow: `0 0 5px ${colors.accent.success}`,
  },

  activeLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.accent.success,
    letterSpacing: font.tracking.wide,
    fontFamily: font.sans,
  },

  // ── Hero
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '1.5rem',
    animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both',
  },

  avatarOuter: {
    width: '100px',
    height: '100px',
    borderRadius: radius['4xl'],
    padding: '2px',
    background: gradients.avatarBorder,
    marginBottom: '1.5rem',
    flexShrink: 0,
  },

  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: '26px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #1a1a1a, #111)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${colors.white[5]}`,
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarInitials: {
    fontFamily: font.sans,
    fontSize: '1.75rem',
    fontWeight: font.weight.bold,
    color: colors.white[50],
    letterSpacing: font.tracking.snug,
  },

  identity: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
  },

  microLabel: {
    ...text.eyebrow,
    fontSize: '0.62rem',
    letterSpacing: '0.18em',
    color: colors.text.ghost,
    marginBottom: '0.6rem',
  },

  name: {
    fontFamily: font.sans,
    fontSize: '2.5rem',
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: 1.0,
    marginBottom: '0.5rem',
  },

  role: {
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.regular,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.01em',
    marginBottom: '0.85rem',
    lineHeight: 1.4,
  },

  bio: {
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.light,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: font.leading.relaxed,
    maxWidth: '320px',
    whiteSpace: 'pre-line',
  },

  // ── Website
  website: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: colors.text.muted,
    textDecoration: 'none',
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    letterSpacing: '0.01em',
    marginBottom: '1.5rem',
    transition: transitions.opacity,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: font.sans,
  },

  // ── Links
  linksSection: {
    marginBottom: '1.5rem',
    animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both',
  },

  linksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },

  linkBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.15rem',
    textDecoration: 'none',
    fontFamily: font.sans,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.01em',
    boxSizing: 'border-box',
    width: '100%',
    boxShadow: shadows.md,
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  linkLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },

  linkArrow: {
    flexShrink: 0,
    marginLeft: '0.75rem',
    opacity: 0.5,
    display: 'flex',
    alignItems: 'center',
  },

  emptyState: {
    padding: '2rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    ...text.caption,
    letterSpacing: '0.02em',
  },

  // ── Footer
  footer: {
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both',
  },

  footerDivider: {
    height: '1px',
    background: colors.border.subtle,
    marginBottom: '1.1rem',
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
    ...text.brandMark,
    fontSize: '0.55rem',
    color: 'rgba(255,255,255,0.18)',
  },

  footerSlogan: {
    ...text.slogan,
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.15)',
  },

  footerCta: {
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    textDecoration: 'none',
    letterSpacing: '0.01em',
    transition: transitions.opacity,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
}
