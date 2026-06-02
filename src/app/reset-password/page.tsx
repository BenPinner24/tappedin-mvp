// src/app/reset-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CSSProperties } from 'react'

const FONT = `'DM Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password,        setPassword]        = useState('')
  const [confirm,         setConfirm]         = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [done,            setDone]            = useState(false)

  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setDone(true)
      // Redirect back to login shortly after success.
      setTimeout(() => router.push('/login'), 2000)
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

            {done ? (
              <>
                <h1 style={s.title}>Password updated.</h1>
                <p style={s.body}>
                  Your password has been changed. Redirecting you to sign in…
                </p>
                <Link href="/login" style={s.switchLink}>
                  <span style={s.backRow}>Go to sign in</span>
                </Link>
              </>
            ) : (
              <>
                <h1 style={s.title}>Set a new password.</h1>
                <p style={s.body}>Choose a new password for your account.</p>

                {error && <div style={s.errorBox}>{error}</div>}

                <form onSubmit={handleUpdate} style={s.form}>
                  <div style={s.field}>
                    <label style={s.label}>New password</label>
                    <div style={s.passwordWrap}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        style={{ ...s.input, paddingRight: '4rem' }}
                        className="ti-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="ti-eye"
                        style={s.eyeBtn}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Confirm new password</label>
                    <div style={s.passwordWrap}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        style={{ ...s.input, paddingRight: '4rem' }}
                        className="ti-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="ti-eye"
                        style={s.eyeBtn}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ti-btn-primary"
                    style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? 'Updating…' : 'Update password'}
                  </button>
                </form>

                <div style={s.divider}/>
                <p style={s.switchText}>
                  <Link href="/login" style={s.switchLink}>Back to sign in</Link>
                </p>
              </>
            )}

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
  .ti-eye{transition:color .18s}
  .ti-eye:hover{color:rgba(255,255,255,0.75) !important}
`

const s: Record<string, CSSProperties> = {
  page:{minHeight:'100vh',background:'#030303',color:'#fff',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 1.25rem',position:'relative',WebkitFontSmoothing:'antialiased'},
  bgGrid:{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)`,backgroundSize:'60px 60px',WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 20%,black 20%,transparent 72%)',maskImage:'radial-gradient(ellipse 80% 80% at 50% 20%,black 20%,transparent 72%)',pointerEvents:'none',zIndex:0},
  bgGlow:{position:'fixed',top:'-140px',left:'50%',transform:'translateX(-50%)',width:'600px',height:'400px',background:'radial-gradient(ellipse,rgba(255,255,255,0.03) 0%,transparent 68%)',filter:'blur(8px)',pointerEvents:'none',zIndex:0},
  shell:{width:'100%',maxWidth:'400px',position:'relative',zIndex:1},
  card:{background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'24px',padding:'2.25rem 2rem',boxShadow:'0 40px 100px rgba(0,0,0,0.6),0 1px 0 rgba(255,255,255,0.04) inset'},
  brandRow:{marginBottom:'1.75rem',textAlign:'center' as const},
  brandMark:{fontFamily:'monospace',fontSize:'0.56rem',fontWeight:700,letterSpacing:'0.26em',color:'rgba(255,255,255,0.2)'},
  title:{fontSize:'1.65rem',fontWeight:700,letterSpacing:'-0.04em',color:'#fff',lineHeight:1.1,marginBottom:'0.6rem',textAlign:'center' as const},
  body:{fontSize:'0.82rem',fontWeight:300,color:'rgba(255,255,255,0.35)',lineHeight:1.65,marginBottom:'1.75rem',textAlign:'center' as const},
  errorBox:{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'0.75rem 1rem',marginBottom:'1.25rem',fontSize:'0.82rem',color:'rgba(239,68,68,0.9)',lineHeight:1.5},
  form:{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'},
  field:{display:'flex',flexDirection:'column',gap:'0.4rem'},
  label:{fontSize:'0.72rem',fontWeight:600,color:'rgba(255,255,255,0.45)',letterSpacing:'0.04em'},
  input:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'0.75rem 1rem',color:'#fff',fontFamily:FONT,fontSize:'0.88rem',fontWeight:400,width:'100%'},
  passwordWrap:{position:'relative',display:'flex',alignItems:'center'},
  eyeBtn:{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontFamily:FONT,fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.02em',cursor:'pointer',padding:'4px 6px'},
  primaryBtn:{width:'100%',padding:'0.88rem 1.5rem',borderRadius:'100px',border:'none',background:'#fff',color:'#000',fontFamily:FONT,fontSize:'0.88rem',fontWeight:700,letterSpacing:'0.01em',boxShadow:'0 4px 20px rgba(0,0,0,0.3)',marginTop:'0.25rem'},
  divider:{height:'1px',background:'rgba(255,255,255,0.06)',margin:'1.5rem 0'},
  switchText:{fontSize:'0.78rem',color:'rgba(255,255,255,0.3)',textAlign:'center' as const,marginBottom:'1.5rem'},
  switchLink:{color:'rgba(255,255,255,0.65)',textDecoration:'none',fontWeight:500},
  backRow:{display:'block',textAlign:'center' as const,fontSize:'0.82rem',marginBottom:'1.5rem'},
  footer:{fontSize:'0.58rem',color:'rgba(255,255,255,0.12)',letterSpacing:'0.04em',fontStyle:'italic' as const,textAlign:'center' as const,marginTop:'0.5rem'},
}