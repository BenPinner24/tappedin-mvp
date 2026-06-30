'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  colors,
  font,
  radius,
  spacing,
  borders,
  transitions,
  inputs,
} from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type ReviewProfile = {
  display_name: string | null
  role: string | null
} | null

type ReviewStatus = 'pending' | 'approved' | 'rejected'

const STAR = '#E8C9A0'
const MAX_CHARS = 280
const MIN_CHARS = 10

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewTab({
  profile,
  userId,
  hasCard,
  isMobile,
}: {
  profile: ReviewProfile
  userId: string | null
  hasCard: boolean
  isMobile: boolean
}) {
  const supabase = useMemo(() => createClient(), [])

  const [rating, setRating]     = useState(0)
  const [hover, setHover]       = useState(0)
  const [quote, setQuote]       = useState('')
  const [save, setSave]         = useState<SaveState>('idle')
  const [error, setError]       = useState<string | null>(null)
  const [existing, setExisting] = useState<ReviewStatus | null>(null)
  const [checking, setChecking] = useState(true)

  // ── Check whether this customer has already submitted ──────────────────────

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!userId) { setChecking(false); return }
      try {
        const { data } = await supabase
          .from('reviews')
          .select('status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled && (data?.status === 'pending' || data?.status === 'approved' || data?.status === 'rejected')) {
          setExisting(data.status as ReviewStatus)
        }
      } catch {
        /* table may not exist yet — treat as no existing review */
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [supabase, userId])

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function submit() {
    if (!userId) { setError('Please sign in again to leave a review.'); return }
    setError(null)
    if (rating < 1) { setError('Please choose a star rating.'); return }
    const q = quote.trim()
    if (q.length < MIN_CHARS) { setError('Please write a sentence or two about your experience.'); return }
    if (q.length > MAX_CHARS) { setError(`Please keep your review under ${MAX_CHARS} characters.`); return }
    try {
      setSave('saving')
      const { error: insErr } = await supabase.from('reviews').insert({
        user_id: userId,
        name: profile?.display_name?.trim() || 'Tapped-In member',
        role: profile?.role?.trim() || null,
        rating,
        quote: q,
        status: 'pending',
      })
      if (insErr) {
        setError(insErr.message)
        setSave('error')
        return
      }
      setSave('saved')
      setExisting('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSave('error')
    }
  }

  // ── Shared scoped styles ───────────────────────────────────────────────────

  const scoped = (
    <style>{`
      @keyframes revspin { to { transform: rotate(360deg); } }
      .ti-star-btn { transition: transform 0.12s ease; }
      .ti-star-btn:hover { transform: scale(1.12); }
      .ti-star-btn:active { transform: scale(0.95); }
      .ti-review-submit:hover:not(:disabled) { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,255,255,0.18) !important; }
      .ti-review-submit:active:not(:disabled) { transform: translateY(0) !important; }
    `}</style>
  )

  // ── Loading ────────────────────────────────────────────────────────────────

  if (checking) {
    return (
      <div style={rs.centeredState}>
        {scoped}
        <div style={rs.spinner} />
      </div>
    )
  }

  // ── Not a cardholder ─────────────────────────────────────────────────────────

  if (!hasCard) {
    return (
      <div style={rs.centeredState}>
        {scoped}
        <StarBadge dim />
        <p style={rs.stateTitle}>Reviews unlock with your card</p>
        <p style={rs.stateText}>
          Once your Tapped-In card is active and linked to your account, you&rsquo;ll be able to
          share your experience here.
        </p>
      </div>
    )
  }

  // ── Already submitted (pending) or just submitted ───────────────────────────

  if (save === 'saved' || existing === 'pending') {
    return (
      <div style={rs.centeredState}>
        {scoped}
        <StarBadge />
        <p style={rs.stateTitle}>Thank you — your review is in</p>
        <p style={rs.stateText}>
          It&rsquo;s awaiting a quick check before it goes live on our homepage. We appreciate you
          taking the time.
        </p>
      </div>
    )
  }

  // ── Already approved ─────────────────────────────────────────────────────────

  if (existing === 'approved') {
    return (
      <div style={rs.centeredState}>
        {scoped}
        <StarBadge />
        <p style={rs.stateTitle}>Your review is live</p>
        <p style={rs.stateText}>
          It&rsquo;s featured on our homepage — thank you for being part of Tapped-In.
        </p>
      </div>
    )
  }

  // ── Form (no review yet, or a previous one was not published) ────────────────

  const charCount = quote.trim().length
  const displayRating = hover || rating

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {scoped}

      <div style={{ marginBottom: spacing[5] }}>
        <p style={rs.subtitle}>
          Share your experience with Tapped-In. Once approved, your review appears on our
          homepage for everyone considering a card.
        </p>
        {profile?.display_name && (
          <p style={rs.postingAs}>
            Posting as <span style={rs.postingName}>{profile.display_name}</span>
            {profile.role ? <span style={rs.postingRole}> · {profile.role}</span> : null}
          </p>
        )}
      </div>

      {/* Star rating */}
      <div style={rs.field}>
        <label style={rs.label}>Your rating</label>
        <div style={rs.starRow} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= displayRating
            return (
              <button
                key={n}
                type="button"
                className="ti-star-btn"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                style={rs.starBtn}
              >
                <svg width={isMobile ? 30 : 34} height={isMobile ? 30 : 34} viewBox="0 0 24 24"
                  fill={filled ? STAR : 'none'}
                  stroke={filled ? STAR : 'rgba(255,255,255,0.28)'}
                  strokeWidth="1.4" strokeLinejoin="round">
                  <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96z" />
                </svg>
              </button>
            )
          })}
          <span style={rs.ratingHint}>
            {displayRating === 0 ? 'Tap to rate' : `${displayRating} / 5`}
          </span>
        </div>
      </div>

      {/* Written review */}
      <div style={rs.field}>
        <label style={rs.label}>Your review</label>
        <textarea
          value={quote}
          maxLength={MAX_CHARS}
          placeholder="What did Tapped-In change for you? Keep it real — a line or two is perfect."
          onChange={(e) => setQuote(e.target.value)}
          style={{ ...inputs.textarea, minHeight: '120px', fontFamily: font.sans }}
        />
        <div style={rs.counterRow}>
          <span style={rs.counterHint}>Min {MIN_CHARS} characters</span>
          <span style={{ ...rs.counter, color: charCount > MAX_CHARS - 20 ? colors.accent.warning : colors.text.ghost }}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {error && (
        <div style={rs.error}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="7" stroke={colors.accent.error} strokeWidth="1.5" />
            <path d="M8 5v4M8 11v.5" stroke={colors.accent.error} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      <div style={rs.footer}>
        <p style={rs.footerHint}>
          Every review is checked before it&rsquo;s published. Real cardholders only.
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={save === 'saving'}
          className="ti-review-submit"
          style={save === 'saving' ? rs.submitBtnBusy : rs.submitBtn}
        >
          {save === 'saving' ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </div>
  )
}

// ─── Star badge for empty / thank-you states ──────────────────────────────────

function StarBadge({ dim = false }: { dim?: boolean }) {
  const c = dim ? 'rgba(255,255,255,0.18)' : STAR
  return (
    <div style={{
      width: 46, height: 46, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dim ? 'rgba(255,255,255,0.03)' : 'rgba(232,201,160,0.08)',
      border: `1px solid ${dim ? 'rgba(255,255,255,0.08)' : 'rgba(232,201,160,0.22)'}`,
      marginBottom: spacing[1],
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={dim ? 'none' : c} stroke={c} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96z" />
      </svg>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rs: Record<string, CSSProperties> = {
  centeredState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: `${spacing[8]} ${spacing[4]}`,
    gap: spacing[2],
  },
  spinner: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.12)',
    borderTop: '2px solid rgba(255,255,255,0.7)',
    animation: 'revspin 0.75s linear infinite',
  },
  stateTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: font.tracking.snug,
  },
  stateText: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    fontWeight: font.weight.light,
    maxWidth: '300px',
  },
  subtitle: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    lineHeight: font.leading.normal,
  },
  postingAs: {
    fontSize: font.size.xs,
    color: colors.text.muted,
    marginTop: spacing[3],
    fontWeight: font.weight.regular,
  },
  postingName: {
    color: colors.text.secondary,
    fontWeight: font.weight.semibold,
  },
  postingRole: {
    color: colors.text.faint,
  },
  field: {
    marginBottom: spacing[5],
  },
  label: {
    display: 'block',
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: font.tracking.wide,
    marginBottom: spacing[3],
  },
  starRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap' as const,
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    lineHeight: 0,
  },
  ratingHint: {
    marginLeft: spacing[2],
    fontSize: font.size.xs,
    color: colors.text.muted,
    fontWeight: font.weight.medium,
    fontFamily: font.mono,
  },
  counterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  counterHint: {
    fontSize: font.size['2xs'],
    color: colors.text.ghost,
    fontWeight: font.weight.regular,
  },
  counter: {
    fontSize: font.size['2xs'],
    fontFamily: font.mono,
    color: colors.text.ghost,
  },
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[2],
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.accent.error,
    lineHeight: font.leading.normal,
    marginBottom: spacing[4],
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[6],
    paddingTop: spacing[5],
    borderTop: borders.subtle,
    flexWrap: 'wrap' as const,
  },
  footerHint: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    flex: 1,
    lineHeight: font.leading.normal,
    minWidth: '180px',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: `${spacing[3]} ${spacing[6]}`,
    borderRadius: radius.full,
    border: 'none',
    background: colors.white.full,
    color: '#000',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: transitions.button,
    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  },
  submitBtnBusy: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: `${spacing[3]} ${spacing[6]}`,
    borderRadius: radius.full,
    border: 'none',
    background: 'rgba(255,255,255,0.85)',
    color: '#000',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: '0.01em',
    cursor: 'not-allowed',
    opacity: 0.7,
    whiteSpace: 'nowrap' as const,
    transition: transitions.button,
  },
}
