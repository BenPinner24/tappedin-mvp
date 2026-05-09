// src/app/signup/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CSSProperties } from 'react'

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

function SignupContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const cardId       = searchParams.get('card_id') ?? ''

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [sent,     setSent]     = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const redirectTo = cardId
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/claim/${cardId}`)}`
        : `${window.location.origin}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { display_name: name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Email confirmation OFF — session returned immediately.
      // router.refresh() flushes the server-side session cache so the claim
      // page's server component sees the authenticated user when it loads.
      if (data.session) {
        router.refresh()
        router.push(cardId ? `/claim/${cardId}` : '/dashboard')
        return
      }

      // Email confirmation ON — show "check your email" screen.
      setSent(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <style>{CSS}</style>
        <main style={s.page}>
          <div style={s.bgGrid}/><div style={s.bgGlow}/>
          <div style={s.shell}>
            <div style={s.card}>
              <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>
              <div style={s.iconWrap}>
                <div style={s.iconOuter}>
                  <div style={s.iconInner}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <h1 style={s.title}>Check your email.</h1>
              <p style={s.body}>
                We sent a confirmation link to <strong style={{color:'rgba(255,255,255,0.7)'}}>{email}</strong>.
                {cardId && <> Click it to confirm your account and activate your card.</>}
                {!cardId && <> Click it to confirm your account.</>}
              </p>
              {cardId && (
                <div style={s.cardHint}>
                  <span style={s.cardHintLabel}>Activating</span>
                  <span style={s.cardHintId}>{cardId}</span>
                </div>
              )}
              <p style={s.footer}>A new standard of Networking.</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <main style={s.page}>
        <div style={s.bgGrid}/><div style={s.bgGlow}/>
        <div style={s.shell}>
          <div style={s.card}>
            <div style={s.brandRow}><span style={s.brandMark}>TAPPED-IN</span></div>

            {cardId && (
              <div style={s.cardHint}>
                <span style={s.cardHintLabel}>Activating card</span>
                <span style={s.cardHintId}>{cardId}</span>
              </div>
            )}

            <h1 style={s.title}>{cardId ? 'Create your account.' : 'Join Tapped-In.'}</h1>
            <p style={s.body}>
              {cardId
                ? 'Create your account to claim this card and build your digital profile.'
                : 'Create your digital identity.'}
            </p>

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleSignup} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ben Pinner"
                  required
                  autoComplete="name"
                  style={s.input}
                  className="ti-input"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ben@example.com"
                  required
                  autoComplete="email"
                  style={s.input}
                  className="ti-input"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={s.input}
                  className="ti-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ti-btn-primary"
                style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Creating account…' : cardId ? 'Create account & activate' : 'Create account'}
              </button>
            </form>

            <div style={s.divider}/>
            <p style={s.switchText}>
              Already have an account?{' '}
              <Link
                href={cardId ? `/login?card_id=${encodeURIComponent(cardId)}` : '/login'}
                style={s.switchLink}
              >
                Sign in
              </Link>
            </p>

            <p style={s.footer}>A new standard of Networking.</p>
          </div>
        </div>
      </main>
    </>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#030303;min-height:100vh;-webkit-font-smoothing:antialiased}
  .ti-input{outline:none;transition:border-color .18s,box-shadow .18s}
  .ti-input:focus{border-color:rgba(255,255,255,0.3) !important;box-shadow:0 0 0 3px rgba(255,255,255,0.04) !important}
  .ti-btn-primary{transition:background .18s,transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s;cursor:pointer}
  .ti-btn-primary:hover:not(:disabled){background:#e4e4e4 !important;transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,255,255,0.12) !important}
  .ti-btn-primary:active{transform:translateY(0)}
`

const s: Record<string, CSSProperties> = {
  page:{minHeight:'100vh',background:'#030303',color:'#fff',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 1.25rem',position:'relative',WebkitFontSmoothing:'antialiased'},
  bgGrid:{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)`,backgroundSize:'60px 60px',WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 20%,black 20%,transparent 72%)',maskImage:'radial-gradient(ellipse 80% 80% at 50% 20%,black 20%,transparent 72%)',pointerEvents:'none',zIndex:0},
  bgGlow:{position:'fixed',top:'-140px',left:'50%',transform:'translateX(-50%)',width:'600px',height:'400px',background:'radial-gradient(ellipse,rgba(255,255,255,0.03) 0%,transparent 68%)',filter:'blur(8px)',pointerEvents:'none',zIndex:0},
  shell:{width:'100%',maxWidth:'400px',position:'relative',zIndex:1},
  card:{background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'24px',padding:'2.25rem 2rem',boxShadow:'0 40px 100px rgba(0,0,0,0.6),0 1px 0 rgba(255,255,255,0.04) inset'},
  brandRow:{marginBottom:'1.75rem',textAlign:'center' as const},
  brandMark:{fontFamily:'monospace',fontSize:'0.56rem',fontWeight:700,letterSpacing:'0.26em',color:'rgba(255,255,255,0.2)'},
  iconWrap:{display:'flex',justifyContent:'center',marginBottom:'1.5rem'},
  iconOuter:{width:'60px',height:'60px',borderRadius:'18px',padding:'2px',background:'linear-gradient(145deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0.04) 100%)'},
  iconInner:{width:'100%',height:'100%',borderRadius:'16px',background:'#111',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center'},
  cardHint:{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius:'100px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'1.25rem',alignSelf:'center' as const,width:'fit-content',margin:'0 auto 1.25rem'},
  cardHintLabel:{fontSize:'0.62rem',fontWeight:600,letterSpacing:'0.12em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,fontFamily:'monospace'},
  cardHintId:{fontSize:'0.72rem',fontWeight:600,color:'rgba(255,255,255,0.65)',fontFamily:'monospace',letterSpacing:'0.04em'},
  title:{fontSize:'1.65rem',fontWeight:700,letterSpacing:'-0.04em',color:'#fff',lineHeight:1.1,marginBottom:'0.6rem',textAlign:'center' as const},
  body:{fontSize:'0.82rem',fontWeight:300,color:'rgba(255,255,255,0.35)',lineHeight:1.65,marginBottom:'1.75rem',textAlign:'center' as const},
  errorBox:{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'0.75rem 1rem',marginBottom:'1.25rem',fontSize:'0.82rem',color:'rgba(239,68,68,0.9)',lineHeight:1.5},
  form:{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'},
  field:{display:'flex',flexDirection:'column',gap:'0.4rem'},
  label:{fontSize:'0.72rem',fontWeight:600,color:'rgba(255,255,255,0.45)',letterSpacing:'0.04em'},
  input:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'0.75rem 1rem',color:'#fff',fontFamily:FONT,fontSize:'0.88rem',fontWeight:400,width:'100%'},
  primaryBtn:{width:'100%',padding:'0.88rem 1.5rem',borderRadius:'100px',border:'none',background:'#fff',color:'#000',fontFamily:FONT,fontSize:'0.88rem',fontWeight:700,letterSpacing:'0.01em',boxShadow:'0 4px 20px rgba(0,0,0,0.3)',marginTop:'0.25rem'},
  divider:{height:'1px',background:'rgba(255,255,255,0.06)',margin:'1.5rem 0'},
  switchText:{fontSize:'0.78rem',color:'rgba(255,255,255,0.3)',textAlign:'center' as const,marginBottom:'1.5rem'},
  switchLink:{color:'rgba(255,255,255,0.65)',textDecoration:'none',fontWeight:500},
  footer:{fontSize:'0.58rem',color:'rgba(255,255,255,0.12)',letterSpacing:'0.04em',fontStyle:'italic' as const,textAlign:'center' as const,marginTop:'0.5rem'},
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  )
}
