'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { colors, font, spacing, inputs, cards } from '@/lib/design'
import {
  isHexColor, normalizeThemeId, parseGlass,
  SOLID_THEME_LIST, GRADIENT_THEME_LIST, BUTTON_STYLE_LIST, GLASS_LEVELS,
  type GlassLevel,
} from '@/lib/theme'
import {
  PLATFORM_OPTIONS, detectLinkKind, urlPlaceholder, urlInputMode, kindBadge,
} from '@/lib/links'

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY PROFILE TEMPLATE  (/teams/template)
//
// Manager-only. The gate lives in src/app/teams/layout.tsx, which wraps every
// nested /teams route — so a non-manager is redirected server-side before this
// page is ever sent. No gating logic is duplicated here.
//
// The style options are imported from @/lib/theme — the SAME lists BrandStudio
// renders — so the values written to company_template are byte-identical to
// what a profile stores. Field semantics mirror BrandStudio exactly:
//   theme_style      → t.id from the solid/gradient lists
//   accent_color     → hex string, or null when cleared
//   background_style → glass level id, or NULL when 'none'
//   button_style     → b.id, defaulting to 'default'
//
// This page reads and writes company_template and company_links only. It never
// touches profiles, profile_links, or any employee data.
// ─────────────────────────────────────────────────────────────────────────────

const CHAMP = '#E8C9A0'

type CompanyLink = {
  id?: string
  label: string
  custom_label: string
  url: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function blankLink(): CompanyLink {
  return { label: '', custom_label: '', url: '' }
}

export default function CompanyTemplatePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [save, setSave] = useState<SaveState>('idle')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [hasTemplate, setHasTemplate] = useState(false)

  const [links, setLinks] = useState<CompanyLink[]>([])
  const [themeStyle, setThemeStyle] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [buttonStyle, setButtonStyle] = useState<string | null>(null)
  const [backgroundStyle, setBackgroundStyle] = useState<string | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teams/template', { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || 'Could not load your company template.')
        return
      }
      const t = j.template as {
        theme_style: string | null; accent_color: string | null
        button_style: string | null; background_style: string | null
      } | null

      setHasTemplate(Boolean(t))
      setThemeStyle(t?.theme_style ?? null)
      setAccentColor(t?.accent_color ?? null)
      setButtonStyle(t?.button_style ?? null)
      setBackgroundStyle(t?.background_style ?? null)
      setLinks(
        ((j.links ?? []) as { label: string | null; custom_label: string | null; url: string | null }[])
          .map((l) => ({ label: l.label ?? '', custom_label: l.custom_label ?? '', url: l.url ?? '' })),
      )
    } catch {
      setError('Network error loading your company template.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Link editing ──────────────────────────────────────────────────────────
  function patchLink(i: number, patch: Partial<CompanyLink>) {
    setLinks((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
    setSave('idle'); setSaveMsg(null)
  }
  function addLink() {
    setLinks((rows) => [...rows, blankLink()])
    setSave('idle'); setSaveMsg(null)
  }
  function removeLink(i: number) {
    setLinks((rows) => rows.filter((_, idx) => idx !== i))
    setSave('idle'); setSaveMsg(null)
  }
  function move(i: number, dir: -1 | 1) {
    setLinks((rows) => {
      const j = i + dir
      if (j < 0 || j >= rows.length) return rows
      const next = [...rows]
      const tmp = next[i]; next[i] = next[j]; next[j] = tmp
      return next
    })
    setSave('idle'); setSaveMsg(null)
  }

  // Same semantics as BrandStudio's setGlass: 'none' clears the column.
  function setGlass(level: GlassLevel | string) {
    setBackgroundStyle(level === 'none' ? null : String(level))
    setSave('idle'); setSaveMsg(null)
  }
  function patchStyle(fn: () => void) {
    fn(); setSave('idle'); setSaveMsg(null)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSave('saving')
    setSaveMsg(null)
    setError(null)
    try {
      const res = await fetch('/api/teams/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_style: themeStyle,
          accent_color: accentColor,
          button_style: buttonStyle,
          background_style: backgroundStyle,
          links: links.map((l) => ({ label: l.label, custom_label: l.custom_label, url: l.url })),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSave('error')
        setSaveMsg(j.error || 'Could not save. Please try again.')
        return
      }
      setSave('saved')
      setHasTemplate(true)
      setSaveMsg(j.message || 'Saved.')
      setLinks(
        ((j.links ?? []) as { label: string | null; custom_label: string | null; url: string | null }[])
          .map((l) => ({ label: l.label ?? '', custom_label: l.custom_label ?? '', url: l.url ?? '' })),
      )
      setTimeout(() => setSave((s) => (s === 'saved' ? 'idle' : s)), 4000)
    } catch {
      setSave('error')
      setSaveMsg('Network error. Nothing was saved.')
    }
  }

  const selectedTheme = normalizeThemeId(themeStyle)
  const glass = parseGlass(backgroundStyle)
  const accent = accentColor && isHexColor(accentColor) ? accentColor : ''
  const currentButton = buttonStyle || 'default'
  const isEmpty = !hasTemplate && links.length === 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <main style={st.page}>
        <div style={st.shell}>

          {/* ── Header ── */}
          <div style={st.head}>
            <div style={{ minWidth: 0 }}>
              <Link href="/teams" className="ct-back">← Team dashboard</Link>
              <h1 style={st.title}>Company Profile Template</h1>
              <p style={st.subtitle}>
                Set the links and styling applied across your whole team&apos;s cards.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={save === 'saving' || loading}
              className="ct-btn"
              style={{ ...st.saveBtn, opacity: save === 'saving' || loading ? 0.55 : 1 }}
            >
              {save === 'saving' ? 'Saving…' : save === 'saved' ? '✓ Saved' : 'Save template'}
            </button>
          </div>

          {error && <div style={st.errorBar}>{error}</div>}
          {saveMsg && (
            <div style={save === 'error' ? st.errorBar : st.successBar}>{saveMsg}</div>
          )}

          {loading ? (
            <div style={{ ...cards.glass, ...st.panel }}>
              <p style={st.emptyText}>Loading your template…</p>
            </div>
          ) : (
            <>
              {isEmpty && (
                <div style={st.startCard}>
                  <p style={st.startEyebrow}>Nothing set up yet</p>
                  <p style={st.startText}>
                    Add your company links and choose a style below, then save. Once set,
                    this becomes the template for your team.
                  </p>
                </div>
              )}

              {/* ── Company links ── */}
              <section style={{ ...cards.glass, ...st.panel }}>
                <div style={st.panelHead}>
                  <div style={{ minWidth: 0 }}>
                    <p style={st.panelTitle}>Company links</p>
                    <p style={st.panelHint}>
                      Shared links every team member&apos;s card can carry. Pick a platform, or choose Custom to set your own button text.
                    </p>
                  </div>
                  <span style={st.countPill}>{links.length}</span>
                </div>

                {links.length === 0 ? (
                  <div style={st.emptyBlock}>
                    <p style={st.emptyText}>No company links yet.</p>
                    <p style={st.emptyHint}>Add your website, careers page, or booking link.</p>
                  </div>
                ) : (
                  <div style={st.linkList}>
                    {links.map((l, i) => (
                      <div key={i} style={st.linkRow}>
                        <div style={st.orderCol}>
                          <button
                            className="ct-icon"
                            style={st.orderBtn}
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            aria-label="Move up"
                          >↑</button>
                          <span style={st.orderNum}>{i + 1}</span>
                          <button
                            className="ct-icon"
                            style={st.orderBtn}
                            onClick={() => move(i, 1)}
                            disabled={i === links.length - 1}
                            aria-label="Move down"
                          >↓</button>
                        </div>

                        <div style={st.linkFields}>
                          <div style={st.fieldPair}>
                            <label style={st.fieldLabel} htmlFor={`ct-platform-${i}`}>Platform</label>
                            <div style={st.selectRow}>
                              <select
                                id={`ct-platform-${i}`}
                                className="ct-input ct-select"
                                style={st.input}
                                value={l.label}
                                onChange={(e) => {
                                  const next = e.target.value
                                  // Leaving Custom clears the custom wording, exactly
                                  // as the profile editor behaves.
                                  patchLink(i, {
                                    label: next,
                                    custom_label: next === 'Custom' ? l.custom_label : '',
                                  })
                                }}
                              >
                                <option value="" disabled>Select platform…</option>
                                {PLATFORM_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                                ))}
                              </select>
                              {l.label && l.label !== 'Custom' && (
                                <span style={st.kindBadge}>{kindBadge(l.label)}</span>
                              )}
                            </div>
                          </div>

                          {l.label === 'Custom' && (
                            <div style={st.fieldPair}>
                              <label style={st.fieldLabel} htmlFor={`ct-custom-${i}`}>Button text</label>
                              <input
                                id={`ct-custom-${i}`}
                                className="ct-input"
                                style={st.input}
                                value={l.custom_label}
                                placeholder="Button text (e.g. Book a call)"
                                onChange={(e) => patchLink(i, { custom_label: e.target.value })}
                              />
                            </div>
                          )}

                          <div style={{ ...st.fieldPair, gridColumn: l.label === 'Custom' ? '1 / -1' : 'auto' }}>
                            <label style={st.fieldLabel} htmlFor={`ct-url-${i}`}>
                              {l.label && detectLinkKind(l.label) === 'email' ? 'Email address'
                                : l.label && detectLinkKind(l.label) === 'whatsapp' ? 'Phone number'
                                : 'URL'}
                            </label>
                            <input
                              id={`ct-url-${i}`}
                              className="ct-input"
                              style={{ ...st.input, fontFamily: font.mono }}
                              value={l.url}
                              placeholder={l.label ? urlPlaceholder(l.label) : 'https://'}
                              inputMode={l.label ? urlInputMode(l.label) : 'url'}
                              onChange={(e) => patchLink(i, { url: e.target.value })}
                            />
                          </div>
                        </div>

                        <button
                          className="ct-icon ct-remove"
                          style={st.removeBtn}
                          onClick={() => removeLink(i)}
                          aria-label="Remove link"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <button className="ct-btn" style={st.addBtn} onClick={addLink}>+ Add a link</button>
              </section>

              {/* ── Company style ── */}
              <section style={{ ...cards.glass, ...st.panel }}>
                <div style={st.panelHead}>
                  <div style={{ minWidth: 0 }}>
                    <p style={st.panelTitle}>Company style</p>
                    <p style={st.panelHint}>
                      The look applied across the team. Same options as a personal profile.
                    </p>
                  </div>
                </div>

                <Field label="Background theme" hint="Premium solid presets.">
                  <div style={st.swatchGrid}>
                    {SOLID_THEME_LIST.map((t) => (
                      <Swatch
                        key={t.id}
                        fill={t.swatch}
                        label={t.label}
                        selected={selectedTheme === t.id}
                        accent={accent}
                        onClick={() => patchStyle(() => setThemeStyle(t.id))}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Cinematic gradients" hint="Low-opacity, Apple / Linear style.">
                  <div style={st.swatchGrid}>
                    {GRADIENT_THEME_LIST.map((t) => (
                      <Swatch
                        key={t.id}
                        fill={t.swatch}
                        label={t.label}
                        selected={selectedTheme === t.id}
                        accent={accent}
                        onClick={() => patchStyle(() => setThemeStyle(t.id))}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Accent colour" hint="Tints badges, rings, link hover and focus.">
                  <div style={st.colorRow}>
                    <input
                      type="color"
                      value={isHexColor(accent) ? accent : '#7c5cff'}
                      onChange={(e) => patchStyle(() => setAccentColor(e.target.value))}
                      style={st.colorInput}
                      aria-label="Accent colour"
                    />
                    <input
                      type="text"
                      className="ct-input"
                      value={accent}
                      placeholder="#7c5cff"
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        patchStyle(() => setAccentColor(v === '' ? null : v))
                      }}
                      style={{ ...st.input, fontFamily: font.mono, maxWidth: 160 }}
                    />
                    {accent && (
                      <button
                        className="ct-icon"
                        style={st.clearBtn}
                        onClick={() => patchStyle(() => setAccentColor(null))}
                        title="Reset accent"
                      >×</button>
                    )}
                  </div>
                </Field>

                <Field label="Glass intensity" hint="Surface blur and translucency.">
                  <div style={st.segmented}>
                    {GLASS_LEVELS.map((o) => {
                      const sel = glass === o.id
                      return (
                        <button
                          key={o.id}
                          onClick={() => setGlass(o.id)}
                          style={{
                            ...st.segBtn,
                            background: sel ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: sel ? colors.text.primary : colors.text.muted,
                            boxShadow: sel ? `inset 0 0 0 1px ${accent || CHAMP}` : 'none',
                          }}
                        >
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <Field label="Button style" hint="How the links appear to visitors." last>
                  <div style={st.styleGrid}>
                    {BUTTON_STYLE_LIST.map((b) => {
                      const sel = currentButton === b.id
                      return (
                        <button
                          key={b.id}
                          onClick={() => patchStyle(() => setButtonStyle(b.id))}
                          style={{
                            ...st.styleOpt,
                            borderColor: sel ? (accent || CHAMP) : 'rgba(255,255,255,0.1)',
                            background: sel ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                            color: sel ? colors.text.primary : colors.text.muted,
                            boxShadow: sel ? `0 0 0 1px ${accent || CHAMP}` : 'none',
                          }}
                        >
                          {sel && <span style={{ marginRight: 5, opacity: 0.7 }}>✓</span>}
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              </section>

              {/* ── Sticky save on mobile ── */}
              <div style={st.footerBar}>
                <span style={st.footerNote}>
                  {save === 'saved' ? 'All changes saved.' : 'Changes are not saved until you press save.'}
                </span>
                <button
                  onClick={handleSave}
                  disabled={save === 'saving'}
                  className="ct-btn"
                  style={{ ...st.saveBtn, opacity: save === 'saving' ? 0.55 : 1 }}
                >
                  {save === 'saving' ? 'Saving…' : save === 'saved' ? '✓ Saved' : 'Save template'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function Field({ label, hint, last, children }: {
  label: string; hint?: string; last?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{
      paddingBottom: last ? 0 : '1.4rem',
      marginBottom: last ? 0 : '1.4rem',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={st.fieldTitle}>{label}</p>
      {hint && <p style={st.fieldHint}>{hint}</p>}
      <div style={{ marginTop: '0.85rem' }}>{children}</div>
    </div>
  )
}

function Swatch({ fill, label, selected, accent, onClick }: {
  fill: string; label: string; selected: boolean; accent: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="ct-swatch"
      title={label}
      style={{
        ...st.swatch,
        background: fill,
        boxShadow: selected
          ? `0 0 0 2px ${accent || CHAMP}, 0 6px 18px rgba(0,0,0,0.5)`
          : '0 0 0 1px rgba(255,255,255,0.09)',
      }}
    >
      <span style={st.swatchLabel}>{label}</span>
      {selected && <span style={st.swatchTick}>✓</span>}
    </button>
  )
}

const CSS = `
  .ct-back { font-size: 0.74rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); text-decoration: none; transition: color .2s; }
  .ct-back:hover { color: rgba(255,255,255,0.85); }
  .ct-btn { transition: transform .15s ease, opacity .15s ease, background .15s ease; }
  .ct-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .ct-btn:disabled { cursor: not-allowed; }
  .ct-icon { transition: color .15s ease, background .15s ease, opacity .15s ease; }
  .ct-icon:disabled { opacity: 0.25; cursor: not-allowed; }
  .ct-icon:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #fff; }
  .ct-remove:hover:not(:disabled) { background: rgba(248,113,113,0.14); color: #f87171; }
  .ct-input:focus { outline: none; border-color: rgba(255,255,255,0.32); background: rgba(255,255,255,0.05); }
  .ct-select { cursor: pointer; }
  .ct-select option { background-color: #141414; color: #ffffff; }
  .ct-swatch { transition: transform .16s cubic-bezier(0.16,1,0.3,1); }
  .ct-swatch:hover { transform: translateY(-2px); }

  .ct-links { }
  @media (max-width: 720px) {
    .ct-fields { grid-template-columns: 1fr !important; }
    .ct-row { grid-template-columns: auto 1fr !important; }
    .ct-row .ct-remove { grid-column: 2; justify-self: end; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ct-btn, .ct-icon, .ct-swatch, .ct-input { transition: none !important; }
    .ct-btn:hover:not(:disabled), .ct-swatch:hover { transform: none !important; }
  }
`

const st = {
  page: { minHeight: '100vh', padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem) 4rem' } as CSSProperties,
  shell: { width: '100%', maxWidth: 860, margin: '0 auto' } as CSSProperties,

  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' } as CSSProperties,
  title: { fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', fontWeight: 600, letterSpacing: '0.01em', color: colors.text.primary, marginTop: '0.75rem', lineHeight: 1.15 } as CSSProperties,
  subtitle: { fontSize: '0.88rem', color: colors.text.muted, marginTop: '0.5rem', lineHeight: 1.6, maxWidth: 460 } as CSSProperties,

  panel: { padding: 'clamp(1.15rem, 3vw, 1.75rem)', marginBottom: '1.25rem' } as CSSProperties,
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem', marginBottom: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)' } as CSSProperties,
  panelTitle: { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.text.secondary } as CSSProperties,
  panelHint: { fontSize: '0.78rem', color: colors.text.faint, marginTop: '0.45rem', lineHeight: 1.6 } as CSSProperties,
  countPill: { fontSize: '0.7rem', fontWeight: 700, color: CHAMP, background: 'rgba(232,201,160,0.1)', border: '1px solid rgba(232,201,160,0.22)', borderRadius: 999, padding: '2px 10px', flexShrink: 0 } as CSSProperties,

  startCard: { background: 'rgba(232,201,160,0.05)', border: '1px solid rgba(232,201,160,0.2)', borderRadius: 12, padding: '1.15rem 1.3rem', marginBottom: '1.25rem' } as CSSProperties,
  startEyebrow: { fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', color: CHAMP, marginBottom: '0.55rem' } as CSSProperties,
  startText: { fontSize: '0.86rem', color: colors.text.muted, lineHeight: 1.7 } as CSSProperties,

  linkList: { display: 'flex', flexDirection: 'column', gap: '0.85rem' } as CSSProperties,
  linkRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.85rem', alignItems: 'start', padding: '0.95rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 } as CSSProperties,
  orderCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: '1.1rem' } as CSSProperties,
  orderBtn: { width: 24, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: colors.text.muted, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 } as CSSProperties,
  orderNum: { fontSize: '0.64rem', color: colors.text.faint, fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  linkFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', minWidth: 0 } as CSSProperties,
  fieldPair: { display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 } as CSSProperties,
  fieldLabel: { fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.text.faint } as CSSProperties,
  input: { ...(inputs.base as CSSProperties), width: '100%', minWidth: 0 } as CSSProperties,
  selectRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 } as CSSProperties,
  kindBadge: { flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.text.muted, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '3px 8px' } as CSSProperties,
  removeBtn: { width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: colors.text.muted, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1, marginTop: '1.05rem' } as CSSProperties,
  addBtn: { marginTop: '1.1rem', padding: '10px 18px', borderRadius: 999, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: colors.text.secondary, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as CSSProperties,

  fieldTitle: { fontSize: '0.78rem', fontWeight: 600, color: colors.text.primary, letterSpacing: '0.01em' } as CSSProperties,
  fieldHint: { fontSize: '0.74rem', color: colors.text.faint, marginTop: '0.3rem', lineHeight: 1.55 } as CSSProperties,
  swatchGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.6rem' } as CSSProperties,
  swatch: { position: 'relative', height: 62, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden', display: 'block', width: '100%' } as CSSProperties,
  swatchLabel: { position: 'absolute', left: 8, bottom: 6, fontSize: '0.62rem', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.7)', letterSpacing: '0.02em' } as CSSProperties,
  swatchTick: { position: 'absolute', top: 6, right: 7, fontSize: '0.7rem', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' } as CSSProperties,

  colorRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' } as CSSProperties,
  colorInput: { width: 44, height: 40, padding: 2, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' } as CSSProperties,
  clearBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: colors.text.muted, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 } as CSSProperties,

  segmented: { display: 'inline-flex', gap: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: 3, flexWrap: 'wrap' } as CSSProperties,
  segBtn: { fontSize: '0.74rem', fontWeight: 500, padding: '6px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit' } as CSSProperties,
  styleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.55rem' } as CSSProperties,
  styleOpt: { padding: '11px 14px', borderRadius: 10, border: '1px solid', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' } as CSSProperties,

  saveBtn: { padding: '12px 26px', borderRadius: 999, border: 'none', background: '#fff', color: '#000', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' } as CSSProperties,
  footerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' } as CSSProperties,
  footerNote: { fontSize: '0.76rem', color: colors.text.faint } as CSSProperties,

  emptyBlock: { padding: '2rem 1rem', textAlign: 'center' } as CSSProperties,
  emptyText: { fontSize: '0.88rem', color: colors.text.muted } as CSSProperties,
  emptyHint: { fontSize: '0.76rem', color: colors.text.faint, marginTop: '0.4rem' } as CSSProperties,
  errorBar: { marginBottom: '1.25rem', padding: '0.8rem 1rem', borderRadius: 10, fontSize: '0.83rem', lineHeight: 1.6, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' } as CSSProperties,
  successBar: { marginBottom: '1.25rem', padding: '0.8rem 1rem', borderRadius: 10, fontSize: '0.83rem', lineHeight: 1.6, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)' } as CSSProperties,
}
