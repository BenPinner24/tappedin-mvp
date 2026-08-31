// ─────────────────────────────────────────────────────────────────────────────
// SHARED LINK PRESETS
//
// The single source of truth for the platform dropdown used when adding a link.
// These values are copied VERBATIM from src/app/dashboard/page.tsx so a company
// link and a personal profile link are byte-identical.
//
// The profile editor still holds its own copy today. To make this the true
// single source, delete PLATFORM_OPTIONS (and the four helpers below) from
// src/app/dashboard/page.tsx and import them from here instead — a separate,
// opt-in change, since this build was asked not to touch the profile editor.
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORM_OPTIONS = [
  { value: 'Instagram',    kind: 'url'      },
  { value: 'TikTok',       kind: 'url'      },
  { value: 'YouTube',      kind: 'url'      },
  { value: 'Spotify',      kind: 'url'      },
  { value: 'SoundCloud',   kind: 'url'      },
  { value: 'Apple Music',  kind: 'url'      },
  { value: 'Website',      kind: 'url'      },
  { value: 'Portfolio',    kind: 'url'      },
  { value: 'LinkedIn',     kind: 'url'      },
  { value: 'X / Twitter',  kind: 'url'      },
  { value: 'WhatsApp',     kind: 'whatsapp' },
  { value: 'Email',        kind: 'email'    },
  { value: 'Booking',      kind: 'url'      },
  { value: 'Reviews',      kind: 'url'      },
  { value: 'Custom', kind: 'custom' },
] as const

export type LinkKind = 'whatsapp' | 'email' | 'url'

export function detectLinkKind(label: string): LinkKind {
  const l = label.toLowerCase()
  if (l.includes('whatsapp') || l === 'wa' || l.startsWith('wa ')) return 'whatsapp'
  if (l.includes('email') || l.includes('enquir') || l.includes('mail') || l === 'contact' || l.includes('get in touch')) return 'email'
  return 'url'
}

export function urlPlaceholder(label: string): string {
  const kind = detectLinkKind(label)
  if (kind === 'whatsapp') return 'e.g. 07901109774 or +447901109774'
  if (kind === 'email')    return 'name@example.com'
  return 'https://'
}

export function urlInputMode(label: string): 'tel' | 'email' | 'url' | 'text' {
  const kind = detectLinkKind(label)
  if (kind === 'whatsapp') return 'tel'
  if (kind === 'email') return 'email'
  return 'url'
}

export function kindBadge(label: string): string {
  const kind = detectLinkKind(label)
  return kind === 'whatsapp' ? 'WA' : kind === 'email' ? 'Email' : 'URL'
}
