'use client'

import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  colors, font, radius, spacing, borders, transitions, inputs,
} from '@/lib/design'
import {
  resolveTheme, getLinkButtonStyle, linkIconColor,
  normalizeThemeId, parseGlass, isHexColor,
  SOLID_THEME_LIST, GRADIENT_THEME_LIST, BUTTON_STYLE_LIST, GLASS_LEVELS,
  type ThemeInput, type GlassLevel,
} from '@/lib/theme'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type ProfileLike = ThemeInput & {
  display_name?: string | null
  role?: string | null
  username?: string | null
  avatar_url?: string | null
}

type PreviewLink = { id: string; label: string; url?: string; custom_label?: string | null }

export default function BrandStudio({
  profile,
  patch,
  onSave,
  saveState,
  isMobile,
  previewLinks = [],
}: {
  profile: ProfileLike | null
  patch: (fields: Partial<ProfileLike>) => void
  onSave: () => void
  saveState: SaveState
  isMobile: boolean
  previewLinks?: PreviewLink[]
}) {

  const glass = parseGlass(profile.background_style)
  const selectedTheme = normalizeThemeId(profile.theme_style)
  const accent = profile.accent_color && isHexColor(profile.accent_color) ? profile.accent_color : ''
  const buttonStyle = profile.button_style || 'default'

  const theme = useMemo(() => resolveTheme(profile), [profile])

if (!profile) return null

function setGlass(level: GlassLevel) {
    patch({ background_style: level === 'none' ? null : level })
  }

  const sampleLinks: PreviewLink[] = (previewLinks.length > 0 ? previewLinks : [
    { id: 's1', label: 'Instagram' }, { id: 's2', label: 'WhatsApp' }, { id: 's3', label: 'Portfolio' },
  ]).slice(0, 4)

  const btnPreview = getLinkButtonStyle(buttonStyle, theme)
  const iconCol = linkIconColor(buttonStyle)
  const baseRing = '0 0 0 1px rgba(255,255,255,0.06), 0 6px 22px rgba(0,0,0,0.5)'

  return (
    <div style={isMobile ? { ...st.root, padding: '1rem' } : st.root}>
      <div style={isMobile ? { ...st.split, gridTemplateColumns: '1fr' } : st.split}>

        {/* ── Controls ── */}
        <div style={st.controls}>

          <Section label="Background theme" hint="Premium solid presets.">
            <div style={st.swatchGrid}>
              {SOLID_THEME_LIST.map((t) => (
                <SwatchChip key={t.id} fill={t.swatch} label={t.label} selected={selectedTheme === t.id} accent={accent} onClick={() => patch({ theme_style: t.id })} />
              ))}
            </div>
          </Section>

          <Section label="Cinematic gradients" hint="Low-opacity, Apple / Linear style.">
            <div style={st.swatchGrid}>
              {GRADIENT_THEME_LIST.map((t) => (
                <SwatchChip key={t.id} fill={t.swatch} label={t.label} selected={selectedTheme === t.id} accent={accent} onClick={() => patch({ theme_style: t.id })} />
              ))}
            </div>
          </Section>

          <Section label="Accent colour" hint="Tints the active badge, avatar ring, link hover and focus.">
            <div style={st.colorInner}>
              <input
                type="color"
                value={isHexColor(accent) ? accent : '#7c5cff'}
                onChange={(e) => patch({ accent_color: e.target.value })}
                style={st.colorSwatchInput}
                aria-label="Accent colour"
              />
              <input
                type="text"
                value={accent}
                placeholder="#7c5cff"
                maxLength={7}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  patch({ accent_color: v === '' ? null : v })
                }}
                style={{ ...inputs.base, fontFamily: font.mono, fontSize: font.size.xs }}
              />
              {accent && <button onClick={() => patch({ accent_color: null })} style={st.colorClear} title="Reset accent">×</button>}
            </div>
          </Section>

          <Section label="Glass intensity" hint="Surface blur & translucency. Reads best on gradients.">
            <Segmented options={GLASS_LEVELS} value={glass} accent={accent} onChange={(v) => setGlass(v as GlassLevel)} />
          </Section>

          <Section label="Button style" hint="How your links appear to visitors." last>
            <div style={st.styleGrid}>
              {BUTTON_STYLE_LIST.map((b) => {
                const sel = buttonStyle === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => patch({ button_style: b.id })}
                    style={{
                      ...st.styleOpt,
                      borderColor: sel ? (accent || colors.border.focus) : colors.border.subtle,
                      background: sel ? colors.white[10] : colors.white[3],
                      color: sel ? colors.text.primary : colors.text.muted,
                      boxShadow: sel ? `0 0 0 1px ${accent || colors.border.focus}` : 'none',
                    }}
                  >
                    {sel && <span style={{ marginRight: 4, opacity: 0.7 }}>✓</span>}
                    {b.label}
                  </button>
                )
              })}
            </div>
          </Section>

          <div style={st.footer}>
            <button onClick={onSave} disabled={saveState === 'saving'} style={saveBtn(saveState)}>
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? 'Error — try again' : 'Save Brand Studio'}
            </button>
          </div>
        </div>

        {/* ── Live device preview ── */}
        <div style={isMobile ? { ...st.previewCol, position: 'static', marginTop: spacing[2] } : st.previewCol}>
          <p style={st.previewEyebrow}>Live preview</p>
          <div style={st.phone}>
            <div style={st.phoneNotch} />
            <div style={{ ...st.phoneScreen, background: theme.pageBg }}>
              <div style={st.statusBar}>
                <span>9:41</span>
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={st.statBar1} /><span style={st.statBar2} /><span style={st.statBatt} />
                </span>
              </div>

              <div style={{
                ...st.pCard,
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                ...(theme.cardBackdrop ? { backdropFilter: theme.cardBackdrop, WebkitBackdropFilter: theme.cardBackdrop } : {}),
              }}>
                <div style={st.pTop}>
                  <span style={st.pBrand}>TAPPED-IN</span>
                  <span style={{ ...st.pPill, background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}`, ...(theme.badgeGlow ? { boxShadow: theme.badgeGlow } : {}) }}>
                    <span style={{ ...st.pDot, background: theme.badgeColor }} />
                    <span style={{ color: theme.badgeColor, fontSize: '0.5rem', fontWeight: 600 }}>Active</span>
                  </span>
                </div>

                <div style={{ ...st.pRing, boxShadow: theme.avatarGlow ? `${baseRing}, ${theme.avatarGlow}` : baseRing }}>
                  <div style={st.pRingInner}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={st.pInitials}>{(profile.display_name || 'TI').slice(0, 2).toUpperCase()}</span>}
                  </div>
                </div>

                <p style={st.pName}>{profile.display_name || 'Your name'}</p>
                <p style={st.pRole}>{profile.role || 'Your role'}</p>

                <div style={st.pLinks}>
                  {sampleLinks.map((l) => (
                    <div key={l.id} style={{ ...st.pLink, ...btnPreview, boxShadow: (btnPreview.boxShadow as string) ?? '0 2px 10px rgba(0,0,0,0.28)' }}>
                      <span style={{ width: 12, color: iconCol }} />
                      <span style={st.pLinkLabel}>{l.custom_label || l.label}</span>
                      <span style={{ color: iconCol, fontSize: '0.6rem' }}>↗</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {profile.username && <p style={st.previewUrl}>tappedin.uk/u/{profile.username}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function Section({ label, hint, last, children }: { label: string; hint?: string; last?: boolean; children: ReactNode }) {
  return (
    <div style={{ marginBottom: last ? 0 : spacing[6] }}>
      <p style={st.secLabel}>{label}</p>
      {hint && <p style={st.secHint}>{hint}</p>}
      {children}
    </div>
  )
}

function SwatchChip({ fill, label, selected, accent, onClick }: { fill: string; label: string; selected: boolean; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} style={{
      ...st.chip,
      borderColor: selected ? (accent || colors.border.focus) : colors.border.subtle,
      boxShadow: selected ? `0 0 0 1px ${accent || colors.border.focus}` : 'none',
    }}>
      <span style={{ ...st.chipFill, background: fill }}>{selected && <span style={st.chipCheck}>✓</span>}</span>
      <span style={st.chipLabel}>{label}</span>
    </button>
  )
}

function Segmented({ options, value, accent, onChange }: { options: { id: string; label: string }[]; value: string; accent: string; onChange: (v: string) => void }) {
  return (
    <div style={st.seg}>
      {options.map((o) => {
        const sel = value === o.id
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            ...st.segBtn,
            background: sel ? colors.white[10] : 'transparent',
            color: sel ? colors.text.primary : colors.text.muted,
            boxShadow: sel ? `inset 0 0 0 1px ${accent || colors.border.focus}` : 'none',
          }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function saveBtn(state: SaveState): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: `${spacing[3]} ${spacing[6]}`, borderRadius: radius.full, border: 'none',
    fontFamily: font.sans, fontSize: font.size.sm, fontWeight: font.weight.bold, letterSpacing: '0.01em',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: transitions.button,
    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  }
  if (state === 'saved') return { ...base, background: colors.accent.success, color: '#000' }
  if (state === 'error') return { ...base, background: colors.accent.errorBg, color: colors.accent.error, border: borders.error }
  if (state === 'saving') return { ...base, background: 'rgba(255,255,255,0.85)', color: '#000', opacity: 0.7, cursor: 'not-allowed' }
  return { ...base, background: colors.white.full, color: '#000' }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st: Record<string, CSSProperties> = {
  root: { padding: `${spacing[5]} clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 1.75rem)`, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' },
  split: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: spacing[6], alignItems: 'start' },
  controls: { minWidth: 0 },
  secLabel: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary, marginBottom: spacing[1] },
  secHint: { fontSize: font.size.xs, color: colors.text.faint, marginBottom: spacing[3], lineHeight: font.leading.normal },

  swatchGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing[3] },
  chip: { display: 'flex', flexDirection: 'column', gap: spacing[2], padding: spacing[2], borderRadius: radius.lg, border: borders.subtle, background: colors.white[3], cursor: 'pointer', transition: transitions.base },
  chipFill: { position: 'relative', width: '100%', height: '46px', borderRadius: radius.md, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chipCheck: { color: '#fff', fontSize: '0.7rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
  chipLabel: { fontSize: font.size['2xs'], color: colors.text.muted, fontWeight: font.weight.medium, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  colorInner: { display: 'flex', alignItems: 'center', gap: spacing[2], position: 'relative', maxWidth: '320px' },
  colorSwatchInput: { width: '34px', height: '34px', padding: 0, border: borders.subtle, borderRadius: radius.md, background: 'transparent', cursor: 'pointer', flexShrink: 0 },
  colorClear: { position: 'absolute', right: spacing[2], background: 'transparent', border: 'none', color: colors.text.faint, fontSize: font.size.md, cursor: 'pointer', lineHeight: 1 },

  seg: { display: 'flex', gap: '4px', padding: '4px', borderRadius: radius.lg, border: borders.subtle, background: colors.white[3], flexWrap: 'wrap' },
  segBtn: { flex: '1 1 auto', minWidth: '72px', padding: `${spacing[2]} ${spacing[3]}`, borderRadius: radius.md, border: 'none', cursor: 'pointer', fontFamily: font.sans, fontSize: font.size.xs, fontWeight: font.weight.semibold, transition: transitions.base, letterSpacing: '0.01em' },

  styleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] },
  styleOpt: { padding: `${spacing[3]} ${spacing[3]}`, borderRadius: radius.lg, border: borders.subtle, background: colors.white[3], color: colors.text.muted, fontFamily: font.sans, fontSize: font.size.xs, fontWeight: font.weight.medium, cursor: 'pointer', transition: transitions.base, textAlign: 'center' },

  footer: { display: 'flex', justifyContent: 'flex-end', marginTop: spacing[6], paddingTop: spacing[5], borderTop: borders.subtle },

  previewCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[3], position: 'sticky', top: '1rem' },
  previewEyebrow: { fontSize: font.size['2xs'], letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.text.ghost, fontWeight: font.weight.semibold, alignSelf: 'flex-start' },
  phone: { position: 'relative', width: '280px', height: '580px', borderRadius: '44px', padding: '10px', background: 'linear-gradient(160deg,#1c1c1f,#0a0a0c)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset', flexShrink: 0 },
  phoneNotch: { position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', width: '92px', height: '24px', borderRadius: '14px', background: '#000', zIndex: 3 },
  phoneScreen: { position: 'relative', width: '100%', height: '100%', borderRadius: '34px', overflow: 'hidden', background: '#030303' },
  statusBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 22px 4px', fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: font.sans },
  statBar1: { width: 14, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.7)' },
  statBar2: { width: 12, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.5)' },
  statBatt: { width: 18, height: 9, borderRadius: 3, border: '1px solid rgba(255,255,255,0.6)' },

  pCard: { margin: '14px 14px 0', borderRadius: '20px', padding: '16px 14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  pTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '14px' },
  pBrand: { fontFamily: font.mono, fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.22)' },
  pPill: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 7px', borderRadius: '9999px' },
  pDot: { width: 4, height: 4, borderRadius: '50%' },
  pRing: { width: '60px', height: '60px', borderRadius: '17px', padding: '2px', background: 'linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))', marginBottom: '10px' },
  pRingInner: { width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', background: 'linear-gradient(148deg,#1a1a1a,#111)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pInitials: { fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' },
  pName: { fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' },
  pRole: { fontSize: '0.62rem', color: 'rgba(255,255,255,0.42)', marginBottom: '12px' },
  pLinks: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' },
  pLink: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', fontSize: '0.66rem', fontWeight: 600, minHeight: '34px' },
  pLinkLabel: { flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewUrl: { fontFamily: font.mono, fontSize: font.size['2xs'], color: colors.text.faint },
}