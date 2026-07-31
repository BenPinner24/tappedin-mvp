'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function TeamDashboardLink() {
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active || !user) return
      const { data: mgr } = await supabase
        .from('company_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle()
      if (active) setIsManager(!!mgr)
    })()
    return () => { active = false }
  }, [])

  if (!isManager) return null

  return (
    <Link href="/teams" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'linear-gradient(135deg, rgba(232,201,160,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(232,201,160,0.20)', borderRadius: '16px',
      padding: '16px 20px', textDecoration: 'none', color: '#fff',
      transition: 'transform 0.18s ease, background 0.18s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{
          flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(232,201,160,0.10)', border: '1px solid rgba(232,201,160,0.25)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8C9A0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        <span>
          <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
            Team dashboard
          </span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            View your company&apos;s card activity and team insights.
          </span>
        </span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#E8C9A0' }}>
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}