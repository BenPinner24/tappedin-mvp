// src/app/a/[card_id]/page.tsx
//
// NFC tap entry point.  The chip URL points here permanently.
// This page NEVER claims a card — it only reads state and routes.
//
// Flow:
//   card not found          → <UnavailableCard />
//   card suspended/replaced → <SuspendedCard />
//   card unclaimed          → records first_tap_at, redirect /claim/[card_id]
//   card claimed, no owner  → redirect /claim/[card_id]  (defensive)
//   card claimed + owner    → log tap event, show activation screen, meta-refresh /u/[username]

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
  const supabase    = await createClient()

  const { data: card } = await supabase
    .from('cards')
    .select('card_id, owner_user_id, status, nfc_url, first_tap_at')
    .eq('card_id', card_id)
    .maybeSingle<CardRecord>()

  if (!card) return <UnavailableCard />

  if (card.status === 'suspended' || card.status === 'replaced') {
    return <SuspendedCard />
  }

  // Unclaimed OR claimed-but-null-owner (the bug this file helps prevent)
  if (card.status !== 'claimed' || !card.owner_user_id) {
    if (!card.first_tap_at) {
      await supabase
        .from('cards')
        .update({ first_tap_at: new Date().toISOString() })
        .eq('card_id', card_id)
    }
    redirect(`/claim/${card_id}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role')
    .eq('id', card.owner_user_id)
    .maybeSingle<ProfileRecord>()

  // Profile exists but username not yet set — owner hasn't finished setup.
  // Do NOT redirect to /claim/ here: that page would show "Already claimed"
  // to a public visitor. Show a soft "profile coming soon" screen instead.
  if (!profile?.username) return <ProfileNotReady />

  // Log tap event then show the cinematic splash → auto-redirects to /u/[username]
  const hdrs      = await headers()
  const userAgent = hdrs.get('user-agent') || 'Unknown'

  await supabase.from('tap_events').insert({
    profile_id: profile!.id,
    card_code:  card.card_id,
    event_type: 'card_tap',
    user_agent: userAgent,
    tapped_at:  new Date().toISOString(),
  })

  // Redirect immediately to the public profile (fast path for repeat taps)
  redirect(`/u/${profile.username}`)
}

// ─── Profile Not Ready ────────────────────────────────────────────────────────
// Shown when the card is claimed but the owner hasn't set a username yet.
// A public visitor seeing this should never see "Already claimed" — this is
// the correct soft state: the card is live but the profile is being set up.

function ProfileNotReady() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{background:#030303}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes riseUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ti-bg{animation:fadeIn .5s ease both}.ti-card{animation:riseUp .7s cubic-bezier(.16,1,.3,1) .1s both}`}</style>
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
            <a href="/" style={s.unavailCta}>Learn about Tapped-In →</a>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

function UnavailableCard() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{background:#030303}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes riseUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ti-bg{animation:fadeIn .5s ease both}.ti-card{animation:riseUp .7s cubic-bezier(.16,1,.3,1) .1s both}`}</style>
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
            <a href="/" style={s.unavailCta}>Learn about Tapped-In →</a>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

function SuspendedCard() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{background:#030303}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes riseUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ti-bg{animation:fadeIn .5s ease both}.ti-card{animation:riseUp .7s cubic-bezier(.16,1,.3,1) .1s both}`}</style>
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
            <a href="/" style={s.unavailCta}>Learn about Tapped-In →</a>
            <p style={s.unavailFooter}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {
  page:{minHeight:'100vh',background:'#030303',color:'#fff',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 1.5rem',position:'relative',overflow:'hidden',WebkitFontSmoothing:'antialiased'},
  bgGrid:{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,backgroundSize:'56px 56px',WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',maskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 75%)',pointerEvents:'none',zIndex:0},
  bgGlow:{position:'fixed',top:'-100px',left:'50%',transform:'translateX(-50%)',width:'500px',height:'350px',background:'radial-gradient(ellipse,rgba(255,255,255,0.03) 0%,transparent 65%)',filter:'blur(12px)',pointerEvents:'none',zIndex:0},
  shell:{width:'100%',maxWidth:'360px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:1,gap:'0'},
  brandRow:{marginBottom:'2.5rem',textAlign:'center' as const},
  brandMark:{fontFamily:'monospace',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.28em',color:'rgba(255,255,255,0.2)'},
  unavailCard:{width:'100%',maxWidth:'380px',background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'28px',padding:'2.5rem 2rem',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center' as const,gap:'0',boxShadow:'0 40px 100px rgba(0,0,0,0.6),0 1px 0 rgba(255,255,255,0.04) inset'},
  unavailIcon:{marginBottom:'1.25rem',marginTop:'0.5rem',opacity:0.7},
  unavailEyebrow:{fontFamily:'monospace',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.22em',color:'rgba(255,255,255,0.2)',marginBottom:'0.75rem'},
  unavailTitle:{fontSize:'1.6rem',fontWeight:700,letterSpacing:'-0.04em',color:'#fff',lineHeight:1.1,marginBottom:'0.85rem'},
  unavailDesc:{fontSize:'0.82rem',fontWeight:300,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:'280px',marginBottom:'1.75rem'},
  unavailCta:{display:'inline-flex',fontSize:'0.78rem',fontWeight:600,color:'rgba(255,255,255,0.5)',textDecoration:'none',letterSpacing:'0.01em',padding:'0.6rem 1.25rem',borderRadius:'100px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',marginBottom:'2rem',transition:'opacity 0.2s'},
  unavailFooter:{fontSize:'0.6rem',fontWeight:300,color:'rgba(255,255,255,0.12)',letterSpacing:'0.04em',fontStyle:'italic' as const},
}
