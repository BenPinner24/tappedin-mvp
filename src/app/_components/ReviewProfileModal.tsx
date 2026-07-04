'use client'

import { useEffect, useState } from 'react'

type PreviewData = {
  username: string
  display_name: string
  role: string
  bio: string | null
  avatar_url: string | null
  accent_color: string
  links: { id: string; label: string }[]
}

export function ReviewProfileModal({
  username,
  onClose,
}: {
  username: string
  onClose: () => void
}) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    setData(null)
    fetch(`/api/profile-preview/${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (alive) {
          setData(d)
          setState('ready')
        }
      })
      .catch(() => {
        if (alive) setState('error')
      })
    return () => {
      alive = false
    }
  }, [username])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const accent = data?.accent_color || '#e8e1d2'
  const initials = (data?.display_name || username)
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(3,3,3,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'tiRpmFade .28s ease both',
      }}
    >
      <style>{`@keyframes tiRpmFade{from{opacity:0}to{opacity:1}}@keyframes tiRpmRise{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          background: 'linear-gradient(155deg, rgba(16,16,16,0.98), rgba(9,9,9,0.99))',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 22,
          padding: '2rem 1.6rem 1.75rem',
          boxShadow: '0 50px 120px rgba(0,0,0,0.75)',
          animation: 'tiRpmRise .4s cubic-bezier(0.16,1,0.3,1) both',
          maxHeight: '88vh',
          overflowY: 'auto',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: 15,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {state === 'loading' && (
          <div
            style={{
              padding: '3rem 0',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Loading profile…
          </div>
        )}

        {state === 'error' && (
          <div style={{ padding: '3rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Couldn&apos;t load this profile right now.
          </div>
        )}

        {state === 'ready' && data && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 22,
                  border: `1px solid ${accent}`,
                  boxShadow: `0 0 18px ${accent}44`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(148deg,#1a1a1a,#111)',
                  marginBottom: 16,
                }}
              >
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt={data.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                    {initials}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 10,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.28)',
                  marginBottom: 6,
                }}
              >
                Verified profile
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 600, color: '#fff', lineHeight: 1.05 }}>
                {data.display_name}
              </div>
              {data.role && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{data.role}</div>}
              {data.bio && (
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginTop: 12, maxWidth: 300, whiteSpace: 'pre-line' }}>
                  {data.bio}
                </p>
              )}
            </div>

            {data.links.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                {data.links.map((l) => (
                  <a
                    key={l.id}
                    href={`/r/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <span>{l.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                  </a>
                ))}
              </div>
            )}

            <a
              href={`/u/${data.username}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 20,
                padding: '14px',
                borderRadius: 12,
                background: '#fff',
                color: '#000',
                textDecoration: 'none',
                fontFamily: "'Oswald', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              View full profile →
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default ReviewProfileModal
