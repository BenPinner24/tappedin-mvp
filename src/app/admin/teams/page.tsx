'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

type Company = { id: string; name: string; card_count: number }

type Lookup = {
  email: string
  found: boolean
  userId: string | null
  alreadyInCompany: boolean
  existingCompanyId: string | null
  existingRole: string | null
  bindable: boolean
  message: string
}

type ManagerResult = {
  action: 'bind_manager' | 'unbind_manager'
  affectedCount: number
  message: string
}

type TeamMember = {
  user_id: string
  email: string
  role: string
  isGold: boolean
  subscription_tier: string | null
  subscription_status: string | null
  card_id: string | null
}

type NewCardRow = { card_id: string; nfc_url: string | null }

type CreatedCompany = { id: string; name: string; join_code: string }

type Gate = 'loading' | 'signedout' | 'forbidden' | 'ok'

const CHAMP = '#E8C9A0'
const OK = '#4ade80'
const BAD = '#f87171'

export default function AdminTeamsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [gate, setGate]           = useState<Gate>('loading')
  const [token, setToken]         = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [error, setError]         = useState<string | null>(null)

  // ── Manager-binding tool: its own state throughout ──────────────────────
  const [mgrCompanyId, setMgrCompanyId] = useState<string>('')
  const [mgrEmail, setMgrEmail]         = useState<string>('')
  const [lookup, setLookup]             = useState<Lookup | null>(null)
  const [lookedUpEmail, setLookedUpEmail] = useState<string | null>(null)
  const [mgrBusy, setMgrBusy]           = useState(false)
  const [mgrPending, setMgrPending]     = useState<'bind_manager' | 'unbind_manager' | null>(null)
  const [mgrResult, setMgrResult]       = useState<ManagerResult | null>(null)

  // ── Team Gold tool: its own state throughout ────────────────────────
  const [goldCompanyId, setGoldCompanyId] = useState<string>('')
  const [team, setTeam]                   = useState<TeamMember[] | null>(null)
  const [goldBusy, setGoldBusy]           = useState(false)
  const [goldPending, setGoldPending]     = useState<{ member: TeamMember; grant: boolean } | null>(null)
  const [goldResult, setGoldResult]       = useState<string | null>(null)

  // ── Create Company tool: its own state throughout ─────────────────────
  const [newName, setNewName]         = useState('')
  const [newPrefix, setNewPrefix]     = useState('')
  const [newCount, setNewCount]       = useState('50')
  const [createBusy, setCreateBusy]   = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [created, setCreated]         = useState<CreatedCompany | null>(null)
  const [newCards, setNewCards]       = useState<NewCardRow[] | null>(null)
  const [viewCompanyId, setViewCompanyId] = useState('')
  const [viewCards, setViewCards]     = useState<NewCardRow[] | null>(null)
  const [viewBusy, setViewBusy]       = useState(false)
  const [copied, setCopied]           = useState<string | null>(null)

  const fetchCompanies = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/teams', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not load companies')
        setGate('ok')
        return
      }
      const j = await res.json()
      setCompanies(j.companies ?? [])
      setError(null)
      setGate('ok')
    } catch {
      setError('Network error loading companies')
      setGate('ok')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) { if (!cancelled) setGate('signedout'); return }
      if (!cancelled) { setToken(accessToken); await fetchCompanies(accessToken) }
    }
    init()
    return () => { cancelled = true }
  }, [supabase, fetchCompanies])

  // ── Manager lookup (preview only — writes nothing) ──────────────────────
  async function runLookup() {
    if (!token) return
    const email = mgrEmail.trim()
    if (!email) { setError('Enter an email to look up.'); return }
    setMgrBusy(true)
    setError(null)
    setMgrResult(null)
    setMgrPending(null)
    try {
      const res = await fetch(`/api/admin/teams?lookupEmail=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Lookup failed')
        return
      }
      const j = await res.json()
      setCompanies(j.companies ?? [])
      setLookup(j.lookup ?? null)
      setLookedUpEmail(email.toLowerCase())
    } catch {
      setError('Network error running lookup')
    } finally {
      setMgrBusy(false)
    }
  }

  async function runManagerAction(action: 'bind_manager' | 'unbind_manager') {
    if (!token) return
    setMgrBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, companyId: mgrCompanyId, managerEmail: mgrEmail.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        setError(j.error || 'Update failed')
        return
      }
      setMgrResult({
        action: j.action,
        affectedCount: j.affectedCount ?? 0,
        message: j.message ?? '',
      })
      setMgrPending(null)
      // Re-read so the preview reflects the new state of that account.
      await runLookup()
    } catch {
      setError('Network error')
    } finally {
      setMgrBusy(false)
    }
  }

  // ── Create Company ─────────────────────────────────────────────
  async function runCreateCompany() {
    if (!token) return
    setCreateBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create_company',
          companyName: newName.trim(),
          prefix: newPrefix.trim().toLowerCase(),
          cardCount: Number(newCount),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        setError(j.error || 'Could not create the company')
        return
      }
      setCreated(j.company ?? null)
      setNewCards(j.cards ?? [])
      setCreatePending(false)
      setNewName(''); setNewPrefix('')
      // Refresh the company list so the new one is immediately selectable.
      await fetchCompanies(token)
    } catch {
      setError('Network error creating the company')
    } finally {
      setCreateBusy(false)
    }
  }

  async function loadCompanyCards(id: string) {
    if (!token || !id) { setViewCards(null); return }
    setViewBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/teams?companyCards=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not load that company\u2019s cards')
        return
      }
      const j = await res.json()
      setViewCards(j.companyCards ?? [])
    } catch {
      setError('Network error loading cards')
    } finally {
      setViewBusy(false)
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400)
    } catch {
      setError('Could not copy to the clipboard')
    }
  }

  // ── Team Gold: load the roster (read-only) ─────────────────────────
  const loadTeam = useCallback(async (accessToken: string, companyForTeam: string) => {
    if (!companyForTeam) { setTeam(null); return }
    setGoldBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/teams?teamForCompany=${encodeURIComponent(companyForTeam)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not load the team')
        return
      }
      const j = await res.json()
      setCompanies(j.companies ?? [])
      setTeam(j.team ?? [])
    } catch {
      setError('Network error loading the team')
    } finally {
      setGoldBusy(false)
    }
  }, [])

  async function runGoldAction(member: TeamMember, grant: boolean) {
    if (!token) return
    setGoldBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: grant ? 'grant_gold' : 'revoke_gold', userId: member.user_id }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { setGate('signedout'); return }
      if (res.status === 403) { setGate('forbidden'); return }
      if (!res.ok) {
        setError(j.error || 'Update failed')
        return
      }
      setGoldResult(`${member.email}: ${j.message ?? ''}`)
      setGoldPending(null)
      // Re-read so the table shows the true current state.
      await loadTeam(token, goldCompanyId)
    } catch {
      setError('Network error')
    } finally {
      setGoldBusy(false)
    }
  }

  const mgrCompany = companies.find((c) => c.id === mgrCompanyId) ?? null
  const emailIsLookedUp = lookedUpEmail !== null && lookedUpEmail === mgrEmail.trim().toLowerCase()
  const canBind = Boolean(token) && !mgrBusy && mgrCompanyId !== '' && emailIsLookedUp && lookup !== null && lookup.bindable
  const canUnbind = Boolean(token) && !mgrBusy && mgrCompanyId !== '' && emailIsLookedUp && lookup !== null && lookup.found

  const goldCompany = companies.find((c) => c.id === goldCompanyId) ?? null

  const countNum = Number(newCount)
  const canCreate = Boolean(token) && !createBusy
    && newName.trim() !== '' && /^[a-z0-9-]+$/.test(newPrefix.trim().toLowerCase())
    && Number.isInteger(countNum) && countNum >= 1 && countNum <= 500
  const viewCompany = companies.find((c) => c.id === viewCompanyId) ?? null
  const goldCount = (team ?? []).filter((m) => m.isGold).length
  const freeCount = (team ?? []).length - goldCount

  return (
    <main style={st.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes admspin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        .adm-btn { transition: transform 0.12s ease, opacity 0.12s ease, background 0.12s ease; }
        .adm-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-select { color: #ffffff; background-color: #141414; }
        .adm-select option { color: #ffffff; background-color: #141414; }
        .adm-select option:checked { color: #ffffff; background-color: #262626; }
      `}</style>

      <div style={st.shell}>
        <div style={st.header}>
          <div>
            <p style={st.eyebrow}>Tapped-In · Admin</p>
            <h1 style={st.title}>Teams — card assignment</h1>
          </div>
          {gate === 'ok' && (
            <button
              className="adm-btn"
              style={st.refreshBtn}
              onClick={() => token && fetchCompanies(token)}
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
            <p style={st.stateText}>You need to be signed in as an admin to manage team cards.</p>
          </div>
        )}

        {gate === 'forbidden' && (
          <div style={st.centered}>
            <p style={st.stateTitle}>Not authorised</p>
            <p style={st.stateText}>This account doesn&rsquo;t have admin access to team cards.</p>
          </div>
        )}

        {gate === 'ok' && (
          <>
            {/* ══════════════════════════════════════════════
                STEP 0 — create a company and its card batch. Entirely separate
                state; nothing here touches the three tools below.
            ══════════════════════════════════════════════ */}
            <section style={st.section}>
              <div style={st.sectionHead}>
                <h2 style={st.sectionTitle}>0 · Create a company</h2>
              </div>
              <div style={st.sectionBody}>
                <p style={st.hint}>
                  Creates the company and its cards in one go. Bind the real manager
                  afterwards with the tool below — until then you are the owner.
                </p>

                <div style={st.createGrid}>
                  <div style={{ minWidth: 0 }}>
                    <label style={st.label} htmlFor="adm-new-name">Company name</label>
                    <input
                      id="adm-new-name"
                      style={st.input}
                      value={newName}
                      placeholder="Acme Ltd"
                      onChange={(e) => { setNewName(e.target.value); setCreatePending(false) }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={st.label} htmlFor="adm-new-prefix">Prefix</label>
                    <input
                      id="adm-new-prefix"
                      style={st.input}
                      value={newPrefix}
                      placeholder="acme"
                      onChange={(e) => { setNewPrefix(e.target.value); setCreatePending(false) }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={st.label} htmlFor="adm-new-count">Cards</label>
                    <input
                      id="adm-new-count"
                      style={st.input}
                      type="number"
                      min={1}
                      max={500}
                      value={newCount}
                      onChange={(e) => { setNewCount(e.target.value); setCreatePending(false) }}
                    />
                  </div>
                </div>

                <p style={st.previewNote}>
                  Card IDs will look like{' '}
                  <span style={st.mono}>{(newPrefix.trim().toLowerCase() || 'prefix')}-001-a1b2c3d4</span>
                  {' '}· batch_id <span style={st.mono}>{newPrefix.trim().toLowerCase() || 'prefix'}</span>
                </p>

                {!createPending ? (
                  <div style={st.actions}>
                    <button
                      className="adm-btn"
                      style={st.approveBtn}
                      disabled={!canCreate}
                      onClick={() => { setCreated(null); setNewCards(null); setCreatePending(true) }}
                    >
                      Create company &amp; cards
                    </button>
                  </div>
                ) : (
                  <div style={st.confirmBox}>
                    <p style={st.confirmTitle}>Create this company?</p>
                    <p style={st.confirmText}>
                      {`“${newName.trim()}” will be created with ${countNum} card${countNum === 1 ? '' : 's'} in batch “${newPrefix.trim().toLowerCase()}”. Nothing else is affected.`}
                    </p>
                    <div style={st.actions}>
                      <button className="adm-btn" style={st.approveBtn} disabled={createBusy} onClick={runCreateCompany}>
                        {createBusy ? 'Creating…' : 'Yes, create'}
                      </button>
                      <button className="adm-btn" style={st.ghostBtn} disabled={createBusy} onClick={() => setCreatePending(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {created && newCards && (
                  <>
                    <div style={{ ...st.resultBox, borderColor: OK + '44', background: OK + '10' }}>
                      <p style={{ ...st.resultTitle, color: OK }}>
                        {`Created “${created.name}” with ${newCards.length} card${newCards.length === 1 ? '' : 's'}.`}
                      </p>
                      <p style={st.resultIds}>Join code: {created.join_code} · id: {created.id}</p>
                    </div>
                    <CardTable rows={newCards} keyPrefix="new" copied={copied} onCopy={copyText} />
                  </>
                )}

                {/* ── View an existing company's cards ── */}
                <div style={st.subDivider} />
                <div className="adm-subhead" style={st.subHead}>View existing company cards</div>
                <label style={st.label} htmlFor="adm-view-company">Company</label>
                <select
                  id="adm-view-company"
                  className="adm-select"
                  style={st.select}
                  value={viewCompanyId}
                  onChange={(e) => {
                    const next = e.target.value
                    setViewCompanyId(next)
                    setViewCards(null)
                    if (next) loadCompanyCards(next)
                  }}
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.card_count} card{c.card_count === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>

                {viewCompanyId === '' && (
                  <p style={st.emptyNote}>Choose a company to see the URL list for its cards.</p>
                )}
                {viewCompanyId !== '' && viewCards === null && (
                  <p style={st.emptyNote}>{viewBusy ? 'Loading cards…' : 'No cards loaded.'}</p>
                )}
                {viewCards !== null && viewCards.length === 0 && (
                  <p style={st.emptyNote}>{viewCompany?.name ?? 'This company'} has no cards yet.</p>
                )}
                {viewCards !== null && viewCards.length > 0 && (
                  <CardTable rows={viewCards} keyPrefix="view" copied={copied} onCopy={copyText} />
                )}
              </div>
            </section>

            <div style={st.toolDivider} />

            <section style={st.section}>
              <div style={st.sectionHead}>
                <h2 style={st.sectionTitle}>Bind a team manager</h2>
              </div>
              <div style={st.sectionBody}>
                <p style={st.hint}>
                  Makes an existing account the manager of a company and switches on
                  company_enabled. A user can only belong to one company.
                </p>

                <label style={st.label} htmlFor="adm-mgr-company">Company</label>
                <select
                  id="adm-mgr-company"
                  className="adm-select"
                  style={st.select}
                  value={mgrCompanyId}
                  onChange={(e) => { setMgrCompanyId(e.target.value); setMgrPending(null); setMgrResult(null) }}
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.card_count} card{c.card_count === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>

                <label style={st.label} htmlFor="adm-mgr-email">Manager email</label>
                <div style={st.row}>
                  <input
                    id="adm-mgr-email"
                    style={st.input}
                    type="email"
                    value={mgrEmail}
                    placeholder="manager@company.com"
                    onChange={(e) => { setMgrEmail(e.target.value); setMgrPending(null); setMgrResult(null) }}
                  />
                  <button className="adm-btn" style={st.previewBtn} disabled={mgrBusy || !mgrEmail.trim()} onClick={runLookup}>
                    {mgrBusy ? 'Working…' : 'Look up'}
                  </button>
                </div>

                {lookup === null && (
                  <p style={st.emptyNote}>Look up an email to see who it resolves to. Nothing is written by looking up.</p>
                )}

                {lookup !== null && (
                  <div style={{
                    ...st.resultBox,
                    borderColor: lookup.bindable ? OK + '44' : (lookup.found ? CHAMP + '44' : 'rgba(248,113,113,0.3)'),
                    background: lookup.bindable ? OK + '10' : (lookup.found ? CHAMP + '10' : 'rgba(248,113,113,0.08)'),
                  }}>
                    <p style={{
                      ...st.resultTitle,
                      color: lookup.bindable ? OK : (lookup.found ? CHAMP : BAD),
                    }}>
                      {lookup.bindable ? 'BINDABLE' : (lookup.found ? 'NOT BINDABLE' : 'NO ACCOUNT')}
                    </p>
                    <p style={st.confirmText}>{lookup.message}</p>
                    {lookup.userId && <p style={st.resultIds}>user_id: {lookup.userId}</p>}
                  </div>
                )}

                {!emailIsLookedUp && (
                  <p style={st.emptyNote}>
                    Look the email up first. The buttons unlock once you&rsquo;ve seen who it resolves to.
                  </p>
                )}

                {mgrPending === null ? (
                  <div style={st.actions}>
                    <button
                      className="adm-btn"
                      style={st.approveBtn}
                      disabled={!canBind}
                      onClick={() => { setMgrResult(null); setMgrPending('bind_manager') }}
                    >
                      Bind as manager
                    </button>
                    <button
                      className="adm-btn"
                      style={st.rejectBtn}
                      disabled={!canUnbind}
                      onClick={() => { setMgrResult(null); setMgrPending('unbind_manager') }}
                    >
                      Un-bind manager
                    </button>
                  </div>
                ) : (
                  <div style={st.confirmBox}>
                    <p style={st.confirmTitle}>
                      {mgrPending === 'bind_manager' ? 'Bind this manager?' : 'Un-bind this manager?'}
                    </p>
                    <p style={st.confirmText}>
                      {mgrPending === 'bind_manager'
                        ? `${lookup?.email ?? mgrEmail.trim()} will become a manager of ${mgrCompany?.name ?? 'the selected company'}, and company_enabled will be set to true.`
                        : `${lookup?.email ?? mgrEmail.trim()} will be removed as a manager of ${mgrCompany?.name ?? 'the selected company'}, and company_enabled will be set to false.`}
                    </p>
                    <div style={st.actions}>
                      <button
                        className="adm-btn"
                        style={mgrPending === 'bind_manager' ? st.approveBtn : st.rejectBtn}
                        disabled={mgrBusy}
                        onClick={() => runManagerAction(mgrPending)}
                      >
                        {mgrBusy ? 'Working…' : 'Yes, confirm'}
                      </button>
                      <button className="adm-btn" style={st.ghostBtn} disabled={mgrBusy} onClick={() => setMgrPending(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {mgrResult && (
                  <div style={{
                    ...st.resultBox,
                    borderColor: mgrResult.affectedCount > 0 ? OK + '44' : 'rgba(255,255,255,0.12)',
                    background: mgrResult.affectedCount > 0 ? OK + '10' : 'rgba(255,255,255,0.03)',
                  }}>
                    <p style={{ ...st.resultTitle, color: mgrResult.affectedCount > 0 ? OK : 'rgba(255,255,255,0.6)' }}>
                      {mgrResult.message}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ══════════════════════════════════════════════
                THIRD TOOL — team Gold management. Separate state again;
                nothing here touches the two tools above.
            ══════════════════════════════════════════════ */}
            <div style={st.toolDivider} />

            <section style={st.section}>
              <div style={st.sectionHead}>
                <h2 style={st.sectionTitle}>Team Gold management</h2>
              </div>
              <div style={st.sectionBody}>
                <p style={st.hint}>
                  Grant or revoke Gold for individual members. Gold means
                  subscription_tier &lsquo;gold&rsquo; and subscription_status &lsquo;active&rsquo;.
                </p>

                <label style={st.label} htmlFor="adm-gold-company">Company</label>
                <select
                  id="adm-gold-company"
                  className="adm-select"
                  style={st.select}
                  value={goldCompanyId}
                  onChange={(e) => {
                    const next = e.target.value
                    setGoldCompanyId(next)
                    setGoldPending(null)
                    setGoldResult(null)
                    setTeam(null)
                    if (token && next) loadTeam(token, next)
                  }}
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.card_count} card{c.card_count === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>

                {goldCompanyId === '' && (
                  <p style={st.emptyNote}>Choose a company to see its team.</p>
                )}

                {goldCompanyId !== '' && team === null && (
                  <p style={st.emptyNote}>{goldBusy ? 'Loading the team…' : 'No team loaded.'}</p>
                )}

                {team !== null && team.length === 0 && (
                  <p style={st.emptyNote}>
                    {goldCompany?.name ?? 'This company'} has no members yet. Bind a manager first.
                  </p>
                )}

                {team !== null && team.length > 0 && (
                  <>
                    {/* Summary — paid-seat count at a glance */}
                    <div style={st.summaryRow}>
                      <span style={{ ...st.summaryPill, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)' }}>
                        {team.length} member{team.length === 1 ? '' : 's'}
                      </span>
                      <span style={{ ...st.summaryPill, color: CHAMP, borderColor: CHAMP + '44', background: CHAMP + '14' }}>
                        {goldCount} on Gold
                      </span>
                      <span style={{ ...st.summaryPill, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                        {freeCount} on Free
                      </span>
                    </div>

                    {/* Table */}
                    <div style={st.tableWrap}>
                      <div style={st.tableHead}>
                        <span style={st.colMember}>Member</span>
                        <span style={st.colRole}>Role</span>
                        <span style={st.colGold}>Gold</span>
                        <span style={st.colCard}>Card</span>
                        <span style={st.colAction}>Action</span>
                      </div>

                      {team.map((m) => {
                        const isManager = m.role === 'manager'
                        return (
                          <div
                            key={m.user_id}
                            style={{
                              ...st.tableRow,
                              ...(isManager ? st.managerRow : null),
                            }}
                          >
                            <span style={st.colMember}>
                              <span style={st.memberEmail}>{m.email}</span>
                              <span style={st.memberId}>{m.user_id}</span>
                            </span>

                            <span style={st.colRole}>
                              <span style={{
                                ...st.tag,
                                color: isManager ? CHAMP : 'rgba(255,255,255,0.45)',
                                borderColor: isManager ? CHAMP + '55' : 'rgba(255,255,255,0.12)',
                                background: isManager ? CHAMP + '18' : 'rgba(255,255,255,0.03)',
                              }}>
                                {isManager ? 'MANAGER' : 'EMPLOYEE'}
                              </span>
                            </span>

                            <span style={st.colGold}>
                              <span style={{
                                ...st.tag,
                                color: m.isGold ? CHAMP : 'rgba(255,255,255,0.4)',
                                borderColor: m.isGold ? CHAMP + '66' : 'rgba(255,255,255,0.12)',
                                background: m.isGold ? CHAMP + '1e' : 'rgba(255,255,255,0.03)',
                              }}>
                                {m.isGold ? 'GOLD' : 'FREE'}
                              </span>
                            </span>

                            <span style={st.colCard}>
                              {m.card_id
                                ? <span style={st.cardIdCell}>{m.card_id}</span>
                                : <span style={st.noCardCell}>None</span>}
                            </span>

                            <span style={st.colAction}>
                              <button
                                className="adm-btn"
                                style={m.isGold ? st.rejectBtnSm : st.approveBtnSm}
                                disabled={goldBusy}
                                onClick={() => { setGoldResult(null); setGoldPending({ member: m, grant: !m.isGold }) }}
                              >
                                {m.isGold ? 'Revoke Gold' : 'Grant Gold'}
                              </button>
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Confirm before any write */}
                    {goldPending && (
                      <div style={st.confirmBox}>
                        <p style={st.confirmTitle}>
                          {goldPending.grant ? 'Grant Gold?' : 'Revoke Gold?'}
                        </p>
                        <p style={st.confirmText}>
                          {goldPending.grant
                            ? `${goldPending.member.email} (${goldPending.member.role}) will be set to gold / active — a paid seat.`
                            : `${goldPending.member.email} (${goldPending.member.role}) will be moved to the free plan.`}
                          {goldPending.member.role === 'manager' && !goldPending.grant
                            ? ' This is the MANAGER — their seat is normally always paid.'
                            : ''}
                        </p>
                        <div style={st.actions}>
                          <button
                            className="adm-btn"
                            style={goldPending.grant ? st.approveBtn : st.rejectBtn}
                            disabled={goldBusy}
                            onClick={() => runGoldAction(goldPending.member, goldPending.grant)}
                          >
                            {goldBusy ? 'Working…' : 'Yes, confirm'}
                          </button>
                          <button className="adm-btn" style={st.ghostBtn} disabled={goldBusy} onClick={() => setGoldPending(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {goldResult && (
                      <div style={{ ...st.resultBox, borderColor: OK + '44', background: OK + '10' }}>
                        <p style={{ ...st.resultTitle, color: OK }}>{goldResult}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

// Shared by “just created” and “view existing” so both lists look identical.
function CardTable({ rows, keyPrefix, copied, onCopy }: {
  rows: NewCardRow[]
  keyPrefix: string
  copied: string | null
  onCopy: (text: string, key: string) => void
}) {
  const allUrls = rows.map((r) => r.nfc_url ?? '').filter(Boolean).join('\n')
  return (
    <>
      <div style={st.tableTopRow}>
        <span style={st.hint}>{rows.length} card{rows.length === 1 ? '' : 's'}</span>
        <button
          className="adm-btn"
          style={st.copyAllBtn}
          onClick={() => onCopy(allUrls, `${keyPrefix}-all`)}
        >
          {copied === `${keyPrefix}-all` ? 'Copied all' : 'Copy all URLs'}
        </button>
      </div>
      <div style={st.tableWrap}>
        <div style={st.cardTableHead}>
          <span style={st.colNo}>#</span>
          <span style={st.colCardId}>Card ID</span>
          <span style={st.colUrl}>NFC URL</span>
          <span style={st.colCopy} />
        </div>
        <div style={st.cardTableBody}>
          {rows.map((c, i) => (
            <div key={c.card_id} style={st.tableRow}>
              <span style={st.colNo}>{String(i + 1).padStart(3, '0')}</span>
              <span style={{ ...st.colCardId, ...st.mono }}>{c.card_id}</span>
              <span style={{ ...st.colUrl, ...st.mono }}>{c.nfc_url ?? '\u2014'}</span>
              <span style={st.colCopy}>
                <button
                  className="adm-btn"
                  style={st.copyBtn}
                  onClick={() => onCopy(c.nfc_url ?? c.card_id, `${keyPrefix}-${c.card_id}`)}
                >
                  {copied === `${keyPrefix}-${c.card_id}` ? '✓' : 'Copy'}
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
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
  sectionBody: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  emptyNote: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  label: {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
  hint: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' },
  row: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  input: {
    flex: '1 1 240px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    width: '100%',
    backgroundColor: '#141414',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  previewBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.75)',
    borderRadius: '999px',
    padding: '10px 22px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  summaryRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  summaryPill: {
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid',
    padding: '4px 12px',
  },
  tag: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    borderRadius: '999px',
    border: '1px solid',
    padding: '2px 9px',
    minWidth: '68px',
    textAlign: 'center',
  },
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
  confirmBox: {
    background: 'rgba(232,201,160,0.06)',
    border: '1px solid rgba(232,201,160,0.28)',
    borderRadius: '14px',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  confirmTitle: { fontSize: '0.95rem', fontWeight: 700, color: CHAMP },
  confirmText: { fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' },
  resultBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  toolDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.09)',
    margin: '0.5rem 0 2rem',
  },
  // ── Team Gold table ──────────────────────────────────────────
  tableWrap: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.32)',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  managerRow: {
    background: 'rgba(232,201,160,0.055)',
    borderLeft: `3px solid ${CHAMP}`,
    paddingLeft: '13px',
  },
  colMember: { flex: '2 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  colRole:   { flex: '0 0 96px' },
  colGold:   { flex: '0 0 72px' },
  colCard:   { flex: '1 1 130px', minWidth: 0 },
  colAction: { flex: '0 0 118px', display: 'flex', justifyContent: 'flex-end' },
  memberEmail: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.88)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  memberId: {
    fontSize: '0.66rem',
    color: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardIdCell: { fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)' },
  noCardCell: { fontSize: '0.76rem', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' },
  approveBtnSm: {
    background: OK, color: '#06210f', border: 'none', borderRadius: '999px',
    padding: '6px 14px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  rejectBtnSm: {
    background: 'rgba(248,113,113,0.12)', color: BAD, border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '999px', padding: '6px 14px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  // ── Create Company ──────────────────────────────────────────
  createGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.85rem',
  },
  previewNote: {
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.32)',
    lineHeight: 1.6,
  },
  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: '0.76rem',
    letterSpacing: '-0.01em',
  },
  subDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '1.75rem 0 0.5rem',
  },
  subHead: {
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '0.25rem',
  },
  tableTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  cardTableHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.32)',
  },
  cardTableBody: { maxHeight: '380px', overflowY: 'auto' },
  colNo:     { flex: '0 0 34px', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' },
  colCardId: { flex: '1 1 160px', minWidth: 0, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  colUrl:    { flex: '2 1 220px', minWidth: 0, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  colCopy:   { flex: '0 0 62px', display: 'flex', justifyContent: 'flex-end' },
  copyBtn: {
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: '999px',
    padding: '4px 11px', fontSize: '0.68rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  copyAllBtn: {
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: '999px',
    padding: '6px 14px', fontSize: '0.74rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  resultTitle: { fontSize: '0.88rem', fontWeight: 600 },
  resultIds: { fontSize: '0.75rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', wordBreak: 'break-word' },
}
