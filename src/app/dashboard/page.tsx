'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  colors,
  font,
  radius,
  spacing,
  shadows,
  borders,
  transitions,
  text,
  inputs,
  cards,
  buttons,
  layout,
  statusBadgeStyle,
} from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  role: string | null
  website: string | null
  avatar_url: string | null
  accent_color: string | null
}

type CardRecord = {
  card_id: string
  status: string | null
  nfc_url: string | null
}

type TapEvent = {
  tapped_at: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div style={inputs.group}>
      <label style={inputs.label}>{label}</label>
      <input
        value={value}
        placeholder={placeholder ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputs.base}
      />
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div style={inputs.group}>
      <label style={inputs.label}>{label}</label>
      <textarea
        value={value}
        placeholder={placeholder ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputs.textarea}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]     = useState(true)
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [card, setCard]           = useState<CardRecord | null>(null)
  const [tapCount, setTapCount]   = useState(0)
  const [lastTap, setLastTap]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return
      const userId = session.user.id

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle()
      if (profileData) setProfile(profileData)

      const { data: cardData } = await supabase
        .from('cards').select('card_id, status, nfc_url')
        .eq('owner_user_id', userId).limit(1).maybeSingle()
      if (cardData) setCard(cardData)

      const { data: tapEvents } = await supabase
        .from('tap_events').select('tapped_at')
        .eq('profile_id', userId).eq('event_type', 'card_tap')
        .order('tapped_at', { ascending: false })

      const safe = (tapEvents || []) as TapEvent[]
      setTapCount(safe.length)
      if (safe[0]) setLastTap(new Date(safe[0].tapped_at).toLocaleString())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!profile) return
    try {
      setSaving(true)
      await supabase.from('profiles').update({
        display_name: profile.display_name,
        bio: profile.bio,
        role: profile.role,
        website: profile.website,
        accent_color: profile.accent_color,
      }).eq('id', profile.id)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0]
      if (!file || !profile) return
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) { console.error(uploadError); return }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = data.publicUrl

      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id)
      setProfile({ ...profile, avatar_url: avatarUrl })
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  function patch(fields: Partial<Profile>) {
    setProfile((prev) => (prev ? { ...prev, ...fields } : null))
  }

  const cardStatusBadge = card?.status
    ? statusBadgeStyle(card.status as Parameters<typeof statusBadgeStyle>[0])
    : null

  if (loading) {
    return (
      <main style={s.loadingPage}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner} />
      </main>
    )
  }

  return (
    <main style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        @keyframes spin   { to   { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        *, *::before, *::after { box-sizing: border-box; }

        input::placeholder,
        textarea::placeholder { color: ${colors.text.ghost}; }

        input:focus,
        textarea:focus {
          border-color: ${colors.border.default} !important;
          background: ${colors.white[5]} !important;
          outline: none;
        }

        .ti-save-btn:hover   { background: #e2e2e2 !important; transform: translateY(-1px); box-shadow: ${shadows.btnHover} !important; }
        .ti-save-btn:active  { transform: translateY(0); }
        .ti-upload-btn:hover { border-color: ${colors.border.focus} !important; color: ${colors.white[90]} !important; }
        .ti-nfc-btn:hover    { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important; }
        .ti-nfc-btn:active   { transform: translateY(0); }
        .ti-analytics:hover  { border-color: ${colors.border.strong} !important; background: ${colors.white[5]} !important; }
        .ti-view-link:hover  { color: ${colors.white[90]} !important; }

        .ti-stat-cell:last-child { border-right: none !important; }

        /* ── Responsive: tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .ti-layout {
            grid-template-columns: 1fr !important;
            padding: 2rem 1.5rem !important;
            max-width: 680px !important;
          }
          .ti-left-col {
            position: static !important;
            top: auto !important;
            /* On tablet show preview card collapsed — just the NFC panel + brand mark */
          }
          .ti-preview-card { display: none !important; }
          .ti-stats-bar {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .ti-stat-cell:nth-child(2) { border-right: none !important; }
          .ti-stat-cell:nth-child(3) { border-top: 1px solid ${colors.border.subtle} !important; }
          .ti-stat-cell:nth-child(4) { border-top: 1px solid ${colors.border.subtle} !important; }
          .ti-form-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Responsive: mobile (≤ 640px) ── */
        @media (max-width: 640px) {
          .ti-layout {
            padding: 1.25rem 1rem !important;
            gap: 1rem !important;
          }
          .ti-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .ti-save-btn-wrap {
            width: 100% !important;
          }
          .ti-save-btn-wrap button {
            width: 100% !important;
          }
          .ti-page-title {
            font-size: ${font.size['3xl']} !important;
          }
          .ti-stats-bar {
            grid-template-columns: 1fr 1fr !important;
          }
          .ti-editor-card {
            padding: 1.25rem !important;
          }
          .ti-avatar-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .ti-analytics-card {
            padding: 1rem 1.25rem !important;
          }
          .ti-nfc-panel {
            padding: 1rem !important;
          }
          .ti-form-grid {
            grid-template-columns: 1fr !important;
          }
          .ti-right-col {
            gap: 0.875rem !important;
          }
        }

        /* ── Responsive: large desktop (≥ 1280px) ── */
        @media (min-width: 1280px) {
          .ti-layout {
            grid-template-columns: 360px 1fr !important;
          }
        }
      `}</style>

      <div style={s.layout} className="ti-layout">

        {/* ═══════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════ */}
        <aside style={s.leftCol} className="ti-left-col">

          {/* ── Live profile preview (hidden on tablet/mobile) ── */}
          <div style={s.previewCard} className="ti-preview-card">
            <div style={s.previewHeader}>
              <span style={s.eyebrow}>Live preview</span>
              <span style={s.livePill}>
                <span style={s.liveDot} />
                Live
              </span>
            </div>

            <div style={s.previewBody}>
              <div style={s.previewAvatarWrap}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={s.previewAvatarImg} />
                ) : (
                  <span style={s.previewAvatarInitials}>
                    {(profile?.display_name || 'TI').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <h2 style={s.previewName}>
                {profile?.display_name || 'Your name'}
              </h2>
              <p style={s.previewRole}>
                {profile?.role || 'Your role'}
              </p>
              {profile?.bio && (
                <p style={s.previewBio}>{profile.bio}</p>
              )}

              <div style={s.previewLinks}>
                {['Instagram', 'Portfolio', 'Contact'].map((l) => (
                  <div key={l} style={s.previewLinkPill}>{l}</div>
                ))}
              </div>
            </div>

            {profile?.username ? (
              <div style={s.previewFooter}>
                <span style={s.previewUrl}>tappedin.uk/u/{profile.username}</span>
                <Link href={`/u/${profile.username}`} className="ti-view-link" style={s.previewViewLink}>
                  View profile →
                </Link>
              </div>
            ) : (
              <div style={s.previewFooter}>
                <span style={s.previewUrl}>Complete onboarding to claim your URL</span>
              </div>
            )}
          </div>

          {/* ── NFC card panel ── */}
          <div style={s.nfcPanel} className="ti-nfc-panel">
            <div style={s.nfcPanelHeader}>
              <div>
                <p style={s.eyebrow}>NFC card</p>
                <h3 style={s.nfcPanelTitle}>Connected card</h3>
              </div>
              {card && cardStatusBadge && (
                <div style={cardStatusBadge}>
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'currentColor',
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  {card.status ?? 'Unknown'}
                </div>
              )}
            </div>

            {card ? (
              <>
                <div style={s.nfcCardVisual}>
                  <div style={s.nfcSheen} />
                  <div style={s.nfcCardTop}>
                    <span style={s.nfcBrand}>TAPPED-IN</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M5.5 12c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="1.75" fill="rgba(255,255,255,0.55)"/>
                    </svg>
                  </div>
                  <div style={s.nfcCardId}>{card.card_id}</div>
                </div>

                <div style={s.nfcStatsRow}>
                  <div style={s.nfcStat}>
                    <span style={s.nfcStatValue}>{tapCount}</span>
                    <span style={s.nfcStatLabel}>Total taps</span>
                  </div>
                  <div style={s.nfcStatDivider} />
                  <div style={s.nfcStat}>
                    <span style={s.nfcStatValue} title={lastTap ?? undefined}>
                      {lastTap ? lastTap.split(',')[0] : '—'}
                    </span>
                    <span style={s.nfcStatLabel}>Last tap</span>
                  </div>
                </div>

                <Link href={`/a/${card.card_id}`} className="ti-nfc-btn" style={s.nfcOpenBtn}>
                  Open NFC profile
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </>
            ) : (
              <div style={s.nfcEmptyState}>
                <div style={s.nfcEmptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                    <path d="M10 12c0-1.1.9-2 2-2s2 .9 2 2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.25)"/>
                  </svg>
                </div>
                <p style={s.nfcEmptyTitle}>No card connected</p>
                <p style={s.nfcEmptyText}>
                  Your NFC card will appear here once it has been activated and linked to your account.
                </p>
              </div>
            )}
          </div>

          {/* ── Brand mark ── */}
          <div style={s.brandMark}>
            <span style={s.brandMarkLogo}>TAPPED-IN</span>
            <span style={s.brandMarkSlogan}>A new standard of Networking.</span>
          </div>

        </aside>

        {/* ═══════════════════════════════════
            RIGHT COLUMN
        ═══════════════════════════════════ */}
        <div style={s.rightCol} className="ti-right-col">

          {/* ── Page header ── */}
          <div style={s.pageHeader} className="ti-page-header">
            <div style={s.pageHeaderLeft}>
              <p style={s.eyebrow}>Dashboard</p>
              <h1 style={s.pageTitle} className="ti-page-title">
                {profile?.display_name
                  ? `${profile.display_name.split(' ')[0]}`
                  : 'Your profile'}
              </h1>
            </div>
            <div className="ti-save-btn-wrap">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="ti-save-btn"
                style={s.saveBtn}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div style={s.statsBar} className="ti-stats-bar">
            {[
              { label: 'Total taps',  value: tapCount.toString() },
              { label: 'Card status', value: card?.status ?? 'No card' },
              { label: 'Card ID',     value: card?.card_id ?? '—' },
              { label: 'Last tap',    value: lastTap ? lastTap.split(',')[0] : 'No activity' },
            ].map((stat, i) => (
              <div key={stat.label} className="ti-stat-cell" style={{
                ...s.statCell,
                borderRight: i < 3 ? borders.subtle : 'none',
              }}>
                <span style={s.statValue}>{stat.value}</span>
                <span style={s.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* ── Profile editor ── */}
          <div style={s.editorCard} className="ti-editor-card">
            <div style={s.editorHeader}>
              <div>
                <p style={s.eyebrow}>Profile</p>
                <h2 style={s.sectionTitle}>Edit profile</h2>
              </div>
            </div>

            {/* Avatar row */}
            <div style={s.avatarRow} className="ti-avatar-row">
              <div style={s.avatarWrap}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={s.avatarImg} />
                ) : (
                  <span style={s.avatarInitials}>
                    {(profile?.display_name || 'TI').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={s.avatarMeta}>
                <p style={s.avatarName}>{profile?.display_name || 'Your name'}</p>
                <p style={s.avatarSub}>
                  {profile?.username
                    ? `tappedin.uk/u/${profile.username}`
                    : 'Username not set'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="ti-upload-btn"
                  style={s.uploadBtn}
                >
                  {uploading ? 'Uploading…' : 'Change avatar'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>

            {/* Form fields */}
            <div style={s.formGrid} className="ti-form-grid">
              <FormInput
                label="Display name"
                value={profile?.display_name ?? ''}
                placeholder="Your full name"
                onChange={(v) => patch({ display_name: v })}
              />
              <FormInput
                label="Role"
                value={profile?.role ?? ''}
                placeholder="e.g. Videographer, Designer"
                onChange={(v) => patch({ role: v })}
              />
              <FormInput
                label="Website"
                value={profile?.website ?? ''}
                placeholder="https://yoursite.com"
                onChange={(v) => patch({ website: v })}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <FormTextarea
                  label="Bio"
                  value={profile?.bio ?? ''}
                  placeholder="A short line about what you do"
                  onChange={(v) => patch({ bio: v })}
                />
              </div>
            </div>
          </div>

          {/* ── Analytics CTA ── */}
          <Link href="/analytics" className="ti-analytics ti-analytics-card" style={s.analyticsCard}>
            <div style={s.analyticsLeft}>
              <p style={s.eyebrow}>Analytics</p>
              <h3 style={s.analyticsTitle}>View full insights</h3>
              <p style={s.analyticsText}>
                Tap history, link click rates, profile traffic, and engagement — all in one view.
              </p>
            </div>
            <div style={s.analyticsArrowWrap}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>

        </div>
      </div>
    </main>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: colors.bg.page,
    color: colors.text.primary,
    fontFamily: font.sans,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  loadingPage: {
    minHeight: '100vh',
    background: colors.bg.page,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: radius.full,
    border: `1.5px solid ${colors.white[5]}`,
    borderTop: `1.5px solid ${colors.white[50]}`,
    animation: 'spin 0.75s linear infinite',
  },

  // ── Two-column grid — default desktop layout
  layout: {
    maxWidth: layout.maxWidth['3xl'],
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.75rem) clamp(1rem, 3vw, 2.25rem)',
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: spacing[7],
    alignItems: 'start',
  },

  // ── LEFT COLUMN
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    position: 'sticky',
    top: '2.75rem',
  },

  // Profile preview
  previewCard: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    boxShadow: shadows.panel,
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[4]} ${spacing[5]}`,
    borderBottom: borders.subtle,
  },

  livePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.accent.success,
    letterSpacing: font.tracking.wide,
  },

  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: colors.accent.success,
    boxShadow: `0 0 5px ${colors.accent.success}`,
  },

  previewBody: {
    padding: `${spacing[7]} ${spacing[5]} ${spacing[5]}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  previewAvatarWrap: {
    width: '72px',
    height: '72px',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    background: colors.white[5],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    flexShrink: 0,
  },

  previewAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  previewAvatarInitials: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white[50],
    letterSpacing: font.tracking.snug,
  },

  previewName: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.snug,
    color: colors.text.primary,
    marginBottom: spacing[1],
    lineHeight: font.leading.snug,
  },

  previewRole: {
    fontSize: font.size.sm,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: font.weight.regular,
    marginBottom: spacing['3.5'],
    letterSpacing: font.tracking.normal,
  },

  previewBio: {
    fontSize: font.size.sm,
    color: colors.text.ghost,
    lineHeight: font.leading.relaxed,
    marginBottom: spacing[4],
    maxWidth: '220px',
    fontWeight: font.weight.light,
  },

  previewLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    width: '100%',
  },

  previewLinkPill: {
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radius.md,
    background: colors.white[3],
    border: borders.subtle,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.white[50],
    textAlign: 'center',
    letterSpacing: font.tracking.normal,
  },

  previewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing['3.5']} ${spacing[5]}`,
    borderTop: borders.subtle,
    gap: spacing[3],
  },

  previewUrl: {
    fontSize: font.size['2xs'],
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },

  previewViewLink: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    textDecoration: 'none',
    letterSpacing: font.tracking.normal,
    flexShrink: 0,
    transition: transitions.base,
  },

  // NFC panel
  nfcPanel: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    boxShadow: shadows.panel,
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
  },

  nfcPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },

  nfcPanelTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    marginTop: spacing[1],
    letterSpacing: font.tracking.snug,
  },

  nfcCardVisual: {
    ...cards.nfc,
    marginBottom: spacing['3.5'],
  },

  nfcSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)',
    borderRadius: `${radius.xl} ${radius.xl} 0 0`,
    pointerEvents: 'none',
  },

  nfcCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },

  nfcBrand: {
    ...text.brandMark,
    fontSize: '0.6rem',
    letterSpacing: '0.24em',
    color: colors.white[50],
  },

  nfcCardId: {
    fontFamily: font.mono,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.white[70],
    letterSpacing: font.tracking.wider,
    position: 'relative',
    zIndex: 1,
  },

  nfcStatsRow: {
    display: 'flex',
    alignItems: 'stretch',
    background: colors.white[3],
    border: `1px solid ${colors.white[5]}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing['3.5'],
  },

  nfcStat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: `${spacing[3]} ${spacing[2]}`,
  },

  nfcStatValue: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    lineHeight: 1,
  },

  nfcStatLabel: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    color: colors.text.muted,
  },

  nfcStatDivider: {
    width: '1px',
    background: colors.border.subtle,
    flexShrink: 0,
    alignSelf: 'stretch',
    margin: `${spacing[2]} 0`,
  },

  nfcOpenBtn: {
    ...buttons.primary,
    width: '100%',
    borderRadius: radius.md,
    fontSize: font.size.sm,
    padding: `${spacing[3]} ${spacing[4]}`,
    gap: '7px',
    justifyContent: 'center',
  },

  nfcEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `${spacing[5]} ${spacing[3]}`,
    gap: spacing[2],
  },

  nfcEmptyIcon: {
    marginBottom: spacing[1],
    opacity: 0.6,
  },

  nfcEmptyTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: font.tracking.snug,
  },

  nfcEmptyText: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    fontWeight: font.weight.light,
    maxWidth: '220px',
  },

  brandMark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: `${spacing[3]} 0 ${spacing[1]}`,
  },

  brandMarkLogo: {
    ...text.brandMark,
    fontSize: '0.6rem',
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.15)',
  },

  brandMarkSlogan: {
    ...text.slogan,
    fontSize: font.size.xs,
  },

  // ── RIGHT COLUMN
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[4],
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
  },

  pageHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    flex: 1,
  },

  pageTitle: {
    fontSize: `clamp(${font.size['3xl']}, 4vw, ${font.size['4xl']})`,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: font.leading.tight,
    fontFamily: font.sans,
  },

  saveBtn: {
    ...buttons.primary,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: font.size.sm,
    borderRadius: radius.full,
  },

  statsBar: {
    ...cards.statsBar,
    borderRadius: radius.xl,
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.04s both',
  },

  statCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: `clamp(0.75rem, 2vw, 1.1rem) clamp(0.75rem, 2vw, 1.35rem)`,
  },

  statValue: {
    fontSize: `clamp(${font.size.base}, 2vw, ${font.size.lg})`,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: font.leading.snug,
  },

  statLabel: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: font.tracking.widest,
    color: 'rgba(255,255,255,0.28)',
  },

  editorCard: {
    ...cards.panel,
    borderRadius: radius['2xl'],
    padding: `clamp(1.25rem, 3vw, 1.75rem) clamp(1.25rem, 3vw, 2rem)`,
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.08s both',
  },

  editorHeader: {
    marginBottom: spacing[6],
    paddingBottom: spacing[5],
    borderBottom: borders.subtle,
  },

  sectionTitle: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.snug,
    color: colors.text.primary,
    marginTop: spacing[1],
    lineHeight: font.leading.snug,
  },

  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[5],
    padding: `${spacing[4]} ${spacing[5]}`,
    background: colors.white[3],
    border: borders.subtle,
    borderRadius: radius.lg,
    marginBottom: spacing[6],
    flexWrap: 'wrap',
  },

  avatarWrap: {
    width: '62px',
    height: '62px',
    borderRadius: radius.xl,
    overflow: 'hidden',
    background: colors.white[5],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarInitials: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: font.tracking.snug,
  },

  avatarMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '0',
  },

  avatarName: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  avatarSub: {
    fontSize: font.size.xs,
    color: colors.text.muted,
    fontWeight: font.weight.regular,
    marginBottom: spacing[2],
    letterSpacing: font.tracking.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  uploadBtn: {
    ...buttons.subtle,
    padding: `${spacing[2]} ${spacing['3.5']}`,
    fontSize: font.size.xs,
    alignSelf: 'flex-start',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${spacing[4]} ${spacing[5]}`,
  },

  analyticsCard: {
    ...cards.interactive,
    borderRadius: radius.xl,
    padding: `${spacing[5]} ${spacing[6]}`,
    boxShadow: shadows.panel,
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.12s both',
  },

  analyticsLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  },

  analyticsTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    marginTop: spacing[1],
  },

  analyticsText: {
    fontSize: font.size.sm,
    color: 'rgba(255,255,255,0.32)',
    fontWeight: font.weight.light,
    lineHeight: font.leading.normal,
    marginTop: spacing[1],
  },

  analyticsArrowWrap: {
    width: '32px',
    height: '32px',
    borderRadius: radius.full,
    background: colors.white[3],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  eyebrow: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.25)',
  },
}
