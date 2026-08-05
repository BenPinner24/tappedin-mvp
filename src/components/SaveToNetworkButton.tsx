'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

const CHAMPAGNE = '#E8C9A0'

type Props = {
  profileUserId: string
  profileName: string
}

type ViewState =
  | 'checking'   // working out who's viewing
  | 'hidden'     // own profile / not logged in — show nothing
  | 'idle'       // can save
  | 'saving'
  | 'pending'    // saved, awaiting their save-back
  | 'mutual'     // fully connected
  | 'error'

export default function SaveToNetworkButton({ profileUserId, profileName }: Props) {
  const supabase = createClient()
  const [state, setState] = useState<ViewState>('checking')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!active) return

        // Not logged in, or viewing own profile → hide entirely
        if (!user || user.id === profileUserId) {
          setState('hidden')
          return
        }

        // Already connected? Check existing state so the button reflects reality.
        const [{ data: net }, { data: pend }] = await Promise.all([
          supabase.rpc('get_my_network'),
          supabase.rpc('get_pending_connections'),
        ])

        const alreadyMutual = ((net as { user_id: string }[]) ?? []).some(c => c.user_id === profileUserId)
        if (alreadyMutual) { setState('mutual'); return }

        // Have I already saved them (pending on my side)? get_pending_connections
        // returns people awaiting MY save-back, so it won't show that. We infer
        // "already saved by me" only via a mutual result; otherwise allow saving.
        // (Saving again is harmless — save_connection is idempotent.)
        void pend
        setState('idle')
      } catch {
        if (active) setState('hidden') // fail safe: don't show a broken button
      }
    })()
    return () => { active = false }
  }, [supabase, profileUserId])

  async function handleSave() {
    setState('saving')
    try {
      const { data, error } = await supabase.rpc('save_connection', { target_user_id: profileUserId })
      if (error) { setState('error'); return }
      setState(data === 'mutual' ? 'mutual' : 'pending')
    } catch {
      setState('error')
    }
  }

  if (state === 'checking' || state === 'hidden') return null

  const firstName = profileName.trim().split(' ')[0] || 'them'

  // Label + styling per state
  let label = `Save ${firstName} to network`
  let sub: string | null = null
  let disabled = false
  let showGlow = true

  if (state === 'saving') { label = 'Saving…'; disabled = true; showGlow = false }
  if (state === 'pending') { label = 'Saved ✓'; sub = `${firstName} can save you back`; disabled = true; showGlow = false }
  if (state === 'mutual') { label = 'Connected ✓'; sub = 'In your network'; disabled = true; showGlow = false }
  if (state === 'error') { label = 'Try again'; showGlow = false }

  const connected = state === 'pending' || state === 'mutual'

  return (
    <>
      <style>{`
        @keyframes tiNetGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(232,201,160,0.30), 0 4px 20px rgba(232,201,160,0.10); }
          50%      { box-shadow: 0 0 0 1px rgba(232,201,160,0.55), 0 6px 28px rgba(232,201,160,0.22); }
        }
        @keyframes tiNetStar {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        .ti-net-btn { transition: transform 0.16s ease, background 0.16s ease, opacity 0.16s ease; }
        .ti-net-btn.glow { animation: tiNetGlow 2.8s ease-in-out infinite; }
        .ti-net-btn:not(:disabled):hover { transform: translateY(-1px); }
        .ti-net-btn:not(:disabled):active { transform: translateY(0); }
        .ti-net-star { animation: tiNetStar 2.4s ease-in-out infinite; }
      `}</style>

      <button
        onClick={handleSave}
        disabled={disabled}
        className={`ti-net-btn${showGlow ? ' glow' : ''}`}
        style={{
          ...btn,
          ...(connected ? btnConnected : btnIdle),
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <span
          className={showGlow ? 'ti-net-star' : undefined}
          style={{ display: 'flex', flexShrink: 0 }}
        >
          {connected ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CHAMPAGNE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CHAMPAGNE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.4" />
              <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
              <path d="M18 8v6M15 11h6" />
            </svg>
          )}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span>{label}</span>
          {sub && <span style={subText}>{sub}</span>}
        </span>
      </button>
    </>
  )
}

const btn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
  width: '100%',
  padding: '0.85rem 1rem',
  marginBottom: '1.1rem',
  borderRadius: '14px',
  border: '1px solid rgba(232,201,160,0.35)',
  fontFamily: 'inherit',
  fontSize: '0.88rem',
  fontWeight: 600,
  letterSpacing: '0.01em',
  position: 'relative',
  zIndex: 1,
}

const btnIdle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(232,201,160,0.12) 0%, rgba(232,201,160,0.04) 100%)',
  color: '#fff',
}

const btnConnected: CSSProperties = {
  background: 'rgba(232,201,160,0.06)',
  color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(232,201,160,0.22)',
}

const subText: CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.01em',
}