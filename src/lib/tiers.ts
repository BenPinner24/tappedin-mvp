// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN — Tier engine
// The single source of truth for "what can this user access?"
// Pure logic, no UI. Read a user's tier from user_billing, then ask canAccess().
// This is the ONLY place tier/feature rules live — edit here, everywhere updates.
//
// MODEL (one-time purchase + optional upgrade):
//   • £34.99 one-time buys the card + a FIRST MONTH of full access (everything
//     except the gallery). "First month" = within FIRST_MONTH_DAYS of the card's
//     activated_at date.
//   • After the first month, with no active paid subscription, the card falls to
//     the BRONZE FREE FLOOR (live card, profile, links, save contact, connect,
//     basic styling, basic analytics) — the card stays live, never dormant.
//   • SILVER (£7.99/mo) and GOLD (£4.99/mo, team managers) are OPTIONAL upgrades
//     bought later; they unlock the full toolkit.
//   • LEGACY + FOUNDER (existing customers) are untouched — they keep exactly what
//     they already have, for life. The first-month rule never applies to them.
// ─────────────────────────────────────────────────────────────────────────────

// How long the "first month" of full access lasts, in days.
// Change here only — every caller uses this via the engine.
export const FIRST_MONTH_DAYS = 30

// The tiers a user can be on.
//  - 'basic'   = new free users (total tap count only, no premium features)
//  - 'legacy'  = grandfathered existing users: keep analytics + styling, NO storage
//  - 'bronze'  = the FREE FLOOR after the first month (was £3.99; now free)
//  - 'silver'  = £7.99  creators (optional upgrade)
//  - 'gold'    = £4.99  team managers (optional upgrade)
//  - 'founder' = LEGACY tier value only. Founder status now lives in the
//                separate is_founder flag (see below). Kept here so any stray
//                'founder' value resolves gracefully → treated as legacy-level.
export type Tier = 'basic' | 'legacy' | 'bronze' | 'silver' | 'gold' | 'founder'

// The features we gate. Add new premium features here as they're built.
export type Feature =
  | 'basic_analytics'          // total tap count — the taste everyone gets
  | 'full_analytics'           // trends, link CTR, best days, etc.
  | 'connections_taste'        // can be saved / limited network
  | 'connections_full'         // full My Network
  | 'gallery'                  // portfolio / featured work + storage
  | 'storage'                  // 1GB media storage
  | 'styling_basic'            // preset themes / accent colour (free floor)
  | 'styling_full'             // advanced custom styling (Silver+)
  | 'qr_code'                  // downloadable QR / card feature (paid)
  | 'manager_dashboard_basic'  // roster + live status + one headline figure
  | 'manager_dashboard_full'   // per-member analytics, trends, leaderboard, etc.

// ── The ladder ───────────────────────────────────────────────────────────────
// Higher rank automatically includes everything lower ranks can do.
// Bronze (rank 2) is now the FREE FLOOR. Silver rank 3, Gold rank 4.
// 'legacy' and 'founder' resolve via their own rules below, not the ladder.
const RANK: Record<Tier, number> = {
  basic:   1,
  legacy:  2, // grandfathered; real access set by LEGACY_ALLOW below, not the ladder
  bronze:  2, // the free floor
  silver:  3,
  founder: 2, // legacy value → legacy-level baseline (handled in effectiveTier)
  gold:    4,
}

// ── Feature → minimum rank required ──────────────────────────────────────────
// Most features resolve purely by rank (the ladder). Manager-dashboard features
// are special-cased in canAccess (basic = any manager, full = Gold only).
const FEATURE_MIN_RANK: Record<Feature, number> = {
  basic_analytics:          1, // everyone, incl. grandfathered basic
  connections_taste:        1, // everyone gets a taste
  connections_full:         1, // Connect stays free for everyone (incl. Bronze floor)
  styling_basic:            2, // Bronze free floor and up (presets)
  full_analytics:           3, // Silver+
  gallery:                  3, // Silver+ (still "coming soon" in the UI)
  storage:                  3, // Silver+
  styling_full:             3, // Silver+ (advanced customisation)
  qr_code:                  3, // Silver+ (paid perk)
  manager_dashboard_basic:  4, // manager capability (special-cased below)
  manager_dashboard_full:   4, // Gold only (special-cased below)
}

// Features exclusive to the FULL team dashboard — Gold only.
const GOLD_ONLY: Feature[] = ['manager_dashboard_full']

// Grandfathered legacy users keep the premium features they already had
// (analytics, styling, connections) but NOT storage/gallery. Explicit allow-list,
// checked before the ladder. NOTE: legacy predates the styling split, so legacy
// gets BOTH styling_basic and styling_full (they always had full styling). Legacy
// never had the QR feature as a gated item, so it is NOT added — their access is
// unchanged from today.
const LEGACY_ALLOW: Feature[] = [
  'basic_analytics',
  'full_analytics',
  'styling_basic',
  'styling_full',
  'connections_taste',
  'connections_full',
  'qr_code',
  // NOT gallery, NOT storage (locked → Silver),
  // NOT manager_dashboard_* (Gold)
]

// Features granted during the FIRST MONTH of a new one-time purchase.
// This is "everything except the gallery/storage" — the full taste that makes
// the upgrade worth it. After the first month (no active sub) → Bronze free floor.
const FIRST_MONTH_ALLOW: Feature[] = [
  'basic_analytics',
  'full_analytics',
  'connections_taste',
  'connections_full',
  'styling_basic',
  'styling_full',
  'qr_code',
  // NOT gallery, NOT storage (always "coming soon" until storage is ready)
  // Team dashboard handled separately — a manager in month 1 gets the full one.
]

// ── Normalise whatever comes out of the DB into a valid Tier ─────────────────
// user_billing.subscription_tier may be null, 'legacy_basic', a live tier, etc.
// Anything unrecognised falls back to 'basic' (safe: least access).
export function normaliseTier(raw: string | null | undefined): Tier {
  if (!raw) return 'basic'
  const t = raw.toLowerCase()
  if (t === 'founder') return 'founder'
  if (t === 'gold') return 'gold'
  if (t === 'silver') return 'silver'
  if (t === 'bronze') return 'bronze'
  if (t === 'legacy_basic' || t === 'legacy') return 'legacy'
  if (t === 'basic') return 'basic'
  return 'basic'
}

// ── First-month helper ───────────────────────────────────────────────────────
// Pure + deterministic: pass activatedAt (and optionally "now" for tests).
// Returns true if the card is still within its first month of full access.
// A missing activatedAt → false (never grants full access on unknown data).
export function isWithinFirstMonth(
  activatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!activatedAt) return false
  const start = activatedAt instanceof Date ? activatedAt : new Date(activatedAt)
  if (isNaN(start.getTime())) return false
  const ms = now.getTime() - start.getTime()
  if (ms < 0) return false // activated in the future → treat as not-yet-in-window
  const days = ms / (1000 * 60 * 60 * 24)
  return days <= FIRST_MONTH_DAYS
}

// ── Founder helper ───────────────────────────────────────────────────────────
// A Founder OWNER (is_founder flag) always has at least the free 'legacy' baseline
// that never lapses. If they also hold an active paid tier (silver/gold), that
// higher tier applies. Returns the EFFECTIVE tier to use for access checks.
function effectiveTier(
  tier: Tier,
  status: string | null | undefined,
  isFounder: boolean,
): Tier {
  if (!isFounder) return tier

  // Founder with an active paid subscription → use whichever is higher.
  if (isActive(tier, status) && RANK[tier] > RANK['legacy']) {
    return tier
  }
  // Founder otherwise → free 'legacy' baseline (full perks except gallery/storage).
  return 'legacy'
}

// ── Is a subscription actually live? ─────────────────────────────────────────
export function isActive(tier: Tier, status: string | null | undefined): boolean {
  if (tier === 'basic' || tier === 'legacy' || tier === 'founder') return true
  const s = (status ?? '').toLowerCase()
  return s === 'active' || s === 'trialing' || s === 'past_due'
}

// ── Is a card DORMANT? (the tap/profile decision) ────────────────────────────
// Unchanged. A user with NO billing row is grandfathered → never dormant.
// Founder owners are never dormant. NOTE: under the new model a post-first-month
// non-subscriber is NOT dormant — they fall to the Bronze free floor and their
// card stays live. Dormancy remains only for explicitly dead subscription states.
export function isCardDormant(
  rawTier: string | null | undefined,
  status: string | null | undefined,
  hasBillingRow: boolean,
  isFounder: boolean = false,
): boolean {
  if (isFounder) return false
  if (!hasBillingRow) return false

  const tier = normaliseTier(rawTier)
  if (tier === 'basic' || tier === 'legacy' || tier === 'founder') return false

  const s = (status ?? '').toLowerCase()
  const deadStatuses = ['canceled', 'cancelled', 'unpaid', 'incomplete_expired']
  return deadStatuses.includes(s)
}

// ── The core question: can this user use this feature? ───────────────────────
// New optional params (all defaulted so existing callers keep working):
//   activatedAt  — the card's activation date, enables the first-month window
//   now          — reference "now" (defaults to real now; pass a fixed date in tests)
//   isManager    — true for a team manager's card (enables manager_dashboard_basic)
export function canAccess(
  rawTier: string | null | undefined,
  feature: Feature,
  status?: string | null,
  isFounder: boolean = false,
  activatedAt?: string | Date | null,
  now: Date = new Date(),
  isManager: boolean = false,
): boolean {
  const rawNormalised = normaliseTier(rawTier)
  const tier = effectiveTier(rawNormalised, status, isFounder)

  // ── FIRST-MONTH FULL ACCESS ────────────────────────────────────────────────
  // A new one-time buyer (not founder/legacy, no active paid sub) within their
  // first month gets the full toolkit. Checked BEFORE the dormant/ladder logic
  // so it can grant above the Bronze floor. Founders/legacy skip this (their own
  // rules already give them full perks); an active paid sub skips it too (their
  // tier already covers it).
  const hasActivePaid =
    (tier === 'silver' || tier === 'gold') && isActive(tier, status)
  if (
    !isFounder &&
    tier !== 'legacy' &&
    !hasActivePaid &&
    isWithinFirstMonth(activatedAt, now)
  ) {
    // Month-1 managers get the FULL team dashboard too.
    if (feature === 'manager_dashboard_full' || feature === 'manager_dashboard_basic') {
      return isManager
    }
    return FIRST_MONTH_ALLOW.includes(feature)
  }

  // A dormant (lapsed) card gets nothing premium — only the basic taste.
  if (!isFounder && status !== undefined && !isActive(tier, status)) {
    return FEATURE_MIN_RANK[feature] === 1
  }

  // ── Manager dashboard: basic vs full ───────────────────────────────────────
  // Basic team dashboard = any manager (free floor). Full = Gold only.
  if (feature === 'manager_dashboard_basic') {
    return isManager
  }
  if (feature === 'manager_dashboard_full') {
    return isManager && tier === 'gold'
  }

  // Other Gold-only features (none currently besides the full dashboard above).
  if (GOLD_ONLY.includes(feature)) {
    return tier === 'gold'
  }

  // Legacy (grandfathered): explicit allow-list, not the ladder.
  if (tier === 'legacy') {
    return LEGACY_ALLOW.includes(feature)
  }

  // Everything else: ladder comparison.
  return RANK[tier] >= FEATURE_MIN_RANK[feature]
}

// ── Helper: which tier does a user need for a locked feature? ────────────────
export function requiredTierLabel(feature: Feature): string {
  if (feature === 'manager_dashboard_full') return 'Gold'
  const min = FEATURE_MIN_RANK[feature]
  if (min <= 2) return 'Bronze'
  if (min <= 3) return 'Silver'
  return 'Gold'
}

// ── Display helpers ──────────────────────────────────────────────────────────
export const TIER_LABEL: Record<Tier, string> = {
  basic:   'Basic',
  legacy:  'Legacy',
  bronze:  'Bronze',
  silver:  'Silver',
  gold:    'Gold',
  founder: 'Founder',
}

export const TIER_PRICE: Record<Tier, string> = {
  basic:   'Free',
  legacy:  'Free',
  bronze:  'Free',            // Bronze is now the free floor
  silver:  '£7.99/mo',
  gold:    '£4.99/mo',
  founder: 'Free for life',
}

// ── Helper: label for a Founder owner's plan ─────────────────────────────────
export function planLabel(
  rawTier: string | null | undefined,
  isFounder: boolean = false,
): string {
  if (isFounder) {
    const tier = normaliseTier(rawTier)
    if (isActive(tier, 'active') && RANK[tier] > RANK['legacy'] && tier !== 'founder') {
      return `${TIER_LABEL[tier]} · Founder`
    }
    return 'Founder'
  }
  return TIER_LABEL[normaliseTier(rawTier)]
}
