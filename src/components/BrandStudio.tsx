'use client'

import { useMemo, useState, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  colors, font, radius, spacing, borders, transitions, inputs,
} from '@/lib/design'
import {
  resolveTheme, getLinkButtonStyle, linkIconColor,
  normalizeThemeId, parseBackgroundStyle, encodeBackgroundStyle, isHexColor,
  SOLID_THEME_LIST, GRADIENT_THEME_LIST, BUTTON_STYLE_LIST, GLASS_LEVELS,
  GRADIENT_ANGLES, CUSTOM_THEME_ID,
  type ThemeInput, type GlassLevel, type CustomBg,
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

if (!profile) return null

const { glass, custom: customBg } = parseBackgroundStyle(profile.background_style)

const selectedTheme =
normalizeThemeId(profile.theme_style)

// Preset vs Custom is derived from what's saved, so the tab reopens where the
// creator left it. The last preset is remembered only for switching back.
const mode: 'preset' | 'custom' = selectedTheme === CUSTOM_THEME_ID ? 'custom' : 'preset'
const [lastPreset, setLastPreset] = useState<string>(
  selectedTheme === CUSTOM_THEME_ID ? 'classic-black' : selectedTheme,
)
useEffect(() => {
  if (selectedTheme !== CUSTOM_THEME_ID) setLastPreset(selectedTheme)
}, [selectedTheme])

const accent =
profile.accent_color &&
isHexColor(profile.accent_color)
? profile.accent_color
: ""

const buttonStyle =
profile.button_style || "default"

const theme = resolveTheme(profile)


// background_style carries the glass level and, when custom, the colours too.
  function writeBg(level: GlassLevel, bg: CustomBg | null) {
    patch({ background_style: encodeBackgroundStyle(level, bg) })
  }
  function setGlass(level: GlassLevel) {
    writeBg(level, mode === 'custom' ? (customBg ?? DEFAULT_CUSTOM) : null)
  }
  function setMode(next: 'preset' | 'custom') {
    if (next === mode) return
    if (next === 'custom') {
      patch({ theme_style: CUSTOM_THEME_ID })
      writeBg(glass, customBg ?? DEFAULT_CUSTOM)
    } else {
      // Dropping the custom colours keeps background_style in its original
      // bare-level shape, exactly as presets have always stored it.
      patch({ theme_style: lastPreset })
      writeBg(glass, null)
    }
  }
  function setCustom(next: CustomBg) {
    writeBg(glass, next)
  }
  const activeCustom: CustomBg = customBg ?? DEFAULT_CUSTOM
  const gradientDraft = activeCustom.type === 'gradient'
    ? activeCustom
    : { type: 'gradient' as const, from: activeCustom.color, to: '#000000', angle: 180 }
  const solidDraft = activeCustom.type === 'solid'
    ? activeCustom
    : { type: 'solid' as const, color: activeCustom.from }

  const sampleLinks: PreviewLink[] = (previewLinks.length > 0 ? previewLinks : [
    { id: 's1', label: 'Instagram' }, { id: 's2', label: 'WhatsApp' }, { id: 's3', label: 'Portfolio' },
  ]).slice(0, 4)

  const btnPreview = getLinkButtonStyle(buttonStyle, theme)
  const iconCol = linkIconColor(buttonStyle)
  const baseRing = '0 0 0 1px rgba(255,255,255,0.06), 0 6px 22px rgba(0,0,0,0.5)'

  return (
    <div style={isMobile ? { ...st.root, padding: '1rem' } : st.root}>
      {/* The dashboard has no global reduced-motion rule, so this tab carries
          its own: every transition here is decorative and safe to drop. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: reduce) {
          .bs-anim, .bs-anim * { transition: none !important; animation: none !important; }
        }
      ` }} />
      <div style={isMobile ? { ...st.split, gridTemplateColumns: '1fr' } : st.split}>

        {/* ── Controls ── */}
        <div style={st.controls}>

          {/* ── 1. BACKGROUND — preset or custom, never both at once ── */}
          <Section label="Background" hint="Start from a preset, or build your own colours.">
            <div style={st.modeTabs}>
              {(['preset', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="bs-anim"
                  style={{
                    ...st.modeTab,
                    background: mode === m ? colors.white[10] : 'transparent',
                    color: mode === m ? colors.text.primary : colors.text.muted,
                    boxShadow: mode === m ? `inset 0 0 0 1px ${accent || colors.border.focus}` : 'none',
                  }}
                >
                  {m === 'preset' ? 'Presets' : 'Custom'}
                </button>
              ))}
            </div>

            {mode === 'preset' ? (
              <div style={st.stack}>
                <div>
                  <p style={st.subLabel}>Solid</p>
                  <div style={st.swatchGrid}>
                    {SOLID_THEME_LIST.map((t) => (
                      <SwatchChip key={t.id} fill={t.swatch} label={t.label} selected={selectedTheme === t.id} accent={accent} onClick={() => patch({ theme_style: t.id })} />
                    ))}
                  </div>
                </div>
                <div>
                  <p style={st.subLabel}>Cinematic gradients</p>
                  <div style={st.swatchGrid}>
                    {GRADIENT_THEME_LIST.map((t) => (
                      <SwatchChip key={t.id} fill={t.swatch} label={t.label} selected={selectedTheme === t.id} accent={accent} onClick={() => patch({ theme_style: t.id })} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={st.stack}>
                <Segmented
                  options={[{ id: 'solid', label: 'Solid' }, { id: 'gradient', label: 'Gradient' }]}
                  value={activeCustom.type}
                  accent={accent}
                  onChange={(v) => setCustom(v === 'solid' ? solidDraft : gradientDraft)}
                />

                {activeCustom.type === 'solid' ? (
                  <ColorField
                    label="Background colour"
                    value={activeCustom.color}
                    accent={accent}
                    onChange={(hex) => setCustom({ type: 'solid', color: hex })}
                  />
                ) : (
                  <>
                    <div style={st.pairGrid}>
                      <ColorField
                        label="From"
                        value={activeCustom.from}
                        accent={accent}
                        onChange={(hex) => setCustom({ ...activeCustom, from: hex })}
                      />
                      <ColorField
                        label="To"
                        value={activeCustom.to}
                        accent={accent}
                        onChange={(hex) => setCustom({ ...activeCustom, to: hex })}
                      />
                    </div>
                    <div>
                      <p style={st.subLabel}>Direction</p>
                      <div style={st.dirGrid}>
                        {GRADIENT_ANGLES.map((a) => {
                          const sel = activeCustom.angle === a.id
                          return (
                            <button
                              key={a.id}
                              onClick={() => setCustom({ ...activeCustom, angle: a.id })}
                              style={{
                                ...st.dirOpt,
                                borderColor: sel ? (accent || colors.border.focus) : colors.border.subtle,
                                background: sel ? colors.white[10] : colors.white[3],
                                color: sel ? colors.text.primary : colors.text.muted,
                              }}
                            >
                              {a.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p style={st.subLabel}>Gradient preview</p>
                      <div style={{
                        ...st.gradPreview,
                        background: `linear-gradient(${activeCustom.angle}deg, ${activeCustom.from}, ${activeCustom.to})`,
                      }} />
                    </div>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* ── 2. ACCENT ── */}
          <Section label="Accent colour" hint="Tints the active badge, avatar ring, link hover and focus.">
            <ColorField
              label=""
              value={accent || '#7c5cff'}
              accent={accent}
              placeholder="#7c5cff"
              onChange={(hex) => patch({ accent_color: hex })}
              onClear={accent ? () => patch({ accent_color: null }) : undefined}
            />
          </Section>

          {/* ── 3. SURFACE ── */}
          <Section label="Glass intensity" hint="Surface blur & translucency. Reads best on gradients.">
            <Segmented options={GLASS_LEVELS} value={glass} accent={accent} onChange={(v) => setGlass(v as GlassLevel)} />
          </Section>

          {/* ── 4. LINKS ── */}
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

/** A creator's first custom background, before they change anything. */
const DEFAULT_CUSTOM: CustomBg = { type: 'solid', color: '#101014' }

/**
 * Spectrum + hex in one control. The text field keeps its own draft so a
 * half-typed value ("#83") never reaches the profile; it commits only when the
 * hex is valid, and shows a red edge while it isn't.
 */
function ColorField({ label, value, accent, placeholder, onChange, onClear }: {
  label: string
  value: string
  accent: string
  placeholder?: string
  onChange: (hex: string) => void
  onClear?: () => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])
  const invalid = draft.trim() !== '' && !isHexColor(draft)

  return (
    <div>
      {label && <p style={st.subLabel}>{label}</p>}
      <div style={st.colorInner}>
        <input
          type="color"
          value={isHexColor(value) ? value : '#7c5cff'}
          onChange={(e) => { setDraft(e.target.value); onChange(e.target.value) }}
          style={st.colorSwatchInput}
          aria-label={label || 'Colour'}
        />
        <input
          type="text"
          value={draft}
          placeholder={placeholder || '#000000'}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="none"
          onChange={(e) => {
            const v = e.target.value.trim()
            setDraft(v)
            if (isHexColor(v)) onChange(v)
          }}
          style={{
            ...inputs.base,
            fontFamily: font.mono,
            fontSize: font.size.xs,
            minWidth: 0,
            borderColor: invalid ? 'rgba(248,113,113,0.55)' : undefined,
          }}
        />
        {onClear && <button onClick={onClear} style={st.colorClear} title="Reset">×</button>}
      </div>
      {invalid && <p style={st.hexError}>Use a hex like #83110 0 or #831100 — 3 or 6 characters.</p>}
    </div>
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

  stack: { display: 'flex', flexDirection: 'column', gap: spacing[4] },
  subLabel: {
    fontSize: font.size['2xs'], fontWeight: font.weight.semibold, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: colors.text.faint, marginBottom: spacing[2],
  },
  modeTabs: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
    background: colors.white[3], border: `1px solid ${colors.border.subtle}`,
    borderRadius: radius.full, padding: 3, marginBottom: spacing[4],
  },
  modeTab: {
    padding: '9px 10px', borderRadius: radius.full, border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: font.size.xs, fontWeight: font.weight.semibold,
    letterSpacing: '0.06em', transition: 'background .18s ease, color .18s ease',
  },
  pairGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing[3] },
  dirGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: spacing[2] },
  dirOpt: {
    padding: '10px 12px', borderRadius: radius.md, border: '1px solid',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.xs,
    fontWeight: font.weight.medium, textAlign: 'center', whiteSpace: 'nowrap',
  },
  gradPreview: {
    height: 56, borderRadius: radius.md,
    border: `1px solid ${colors.border.subtle}`,
  },
  hexError: { fontSize: font.size['2xs'], color: '#f87171', marginTop: spacing[2], lineHeight: 1.5 },
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