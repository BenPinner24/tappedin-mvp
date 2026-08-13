// src/app/claim/[card_id]/page.tsx
//
// Single source of truth for card ownership writes.
// Claims automatically on page load — no button required.
//
// Flow:
//   card not found            → <StateScreen not-found />
//   card suspended/replaced   → <StateScreen unavailable />
//   card unclaimed, no user   → <ClaimGate /> with card_id-bearing links
//   card unclaimed, user auth → write claim → redirect /dashboard
//   card claimed, same user   → redirect /dashboard
//   card claimed, other user  → <StateScreen claimed />

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect }     from 'next/navigation'
import type { CSSProperties } from 'react'

type ClaimPageProps = {
  params: Promise<{ card_id: string }>
}

type CardRecord = {
  card_id:       string
  owner_user_id: string | null
  status:        string | null
  nfc_url:       string | null
  first_tap_at:  string | null
}

export default async function ClaimCardPage({ params }: ClaimPageProps) {
  const { card_id } = await params
  const supabase    = await createClient()

  // ── Load session first ─────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ── Load card (case-insensitive match so BUSINESS-01 == business-01) ───────
  const { data: card } = await supabase
    .from('cards')
    .select('card_id, owner_user_id, status, nfc_url, first_tap_at')
    .ilike('card_id', card_id)
    .maybeSingle<CardRecord>()

  // ── Card not found ─────────────────────────────────────────────────────────
  if (!card) {
    return (
      <StateScreen
        icon="not-found"
        title="Card not found"
        body={`No card with ID "${card_id}" exists in our system. Contact support@tappedin.uk if you believe this is an error.`}
      />
    )
  }

  // ── Unavailable ────────────────────────────────────────────────────────────
  if (card.status === 'suspended' || card.status === 'replaced') {
    return (
      <StateScreen
        icon="not-found"
        title="Card unavailable"
        body="This card is not available for activation. Please contact support@tappedin.uk."
      />
    )
  }

  // ── Already claimed ────────────────────────────────────────────────────────
  if (card.status === 'claimed' && card.owner_user_id) {
    // Owner revisiting — just send to dashboard
    if (user && card.owner_user_id === user.id) {
      redirect('/dashboard')
    }
    // Someone else's card
    return (
      <StateScreen
        icon="claimed"
        title="Already claimed"
        body="This card is already connected to another account. Contact support@tappedin.uk if you believe this is an error."
        cta={{ label: 'Go to dashboard', href: '/dashboard' }}
      />
    )
  }

  // ── Unclaimed — user is authenticated → claim immediately ──────────────────
  if (user) {
    const now = new Date().toISOString()

    const { error: claimError } = await supabase
      .from('cards')
      .update({
        owner_user_id: user.id,
        status:        'claimed',
        activated_at:  now,
        // Only set first_tap_at if not already recorded
        ...(card.first_tap_at ? {} : { first_tap_at: now }),
      })
      .eq('card_id', card.card_id)   // use the DB's canonical casing
      .is('owner_user_id', null)     // race guard: only write if still unclaimed

    if (claimError) {
      console.error('[claim] update error:', claimError)
      return (
        <StateScreen
          icon="not-found"
          title="Activation failed"
          body={`Something went wrong: ${claimError.message}. Please try again or contact support.`}
          cta={{ label: 'Try again', href: `/claim/${card_id}` }}
        />
      )
    }

    // Verify the write landed (another concurrent session may have won the race)
    const { data: verify } = await supabase
      .from('cards')
      .select('owner_user_id, status')
      .eq('card_id', card.card_id)
      .maybeSingle<{ owner_user_id: string | null; status: string | null }>()

    if (verify?.owner_user_id !== user.id || verify?.status !== 'claimed') {
      return (
        <StateScreen
          icon="claimed"
          title="Already claimed"
          body="This card was just claimed by another account."
          cta={{ label: 'Go to dashboard', href: '/dashboard' }}
        />
      )
    }

    // ── FOUNDER EDITION: grant free Bronze-for-life status ────────────────────
    // If the claimed card is a Founder Edition card, mark the user as a Founder
    // and give them the free Bronze baseline. Uses the admin client so the
    // billing write is reliable regardless of row-level security. Only sets the
    // tier to bronze if they don't already have a paid tier (never downgrades).
    if (card.card_id.toLowerCase().startsWith('founders-edition-')) {
      try {
        const admin = createAdminClient()
        const { data: existing } = await admin
          .from('user_billing')
          .select('subscription_tier, subscription_status')
          .eq('user_id', user.id)
          .maybeSingle<{ subscription_tier: string | null; subscription_status: string | null }>()

        // Keep an existing paid tier (silver/gold active); otherwise the Founder
        // baseline of 'legacy' — full perks EXCEPT gallery/storage (which stay a
        // paid upgrade). We reuse the 'legacy' tier here because it already grants
        // exactly that access set; it's shared with grandfathered users.
        const paidTiers = ['silver', 'gold']
        const hasActivePaid =
          existing?.subscription_tier &&
          paidTiers.includes(existing.subscription_tier.toLowerCase()) &&
          existing.subscription_status === 'active'

        await admin
          .from('user_billing')
          .upsert({
            user_id: user.id,
            is_founder: true,
            ...(hasActivePaid ? {} : { subscription_tier: 'legacy' }),
          }, { onConflict: 'user_id' })
      } catch (founderErr) {
        // Never block the claim on a billing write — log and continue.
        console.error('[claim] founder billing write failed:', founderErr)
      }
    }

    // Card is now claimed — send to dashboard
    redirect('/dashboard')
  }

  // ── Unclaimed — user is NOT authenticated → show gate ─────────────────────
  return <ClaimGate cardId={card.card_id} />
}

// ─── Claim Gate ───────────────────────────────────────────────────────────────

function ClaimGate({ cardId }: { cardId: string }) {
  const signupHref = `/signup?card_id=${encodeURIComponent(cardId)}`
  const loginHref  = `/login?card_id=${encodeURIComponent(cardId)}`

  return (
    <>
      <style>{CSS}</style>
      <main className="ti-page" style={s.page}>
        <div style={s.bgGrid} />
        <div className="ti-glow" style={s.bgGlow} />
        <div style={s.shell}>
          <div className="ti-panel" style={s.panel}>

            <div className="ti-row-1" style={s.brandRow}>
              <span style={s.brandMark}>TAPPED-IN</span>
            </div>

            <div className="ti-row-1" style={s.iconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1"/>
                <path d="M8.5 12.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6 12.5c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="12" cy="12.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>

            <div className="ti-row-2" style={s.headingBlock}>
              <p style={s.eyebrow}>NFC Card Activation</p>
              <h1 style={s.title}>Claim your card</h1>
              <p style={s.body}>
                Create your account or sign in to connect this card to your Tapped-In profile.
              </p>
            </div>

            <div className="ti-row-3" style={s.cardIdRow}>
              <span style={s.cardIdLabel}>Card ID</span>
              <span style={s.cardIdValue}>{cardId}</span>
            </div>

            <div className="ti-row-3" style={s.divider} />

            <div className="ti-row-4" style={s.ctaGroup}>
              <a href={signupHref} className="ti-claim-btn" style={s.claimBtn}>
                Create account & activate
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href={loginHref} className="ti-login-link" style={s.signupLink}>
                Already have an account? Sign in →
              </a>
            </div>

            <div className="ti-row-5" style={s.footer}>
              <p style={s.footerSlogan}>A new standard of Networking.</p>
            </div>

          </div>
        </div>
      </main>
    </>
  )
}

// ─── State Screen ─────────────────────────────────────────────────────────────

function StateScreen({
  icon, title, body, cta,
}: {
  icon: 'not-found' | 'claimed'
  title: string
  body: string
  cta?: { label: string; href: string }
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030303; min-height: 100vh; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .ti-s-page  { animation: fadeIn 0.5s ease both; }
        .ti-s-panel { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.06s both; }
        .ti-s-cta   { transition: opacity 0.18s, transform 0.18s cubic-bezier(0.16,1,0.3,1); }
        .ti-s-cta:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
      <main className="ti-s-page" style={s.page}>
        <div style={s.bgGrid} />
        <div style={{ ...s.bgGlow, animationName: 'none' }} />
        <div style={s.shell}>
          <div className="ti-s-panel" style={s.panel}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
            <div style={{ ...s.iconWrap, marginBottom: '1.25rem' }}>
              {icon === 'not-found' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                  <path d="M12 8v4M12 16h.01" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(74,222,128,0.3)" strokeWidth="1.2"/>
                  <path d="M8 12l3 3 5-5" stroke="rgba(74,222,128,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <p style={s.eyebrow}>NFC Card</p>
            <h1 style={{ ...s.title, marginBottom: '0.75rem' }}>{title}</h1>
            <p style={{ ...s.body, marginBottom: cta ? '1.75rem' : '0' }}>{body}</p>
            {cta && (
              <a href={cta.href} className="ti-s-cta" style={{ ...s.claimBtn, display: 'flex', marginBottom: 0 }}>
                {cta.label}
              </a>
            )}
            <div style={s.footer}><p style={s.footerSlogan}>A new standard of Networking.</p></div>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #030303; min-height: 100vh; -webkit-font-smoothing: antialiased; }

  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes riseUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.6; } }

  .ti-page  { animation: fadeIn 0.5s ease both; }
  .ti-panel { animation: riseUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
  .ti-row-1 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
  .ti-row-2 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.26s both; }
  .ti-row-3 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
  .ti-row-4 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
  .ti-row-5 { animation: riseUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both; }

  .ti-claim-btn {
    transition: background 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s ease;
    cursor: pointer;
  }
  .ti-claim-btn:hover  { background: #e4e4e4 !important; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,255,255,0.14) !important; }
  .ti-claim-btn:active { transform: translateY(0); box-shadow: none !important; }

  .ti-login-link {
    transition: border-color 0.18s, color 0.18s, transform 0.18s cubic-bezier(0.16,1,0.3,1);
  }
  .ti-login-link:hover { border-color: rgba(255,255,255,0.22) !important; color: rgba(255,255,255,0.85) !important; transform: translateY(-1px); }

  .ti-glow { animation: shimmer 5s ease-in-out infinite; }
`

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: FONT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: '56px 56px',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 74%)',
    maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 10%, transparent 74%)',
    pointerEvents: 'none', zIndex: 0,
  },
  bgGlow: {
    position: 'fixed', top: '-80px', left: '50%', transform: 'translateX(-50%)',
    width: '480px', height: '320px',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 65%)',
    filter: 'blur(16px)', pointerEvents: 'none', zIndex: 0,
    animationName: 'shimmer', animationDuration: '5s',
    animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite',
  },
  shell: { width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 },
  panel: {
    width: '100%', background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: '28px',
    padding: '2.25rem 2rem 2rem',
    boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.045) inset',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', gap: '0',
  },
  brandRow: { marginBottom: '1.75rem' },
  brandMark: { fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.2)' },
  iconWrap: { marginBottom: '1.5rem', opacity: 0.9 },
  headingBlock: { marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  eyebrow: { fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' as const, marginBottom: '0.15rem' },
  title: { fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.045em', color: '#fff', lineHeight: 1.05, marginBottom: '0.5rem' },
  body: { fontSize: '0.84rem', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.72, maxWidth: '300px', margin: '0 auto' },
  cardIdRow: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.9rem 1.1rem', borderRadius: '14px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '1.25rem',
  },
  cardIdLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  cardIdValue: { fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em' },
  divider: { width: '100%', height: '1px', background: 'rgba(255,255,255,0.055)', marginBottom: '1.25rem' },
  ctaGroup: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', marginBottom: '0' },
  claimBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '0.9rem 1.25rem', borderRadius: '100px',
    border: 'none', background: '#fff', color: '#000', fontFamily: FONT,
    fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none',
    letterSpacing: '0.01em', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  signupLink: {
    display: 'block', textAlign: 'center' as const, fontSize: '0.78rem', fontWeight: 500,
    color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.01em',
    padding: '0.55rem 0', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)',
    transition: 'border-color 0.18s, color 0.18s',
  },
  footer: { marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', textAlign: 'center' as const },
  footerSlogan: { fontSize: '0.6rem', fontWeight: 300, color: 'rgba(255,255,255,0.14)', letterSpacing: '0.04em', fontStyle: 'italic' as const },
}
