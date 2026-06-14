'use client'

import Link from 'next/link'

const FOUNDERS_STRIPE_URL = 'https://buy.stripe.com/dRm8wR9TzeXvaRb5WvcfK00'

// Demo persona — fictional, so this page always renders without a live account.
const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Ellis;Maya;;;',
  'FN:Maya Ellis',
  'TITLE:Photographer & Creative Director',
  'URL:https://tappedin.uk/demo',
  'EMAIL:hello@mayaellis.studio',
  'END:VCARD',
].join('\n')

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #050505; }
  body { font-family: 'Oswald', Arial, sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
  @keyframes demoUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes demoGlow { 0%,100% { opacity: .45; transform: scale(1); } 50% { opacity: .8; transform: scale(1.05); } }
  @keyframes demoBlink{ 0%,100% { opacity: .25; } 50% { opacity: 1; } }
  .demo-link { transition: border-color .25s, background .25s, transform .25s cubic-bezier(0.16,1,0.3,1); }
  .demo-link:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
  .demo-save:hover { background: #ececec !important; transform: translateY(-1px); }
  .demo-get:hover { color: #fff !important; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`

const LINKS: { label: string; sub: string; icon: React.ReactNode; primary?: boolean; href: string }[] = [
  { label: 'Portfolio', sub: 'mayaellis.studio', href: '#', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>) },
  { label: 'Instagram', sub: '@maya.ellis', href: '#', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></svg>) },
  { label: 'Latest work — “NORTHERN LIGHT”', sub: 'Editorial series', href: '#', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>) },
  { label: 'Pricing & availability', sub: 'Booking Q3 2026', href: '#', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>) },
  { label: 'Book a session', sub: '', href: '#', primary: true, icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>) },
]

export default function DemoProfilePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1.25rem', position: 'relative', overflow: 'hidden' }}>

        {/* backdrop grid + glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)', backgroundSize: '72px 72px', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 72%)', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 72%)' }} />
        <div style={{ position: 'absolute', top: '34%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, height: 420, background: 'radial-gradient(ellipse, rgba(255,255,255,0.035) 0%, transparent 65%)', animation: 'demoGlow 6s ease-in-out infinite', filter: 'blur(16px)', pointerEvents: 'none' }} />

        {/* demo tag */}
        <div style={{ position: 'relative', marginBottom: '1.25rem', animation: 'demoUp .6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: '.6rem', fontWeight: 500, letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 14px' }}>Demo profile</span>
        </div>

        {/* profile card */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 430, animation: 'demoUp .7s cubic-bezier(0.16,1,0.3,1) .08s both' }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(155deg, rgba(14,14,14,0.97) 0%, rgba(9,9,9,0.99) 55%, rgba(12,12,12,0.97) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 50px 100px rgba(0,0,0,0.75), 0 20px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)', pointerEvents: 'none' }} />

            {/* header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem 0' }}>
              <div>
                <div style={{ fontSize: '.55rem', letterSpacing: '.26em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' }}>TAPPED-IN</div>
                <div style={{ fontSize: '.7rem', letterSpacing: '.04em', color: 'rgba(255,255,255,.42)' }}>@maya.ellis</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)', animation: 'demoBlink 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '.58rem', fontWeight: 500, color: 'rgba(255,255,255,.7)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Active</span>
              </div>
            </div>

            {/* identity */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 1.5rem 0' }}>
              <div style={{ width: 70, height: 70, borderRadius: 18, background: 'linear-gradient(145deg, #262626 0%, #0e0e0e 55%, #1a1a1a 100%)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 12px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 600, color: 'rgba(255,255,255,.82)', letterSpacing: '.06em', marginBottom: '.9rem' }}>ME</div>
              <div style={{ fontSize: '.6rem', letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: '.4rem' }}>Digital Profile</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '.01em', lineHeight: 1.05 }}>Maya Ellis</div>
              <div style={{ fontSize: '.74rem', fontWeight: 400, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: '.35rem' }}>Photographer · Manchester, UK</div>

              {/* founder badge */}
              <div style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, overflow: 'hidden', marginTop: '.9rem' }}>
                <span style={{ fontSize: '.58rem', fontWeight: 500, color: 'rgba(255,255,255,.6)', letterSpacing: '.16em', textTransform: 'uppercase', padding: '5px 10px' }}>Founder Edition</span>
                <span style={{ width: 1, background: 'rgba(255,255,255,0.16)' }} />
                <span style={{ fontSize: '.62rem', fontWeight: 600, color: '#fff', letterSpacing: '.08em', padding: '5px 10px', background: 'rgba(255,255,255,0.05)' }}>027 / 100</span>
              </div>

              <p style={{ fontSize: '.82rem', fontWeight: 300, color: 'rgba(255,255,255,.42)', lineHeight: 1.6, letterSpacing: '.01em', marginTop: '1rem', maxWidth: 320 }}>
                Brand &amp; portrait photography with an editorial edge. Studio and on-location, across the UK.
              </p>
            </div>

            {/* save contact */}
            <div style={{ padding: '1.25rem 1.5rem 0' }}>
              <a
                href={`data:text/vcard;charset=utf-8,${encodeURIComponent(VCARD)}`}
                download="maya-ellis.vcf"
                className="demo-save"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: '#fff', color: '#000', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', transition: 'background .2s, transform .2s' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                Save contact
              </a>
            </div>

            {/* links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem', padding: '1.1rem 1.5rem 1.5rem' }}>
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="demo-link"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                    border: l.primary ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.08)',
                    background: l.primary ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.045) 100%)' : 'rgba(255,255,255,0.025)',
                    boxShadow: l.primary ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <span style={{ color: l.primary ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)', display: 'flex', flexShrink: 0, width: 18 }}>{l.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '.82rem', fontWeight: l.primary ? 600 : 500, color: l.primary ? '#fff' : 'rgba(255,255,255,.85)', letterSpacing: '.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.label}</span>
                    {l.sub && <span style={{ display: 'block', fontSize: '.6rem', color: 'rgba(255,255,255,.32)', letterSpacing: '.04em', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.sub}</span>}
                  </span>
                  <span style={{ color: l.primary ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.3)', fontSize: '.85rem', flexShrink: 0 }}>↗</span>
                </a>
              ))}
            </div>

            {/* footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.9rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.045)' }}>
              <div>
                <div style={{ fontSize: '.55rem', letterSpacing: '.22em', color: 'rgba(255,255,255,.24)', textTransform: 'uppercase' }}>TAPPED-IN</div>
                <div style={{ fontSize: '.58rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.2)' }}>A new standard of Networking.</div>
              </div>
              <span style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>428 taps</span>
            </div>
          </div>
        </div>

        {/* convert */}
        <div style={{ position: 'relative', marginTop: '1.75rem', textAlign: 'center', animation: 'demoUp .7s cubic-bezier(0.16,1,0.3,1) .18s both' }}>
          <p style={{ fontSize: '.78rem', fontWeight: 300, color: 'rgba(255,255,255,.32)', letterSpacing: '.02em', marginBottom: '.85rem' }}>This is a live example. Yours would look just like it.</p>
          <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={FOUNDERS_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 3, background: '#fff', color: '#000', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' }}>Get your card</Link>
            <Link href="/" className="demo-get" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontSize: '.82rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>← Back to site</Link>
          </div>
        </div>
      </main>
    </>
  )
}
