// src/app/a/[card_id]/page.tsx
//
// NFC tap entry point. The chip URL points here permanently.
// This page NEVER claims a card — it only reads state and routes.
//
// Flow:
//   card not found          → <UnavailableCard />
//   card suspended/replaced → <SuspendedCard />
//   card unclaimed          → records first_tap_at, redirect /claim/[card_id]
//   card claimed, no owner  → redirect /claim/[card_id]  (defensive)
//   card claimed + owner + username → log tap, show cinematic splash, meta-refresh /u/[username]
//   card claimed + owner, no username yet → <ProfileNotReady />
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { headers }      from 'next/headers'
import type { CSSProperties } from 'react'

type ActivateCardPageProps = { params: Promise<{ card_id: string }> }

type CardRecord = {
  card_id:       string
  owner_user_id: string | null
  status:        string | null
  nfc_url:       string | null
  first_tap_at:  string | null
}

type ProfileRecord = {
  id:           string
  username:     string | null
  display_name: string | null
  avatar_url:   string | null
  role:         string | null
}

export default async function ActivateCardPage({ params }: ActivateCardPageProps) {
const { card_id } = await params
const supabase = createAdminClient()

const cleanCardId = decodeURIComponent(card_id)
.trim()
.replace(/\/$/, '')

const { data: card, error: cardError } = await supabase
.from('cards')
.select('card_id, owner_user_id, status, nfc_url, first_tap_at')
.eq('card_id', cleanCardId)
.maybeSingle<CardRecord>()


if (cardError || !card) {
return <UnavailableCard />
}

if (card.status === 'suspended' || card.status === 'replaced') {
return <SuspendedCard />
}

if (
card.status === 'unclaimed' || card.status === 'reserved'
) {
if (!card.first_tap_at) {
await supabase
.from('cards')
.update({ first_tap_at: new Date().toISOString() })
.eq('card_id', card.card_id)
}

redirect(`/claim/${card.card_id}`)
}

if (!card.owner_user_id) return <CardNotActive />

const { data: profile } = await supabase
.from('profiles')
.select('id, username, display_name, avatar_url, role')
.eq('id', card.owner_user_id)
.maybeSingle<ProfileRecord>()

if (!profile?.username) return <ProfileNotReady />

await supabase.from('tap_events').insert({
profile_id: profile.id,
card_code: card.card_id,
event_type: 'card_tap',
tapped_at: new Date().toISOString(),
})

return (
<ActivationScreen
username={profile.username}
displayName={profile.display_name}
avatarUrl={profile.avatar_url}
role={profile.role}
/>
)
}

// ─── Activation Screen ────────────────────────────────────────────────────────
// Cinematic 2-second splash shown on every tap of a claimed card.
// meta httpEquiv="refresh" fires after 2s and navigates to /u/[username].

function ActivationScreen({ username, displayName, avatarUrl, role }: {
  username: string
  displayName: string | null
  avatarUrl:   string | null
  role:        string | null
}) {
  const name     = displayName || username
  const initials = getInitials(name)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#030303;min-height:100vh;-webkit-font-smoothing:antialiased}

        @keyframes fadeIn     { from{opacity:0}            to{opacity:1} }
        @keyframes riseUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes avatarShow { from{opacity:0;transform:scale(0.88)}      to{opacity:1;transform:scale(1)} }
        @keyframes pulseRing  { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.18);opacity:.06} }
        @keyframes fillBar    { from{width:0%} to{width:100%} }
        @keyframes blink      { 0%,100%{opacity:.25} 50%{opacity:1} }

        .ti-bg     { animation: fadeIn 0.6s ease both; }
        .ti-brand  { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.10s both; }
        .ti-avatar { animation: avatarShow 0.8s cubic-bezier(.16,1,.3,1) 0.20s both; }
        .ti-name   { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.38s both; }
        .ti-badge  { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.48s both; }
        .ti-status { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.56s both; }
        .ti-bar    { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.62s both; }
        .ti-footer { animation: riseUp 0.7s cubic-bezier(.16,1,.3,1) 0.72s both; }
        .ti-fill   { animation: fillBar 1.6s cubic-bezier(.4,0,.2,1) 0.85s both; }
        .ti-d1     { animation: blink 1.4s ease 0.90s infinite; }
        .ti-d2     { animation: blink 1.4s ease 1.10s infinite; }
        .ti-d3     { animation: blink 1.4s ease 1.30s infinite; }
        .ti-ring   { animation: pulseRing 3s ease-in-out 0.5s infinite; }
      `}</style>

      {/* Delayed redirect after cinematic animation */}
<meta httpEquiv="refresh" content={`1.6;url=/u/${username}`} />


      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid} />
        <div style={s.bgGlow} />
        <div style={s.shell}>

          {/* Brand mark */}
          <div className="ti-brand" style={s.brandRow}>
            <span style={s.brandMark}>TAPPED-IN</span>
          </div>

          {/* Avatar */}
          <div className="ti-avatar" style={s.avatarSection}>
            <div style={s.pulseWrap}>
              <div className="ti-ring" style={s.pulseRing} />
              <div style={s.avatarOuter}>
                <div style={s.avatarInner}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={name} style={s.avatarImg} />
                    : <span style={s.avatarInitials}>{initials}</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Name + role */}
          <div className="ti-name" style={s.nameRow}>
            <h1 style={s.name}>{name}</h1>
            {role && <p style={s.role}>{role}</p>}
          </div>

          {/* Verified badge */}
          <div className="ti-badge" style={s.verifiedRow}>
            <div style={s.verifiedBadge}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={s.verifiedText}>Identity verified</span>
            </div>
          </div>

          {/* Status + blinking dots */}
          <div className="ti-status" style={s.statusRow}>
            <span style={s.statusText}>Opening digital profile</span>
            <span style={s.statusDots}>
              <span className="ti-d1" style={s.dot} />
              <span className="ti-d2" style={s.dot} />
              <span className="ti-d3" style={s.dot} />
            </span>
          </div>

          {/* Progress bar */}
          <div className="ti-bar" style={s.barWrap}>
            <div style={s.barTrack}>
              <div className="ti-fill" style={s.barFill} />
            </div>
          </div>

          {/* Footer slogan */}
          <div className="ti-footer" style={s.footer}>
            <span style={s.footerSlogan}>A new standard of Networking.</span>
          </div>

        </div>
      </main>
    </>
  )
}

// ─── Profile Not Ready ────────────────────────────────────────────────────────

function ProfileNotReady() {
  return (
    <>
      <style>{STATIC_CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div className="ti-card" style={s.unavailCard}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
            <div style={s.unavailIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
                <path d="M12 8v4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="15.5" r="1" fill="rgba(255,255,255,0.35)"/>
              </svg>
            </div>
            <p style={s.unavailEyebrow}>NFC CARD</p>
            <h1 style={s.unavailTitle}>Profile coming soon.</h1>
            <p style={s.unavailDesc}>
              This card has been activated. The owner is setting up their digital profile — check back shortly.
            </p>
            <Link href="/" style={s.unavailCta}>
Learn about Tapped-In →
</Link>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── Card Not Active ──────────────────────────────────────────────────────────
// The card is real but has no owner attached yet — it exists, it just hasn't
// been set up. Same layout and styles as the other state screens.

function CardNotActive() {
  return (
    <>
      <style>{STATIC_CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div className="ti-card" style={s.unavailCard}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
            <div style={s.unavailIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                <path d="M12 16v-5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9.5 13.5L12 11l2.5 2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={s.unavailEyebrow}>NFC CARD</p>
            <h1 style={s.unavailTitle}>This card isn&apos;t active yet.</h1>
            <p style={s.unavailDesc}>
              This card is real, but it hasn&apos;t been set up yet. If it&apos;s yours, follow the setup guide to activate it.
            </p>
            <Link href="/setup" style={s.unavailCta}>
See the setup guide →
</Link>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── Unavailable Card ─────────────────────────────────────────────────────────

function UnavailableCard() {
  return (
    <>
      <style>{STATIC_CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div className="ti-card" style={s.unavailCard}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
            <div style={s.unavailIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
            <p style={s.unavailEyebrow}>NFC CARD</p>
            <h1 style={s.unavailTitle}>Card unavailable</h1>
            <p style={s.unavailDesc}>This card does not exist in our system. If you believe this is an error, please contact support.</p>
            <Link href="/" style={s.unavailCta}>
Learn about Tapped-In →
</Link>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── Suspended Card ───────────────────────────────────────────────────────────

function SuspendedCard() {
  return (
    <>
      <style>{STATIC_CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div className="ti-card" style={s.unavailCard}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
            <div style={s.unavailIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                <path d="M12 7v5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <p style={s.unavailEyebrow}>NFC CARD</p>
            <h1 style={s.unavailTitle}>Card unavailable</h1>
            <p style={s.unavailDesc}>This card is currently unavailable. Please contact <a href="mailto:support@tappedin.uk" style={{color:'rgba(255,255,255,0.5)'}}>support@tappedin.uk</a> for assistance.</p>
            <Link href="/" style={s.unavailCta}>
Learn about Tapped-In →
</Link>
            <p style={s.unavailDesc}>
This card is currently unavailable. Please contact{" "}
<a
href="mailto:support@tappedin.uk"
style={{ color: "#fff", textDecoration: "underline" }}
>
support@tappedin.uk
</a>
.
</p>
          </div>
        </div>
      </main>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── Shared CSS for static error/state screens ────────────────────────────────

const STATIC_CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{background:#030303;-webkit-font-smoothing:antialiased}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes riseUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ti-bg{animation:fadeIn .5s ease both}.ti-card{animation:riseUp .7s cubic-bezier(.16,1,.3,1) .1s both}`

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {
  // Page shell
  page: {
    minHeight:'100vh', background:'#030303', color:'#fff', fontFamily:FONT,
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'2rem 1.5rem', position:'relative', overflow:'hidden',
    WebkitFontSmoothing:'antialiased',
  },
  bgGrid: {
    position:'fixed', inset:0,
    backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,
    backgroundSize:'56px 56px',
    WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',
    maskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',
    pointerEvents:'none', zIndex:0,
  },
  bgGlow: {
    position:'fixed', top:'-100px', left:'50%', transform:'translateX(-50%)',
    width:'500px', height:'350px',
    background:'radial-gradient(ellipse,rgba(255,255,255,0.03) 0%,transparent 65%)',
    filter:'blur(12px)', pointerEvents:'none', zIndex:0,
  },
  shell: {
    width:'100%', maxWidth:'360px', display:'flex', flexDirection:'column',
    alignItems:'center', position:'relative', zIndex:1, gap:'0',
  },

  // Brand
  brandRow: { marginBottom:'2.5rem', textAlign:'center' as const },
  brandMark: { fontFamily:'monospace', fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.28em', color:'rgba(255,255,255,0.2)' },

  // Avatar
  avatarSection: { marginBottom:'1.75rem', display:'flex', alignItems:'center', justifyContent:'center' },
  pulseWrap: { position:'relative', width:'108px', height:'108px', display:'flex', alignItems:'center', justifyContent:'center' },
  pulseRing: { position:'absolute', inset:'-12px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.22)', pointerEvents:'none' },
  avatarOuter: { width:'100px', height:'100px', borderRadius:'28px', padding:'2px', background:'linear-gradient(145deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.04) 100%)' },
  avatarInner: { width:'100%', height:'100%', borderRadius:'26px', overflow:'hidden', background:'linear-gradient(145deg,#1c1c1c,#111)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' },
  avatarImg: { width:'100%', height:'100%', objectFit:'cover' as const },
  avatarInitials: { fontSize:'1.75rem', fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'-0.03em', fontFamily:FONT },

  // Identity
  nameRow: { textAlign:'center' as const, marginBottom:'1.25rem' },
  name: { fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.04em', color:'#fff', lineHeight:1.1, marginBottom:'0.35rem' },
  role: { fontSize:'0.82rem', fontWeight:400, color:'rgba(255,255,255,0.38)', letterSpacing:'0.01em' },

  // Verified badge
  verifiedRow: { marginBottom:'1.75rem', display:'flex', justifyContent:'center' },
  verifiedBadge: { display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'100px', background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.18)' },
  verifiedText: { fontSize:'0.72rem', fontWeight:500, color:'#4ade80', letterSpacing:'0.04em' },

  // Status row
  statusRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'1.25rem' },
  statusText: { fontSize:'0.75rem', fontWeight:400, color:'rgba(255,255,255,0.3)', letterSpacing:'0.03em' },
  statusDots: { display:'flex', alignItems:'center', gap:'3px' },
  dot: { width:'3px', height:'3px', borderRadius:'50%', background:'rgba(255,255,255,0.4)', display:'inline-block' },

  // Progress bar
  barWrap: { width:'100%', maxWidth:'240px', marginBottom:'3rem' },
  barTrack: { width:'100%', height:'1px', background:'rgba(255,255,255,0.07)', borderRadius:'1px', overflow:'hidden' },
  barFill: { height:'100%', background:'rgba(255,255,255,0.4)', borderRadius:'1px', width:'0%' },

  // Footer
  footer: { textAlign:'center' as const },
  footerSlogan: { fontSize:'0.62rem', fontWeight:300, color:'rgba(255,255,255,0.14)', letterSpacing:'0.04em', fontStyle:'italic' as const },

  // Error/unavailable screens
  unavailCard: { width:'100%', maxWidth:'380px', background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'28px', padding:'2.5rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' as const, gap:'0', boxShadow:'0 40px 100px rgba(0,0,0,0.6),0 1px 0 rgba(255,255,255,0.04) inset' },
  unavailIcon: { marginBottom:'1.25rem', marginTop:'0.5rem', opacity:0.7 },
  unavailEyebrow: { fontFamily:'monospace', fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.22em', color:'rgba(255,255,255,0.2)', marginBottom:'0.75rem' },
  unavailTitle: { fontSize:'1.6rem', fontWeight:700, letterSpacing:'-0.04em', color:'#fff', lineHeight:1.1, marginBottom:'0.85rem' },
  unavailDesc: { fontSize:'0.82rem', fontWeight:300, color:'rgba(255,255,255,0.35)', lineHeight:1.7, maxWidth:'280px', marginBottom:'1.75rem' },
  unavailCta: { display:'inline-flex', fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,0.5)', textDecoration:'none', letterSpacing:'0.01em', padding:'0.6rem 1.25rem', borderRadius:'100px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', marginBottom:'2rem', transition:'opacity 0.2s' },
  unavailFooter: { fontSize:'0.6rem', fontWeight:300, color:'rgba(255,255,255,0.12)', letterSpacing:'0.04em', fontStyle:'italic' as const },
}
