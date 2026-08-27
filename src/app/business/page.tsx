'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN · FOR TEAMS  (/business)
// Built in the native site design language: Oswald, uppercase, letter-spaced,
// dark #030303/#050505 surfaces, .btn-primary / .btn-ghost, EB/H2/SUB tokens.
// Marketing page for company / bulk buyers — enquiry-led.
// CTAs open a company enquiry FORM (modal) → POST /api/company-enquiry → Resend.
// ─────────────────────────────────────────────────────────────────────────────

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; background: #050505; }
  body { background: #050505; color: #fff; font-family: 'Oswald', Arial, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(255,255,255,0.1); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes navDrop { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dotBlink { 0%,100% { opacity:.2; } 50% { opacity:1; } }
  @keyframes glowPulse { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.72; transform:scale(1.05); } }
  @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .reveal { opacity:0; transform:translateY(26px); transition: opacity .85s cubic-bezier(0.16,1,0.3,1), transform .85s cubic-bezier(0.16,1,0.3,1); }
  .reveal.in { opacity:1; transform:translateY(0); }
  .d1{transition-delay:.06s} .d2{transition-delay:.12s} .d3{transition-delay:.18s} .d4{transition-delay:.24s} .d5{transition-delay:.30s}

  .btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:15px 34px; background:#fff; color:#000;
    font-family:'Oswald', Arial, sans-serif; font-size:.88rem; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none; white-space:nowrap; border-radius:3px;
    transition: background .18s, transform .18s cubic-bezier(0.16,1,0.3,1), box-shadow .18s;
  }
  .btn-primary:hover { background:#e6e6e6; transform:translateY(-2px); box-shadow:0 12px 40px rgba(255,255,255,0.18); }
  .btn-primary:active { transform:translateY(0); }
  .btn-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

  .btn-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:14px 28px; background:transparent; color:rgba(255,255,255,.6);
    font-family:'Oswald', Arial, sans-serif; font-size:.88rem; font-weight:500;
    letter-spacing:.08em; text-transform:uppercase;
    border-radius:3px; border:1px solid rgba(255,255,255,.15);
    cursor:pointer; text-decoration:none; white-space:nowrap;
    transition: color .18s, border-color .18s, transform .18s cubic-bezier(0.16,1,0.3,1);
  }
  .btn-ghost:hover { color:#fff; border-color:rgba(255,255,255,.35); transform:translateY(-1px); }

  /* One continuous page surface. Fixed, so the light stays put while content
     scrolls past it — the cinematic feel of the hero, carried the whole way. */
  .ti-ambient {
    position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background:
      radial-gradient(ellipse 120% 55% at 50% 0%, rgba(255,255,255,0.030), transparent 62%),
      radial-gradient(ellipse 90% 45% at 50% 100%, rgba(255,255,255,0.018), transparent 65%),
      linear-gradient(180deg, #060606 0%, #040404 45%, #050505 100%);
  }

  .nav-link { color:rgba(255,255,255,.4); text-decoration:none; font-family:'Oswald', Arial, sans-serif; font-size:.84rem; font-weight:400; letter-spacing:.06em; text-transform:uppercase; transition:color .2s; }
  .nav-link:hover { color:rgba(255,255,255,.88); }
  .feat-row:hover { border-color:rgba(255,255,255,0.14) !important; }

  /* Form fields */
  .enq-input, .enq-textarea, .enq-select {
    width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1);
    border-radius:3px; padding:12px 14px; color:#fff;
    font-family:'Oswald', Arial, sans-serif; font-size:.92rem; font-weight:300; letter-spacing:.01em;
    transition:border-color .2s, background .2s; outline:none;
  }
  .enq-input:focus, .enq-textarea:focus, .enq-select:focus { border-color:rgba(232,201,160,0.5); background:rgba(255,255,255,0.045); }
  .enq-input::placeholder, .enq-textarea::placeholder { color:rgba(255,255,255,0.3); }
  .enq-textarea { resize:vertical; min-height:96px; line-height:1.6; }
  .enq-select option { background-color:#141414; color:#ffffff; }
  .enq-label { font-family:'Oswald', Arial, sans-serif; font-size:.66rem; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.4); margin-bottom:7px; display:block; }

  /* Dashboard motion — runs once, on reveal */
  @keyframes drawLine { from { stroke-dashoffset: 1600; } to { stroke-dashoffset: 0; } }
  @keyframes areaIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes barRise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes dotIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
  .ti-chart-line { stroke-dasharray: 1600; stroke-dashoffset: 1600; animation: drawLine 1.7s cubic-bezier(0.16,1,0.3,1) .15s forwards; }
  .ti-chart-area { opacity: 0; animation: areaIn 1.1s ease .9s forwards; }
  .ti-chart-dot  { opacity: 0; transform-origin: center; animation: dotIn .5s cubic-bezier(0.16,1,0.3,1) 1.6s forwards; }
  .ti-bar { transform-origin: bottom; animation: barRise .85s cubic-bezier(0.16,1,0.3,1) both; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; scroll-behavior:auto !important; }
    .reveal { opacity:1 !important; transform:none !important; transition:none !important; }
    .ti-chart-line { stroke-dashoffset: 0 !important; }
    .ti-chart-area, .ti-chart-dot { opacity: 1 !important; transform: none !important; }
    .ti-bar { transform: none !important; }
  }
`

const EB: React.CSSProperties = { fontFamily:'Oswald, Arial, sans-serif', fontSize:'0.65rem', fontWeight:400, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginBottom:'1rem' }
const SUB: React.CSSProperties = { fontFamily:'Oswald, Arial, sans-serif', fontSize:'.95rem', fontWeight:300, color:'rgba(255,255,255,.34)', lineHeight:1.75, maxWidth:480, margin:'0 auto', textAlign:'center', letterSpacing:'0.01em' }

const CHAMP = '#E8C9A0'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } }),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('in')
      else obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
}

// Fires once, when an element first scrolls into view. Used to start the
// dashboard's numbers and chart only when they're actually on screen.
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.getBoundingClientRect().top < window.innerHeight) { setInView(true); return }
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }),
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

// Counts from the previous value to the target. Respects prefers-reduced-motion
// by jumping straight to the final number.
function useCountUp(target: number, run: boolean, ms = 1300) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    if (!run) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { fromRef.current = target; setValue(target); return }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, run, ms])
  return value
}

function EnquiryModal({ open, onClose, isMobile }: { open: boolean; onClose: () => void; isMobile: boolean }) {
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [message, setMessage] = useState('')
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
    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setErrorMsg('Please fill in company, name, and email.')
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
      const res = await fetch('/api/company-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactName, email, teamSize, message }),
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
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(3,3,3,0.82)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        padding: isMobile ? '1rem' : '2rem', overflowY:'auto',
        animation:'fadeIn .25s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:520, background:'linear-gradient(165deg, #0e0e0e 0%, #070707 100%)',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
          padding: isMobile ? '1.75rem 1.35rem' : '2.5rem',
          position:'relative', boxShadow:'0 50px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation:'modalIn .35s cubic-bezier(0.16,1,0.3,1) both',
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
            <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.5rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', marginBottom:'.75rem' }}>Enquiry sent</h3>
            <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.95rem', fontWeight:300, color:'rgba(255,255,255,.42)', lineHeight:1.7, maxWidth:340, margin:'0 auto 1.75rem' }}>
              Thanks — we&apos;ve received your enquiry and will be in touch shortly to put together the right package for your team.
            </p>
            <button onClick={onClose} className="btn-primary">Done</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:500, letterSpacing:'.28em', textTransform:'uppercase', color:'#E8C9A0', opacity:.8, marginBottom:'.6rem' }}>Company Package</div>
              <h3 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', lineHeight:1.1 }}>Enquire for your team</h3>
              <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.88rem', fontWeight:300, color:'rgba(255,255,255,.38)', lineHeight:1.6, marginTop:'.75rem' }}>
                Tell us a little about your team and we&apos;ll put together the right package. All fields with * are required.
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
              <div>
                <label className="enq-label" htmlFor="enq-company">Company name *</label>
                <input id="enq-company" className="enq-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
              </div>
              <div style={{ display:'flex', gap:'1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex:1 }}>
                  <label className="enq-label" htmlFor="enq-name">Your name *</label>
                  <input id="enq-name" className="enq-input" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
                </div>
                <div style={{ flex:1 }}>
                  <label className="enq-label" htmlFor="enq-email">Email *</label>
                  <input id="enq-email" className="enq-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:300, color:'rgba(255,255,255,.34)', lineHeight:1.55, letterSpacing:'0.01em', marginTop:7 }}>This email will be used to set up your Team Manager account, which controls your team dashboard and analytics. Please use the email of the person who will manage the team.</p>
                </div>
              </div>
              <div>
                <label className="enq-label" htmlFor="enq-size">Team size</label>
                <select id="enq-size" className="enq-select" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                  <option value="">Select a rough size…</option>
                  <option value="2–10">2–10</option>
                  <option value="11–25">11–25</option>
                  <option value="26–50">26–50</option>
                  <option value="51–100">51–100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
              <div>
                <label className="enq-label" htmlFor="enq-message">What do you need it for?</label>
                <textarea id="enq-message" className="enq-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us a little about your team and what you're looking for…" />
              </div>

              {status === 'error' && (
                <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400, color:'#f0a0a0', letterSpacing:'.02em', padding:'10px 14px', background:'rgba(240,120,120,0.06)', border:'1px solid rgba(240,120,120,0.2)', borderRadius:3 }}>
                  {errorMsg}
                </div>
              )}

              <button onClick={submit} disabled={status === 'sending'} className="btn-primary" style={{ width:'100%', padding:'15px', marginTop:'.25rem' }}>
                {status === 'sending' ? (
                  <>
                    <span style={{ width:15, height:15, border:'2px solid rgba(0,0,0,0.25)', borderTopColor:'#000', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                    Sending…
                  </>
                ) : 'Send enquiry'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THE REPRINT TALLY — the comparison visual.
// The paper side stacks four print runs; the Tapped-In side has one purchase
// and an unbroken line. The repetition is the argument.
// ─────────────────────────────────────────────────────────────────────────────

const PRINT_RUNS = [
  'Someone joins',
  'A rebrand',
  'Role changes',
  'New numbers',
]

function ReprintTally({ isMobile }: { isMobile: boolean }) {
  const panel: React.CSSProperties = {
    flex:'1 1 300px', minWidth:0,
    background:'linear-gradient(165deg, #0d0d0d 0%, #070707 100%)',
    border:'1px solid rgba(255,255,255,0.07)', borderRadius:4,
    padding: isMobile ? '1.5rem 1.25rem' : '2rem 1.85rem',
    position:'relative', overflow:'hidden',
  }
  const panelLabel: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:500,
    letterSpacing:'.26em', textTransform:'uppercase', marginBottom:'1.35rem',
  }
  const closing: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:300,
    color:'rgba(255,255,255,.3)', lineHeight:1.7, letterSpacing:'0.01em',
    marginTop:'1.5rem', paddingTop:'1.25rem', borderTop:'1px solid rgba(255,255,255,0.06)',
  }

  return (
    <div style={{ display:'flex', gap: isMobile ? '.85rem' : '1.25rem', flexWrap:'wrap', alignItems:'stretch' }}>

      {/* PAPER — the run repeats */}
      <div className="reveal" style={panel}>
        <div style={{ ...panelLabel, color:'rgba(255,255,255,.32)' }}>Paper cards, a team of 20</div>

        <div style={{ display:'flex', flexDirection:'column', gap:'.55rem' }}>
          {PRINT_RUNS.map((reason, i) => (
            <div key={reason} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem',
              padding: isMobile ? '.7rem .85rem' : '.8rem 1rem',
              background:'rgba(255,255,255,0.02)',
              border:'1px dashed rgba(255,255,255,0.09)',
              borderRadius:3,
              // Each run further down is fainter — the spend receding into the past.
              opacity: 1 - i * 0.16,
            }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.78rem', fontWeight:300, color:'rgba(255,255,255,.5)', letterSpacing:'0.02em' }}>
                {reason}
              </span>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:500, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', whiteSpace:'nowrap' }}>
                Reprint
              </span>
            </div>
          ))}
          <div style={{ textAlign:'center', fontFamily:'Oswald, Arial, sans-serif', fontSize:'1rem', color:'rgba(255,255,255,.18)', letterSpacing:'.4em', paddingTop:'.35rem' }}>
            ⋯
          </div>
        </div>

        <p style={closing}>
          Reprinted every time details change, often several times a year. The cost repeats, indefinitely.
        </p>
      </div>

      {/* TAPPED-IN — bought once, one unbroken line */}
      <div className="reveal d2" style={{ ...panel, border:`1px solid ${CHAMP}33` }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:`linear-gradient(90deg, transparent, ${CHAMP}66 50%, transparent)` }} />
        <div style={{ ...panelLabel, color:CHAMP }}>Tapped-In, a team of 20</div>

        <div style={{ display:'flex', gap:'1.1rem' }}>
          {/* The unbroken line */}
          <div style={{ flexShrink:0, width:2, borderRadius:2, background:`linear-gradient(180deg, ${CHAMP}, ${CHAMP}22)`, marginTop:6 }} />

          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'.9rem' }}>
            <div style={{
              padding: isMobile ? '.7rem .85rem' : '.8rem 1rem',
              background:'rgba(232,201,160,0.07)',
              border:`1px solid ${CHAMP}3d`,
              borderRadius:3,
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem',
            }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.78rem', fontWeight:400, color:'rgba(255,255,255,.82)', letterSpacing:'0.02em' }}>
                One card each
              </span>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:CHAMP, whiteSpace:'nowrap' }}>
                Bought once
              </span>
            </div>

            {['Someone joins', 'A rebrand', 'Role changes', 'New numbers'].map((reason) => (
              <div key={reason} style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                  <path d="M20 6L9 17l-5-5" stroke={CHAMP} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.76rem', fontWeight:300, color:'rgba(255,255,255,.42)', letterSpacing:'0.02em' }}>
                  {reason} — updated, free
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ ...closing, color:'rgba(255,255,255,.42)' }}>
          Bought once. Updated free, forever. Never goes out of date.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THE MANAGER DASHBOARD — the signature element.
// Real metrics from the real product, presented as the live panel it is:
// KPIs count up, the trend line draws itself, weekday bars rise, the
// leaderboard fills. Everything runs once, on scroll, and stops.
// ─────────────────────────────────────────────────────────────────────────────

const TREND = {
  all: [18, 26, 22, 34, 30, 45, 52, 48, 61, 74, 69, 88],
  d30: [4, 9, 7, 12, 10, 16, 14, 19, 17, 24, 22, 29],
}
const WEEKDAYS = [
  { d: 'M', v: 0.62 }, { d: 'T', v: 0.83 }, { d: 'W', v: 1 }, { d: 'T', v: 0.74 },
  { d: 'F', v: 0.56 }, { d: 'S', v: 0.18 }, { d: 'S', v: 0.11 },
]
const LEADERS = [
  { n: 'Sarah Mills',  c: 312, v: 1,    lead: true },
  { n: 'James Carter', c: 248, v: 0.79 },
  { n: 'Priya Shah',   c: 201, v: 0.64 },
  { n: 'Tom Reeves',   c: 156, v: 0.5  },
]

function trendPaths(vals: number[], w = 600, h = 150) {
  const max = Math.max(...vals) * 1.18
  const step = w / (vals.length - 1)
  const pts = vals.map((v, i) => [i * step, h - (v / max) * h])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return { line, area: `${line} L${w},${h} L0,${h} Z`, last: pts[pts.length - 1] }
}

function TeamDashboardMockup({ isMobile }: { isMobile: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [range, setRange] = useState<'all' | '30'>('all')
  const isAll = range === 'all'

  const totalTaps = useCountUp(isAll ? 1284 : 342, inView)
  const avgMember = useCountUp(isAll ? 107 : 29, inView)
  const allTime    = useCountUp(1284, inView)
  const active     = useCountUp(11, inView, 900)

  const vals = isAll ? TREND.all : TREND.d30
  const { line, area, last } = trendPaths(vals)

  const kpiBox: React.CSSProperties = {
    background:'rgba(255,255,255,0.018)', border:'1px solid rgba(255,255,255,0.05)',
    borderRadius:4, padding: isMobile ? '.9rem .85rem' : '1.1rem 1.15rem',
    minWidth:0,
  }
  const kpiLabel: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.55rem', fontWeight:400,
    letterSpacing:'.24em', textTransform:'uppercase', color:'rgba(255,255,255,.3)',
    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
  }
  const kpiValue: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.5rem' : '1.85rem',
    fontWeight:600, color:'#fff', lineHeight:1.1, marginTop:6, letterSpacing:'.01em',
    fontVariantNumeric:'tabular-nums',
  }
  const kpiFoot: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.62rem', fontWeight:300,
    letterSpacing:'.04em', color:'rgba(255,255,255,.26)', marginTop:5,
  }
  const panelTitle: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.58rem', fontWeight:500,
    letterSpacing:'.24em', textTransform:'uppercase', color:'rgba(255,255,255,.3)',
    marginBottom:'1rem',
  }
  const toggleBtn = (on: boolean): React.CSSProperties => ({
    fontFamily:'Oswald, Arial, sans-serif', fontSize:'.64rem', fontWeight:500,
    letterSpacing:'.08em', textTransform:'uppercase', padding:'.35rem .8rem',
    borderRadius:99, border:'none', cursor:'pointer',
    background: on ? '#fff' : 'transparent',
    color: on ? '#000' : 'rgba(255,255,255,.35)',
    transition:'background .2s, color .2s',
  })

  return (
    <div ref={ref} style={{
      width:'100%', maxWidth:860, margin:'0 auto',
      background:'linear-gradient(165deg, #0e0e0e 0%, #070707 100%)',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:6,
      padding: isMobile ? '1.25rem' : '2rem',
      boxShadow:'0 50px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:'6%', right:'6%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent)' }} />

      {/* Header + range toggle */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem', flexWrap:'wrap', gap:'.85rem' }}>
        <div>
          <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, letterSpacing:'.24em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>Your Company</div>
          <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', marginTop:4 }}>Team Dashboard</div>
        </div>
        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:99, padding:3 }}>
          <button type="button" onClick={() => setRange('all')} style={toggleBtn(isAll)}>All time</button>
          <button type="button" onClick={() => setRange('30')} style={toggleBtn(!isAll)}>30 days</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '.6rem' : '.75rem',
        marginBottom: isMobile ? '.75rem' : '1rem',
      }}>
        <div style={{ ...kpiBox, borderColor:`${CHAMP}2e`, background:'rgba(232,201,160,0.045)' }}>
          <div style={kpiLabel}>Total taps</div>
          <div style={{ ...kpiValue, color:CHAMP }}>{totalTaps.toLocaleString()}</div>
          <div style={kpiFoot}>{isAll ? 'All time' : 'Last 30 days'}</div>
        </div>
        <div style={kpiBox}>
          <div style={kpiLabel}>Active members</div>
          <div style={kpiValue}>{active} <span style={{ fontSize:'.9rem', fontWeight:300, color:'rgba(255,255,255,.35)' }}>of 12</span></div>
          <div style={kpiFoot}>Tapped this month</div>
        </div>
        <div style={kpiBox}>
          <div style={kpiLabel}>Avg per member</div>
          <div style={kpiValue}>{avgMember}</div>
          <div style={kpiFoot}>{isAll ? 'All time' : 'Last 30 days'}</div>
        </div>
        <div style={kpiBox}>
          <div style={kpiLabel}>All-time taps</div>
          <div style={kpiValue}>{allTime.toLocaleString()}</div>
          <div style={kpiFoot}>Since launch</div>
        </div>
      </div>

      {/* Trend + weekday */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.9fr 1fr',
        gap: isMobile ? '.75rem' : '1rem',
        marginBottom: isMobile ? '.75rem' : '1rem',
      }}>
        {/* Taps over time */}
        <div style={{ ...kpiBox, padding: isMobile ? '1rem .9rem' : '1.25rem 1.35rem' }}>
          <div style={panelTitle}>Taps over time</div>
          <svg
            key={range}
            viewBox="0 0 600 150"
            style={{ width:'100%', height:'auto', display:'block', overflow:'visible' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tiTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHAMP} stopOpacity="0.22" />
                <stop offset="100%" stopColor={CHAMP} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((g) => (
              <line key={g} x1="0" y1={150 * g} x2="600" y2={150 * g} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <path className="ti-chart-area" d={area} fill="url(#tiTrendFill)" />
            <path
              className="ti-chart-line"
              d={line}
              fill="none"
              stroke={CHAMP}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle className="ti-chart-dot" cx={last[0]} cy={last[1]} r="4.5" fill={CHAMP} />
          </svg>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
            <span style={kpiFoot}>{isAll ? 'Launch' : '30 days ago'}</span>
            <span style={kpiFoot}>Today</span>
          </div>
        </div>

        {/* Engagement by day */}
        <div style={{ ...kpiBox, padding: isMobile ? '1rem .9rem' : '1.25rem 1.35rem' }}>
          <div style={panelTitle}>Engagement by day</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'.4rem', height: isMobile ? 78 : 96 }}>
            {WEEKDAYS.map((w, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:7, minWidth:0 }}>
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'flex-end' }}>
                  <div
                    className="ti-bar"
                    style={{
                      width:'100%',
                      height:`${Math.max(w.v * 100, 6)}%`,
                      borderRadius:2,
                      background: w.v === 1
                        ? `linear-gradient(180deg, ${CHAMP}, ${CHAMP}55)`
                        : 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.07))',
                      animationDelay: `${0.05 * i}s`,
                    }}
                  />
                </div>
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.58rem', fontWeight:400, color:'rgba(255,255,255,.28)', letterSpacing:'.06em' }}>{w.d}</span>
              </div>
            ))}
          </div>
          <div style={{ ...kpiFoot, marginTop:10 }}>Busiest: Wednesday</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ ...kpiBox, padding: isMobile ? '1.1rem .95rem' : '1.35rem 1.5rem' }}>
        <div style={{ ...panelTitle, marginBottom:'1.15rem' }}>Team leaderboard</div>
        {LEADERS.map((r, i) => (
          <div key={r.n} style={{ marginBottom: i === LEADERS.length - 1 ? 0 : '1.15rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7, gap:'1rem' }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400, letterSpacing:'.04em', color:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
                <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.66rem', fontWeight:500, color:'rgba(255,255,255,.28)', width:12, flexShrink:0 }}>{i + 1}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.n}</span>
              </span>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:600, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{r.c}</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${r.v * 100}%`, transformOrigin:'left', animation:'barGrow 1s cubic-bezier(0.16,1,0.3,1) both', background: r.lead ? `linear-gradient(90deg, ${CHAMP}80, ${CHAMP})` : 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7))', borderRadius:99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BusinessPage() {
  useReveal()
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    onScroll(); onResize()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [])

  const openModal = () => setModalOpen(true)

  const SP = isMobile ? 'clamp(3.5rem,9vw,5rem) clamp(1.25rem,5vw,1.5rem)' : 'clamp(6rem,12vw,9rem) clamp(1.5rem,5vw,3rem)'
  const navGlass = isMobile || scrolled

  // Depth without edges: a soft darkening that fades up from nothing and back
  // to nothing, so a band's start and end are invisible against the page.
  const band = 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 16%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0) 100%)'
  const bandToFooter = 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 24%, rgba(0,0,0,0.5) 100%)'

  const H2: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontWeight:600, color:'#fff',
    fontSize:'clamp(1.8rem, 4vw, 3.1rem)', letterSpacing:'0.01em', lineHeight:1.15,
    marginBottom:'1rem', textAlign:'center', textTransform:'uppercase',
  }

  const pains = [
    {
      t: 'Reprint after reprint',
      d: 'Every change means paying to print all over again.',
      icon: (
        <>
          <rect x="6" y="9" width="12" height="8" rx="1.5" stroke={CHAMP} strokeWidth="1.4" />
          <path d="M8 9V5h8v4" stroke={CHAMP} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 15h8v4H8z" stroke={CHAMP} strokeWidth="1.4" strokeLinejoin="round" />
        </>
      ),
    },
    {
      t: 'Waste by the box',
      d: 'Outdated cards binned, money straight in the bin.',
      icon: (
        <>
          <path d="M5 7h14" stroke={CHAMP} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M9 7V5h6v2" stroke={CHAMP} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 7l1 12h8l1-12" stroke={CHAMP} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ),
    },
    {
      t: 'Locked in',
      d: 'Once it&rsquo;s printed, it can never change.',
      icon: (
        <>
          <rect x="5" y="11" width="14" height="9" rx="1.6" stroke={CHAMP} strokeWidth="1.4" />
          <path d="M8.5 11V8a3.5 3.5 0 017 0v3" stroke={CHAMP} strokeWidth="1.4" strokeLinecap="round" />
        </>
      ),
    },
  ]

  const features = [
    { n:'01', t:'Branded company cards', d:'Premium NFC cards for every team member, carrying your company\u2019s identity. One consistent, professional touchpoint across your entire team.' },
    { n:'02', t:'One manager dashboard', d:'Company-wide taps and per-person engagement in a single view. Switch between all-time and recent activity. Real proof of what\u2019s landing.' },
    { n:'03', t:'Assign & reassign in seconds', d:'Invite your team with one link. Assign each person a card, and reassign it the moment someone joins or leaves. The card always stays with the company.' },
    { n:'04', t:'Consent-first & private', d:'Team members opt in when they join, and every company\u2019s data is fully walled off. Your analytics are yours alone — no one else can ever see them.' },
    { n:'05', t:'Never out of date, never reprinted', d:'Every profile updates in real time. When someone\u2019s role changes, their card changes with them instantly — no print run, no waste, no cost.' },
  ]

  const steps = [
    { n:'01', t:'Order your cards', d:'Tell us how many you need. We produce a batch branded for your company and enable your account.' },
    { n:'02', t:'Invite your team', d:'Share one link. Your team joins in a tap and opts in to being part of the company.' },
    { n:'03', t:'Assign the cards', d:'Give each person their card from your dashboard. Reassign any time as your team changes.' },
    { n:'04', t:'Track engagement', d:'Watch activity roll in, company-wide and per person, all in real time.' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />

      {/* The page's single continuous background surface. */}
      <div className="ti-ambient" aria-hidden="true" />

      <EnquiryModal open={modalOpen} onClose={() => setModalOpen(false)} isMobile={isMobile} />

      {/* NAV */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:200,
        padding: isMobile ? '0 1.25rem' : '0 clamp(1.5rem,5vw,3rem)',
        animation:'navDrop .65s cubic-bezier(0.16,1,0.3,1) both',
        transition:'background .3s, border-color .3s',
        background: navGlass ? 'rgba(6,6,6,0.94)' : 'transparent',
        borderBottom: navGlass ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        backdropFilter: navGlass ? 'blur(20px) saturate(160%)' : 'none',
        WebkitBackdropFilter: navGlass ? 'blur(20px) saturate(160%)' : 'none',
      }}>
        <div style={{ maxWidth:1160, margin:'0 auto', height: isMobile ? 56 : 64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
          <Link href="/" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1rem' : '1.15rem', fontWeight:600, letterSpacing:'0.28em', color:'#fff', textDecoration:'none', textTransform:'uppercase', whiteSpace:'nowrap' }}>TAPPED-IN</Link>
          {!isMobile && (
            <nav style={{ display:'flex', gap:'2rem', flex:1, justifyContent:'center' }}>
              <a href="#dashboard" className="nav-link">Dashboard</a>
              <a href="#features" className="nav-link">What&apos;s included</a>
              <a href="#how" className="nav-link">How it works</a>
              <Link href="/" className="nav-link">For individuals</Link>
            </nav>
          )}
          <button onClick={openModal} className="btn-primary" style={{ padding: isMobile ? '9px 16px' : '10px 22px', fontSize: isMobile ? '.75rem' : '.82rem', letterSpacing: isMobile ? '.08em' : '.12em' }}>Enquire</button>
        </div>
      </header>

      <main>
        {/* ══════════════ HERO ══════════════ */}
        <section style={{
          minHeight: isMobile ? 0 : '92vh', display:'flex', alignItems:'center', justifyContent:'center',
          padding: isMobile ? '6.5rem 1.25rem 3.5rem' : 'clamp(9rem,16vw,13rem) clamp(1.5rem,5vw,3rem) clamp(5rem,10vw,7rem)',
          position:'relative', overflow:'hidden', textAlign:'center',
        }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.017) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.017) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 50% 35%, black 12%, transparent 72%)', maskImage:'radial-gradient(ellipse 80% 70% at 50% 35%, black 12%, transparent 72%)', opacity: isMobile ? 0.5 : 1 }} />
          <div style={{ position:'absolute', top:'28%', left:'50%', transform:'translate(-50%,-50%)', width:760, height:460, background:'radial-gradient(ellipse, rgba(255,255,255,0.028) 0%, transparent 65%)', filter:'blur(6px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:820, position:'relative', zIndex:2 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px 5px 7px', background:'rgba(255,255,255,0.032)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, marginBottom: isMobile ? '1.25rem' : '1.75rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'dotBlink 2s ease-in-out infinite' }} />
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.63rem' : '.7rem', fontWeight:500, color:'rgba(255,255,255,.5)', letterSpacing:'.22em', textTransform:'uppercase' }}>For Teams &amp; Companies</span>
            </div>

            <h1 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? 'clamp(1.85rem,7.6vw,2.6rem)' : 'clamp(2.7rem,5.2vw,4.4rem)', fontWeight:600, lineHeight: isMobile ? 1.1 : 1.05, letterSpacing:'0.01em', color:'#fff', textTransform:'uppercase', marginBottom: isMobile ? '1rem' : '1.5rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .08s both' }}>
              Your team&apos;s business cards are{' '}
              <span style={{ fontWeight:300, color:'rgba(255,255,255,.5)', letterSpacing:'0.02em' }}>out of date the moment they&apos;re printed.</span>
            </h1>

            <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.9rem' : 'clamp(.98rem,1.7vw,1.1rem)', fontWeight:300, color:'rgba(255,255,255,.42)', lineHeight:1.75, letterSpacing:'0.01em', maxWidth:560, margin:'0 auto', marginBottom: isMobile ? '1.75rem' : '2.5rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .18s both' }}>
              Tapped-In gives your whole team premium NFC cards, branded to your company, that update live — anytime, forever. Bought once. No reprints. No waste. One dashboard to see exactly what&apos;s working.
            </p>

            <div style={{ display:'flex', gap:'.75rem', justifyContent:'center', flexWrap:'wrap', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .26s both' }}>
              <button onClick={openModal} className="btn-primary">Enquire about the company package</button>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
          </div>
        </section>

        {/* ══════════════ THE PROBLEM ══════════════ */}
        <section id="problem" style={{ padding: SP, background: band }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.25rem' : '3.5rem' }}>
              <div style={EB}>The problem with paper</div>
              <h2 style={H2}>Paper cards cost<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>more than you think.</span></h2>
            </div>

            <p className="reveal d1" style={{
              fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.92rem' : '1.02rem',
              fontWeight:300, color:'rgba(255,255,255,.4)', lineHeight:1.85, letterSpacing:'0.01em',
              maxWidth:660, margin:'0 auto', textAlign:'center',
              marginBottom: isMobile ? '2.25rem' : '3.25rem',
            }}>
              Every time someone joins, leaves, changes role, or updates a number, the whole team&apos;s cards are obsolete. So you reprint. And reprint again. Boxes of out-of-date cards end up in the bin — money you&apos;ve already spent, thrown away. And when you hand someone a paper card, that&apos;s it. A typo, a rebrand, a new title — nothing can change. You&apos;re stuck with it until the next print run.
            </p>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '.7rem' : '1rem' }}>
              {pains.map((p, i) => (
                <div key={p.t} className={`reveal d${i + 1}`} style={{
                  background:'linear-gradient(165deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.008) 100%)',
                  border:'1px solid rgba(255,255,255,0.06)', borderRadius:4,
                  padding: isMobile ? '1.25rem 1.15rem' : '1.6rem 1.5rem',
                  display:'flex', flexDirection: isMobile ? 'row' : 'column',
                  alignItems: isMobile ? 'center' : 'flex-start',
                  gap: isMobile ? '1rem' : '.9rem',
                }}>
                  <div style={{
                    flexShrink:0, width:38, height:38, borderRadius:3,
                    background:'rgba(232,201,160,0.07)', border:`1px solid ${CHAMP}2e`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">{p.icon}</svg>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.95rem' : '1.02rem', fontWeight:500, letterSpacing:'.03em', textTransform:'uppercase', color:'#fff', lineHeight:1.25, marginBottom:'.4rem' }}>{p.t}</div>
                    <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.85rem', fontWeight:300, color:'rgba(255,255,255,.36)', lineHeight:1.65, letterSpacing:'0.01em' }} dangerouslySetInnerHTML={{ __html: p.d }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ THE SOLUTION / MONEY ══════════════ */}
        <section id="solution" style={{ padding: SP }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.25rem' : '3.25rem' }}>
              <div style={EB}>The Tapped-In way</div>
              <h2 style={H2}>Bought once.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>Updated forever.</span></h2>
              <p style={{ ...SUB, maxWidth:560 }}>
                One premium card per person, branded to your company. When anything changes — a number, a title, a whole rebrand — every profile updates instantly, from one dashboard. No reprinting. No waste. Ever.
              </p>
            </div>

            <div className="reveal d1" style={{ textAlign:'center', marginBottom: isMobile ? '1.25rem' : '1.75rem' }}>
              <span style={{
                display:'inline-block',
                fontFamily:'Oswald, Arial, sans-serif', fontSize:'.58rem', fontWeight:500,
                letterSpacing:'.24em', textTransform:'uppercase', color:'rgba(255,255,255,.28)',
                border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, padding:'5px 12px',
              }}>
                An illustration, not a quote
              </span>
            </div>

            <ReprintTally isMobile={isMobile} />

            <p className="reveal d3" style={{
              fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.95rem' : '1.1rem',
              fontWeight:300, color:'rgba(255,255,255,.5)', lineHeight:1.7, letterSpacing:'0.02em',
              textAlign:'center', maxWidth:520, margin:'0 auto',
              marginTop: isMobile ? '1.75rem' : '2.5rem',
            }}>
              Over a year, the difference isn&apos;t small. Over several, it&apos;s substantial.
            </p>
          </div>
        </section>

        {/* ══════════════ DASHBOARD ══════════════ */}
        <section id="dashboard" style={{ padding: SP, background: band }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
              <div style={EB}>The Manager Dashboard</div>
              <h2 style={H2}>See what<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>paper never could.</span></h2>
              <p style={{ ...SUB, maxWidth:560 }}>
                Every tap, every team member, in one view. Know who&apos;s active, what&apos;s landing, and have the numbers to prove your team&apos;s networking actually works. Paper cards tell you nothing. Tapped-In shows you everything.
              </p>
            </div>
            <div className="reveal d1">
              <TeamDashboardMockup isMobile={isMobile} />
            </div>
          </div>
        </section>

        {/* ══════════════ FEATURES ══════════════ */}
        <section id="features" style={{ padding: SP }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
              <div style={EB}>What Your Company Gets</div>
              <h2 style={H2}>Built for teams,<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>not just individuals.</span></h2>
            </div>
            <div className="reveal d1" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {features.map((f) => (
                <div key={f.n} className="feat-row" style={{
                  display:'grid',
                  gridTemplateColumns: isMobile ? 'auto 1fr' : '80px 1.1fr 1.8fr',
                  gap: isMobile ? '.5rem 1.25rem' : '2rem',
                  alignItems: isMobile ? 'start' : 'center',
                  padding: isMobile ? '1.75rem 0' : '2.25rem 0',
                  borderBottom:'1px solid rgba(255,255,255,0.06)',
                  transition:'border-color .3s',
                }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.8rem', fontWeight:500, letterSpacing:'.1em', color:'rgba(255,255,255,.28)' }}>{f.n}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight:500, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', lineHeight:1.2 }}>{f.t}</div>
                  <div style={{ gridColumn: isMobile ? '2' : 'auto', fontFamily:'Oswald, Arial, sans-serif', fontSize:'.92rem', fontWeight:300, color:'rgba(255,255,255,.4)', lineHeight:1.7, letterSpacing:'0.01em' }}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ HOW IT WORKS ══════════════ */}
        <section id="how" style={{ padding: SP, background: band }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
              <div style={EB}>How It Works</div>
              <h2 style={H2}>Four steps to a<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>connected team.</span></h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
              {steps.map((s) => (
                <div key={s.n} className="reveal" style={{ background:'#070707', padding: isMobile ? '1.75rem 1.5rem' : 'clamp(1.75rem,3vw,2.25rem)', display:'flex', flexDirection:'column', gap:'.65rem', minWidth:0 }}>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:500, letterSpacing:'.14em', color:'#E8C9A0', opacity:.7 }}>{s.n}</div>
                  <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight:500, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', lineHeight:1.2 }}>{s.t}</div>
                  <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.86rem', fontWeight:300, color:'rgba(255,255,255,.32)', lineHeight:1.7, letterSpacing:'0.01em' }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ CLOSING CTA ══════════════ */}
        <section style={{ padding: isMobile ? '4rem 1.25rem' : 'clamp(7rem,14vw,10rem) clamp(1.5rem,5vw,3rem)', position:'relative', overflow:'hidden', textAlign:'center' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)', maskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:640, height:400, background:'radial-gradient(ellipse, rgba(232,201,160,0.03) 0%, transparent 65%)', filter:'blur(6px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:2, maxWidth:660, margin:'0 auto' }}>
            <div className="reveal" style={EB}>Company Package</div>
            <h2 className="reveal d1" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? 'clamp(1.75rem,7.4vw,2.5rem)' : 'clamp(2.5rem,5.4vw,4rem)', fontWeight:600, color:'#fff', lineHeight:1.08, letterSpacing:'0.01em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
              Equip your team.<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.4)' }}>Stop paying to reprint.</span>
            </h2>
            <p className="reveal d2" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.9rem' : '1rem', fontWeight:300, color:'rgba(255,255,255,.38)', lineHeight:1.78, letterSpacing:'0.01em', marginBottom: isMobile ? '1.75rem' : '2.5rem', maxWidth:500, marginLeft:'auto', marginRight:'auto' }}>
              Tell us your team size and what you need. We&apos;ll put together the right package — premium branded cards, bought once, updated forever.
            </p>
            <div className="reveal d3">
              <button onClick={openModal} className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '14px 30px' : '16px 42px' }}>Enquire about the company package</button>
            </div>
            <p className="reveal d4" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.78rem', fontWeight:300, color:'rgba(255,255,255,.26)', letterSpacing:'0.03em', marginTop:'1.25rem' }}>
              No commitment — just a conversation about what your team needs.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:'none', padding: isMobile ? '2.5rem 1.25rem 2rem' : 'clamp(3rem,6vw,4rem) clamp(1.5rem,5vw,3rem) 2.5rem', background: bandToFooter }}>
          <div style={{ maxWidth:1160, margin:'0 auto 2rem', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 50%, transparent)' }} />
          <div style={{ maxWidth:1160, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1.5rem' }}>
            <div>
              <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'1.05rem', fontWeight:600, letterSpacing:'.3em', color:'#fff', textTransform:'uppercase', marginBottom:'.5rem' }}>TAPPED-IN</div>
              <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.78rem', fontWeight:300, fontStyle:'italic', color:'rgba(255,255,255,.2)', letterSpacing:'0.02em' }}>A new standard of Networking.</p>
            </div>
            <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
              <Link href="/" className="nav-link">For individuals</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <button onClick={openModal} className="nav-link" style={{ background:'transparent', border:'none', cursor:'pointer' }}>Enquire</button>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
