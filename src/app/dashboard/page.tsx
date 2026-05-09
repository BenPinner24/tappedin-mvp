'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  colors,
  font,
  radius,
  spacing,
  shadows,
  borders,
  transitions,
  text,
  inputs,
  cards,
  buttons,
  layout,
  statusBadgeStyle,
} from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  role: string | null
  website: string | null
  avatar_url: string | null
  accent_color: string | null
  button_style: string | null
  background_style: string | null
  theme_style: string | null
}

type ProfileLink = {
  id: string            // stable — never delete/recreate
  label: string
  url: string
  link_type: string | null
  position: number
  is_active: boolean
}

type CardRecord = {
  card_id: string
  status: string | null
  nfc_url: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type ActiveTab = 'profile' | 'links' | 'style' | 'card'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LINKS = 8

const BUTTON_STYLES = [
  { value: 'default', label: 'Solid white' },
  { value: 'outline', label: 'Outline' },
  { value: 'sharp',   label: 'Sharp edge' },
  { value: 'glass',   label: 'Glass' },
]

const THEME_STYLES = [
  { value: 'dark',   label: 'Dark' },
  { value: 'darker', label: 'Deeper black' },
]

// Preset platform options for the link label dropdown.
// The value IS the label stored in the DB — no mapping needed.
// detectLinkKind() reads the label to determine normalisation behaviour,
// so 'WhatsApp' and 'Email' drive their special-case handling automatically.
const PLATFORM_OPTIONS = [
  { value: 'Instagram',    kind: 'url'       },
  { value: 'TikTok',       kind: 'url'       },
  { value: 'YouTube',      kind: 'url'       },
  { value: 'Spotify',      kind: 'url'       },
  { value: 'SoundCloud',   kind: 'url'       },
  { value: 'Apple Music',  kind: 'url'       },
  { value: 'Website',      kind: 'url'       },
  { value: 'Portfolio',    kind: 'url'       },
  { value: 'LinkedIn',     kind: 'url'       },
  { value: 'X / Twitter',  kind: 'url'       },
  { value: 'WhatsApp',     kind: 'whatsapp'  },
  { value: 'Email',        kind: 'email'     },
  { value: 'Booking',      kind: 'url'       },
  { value: 'Other',        kind: 'url'       },
] as const

// ─── Link-type detection & normalisation ──────────────────────────────────────

type LinkKind = 'whatsapp' | 'email' | 'url'

function detectLinkKind(label: string): LinkKind {
  const l = label.toLowerCase()
  if (l.includes('whatsapp') || l === 'wa' || l.startsWith('wa ')) return 'whatsapp'
  if (l.includes('email') || l.includes('enquir') || l.includes('mail') || l === 'contact' || l.includes('get in touch')) return 'email'
  return 'url'
}

function urlPlaceholder(label: string): string {
  const kind = detectLinkKind(label)
  if (kind === 'whatsapp') return 'e.g. 07901109774 or +447901109774'
  if (kind === 'email')    return 'name@example.com'
  return 'https://'
}

function urlInputMode(label: string): 'tel' | 'email' | 'url' | 'text' {
  const kind = detectLinkKind(label)
  if (kind === 'whatsapp') return 'tel'
  if (kind === 'email')    return 'email'
  return 'url'
}

/** Normalise a raw URL/phone/email value before saving */
function normaliseUrl(label: string, raw: string): string {
  const v = raw.trim()
  if (!v) return v
  const kind = detectLinkKind(label)

  if (kind === 'whatsapp') {
    // Accept existing wa.me URLs (with or without protocol)
    if (v.startsWith('https://wa.me/') || v.startsWith('http://wa.me/')) return v
    if (v.startsWith('wa.me/')) return `https://${v}`

    // Strip formatting: spaces, hyphens, dots, brackets, parens, square brackets
    const stripped = v.replace(/[\s\-.()\[\]]/g, '')

    // Remove anything that isn't a digit or a leading +
    const withPlus = stripped.replace(/[^\d+]/g, '')

    // Drop the leading + so we have raw digits only
    const digitsRaw = withPlus.replace(/^\+/, '')

    // Normalise leading zeros:
    //   00xx… → xx…   (international dialling prefix, e.g. 00447901… → 447901…)
    //   0x…   → 44x…  (UK local, e.g. 07901… → 447901…)
    let digits = digitsRaw
    if (digits.startsWith('00')) {
      digits = digits.slice(2)
    } else if (digits.startsWith('0')) {
      digits = '44' + digits.slice(1)
    }

    return `https://wa.me/${digits}`
  }

  if (kind === 'email') {
    // Extract raw email address from whatever form the user entered
    let email = ''
    if (v.startsWith('mailto:')) {
      // Strip mailto: prefix (and any query string)
      email = v.slice(7).split('?')[0].trim()
    } else if (v.startsWith('https://mail.google.com/')) {
      // Already a Gmail compose URL — extract the `to=` param if present
      try {
        const url = new URL(v)
        email = url.searchParams.get('to') ?? ''
      } catch { email = '' }
    } else if (v.includes('@')) {
      email = v.trim()
    }

    if (email) {
      // Produce a Gmail compose deep-link so the button reliably opens compose
      return `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${encodeURIComponent(email)}`
    }

    // No recognisable email — return as-is
    return v
  }

  // Standard URL — ensure protocol
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('mailto:') || v.startsWith('tel:')) return v
  return `https://${v}`
}

/**
 * Per-row inline validation — validates against the NORMALISED value so that
 * a user typing "07901109774" (which normalises to https://wa.me/447901109774)
 * passes validation rather than failing on the raw input.
 *
 * Returns an error string, or null if the row is valid.
 */
function validateLinkRow(label: string, url: string): string | null {
  const rawLabel = label.trim()
  const rawUrl   = url.trim()

  // Both empty → skip row entirely, no error
  if (!rawLabel && !rawUrl) return null

  // One side filled, the other empty
  if (rawLabel && !rawUrl) return 'Add a URL, phone number, or email address'
  if (!rawLabel && rawUrl) return 'Add a label for this link'

  const kind = detectLinkKind(rawLabel)

  // Normalise first, then validate the normalised form
  const normalised = normaliseUrl(rawLabel, rawUrl)

  if (kind === 'whatsapp') {
    // After normalisation a valid number becomes https://wa.me/<digits>
    // Accept 8–15 digits (E.164 minimum is 8, maximum is 15)
    const waMatch = normalised.match(/^https:\/\/wa\.me\/(\d+)$/)
    if (!waMatch) {
      return 'Enter a phone number or WhatsApp link'
    }
    const digitCount = waMatch[1].length
    if (digitCount < 8) {
      return 'Phone number is too short — include your country code (e.g. 447901109774)'
    }
    if (digitCount > 15) {
      return 'Phone number is too long — check and re-enter'
    }
    return null
  }

  if (kind === 'email') {
    // After normalisation, a valid email becomes a Gmail compose URL.
    // Extract the `to` param and validate it contains a proper email address.
    let email = ''
    if (normalised.startsWith('https://mail.google.com/')) {
      try {
        const url = new URL(normalised)
        email = decodeURIComponent(url.searchParams.get('to') ?? '')
      } catch { email = '' }
    } else if (normalised.startsWith('mailto:')) {
      email = normalised.slice(7).split('?')[0]
    } else {
      email = normalised
    }
    if (!email.includes('@') || email.indexOf('.', email.indexOf('@')) === -1) {
      return 'Enter a valid email address (e.g. name@example.com)'
    }
    return null
  }

  // Standard URL — normalised value must parse as a valid URL
  try {
    new URL(normalised)
    return null
  } catch {
    return 'Enter a valid URL (e.g. https://example.com or instagram.com/yourname)'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={inputs.group}>
      <label style={inputs.label}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputs.base}
      />
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={inputs.group}>
      <label style={inputs.label}>{label}</label>
      <textarea
        value={value}
        placeholder={placeholder ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputs.textarea}
      />
    </div>
  )
}


// ─── QR Code generator ───────────────────────────────────────────────────────
// Pure-canvas implementation — zero dependencies.
// Generates a QR code for the given URL using the `qrcode` package API shape,
// but implemented via the browser-native `qrcode` from the CDN-free path we
// polyfill ourselves below using a minimal QR matrix builder.
//
// We use the `qrcode` npm package (qrcode@1.x) which ships a browser-friendly
// build.  It is the only dependency added.  Install with:
//   npm install qrcode
//   npm install --save-dev @types/qrcode
//
// The component renders a <canvas> and exposes a download helper via a ref.

import type { MutableRefObject } from 'react'

type QRCanvasProps = {
  url:      string          // URL to encode
  size?:    number          // canvas logical size in px (default 240)
  dark?:    string          // module colour (default #ffffff)
  light?:   string          // background colour (default transparent → #0a0a0a)
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>
}

function QRCanvas({ url, size = 240, dark = '#ffffff', light = '#0a0a0a', canvasRef }: QRCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement | null>(null)
  const ref = canvasRef ?? internalRef

  useEffect(() => {
    if (!ref.current || !url) return
    // Dynamically import qrcode so it never blocks the page
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(ref.current!, url, {
        width:  size,
        margin: 2,
        color: { dark, light },
        errorCorrectionLevel: 'M',
      }).catch(console.error)
    }).catch(() => {
      // qrcode not installed — draw a placeholder so the UI doesn't break
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = light
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = dark
      ctx.font = `${size * 0.06}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('Install qrcode', size / 2, size / 2 - 8)
      ctx.fillText('npm i qrcode', size / 2, size / 2 + 12)
    })
  }, [url, size, dark, light])

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: '8px' }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────


export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]           = useState(true)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [links, setLinks]               = useState<ProfileLink[]>([])
  const [card, setCard]                 = useState<CardRecord | null>(null)
  const [tapCount, setTapCount]         = useState(0)
  const [linkClickCount, setLinkClickCount] = useState(0)
  const [lastTap, setLastTap]           = useState<string | null>(null)
  const [todayTaps, setTodayTaps]       = useState(0)
  const [profileSave, setProfileSave]   = useState<SaveState>('idle')
  const [linksSave, setLinksSave]       = useState<SaveState>('idle')
  const [saveError, setSaveError]        = useState<string | null>(null)
  const [styleSave, setStyleSave]       = useState<SaveState>('idle')
  const [linkErrors, setLinkErrors]     = useState<(string | null)[]>([])
  const [activeTab, setActiveTab]       = useState<ActiveTab>('profile')
  const [userId, setUserId]             = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadError, setUploadError]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const qrCanvasRef  = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => { loadDashboard() }, [])

  // ─── isMobile — drives all mobile inline-style overrides ─────────────────
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])


  // ─── Load ─────────────────────────────────────────────────────────────────

  async function loadDashboard() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return
      const userId = session.user.id
      setUserId(userId)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle()
      if (profileData) setProfile(profileData)

      const { data: linksData } = await supabase
        .from('profile_links')
        .select('id, label, url, link_type, position, is_active')
        .eq('profile_id', userId)
        .order('position', { ascending: true })
      if (linksData) {
        const mapped = (linksData as ProfileLink[]).map(l => ({
          ...l,
          label: l.label ?? '',
          url:   l.url   ?? '',
          link_type: l.link_type ?? null,
          is_active: l.is_active ?? true,
        }))
        setLinks(mapped)
        setLinkErrors(mapped.map(() => null))
      }

      const { data: cardData } = await supabase
        .from('cards').select('card_id, status, nfc_url')
        .eq('owner_user_id', userId).limit(1).maybeSingle()
      if (cardData) setCard(cardData)

      const { data: tapEvents } = await supabase
        .from('tap_events').select('tapped_at, event_type')
        .eq('profile_id', userId)
        .order('tapped_at', { ascending: false })

      if (tapEvents) {
        const taps   = tapEvents.filter(e => e.event_type === 'card_tap')
        const clicks = tapEvents.filter(e => e.event_type === 'link_click')
        const now    = new Date()
        const todays = taps.filter(e => {
          const d = new Date(e.tapped_at)
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
        })
        setTapCount(taps.length)
        setLinkClickCount(clicks.length)
        setTodayTaps(todays.length)
        if (taps[0]) setLastTap(new Date(taps[0].tapped_at).toLocaleString())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Save profile ──────────────────────────────────────────────────────────

  async function saveProfile() {
    if (!profile) return
    try {
      setProfileSave('saving')
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name,
        bio:          profile.bio,
        role:         profile.role,
        website:      profile.website,
        accent_color: profile.accent_color,
      }).eq('id', profile.id)
      setProfileSave(error ? 'error' : 'saved')
      if (!error) setTimeout(() => setProfileSave('idle'), 2200)
    } catch {
      setProfileSave('error')
    }
  }

  // ─── Save links — stable ID rule ──────────────────────────────────────────
  // ─── Save links ──────────────────────────────────────────────────────────
  // Splits into explicit UPDATE (rows with real DB ids) and INSERT (new rows).
  // Logs the full Supabase error so the real rejection reason is always visible
  // in DevTools Console regardless of what the UI shows.

  async function saveLinks() {
    setSaveError(null)

    // Re-read session so uid is always fresh — state.userId may lag on first render
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id ?? userId

    if (!profile || !uid) {
      const msg = '[saveLinks] aborted — missing ' + (!profile ? 'profile' : 'uid')
      console.error(msg, { hasProfile: !!profile, uid })
      setSaveError(msg)
      setLinksSave('error')
      return
    }

    // Validate non-empty rows against their normalised values
    const errs = links.map(l => validateLinkRow(l.label, l.url))
    setLinkErrors(errs)
    if (errs.some(e => e !== null)) return

    setLinksSave('saving')

    // ── Build row payloads ────────────────────────────────────────────────────
    const existingRows: {
      id: string; user_id: string; profile_id: string
      label: string; url: string; link_type: string
      position: number; is_active: boolean
    }[] = []

    const newRows: {
      user_id: string; profile_id: string
      label: string; url: string; link_type: string
      position: number; is_active: boolean
    }[] = []

    links.forEach((l, i) => {
      const isNew   = !l.id || l.id.startsWith('__new__')
      const active  = !!(l.label.trim() && l.url.trim()) && l.is_active
      const normUrl = normaliseUrl(l.label, l.url)
      const shared  = {
        user_id:    uid,
        profile_id: profile.id,
        label:      l.label.trim(),
        url:        normUrl,
        link_type:  detectLinkKind(l.label),  // derive from label, don't trust stored value
        position:   i,
        is_active:  active,
      }
      if (isNew) newRows.push(shared)
      else       existingRows.push({ id: l.id, ...shared })
    })

    // ── Diagnostic log — always visible in DevTools ───────────────────────────
    console.group('[saveLinks] diagnostic')
    console.log('uid:        ', uid)
    console.log('profile.id: ', profile.id)
    console.log('uid === profile.id:', uid === profile.id)
    console.log('existingRows:', existingRows)
    console.log('newRows:     ', newRows)
    console.groupEnd()

    try {
      // ── 1. UPDATE existing rows ─────────────────────────────────────────────
      for (const row of existingRows) {
        const { error } = await supabase
          .from('profile_links')
          .update({
            label:     row.label,
            url:       row.url,
            link_type: row.link_type,
            position:  row.position,
            is_active: row.is_active,
          })
          .eq('id',      row.id)
          .eq('user_id', uid)       // RLS: only touch own rows

        if (error) {
          const msg = `Update failed: ${error.message} (code ${error.code})`
          console.error('[saveLinks] update error', error, 'row:', row)
          setSaveError(msg)
          setLinksSave('error')
          return
        }
      }

      // ── 2. INSERT new rows ──────────────────────────────────────────────────
      if (newRows.length > 0) {
        const { error } = await supabase
          .from('profile_links')
          .insert(newRows)

        if (error) {
          const msg = `Update failed: ${error.message} (code ${error.code})`
          console.error('[saveLinks] insert error', error, 'rows:', newRows)
          setSaveError(msg)
          setLinksSave('error')
          return
        }
      }

      // ── 3. Reload so state has real DB-generated UUIDs ──────────────────────
      setLinksSave('saved')
      setSaveError(null)
      setTimeout(() => setLinksSave('idle'), 2200)
      await loadLinks(profile.id)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[saveLinks] unexpected exception', err)
      setSaveError(msg)
      setLinksSave('error')
    }
  }

  // loadLinks accepts an explicit profileId so it works even before
  // the `profile` state value has propagated (e.g. right after a save).
  async function loadLinks(profileId?: string) {
    const pid = profileId ?? profile?.id
    if (!pid) return
    const { data } = await supabase
      .from('profile_links')
      .select('id, label, url, link_type, position, is_active')
      .eq('profile_id', pid)
      .order('position', { ascending: true })
    if (data) {
      const mapped = (data as ProfileLink[]).map(l => ({
        ...l,
        label:     l.label     ?? '',
        url:       l.url       ?? '',
        link_type: l.link_type ?? null,
        is_active: l.is_active ?? true,
      }))
      setLinks(mapped)
      setLinkErrors(mapped.map(() => null))
    }
  }

  // ─── Save style ────────────────────────────────────────────────────────────

  async function saveStyle() {
    if (!profile) return
    try {
      setStyleSave('saving')
      const { error } = await supabase.from('profiles').update({
        button_style:     profile.button_style,
        background_style: profile.background_style,
        theme_style:      profile.theme_style,
      }).eq('id', profile.id)
      setStyleSave(error ? 'error' : 'saved')
      if (!error) setTimeout(() => setStyleSave('idle'), 2200)
    } catch {
      setStyleSave('error')
    }
  }

  // ─── Avatar upload ─────────────────────────────────────────────────────────
  // Validates file type + size client-side, shows instant preview via FileReader,
  // uploads to Supabase Storage `avatars` bucket, then saves the public URL to
  // profiles.avatar_url.  All existing save logic is unaffected.

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset input so the same file can be re-selected after an error
    event.target.value = ''

    if (!file || !profile) return

    // ── Client-side validation ──────────────────────────────────────────────
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_BYTES     = 5 * 1024 * 1024 // 5 MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Image must be smaller than 5 MB.')
      return
    }

    setUploadError(null)
    setUploading(true)

    // ── Instant local preview ───────────────────────────────────────────────
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // ── Upload to Supabase Storage ──────────────────────────────────────────
    try {
      const ext      = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${profile.id}/${Date.now()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' })

      if (storageError) {
        setUploadError('Upload failed — please try again.')
        setAvatarPreview(null)
        console.error('[avatar upload]', storageError)
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (dbError) {
        setUploadError('Saved to storage but failed to update profile — refresh and try again.')
        console.error('[avatar db]', dbError)
        return
      }

      // Commit to state — clears preview (real URL takes over)
      setProfile({ ...profile, avatar_url: publicUrl })
      setAvatarPreview(null)
    } catch (err) {
      setUploadError('Something went wrong. Please try again.')
      setAvatarPreview(null)
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  // ─── Download QR ──────────────────────────────────────────────────────────
  function downloadQR() {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const link      = document.createElement('a')
    link.download   = `tapped-in-qr-${profile?.username ?? 'profile'}.png`
    link.href       = canvas.toDataURL('image/png')
    link.click()
  }

  function patchProfile(fields: Partial<Profile>) {
    setProfile(prev => prev ? { ...prev, ...fields } : null)
  }

  function patchLink(index: number, fields: Partial<ProfileLink>) {
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, ...fields } : l))
    // Clear error for this row when user edits it
    setLinkErrors(prev => prev.map((e, i) => i === index ? null : e))
  }

  function addLink() {
    if (links.length >= MAX_LINKS) return
    setLinks(prev => [...prev, {
      id: `__new__${Date.now()}`,
      label: '', url: '', link_type: 'custom',
      position: prev.length, is_active: true,
    }])
    setLinkErrors(prev => [...prev, null])
  }

  const ctr = tapCount > 0 ? Math.round((linkClickCount / tapCount) * 100) : 0
  const cardStatusBadge = card?.status
    ? statusBadgeStyle(card.status as Parameters<typeof statusBadgeStyle>[0])
    : null

  // ─── Save button helpers ───────────────────────────────────────────────────

  function saveBtnLabel(state: SaveState, idle: string) {
    if (state === 'saving') return 'Saving…'
    if (state === 'saved')  return '✓ Saved'
    if (state === 'error')  return 'Error — try again'
    return idle
  }

  function saveBtnCx(state: SaveState): CSSProperties {
    const base: CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: '7px', padding: `${spacing[3]} ${spacing[6]}`,
      borderRadius: radius.full, border: 'none',
      fontFamily: font.sans, fontSize: font.size.sm, fontWeight: font.weight.bold,
      letterSpacing: '0.01em', cursor: 'pointer', textDecoration: 'none',
      whiteSpace: 'nowrap', transition: transitions.button,
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
    }
    if (state === 'saved')  return { ...base, background: colors.accent.success, color: '#000', boxShadow: `0 2px 12px rgba(74,222,128,0.3)` }
    if (state === 'error')  return { ...base, background: colors.accent.errorBg, color: colors.accent.error, border: borders.error }
    if (state === 'saving') return { ...base, background: 'rgba(255,255,255,0.85)', color: '#000', opacity: 0.7, cursor: 'not-allowed' }
    return { ...base, background: colors.white.full, color: '#000' }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={s.loadingPage}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner} />
      </main>
    )
  }

  const activeLinks = links.filter(l => l.is_active && l.label && l.url)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ ...s.page, overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }

        *, *::before, *::after { box-sizing: border-box; }

        input::placeholder, textarea::placeholder { color: ${colors.text.ghost}; }

        input:focus, textarea:focus {
          border-color: ${colors.border.strong} !important;
          background: rgba(255,255,255,0.06) !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important;
        }

        /* ── Primary / save button ── */
        .ti-save-btn:hover   { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,255,255,0.18) !important; }
        .ti-save-btn:active  { transform: translateY(0) !important; }

        /* ── Ghost / upload button ── */
        .ti-upload-btn:hover { border-color: ${colors.border.focus} !important; color: ${colors.white[90]} !important; background: rgba(255,255,255,0.06) !important; }

        /* ── Avatar camera hint ── */
        button[aria-label="Upload avatar"]:not(:disabled):hover > div:last-of-type { opacity: 1 !important; }

        /* ── NFC open button ── */
        .ti-nfc-btn:hover  { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.35) !important; }
        .ti-nfc-btn:active { transform: translateY(0) !important; }

        /* ── Analytics CTA ── */
        .ti-analytics:hover { border-color: ${colors.border.strong} !important; background: rgba(255,255,255,0.04) !important; }

        /* ── View link ── */
        .ti-view-link:hover { color: ${colors.white[90]} !important; }

        /* ── Add link ── */
        .ti-add-link:hover { border-color: ${colors.border.default} !important; color: ${colors.text.secondary} !important; background: rgba(255,255,255,0.05) !important; }

        /* ── Tabs ── */
        .ti-tab:hover { color: ${colors.text.secondary} !important; }

        /* ── Toggle ── */
        .ti-link-toggle:hover { opacity: 0.75 !important; }

        /* ── Style option ── */
        .ti-style-opt:hover { border-color: ${colors.border.strong} !important; background: rgba(255,255,255,0.06) !important; }

        /* ── Platform select — native option elements inherit page bg on most browsers;
              force a dark background so text is readable when the list drops open ── */
        select.ti-link-select option {
          background-color: #1a1a1a;
          color: #fff;
        }
        select.ti-link-select option:disabled {
          color: rgba(255,255,255,0.35);
        }
        select.ti-link-select:focus {
          border-color: ${colors.border.strong} !important;
          background-color: rgba(255,255,255,0.06) !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important;
        }

        /* ── Mini stats link ── */
        .ti-mini-link:hover { color: ${colors.white[70]} !important; }

        /* ── Stat cell ── */
        .ti-stat-cell:last-child { border-right: none !important; }

        /* ── Responsive: tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .ti-layout          { grid-template-columns: 1fr !important; padding: 2rem 1.5rem !important; max-width: 680px !important; }
          .ti-left-col        { position: static !important; top: auto !important; }
          .ti-preview-card    { display: none !important; }
          .ti-stats-bar       { grid-template-columns: repeat(2, 1fr) !important; }
          .ti-stat-cell:nth-child(2) { border-right: none !important; }
          .ti-stat-cell:nth-child(3) { border-top: 1px solid ${colors.border.subtle} !important; }
          .ti-stat-cell:nth-child(4) { border-top: 1px solid ${colors.border.subtle} !important; }
          .ti-form-grid       { grid-template-columns: 1fr !important; }
        }

        /* ── Responsive: mobile (≤ 640px) ── */
        @media (max-width: 640px) {
          /* Global overflow guard — nothing escapes the viewport */
          html, body { overflow-x: hidden !important; max-width: 100vw !important; }

          /* Layout grid */
          .ti-layout {
            padding: 1rem 0.875rem !important;
            gap: 0.875rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          /* Right column */
          .ti-right-col {
            gap: 0.875rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          /* Editor card — the tabs container */
          .ti-editor-card {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }

          /* Tab bar — tighten padding, allow horizontal scroll if needed */
          .ti-tab-bar {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            gap: 0 !important;
            overflow-x: auto !important;
          }
          .ti-tab-bar::-webkit-scrollbar { display: none !important; }

          /* Card tab content — generous padding but contained */
          .ti-card-tab-content {
            padding: 1.25rem 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          /* NFC card visual — scale to full width */
          .ti-card-tab-visual {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }

          /* Card detail table */
          .ti-card-details  {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }

          /* Card detail rows — stack vertically */
          .ti-card-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.2rem !important;
            padding: 0.625rem 0.875rem !important;
          }

          /* Label — full width when stacked */
          .ti-card-detail-label {
            max-width: 100% !important;
            font-size: 0.6rem !important;
          }

          /* Value — full width, truncate long strings */
          .ti-card-detail-val {
            font-size: ${font.size.xs} !important;
            max-width: 100% !important;
            width: 100% !important;
            text-align: left !important;
            flex: none !important;
          }

          /* Open NFC button */
          .ti-nfc-open-btn {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* QR card — stack vertically */
          .ti-qr-card {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .ti-qr-canvas-wrap {
            flex-shrink: 0 !important;
            align-self: center !important;
            max-width: 100% !important;
          }
          .ti-qr-meta {
            width: 100% !important;
            min-width: 0 !important;
          }
          .ti-qr-download-btn {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            align-self: stretch !important;
            justify-content: center !important;
          }

          /* Other tabs */
          .ti-page-header   { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .ti-page-title    { font-size: ${font.size['3xl']} !important; }
          .ti-stats-bar     { grid-template-columns: 1fr 1fr !important; }
          .ti-avatar-row    { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .ti-nfc-panel     { padding: 1rem !important; width: 100% !important; box-sizing: border-box !important; min-width: 0 !important; }
          .ti-link-inputs   { flex-direction: column !important; }
        }

        /* ── Large desktop (≥ 1280px) ── */
        @media (min-width: 1280px) {
          .ti-layout { grid-template-columns: 360px 1fr !important; }
        }
      `}</style>

      <div
        className="ti-layout"
        style={isMobile ? {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        } : s.layout}
      >

        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════════════════════════════ */}
        <aside
          className="ti-left-col"
          style={isMobile ? { display: 'none' } : s.leftCol}
        >

          {/* ── Live preview ── */}
          <div style={s.previewCard} className="ti-preview-card">
            <div style={s.previewHeader}>
              <span style={s.eyebrow}>Live preview</span>
              <span style={s.livePill}>
                <span style={s.liveDot} />
                Live
              </span>
            </div>

            <div style={s.previewBody}>
              <div style={s.previewAvatarOuter}>
                <div style={s.previewAvatarInner}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={s.previewAvatarImg} />
                  ) : (
                    <span style={s.previewAvatarInitials}>
                      {(profile?.display_name || 'TI').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <p style={s.previewMicroLabel}>Digital profile</p>
              <h2 style={s.previewName}>{profile?.display_name || 'Your name'}</h2>
              <p style={s.previewRole}>{profile?.role || 'Your role'}</p>
              {profile?.bio && <p style={s.previewBio}>{profile.bio}</p>}

              <div style={s.previewLinks}>
                {activeLinks.length > 0
                  ? activeLinks.slice(0, 4).map((l) => (
                      <div key={l.id} style={s.previewLinkPill}>{l.label}</div>
                    ))
                  : ['Instagram', 'Portfolio', 'Contact'].map((l) => (
                      <div key={l} style={s.previewLinkPillDim}>{l}</div>
                    ))}
              </div>
            </div>

            {profile?.username ? (
              <div style={s.previewFooter}>
                <span style={s.previewUrl}>tappedin.uk/u/{profile.username}</span>
                <Link href={`/u/${profile.username}`} target="_blank" rel="noopener" className="ti-view-link" style={s.previewViewLink}>
                  View live →
                </Link>
              </div>
            ) : (
              <div style={s.previewFooter}>
                <span style={s.previewUrl}>Complete onboarding to claim your URL</span>
              </div>
            )}
          </div>

          {/* ── Analytics mini-cards ── */}
          <div style={s.miniStats} className="ti-preview-card">
            <div style={s.miniStatsHeader}>
              <span style={s.eyebrow}>Analytics</span>
              <Link href="/analytics" className="ti-mini-link" style={s.miniStatsLink}>Full view →</Link>
            </div>
            <div style={s.miniStatsGrid}>
              {[
                { label: 'NFC taps',    value: tapCount.toString() },
                { label: 'Link clicks', value: linkClickCount.toString() },
                { label: 'Today',       value: todayTaps.toString() },
                { label: 'CTR',         value: `${ctr}%` },
              ].map((row, i) => (
                <div key={i} style={s.miniStat}>
                  <div style={s.miniStatValue}>{row.value}</div>
                  <div style={s.miniStatLabel}>{row.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── NFC card panel ── */}
          <div style={s.nfcPanel} className="ti-nfc-panel">
            <div style={s.nfcPanelHeader}>
              <div>
                <p style={s.eyebrow}>NFC card</p>
                <h3 style={s.nfcPanelTitle}>Connected card</h3>
              </div>
              {card && cardStatusBadge && (
                <div style={cardStatusBadge}>
                  <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'currentColor', flexShrink:0, display:'inline-block' }} />
                  {card.status ?? 'Unknown'}
                </div>
              )}
            </div>

            {card ? (
              <>
                <div style={s.nfcCardVisual}>
                  <div style={s.nfcSheen} />
                  <div style={s.nfcCardTop}>
                    <span style={s.nfcBrand}>TAPPED-IN</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M5.5 12c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="1.75" fill="rgba(255,255,255,0.55)"/>
                    </svg>
                  </div>
                  <div style={s.nfcCardId}>{card.card_id}</div>
                </div>
                <div style={s.nfcStatsRow}>
                  <div style={s.nfcStat}>
                    <span style={s.nfcStatValue}>{tapCount}</span>
                    <span style={s.nfcStatLabel}>Total taps</span>
                  </div>
                  <div style={s.nfcStatDivider} />
                  <div style={s.nfcStat}>
                    <span style={s.nfcStatValue} title={lastTap ?? undefined}>
                      {lastTap ? lastTap.split(',')[0] : '—'}
                    </span>
                    <span style={s.nfcStatLabel}>Last tap</span>
                  </div>
                </div>
                <Link href={`/a/${card.card_id}`} className="ti-nfc-btn" style={s.nfcOpenBtn}>
                  Open NFC profile
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </>
            ) : (
              <div style={s.nfcEmptyState}>
                <div style={s.nfcEmptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                    <path d="M10 12c0-1.1.9-2 2-2s2 .9 2 2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.25)"/>
                  </svg>
                </div>
                <p style={s.nfcEmptyTitle}>No card connected</p>
                <p style={s.nfcEmptyText}>Your NFC card will appear here once activated and linked.</p>
              </div>
            )}
          </div>

          {/* ── Brand mark ── */}
          <div style={s.brandMark}>
            <span style={s.brandMarkLogo}>TAPPED-IN</span>
            <span style={s.brandMarkSlogan}>A new standard of Networking.</span>
          </div>

        </aside>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN
        ═══════════════════════════════════════════════════════════ */}
        <div
          className="ti-right-col"
          style={isMobile ? {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
          } : s.rightCol}
        >

          {/* ── Page header ── */}
          <div
            className="ti-page-header"
            style={isMobile ? {
              ...s.pageHeader,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
            } : s.pageHeader}
          >
            <div style={s.pageHeaderLeft}>
              <p style={s.eyebrow}>Dashboard</p>
              <h1 style={s.pageTitle} className="ti-page-title">
                {profile?.display_name || 'Your profile'}
              </h1>
            </div>
            {profile?.username && (
              <Link href={`/u/${profile.username}`} target="_blank" rel="noopener" className="ti-view-link" style={s.viewProfileBtn}>
                View live profile →
              </Link>
            )}
          </div>

          {/* ── Stats bar ── */}
          <div
            className="ti-stats-bar"
            style={isMobile ? {
              ...s.statsBar,
              gridTemplateColumns: '1fr 1fr',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            } : s.statsBar}
          >
            {[
              { label: 'Total taps',  value: tapCount.toString() },
              { label: 'Card status', value: card?.status ?? 'No card' },
              { label: 'Card ID',     value: card?.card_id ?? '—' },
              { label: 'Last tap',    value: lastTap ? lastTap.split(',')[0] : 'No activity' },
            ].map((stat, i) => (
              <div key={stat.label} className="ti-stat-cell" style={{
                ...s.statCell,
                borderRight: i < 3 ? borders.subtle : 'none',
              }}>
                <span style={s.statValue}>{stat.value}</span>
                <span style={s.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* ── Tabbed editor ── */}
          <div
            className="ti-editor-card"
            style={isMobile ? {
              ...s.editorCard,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflowX: 'hidden',
            } : s.editorCard}
          >

            {/* Tab bar */}
            <div
              className="ti-tab-bar"
              style={isMobile ? {
                ...s.tabBar,
                padding: '0.875rem 0.75rem 0',
                overflowX: 'auto',
                width: '100%',
                boxSizing: 'border-box',
              } : s.tabBar}
            >
              {(['profile', 'links', 'style', 'card'] as ActiveTab[]).map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="ti-tab"
                    style={isActive ? s.tabActive : s.tab}
                  >
                    {tab === 'profile' && 'Profile'}
                    {tab === 'links'   && `Links${links.filter(l => l.is_active && l.label).length > 0 ? ` (${links.filter(l => l.is_active && l.label).length})` : ''}`}
                    {tab === 'style'   && 'Style'}
                    {tab === 'card'    && 'Card'}
                  </button>
                )
              })}
            </div>

            <div style={s.tabDivider} />

            {/* ────── PROFILE TAB ────── */}
            {activeTab === 'profile' && (
              <div style={isMobile ? { ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.tabContent}>
                {/* ── Avatar upload row ── */}
                <div
                  className="ti-avatar-row"
                  style={isMobile ? {
                    ...s.avatarRow,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  } : s.avatarRow}
                >

                  {/* Clickable avatar — acts as the upload trigger */}
                  <button
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Click to change avatar"
                    style={s.avatarUploadTrigger}
                    aria-label="Upload avatar"
                  >
                    {/* Spinner overlay while uploading */}
                    {uploading && (
                      <div style={s.avatarSpinnerOverlay}>
                        <div style={s.avatarSpinner} />
                      </div>
                    )}

                    {/* Image or initials — show preview first, then saved URL, then initials */}
                    {(avatarPreview ?? profile?.avatar_url) ? (
                      <img
                        src={avatarPreview ?? profile!.avatar_url!}
                        alt="Avatar"
                        style={{ ...s.avatarImg, opacity: uploading ? 0.4 : 1 }}
                      />
                    ) : (
                      <span style={{ ...s.avatarInitials, opacity: uploading ? 0.3 : 1 }}>
                        {(profile?.display_name || 'TI').slice(0, 2).toUpperCase()}
                      </span>
                    )}

                    {/* Camera icon hint on hover (CSS handles visibility) */}
                    <div style={s.avatarCameraHint} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </button>

                  <div style={s.avatarMeta}>
                    <p style={s.avatarName}>{profile?.display_name || 'Your name'}</p>
                    <p style={s.avatarSub}>
                      {profile?.username ? `tappedin.uk/u/${profile.username}` : 'Username not set'}
                    </p>

                    {/* Upload button */}
                    <button
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      disabled={uploading}
                      className="ti-upload-btn"
                      style={s.uploadBtn}
                    >
                      {uploading ? (
                        <>
                          <span style={s.uploadSpinnerInline} />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M8 12V4M4 8l4-4 4 4"/>
                            <path d="M2 14h12"/>
                          </svg>
                          {profile?.avatar_url ? 'Change avatar' : 'Upload avatar'}
                        </>
                      )}
                    </button>

                    {/* Error message */}
                    {uploadError && (
                      <p style={s.uploadErrorMsg}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a1 1 0 100-2 1 1 0 000 2z"/>
                        </svg>
                        {uploadError}
                      </p>
                    )}

                    <p style={s.uploadHint}>JPG, PNG, WebP or GIF · max 5 MB</p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div
                  className="ti-form-grid"
                  style={isMobile ? { ...s.formGrid, gridTemplateColumns: '1fr' } : s.formGrid}
                >
                  <FormInput
                    label="Display name"
                    value={profile?.display_name ?? ''}
                    placeholder="Your full name"
                    onChange={(v) => patchProfile({ display_name: v })}
                  />
                  <FormInput
                    label="Role / headline"
                    value={profile?.role ?? ''}
                    placeholder="e.g. Videographer, Designer"
                    onChange={(v) => patchProfile({ role: v })}
                  />
                  <FormInput
                    label="Website"
                    value={profile?.website ?? ''}
                    placeholder="https://yoursite.com"
                    onChange={(v) => patchProfile({ website: v })}
                  />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormTextarea
                      label="Bio"
                      value={profile?.bio ?? ''}
                      placeholder="A short line about what you do"
                      onChange={(v) => patchProfile({ bio: v })}
                    />
                  </div>
                </div>

                <div style={s.tabFooter}>
                  <button
                    onClick={saveProfile}
                    disabled={profileSave === 'saving'}
                    className="ti-save-btn"
                    style={saveBtnCx(profileSave)}
                  >
                    {saveBtnLabel(profileSave, 'Save profile')}
                  </button>
                </div>
              </div>
            )}

            {/* ────── LINKS TAB ────── */}
            {activeTab === 'links' && (
              <div style={isMobile ? { ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.tabContent}>
                <div style={s.linksHeader}>
                  <p style={s.linksSubtitle}>
                    Add up to {MAX_LINKS} links. Select a platform, then enter the URL, phone number, or email address.
                  </p>
                </div>

                <div style={s.linksList}>
                  {links.map((link, i) => {
                    const kind = detectLinkKind(link.label)
                    const err  = linkErrors[i]
                    return (
                      <div key={link.id} style={s.linkRowWrap}>
                        <div style={s.linkRow}>
                          {/* Active toggle */}
                          <button
                            onClick={() => patchLink(i, { is_active: !link.is_active })}
                            className="ti-link-toggle"
                            title={link.is_active ? 'Active — click to hide' : 'Hidden — click to show'}
                            style={{
                              ...s.linkToggle,
                              background: link.is_active ? colors.accent.successBg : colors.white[3],
                              border: `1px solid ${link.is_active ? colors.accent.successBorder : colors.border.subtle}`,
                              boxShadow: link.is_active ? `0 0 8px rgba(74,222,128,0.12)` : 'none',
                            }}
                          >
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: link.is_active ? colors.accent.success : colors.text.faint,
                              boxShadow: link.is_active ? `0 0 5px ${colors.accent.success}` : 'none',
                              transition: transitions.base,
                            }} />
                          </button>

                          {/* Inputs */}
                          <div style={s.linkInputs} className="ti-link-inputs">
                            {/* Platform dropdown — replaces free-text label */}
                            <div style={s.linkInputInner}>
                              <select
                                value={link.label}
                                onChange={(e) => {
                                  // Clear URL when switching platform so stale values don't persist
                                  patchLink(i, { label: e.target.value, url: '' })
                                }}
                                className="ti-link-select"
                                style={{
                                  ...inputs.base,
                                  ...s.linkSelect,
                                  opacity: link.is_active ? 1 : 0.45,
                                  borderColor: (err && !link.label) ? colors.accent.errorBorder : undefined,
                                }}
                              >
                                <option value="" disabled>Select platform…</option>
                                {PLATFORM_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                                ))}
                              </select>
                              {/* Kind badge — still shown for context */}
                              {link.label && (
                                <div style={{
                                  ...s.linkKindBadge,
                                  ...(kind === 'whatsapp' ? s.linkKindWa : kind === 'email' ? s.linkKindEmail : s.linkKindUrl),
                                }}>
                                  {kind === 'whatsapp' ? 'WA' : kind === 'email' ? 'Email' : 'URL'}
                                </div>
                              )}
                            </div>

                            {/* URL / phone / email value */}
                            <input
                              value={link.url}
                              placeholder={urlPlaceholder(link.label)}
                              inputMode={urlInputMode(link.label) as 'tel' | 'email' | 'url' | 'text'}
                              autoComplete={kind === 'email' ? 'email' : kind === 'whatsapp' ? 'tel' : 'url'}
                              onChange={(e) => patchLink(i, { url: e.target.value })}
                              style={{
                                ...inputs.base,
                                fontFamily: kind === 'url' ? font.mono : font.sans,
                                fontSize: kind === 'url' ? font.size.xs : font.size.sm,
                                opacity: link.is_active ? 1 : 0.45,
                                ...(err && link.label && !link.url ? { borderColor: colors.accent.errorBorder } : {}),
                                ...(err && link.url ? { borderColor: colors.accent.errorBorder } : {}),
                              }}
                            />
                          </div>
                        </div>

                        {/* Inline error */}
                        {err && (
                          <div style={s.linkError}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                              <circle cx="8" cy="8" r="7" stroke={colors.accent.error} strokeWidth="1.5"/>
                              <path d="M8 5v4M8 11v.5" stroke={colors.accent.error} strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {err}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add link */}
                {links.length < MAX_LINKS && (
                  <button onClick={addLink} className="ti-add-link" style={s.addLinkBtn}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Add link
                  </button>
                )}

                {links.length === 0 && (
                  <div style={s.emptyLinks}>
                    <p style={s.emptyLinksText}>No links yet. Add your first link above.</p>
                  </div>
                )}

                <div style={s.tabFooter}>
                  <p style={s.tabFooterHint}>
                    Active links appear on your public profile. Empty rows are automatically hidden.
                  </p>
                  <button
                    onClick={saveLinks}
                    disabled={linksSave === 'saving'}
                    className="ti-save-btn"
                    style={saveBtnCx(linksSave)}
                  >
                    {saveBtnLabel(linksSave, 'Save links')}
                  </button>
                  {/* Show real error detail so the cause is always visible */}
                  {linksSave === 'error' && saveError && (
                    <p style={s.saveErrorDetail}>{saveError}</p>
                  )}
                </div>
              </div>
            )}

            {/* ────── STYLE TAB ────── */}
            {activeTab === 'style' && (
              <div style={isMobile ? { ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.tabContent}>
                <div style={s.styleSection}>
                  <p style={s.styleSectionLabel}>Button style</p>
                  <p style={s.styleSectionHint}>Controls how your profile links appear to visitors.</p>
                  <div style={s.styleGrid}>
                    {BUTTON_STYLES.map((opt) => {
                      const sel = profile?.button_style === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => patchProfile({ button_style: opt.value })}
                          className="ti-style-opt"
                          style={{
                            ...s.styleOpt,
                            borderColor: sel ? colors.border.focus  : colors.border.subtle,
                            background:  sel ? colors.white[10]     : colors.white[3],
                            color:       sel ? colors.text.primary  : colors.text.muted,
                            boxShadow:   sel ? `0 0 0 1px ${colors.border.focus}, 0 2px 10px rgba(0,0,0,0.3)` : 'none',
                          }}
                        >
                          {sel && <span style={{ marginRight: 4, opacity: 0.7 }}>✓</span>}
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ ...s.styleSection, marginBottom: 0 }}>
                  <p style={s.styleSectionLabel}>Theme</p>
                  <p style={s.styleSectionHint}>Background colour used on your public profile.</p>
                  <div style={s.styleGrid}>
                    {THEME_STYLES.map((opt) => {
                      const sel = profile?.theme_style === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => patchProfile({ theme_style: opt.value })}
                          className="ti-style-opt"
                          style={{
                            ...s.styleOpt,
                            borderColor: sel ? colors.border.focus  : colors.border.subtle,
                            background:  sel ? colors.white[10]     : colors.white[3],
                            color:       sel ? colors.text.primary  : colors.text.muted,
                            boxShadow:   sel ? `0 0 0 1px ${colors.border.focus}, 0 2px 10px rgba(0,0,0,0.3)` : 'none',
                          }}
                        >
                          {sel && <span style={{ marginRight: 4, opacity: 0.7 }}>✓</span>}
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={s.tabFooter}>
                  <button
                    onClick={saveStyle}
                    disabled={styleSave === 'saving'}
                    className="ti-save-btn"
                    style={saveBtnCx(styleSave)}
                  >
                    {saveBtnLabel(styleSave, 'Save style')}
                  </button>
                </div>
              </div>
            )}

            {/* ────── CARD TAB ────── */}
            {activeTab === 'card' && (
              <div
                className="ti-card-tab-content"
                style={isMobile ? {
                  ...s.tabContent,
                  padding: '1rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflowX: 'hidden',
                } : s.tabContent}
              >

                {/* ── QR code card — always shown when username exists ── */}
                {profile?.username ? (
                  <div
                    className="ti-qr-card"
                    style={isMobile ? {
                      ...s.qrCard,
                      flexDirection: 'column',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    } : s.qrCard}
                  >
                    {/* Left: QR canvas */}
                    <div style={s.qrCanvasWrap} className="ti-qr-canvas-wrap">
                      <div style={s.qrGlow} aria-hidden="true" />
                      <QRCanvas
                        url={`https://tappedin.uk/u/${profile.username}`}
                        size={160}
                        dark="#ffffff"
                        light="#0d0d0d"
                        canvasRef={qrCanvasRef}
                      />
                    </div>

                    {/* Right: URL + download */}
                    <div
                      className="ti-qr-meta"
                      style={isMobile ? {
                        ...s.qrMeta,
                        width: '100%',
                        minWidth: 0,
                        flex: '1 1 auto',
                      } : s.qrMeta}
                    >
                      <p style={s.eyebrow}>Your profile QR</p>
                      <p style={s.qrUrl}>tappedin.uk/u/{profile.username}</p>
                      <p style={s.qrHint}>
                        Scan to open your public profile. Download and print, or share digitally.
                      </p>
                      <button
                        onClick={downloadQR}
                        className="ti-nfc-btn ti-qr-download-btn"
                        style={s.qrDownloadBtn}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 2v8M5 7l3 3 3-3"/>
                          <path d="M2 13h12"/>
                        </svg>
                        Download PNG
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={s.qrNoUsername}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.4" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                      <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
                    </svg>
                    <p style={s.nfcEmptyTitle}>Set a username to generate your QR</p>
                    <p style={s.nfcEmptyText}>Your QR code will appear here once you have a public profile URL.</p>
                  </div>
                )}

                {/* ── NFC card details — shown only when card is connected ── */}
                {card ? (
                  <>
                    <div style={{ ...s.tabDivider, margin: `${spacing[5]} 0` }} />

                    <div
                      className="ti-card-tab-visual"
                      style={isMobile ? {
                        ...s.cardTabVisual,
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      } : s.cardTabVisual}
                    >
                      <div style={s.nfcSheen} />
                      <div style={s.nfcCardTop}>
                        <span style={s.nfcBrand}>TAPPED-IN</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M5.5 12c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="1.75" fill="rgba(255,255,255,0.55)"/>
                        </svg>
                      </div>
                      <div style={s.nfcCardId}>{card.card_id}</div>
                    </div>

                    <div
                      className="ti-card-details"
                      style={isMobile ? {
                        ...s.cardDetails,
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      } : s.cardDetails}
                    >
                      {[
                        { label: 'Card ID',    value: card.card_id },
                        { label: 'Status',     value: card.status ?? 'Unknown' },
                        { label: 'NFC URL',    value: card.nfc_url ?? '—' },
                        { label: 'Total taps', value: tapCount.toString() },
                        { label: 'Last tap',   value: lastTap ?? 'No activity' },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="ti-card-detail-row"
                          style={isMobile ? {
                            ...s.cardDetailRow,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '2px',
                            padding: '0.625rem 0.875rem',
                          } : s.cardDetailRow}
                        >
                          <span
                            className="ti-card-detail-label"
                            style={isMobile ? {
                              ...s.cardDetailLabel,
                              fontSize: '0.6rem',
                              maxWidth: '100%',
                            } : s.cardDetailLabel}
                          >{row.label}</span>
                          <span
                            className="ti-card-detail-val"
                            style={isMobile ? {
                              ...s.cardDetailValue,
                              textAlign: 'left',
                              width: '100%',
                              maxWidth: '100%',
                              flex: 'none',
                              fontSize: font.size.xs,
                            } : s.cardDetailValue}
                          >{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/a/${card.card_id}`}
                      className="ti-nfc-btn ti-nfc-open-btn"
                      style={isMobile ? {
                        ...s.nfcOpenBtn,
                        marginTop: spacing[4],
                        display: 'flex',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      } : { ...s.nfcOpenBtn, marginTop: spacing[4], display: 'flex' }}
                    >
                      Open NFC activation page
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </>
                ) : (
                  <>
                    <div style={{ ...s.tabDivider, margin: `${spacing[5]} 0` }} />
                    <div style={s.cardTabEmpty}>
                      <div style={s.nfcEmptyIcon}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="6" width="18" height="13" rx="2" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
                          <path d="M10 12c0-1.1.9-2 2-2s2 .9 2 2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.22)"/>
                        </svg>
                      </div>
                      <p style={s.nfcEmptyTitle}>No card connected</p>
                      <p style={s.nfcEmptyText}>
                        Your NFC card will appear here once it has been activated and linked to your account.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* ── Analytics CTA ── */}
          <Link href="/analytics" className="ti-analytics" style={s.analyticsCard}>
            <div style={s.analyticsLeft}>
              <p style={s.eyebrow}>Analytics</p>
              <h3 style={s.analyticsTitle}>View full insights</h3>
              <p style={s.analyticsText}>
                Tap history, link click rates, CTR, and engagement — all in one view.
              </p>
            </div>
            <div style={s.analyticsArrowWrap}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>

        </div>
      </div>
    </main>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: colors.bg.page,
    color: colors.text.primary,
    fontFamily: font.sans,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflowX: 'hidden' as const,
    maxWidth: '100vw',
  },

  loadingPage: {
    minHeight: '100vh',
    background: colors.bg.page,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: radius.full,
    border: `1.5px solid ${colors.white[5]}`,
    borderTop: `1.5px solid ${colors.white[50]}`,
    animation: 'spin 0.75s linear infinite',
  },

  layout: {
    maxWidth: layout.maxWidth['3xl'],
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.75rem) clamp(1rem, 3vw, 2.25rem)',
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: spacing[7],
    alignItems: 'start',
    width: '100%',
    boxSizing: 'border-box' as const,
    overflowX: 'hidden' as const,
  },

  // ── LEFT COLUMN ──────────────────────────────────────────────────────────

  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    position: 'sticky',
    top: '2.75rem',
  },

  previewCard: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 8px 24px rgba(0,0,0,0.35)',
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[4]} ${spacing[5]}`,
    borderBottom: borders.subtle,
  },

  livePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.accent.success,
    letterSpacing: font.tracking.wide,
  },

  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: colors.accent.success,
    boxShadow: `0 0 6px ${colors.accent.success}`,
  },

  previewBody: {
    padding: `${spacing[6]} ${spacing[5]} ${spacing[5]}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  previewAvatarOuter: {
    width: '68px',
    height: '68px',
    borderRadius: '20px',
    padding: '2px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 100%)',
    marginBottom: spacing[3],
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },

  previewAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: '18px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #1a1a1a, #0f0f0f)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${colors.white[5]}`,
  },

  previewAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  previewAvatarInitials: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white[50],
    letterSpacing: font.tracking.snug,
  },

  previewMicroLabel: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.semibold,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: colors.text.ghost,
    marginBottom: spacing[1],
  },

  previewName: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.snug,
    color: colors.text.primary,
    marginBottom: '3px',
    lineHeight: font.leading.snug,
  },

  previewRole: {
    fontSize: font.size.sm,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: font.weight.regular,
    marginBottom: spacing[2],
  },

  previewBio: {
    fontSize: font.size.xs,
    color: colors.text.ghost,
    lineHeight: font.leading.relaxed,
    marginBottom: spacing[3],
    maxWidth: '200px',
    fontWeight: font.weight.light,
  },

  previewLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    width: '100%',
  },

  previewLinkPill: {
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radius.md,
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.12)',
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: '#000',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },

  previewLinkPillDim: {
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radius.md,
    background: colors.white[3],
    border: borders.subtle,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.white[30],
    textAlign: 'center',
  },

  previewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing['3.5']} ${spacing[5]}`,
    borderTop: borders.subtle,
    gap: spacing[3],
  },

  previewUrl: {
    fontSize: font.size['2xs'],
    color: colors.text.faint,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },

  previewViewLink: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    textDecoration: 'none',
    flexShrink: 0,
    transition: transitions.base,
  },

  // Mini analytics
  miniStats: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 4px 16px rgba(0,0,0,0.25)',
    padding: spacing[5],
  },

  miniStatsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  miniStatsLink: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    textDecoration: 'none',
    transition: transitions.base,
  },

  miniStatsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${spacing[3]} ${spacing[4]}`,
  },

  miniStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },

  miniStatValue: {
    fontSize: font.size['2xl'],
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    lineHeight: 1,
  },

  miniStatLabel: {
    fontSize: font.size['2xs'],
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    letterSpacing: font.tracking.wider,
    textTransform: 'uppercase' as const,
  },

  // NFC panel
  nfcPanel: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 4px 16px rgba(0,0,0,0.25)',
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
  },

  nfcPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },

  nfcPanelTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    marginTop: spacing[1],
    letterSpacing: font.tracking.snug,
  },

  nfcCardVisual: {
    ...cards.nfc,
    marginBottom: spacing['3.5'],
    boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  },

  nfcSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
    borderRadius: `${radius.xl} ${radius.xl} 0 0`,
    pointerEvents: 'none',
  },

  nfcCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },

  nfcBrand: {
    ...text.brandMark,
    fontSize: '0.6rem',
    letterSpacing: '0.24em',
    color: colors.white[50],
  },

  nfcCardId: {
    fontFamily: font.mono,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.white[70],
    letterSpacing: font.tracking.wider,
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
  },

  nfcStatsRow: {
    display: 'flex',
    alignItems: 'stretch',
    background: colors.white[3],
    border: `1px solid rgba(255,255,255,0.055)`,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing['3.5'],
  },

  nfcStat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: `${spacing[3]} ${spacing[2]}`,
  },

  nfcStatValue: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    lineHeight: 1,
  },

  nfcStatLabel: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    color: colors.text.muted,
  },

  nfcStatDivider: {
    width: '1px',
    background: colors.border.subtle,
    flexShrink: 0,
    alignSelf: 'stretch',
    margin: `${spacing[2]} 0`,
  },

  nfcOpenBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: radius.md,
    border: 'none',
    background: colors.white.full,
    color: '#000',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
    transition: transitions.button,
    whiteSpace: 'nowrap',
  },

  nfcEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `${spacing[5]} ${spacing[3]}`,
    gap: spacing[2],
  },

  nfcEmptyIcon: { marginBottom: spacing[1], opacity: 0.6 },
  nfcEmptyTitle: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: font.tracking.snug,
  },
  nfcEmptyText: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    fontWeight: font.weight.light,
    maxWidth: '220px',
  },

  brandMark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: `${spacing[3]} 0 ${spacing[1]}`,
  },

  brandMarkLogo: {
    ...text.brandMark,
    fontSize: '0.6rem',
    letterSpacing: '0.26em',
    color: 'rgba(255,255,255,0.14)',
  },

  brandMarkSlogan: {
    ...text.slogan,
    fontSize: font.size.xs,
    color: 'rgba(255,255,255,0.1)',
  },

  // ── RIGHT COLUMN ─────────────────────────────────────────────────────────

  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[4],
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
  },

  pageHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    flex: 1,
  },

  pageTitle: {
    fontSize: `clamp(${font.size['3xl']}, 4vw, ${font.size['4xl']})`,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    color: colors.text.primary,
    lineHeight: font.leading.tight,
    fontFamily: font.sans,
  },

  viewProfileBtn: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.text.muted,
    textDecoration: 'none',
    flexShrink: 0,
    transition: transitions.base,
    whiteSpace: 'nowrap',
  },

  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius.xl,
    overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 4px 16px rgba(0,0,0,0.25)',
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.04s both',
  },

  statCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: `clamp(0.75rem, 2vw, 1.1rem) clamp(0.75rem, 2vw, 1.35rem)`,
  },

  statValue: {
    fontSize: `clamp(${font.size.base}, 2vw, ${font.size.lg})`,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: font.leading.snug,
  },

  statLabel: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: font.tracking.widest,
    color: 'rgba(255,255,255,0.28)',
  },

  // ── Editor card (tabs)
  editorCard: {
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 8px 32px rgba(0,0,0,0.35)',
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.08s both',
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  },

  tabBar: {
    display: 'flex',
    padding: `${spacing[4]} ${spacing[4]} 0`,
    gap: spacing[1],
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
    overflowX: 'auto' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
    scrollbarWidth: 'none' as const,
  },

  tab: {
    background: 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    cursor: 'pointer',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text.muted,
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: `${radius.sm} ${radius.sm} 0 0`,
    transition: transitions.base,
    letterSpacing: font.tracking.normal,
    whiteSpace: 'nowrap',
    position: 'relative',
  },

  tabActive: {
    background: 'transparent',
    // Use individual border longhands to avoid React style conflict warning
    // (mixing shorthand 'border' with 'borderBottom' on alternating renders).
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: `2px solid ${colors.text.primary}`,
    cursor: 'pointer',
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: `${radius.sm} ${radius.sm} 0 0`,
    transition: transitions.base,
    letterSpacing: font.tracking.normal,
    whiteSpace: 'nowrap',
    position: 'relative',
  },

  tabDivider: {
    height: '1px',
    background: colors.border.subtle,
  },

  tabContent: {
    padding: `${spacing[5]} clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 1.75rem)`,
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
    overflowX: 'hidden' as const,
  },

  tabFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[6],
    paddingTop: spacing[5],
    borderTop: borders.subtle,
  },

  tabFooterHint: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    flex: 1,
    lineHeight: font.leading.normal,
  },

  // ── Profile tab
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[5],
    padding: `${spacing[4]} ${spacing[5]}`,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
    border: borders.subtle,
    borderRadius: radius.lg,
    marginBottom: spacing[6],
    flexWrap: 'wrap',
    boxShadow: '0 1px 0 rgba(255,255,255,0.035) inset',
  },

  avatarWrap: {
    width: '62px',
    height: '62px',
    borderRadius: radius.xl,
    overflow: 'hidden',
    background: colors.white[5],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  },

  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  avatarInitials: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: font.tracking.snug,
  },

  avatarMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '0',
  },

  avatarName: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  avatarSub: {
    fontSize: font.size.xs,
    color: colors.text.muted,
    fontWeight: font.weight.regular,
    marginBottom: spacing[2],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: `${spacing[2]} ${spacing['3.5']}`,
    borderRadius: radius.full,
    border: `1px solid ${colors.border.subtle}`,
    background: 'rgba(255,255,255,0.04)',
    color: colors.text.muted,
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: transitions.button,
    alignSelf: 'flex-start',
  },

  // ── Avatar upload trigger (the clickable avatar circle) ──────────────────

  avatarUploadTrigger: {
    position: 'relative' as const,
    width: '62px',
    height: '62px',
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    background: colors.white[5],
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
    cursor: 'pointer',
    padding: 0,
    // The camera hint overlay is toggled via CSS class — we use the :hover
    // pseudo-class in the <style> block injected in the render return.
  },

  avatarSpinnerOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  avatarSpinner: {
    width: '20px',
    height: '20px',
    borderRadius: '50%' as const,
    border: '2px solid rgba(255,255,255,0.15)',
    borderTop: '2px solid rgba(255,255,255,0.9)',
    animation: 'spin 0.75s linear infinite',
  },

  avatarCameraHint: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.52)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.85)',
    opacity: 0,
    // opacity toggled to 1 by .ti-avatar-trigger:hover rule in <style>
    transition: 'opacity 0.18s ease',
    zIndex: 1,
  },

  uploadSpinnerInline: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.18)',
    borderTop: `1.5px solid ${colors.text.muted}`,
    animation: 'spin 0.75s linear infinite',
    flexShrink: 0,
  } as CSSProperties,

  uploadErrorMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: font.size.xs,
    color: colors.accent.error,
    fontWeight: font.weight.medium,
    marginTop: spacing[1],
    lineHeight: font.leading.snug,
  },

  uploadHint: {
    fontSize: font.size['2xs'],
    color: colors.text.ghost,
    fontWeight: font.weight.regular,
    marginTop: '2px',
    letterSpacing: '0.01em',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${spacing[4]} ${spacing[5]}`,
  },

  // ── Links tab
  linksHeader: { marginBottom: spacing[4] },

  linksSubtitle: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    fontWeight: font.weight.regular,
    lineHeight: font.leading.normal,
  },

  linksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    marginBottom: spacing[4],
  },

  linkRowWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  },

  linkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
  },

  linkToggle: {
    width: '30px',
    height: '30px',
    borderRadius: radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: '8px',
    transition: transitions.smooth,
  },

  linkInputs: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  },

  linkInputInner: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  // Dropdown select — inherits inputs.base, overrides appearance
  linkSelect: {
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    paddingRight: '2rem',
    cursor: 'pointer',
    color: '#fff',                        // text colour of the selected value
    backgroundColor: 'rgba(255,255,255,0.05)',  // closed-state background
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  },

  saveErrorDetail: {
    marginTop: spacing[2],
    fontSize: font.size.xs,
    color: colors.accent.error,
    fontFamily: font.mono,
    lineHeight: font.leading.normal,
    wordBreak: 'break-all' as const,
  },

  linkKindBadge: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.58rem',
    fontWeight: font.weight.semibold,
    letterSpacing: '0.1em',
    padding: '2px 7px',
    borderRadius: radius.full,
    pointerEvents: 'none',
  },

  linkKindWa: {
    background: 'rgba(74,222,128,0.1)',
    color: colors.accent.success,
    border: `1px solid ${colors.accent.successBorder}`,
  },

  linkKindEmail: {
    background: 'rgba(251,191,36,0.08)',
    color: colors.accent.warning,
    border: '1px solid rgba(251,191,36,0.22)',
  },

  linkKindUrl: {
    background: colors.white[3],
    color: colors.text.faint,
    border: borders.subtle,
  },

  linkError: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[2],
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.accent.error,
    lineHeight: font.leading.normal,
    marginLeft: `calc(30px + ${spacing[3]})`, // align under inputs, not toggle
    padding: `${spacing[1]} 0`,
  },

  addLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: radius.md,
    border: borders.subtle,
    background: 'rgba(255,255,255,0.03)',
    color: colors.text.muted,
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.wide,
    cursor: 'pointer',
    transition: transitions.base,
  },

  emptyLinks: {
    padding: `${spacing[8]} ${spacing[4]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: borders.subtle,
    borderRadius: radius.lg,
    marginBottom: spacing[4],
    background: colors.white[3],
  },

  emptyLinksText: {
    fontSize: font.size.sm,
    color: colors.text.faint,
    textAlign: 'center',
  },

  // ── Style tab
  styleSection: { marginBottom: spacing[6] },

  styleSectionLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },

  styleSectionHint: {
    fontSize: font.size.xs,
    color: colors.text.faint,
    marginBottom: spacing[4],
    lineHeight: font.leading.normal,
  },

  styleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[3],
  },

  styleOpt: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: radius.lg,
    border: borders.subtle,
    background: colors.white[3],
    color: colors.text.muted,
    fontFamily: font.sans,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    cursor: 'pointer',
    transition: transitions.base,
    textAlign: 'left',
    letterSpacing: font.tracking.normal,
  },

  // ── Card tab
  cardTabVisual: {
    ...cards.nfc,
    marginBottom: spacing[5],
    minHeight: '80px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
    overflow: 'hidden' as const,
  },

  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: borders.subtle,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing[2],
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  },

  cardDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: borders.subtle,
    gap: spacing[4],
    minWidth: 0,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box' as const,
  },

  cardDetailLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.text.faint,
    letterSpacing: font.tracking.wider,
    textTransform: 'uppercase' as const,
    flexShrink: 0,
    maxWidth: '45%',
  },

  cardDetailValue: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text.secondary,
    fontFamily: font.mono,
    textAlign: 'right' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
    flex: '1 1 0',
  },

  cardTabEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `${spacing[10]} ${spacing[4]}`,
    gap: spacing[3],
  },

  // ── Analytics CTA
  analyticsCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: colors.bg.surface,
    border: borders.subtle,
    borderRadius: radius.xl,
    padding: `${spacing[5]} ${spacing[6]}`,
    textDecoration: 'none',
    color: colors.text.primary,
    transition: `border-color ${transitions.smooth}, background ${transitions.smooth}`,
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(255,255,255,0.045) inset, 0 4px 16px rgba(0,0,0,0.25)',
    animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.12s both',
  },

  analyticsLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  },

  analyticsTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    letterSpacing: font.tracking.snug,
    marginTop: spacing[1],
  },

  analyticsText: {
    fontSize: font.size.sm,
    color: 'rgba(255,255,255,0.32)',
    fontWeight: font.weight.light,
    lineHeight: font.leading.normal,
    marginTop: spacing[1],
  },

  analyticsArrowWrap: {
    width: '34px',
    height: '34px',
    borderRadius: radius.full,
    background: 'rgba(255,255,255,0.04)',
    border: borders.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  // ── QR card
  qrCard: {
    display: 'flex',
    gap: spacing[5],
    alignItems: 'flex-start',
    background: 'linear-gradient(150deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
    border: borders.subtle,
    borderRadius: radius.xl,
    padding: spacing[5],
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.35)',
    flexWrap: 'wrap' as const,
    marginBottom: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
    overflow: 'hidden',
  },

  qrCanvasWrap: {
    position: 'relative' as const,
    borderRadius: '12px',
    overflow: 'hidden' as const,
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    background: '#0d0d0d',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },

  qrGlow: {
    position: 'absolute' as const,
    inset: '-40px',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 65%)',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },

  qrMeta: {
    flex: '1 1 160px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing[2],
    minWidth: '0',
  },

  qrUrl: {
    fontFamily: font.mono,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.text.secondary,
    letterSpacing: '0.01em',
    wordBreak: 'break-all' as const,
    lineHeight: font.leading.snug,
    marginTop: '2px',
  },

  qrHint: {
    fontSize: font.size.xs,
    fontWeight: font.weight.light,
    color: colors.text.faint,
    lineHeight: font.leading.relaxed,
    marginBottom: spacing[2],
  },

  qrDownloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: radius.full,
    border: 'none',
    background: colors.white.full,
    color: '#000',
    fontFamily: font.sans,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: transitions.button,
    alignSelf: 'flex-start' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
    whiteSpace: 'nowrap' as const,
  },

  qrNoUsername: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: `${spacing[8]} ${spacing[4]}`,
    gap: spacing[3],
  },

  // ── Shared
  eyebrow: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.25)',
  },
}
