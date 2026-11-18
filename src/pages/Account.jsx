import { useState } from 'react'
import { buttonStyle, colors } from '../components/theme.js'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 10,
  border: `1px solid ${colors.line}`,
  fontSize: 16,
  fontFamily: 'inherit',
  background: colors.card,
  color: colors.ink,
}

const tabStyle = {
  ...buttonStyle,
  background: 'transparent',
  border: `1px solid ${colors.onPaperAccent}`,
  color: colors.onPaper,
}

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

// The database is over its limit for now, so the whole page shows the resting message
async function isResting(response) {
  if (response.status !== 503) return false
  const data = await response.json().catch(() => ({}))
  return data.code === 'database_resting'
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'grid', gap: 6, textAlign: 'left' }}>
      <span>{label}</span>
      <input style={inputStyle} {...props} />
    </label>
  )
}

export default function Account() {
  const [mode, setMode] = useState('signup')
  const [cowboyName, setCowboyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(null)
  const [resting, setResting] = useState(false)

  function switchMode(next) {
    setMode(next)
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (mode === 'signup' && password !== confirm) {
      setMessage('The two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const signingUp = mode === 'signup'
      const response = await fetch(apiUrl(signingUp ? '/api/auth/register' : '/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signingUp ? { cowboyName, email, password } : { email, password }),
      })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      const data = await response.json().catch(() => ({}))
      if (data.code === 'saving_data_needs_paid_workspace') {
        setMessage('Creating accounts needs a paid workspace.')
      } else if (data.status === 'ok') {
        setSignedIn({ cowboyName: data.cowboyName, token: data.token })
        setPassword('')
        setConfirm('')
      } else {
        setMessage(data.message ?? 'Could not sign in right now. Please try again.')
      }
    } catch {
      setMessage('Could not reach the sign-in service right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (resting) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 26 }}>This app is resting and will be back soon.</p>
      </main>
    )
  }

  if (signedIn) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, margin: '0 0 12px' }}>Welcome, {signedIn.cowboyName}!</h1>
        <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>You are signed in.</p>
        <button type="button" style={buttonStyle} onClick={() => setSignedIn(null)}>
          Sign out
        </button>
      </main>
    )
  }

  const signingUp = mode === 'signup'

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, margin: '0 0 20px' }}>Your cowboy account</h1>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
        <button type="button" style={signingUp ? buttonStyle : tabStyle} onClick={() => switchMode('signup')}>
          Sign up
        </button>
        <button type="button" style={signingUp ? tabStyle : buttonStyle} onClick={() => switchMode('signin')}>
          Sign in
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        {signingUp && (
          <Field label="Cowboy name" type="text" value={cowboyName} onChange={(event) => setCowboyName(event.target.value)} required />
        )}
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Field
          label="Password"
          type="password"
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {signingUp && (
          <Field
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        )}
        <div>
          <button type="submit" style={buttonStyle} disabled={busy}>
            {busy ? 'Please wait...' : signingUp ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </form>

      {message && <p style={{ color: colors.onPaperAccent, margin: '20px 0 0' }}>{message}</p>}
    </main>
  )
}
