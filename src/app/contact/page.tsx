'use client'

import Link from 'next/link'
import { useState } from 'react'

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

const ENQUIRY_TYPES = [
  'General',
  'Order support',
  'Business & organisations',
  'Press',
]

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    enquiryType: 'General',
    message: '',
    company: '', // honeypot — must stay empty
  })

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setStatus('sent')
      } else {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <main style={s.page}>
        <div aria-hidden="true" style={s.grain} />
        <div aria-hidden="true" style={s.glow} />

        <header style={s.topbar}>
          <Link href="/" style={s.logo}>TAPPED-IN</Link>
          <Link href="/" style={s.back}>← Back to site</Link>
        </header>

        <div style={s.wrap}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={s.eyebrow}>Contact</p>
            <h1 style={s.h1}>Let&apos;s talk.<br /><span style={s.h1dim}>Tell us what you need.</span></h1>
            <p style={s.sub}>Questions about the card, help with an order, or working together? Send a message and we&apos;ll get back to you.</p>
          </div>

          {status === 'sent' ? (
            <div style={s.card}>
              <div style={s.sentWrap}>
                <div style={s.check}>✓</div>
                <h2 style={s.sentTitle}>Message sent</h2>
                <p style={s.sentBody}>Thank you for reaching out. We&apos;ll reply to your email as soon as we can.</p>
                <Link href="/" style={s.sentBtn}>Back to site</Link>
              </div>
            </div>
          ) : (
            <form style={s.card} onSubmit={submit} noValidate>
              {/* Honeypot — hidden from humans, catches bots */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
                <label>
                  Company
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={set('company')}
                  />
                </label>
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="name">Name</label>
                <input id="name" type="text" className="ti-contact-input" style={s.input} value={form.name} onChange={set('name')} placeholder="Your name" required />
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="email">Email</label>
                <input id="email" type="email" className="ti-contact-input" style={s.input} value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="enquiryType">Enquiry type</label>
                <div style={s.selectWrap}>
                  <select id="enquiryType" className="ti-contact-select" style={s.select} value={form.enquiryType} onChange={set('enquiryType')}>
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t} value={t} style={{ background: '#0c0c0c' }}>{t}</option>
                    ))}
                  </select>
                  <span aria-hidden="true" style={s.selectArrow}>▾</span>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="message">Message</label>
                <textarea id="message" className="ti-contact-input" style={{ ...s.input, ...s.textarea }} value={form.message} onChange={set('message')} placeholder="How can we help?" rows={5} required />
              </div>

              {status === 'error' && <p style={s.errorMsg}>{error}</p>}

              <button type="submit" className="ti-contact-submit" style={{ ...s.submit, opacity: status === 'sending' ? 0.6 : 1, cursor: status === 'sending' ? 'default' : 'pointer' }} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>

              <p style={s.privacy}>We only use your details to reply to your message.</p>
            </form>
          )}
        </div>
      </main>
    </>
  )
}

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #030303; }
  .ti-contact-input:focus, .ti-contact-select:focus { outline: none; border-color: rgba(232,225,210,0.5) !important; box-shadow: 0 0 0 3px rgba(232,225,210,0.08) !important; }
  .ti-contact-input::placeholder { color: rgba(255,255,255,0.22); }
  .ti-contact-submit:hover { background: #ececec; transform: translateY(-1px); }
  @media (prefers-reduced-motion: reduce) { .ti-contact-submit:hover { transform: none; } }
`

const FF = `'Oswald', 'Arial Narrow', sans-serif`

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: FF, position: 'relative', overflow: 'hidden', WebkitFontSmoothing: 'antialiased', paddingBottom: '5rem' },
  grain: { position: 'fixed', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '220px 220px', pointerEvents: 'none', zIndex: 0 },
  glow: { position: 'fixed', top: '-160px', left: '50%', transform: 'translateX(-50%)', width: '680px', height: '440px', background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 68%)', filter: 'blur(10px)', pointerEvents: 'none', zIndex: 0 },

  topbar: { position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem clamp(1.25rem, 4vw, 3rem)', maxWidth: 1200, margin: '0 auto', width: '100%' },
  logo: { fontFamily: FF, fontSize: '.78rem', fontWeight: 600, letterSpacing: '.3em', color: '#fff', textDecoration: 'none' },
  back: { fontFamily: FF, fontSize: '.8rem', fontWeight: 400, letterSpacing: '.04em', color: 'rgba(255,255,255,.4)', textDecoration: 'none' },

  wrap: { position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: 'clamp(2.5rem, 7vw, 4.5rem) 1.5rem 0' },
  eyebrow: { fontFamily: FF, fontSize: '.68rem', fontWeight: 500, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '1.1rem' },
  h1: { fontFamily: FF, fontSize: 'clamp(2.2rem, 6vw, 3.4rem)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '.005em', marginBottom: '1.25rem' },
  h1dim: { color: 'rgba(255,255,255,.4)', fontWeight: 300 },
  sub: { fontFamily: FF, fontSize: 'clamp(.95rem, 2vw, 1.05rem)', fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,.5)', maxWidth: 460, margin: '0 auto' },

  card: { position: 'relative', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, background: 'linear-gradient(155deg, rgba(14,14,14,0.9), rgba(9,9,9,0.95))', padding: 'clamp(1.5rem, 4vw, 2.25rem)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' },

  field: { marginBottom: '1.15rem' },
  label: { display: 'block', fontFamily: FF, fontSize: '.7rem', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: '.5rem' },
  input: { width: '100%', padding: '13px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontFamily: FF, fontSize: '.95rem', fontWeight: 300, letterSpacing: '.01em', transition: 'border-color .2s, box-shadow .2s' },
  textarea: { resize: 'vertical', minHeight: 120, lineHeight: 1.6 },

  selectWrap: { position: 'relative' },
  select: { width: '100%', padding: '13px 40px 13px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontFamily: FF, fontSize: '.95rem', fontWeight: 300, letterSpacing: '.01em', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', cursor: 'pointer', transition: 'border-color .2s, box-shadow .2s' },
  selectArrow: { position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', fontSize: '.8rem' },

  errorMsg: { fontFamily: FF, fontSize: '.85rem', fontWeight: 400, color: '#f88', marginBottom: '1rem', letterSpacing: '.01em' },

  submit: { width: '100%', padding: '15px', borderRadius: 10, border: 'none', background: '#fff', color: '#000', fontFamily: FF, fontSize: '.9rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .18s, transform .18s', marginTop: '.35rem' },
  privacy: { fontFamily: FF, fontSize: '.75rem', fontWeight: 300, color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: '1rem', letterSpacing: '.01em' },

  sentWrap: { textAlign: 'center', padding: '1.5rem 0' },
  check: { width: 54, height: 54, borderRadius: '50%', border: '1px solid rgba(232,225,210,0.5)', color: '#e8e1d2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.25rem', boxShadow: '0 0 24px rgba(232,225,210,0.18)' },
  sentTitle: { fontFamily: FF, fontSize: '1.6rem', fontWeight: 600, color: '#fff', marginBottom: '.6rem', letterSpacing: '.01em' },
  sentBody: { fontFamily: FF, fontSize: '.95rem', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.5)', maxWidth: 360, margin: '0 auto 1.75rem' },
  sentBtn: { display: 'inline-block', padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: FF, fontSize: '.82rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none' },
}
