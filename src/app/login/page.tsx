// src/app/login/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CSSProperties } from 'react'

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

function LoginContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const cardId       = searchParams.get('card_id') ?? ''

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // router.refresh() flushes the server-side session cache so the claim
      // page's server component sees the authenticated user when it loads.
      router.refresh()
      router.push(cardId ? `/claim/${cardId}` : '/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
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

            <h1 style={s.title}>{cardId ? 'Sign in to activate.' : 'Welcome back.'}</h1>
            <p style={s.body}>
              {cardId
                ? 'Sign in to your account to claim this card.'
                : 'Sign in to your Tapped-In account.'}
            </p>

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleLogin} style={s.form}>
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
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
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
                {loading ? 'Signing in…' : cardId ? 'Sign in & activate' : 'Sign in'}
              </button>
            </form>

            <div style={s.divider}/>
            <p style={s.switchText}>
              Don&apos;t have an account?{' '}
              <Link
                href={cardId ? `/signup?card_id=${encodeURIComponent(cardId)}` : '/signup'}
                style={s.switchLink}
              >
                Create account
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
  cardHint:{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius:'100px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'1.25rem',width:'fit-content',margin:'0 auto 1.25rem'},
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
