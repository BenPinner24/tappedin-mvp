/**
 * TAPPED-IN Design System
 * "A new standard of Networking."
 *
 * Lightweight design tokens for use with inline React.CSSProperties.
 * No React, no Tailwind, no external dependencies.
 *
 * Usage:
 *   import { colors, typography, spacing, cards } from '@/lib/design'
 *   <div style={{ background: colors.bg.page, ...cards.panel }}>
 */

import type { CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Page backgrounds
  bg: {
    page:    '#030303',
    surface: '#0a0a0a',
    raised:  '#0f0f0f',
    overlay: '#141414',
  },

  // Text hierarchy
  text: {
    primary:   '#ffffff',
    secondary: 'rgba(255,255,255,0.58)',
    muted:     'rgba(255,255,255,0.35)',
    faint:     'rgba(255,255,255,0.2)',
    ghost:     'rgba(255,255,255,0.12)',
  },

  // Borders
  border: {
    subtle:   'rgba(255,255,255,0.055)',
    default:  'rgba(255,255,255,0.08)',
    strong:   'rgba(255,255,255,0.14)',
    focus:    'rgba(255,255,255,0.22)',
  },

  // Brand accents
  accent: {
    success:       '#4ade80',
    successBg:     'rgba(74,222,128,0.08)',
    successBorder: 'rgba(74,222,128,0.2)',
    error:         '#f87171',
    errorBg:       'rgba(248,113,113,0.08)',
    errorBorder:   'rgba(248,113,113,0.2)',
    warning:       '#fbbf24',
  },

  // White utility scale
  white: {
    full:  '#ffffff',
    90:    'rgba(255,255,255,0.9)',
    70:    'rgba(255,255,255,0.7)',
    50:    'rgba(255,255,255,0.5)',
    30:    'rgba(255,255,255,0.3)',
    10:    'rgba(255,255,255,0.1)',
    5:     'rgba(255,255,255,0.05)',
    3:     'rgba(255,255,255,0.03)',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const font = {
  // Font stacks
  sans:  `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif`,
  mono:  `'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace`,
  serif: `'Cormorant Garamond', 'Georgia', serif`,

  // Weights
  weight: {
    light:    300,
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  // Scale (rem)
  size: {
    '2xs': '0.58rem',
    xs:    '0.68rem',
    sm:    '0.78rem',
    base:  '0.88rem',
    md:    '0.95rem',
    lg:    '1.05rem',
    xl:    '1.2rem',
    '2xl': '1.5rem',
    '3xl': '1.9rem',
    '4xl': '2.4rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },

  // Line heights
  leading: {
    tight:   1.05,
    snug:    1.25,
    normal:  1.5,
    relaxed: 1.7,
    loose:   1.85,
  },

  // Letter spacing
  tracking: {
    tight:    '-0.05em',
    snug:     '-0.03em',
    normal:   '0em',
    wide:     '0.04em',
    wider:    '0.1em',
    widest:   '0.22em',
    brand:    '0.28em',   // TAPPED-IN monospace usage
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  '0':    '0',
  px:     '1px',
  '0.5':  '0.125rem',
  '1':    '0.25rem',
  '1.5':  '0.375rem',
  '2':    '0.5rem',
  '2.5':  '0.625rem',
  '3':    '0.75rem',
  '3.5':  '0.875rem',
  '4':    '1rem',
  '5':    '1.25rem',
  '6':    '1.5rem',
  '7':    '1.75rem',
  '8':    '2rem',
  '9':    '2.25rem',
  '10':   '2.5rem',
  '12':   '3rem',
  '14':   '3.5rem',
  '16':   '4rem',
  '20':   '5rem',
  '24':   '6rem',
  '32':   '8rem',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const radius = {
  none:   '0',
  sm:     '6px',
  md:     '10px',
  lg:     '14px',
  xl:     '18px',
  '2xl':  '20px',
  '3xl':  '24px',
  '4xl':  '28px',
  '5xl':  '34px',
  full:   '9999px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────

export const shadows = {
  none:    'none',
  sm:      '0 1px 8px rgba(0,0,0,0.3)',
  md:      '0 4px 20px rgba(0,0,0,0.4)',
  lg:      '0 12px 40px rgba(0,0,0,0.5)',
  xl:      '0 24px 64px rgba(0,0,0,0.6)',
  '2xl':   '0 40px 100px rgba(0,0,0,0.65)',
  panel:   '0 1px 0 rgba(255,255,255,0.045) inset',
  card:    '0 40px 100px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04) inset',
  btn:     '0 4px 20px rgba(0,0,0,0.3)',
  btnHover:'0 10px 32px rgba(255,255,255,0.14)',
  success: '0 0 20px rgba(74,222,128,0.08)',
  glow:    '0 0 40px rgba(255,255,255,0.06)',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const borders = {
  subtle:  `1px solid ${colors.border.subtle}`,
  default: `1px solid ${colors.border.default}`,
  strong:  `1px solid ${colors.border.strong}`,
  focus:   `1px solid ${colors.border.focus}`,
  success: `1px solid ${colors.accent.successBorder}`,
  error:   `1px solid ${colors.accent.errorBorder}`,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// GRADIENTS
// ─────────────────────────────────────────────────────────────────────────────

export const gradients = {
  // Panel surfaces — very subtle top-light to suggest depth
  panelSurface:    'linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
  panelSurfaceSoft:'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',

  // Card inner gloss
  cardGloss:       'linear-gradient(145deg, #161616 0%, #111 55%, #0d0d0d 100%)',

  // Avatar border gradient
  avatarBorder:    'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',

  // Success tint for icon containers
  successBorder:   'linear-gradient(145deg, rgba(74,222,128,0.22) 0%, rgba(74,222,128,0.04) 100%)',

  // Background radial glows (use as CSS background on position:fixed divs)
  bgGlow:          'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 65%)',
  bgGlowSuccess:   'radial-gradient(ellipse, rgba(74,222,128,0.04) 0%, transparent 65%)',

  // Grid texture overlay (combine with mask for vignette)
  bgGrid: `
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
  `,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const transitions = {
  fast:    '0.15s ease',
  base:    '0.2s ease',
  smooth:  '0.28s ease',
  spring:  '0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  spring2: '0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  spring3: '0.7s cubic-bezier(0.16, 1, 0.3, 1)',

  // Compound transition strings for common properties
  button:  'background 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s ease',
  border:  'border-color 0.2s ease',
  opacity: 'opacity 0.2s ease',
  all:     'all 0.2s ease',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export const layout = {
  // Max widths
  maxWidth: {
    xs:   '360px',
    sm:   '420px',
    md:   '560px',
    lg:   '780px',
    xl:   '1000px',
    '2xl':'1140px',
    '3xl':'1320px',
  },

  // Page padding (use clamp at page level)
  pagePadding:   'clamp(1.25rem, 4vw, 2.5rem)',
  sectionPadding:'clamp(5rem, 10vw, 8rem)',

  // Dashboard grid
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: '1.75rem',
    alignItems: 'start',
  } as CSSProperties,

  // Two-column equal
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  } as CSSProperties,

  // Centred shell (for auth / single-card pages)
  centredShell: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem 1.5rem',
  } as CSSProperties,

  // Card shell (narrow centred content)
  cardShell: {
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

export const buttons = {
  // Solid white — primary action
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0.85rem 1.5rem',
    borderRadius: radius.full,
    border: 'none',
    background: colors.white.full,
    color: '#000000',
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.bold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: shadows.btn,
    transition: transitions.button,
    whiteSpace: 'nowrap',
  } as CSSProperties,

  // Ghost — secondary action
  ghost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0.85rem 1.25rem',
    borderRadius: radius.full,
    border: borders.default,
    background: 'transparent',
    color: colors.text.secondary,
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.medium,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: transitions.button,
    whiteSpace: 'nowrap',
  } as CSSProperties,

  // Subtle — low-emphasis action
  subtle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '0.5rem 1rem',
    borderRadius: radius.full,
    border: `1px solid ${colors.border.subtle}`,
    background: colors.white['3'],
    color: colors.text.muted,
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: transitions.button,
  } as CSSProperties,

  // Danger — destructive actions
  danger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0.85rem 1.5rem',
    borderRadius: radius.full,
    border: borders.error,
    background: colors.accent.errorBg,
    color: colors.accent.error,
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: transitions.button,
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// CARDS / PANELS
// ─────────────────────────────────────────────────────────────────────────────

export const cards = {
  // Standard dashboard panel
  panel: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['3xl'],
    boxShadow: shadows.panel,
    padding: '1.75rem',
    overflow: 'hidden',
    position: 'relative',
  } as CSSProperties,

  // Lighter surface — nested inside panel
  inset: {
    background: colors.white['3'],
    border: borders.subtle,
    borderRadius: radius.xl,
    padding: '1rem 1.1rem',
  } as CSSProperties,

  // Heavy glass card (auth / profile pages)
  glass: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['4xl'],
    boxShadow: shadows.card,
    padding: '2.25rem 2rem',
    overflow: 'hidden',
  } as CSSProperties,

  // Clickable card / analytics CTA
  interactive: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    padding: '1.4rem 1.75rem',
    textDecoration: 'none',
    color: colors.text.primary,
    transition: `border-color ${transitions.smooth}, background ${transitions.smooth}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  } as CSSProperties,

  // NFC physical card representation
  nfc: {
    background: 'linear-gradient(150deg, #161616 0%, #111 55%, #0d0d0d 100%)',
    border: borders.default,
    borderRadius: radius.xl,
    padding: '1rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    position: 'relative',
  } as CSSProperties,

  // Stats bar (horizontal grid)
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius.xl,
    overflow: 'hidden',
    boxShadow: shadows.panel,
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────────────────────────────────────

export const inputs = {
  // Standard text input
  base: {
    width: '100%',
    padding: '0.8rem 0.95rem',
    borderRadius: radius.lg,
    border: borders.subtle,
    background: colors.white['3'],
    color: colors.text.primary,
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.regular,
    outline: 'none',
    transition: transitions.border,
    boxSizing: 'border-box',
    lineHeight: font.leading.snug,
  } as CSSProperties,

  // Textarea variant
  textarea: {
    width: '100%',
    minHeight: '96px',
    padding: '0.8rem 0.95rem',
    borderRadius: radius.lg,
    border: borders.subtle,
    background: colors.white['3'],
    color: colors.text.primary,
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.regular,
    outline: 'none',
    resize: 'vertical',
    transition: transitions.border,
    boxSizing: 'border-box',
    lineHeight: font.leading.relaxed,
  } as CSSProperties,

  // Field label
  label: {
    display: 'block',
    fontSize: font.size['2xs'],
    fontWeight: font.weight.semibold,
    color: colors.text.faint,
    letterSpacing: font.tracking.wider,
    textTransform: 'uppercase',
    marginBottom: spacing['2'],
  } as CSSProperties,

  // Input wrapper
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2'],
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const text = {
  // Shared display heading style
  displayLg: {
    fontFamily: font.sans,
    fontSize: font.size['5xl'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    lineHeight: font.leading.tight,
    color: colors.text.primary,
  } as CSSProperties,

  displayMd: {
    fontFamily: font.sans,
    fontSize: font.size['4xl'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.snug,
    lineHeight: font.leading.tight,
    color: colors.text.primary,
  } as CSSProperties,

  heading: {
    fontFamily: font.sans,
    fontSize: font.size['2xl'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.snug,
    lineHeight: font.leading.snug,
    color: colors.text.primary,
  } as CSSProperties,

  subheading: {
    fontFamily: font.sans,
    fontSize: font.size.xl,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.snug,
    lineHeight: font.leading.snug,
    color: colors.text.primary,
  } as CSSProperties,

  body: {
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.regular,
    lineHeight: font.leading.relaxed,
    color: colors.text.secondary,
  } as CSSProperties,

  bodyMuted: {
    fontFamily: font.sans,
    fontSize: font.size.base,
    fontWeight: font.weight.light,
    lineHeight: font.leading.relaxed,
    color: colors.text.muted,
  } as CSSProperties,

  // Uppercase label (section headers, stat labels)
  eyebrow: {
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.widest,
    textTransform: 'uppercase',
    color: colors.text.faint,
  } as CSSProperties,

  // Monospace brand mark — TAPPED-IN
  brandMark: {
    fontFamily: font.mono,
    fontSize: font.size['2xs'],
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.brand,
    color: colors.text.faint,
  } as CSSProperties,

  // Italic slogan — "A new standard of Networking."
  slogan: {
    fontFamily: font.sans,
    fontSize: font.size['2xs'],
    fontWeight: font.weight.light,
    letterSpacing: font.tracking.wide,
    fontStyle: 'italic',
    color: colors.text.ghost,
  } as CSSProperties,

  // Caption / hint
  caption: {
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.text.muted,
    lineHeight: font.leading.normal,
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE HELPERS
// Returns a full CSSProperties object for a status pill
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'claimed' | 'unclaimed' | 'suspended' | 'reserved' | 'replaced'

export function statusBadgeStyle(status: Status): CSSProperties {
  const map: Record<Status, { color: string; bg: string; border: string }> = {
    claimed:   { color: colors.accent.success,  bg: colors.accent.successBg,  border: colors.accent.successBorder },
    unclaimed: { color: colors.text.muted,       bg: colors.white['3'],         border: colors.border.subtle },
    suspended: { color: colors.accent.error,     bg: colors.accent.errorBg,    border: colors.accent.errorBorder },
    reserved:  { color: colors.accent.warning,   bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)' },
    replaced:  { color: colors.text.muted,       bg: colors.white['3'],         border: colors.border.subtle },
  }

  const { color, bg, border } = map[status]

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: radius.full,
    border: `1px solid ${border}`,
    background: bg,
    color,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.wide,
    textTransform: 'capitalize',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION KEYFRAME STRINGS
// Inject these via a <style> tag in your component.
// ─────────────────────────────────────────────────────────────────────────────

export const keyframes = {
  base: `
    @keyframes ti-fadeIn  { from { opacity: 0; }                              to { opacity: 1; } }
    @keyframes ti-riseUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ti-scaleIn { from { opacity: 0; transform: scale(0.94); }      to { opacity: 1; transform: scale(1); } }
    @keyframes ti-spin    { to   { transform: rotate(360deg); } }
    @keyframes ti-pulse   { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.75; } }
    @keyframes ti-blink   { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
  `,

  progress: `
    @keyframes ti-progressFill { from { width: 0%; } to { width: 100%; } }
    @keyframes ti-drawCheck { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
  `,

  ring: `
    @keyframes ti-ringExpand {
      0%   { transform: scale(0.75); opacity: 0; }
      35%  { opacity: 1; }
      100% { transform: scale(1.65); opacity: 0; }
    }
  `,

  shimmer: `
    @keyframes ti-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
  `,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Z-INDEX SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  1,
  dropdown:10,
  sticky:  20,
  overlay: 50,
  modal:   100,
  nav:     200,
  toast:   300,
} as const
