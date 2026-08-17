'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// LockOverlay — a reusable frosted-glass lock used in two places:
//   • DORMANT   : a lapsed subscriber's content, faintly visible, "reactivate"
//   • TIER-LOCK : a premium feature the user doesn't have yet, "unlock with …"
//
// The content is always rendered underneath (so a dormant user is reassured
// their data still exists) but blurred + non-interactive, with a clean prompt
// centered on top. Blur strength + copy differ per use via props.
// ─────────────────────────────────────────────────────────────────────────────

type LockOverlayProps = {
  children: ReactNode
  // When false, LockOverlay renders its children untouched (no blur, no overlay).
  // Lets you wrap content once and switch the lock on/off with a single prop.
  enabled?: boolean
  // 'dormant'  → lighter blur, content reassuringly visible
  // 'locked'   → stronger blur, it's a preview of something not yet theirs
  variant?: 'dormant' | 'locked'
  title: string            // e.g. "Your card is paused"  /  "Full analytics"
  message: string          // one plain sentence of direction
  ctaLabel: string         // e.g. "Reactivate your card"  /  "Unlock with Silver"
  ctaHref?: string         // defaults to /billing
  // Optional: run an action on CTA click instead of navigating. When provided,
  // the CTA becomes a button that calls this (e.g. start a Stripe checkout).
  // When omitted, the CTA stays a normal link to ctaHref (unchanged behaviour).
  onCta?: () => void
  // Optional: disables the CTA + shows busy text while an action runs.
  ctaBusy?: boolean
  // Optional: how tall the frosted area should be if the children are short.
  minHeight?: number | string
}

const ACCENT = '#E8C9A0' // champagne — matches the brand accent

export default function LockOverlay({
  children,
  enabled = true,
  variant = 'dormant',
  title,
  message,
  ctaLabel,
  ctaHref = '/billing',
  onCta,
  ctaBusy = false,
  minHeight,
}: LockOverlayProps) {
  // Pass-through: when not enabled, render children exactly as-is.
  if (!enabled) return <>{children}</>
  const blur = variant === 'dormant' ? 6 : 11
  const dim = variant === 'dormant' ? 0.55 : 0.4

  const wrap: CSSProperties = {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    ...(minHeight ? { minHeight } : {}),
  }

  // The real content — visible but blurred and non-interactive.
  const contentLayer: CSSProperties = {
    filter: `blur(${blur}px)`,
    opacity: dim,
    pointerEvents: 'none',
    userSelect: 'none',
    // isolate so the blur doesn't bleed outside the rounded frame
    transform: 'translateZ(0)',
  }

  // The frosted sheet + prompt on top.
  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '0.85rem',
    padding: '2rem 1.5rem',
    background:
      variant === 'dormant'
        ? 'linear-gradient(180deg, rgba(8,8,8,0.35), rgba(8,8,8,0.55))'
        : 'linear-gradient(180deg, rgba(8,8,8,0.45), rgba(8,8,8,0.65))',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 2,
  }

  return (
    <div style={wrap}>
      <div style={contentLayer} aria-hidden="true">
        {children}
      </div>

      <div style={overlay}>
        {/* Lock mark */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: `1px solid ${ACCENT}55`,
            background: `${ACCENT}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.15rem',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" />
          </svg>
        </div>

        <div
          style={{
            fontFamily: `var(--font-dm-sans), 'DM Sans', system-ui, sans-serif`,
            fontSize: '1.05rem',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </div>

        <p
          style={{
            fontFamily: `var(--font-dm-sans), 'DM Sans', system-ui, sans-serif`,
            fontSize: '0.86rem',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            maxWidth: 300,
            margin: 0,
          }}
        >
          {message}
        </p>

        {onCta ? (
          <button
            onClick={onCta}
            disabled={ctaBusy}
            style={{
              marginTop: '0.35rem',
              display: 'inline-block',
              padding: '0.7rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: ACCENT,
              color: '#1a1206',
              fontFamily: `var(--font-dm-sans), 'DM Sans', system-ui, sans-serif`,
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
              cursor: ctaBusy ? 'not-allowed' : 'pointer',
              opacity: ctaBusy ? 0.7 : 1,
            }}
          >
            {ctaBusy ? 'Loading…' : ctaLabel}
          </button>
        ) : (
          <Link
            href={ctaHref}
            style={{
              marginTop: '0.35rem',
              display: 'inline-block',
              padding: '0.7rem 1.5rem',
              borderRadius: 10,
              background: ACCENT,
              color: '#1a1206',
              fontFamily: `var(--font-dm-sans), 'DM Sans', system-ui, sans-serif`,
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}