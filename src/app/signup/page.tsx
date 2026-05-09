// src/app/claim/[card_id]/page.tsx
//
// This is the ONLY place that writes ownership to the cards table.
//
// Scenarios handled:
//   A. User is already authenticated → claim immediately → redirect /dashboard
//   B. User is not authenticated     → show sign-up / sign-in links with card_id in URL
//   C. Card already claimed by THIS user → redirect /dashboard
//   D. Card already claimed by different user → show "already claimed" error
//   E. Card does not exist → show error

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import type { CSSProperties } from 'react'

type ClaimPageProps = { params: Promise<{ card_id: string }> }

type CardRow = {
  card_id:       string
  status:        string | null
  owner_user_id: string | null
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { card_id } = await params
  const supabase    = await createClient()

  // ── Load card ──────────────────────────────────────────────────────────────
  const { data: card } = await supabase
    .from('cards')
    .select('card_id, status, owner_user_id')
    .eq('card_id', card_id)
    .maybeSingle<CardRow>()

  if (!card) return <ClaimError message="This card does not exist in our system." />

  if (card.status === 'suspended' || card.status === 'replaced') {
    return <ClaimError message="This card is not available for activation. Please contact support@tappedin.uk." />
  }

  // ── Load session ───────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ── Card already fully claimed ─────────────────────────────────────────────
  if (card.status === 'claimed' && card.owner_user_id) {
    if (user && card.owner_user_id === user.id) {
      // This user already owns it
      redirect('/dashboard')
    }
    if (user && card.owner_user_id !== user.id) {
      return <ClaimError message="This card has already been claimed by another account." />
    }
    // Not logged in + card claimed by someone else
    return <ClaimError message="This card has already been claimed." />
  }

  // ── User is authenticated → claim now ─────────────────────────────────────
  if (user) {
    const now = new Date().toISOString()

    // Re-fetch to guard against a concurrent claim between our first read and now
    const { data: freshCard } = await supabase
      .from('cards')
      .select('card_id, status, owner_user_id, first_tap_at')
      .eq('card_id', card_id)
      .maybeSingle<CardRow & { first_tap_at: string | null }>()

    // Race-condition guard: another session claimed it between our first read and now
    if (freshCard?.status === 'claimed' && freshCard.owner_user_id) {
      if (freshCard.owner_user_id === user.id) redirect('/dashboard')
      return <ClaimError message="This card was just claimed by another account." />
    }

    // Perform the claim — explicit, atomic update
    const { error: claimError } = await supabase
      .from('cards')
      .update({
        status:        'claimed',
        owner_user_id: user.id,          // ← the critical field
        activated_at:  now,
        // Only set first_tap_at if it isn't already set
        ...(freshCard?.first_tap_at ? {} : { first_tap_at: now }),
      })
      .eq('card_id', card_id)
      // Safety: only update if still unclaimed (prevents overwriting a concurrent claim)
      .or('owner_user_id.is.null,status.neq.claimed')

    if (claimError) {
      console.error('[claim] DB error:', claimError)
      return <ClaimError message="Something went wrong while activating your card. Please try again." />
    }

    // Verify the write actually applied (row-level guard might have blocked it)
    const { data: verifyCard } = await supabase
      .from('cards')
      .select('owner_user_id, status')
      .eq('card_id', card_id)
      .maybeSingle<{ owner_user_id: string | null; status: string | null }>()

    if (verifyCard?.owner_user_id !== user.id || verifyCard?.status !== 'claimed') {
      return <ClaimError message="This card was claimed by someone else. Please contact support." />
    }

    // Success — card is claimed, send user to their dashboard
    redirect('/dashboard')
  }

  // ── User is NOT authenticated → show gate ─────────────────────────────────
  return <ClaimGate cardId={card_id} />
}

// ─── Claim Gate (not logged in) ───────────────────────────────────────────────

function ClaimGate({ cardId }: { cardId: string }) {
  const signupHref = `/signup?card_id=${encodeURIComponent(cardId)}`
  const loginHref  = `/login?card_id=${encodeURIComponent(cardId)}`

  return (
    <>
      <style>{CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>

          <div className="ti-r1" style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>

          {/* NFC icon */}
          <div className="ti-r2" style={s.iconWrap}>
            <div style={s.iconOuter}>
              <div style={s.iconInner}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M5 12c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="1.75" fill="rgba(255,255,255,0.7)"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="ti-r3" style={s.eyebrowWrap}>
            <span style={s.eyebrow}>NFC · {cardId}</span>
          </div>

          <div className="ti-r4">
            <h1 style={s.title}>Activate your card.</h1>
          </div>

          <div className="ti-r5">
            <p style={s.body}>
              Create your account or sign in to claim this card and connect it to your digital profile.
            </p>
          </div>

          <div className="ti-r5" style={s.divider}/>

          <div className="ti-r6" style={s.ctaGroup}>
            <Link href={signupHref} className="ti-btn-primary" style={s.primaryBtn}>
              Create account & activate
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href={loginHref} className="ti-btn-secondary" style={s.secondaryBtn}>
              Already have an account? Sign in →
            </Link>
          </div>

          <div className="ti-r7" style={s.footer}>
            <p style={s.slogan}>A new standard of Networking.</p>
          </div>

        </div>
      </main>
    </>
  )
}

// ─── Claim Error ──────────────────────────────────────────────────────────────

function ClaimError({ message }: { message: string }) {
  return (
    <>
      <style>{CSS}</style>
      <main className="ti-bg" style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div className="ti-r1" style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
          <div className="ti-r2" style={s.iconWrap}>
            <div style={{...s.iconOuter, background:'linear-gradient(145deg,rgba(239,68,68,0.18) 0%,rgba(239,68,68,0.04) 100%)'}}>
              <div style={{...s.iconInner, border:'1px solid rgba(239,68,68,0.16)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(239,68,68,0.6)" strokeWidth="1.4"/>
                  <path d="M12 7v5" stroke="rgba(239,68,68,0.8)" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.1" fill="rgba(239,68,68,0.8)"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="ti-r3"><h1 style={{...s.title, fontSize:'1.65rem'}}>Unable to activate</h1></div>
          <div className="ti-r4"><p style={s.body}>{message}</p></div>
          <div className="ti-r5" style={s.ctaGroup}>
            <Link href="/" className="ti-btn-secondary" style={s.secondaryBtn}>Return to Tapped-In →</Link>
          </div>
          <div className="ti-r6" style={s.footer}><p style={s.slogan}>A new standard of Networking.</p></div>
        </div>
      </main>
    </>
  )
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#030303;min-height:100vh;-webkit-font-smoothing:antialiased}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes riseUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .ti-bg{animation:fadeIn .5s ease both}
  .ti-r1{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .08s both}
  .ti-r2{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .18s both}
  .ti-r3{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .28s both}
  .ti-r4{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .36s both}
  .ti-r5{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .44s both}
  .ti-r6{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .52s both}
  .ti-r7{animation:riseUp .6s cubic-bezier(.16,1,.3,1) .60s both}
  .ti-btn-primary{transition:background .18s,transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s}
  .ti-btn-primary:hover{background:#e4e4e4 !important;transform:translateY(-2px);box-shadow:0 10px 32px rgba(255,255,255,0.14) !important}
  .ti-btn-primary:active{transform:translateY(0)}
  .ti-btn-secondary{transition:opacity .18s}
  .ti-btn-secondary:hover{opacity:.6 !important}
`

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

const s: Record<string, CSSProperties> = {
  page:{minHeight:'100vh',background:'#030303',color:'#fff',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 1.5rem',position:'relative',overflow:'hidden'},
  bgGrid:{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,backgroundSize:'56px 56px',WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 74%)',maskImage:'radial-gradient(ellipse 70% 70% at 50% 40%,black 10%,transparent 74%)',pointerEvents:'none',zIndex:0},
  bgGlow:{position:'fixed',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'500px',height:'300px',background:'radial-gradient(ellipse,rgba(255,255,255,0.025) 0%,transparent 65%)',filter:'blur(24px)',pointerEvents:'none',zIndex:0},
  shell:{width:'100%',maxWidth:'360px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:1},
  brandRow:{marginBottom:'2.5rem'},
  brandMark:{fontFamily:'monospace',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.28em',color:'rgba(255,255,255,0.2)'},
  iconWrap:{marginBottom:'1.75rem'},
  iconOuter:{width:'64px',height:'64px',borderRadius:'20px',padding:'2px',background:'linear-gradient(145deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0.04) 100%)'},
  iconInner:{width:'100%',height:'100%',borderRadius:'18px',background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'},
  eyebrowWrap:{marginBottom:'0.65rem'},
  eyebrow:{fontFamily:'monospace',fontSize:'0.56rem',fontWeight:700,letterSpacing:'0.2em',color:'rgba(255,255,255,0.22)',textTransform:'uppercase' as const},
  title:{fontSize:'2rem',fontWeight:700,letterSpacing:'-0.045em',color:'#fff',lineHeight:1.05,marginBottom:'0.9rem'},
  body:{fontSize:'0.84rem',fontWeight:300,color:'rgba(255,255,255,0.38)',lineHeight:1.75,maxWidth:'290px',marginBottom:'2rem'},
  divider:{width:'100%',height:'1px',background:'rgba(255,255,255,0.055)',marginBottom:'1.75rem'},
  ctaGroup:{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.85rem',marginBottom:'2.5rem'},
  primaryBtn:{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'0.88rem 1.5rem',borderRadius:'100px',background:'#fff',color:'#000',fontFamily:FONT,fontSize:'0.88rem',fontWeight:700,textDecoration:'none',letterSpacing:'0.01em',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'},
  secondaryBtn:{fontSize:'0.78rem',fontWeight:500,color:'rgba(255,255,255,0.32)',textDecoration:'none',letterSpacing:'0.01em'},
  footer:{textAlign:'center' as const},
  slogan:{fontSize:'0.6rem',fontWeight:300,color:'rgba(255,255,255,0.14)',letterSpacing:'0.04em',fontStyle:'italic' as const},
}
