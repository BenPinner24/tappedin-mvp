import type { CSSProperties } from 'react'

// ─── Public types ───────────────────────────────────────────────────────────

export type SolidThemeId =
  | 'classic-black' | 'deep-graphite' | 'midnight-navy' | 'forest-noir'
  | 'burgundy-smoke' | 'carbon-steel' | 'obsidian' | 'titanium'

export type GradientThemeId =
  | 'gradient-obsidian-glass' | 'gradient-midnight-aurora'
  | 'gradient-emerald-noir' | 'gradient-burgundy-smoke'

export type ThemeId = SolidThemeId | GradientThemeId
export type ButtonStyleId = 'default' | 'outline' | 'sharp' | 'glass' | 'soft-glow' | 'minimal-line'
export type GlassLevel = 'none' | 'minimal' | 'frosted'

export type ThemeInput = {
  theme_style?: string | null
  accent_color?: string | null
  button_style?: string | null
  background_style?: string | null
}

export type ResolvedTheme = {
  pageBg: string
  pageBase: string
  cardBg: string
  cardBorder: string
  cardBackdrop: string | null
  accent: string | null
  glass: GlassLevel
  avatarGlow: string
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  badgeGlow: string
  linkHoverGlow: string
}

// ─── Colour helpers (no color-mix — iOS-safe) ─────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgba(hex: string, a: number): string {
  const c = hexToRgb(hex)
  if (!c) return `rgba(255,255,255,${a})`
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`
}
export function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
}

// ─── Theme registry ───────────────────────────────────────────────────────────

type ThemeDef = {
  label: string
  tier: 'solid' | 'gradient'
  swatch: string
  pageBase: string
  pageBg: string
  card: string
  border: string
}

const SOLID_THEMES: Record<SolidThemeId, ThemeDef> = {
  'classic-black': { label: 'Classic Black', tier: 'solid', swatch: '#0a0a0a', pageBase: '#030303', pageBg: '#030303', card: '#0a0a0a', border: 'rgba(255,255,255,0.07)' },
  'deep-graphite': { label: 'Deep Graphite', tier: 'solid', swatch: '#16191c', pageBase: '#0c0e10', pageBg: '#0c0e10', card: '#16191c', border: 'rgba(255,255,255,0.07)' },
  'midnight-navy': { label: 'Midnight Navy', tier: 'solid', swatch: '#0d1322', pageBase: '#070a14', pageBg: '#070a14', card: '#0d1322', border: 'rgba(130,160,255,0.10)' },
  'forest-noir':   { label: 'Forest Noir',   tier: 'solid', swatch: '#0b1411', pageBase: '#050b08', pageBg: '#050b08', card: '#0b1411', border: 'rgba(120,230,170,0.09)' },
  'burgundy-smoke':{ label: 'Burgundy Smoke',tier: 'solid', swatch: '#170a0e', pageBase: '#0c0507', pageBg: '#0c0507', card: '#170a0e', border: 'rgba(255,130,150,0.09)' },
  'carbon-steel':  { label: 'Carbon Steel',  tier: 'solid', swatch: '#141820', pageBase: '#0a0c0e', pageBg: '#0a0c0e', card: '#141820', border: 'rgba(160,180,210,0.10)' },
  'obsidian':      { label: 'Obsidian',      tier: 'solid', swatch: '#0b0b11', pageBase: '#040406', pageBg: '#040406', card: '#0b0b11', border: 'rgba(180,180,215,0.08)' },
  'titanium':      { label: 'Titanium',      tier: 'solid', swatch: '#181a1e', pageBase: '#0c0d0f', pageBg: '#0c0d0f', card: '#181a1e', border: 'rgba(205,210,222,0.12)' },
}

const GRADIENT_THEMES: Record<GradientThemeId, ThemeDef> = {
  'gradient-obsidian-glass': {
    label: 'Obsidian Glass', tier: 'gradient', card: '#0b0b11', border: 'rgba(255,255,255,0.08)',
    pageBase: '#050507',
    swatch: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.10), transparent 60%), #0a0a0f',
    pageBg: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg,#0a0a0f,#040406)',
  },
  'gradient-midnight-aurora': {
    label: 'Midnight Aurora', tier: 'gradient', card: '#0a0e1a', border: 'rgba(130,170,255,0.10)',
    pageBase: '#060912',
    swatch: 'radial-gradient(ellipse at 25% 0%, rgba(80,140,255,0.18), transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(80,255,200,0.12), transparent 55%), #04060c',
    pageBg: 'radial-gradient(ellipse 60% 40% at 25% 0%, rgba(80,140,255,0.07), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 10%, rgba(80,255,200,0.05), transparent 55%), linear-gradient(180deg,#080c18,#04060c)',
  },
  'gradient-emerald-noir': {
    label: 'Emerald Noir', tier: 'gradient', card: '#08130e', border: 'rgba(110,220,160,0.10)',
    pageBase: '#050b09',
    swatch: 'radial-gradient(ellipse at 50% 0%, rgba(60,210,150,0.18), transparent 58%), #040806',
    pageBg: 'radial-gradient(ellipse 65% 45% at 50% -5%, rgba(60,210,150,0.07), transparent 58%), linear-gradient(180deg,#08130e,#040806)',
  },
  'gradient-burgundy-smoke': {
    label: 'Burgundy Smoke', tier: 'gradient', card: '#160a0d', border: 'rgba(220,120,140,0.10)',
    pageBase: '#0a0407',
    swatch: 'radial-gradient(ellipse at 50% 0%, rgba(200,70,100,0.20), transparent 58%), #0a0405',
    pageBg: 'radial-gradient(ellipse 65% 45% at 50% -5%, rgba(200,70,100,0.08), transparent 58%), linear-gradient(180deg,#140a0d,#0a0405)',
  },
}

const ALL_THEMES: Record<string, ThemeDef> = { ...SOLID_THEMES, ...GRADIENT_THEMES }

// ─── Glass table ──────────────────────────────────────────────────────────────

const GLASS: Record<GlassLevel, { blur: number; alpha: number; sat: number }> = {
  none:    { blur: 0,  alpha: 1,    sat: 100 },
  minimal: { blur: 6,  alpha: 0.60, sat: 110 },
  frosted: { blur: 18, alpha: 0.44, sat: 130 },
}

// ─── background_style codec (glass level only) ────────────────────────────────

export function parseGlass(raw: string | null | undefined): GlassLevel {
  if (!raw) return 'none'
  if (raw === 'minimal' || raw === 'frosted') return raw
  // Gracefully map any earlier-tested values down to a supported level.
  if (raw === 'standard' || raw === 'liquid') return 'frosted'
  try {
    const o = JSON.parse(raw)
    const g = o?.glass
    if (g === 'minimal') return 'minimal'
    if (g === 'frosted' || g === 'standard' || g === 'liquid') return 'frosted'
  } catch { /* not JSON — fall through */ }
  return 'none'
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function normalizeThemeId(raw?: string | null): ThemeId {
  if (!raw) return 'classic-black'
  if (raw === 'dark') return 'classic-black'
  if (raw === 'darker') return 'deep-graphite'
  if (raw in ALL_THEMES) return raw as ThemeId
  return 'classic-black'
}

export function resolveTheme(input: ThemeInput): ResolvedTheme {
  const id = normalizeThemeId(input.theme_style)
  const glass = parseGlass(input.background_style)
  const accent = input.accent_color && isHexColor(input.accent_color) ? input.accent_color : null

  const t = ALL_THEMES[id] ?? SOLID_THEMES['classic-black']
  const pageBase = t.pageBase
  const pageBg = t.pageBg
  const cardHex = t.card
  const cardBorder = t.border

  const G = GLASS[glass]
  const cardRgb = hexToRgb(cardHex) ?? [10, 10, 10]
  const cardBg = glass === 'none'
    ? `rgb(${cardRgb.join(',')})`
    : `rgba(${cardRgb.join(',')},${G.alpha})`
  const cardBackdrop = glass === 'none' ? null : `blur(${G.blur}px) saturate(${G.sat}%)`

  // Glow is implicit: present only when the creator has chosen an accent.
  const glowOn = !!accent
  const avatarGlow = glowOn ? `0 0 0 1px ${rgba(accent!, 0.25)}, 0 0 22px ${rgba(accent!, 0.16)}` : ''
  const badgeGlow = glowOn ? `0 0 10px ${rgba(accent!, 0.34)}` : ''
  const linkHoverGlow = glowOn
    ? `0 0 0 1px ${rgba(accent!, 0.5)}, 0 8px 26px ${rgba(accent!, 0.2)}`
    : '0 6px 22px rgba(0,0,0,0.3)'

  // Active / verified badge: accent recolours it; null accent keeps the current green.
  const badgeColor = accent ?? '#4ade80'

  return {
    pageBg, pageBase, cardBg, cardBorder, cardBackdrop,
    accent, glass,
    avatarGlow,
    badgeColor,
    badgeBg: rgba(badgeColor, 0.09),
    badgeBorder: rgba(badgeColor, 0.22),
    badgeGlow,
    linkHoverGlow,
  }
}

// ─── Button styles (shared by public page + dashboard preview) ────────────────

export function getLinkButtonStyle(buttonStyle: string | null | undefined, theme: ResolvedTheme): CSSProperties {
  const accent = theme.accent
  switch (buttonStyle) {
    case 'outline':
      return { background: 'transparent', color: '#fff', border: `1px solid ${accent ? rgba(accent, 0.45) : 'rgba(255,255,255,0.22)'}`, borderRadius: '14px' }
    case 'sharp':
      return { background: 'rgba(255,255,255,0.96)', color: '#000', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '6px' }
    case 'glass': {
      const g = GLASS[theme.glass === 'none' ? 'minimal' : theme.glass]
      return {
        background: `rgba(255,255,255,${Math.min(0.14, 0.06 + (1 - g.alpha) * 0.12)})`,
        color: '#fff',
        border: `1px solid ${accent ? rgba(accent, 0.28) : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '14px',
        backdropFilter: `blur(${g.blur || 8}px) saturate(${g.sat}%)`,
        WebkitBackdropFilter: `blur(${g.blur || 8}px) saturate(${g.sat}%)`,
      }
    }
    case 'soft-glow':
      return {
        background: 'rgba(255,255,255,0.95)', color: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px',
        boxShadow: accent ? `0 0 0 1px ${rgba(accent, 0.3)}, 0 6px 26px ${rgba(accent, 0.28)}` : '0 6px 26px rgba(255,255,255,0.14)',
      }
    case 'minimal-line':
      return { background: 'transparent', color: '#fff', border: `1px solid ${accent ? rgba(accent, 0.3) : 'rgba(255,255,255,0.14)'}`, borderRadius: '10px' }
    default:
      return { background: 'rgba(255,255,255,0.95)', color: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px' }
  }
}

export function linkIconColor(buttonStyle: string | null | undefined): string {
  return (!buttonStyle || buttonStyle === 'default' || buttonStyle === 'sharp' || buttonStyle === 'soft-glow')
    ? 'rgba(0,0,0,0.45)'
    : 'rgba(255,255,255,0.55)'
}

// ─── Lists for the Brand Studio UI ────────────────────────────────────────────

export const SOLID_THEME_LIST = (Object.keys(SOLID_THEMES) as SolidThemeId[]).map((id) => ({ id, ...SOLID_THEMES[id] }))
export const GRADIENT_THEME_LIST = (Object.keys(GRADIENT_THEMES) as GradientThemeId[]).map((id) => ({ id, ...GRADIENT_THEMES[id] }))
export const BUTTON_STYLE_LIST: { id: ButtonStyleId; label: string }[] = [
  { id: 'default', label: 'Solid' }, { id: 'outline', label: 'Outline' }, { id: 'sharp', label: 'Sharp Edge' },
  { id: 'glass', label: 'Glass' }, { id: 'soft-glow', label: 'Soft Glow' }, { id: 'minimal-line', label: 'Minimal Line' },
]
export const GLASS_LEVELS: { id: GlassLevel; label: string }[] = [
  { id: 'none', label: 'None' }, { id: 'minimal', label: 'Minimal' }, { id: 'frosted', label: 'Frosted' },
]