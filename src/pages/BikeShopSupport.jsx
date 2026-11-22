import { useEffect, useState } from 'react'
import { buttonStyle, colors } from '../components/theme.js'

const inputStyle = {
  flex: 1,
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 10,
  border: `1px solid ${colors.line}`,
  fontSize: 16,
  fontFamily: 'inherit',
  background: colors.card,
  color: colors.ink,
}

const greeting = {
  role: 'model',
  text: 'Hi! Ask me about our repairs or when we are open.',
}

const quietButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
  border: `1px solid ${colors.onPaperAccent}`,
  color: colors.onPaper,
}

const CUSTOMER_KEY = 'bikeShopCustomerId'
const SIGN_IN_KEY = 'bikeShopSignIn'

// Each browser is one customer. The id is random and is only used to find this customer's saved conversation
function getCustomerId() {
  try {
    const saved = localStorage.getItem(CUSTOMER_KEY)
    if (saved) return saved
    const created = crypto.randomUUID()
    localStorage.setItem(CUSTOMER_KEY, created)
    return created
  } catch {
    // The browser does not allow saving here, so this visit gets a new customer id
    return crypto.randomUUID()
  }
}

// A signed-in customer keeps their sign-in on this browser, so the conversation follows them to any device
function getSavedToken() {
  try {
    return localStorage.getItem(SIGN_IN_KEY) || ''
  } catch {
    return ''
  }
}

function saveToken(token) {
  try {
    if (token) localStorage.setItem(SIGN_IN_KEY, token)
    else localStorage.removeItem(SIGN_IN_KEY)
  } catch {
    // The browser does not allow saving here, so the sign-in lasts only for this visit
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
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

export default function BikeShopSupport() {
  const [customerId] = useState(getCustomerId)
  const [token, setToken] = useState(getSavedToken)
  const [messages, setMessages] = useState([greeting])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resting, setResting] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [cowboyName, setCowboyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterBusy, setNewsletterBusy] = useState(false)

  // Shows the signed-in customer's conversation, or this browser's when no one is signed in
  useEffect(() => {
    setHistoryLoaded(false)
    fetch(apiUrl(`/api/bike-shop/chat?customerId=${encodeURIComponent(customerId)}`), { headers: authHeaders(token) })
      .then(async (response) => {
        if (await isResting(response)) {
          setResting(true)
          return
        }
        const data = await response.json()
        if (data.status === 'signed_out') {
          saveToken('')
          setToken('')
          setMessage(data.message)
          return
        }
        setMessages(data.status === 'ok' && data.messages.length > 0 ? data.messages : [greeting])
      })
      .catch(() => setMessage('Could not load your earlier conversation. Please try again.'))
      .finally(() => setHistoryLoaded(true))
  }, [customerId, token])

  function expireSignIn(text) {
    saveToken('')
    setToken('')
    setMessage(text)
  }

  function switchAuthMode(mode) {
    setAuthMode(mode)
    setAuthMessage('')
  }

  async function handleAuth(event) {
    event.preventDefault()
    setAuthMessage('')
    const signingUp = authMode === 'signup'
    if (signingUp && password !== confirm) {
      setAuthMessage('The two passwords do not match.')
      return
    }

    setAuthBusy(true)
    try {
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
      if (data.status === 'ok') {
        saveToken(data.token)
        setToken(data.token)
        setCowboyName('')
        setEmail('')
        setPassword('')
        setConfirm('')
        setMessage('')
      } else {
        setAuthMessage(data.message ?? 'Could not sign in right now. Please try again.')
      }
    } catch {
      setAuthMessage('Could not reach the sign-in service right now. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  function signOut() {
    saveToken('')
    setToken('')
    setMessage('')
  }

  async function startNewConversation() {
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(apiUrl(`/api/bike-shop/chat?customerId=${encodeURIComponent(customerId)}`), {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      const data = await response.json().catch(() => ({}))
      if (data.status === 'signed_out') {
        expireSignIn(data.message)
        return
      }
      if (!response.ok) {
        setMessage('Could not start a new conversation right now. Please try again.')
        return
      }
      setMessages([greeting])
    } catch {
      setMessage('Could not reach the shop assistant right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleNewsletter(event) {
    event.preventDefault()
    setNewsletterMessage('')
    setNewsletterBusy(true)
    try {
      const response = await fetch(apiUrl('/api/bike-shop/newsletter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      const data = await response.json().catch(() => ({}))
      if (data.status === 'ok') setNewsletterEmail('')
      setNewsletterMessage(data.message ?? 'Could not sign you up right now. Please try again.')
    } catch {
      setNewsletterMessage('Could not reach the sign-up right now. Please try again.')
    } finally {
      setNewsletterBusy(false)
    }
  }

  async function handleSend() {
    const text = question.trim()
    if (!text || loading) return

    setMessages((current) => [...current, { role: 'user', text }])
    setQuestion('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/bike-shop/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ customerId, message: text }),
      })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      const data = await response.json()
      if (data.status === 'ok') {
        setMessages((current) => [...current, { role: 'model', text: data.reply }])
      } else if (data.status === 'signed_out') {
        expireSignIn(data.message)
      } else {
        setMessage(data.message)
      }
    } catch {
      setMessage('Could not reach the shop assistant right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (resting) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 26 }}>This app is resting and will be back soon.</p>
      </main>
    )
  }

  const signingUp = authMode === 'signup'

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px', color: colors.onPaper }}>
        Bike shop help
      </h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Ask about repairs, prices or opening hours. Your conversation is saved, so it is still here when you come back.
      </p>

      {token ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <span style={{ color: colors.onPaperMuted }}>You are signed in. Your conversation follows you to any device.</span>
          <button type="button" style={quietButtonStyle} onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : (
        <section style={{ marginBottom: 24, color: colors.onPaper }}>
          <p style={{ color: colors.onPaperMuted, margin: '0 0 12px' }}>Sign in to see your conversation on any device.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button type="button" style={signingUp ? quietButtonStyle : buttonStyle} onClick={() => switchAuthMode('signin')}>
              Sign in
            </button>
            <button type="button" style={signingUp ? buttonStyle : quietButtonStyle} onClick={() => switchAuthMode('signup')}>
              Create account
            </button>
          </div>
          <form onSubmit={handleAuth} style={{ display: 'grid', gap: 12 }}>
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
              <button type="submit" style={buttonStyle} disabled={authBusy}>
                {authBusy ? 'Please wait...' : signingUp ? 'Create account' : 'Sign in'}
              </button>
            </div>
          </form>
          {authMessage && <p style={{ color: colors.onPaperAccent, margin: '16px 0 0' }}>{authMessage}</p>}
        </section>
      )}

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        {messages.map((item, index) => {
          const fromUser = item.role === 'user'
          return (
            <div
              key={index}
              style={{
                justifySelf: fromUser ? 'end' : 'start',
                maxWidth: '85%',
                background: fromUser ? colors.accent : colors.card,
                color: fromUser ? '#ffffff' : colors.ink,
                borderRadius: 16,
                padding: '12px 16px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {item.text}
            </div>
          )
        })}
        {loading && <p style={{ color: colors.onPaperMuted, margin: 0 }}>Checking...</p>}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSend()
        }}
        style={{ display: 'flex', gap: 12 }}
      >
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question"
          style={inputStyle}
          disabled={!historyLoaded}
        />
        <button type="submit" style={buttonStyle} disabled={loading || !historyLoaded}>
          Send
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <button type="button" style={quietButtonStyle} onClick={startNewConversation} disabled={loading || !historyLoaded}>
          Start a new conversation
        </button>
      </div>

      {message && <p style={{ color: colors.onPaperAccent, margin: '20px 0 0' }}>{message}</p>}

      <section style={{ marginTop: 40, color: colors.onPaper }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: '0 0 8px' }}>Get news from the bike shop</h2>
        <p style={{ color: colors.onPaperMuted, margin: '0 0 12px' }}>Leave your email and we will keep you posted.</p>
        <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Field label="Email" type="email" autoComplete="email" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} required />
          <div style={{ alignSelf: 'end' }}>
            <button type="submit" style={buttonStyle} disabled={newsletterBusy}>
              {newsletterBusy ? 'Please wait...' : 'Sign up'}
            </button>
          </div>
        </form>
        {newsletterMessage && <p style={{ color: colors.onPaperAccent, margin: '12px 0 0' }}>{newsletterMessage}</p>}
      </section>
    </main>
  )
}
