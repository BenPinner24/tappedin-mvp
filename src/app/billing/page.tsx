'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PlanKey = 'bronze' | 'silver' | 'gold'

const PLANS: { key: PlanKey; name: string; price: string; forWho: string; features: string[] }[] = [
  { key: 'bronze', name: 'Bronze', price: '£3.99', forWho: 'Individuals',      features: ['Live NFC card & digital profile', 'Core links + Save Contact & QR', 'Basic tap analytics', 'Connect with other members'] },
  { key: 'silver', name: 'Silver', price: '£7.99', forWho: 'Creators',         features: ['Everything in Bronze', 'Full analytics dashboard', 'Portfolio gallery + 1GB storage', 'Custom themes & styling', 'Priority support'] },
  { key: 'gold',   name: 'Gold',   price: '£4.99', forWho: 'Teams — per member', features: ['Everything in Silver, per member', 'Manager dashboard & team analytics', 'Team management & branding', '5-seat minimum'] },
]

const RANK: Record<PlanKey, number> = { bronze: 1, silver: 2, gold: 3 }

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [currentTier, setCurrentTier] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) { setSignedIn(false); return }
        setSignedIn(true)
        const { data: billing } = await supabase
          .from('user_billing')
          .select('subscription_tier, subscription_status')
          .eq('user_id', session.user.id)
          .maybeSingle()
        setCurrentTier(billing?.subscription_tier ?? null)
        setStatus(billing?.subscription_status ?? null)
      } catch {
        // ignore — treated as no active plan
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function choosePlan(tier: PlanKey) {
    setError(null)
    setBusy(tier)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  async function manageBilling() {
    setError(null)
    setBusy('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open billing.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  const hasPlan = !!currentTier && status !== 'canceled'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <main style={s.page}>
        <div style={s.wrap}>
          <header style={s.header}>
            <Link href="/dashboard" style={s.back}>← Dashboard</Link>
            <span style={s.brand}>TAPPED-IN</span>
          </header>

          <h1 style={s.h1}>Your plan</h1>
          <p style={s.sub}>
            Choose a membership to keep your card live and unlock more. Change or cancel anytime. Founders and early cardholders keep their special status.
          </p>

          {loading ? (
            <p style={s.muted}>Loading…</p>
          ) : !signedIn ? (
            <div style={s.notice}>
              <p style={s.noticeText}>Please <Link href="/login" style={s.link}>sign in</Link> to manage your plan.</p>
            </div>
          ) : (
            <>
              <div style={s.statusBar}>
                <div>
                  <span style={s.statusLabel}>Current plan</span>
                  <span style={s.statusValue}>
                    {hasPlan ? (currentTier as string).toUpperCase() : 'None'}
                    {status && hasPlan ? <span style={s.statusPill}>{status}</span> : null}
                  </span>
                </div>
                {hasPlan && (
                  <button onClick={manageBilling} disabled={busy === 'portal'} style={s.manageBtn}>
                    {busy === 'portal' ? 'Opening…' : 'Manage billing'}
                  </button>
                )}
              </div>

              {error && <p style={s.error}>{error}</p>}

              <div style={s.grid}>
                {PLANS.map((p) => {
                  const isCurrent = hasPlan && currentTier === p.key
                  const isUpgrade = hasPlan && currentTier ? RANK[p.key] > RANK[currentTier as PlanKey] : false
                  const label = isCurrent ? 'Current plan' : isUpgrade ? 'Upgrade' : hasPlan ? 'Switch' : 'Choose'
                  return (
                    <div key={p.key} style={{ ...s.card, ...(isCurrent ? s.cardCurrent : {}) }}>
                      <h3 style={s.cardName}>{p.name}</h3>
                      <p style={s.cardFor}>{p.forWho}</p>
                      <p style={s.cardPrice}>{p.price}<span style={s.per}>/mo</span></p>
                      <ul style={s.feats}>
                        {p.features.map((f) => (
                          <li key={f} style={s.feat}><span style={s.check}>✓</span>{f}</li>
                        ))}
                      </ul>
                      <button
                        disabled
                        style={s.btnCurrent}
                        title="Membership upgrades are launching soon"
                      >
                        Coming soon
                      </button>
                    </div>
                  )
                })}
              </div>

              <p style={s.foot}>
                Payments are handled securely by Stripe. Your card stays live while your membership is active — cancel anytime and your card pauses, but your data is always kept and you can reactivate whenever you like.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}

const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #070707; }
  .bill-btn:hover:not(:disabled) { background: #e8e8e8 !important; transform: translateY(-1px); }
`

const FF = `'DM Sans', system-ui, sans-serif`

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#070707', color: '#fff', fontFamily: FF, WebkitFontSmoothing: 'antialiased', padding: '2rem 1.25rem 4rem' },
  wrap: { maxWidth: 1080, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
  back: { fontSize: '.85rem', color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontWeight: 500 },
  brand: { fontSize: '.7rem', fontWeight: 700, letterSpacing: '.3em', color: 'rgba(255,255,255,.4)' },
  h1: { fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '.5rem' },
  sub: { fontSize: '.95rem', fontWeight: 300, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, maxWidth: 560, marginBottom: '2rem' },
  muted: { color: 'rgba(255,255,255,.4)', fontSize: '.9rem' },
  notice: { padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, background: 'rgba(255,255,255,0.02)' },
  noticeText: { color: 'rgba(255,255,255,.6)', fontSize: '.95rem' },
  link: { color: '#fff', textDecoration: 'underline' },

  statusBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.1rem 1.4rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, background: 'rgba(255,255,255,0.025)', marginBottom: '1.5rem' },
  statusLabel: { display: 'block', fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 4 },
  statusValue: { fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.6rem' },
  statusPill: { fontSize: '.6rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '3px 9px' },
  manageBtn: { padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: FF, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' },

  error: { color: '#fca5a5', fontSize: '.85rem', marginBottom: '1rem', fontWeight: 500 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { padding: '1.5rem 1.4rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, background: 'linear-gradient(155deg, rgba(15,15,15,0.9), rgba(9,9,9,0.95))', display: 'flex', flexDirection: 'column' },
  cardCurrent: { border: '1px solid rgba(255,255,255,0.28)', background: 'linear-gradient(155deg, rgba(22,22,22,0.95), rgba(11,11,11,0.98))' },
  cardName: { fontSize: '1.2rem', fontWeight: 700 },
  cardFor: { fontSize: '.74rem', color: 'rgba(255,255,255,.4)', marginTop: 2 },
  cardPrice: { fontSize: '1.8rem', fontWeight: 700, margin: '.9rem 0 1rem' },
  per: { fontSize: '.75rem', fontWeight: 300, color: 'rgba(255,255,255,.4)' },
  feats: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.25rem', flex: 1 },
  feat: { fontSize: '.8rem', fontWeight: 300, color: 'rgba(255,255,255,.6)', display: 'flex', gap: '7px', alignItems: 'flex-start', lineHeight: 1.4 },
  check: { color: 'rgba(255,255,255,.5)', flexShrink: 0 },
  btn: { padding: '12px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontFamily: FF, fontSize: '.82rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .18s, transform .18s' },
  btnCurrent: { padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,.5)', fontFamily: FF, fontSize: '.82rem', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'default' },

  foot: { fontSize: '.78rem', color: 'rgba(255,255,255,.32)', lineHeight: 1.6, textAlign: 'center' },
}
