export default function VerifyEmailPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>TAPPED-IN</h1>
        <div style={styles.iconWrap}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>
        <h2 style={styles.heading}>Check your email</h2>
        <p style={styles.body}>
          We&apos;ve sent a verification link to your email address. Click the link
          to activate your account and continue.
        </p>
        <p style={styles.hint}>
          Can&apos;t find it? Check your spam folder.
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    margin: '0 0 2rem 0',
  },
  iconWrap: {
    marginBottom: '1.25rem',
  },
  heading: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: '0 0 0.75rem 0',
  },
  body: {
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    margin: '0 0 1rem 0',
  },
  hint: {
    color: '#555',
    fontSize: '0.8rem',
  },
}