// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN — Tier engine
// The single source of truth for "what can this user access?"
// Pure logic, no UI. Read a user's tier from user_billing, then ask canAccess().
// This is the ONLY place tier/feature rules live — edit here, everywhere updates.
// ─────────────────────────────────────────────────────────────────────────────

// The tiers a user can be on.
//  - 'basic'   = new free users (total tap count only, no premium features)
//  - 'legacy'  = grandfathered existing users: keep analytics + styling, NO storage
//  - 'bronze'  = £3.99  individuals
//  - 'silver'  = £7.99  creators
//  - 'gold'    = £4.99/seat  teams
//  - 'founder' = LEGACY tier value only. Founder status now lives in the
//                separate is_founder flag (see below). Kept here so any stray
//                'founder' value resolves gracefully → treated as Bronze-level.
export type Tier = 'basic' | 'legacy' | 'bronze' | 'silver' | 'gold' | 'founder'

// The features we gate. Add new premium features here as they're built.
export type Feature =
  | 'basic_analytics'    // total tap count — the taste everyone gets
  | 'full_analytics'     // trends, link CTR, best days, etc.
  | 'connections_taste'  // can be saved / limited network
  | 'connections_full'   // full My Network
  | 'gallery'            // portfolio / featured work + storage
  | 'storage'            // 1GB media storage
  | 'styling'            // custom themes & styling
  | 'manager_dashboard'  // team manager view (Gold only)

// ── The ladder ───────────────────────────────────────────────────────────────
// Higher rank automatically includes everything lower ranks can do.
// NOTE: 'founder' is now Bronze-level (rank 2). Founder OWNERS get a free
// Bronze baseline via the is_founder flag; if they take a paid subscription
// their subscription_tier becomes bronze/silver/gold and the ladder applies.
const RANK: Record<Tier, number> = {
  basic:   1,
  legacy:  2, // grandfathered; real access set by LEGACY_ALLOW below, not the ladder
  bronze:  2,
  silver:  3,
  founder: 2, // legacy value → Bronze-level baseline
  gold:    4,
}

// ── Feature → minimum rank required ──────────────────────────────────────────
// Most features resolve purely by rank (the ladder). The one exception is the
// manager dashboard, which is Gold-only regardless — handled in canAccess below.
const FEATURE_MIN_RANK: Record<Feature, number> = {
  basic_analytics:   1, // everyone, incl. grandfathered basic
  connections_taste: 1, // everyone gets a taste
  full_analytics:    3, // Silver+
  connections_full:  3, // Silver+
  gallery:           3, // Silver+
  storage:           3, // Silver+
  styling:           3, // Silver+
  manager_dashboard: 4, // Gold only (special-cased below)
}

// Features that are exclusive to Gold — not just "rank 4 and above", but
// specifically the team/manager capability. Kept explicit so intent is clear.
const GOLD_ONLY: Feature[] = ['manager_dashboard']

// Grandfathered legacy users keep the CHEAP premium features they already had
// (analytics, styling, connections) but NOT storage/gallery — the real cost
// driver — which stays gated to Silver. Explicit allow-list, checked before the
// ladder, because 'legacy' is a custom mix that doesn't fit a simple rank.
const LEGACY_ALLOW: Feature[] = [
  'basic_analytics',
  'full_analytics',
  'styling',
  'connections_taste',
  'connections_full',
  // NOT gallery, NOT storage (locked → Silver), NOT manager_dashboard (Gold)
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
  // grandfathered labels resolve to the dedicated 'legacy' tier
  if (t === 'legacy_basic' || t === 'legacy') return 'legacy'
  if (t === 'basic') return 'basic'
  return 'basic'
}

// ── Founder helper ───────────────────────────────────────────────────────────
// A Founder OWNER (is_founder flag) always has at least a free Bronze baseline
// that never lapses. If they also hold an active paid tier (silver/gold), that
// higher tier applies. This returns the EFFECTIVE tier to use for access checks.
function effectiveTier(
  tier: Tier,
  status: string | null | undefined,
  isFounder: boolean,
): Tier {
  if (!isFounder) return tier

  // Founder with an active paid subscription → use whichever is higher.
  // (silver rank 3 / gold rank 4 both beat the legacy baseline at rank 2.)
  if (isActive(tier, status) && RANK[tier] > RANK['legacy']) {
    return tier
  }
  // Founder otherwise → free 'legacy' baseline: full perks EXCEPT gallery/storage
  // (covers no-sub, or a lapsed paid sub). 'legacy' is reused as the Founder
  // perk level because it already grants exactly that access set.
  return 'legacy'
}

// ── Is a subscription actually live? ─────────────────────────────────────────
// A cancelled/lapsed card is dormant regardless of tier. 'basic'/'legacy' and
// Founder owners are grandfathered and always considered active (no ongoing
// payment to lapse on their baseline).
export function isActive(tier: Tier, status: string | null | undefined): boolean {
  if (tier === 'basic' || tier === 'legacy' || tier === 'founder') return true
  const s = (status ?? '').toLowerCase()
  // Stripe active-ish statuses
  return s === 'active' || s === 'trialing' || s === 'past_due'
  // note: 'past_due' still active during the grace period; dormant only on
  // 'canceled'/'unpaid'/'incomplete_expired'. Tune in the reactivation stage.
}

// ── Is a card DORMANT? (the tap/profile decision) ────────────────────────────
// The safety-critical rule: a user with NO billing row is treated as ACTIVE
// (grandfathered) — this protects all existing cardholders who never subscribed.
// Only an explicit dead subscription status makes a card dormant.
// Founder owners (is_founder) are NEVER dormant — their free Bronze is for life.
export function isCardDormant(
  rawTier: string | null | undefined,
  status: string | null | undefined,
  hasBillingRow: boolean,
  isFounder: boolean = false,
): boolean {
  // Founder owners never lapse — free Bronze baseline for life.
  if (isFounder) return false

  // No billing row at all → grandfathered → NEVER dormant.
  if (!hasBillingRow) return false

  const tier = normaliseTier(rawTier)
  // Grandfathered basic/legacy + legacy founder value never lapse.
  if (tier === 'basic' || tier === 'legacy' || tier === 'founder') return false

  const s = (status ?? '').toLowerCase()
  // Dead statuses → dormant. Everything else (active/trialing/past_due) → live.
  const deadStatuses = ['canceled', 'cancelled', 'unpaid', 'incomplete_expired']
  return deadStatuses.includes(s)
}

// ── The core question: can this user use this feature? ───────────────────────
// isFounder defaults to false so every existing caller keeps working unchanged.
export function canAccess(
  rawTier: string | null | undefined,
  feature: Feature,
  status?: string | null,
  isFounder: boolean = false,
): boolean {
  const rawNormalised = normaliseTier(rawTier)
  const tier = effectiveTier(rawNormalised, status, isFounder)

  // A dormant (lapsed) card gets nothing premium — only the basic taste.
  // Founder owners are never dormant (effectiveTier already floored them to
  // Bronze), so this only affects genuine lapsed non-founder subscriptions.
  if (!isFounder && status !== undefined && !isActive(tier, status)) {
    return FEATURE_MIN_RANK[feature] === 1
  }

  // Gold-only features: must literally be Gold.
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
// Used by the blur/lock UI to say "unlock with Silver" etc.
export function requiredTierLabel(feature: Feature): string {
  if (GOLD_ONLY.includes(feature)) return 'Gold'
  const min = FEATURE_MIN_RANK[feature]
  if (min <= 1) return 'Bronze'
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
  bronze:  '£3.99/mo',
  silver:  '£7.99/mo',
  gold:    '£4.99/seat',
  founder: 'Free for life', // Founder baseline is free Bronze
}

// ── Helper: label for a Founder owner's plan ─────────────────────────────────
// Founders show "Founder" status regardless of whether they've upgraded.
// Use this where you want to surface Founder identity in the UI.
export function planLabel(
  rawTier: string | null | undefined,
  isFounder: boolean = false,
): string {
  if (isFounder) {
    const tier = normaliseTier(rawTier)
    // Upgraded Founder → show both their paid tier and Founder status.
    if (isActive(tier, 'active') && RANK[tier] > RANK['bronze'] && tier !== 'founder') {
      return `${TIER_LABEL[tier]} · Founder`
    }
    return 'Founder'
  }
  return TIER_LABEL[normaliseTier(rawTier)]
}