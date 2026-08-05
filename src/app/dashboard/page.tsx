'use client'

import BrandStudio from '@/components/BrandStudio'
import TeamDashboardLink from '@/components/TeamDashboardLink'
import MyNetwork from '@/components/MyNetwork'
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

function cleanUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
}

const USERNAME_REGEX = /^[a-z0-9-_]{3,30}$/

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
id: string
label: string
url: string
link_type: string | null
custom_label?: string | null
position: number
is_active: boolean
}

type CardRecord = {
  card_id: string
  status: string | null
  nfc_url: string | null
}

type GalleryItem = {
  id: string
  profile_id: string
  image_url: string
  caption: string | null
  position: number
}

type LocalGallerySlot = {
  dbId: string | null
  imageUrl: string | null
  preview: string | null
  caption: string
  uploading: boolean
  uploadError: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type ActiveTab = 'profile' | 'links' | 'style' | 'gallery' | 'card'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LINKS = 8
const MAX_GALLERY = 3
const GALLERY_MAX_BYTES = 10 * 1024 * 1024

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

const PLATFORM_OPTIONS = [
  { value: 'Instagram',    kind: 'url'      },
  { value: 'TikTok',       kind: 'url'      },
  { value: 'YouTube',      kind: 'url'      },
  { value: 'Spotify',      kind: 'url'      },
  { value: 'SoundCloud',   kind: 'url'      },
  { value: 'Apple Music',  kind: 'url'      },
  { value: 'Website',      kind: 'url'      },
  { value: 'Portfolio',    kind: 'url'      },
  { value: 'LinkedIn',     kind: 'url'      },
  { value: 'X / Twitter',  kind: 'url'      },
  { value: 'WhatsApp',     kind: 'whatsapp' },
  { value: 'Email',        kind: 'email'    },
  { value: 'Booking',      kind: 'url'      },
  { value: 'Reviews',      kind: 'url'      },
  { value: 'Custom', kind: 'custom' },
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
if (kind === 'email') return 'email'
return 'url'
}

function normaliseUrl(label: string, raw: string): string {
  const v = raw.trim()
  if (!v) return v
  const kind = detectLinkKind(label)
  if (label === 'Custom') {
const cleaned = v.replace(/\s+/g, '')

if (/^(\+?\d{7,15})$/.test(cleaned) || /^(0\d{9,14})$/.test(cleaned)) {
return `tel:${cleaned}`
}

if (cleaned.includes('@') && !cleaned.startsWith('mailto:')) {
return `mailto:${cleaned}`
}
}

  if (kind === 'whatsapp') {
    if (v.startsWith('https://wa.me/') || v.startsWith('http://wa.me/')) return v
    if (v.startsWith('wa.me/')) return `https://${v}`
    const stripped = v.replace(/[\s\-.()\[\]]/g, '')
    const withPlus = stripped.replace(/[^\d+]/g, '')
    const digitsRaw = withPlus.replace(/^\+/, '')
    let digits = digitsRaw
    if (digits.startsWith('00')) {
      digits = digits.slice(2)
    } else if (digits.startsWith('0')) {
      digits = '44' + digits.slice(1)
    }
    return `https://wa.me/${digits}`
  }

  if (kind === 'email') {
    let email = ''
    if (v.startsWith('mailto:')) {
      email = v.slice(7).split('?')[0].trim()
    } else if (v.startsWith('https://mail.google.com/')) {
      try {
        const url = new URL(v)
        email = url.searchParams.get('to') ?? ''
      } catch { email = '' }
    } else if (v.includes('@')) {
      email = v.trim()
    }
    if (email) {
      return `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${encodeURIComponent(email)}`
    }
    return v
  }

  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('mailto:') || v.startsWith('tel:')) return v
  return `https://${v}`
}

function validateLinkRow(label: string, url: string): string | null {
  const rawLabel = label.trim()
  const rawUrl   = url.trim()
  if (!rawLabel && !rawUrl) return null
  if (rawLabel && !rawUrl) return 'Add a URL, phone number, or email address'
  if (!rawLabel && rawUrl) return 'Add a label for this link'
  const kind = detectLinkKind(rawLabel)
  const normalised = normaliseUrl(rawLabel, rawUrl)
  if (kind === 'whatsapp') {
    const waMatch = normalised.match(/^https:\/\/wa\.me\/(\d+)$/)
    if (!waMatch) return 'Enter a phone number or WhatsApp link'
    const digitCount = waMatch[1].length
    if (digitCount < 8) return 'Phone number is too short — include your country code (e.g. 447901109774)'
    if (digitCount > 15) return 'Phone number is too long — check and re-enter'
    return null
  }
  if (kind === 'email') {
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
  if (rawLabel === 'Custom') {
const cleaned = rawUrl.replace(/\s+/g, '')

const isPhone =
/^(\+?\d{7,15})$/.test(cleaned) ||
/^(0\d{9,14})$/.test(cleaned)

if (isPhone) {
return null
}
}

try {
new URL(normalised)
return null
} catch {
return 'Enter a valid URL, phone number, or email'
}
}

// ─── Username normalisation ───────────────────────────────────────────────────

function normaliseUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/^-+|-+$/g, '')
}

// ─── Gallery helpers ──────────────────────────────────────────────────────────

function emptySlot(): LocalGallerySlot {
  return { dbId: null, imageUrl: null, preview: null, caption: '', uploading: false, uploadError: null }
}

function slotsFromDb(items: GalleryItem[]): LocalGallerySlot[] {
  const slots: LocalGallerySlot[] = [emptySlot(), emptySlot(), emptySlot()]
  items.forEach((item) => {
    const pos = Math.min(Math.max(item.position, 0), 2)
    slots[pos] = { dbId: item.id, imageUrl: item.image_url, preview: null, caption: item.caption ?? '', uploading: false, uploadError: null }
  })
  return slots
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

import type { MutableRefObject } from 'react'

type QRCanvasProps = {
  url:      string
  size?:    number
  dark?:    string
  light?:   string
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>
}

function QRCanvas({ url, size = 240, dark = '#ffffff', light = '#0a0a0a', canvasRef }: QRCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement | null>(null)
  const ref = canvasRef ?? internalRef

  useEffect(() => {
    if (!ref.current || !url) return
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(ref.current!, url, {
        width:  size,
        margin: 2,
        color: { dark, light },
        errorCorrectionLevel: 'M',
      }).catch(console.error)
    }).catch(() => {
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

// ─── Gallery slot component ───────────────────────────────────────────────────

function GallerySlot({
  slot,
  index,
  profileId,
  supabase,
  onChange,
  onRemove,
}: {
  slot: LocalGallerySlot
  index: number
  profileId: string
  supabase: ReturnType<typeof createClient>
  onChange: (patch: Partial<LocalGallerySlot>) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const imgSrc = slot.preview ?? slot.imageUrl

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

    if (!ALLOWED.includes(file.type)) {
      onChange({ uploadError: 'Please upload a JPG, PNG, or WebP image.' })
      return
    }

    if (file.size > GALLERY_MAX_BYTES) {
      onChange({ uploadError: 'Image must be smaller than 10 MB.' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange({ preview: reader.result, uploadError: null })
      }
    }
    reader.readAsDataURL(file)

    onChange({ uploading: true, uploadError: null })

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${profileId}/${Date.now()}_${index}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('profile-gallery')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        })

      if (storageError) {
        console.error('[Gallery upload]', storageError)
        onChange({
          uploading: false,
          uploadError: storageError.message || 'Upload failed — please try again.',
          preview: null,
        })
        return
      }

      const { data: urlData } = supabase.storage
        .from('profile-gallery')
        .getPublicUrl(filePath)

      onChange({
        uploading: false,
        imageUrl: urlData.publicUrl,
        preview: null,
      })
    } catch {
      onChange({
        uploading: false,
        uploadError: 'Something went wrong. Please try again.',
        preview: null,
      })
    }
  }

  return (
    <div style={gs.slotWrap}>
      <div style={gs.frame}>
        {imgSrc ? (
          <>
            <img src={imgSrc} alt="" style={gs.frameImg} />
            {slot.uploading && (
              <div style={gs.frameOverlay}>
                <div style={gs.uploadSpinner} />
              </div>
            )}
            {!slot.uploading && (
              <div style={gs.frameControls}>
                <button onClick={() => fileRef.current?.click()} style={gs.frameBtn} title="Replace image">
                  Replace
                </button>
                <button onClick={onRemove} style={{ ...gs.frameBtn, color: colors.accent.error }} title="Remove image">
                  Remove
                </button>
              </div>
            )}
          </>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={gs.frameEmpty} disabled={slot.uploading}>
            {slot.uploading ? (
              <div style={gs.uploadSpinner} />
            ) : (
              <span style={gs.frameEmptyLabel}>Add image</span>
            )}
          </button>
        )}
      </div>

      <div style={gs.captionWrap}>
        <input
          type="text"
          value={slot.caption}
          placeholder="Caption (optional)"
          maxLength={80}
          onChange={(e) => onChange({ caption: e.target.value })}
          style={{ ...inputs.base, ...gs.captionInput }}
        />
        <span style={gs.captionCount}>{slot.caption.length}/80</span>
      </div>

      {slot.uploadError && <p style={gs.slotError}>{slot.uploadError}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]               = useState(true)
  const [profile, setProfile]               = useState<Profile | null>(null)
  const [links, setLinks]                   = useState<ProfileLink[]>([])
  const [card, setCard]                     = useState<CardRecord | null>(null)
  const [tapCount, setTapCount]             = useState(0)
  const [linkClickCount, setLinkClickCount] = useState(0)
  const [lastTap, setLastTap]               = useState<string | null>(null)
  const [todayTaps, setTodayTaps]           = useState(0)
  const [profileSave, setProfileSave]       = useState<SaveState>('idle')
  const [linksSave, setLinksSave]           = useState<SaveState>('idle')
  const [saveError, setSaveError]           = useState<string | null>(null)
  const [styleSave, setStyleSave]           = useState<SaveState>('idle')
  const [gallerySave, setGallerySave]       = useState<SaveState>('idle')
  const [gallerySaveError, setGallerySaveError] = useState<string | null>(null)
  const [linkErrors, setLinkErrors]         = useState<(string | null)[]>([])
  const [activeTab, setActiveTab]           = useState<ActiveTab>('profile')
  const [userId, setUserId]                 = useState<string | null>(null)
  const [uploading, setUploading]           = useState(false)
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null)
  const [uploadError, setUploadError]       = useState<string | null>(null)
  const [usernameError, setUsernameError]   = useState<string | null>(null)
  const [gallerySlots, setGallerySlots]     = useState<LocalGallerySlot[]>([emptySlot(), emptySlot(), emptySlot()])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const qrCanvasRef  = useRef<HTMLCanvasElement | null>(null)


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

      const { data: galleryData } = await supabase
        .from('profile_gallery')
        .select('id, profile_id, image_url, caption, position')
        .eq('profile_id', userId)
        .order('position', { ascending: true })
      if (galleryData) setGallerySlots(slotsFromDb(galleryData as GalleryItem[]))

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
const timer = window.setTimeout(() => {
loadDashboard()
}, 0)

return () => window.clearTimeout(timer)
}, [])

  // ─── Save profile ──────────────────────────────────────────────────────────

  async function saveProfile() {
    if (!profile) return
    setUsernameError(null)

    const normUsername = cleanUsername(profile.username ?? '')

    if (normUsername && !USERNAME_REGEX.test(normUsername)) {
      setUsernameError('Username must be 3–30 characters and can only use letters, numbers, hyphens, or underscores.')
      return
    }

    if (normUsername) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normUsername)
        .neq('id', profile.id)
        .maybeSingle()
      if (existing) {
        setUsernameError(`"${normUsername}" is already taken. Please choose another.`)
        return
      }
    }

    try {
      setProfileSave('saving')
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name,
        bio:          profile.bio,
        role:         profile.role,
        website:      profile.website,
        accent_color: profile.accent_color,
        username:     normUsername || null,
      }).eq('id', profile.id)
      if (!error && normUsername !== (profile.username ?? '')) {
        setProfile(prev => prev ? { ...prev, username: normUsername || null } : null)
      }
      setProfileSave(error ? 'error' : 'saved')
      if (!error) setTimeout(() => setProfileSave('idle'), 2200)
    } catch {
      setProfileSave('error')
    }
  }

  // ─── Save links ────────────────────────────────────────────────────────────

  async function saveLinks() {
    setSaveError(null)
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id ?? userId
    if (!profile || !uid) {
      const msg = '[saveLinks] aborted — missing ' + (!profile ? 'profile' : 'uid')
      console.error(msg, { hasProfile: !!profile, uid })
      setSaveError(msg)
      setLinksSave('error')
      return
    }
    const errs = links.map(l => validateLinkRow(l.label, l.url))
    setLinkErrors(errs)
    if (errs.some(e => e !== null)) return
    setLinksSave('saving')

    const existingRows: {
id: string
user_id: string
profile_id: string
label: string
url: string
link_type: string
custom_label: string | null
position: number
is_active: boolean
}[] = []
    const newRows: {
user_id: string
profile_id: string
label: string
url: string
link_type: string
custom_label: string | null
position: number
is_active: boolean
}[] = []

    links.forEach((l, i) => {
      const isNew   = !l.id || l.id.startsWith('__new__')
      const active  = !!(l.label.trim() && l.url.trim()) && l.is_active
      const normUrl = normaliseUrl(l.label, l.url)
      const shared = {
user_id: uid,
profile_id: profile.id,
label: l.label.trim(),
url: normUrl,
link_type: detectLinkKind(l.label),
custom_label: l.custom_label ?? null,
position: i,
is_active: active,
}
      if (isNew) newRows.push(shared)
      else       existingRows.push({ id: l.id, ...shared })
    })

    console.group('[saveLinks] diagnostic')
    console.log('uid:        ', uid)
    console.log('profile.id: ', profile.id)
    console.log('uid === profile.id:', uid === profile.id)
    console.log('existingRows:', existingRows)
    console.log('newRows:     ', newRows)
    console.groupEnd()

    try {
      for (const row of existingRows) {
        const { error } = await supabase
          .from('profile_links')
          .update({
label: row.label,
url: row.url,
link_type: row.link_type,
custom_label: row.custom_label,
position: row.position,
is_active: row.is_active,
})
          .eq('id',      row.id)
          .eq('user_id', uid)
        if (error) {
          const msg = `Update failed: ${error.message} (code ${error.code})`
          console.error('[saveLinks] update error', error, 'row:', row)
          setSaveError(msg)
          setLinksSave('error')
          return
        }
      }
      if (newRows.length > 0) {
        const { error } = await supabase.from('profile_links').insert(newRows)
console.log('Inserted rows:', newRows)
        if (error) {
          const msg = `Update failed: ${error.message} (code ${error.code})`
          console.error('[saveLinks] insert error', error, 'rows:', newRows)
          setSaveError(msg)
          setLinksSave('error')
          return
        }
      }
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

  async function loadLinks(profileId?: string) {
    const pid = profileId ?? profile?.id
    if (!pid) return
    const { data } = await supabase
      .from('profile_links')
      .select('id, label, url, link_type, custom_label, position, is_active')
      .eq('profile_id', pid)
      .order('position', { ascending: true })
    if (data) {
      const mapped = (data as ProfileLink[]).map((l) => ({
...l,
label: l.label ?? '',
url: l.url ?? '',
link_type: l.link_type ?? null,
custom_label: l.custom_label ?? null,
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
      const { error } = await supabase
.from('profiles')
.update({
button_style: profile.button_style,
background_style: profile.background_style,
theme_style: profile.theme_style,
accent_color: profile.accent_color,
})
.eq('id', profile.id)
      setStyleSave(error ? 'error' : 'saved')
      if (!error) setTimeout(() => setStyleSave('idle'), 2200)
    } catch {
      setStyleSave('error')
    }
  }

  // ─── Save gallery ──────────────────────────────────────────────────────────

  async function saveGallery() {
    if (!profile) return
    setGallerySaveError(null)
    setGallerySave('saving')
    try {
      for (let i = 0; i < MAX_GALLERY; i++) {
        const slot = gallerySlots[i]
        if (!slot.imageUrl) {
          if (slot.dbId) {
            await supabase.from('profile_gallery').delete().eq('id', slot.dbId)
          }
          continue
        }
        const payload = {
          profile_id: profile.id,
          image_url:  slot.imageUrl,
          caption:    slot.caption.trim() || null,
          position:   i,
        }
        if (slot.dbId) {
          const { error } = await supabase.from('profile_gallery').update(payload).eq('id', slot.dbId)
          if (error) { setGallerySaveError(`Save failed: ${error.message}`); setGallerySave('error'); return }
        } else {
          const { data, error } = await supabase.from('profile_gallery').insert(payload).select('id').single()
          if (error) { setGallerySaveError(`Save failed: ${error.message}`); setGallerySave('error'); return }
          if (data) setGallerySlots(prev => prev.map((s, idx) => idx === i ? { ...s, dbId: data.id } : s))
        }
      }
      setGallerySave('saved')
      setTimeout(() => setGallerySave('idle'), 2200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setGallerySaveError(msg)
      setGallerySave('error')
    }
  }

  // ─── Avatar upload ─────────────────────────────────────────────────────────

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !profile) return
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_BYTES     = 5 * 1024 * 1024
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
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
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

  function patchGallerySlot(index: number, patch: Partial<LocalGallerySlot>) {
    setGallerySlots(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s))
  }

  function removeGallerySlot(index: number) {
    setGallerySlots(prev => prev.map((s, i) => i === index ? { ...emptySlot(), dbId: s.dbId } : s))
  }

  const ctr = tapCount > 0 ? Math.round((linkClickCount / tapCount) * 100) : 0
  const cardStatusBadge = card?.status
    ? statusBadgeStyle(card.status as Parameters<typeof statusBadgeStyle>[0])
    : null

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
  const anySlotUploading = gallerySlots.some(sl => sl.uploading)

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

        .ti-save-btn:hover   { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,255,255,0.18) !important; }
        .ti-save-btn:active  { transform: translateY(0) !important; }
        .ti-upload-btn:hover { border-color: ${colors.border.focus} !important; color: ${colors.white[90]} !important; background: rgba(255,255,255,0.06) !important; }
        button[aria-label="Upload avatar"]:not(:disabled):hover > div:last-of-type { opacity: 1 !important; }
        .ti-nfc-btn:hover  { background: #e8e8e8 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.35) !important; }
        .ti-nfc-btn:active { transform: translateY(0) !important; }
        .ti-analytics:hover { border-color: ${colors.border.strong} !important; background: rgba(255,255,255,0.04) !important; }
        .ti-view-link:hover { color: ${colors.white[90]} !important; }
        .ti-add-link:hover { border-color: ${colors.border.default} !important; color: ${colors.text.secondary} !important; background: rgba(255,255,255,0.05) !important; }
        .ti-tab:hover { color: ${colors.text.secondary} !important; }
        .ti-link-toggle:hover { opacity: 0.75 !important; }
        .ti-style-opt:hover { border-color: ${colors.border.strong} !important; background: rgba(255,255,255,0.06) !important; }
        select.ti-link-select option { background-color: #1a1a1a; color: #fff; }
        select.ti-link-select option:disabled { color: rgba(255,255,255,0.35); }
        select.ti-link-select:focus { border-color: ${colors.border.strong} !important; background-color: rgba(255,255,255,0.06) !important; outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important; }
        .ti-mini-link:hover { color: ${colors.white[70]} !important; }
        .ti-stat-cell:last-child { border-right: none !important; }
        .ti-gallery-frame-btn:hover { background: rgba(0,0,0,0.8) !important; }

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

        @media (max-width: 640px) {
          html, body { overflow-x: hidden !important; max-width: 100vw !important; }
          .ti-layout { padding: 1rem 0.875rem !important; gap: 0.875rem !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }
          .ti-right-col { gap: 0.875rem !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; box-sizing: border-box !important; overflow-x: hidden !important; }
          .ti-editor-card { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; min-width: 0 !important; overflow: hidden !important; }
          .ti-tab-bar { padding-left: 0.75rem !important; padding-right: 0.75rem !important; gap: 0 !important; overflow-x: auto !important; }
          .ti-tab-bar::-webkit-scrollbar { display: none !important; }
          .ti-card-tab-content { padding: 1.25rem 1rem !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }
          .ti-card-tab-visual { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; min-width: 0 !important; overflow: hidden !important; }
          .ti-card-details  { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; overflow: hidden !important; }
          .ti-card-detail-row { flex-direction: column !important; align-items: flex-start !important; gap: 0.2rem !important; padding: 0.625rem 0.875rem !important; }
          .ti-card-detail-label { max-width: 100% !important; font-size: 0.6rem !important; }
          .ti-card-detail-val { font-size: ${font.size.xs} !important; max-width: 100% !important; width: 100% !important; text-align: left !important; flex: none !important; }
          .ti-nfc-open-btn { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
          .ti-qr-card { flex-direction: column !important; align-items: stretch !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
          .ti-qr-canvas-wrap { flex-shrink: 0 !important; align-self: center !important; max-width: 100% !important; }
          .ti-qr-meta { width: 100% !important; min-width: 0 !important; }
          .ti-qr-download-btn { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; align-self: stretch !important; justify-content: center !important; }
          .ti-page-header   { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .ti-page-title    { font-size: ${font.size['3xl']} !important; }
          .ti-stats-bar     { grid-template-columns: 1fr 1fr !important; }
          .ti-avatar-row    { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .ti-nfc-panel     { padding: 1rem !important; width: 100% !important; box-sizing: border-box !important; min-width: 0 !important; }
          .ti-link-inputs   { flex-direction: column !important; }
          .ti-gallery-grid  { grid-template-columns: 1fr !important; }
        }

        @media (min-width: 1280px) {
          .ti-layout { grid-template-columns: 360px 1fr !important; }
        }
      `}</style>

      <div
        className="ti-layout"
        style={isMobile ? {
          display: 'flex', flexDirection: 'column', gap: '1rem', padding: '16px',
          width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden',
        } : s.layout}
      >

        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════════════════════════════ */}
        <aside className="ti-left-col" style={isMobile ? { display: 'none' } : s.leftCol}>

          <div style={s.previewCard} className="ti-preview-card">
            <div style={s.previewHeader}>
              <span style={s.eyebrow}>Live preview</span>
              <span style={s.livePill}><span style={s.liveDot} />Live</span>
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
                      <div key={l.id} style={s.previewLinkPill}>{l.custom_label || l.label}</div>
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
            display: 'flex', flexDirection: 'column', gap: '1rem',
            width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden',
          } : s.rightCol}
        >

          <div
            className="ti-page-header"
            style={isMobile ? { ...s.pageHeader, flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' } : s.pageHeader}
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

          <div
            className="ti-stats-bar"
            style={isMobile ? { ...s.statsBar, gridTemplateColumns: '1fr 1fr', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.statsBar}
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

          {/* Leave a review CTA */}
          <style>{`
            @keyframes tiReviewGlow {
              0%, 100% { box-shadow: 0 0 0 1px rgba(232,201,160,0.18), 0 8px 30px rgba(0,0,0,0.30); }
              50%      { box-shadow: 0 0 0 1px rgba(232,201,160,0.42), 0 10px 38px rgba(232,201,160,0.12); }
            }
            @keyframes tiReviewStar {
              0%, 100% { transform: scale(1);    opacity: 0.9; }
              50%      { transform: scale(1.14); opacity: 1; }
            }
            .ti-review-cta { animation: tiReviewGlow 3.4s ease-in-out infinite; transition: transform 0.18s ease, background 0.18s ease; }
            .ti-review-cta:hover { transform: translateY(-2px); background: rgba(232,201,160,0.06) !important; }
            .ti-review-cta:hover .ti-review-cta-arrow { transform: translateX(4px); }
            .ti-review-cta-star { animation: tiReviewStar 2.6s ease-in-out infinite; }
            .ti-review-cta-arrow { transition: transform 0.18s ease; }
          `}</style>
          <TeamDashboardLink />
          <MyNetwork />
          <Link href="/review" className="ti-review-cta" style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'linear-gradient(135deg, rgba(232,201,160,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(232,201,160,0.20)', borderRadius: '16px',
            padding: '16px 20px', textDecoration: 'none', color: '#fff',
          }}>
            <span className="ti-review-cta-star" style={{
              flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(232,201,160,0.10)', border: '1px solid rgba(232,201,160,0.25)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8C9A0" stroke="#E8C9A0" strokeWidth="1.2" strokeLinejoin="round">
                <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96z" />
              </svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>
                Enjoying Tapped-In? Leave a review
              </span>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                Share your experience - approved reviews feature on our homepage.
              </span>
            </span>
            <span className="ti-review-cta-arrow" style={{ flexShrink: 0, color: '#E8C9A0', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          <div
            className="ti-editor-card"
            style={isMobile ? { ...s.editorCard, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' } : s.editorCard}
          >

            <div
              className="ti-tab-bar"
              style={isMobile ? { ...s.tabBar, padding: '0.875rem 0.75rem 0', overflowX: 'auto', width: '100%', boxSizing: 'border-box' } : s.tabBar}
            >
              {(['profile', 'links', 'style', 'gallery', 'card'] as ActiveTab[]).map((tab) => {
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
                    {tab === 'gallery' && 'Gallery'}
                    {tab === 'card'    && 'Card'}
                  </button>
                )
              })}
            </div>

            <div style={s.tabDivider} />

            {/* ────── PROFILE TAB ────── */}
            {activeTab === 'profile' && (
              <div style={isMobile ? { ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.tabContent}>
                <div
                  className="ti-avatar-row"
                  style={isMobile ? { ...s.avatarRow, flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' } : s.avatarRow}
                >
                  <button
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Click to change avatar"
                    style={s.avatarUploadTrigger}
                    aria-label="Upload avatar"
                  >
                    {uploading && (
                      <div style={s.avatarSpinnerOverlay}>
                        <div style={s.avatarSpinner} />
                      </div>
                    )}
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

                  <div style={inputs.group}>
                    <label style={inputs.label}>Username</label>
                    <input
                      type="text"
                      value={profile?.username ?? ''}
                      placeholder="e.g. benpinner"
                      autoComplete="username"
                      maxLength={32}
                      onChange={(e) => {
                        patchProfile({ username: normaliseUsername(e.target.value) })
                        if (usernameError) setUsernameError(null)
                      }}
                      style={{
                        ...inputs.base,
                        ...(usernameError ? { borderColor: colors.accent.errorBorder } : {}),
                      }}
                    />
                    {usernameError && (
                      <p style={{ marginTop: spacing[1], fontSize: font.size.xs, color: colors.accent.error, lineHeight: font.leading.normal }}>
                        {usernameError}
                      </p>
                    )}
                    <p style={{ marginTop: spacing[1], fontSize: font.size['2xs'], color: colors.text.ghost, lineHeight: font.leading.normal }}>
                      {profile?.username
                        ? `tappedin.uk/u/${profile.username}`
                        : 'Letters, numbers, hyphens, underscores. Min 2 chars.'}
                    </p>
                  </div>

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

                          <div style={s.linkInputs} className="ti-link-inputs">
                            <div style={s.linkInputInner}>
                              <select
                                value={link.label}
                                onChange={(e) => {
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

{link.label === 'Custom' && (
<input
value={link.custom_label ?? ''}
placeholder="Button text (e.g. John, Call Mike)"
onChange={(e) =>
patchLink(i, {
custom_label: e.target.value,
})
}
style={{
...inputs.base,
marginTop: '0.75rem',
marginBottom: '0.75rem',
fontFamily: font.sans,
}}
/>
)}

{link.label && (
                                <div style={{
                                  ...s.linkKindBadge,
                                  ...(kind === 'whatsapp' ? s.linkKindWa : kind === 'email' ? s.linkKindEmail : s.linkKindUrl),
                                }}>
                                  {kind === 'whatsapp' ? 'WA' : kind === 'email' ? 'Email' : 'URL'}
                                </div>
                              )}
                            </div>

                            <input
                              value={
link.url.startsWith('tel:')
? link.url.replace('tel:', '')
: link.url.startsWith('mailto:')
? link.url.replace('mailto:', '')
: link.url
}
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
                  {linksSave === 'error' && saveError && (
                    <p style={s.saveErrorDetail}>{saveError}</p>
                  )}
                </div>
              </div>
            )}

            {/* -------- STYLE TAB -------- */}
{activeTab === 'style' && (
<BrandStudio
profile={profile}
patch={patchProfile}
onSave={saveStyle}
saveState={styleSave}
isMobile={isMobile}
previewLinks={links.filter((l) => l.is_active && l.label && l.url)}
/>
)}

            {/* ────── GALLERY TAB ────── */}
            {activeTab === 'gallery' && (
              <div style={isMobile ? { ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.tabContent}>
                <div style={s.linksHeader}>
                  <p style={s.linksSubtitle}>
                    Upload up to 3 images for your Featured Work section. Any aspect ratio — displayed in a 4:5 frame on your profile.
                  </p>
                </div>

                <div
                  className="ti-gallery-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: spacing[4],
                    marginBottom: spacing[5],
                  }}
                >
                  {gallerySlots.map((slot, i) => (
                    <GallerySlot
                      key={i}
                      slot={slot}
                      index={i}
                      profileId={profile?.id ?? ''}
                      supabase={supabase}
                      onChange={(patch) => patchGallerySlot(i, patch)}
                      onRemove={() => removeGallerySlot(i)}
                    />
                  ))}
                </div>

                <div style={s.tabFooter}>
                  <p style={s.tabFooterHint}>
                    JPG, PNG or WebP · max 10 MB each · captions optional, max 80 characters.
                  </p>
                  <button
                    onClick={saveGallery}
                    disabled={gallerySave === 'saving' || anySlotUploading}
                    className="ti-save-btn"
                    style={saveBtnCx(gallerySave)}
                  >
                    {anySlotUploading ? 'Uploading…' : saveBtnLabel(gallerySave, 'Save gallery')}
                  </button>
                  {gallerySave === 'error' && gallerySaveError && (
                    <p style={s.saveErrorDetail}>{gallerySaveError}</p>
                  )}
                </div>
              </div>
            )}

            {/* ────── CARD TAB ────── */}
            {activeTab === 'card' && (
              <div
                className="ti-card-tab-content"
                style={isMobile ? {
                  ...s.tabContent, padding: '1rem', width: '100%', maxWidth: '100%',
                  boxSizing: 'border-box', overflowX: 'hidden',
                } : s.tabContent}
              >
                {profile?.username ? (
                  <div
                    className="ti-qr-card"
                    style={isMobile ? { ...s.qrCard, flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.qrCard}
                  >
                    <div style={s.qrCanvasWrap} className="ti-qr-canvas-wrap">
                      <div style={s.qrGlow} aria-hidden="true" />
                      <QRCanvas
                        url={`https://tappedin.uk/a/${card?.card_id ?? ""}`}
                        size={160}
                        dark="#ffffff"
                        light="#0d0d0d"
                        canvasRef={qrCanvasRef}
                      />
                    </div>
                    <div
                      className="ti-qr-meta"
                      style={isMobile ? { ...s.qrMeta, width: '100%', minWidth: 0, flex: '1 1 auto' } : s.qrMeta}
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

                {card ? (
                  <>
                    <div style={{ ...s.tabDivider, margin: `${spacing[5]} 0` }} />
                    <div
                      className="ti-card-tab-visual"
                      style={isMobile ? { ...s.cardTabVisual, width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.cardTabVisual}
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
                      style={isMobile ? { ...s.cardDetails, width: '100%', maxWidth: '100%', boxSizing: 'border-box' } : s.cardDetails}
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
                            ...s.cardDetailRow, flexDirection: 'column', alignItems: 'flex-start',
                            gap: '2px', padding: '0.625rem 0.875rem',
                          } : s.cardDetailRow}
                        >
                          <span
                            className="ti-card-detail-label"
                            style={isMobile ? { ...s.cardDetailLabel, fontSize: '0.6rem', maxWidth: '100%' } : s.cardDetailLabel}
                          >{row.label}</span>
                          <span
                            className="ti-card-detail-val"
                            style={isMobile ? {
                              ...s.cardDetailValue, textAlign: 'left', width: '100%',
                              maxWidth: '100%', flex: 'none', fontSize: font.size.xs,
                            } : s.cardDetailValue}
                          >{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/a/${card.card_id}`}
                      className="ti-nfc-btn ti-nfc-open-btn"
                      style={isMobile ? {
                        ...s.nfcOpenBtn, marginTop: spacing[4], display: 'flex',
                        width: '100%', maxWidth: '100%', boxSizing: 'border-box',
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

          {(userId === 'f16d9181-fe6c-4b2a-8bd2-46b1bb8d736a' || userId === '32407af9-ec4d-4d71-a582-d4b6405b9857') && (
            <Link href="/admin/reviews" className="ti-admin-link" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(232,201,160,0.04)', border: '1px solid rgba(232,201,160,0.18)',
              borderRadius: '14px', padding: '14px 18px', textDecoration: 'none', color: '#fff',
            }}>
              <span style={{
                flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(232,201,160,0.10)', border: '1px solid rgba(232,201,160,0.22)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C9A0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v5c0 5-3.5 9-8 11-4.5-2-8-6-8-11V6z" />
                </svg>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Admin - Review moderation</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>Approve or reject customer reviews. Only you can see this.</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#E8C9A0' }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

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

// ─── Gallery slot styles ──────────────────────────────────────────────────────

const gs: Record<string, CSSProperties> = {
  slotWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  },
  frame: {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: '125%',
    borderRadius: radius.lg,
    overflow: 'hidden' as const,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${colors.border.subtle}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  frameImg: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  frameOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  frameControls: {
    position: 'absolute' as const,
    bottom: spacing[2],
    right: spacing[2],
    display: 'flex',
    gap: spacing[1],
    zIndex: 2,
  },
  frameBtn: {
    height: '26px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: radius.sm,
    background: 'rgba(0,0,0,0.62)',
    border: `1px solid rgba(255,255,255,0.12)`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontSize: font.size.xs,
    fontFamily: font.sans,
    fontWeight: font.weight.semibold,
  },
  frameEmpty: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: colors.text.ghost,
    width: '100%',
    height: '100%',
  },
  frameEmptyLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: 'rgba(255,255,255,0.18)',
    fontFamily: font.sans,
    letterSpacing: '0.02em',
  },
  uploadSpinner: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.15)',
    borderTop: '2px solid rgba(255,255,255,0.8)',
    animation: 'spin 0.75s linear infinite',
  },
  captionWrap: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  captionInput: {
    paddingRight: '2.5rem',
    fontSize: font.size.xs,
  } as CSSProperties,
  captionCount: {
    position: 'absolute' as const,
    right: spacing[2],
    fontSize: '0.62rem',
    color: colors.text.ghost,
    pointerEvents: 'none' as const,
    fontFamily: font.mono,
    userSelect: 'none' as const,
  },
  slotError: {
    fontSize: font.size.xs,
    color: colors.accent.error,
    lineHeight: font.leading.normal,
    fontWeight: font.weight.medium,
  },
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

  linkSelect: {
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    paddingRight: '2rem',
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    marginLeft: `calc(30px + ${spacing[3]})`,
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

  eyebrow: {
    ...text.eyebrow,
    fontSize: font.size['2xs'],
    letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.25)',
  },
}
