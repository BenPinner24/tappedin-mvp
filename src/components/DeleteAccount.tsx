'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MY ACCOUNT — quiet danger zone + confirmation modal.
// Self-contained: all styles travel with it. The button that actually deletes
// stays disabled until the user types DELETE exactly.
// ─────────────────────────────────────────────────────────────────────────────

const CONFIRM_WORD = 'DELETE'
const DANGER = '#f87171'

const CSS = `
  @keyframes da-fade { from { opacity:0 } to { opacity:1 } }
  @keyframes da-rise { from { opacity:0; transform:translateY(14px) scale(.985) } to { opacity:1; transform:none } }
  @keyframes da-spin { to { transform: rotate(360deg) } }

  .da-modal, .da-modal *, .da-modal *::before, .da-modal *::after { box-sizing: border-box; }

  .da-trigger {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: 'Oswald', Arial, sans-serif;
    font-size: .78rem; font-weight: 400; letter-spacing: .06em;
    color: rgba(255,255,255,0.28);
    text-decoration: underline; text-underline-offset: 3px;
    transition: color .2s;
  }
  .da-trigger:hover { color: rgba(255,255,255,0.6); }

  .da-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.14); border-radius: 8px;
    padding: 12px 14px; color: #fff;
    font-family: 'Oswald', Arial, sans-serif; font-size: .95rem;
    letter-spacing: .16em; text-transform: uppercase; outline: none;
    transition: border-color .2s, background .2s;
  }
  .da-input:focus { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.06); }
  .da-input::placeholder { color: rgba(255,255,255,0.2); letter-spacing: .1em; }

  .da-btn {
    font-family: 'Oswald', Arial, sans-serif; font-size: .82rem; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    border-radius: 999px; padding: 12px 22px; cursor: pointer;
    transition: opacity .18s, background .18s, transform .18s;
  }
  .da-btn:disabled { opacity: .4; cursor: not-allowed; }
  .da-btn:hover:not(:disabled) { transform: translateY(-1px); }

  .da-link { color: #E8C9A0; text-decoration: underline; text-underline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .da-modal, .da-modal * { animation: none !important; transition: none !important; }
  }
`

export default function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const canDelete = typed === CONFIRM_WORD && status === 'idle'

  function close() {
    if (status === 'working') return
    setOpen(false)
    setTyped('')
    setError(null)
  }

  async function confirmDelete() {
    if (typed !== CONFIRM_WORD) return
    setStatus('working')
    setError(null)
    try {
      // No body: the server uses the session, never client input.
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again or email contact@tappedin.uk.')
        setStatus('idle')
        return
      }

      setStatus('done')
      try { await createClient().auth.signOut() } catch { /* session is already gone */ }
      setTimeout(() => { window.location.href = '/?deleted=1' }, 2200)
    } catch {
      setError('Network error. Nothing has been deleted — please try again.')
      setStatus('idle')
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Quiet danger zone at the very bottom of the page */}
      <div style={{
        marginTop: '3.5rem', paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
      }}>
        <button type="button" className="da-trigger" onClick={() => setOpen(true)}>
          Delete my account and data
        </button>
      </div>

      {open && (
        <div
          className="da-modal"
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.25rem', overflowY: 'auto',
            background: 'rgba(3,3,3,0.86)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            animation: 'da-fade .22s ease both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="da-title"
            style={{
              width: '100%', maxWidth: 460, margin: 'auto',
              background: 'linear-gradient(165deg, #0e0e0e 0%, #070707 100%)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: 'clamp(1.5rem, 5vw, 2.25rem)',
              boxShadow: '0 50px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
              animation: 'da-rise .3s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {status === 'done' ? (
              <div style={{ textAlign: 'center' }}>
                <h3 id="da-title" style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: '#fff', marginBottom: '.85rem' }}>
                  Your account and data have been deleted
                </h3>
                <p style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.9rem', fontWeight: 300, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
                  Thank you for having been part of Tapped-In. Taking you back to the homepage…
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.6rem', fontWeight: 500, letterSpacing: '.28em', textTransform: 'uppercase', color: DANGER, marginBottom: '.75rem' }}>
                  Permanent
                </p>
                <h3 id="da-title" style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>
                  Delete your account and data
                </h3>

                <p style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.9rem', fontWeight: 300, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: '1rem' }}>
                  This permanently deletes your account, profile, links, gallery, analytics and connections. Any active subscription is cancelled, and your card is released so it can be set up again by someone else. <strong style={{ color: '#fff', fontWeight: 500 }}>This cannot be undone.</strong>
                </p>

                <p style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.85rem', fontWeight: 300, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: '1.5rem', padding: '.85rem 1rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  Want a copy of your data first? Email <a href="mailto:contact@tappedin.uk" className="da-link">contact@tappedin.uk</a> and we&apos;ll send it before you delete.
                </p>

                <label htmlFor="da-confirm" style={{ display: 'block', fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.68rem', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.6rem' }}>
                  Type {CONFIRM_WORD} to confirm
                </label>
                <input
                  id="da-confirm"
                  className="da-input"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={status === 'working'}
                />

                {error && (
                  <p style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.84rem', fontWeight: 300, lineHeight: 1.65, color: DANGER, marginTop: '1rem', padding: '.8rem 1rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="da-btn"
                    onClick={confirmDelete}
                    disabled={!canDelete}
                    style={{
                      flex: '1 1 190px',
                      background: canDelete ? DANGER : 'rgba(248,113,113,0.14)',
                      color: canDelete ? '#2b0707' : 'rgba(255,255,255,.45)',
                      border: canDelete ? 'none' : '1px solid rgba(248,113,113,0.25)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {status === 'working' ? (
                      <>
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#2b0707', borderRadius: '50%', display: 'inline-block', animation: 'da-spin .7s linear infinite' }} />
                        Deleting…
                      </>
                    ) : 'Delete permanently'}
                  </button>
                  <button
                    type="button"
                    className="da-btn"
                    onClick={close}
                    disabled={status === 'working'}
                    style={{ flex: '0 1 auto', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.14)' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
