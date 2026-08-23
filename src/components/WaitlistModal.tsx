'use client'

import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN · WAITLIST MODAL
// Cloned from the EnquiryModal on /business — same dark premium look, Oswald
// type, overlay, close button, animations, field styling, success state and
// error handling. Simplified to three fields and pointed at /api/waitlist.
//
// Self-contained: every style it needs travels with it, under `wl-` class names
// and `wl-` keyframes so it can be dropped into any page without touching that
// page's own .btn-primary / .enq-input rules.
// ─────────────────────────────────────────────────────────────────────────────

const WL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');

  @keyframes wl-fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes wl-modalIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes wl-spin { to { transform: rotate(360deg); } }

  .wl-modal, .wl-modal *, .wl-modal *::before, .wl-modal *::after { box-sizing: border-box; }

  /* Form fields — same values as the enquiry modal's .enq-* rules */
  .wl-input, .wl-select {
    width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1);
    border-radius:3px; padding:12px 14px; color:#fff;
    font-family:'Oswald', Arial, sans-serif; font-size:.92rem; font-weight:300; letter-spacing:.01em;
    transition:border-color .2s, background .2s; outline:none;
  }
  .wl-input:focus, .wl-select:focus { border-color:rgba(232,201,160,0.5); background:rgba(255,255,255,0.045); }
  .wl-input::placeholder { color:rgba(255,255,255,0.3); }
  .wl-select option { background-color:#141414; color:#ffffff; }
  .wl-label { font-family:'Oswald', Arial, sans-serif; font-size:.66rem; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.4); margin-bottom:7px; display:block; }

  /* Primary button — same values as the site's .btn-primary */
  .wl-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:15px 34px; background:#fff; color:#000;
    font-family:'Oswald', Arial, sans-serif; font-size:.88rem; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none; white-space:nowrap; border-radius:3px;
    transition: background .18s, transform .18s cubic-bezier(0.16,1,0.3,1), box-shadow .18s;
  }
  .wl-btn:hover { background:#e6e6e6; transform:translateY(-2px); box-shadow:0 12px 40px rgba(255,255,255,0.18); }
  .wl-btn:active { transform:translateY(0); }
  .wl-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

  @media (prefers-reduced-motion: reduce) {
    .wl-modal, .wl-modal *, .wl-modal *::before, .wl-modal *::after { animation: none !important; }
  }
`

export default function WaitlistModal({ open, onClose, isMobile }: { open: boolean; onClose: () => void; isMobile: boolean }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [preference, setPreference] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStatus('idle'); setErrorMsg('')
    }
  }, [open])

  if (!open) return null

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please fill in your name and email.')
      setStatus('error')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.')
      setStatus('error')
      return
    }
    setStatus('sending'); setErrorMsg('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, preference }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('sent')
      } else {
        setErrorMsg(data.error || 'Could not send. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not send. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <>
      <style>{WL_CSS}</style>
      <div
        className="wl-modal"
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(3,3,3,0.82)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          padding: isMobile ? '1rem' : '2rem', overflowY:'auto',
          animation:'wl-fadeIn .25s ease both',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width:'100%', maxWidth:520, background:'linear-gradient(165deg, #0e0e0e 0%, #070707 100%)',
            border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
            padding: isMobile ? '1.75rem 1.35rem' : '2.5rem',
            position:'relative', boxShadow:'0 50px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
            animation:'wl-modalIn .35s cubic-bezier(0.16,1,0.3,1) both',
            margin:'auto',
          }}
        >
          {/* Close */}
          <button aria-label="Close" onClick={onClose}
            style={{ position:'absolute', top:16, right:16, width:36, height:36, cursor:'pointer', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ position:'relative', width:14, height:14, display:'inline-block' }}>
              <span style={{ position:'absolute', top:'50%', left:0, width:14, height:1.5, background:'#fff', transform:'rotate(45deg)' }} />
              <span style={{ position:'absolute', top:'50%', left:0, width:14, height:1.5, background:'#fff', transform:'rotate(-45deg)' }} />
            </span>
          </button>

          {status === 'sent' ? (
            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', border:'1px solid rgba(232,201,160,0.4)', background:'rgba(232,201,160,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E8C9A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.5rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', marginBottom:'.75rem' }}>You&apos;re on the list</h3>
              <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.95rem', fontWeight:300, color:'rgba(255,255,255,.42)', lineHeight:1.7, maxWidth:340, margin:'0 auto 1.75rem' }}>
                Thanks — we&apos;ve saved your place. We&apos;ll email you the moment cards are back in stock.
              </p>
              <button onClick={onClose} className="wl-btn">Done</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:'1.75rem' }}>
                <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:500, letterSpacing:'.28em', textTransform:'uppercase', color:'#E8C9A0', opacity:.8, marginBottom:'.6rem' }}>Waitlist</div>
                <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', lineHeight:1.1 }}>Join the waitlist</h3>
                <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.88rem', fontWeight:300, color:'rgba(255,255,255,.38)', lineHeight:1.6, marginTop:'.75rem' }}>
                  Enter your details and we&apos;ll let you know the moment cards are back in stock. All fields with * are required.
                </p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
                <div>
                  <label className="wl-label" htmlFor="wl-name">Your name *</label>
                  <input id="wl-name" className="wl-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className="wl-label" htmlFor="wl-email">Email *</label>
                  <input id="wl-email" className="wl-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="wl-label" htmlFor="wl-preference">I&apos;d like to:</label>
                  <select id="wl-preference" className="wl-select" value={preference} onChange={(e) => setPreference(e.target.value)}>
                    <option value="">Select an option…</option>
                    <option value="Be notified when back in stock">Be notified when back in stock</option>
                    <option value="Pre-order the next batch">Pre-order the next batch</option>
                  </select>
                </div>

                {status === 'error' && (
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400, color:'#f0a0a0', letterSpacing:'.02em', padding:'10px 14px', background:'rgba(240,120,120,0.06)', border:'1px solid rgba(240,120,120,0.2)', borderRadius:3 }}>
                    {errorMsg}
                  </div>
                )}

                <button onClick={submit} disabled={status === 'sending'} className="wl-btn" style={{ width:'100%', padding:'15px', marginTop:'.25rem' }}>
                  {status === 'sending' ? (
                    <>
                      <span style={{ width:15, height:15, border:'2px solid rgba(0,0,0,0.25)', borderTopColor:'#000', borderRadius:'50%', display:'inline-block', animation:'wl-spin .7s linear infinite' }} />
                      Joining…
                    </>
                  ) : 'Join the waitlist'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
