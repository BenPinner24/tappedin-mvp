'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; scroll-behavior:auto !important; }
    .reveal { opacity:1 !important; transform:none !important; transition:none !important; }
  }
`

const EB: React.CSSProperties = { fontFamily:'Oswald, Arial, sans-serif', fontSize:'0.65rem', fontWeight:400, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginBottom:'1rem' }
const SUB: React.CSSProperties = { fontFamily:'Oswald, Arial, sans-serif', fontSize:'.95rem', fontWeight:300, color:'rgba(255,255,255,.34)', lineHeight:1.75, maxWidth:480, margin:'0 auto', textAlign:'center', letterSpacing:'0.01em' }

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

// ── Enquiry form modal ──
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

// ── Dashboard mockup (native Oswald styling) ──
function TeamDashboardMockup({ isMobile }: { isMobile: boolean }) {
  const rows = [
    { n: 'Sarah Mills', c: 312, v: 1, lead: true },
    { n: 'James Carter', c: 248, v: 0.79 },
    { n: 'Priya Shah', c: 201, v: 0.64 },
    { n: 'Tom Reeves', c: 156, v: 0.5 },
  ]
  return (
    <div style={{
      width:'100%', maxWidth:760, margin:'0 auto',
      background:'linear-gradient(165deg, #0e0e0e 0%, #070707 100%)',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:6,
      padding: isMobile ? '1.35rem' : '2rem',
      boxShadow:'0 50px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:'6%', right:'6%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent)' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, letterSpacing:'.24em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>Your Company</div>
          <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight:600, letterSpacing:'.02em', textTransform:'uppercase', color:'#fff', marginTop:4 }}>Team Dashboard</div>
        </div>
        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:99, padding:3 }}>
          <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.66rem', fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', padding:'.35rem .8rem', borderRadius:99, background:'#fff', color:'#000' }}>All time</span>
          <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.66rem', fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', padding:'.35rem .8rem', borderRadius:99, color:'rgba(255,255,255,.35)' }}>30 days</span>
        </div>
      </div>
      <div style={{ textAlign:'center', padding: isMobile ? '1.5rem' : '1.85rem', borderRadius:4, background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'1.5rem' }}>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.6rem', fontWeight:400, letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>Total taps</div>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '2.8rem' : '3.4rem', fontWeight:600, letterSpacing:'.02em', color:'#fff', lineHeight:1, marginTop:8 }}>1,284</div>
        <div style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.72rem', fontWeight:300, letterSpacing:'.04em', color:'rgba(255,255,255,.3)', marginTop:8 }}>ACROSS 12 TEAM MEMBERS · ALL TIME</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.n} style={{ marginBottom: i === rows.length - 1 ? 0 : '1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7 }}>
            <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:400, letterSpacing:'.04em', color:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', gap:11 }}>
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.66rem', fontWeight:500, color:'rgba(255,255,255,.28)', width:12 }}>{i + 1}</span>
              {r.n}
            </span>
            <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize:'.82rem', fontWeight:600, color:'#fff' }}>{r.c}</span>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${r.v * 100}%`, transformOrigin:'left', animation:'barGrow 1s cubic-bezier(0.16,1,0.3,1) both', background: r.lead ? 'linear-gradient(90deg, rgba(232,201,160,0.5), #E8C9A0)' : 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7))', borderRadius:99 }} />
          </div>
        </div>
      ))}
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

  const H2: React.CSSProperties = {
    fontFamily:'Oswald, Arial, sans-serif', fontWeight:600, color:'#fff',
    fontSize:'clamp(1.8rem, 4vw, 3.1rem)', letterSpacing:'0.01em', lineHeight:1.15,
    marginBottom:'1rem', textAlign:'center', textTransform:'uppercase',
  }

  const features = [
    { n:'01', t:'Branded company cards', d:'Premium NFC cards for every team member, carrying your company\u2019s identity. One consistent, professional touchpoint across your entire team.' },
    { n:'02', t:'One manager dashboard', d:'Company-wide taps and per-person engagement in a single view. Switch between all-time and recent activity. Real proof of what\u2019s landing.' },
    { n:'03', t:'Assign & reassign in seconds', d:'Invite your team with one link. Assign each person a card, and reassign it the moment someone joins or leaves. The card always stays with the company.' },
    { n:'04', t:'Consent-first & private', d:'Team members opt in when they join, and every company\u2019s data is fully walled off. Your analytics are yours alone — no one else can ever see them.' },
    { n:'05', t:'Always up to date', d:'Every profile updates in real time. No reprints, no out-of-date details. When someone\u2019s role changes, their card changes with them instantly.' },
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
        {/* HERO */}
        <section style={{
          minHeight: isMobile ? 0 : '92vh', display:'flex', alignItems:'center', justifyContent:'center',
          padding: isMobile ? '6.5rem 1.25rem 3.5rem' : 'clamp(9rem,16vw,13rem) clamp(1.5rem,5vw,3rem) clamp(5rem,10vw,7rem)',
          position:'relative', overflow:'hidden', textAlign:'center',
        }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.017) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.017) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 50% 35%, black 12%, transparent 72%)', maskImage:'radial-gradient(ellipse 80% 70% at 50% 35%, black 12%, transparent 72%)', opacity: isMobile ? 0.5 : 1 }} />
          <div style={{ position:'absolute', top:'28%', left:'50%', transform:'translate(-50%,-50%)', width:760, height:460, background:'radial-gradient(ellipse, rgba(255,255,255,0.028) 0%, transparent 65%)', filter:'blur(6px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:780, position:'relative', zIndex:2 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px 5px 7px', background:'rgba(255,255,255,0.032)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, marginBottom: isMobile ? '1.25rem' : '1.75rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'dotBlink 2s ease-in-out infinite' }} />
              <span style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.63rem' : '.7rem', fontWeight:500, color:'rgba(255,255,255,.5)', letterSpacing:'.22em', textTransform:'uppercase' }}>For Teams &amp; Companies</span>
            </div>

            <h1 style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? 'clamp(2.1rem,9vw,3rem)' : 'clamp(3.4rem,7vw,6rem)', fontWeight:600, lineHeight: isMobile ? 1.05 : 1.0, letterSpacing:'0.01em', color:'#fff', textTransform:'uppercase', marginBottom: isMobile ? '1rem' : '1.5rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .08s both' }}>
              Equip your team.<br />
              <span style={{ fontWeight:300, color:'rgba(255,255,255,.5)', letterSpacing:'0.02em' }}>Network like the future.</span>
            </h1>

            <p style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.9rem' : 'clamp(.98rem,1.7vw,1.1rem)', fontWeight:300, color:'rgba(255,255,255,.42)', lineHeight:1.75, letterSpacing:'0.01em', maxWidth:520, margin:'0 auto', marginBottom: isMobile ? '1.75rem' : '2.5rem', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .18s both' }}>
              Premium NFC cards for everyone on your team, branded to your company, with one dashboard to see exactly how they perform. No apps. No paper. No guesswork.
            </p>

            <div style={{ display:'flex', gap:'.75rem', justifyContent:'center', flexWrap:'wrap', animation:'fadeUp .75s cubic-bezier(0.16,1,0.3,1) .26s both' }}>
              <button onClick={openModal} className="btn-primary">Enquire about the company package</button>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
          </div>
        </section>

        {/* DASHBOARD */}
        <section id="dashboard" style={{ padding: SP, background:'#030303' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
              <div style={EB}>The Manager Dashboard</div>
              <h2 style={H2}>See how your<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.42)' }}>whole team performs.</span></h2>
              <p style={SUB}>Every tap, every team member, in one view. Know what&apos;s working — and have the numbers to prove it.</p>
            </div>
            <div className="reveal d1">
              <TeamDashboardMockup isMobile={isMobile} />
            </div>
          </div>
        </section>

        {/* FEATURES */}
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

        {/* HOW IT WORKS */}
        <section id="how" style={{ padding: SP, background:'#030303' }}>
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

        {/* CTA */}
        <section style={{ padding: isMobile ? '4rem 1.25rem' : 'clamp(7rem,14vw,10rem) clamp(1.5rem,5vw,3rem)', position:'relative', overflow:'hidden', textAlign:'center' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'72px 72px', WebkitMaskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)', maskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 8%, transparent 70%)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:640, height:400, background:'radial-gradient(ellipse, rgba(232,201,160,0.03) 0%, transparent 65%)', filter:'blur(6px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:2, maxWidth:640, margin:'0 auto' }}>
            <div className="reveal" style={EB}>Company Package</div>
            <h2 className="reveal d1" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? 'clamp(1.9rem,8vw,2.8rem)' : 'clamp(2.8rem,6vw,4.5rem)', fontWeight:600, color:'#fff', lineHeight:1.05, letterSpacing:'0.01em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
              Let&apos;s equip<br /><span style={{ fontWeight:300, color:'rgba(255,255,255,.4)' }}>your team.</span>
            </h2>
            <p className="reveal d2" style={{ fontFamily:'Oswald, Arial, sans-serif', fontSize: isMobile ? '.9rem' : '1rem', fontWeight:300, color:'rgba(255,255,255,.38)', lineHeight:1.78, letterSpacing:'0.01em', marginBottom: isMobile ? '2rem' : '2.75rem', maxWidth:480, marginLeft:'auto', marginRight:'auto' }}>
              Team pricing is tailored to the size of your company and what you need. Tell us a little about your team, and we&apos;ll put together the right package.
            </p>
            <div className="reveal d3">
              <button onClick={openModal} className="btn-primary" style={{ fontSize:'.9rem', padding: isMobile ? '14px 30px' : '16px 42px' }}>Enquire about the company package</button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.045)', padding: isMobile ? '2.5rem 1.25rem 2rem' : 'clamp(3rem,6vw,4rem) clamp(1.5rem,5vw,3rem) 2.5rem', background:'#030303' }}>
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
