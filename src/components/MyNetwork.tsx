'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { colors, font, radius, spacing, borders, transitions } from '@/lib/design'

const CHAMPAGNE = '#E8C9A0'

type Connection = {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: string | null
  connected_at?: string
  requested_at?: string
}

function initials(name: string | null, username: string | null): string {
  const base = (name || username || 'TI').trim()
  return base.slice(0, 2).toUpperCase()
}

export default function MyNetwork() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [network, setNetwork] = useState<Connection[]>([])
  const [pending, setPending] = useState<Connection[]>([])
  const [sent, setSent] = useState<Connection[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [{ data: net }, { data: pend }, { data: sentData }] = await Promise.all([
        supabase.rpc('get_my_network'),
        supabase.rpc('get_pending_connections'),
        supabase.rpc('get_sent_connections'),
      ])
      setNetwork((net as Connection[]) ?? [])
      setPending((pend as Connection[]) ?? [])
      setSent((sentData as Connection[]) ?? [])
    } catch {
      // silent — feature is additive, don't break the dashboard
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function saveBack(userId: string) {
    setBusy(userId)
    try {
      await supabase.rpc('save_connection', { target_user_id: userId })
      await load()
    } catch {
      // ignore
    } finally {
      setBusy(null)
    }
  }

  async function removeConnection(userId: string) {
    setBusy(userId)
    try {
      await supabase.rpc('remove_connection', { target_user_id: userId })
      setConfirmRemove(null)
      await load()
    } catch {
      // ignore
    } finally {
      setBusy(null)
    }
  }

  // Don't render anything while loading the very first time (keeps dashboard clean)
  if (loading) return null

  // If there's nothing at all, show a subtle empty state so the feature is discoverable
  const hasNothing = network.length === 0 && pending.length === 0 && sent.length === 0

  return (
    <div style={panel}>
      <div style={header}>
        <div>
          <p style={eyebrow}>My Network</p>
          <h3 style={title}>Connections</h3>
        </div>
        {network.length > 0 && (
          <span style={countPill}>{network.length}</span>
        )}
      </div>

      {/* Pending — people who saved you, awaiting save-back */}
      {pending.length > 0 && (
        <div style={{ marginBottom: spacing[4] }}>
          <p style={sectionLabel}>Wants to connect</p>
          {pending.map((p) => (
            <div key={p.user_id} style={pendingRow}>
              <div style={avatarWrap}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={avatarImg} />
                  : <span style={avatarInitials}>{initials(p.display_name, p.username)}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameText}>{p.display_name || p.username || 'Someone'}</div>
                {p.role && <div style={roleText}>{p.role}</div>}
              </div>
              <button
                onClick={() => saveBack(p.user_id)}
                disabled={busy === p.user_id}
                style={{ ...saveBackBtn, opacity: busy === p.user_id ? 0.6 : 1 }}
              >
                {busy === p.user_id ? 'Saving…' : 'Save back'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mutual connections */}
      {network.length > 0 && (
        <div>
          {pending.length > 0 && <p style={sectionLabel}>Saved</p>}
          {network.map((c) => (
            <div key={c.user_id} style={connRow}>
              <div style={avatarWrap}>
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" style={avatarImg} />
                  : <span style={avatarInitials}>{initials(c.display_name, c.username)}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameText}>{c.display_name || c.username || 'Connection'}</div>
                {c.role && <div style={roleText}>{c.role}</div>}
              </div>
              {confirmRemove === c.user_id ? (
                <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => removeConnection(c.user_id)}
                    disabled={busy === c.user_id}
                    style={confirmRemoveBtn}
                  >
                    {busy === c.user_id ? 'Removing…' : 'Remove'}
                  </button>
                  <button onClick={() => setConfirmRemove(null)} style={cancelBtn}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: spacing[3], flexShrink: 0, alignItems: 'center' }}>
                  {c.username && (
                    <Link href={`/u/${c.username}`} target="_blank" rel="noopener" style={viewLink}>
                      View →
                    </Link>
                  )}
                  <button
                    onClick={() => setConfirmRemove(c.user_id)}
                    style={removeIconBtn}
                    title="Remove connection"
                    aria-label="Remove connection"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sent — people I saved, awaiting their save-back */}
      {sent.length > 0 && (
        <div style={{ marginTop: network.length > 0 ? spacing[4] : 0 }}>
          <p style={sectionLabel}>Waiting on them</p>
          {sent.map((c) => (
            <div key={c.user_id} style={connRow}>
              <div style={avatarWrap}>
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" style={avatarImg} />
                  : <span style={avatarInitials}>{initials(c.display_name, c.username)}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameText}>{c.display_name || c.username || 'Connection'}</div>
                {c.role && <div style={roleText}>{c.role}</div>}
              </div>
              <span style={waitingTag}>Pending</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {hasNothing && (
        <div style={emptyState}>
          <div style={emptyIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="3.2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" />
              <circle cx="16.5" cy="10" r="2.6" stroke="rgba(232,201,160,0.4)" strokeWidth="1.3" />
              <path d="M3.5 19c0-2.8 2.4-4.6 5.5-4.6s5.5 1.8 5.5 4.6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M15 14.6c2.4.2 4.3 1.7 4.3 4" stroke="rgba(232,201,160,0.4)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <p style={emptyTitle}>No connections yet</p>
          <p style={emptyText}>
            When you tap someone&apos;s card while logged in, you can save them here — and they can save you back.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Styles (match dashboard's dark/champagne aesthetic) ───────────────────────

const panel: CSSProperties = {
  background: colors.bg.surface,
  border: borders.subtle,
  borderRadius: radius['2xl'],
  padding: spacing[5],
  boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 4px 16px rgba(0,0,0,0.25)',
  width: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: spacing[4],
}

const eyebrow: CSSProperties = {
  fontFamily: font.sans,
  fontSize: font.size['2xs'],
  fontWeight: font.weight.semibold,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.25)',
}

const title: CSSProperties = {
  fontSize: font.size.md,
  fontWeight: font.weight.semibold,
  color: colors.text.primary,
  marginTop: spacing[1],
  letterSpacing: '-0.01em',
}

const countPill: CSSProperties = {
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  color: CHAMPAGNE,
  background: 'rgba(232,201,160,0.1)',
  border: '1px solid rgba(232,201,160,0.25)',
  borderRadius: radius.full,
  padding: '3px 10px',
  minWidth: '26px',
  textAlign: 'center',
}

const sectionLabel: CSSProperties = {
  fontSize: font.size['2xs'],
  fontWeight: font.weight.semibold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.text.faint,
  marginBottom: spacing[3],
}

const rowBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
  padding: `${spacing[3]} 0`,
  borderBottom: `1px solid ${colors.border.subtle}`,
}

const connRow: CSSProperties = { ...rowBase }

const pendingRow: CSSProperties = {
  ...rowBase,
  background: 'linear-gradient(180deg, rgba(232,201,160,0.05), rgba(232,201,160,0.01))',
  border: '1px solid rgba(232,201,160,0.18)',
  borderRadius: radius.lg,
  padding: `${spacing[3]} ${spacing[3]}`,
  marginBottom: spacing[2],
}

const avatarWrap: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: radius.md,
  overflow: 'hidden',
  background: colors.white[5],
  border: borders.subtle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const avatarImg: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' }

const avatarInitials: CSSProperties = {
  fontSize: font.size.sm,
  fontWeight: font.weight.bold,
  color: 'rgba(255,255,255,0.4)',
}

const nameText: CSSProperties = {
  fontSize: font.size.sm,
  fontWeight: font.weight.semibold,
  color: colors.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const roleText: CSSProperties = {
  fontSize: font.size.xs,
  color: colors.text.muted,
  marginTop: '1px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const viewLink: CSSProperties = {
  fontSize: font.size.xs,
  fontWeight: font.weight.semibold,
  color: colors.text.muted,
  textDecoration: 'none',
  flexShrink: 0,
  transition: transitions.base,
}

const removeIconBtn: CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: radius.full,
  border: `1px solid ${colors.border.subtle}`,
  background: 'transparent',
  color: colors.text.muted,
  fontSize: '16px',
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: transitions.base,
}

const confirmRemoveBtn: CSSProperties = {
  padding: '5px 12px',
  borderRadius: radius.full,
  border: `1px solid ${colors.accent.errorBorder}`,
  background: colors.accent.errorBg,
  color: colors.accent.error,
  fontFamily: font.sans,
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  cursor: 'pointer',
  flexShrink: 0,
}

const cancelBtn: CSSProperties = {
  padding: '5px 12px',
  borderRadius: radius.full,
  border: `1px solid ${colors.border.subtle}`,
  background: 'transparent',
  color: colors.text.muted,
  fontFamily: font.sans,
  fontSize: font.size.xs,
  fontWeight: font.weight.semibold,
  cursor: 'pointer',
  flexShrink: 0,
}

const waitingTag: CSSProperties = {
  fontSize: font.size['2xs'],
  fontWeight: font.weight.semibold,
  color: colors.text.muted,
  background: colors.white[5],
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.full,
  padding: '3px 10px',
  letterSpacing: '0.04em',
  flexShrink: 0,
}

const saveBackBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 14px',
  borderRadius: radius.full,
  border: 'none',
  background: CHAMPAGNE,
  color: '#000',
  fontFamily: font.sans,
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  flexShrink: 0,
  transition: transitions.button,
}

const emptyState: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: `${spacing[6]} ${spacing[3]}`,
  gap: spacing[2],
}

const emptyIcon: CSSProperties = { marginBottom: spacing[1], opacity: 0.7 }

const emptyTitle: CSSProperties = {
  fontSize: font.size.base,
  fontWeight: font.weight.semibold,
  color: 'rgba(255,255,255,0.4)',
}

const emptyText: CSSProperties = {
  fontSize: font.size.xs,
  color: colors.text.faint,
  lineHeight: font.leading.relaxed,
  fontWeight: font.weight.light,
  maxWidth: '240px',
}