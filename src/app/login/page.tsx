'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, string> = {
  verification_failed:
    'Email verification failed. Please try signing in or contact support.',
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.logo}>TAPPED-IN</h1>
      <p style={styles.subtitle}>Sign in to your account</p>

      {urlError && (
        <p style={styles.error}>
          {errorMessages[urlError] ?? 'Something went wrong. Please try again.'}
        </p>
      )}

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={styles.footer}>
        No account?{' '}
        <Link href="/signup" style={styles.link}>
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main style={styles.page}>
      <Suspense fallback={<div style={{ color: '#fff' }}>Loading…</div>}>
        <LoginForm />
      </Suspense>
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
  },
  logo: {
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
    margin: '0 0 2rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    backgroundColor: '#000',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.95rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '0.5rem',
    padding: '0.75rem',
    width: '100%',
  },
  error: {
    color: '#ff4444',
    fontSize: '0.85rem',
    margin: '0',
  },
  footer: {
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  link: {
    color: '#fff',
    textDecoration: 'underline',
  },
}