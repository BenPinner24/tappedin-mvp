'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string
  created_at: string
  name: string
  role: string | null
  rating: number
  quote: string
  status: 'pending' | 'approved' | 'rejected'
}

type Gate = 'loading' | 'signedout' | 'forbidden' | 'ok'

const CHAMP = '#E8C9A0'
const OK = '#4ade80'
const BAD = '#f87171'

export default function AdminReviewsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [gate, setGate]       = useState<Gate>('loading')
  const [token, setToken]     = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [busyId, setBusyId]   = useState<string | null>(null)

  const fetchReviews = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not load reviews')
        setGate('ok')
        return
      }
      const j = await res.json()
      setReviews(j.reviews ?? [])
      setError(null)
      setGate('ok')
    } catch {
      setError('Network error loading reviews')
      setGate('ok')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) { if (!cancelled) setGate('signedout'); return }
      if (!cancelled) { setToken(accessToken); await fetchReviews(accessToken) }
    }
    init()
    return () => { cancelled = true }
  }, [supabase, fetchReviews])

  async function setStatus(id: string, status: Review['status']) {
    if (!token) return
    setBusyId(id)
    setError(null)
    const prev = reviews
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Update failed')
        setReviews(prev)
      }
    } catch {
      setError('Network error')
      setReviews(prev)
    } finally {
      setBusyId(null)
    }
  }

  const pending  = reviews.filter((r) => r.status === 'pending')
  const approved = reviews.filter((r) => r.status === 'approved')
  const rejected = reviews.filter((r) => r.status === 'rejected')

  return (
    <main style={st.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes admspin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        .adm-btn { transition: transform 0.12s ease, opacity 0.12s ease, background 0.12s ease; }
        .adm-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={st.shell}>
        <div style={st.header}>
          <div>
            <p style={st.eyebrow}>Tapped-In · Admin</p>
            <h1 style={st.title}>Reviews</h1>
          </div>
          {gate === 'ok' && (
            <button
              className="adm-btn"
              style={st.refreshBtn}
              onClick={() => token && fetchReviews(token)}
            >
              Refresh
            </button>
          )}
        </div>

        {error && <div style={st.errorBar}>{error}</div>}

        {gate === 'loading' && (
          <div style={st.centered}><div style={st.spinner} /></div>
        )}

        {gate === 'signedout' && (
          <div style={st.centered}>
            <p style={st.stateTitle}>Please sign in</p>
            <p style={st.stateText}>You need to be signed in as an admin to moderate reviews.</p>
          </div>
        )}

        {gate === 'forbidden' && (
          <div style={st.centered}>
            <p style={st.stateTitle}>Not authorised</p>
            <p style={st.stateText}>This account doesn&rsquo;t have admin access to reviews.</p>
          </div>
        )}

        {gate === 'ok' && (
          <>
            <Section title="Pending" count={pending.length} accent={CHAMP}>
              {pending.length === 0 ? (
                <p style={st.emptyNote}>Nothing waiting. New submissions appear here.</p>
              ) : (
                pending.map((r) => (
                  <ReviewCard key={r.id} r={r} busy={busyId === r.id}>
                    <button className="adm-btn" style={st.approveBtn} disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, 'approved')}>Approve</button>
                    <button className="adm-btn" style={st.rejectBtn} disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, 'rejected')}>Reject</button>
                  </ReviewCard>
                ))
              )}
            </Section>

            <Section title="Published" count={approved.length} accent={OK}>
              {approved.length === 0 ? (
                <p style={st.emptyNote}>No published reviews yet.</p>
              ) : (
                approved.map((r) => (
                  <ReviewCard key={r.id} r={r} busy={busyId === r.id}>
                    <button className="adm-btn" style={st.ghostBtn} disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, 'pending')}>Unpublish</button>
                  </ReviewCard>
                ))
              )}
            </Section>

            <Section title="Rejected" count={rejected.length} accent={BAD}>
              {rejected.length === 0 ? (
                <p style={st.emptyNote}>No rejected reviews.</p>
              ) : (
                rejected.map((r) => (
                  <ReviewCard key={r.id} r={r} busy={busyId === r.id}>
                    <button className="adm-btn" style={st.approveBtn} disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, 'approved')}>Approve</button>
                  </ReviewCard>
                ))
              )}
            </Section>
          </>
        )}
      </div>
    </main>
  )
}

function Section({ title, count, accent, children }: {
  title: string; count: number; accent: string; children: React.ReactNode
}) {
  return (
    <section style={st.section}>
      <div style={st.sectionHead}>
        <h2 style={st.sectionTitle}>{title}</h2>
        <span style={{ ...st.countPill, color: accent, borderColor: accent + '44', background: accent + '14' }}>{count}</span>
      </div>
      <div style={st.sectionBody}>{children}</div>
    </section>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
          fill={n <= rating ? CHAMP : 'none'}
          stroke={n <= rating ? CHAMP : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.4" strokeLinejoin="round">
          <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96z" />
        </svg>
      ))}
    </span>
  )
}

function ReviewCard({ r, busy, children }: {
  r: Review; busy: boolean; children: React.ReactNode
}) {
  const date = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{ ...st.card, opacity: busy ? 0.6 : 1 }}>
      <div style={st.cardTop}>
        <Stars rating={r.rating} />
        <span style={st.cardDate}>{date}</span>
      </div>
      <p style={st.quote}>&ldquo;{r.quote}&rdquo;</p>
      <p style={st.meta}>
        <span style={st.metaName}>{r.name}</span>
        {r.role ? <span style={st.metaRole}> · {r.role}</span> : null}
      </p>
      <div style={st.actions}>{children}</div>
    </div>
  )
}

const st: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
    padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)',
    display: 'flex',
    justifyContent: 'center',
  },
  shell: { width: '100%', maxWidth: '720px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '1.5rem',
  },
  eyebrow: {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
  },
  title: { fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', marginTop: '4px' },
  refreshBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)',
    borderRadius: '999px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorBar: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: BAD,
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
  },
  spinner: {
    width: '30px', height: '30px', borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.12)',
    borderTop: '2px solid rgba(255,255,255,0.7)',
    animation: 'admspin 0.75s linear infinite',
  },
  stateTitle: { fontSize: '1.05rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' },
  stateText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', maxWidth: '320px' },
  section: { marginBottom: '2rem' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.9rem' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.01em' },
  countPill: {
    fontSize: '0.72rem',
    fontWeight: 700,
    borderRadius: '999px',
    border: '1px solid',
    padding: '2px 9px',
    minWidth: '24px',
    textAlign: 'center',
  },
  sectionBody: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  emptyNote: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '16px 18px',
    transition: 'opacity 0.15s ease',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardDate: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' },
  quote: { fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)', marginBottom: '8px' },
  meta: { fontSize: '0.82rem', marginBottom: '14px' },
  metaName: { fontWeight: 600, color: 'rgba(255,255,255,0.8)' },
  metaRole: { color: 'rgba(255,255,255,0.4)' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  approveBtn: {
    background: OK, color: '#06210f', border: 'none', borderRadius: '999px',
    padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  rejectBtn: {
    background: 'rgba(248,113,113,0.12)', color: BAD, border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '999px', padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  ghostBtn: {
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '999px', padding: '8px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
}
