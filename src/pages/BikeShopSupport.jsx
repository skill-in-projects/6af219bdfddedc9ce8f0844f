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

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

// The database is over its limit for now, so the whole page shows the resting message
async function isResting(response) {
  if (response.status !== 503) return false
  const data = await response.json().catch(() => ({}))
  return data.code === 'database_resting'
}

export default function BikeShopSupport() {
  const [customerId] = useState(getCustomerId)
  const [messages, setMessages] = useState([greeting])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resting, setResting] = useState(false)

  useEffect(() => {
    fetch(apiUrl(`/api/bike-shop/chat?customerId=${encodeURIComponent(customerId)}`))
      .then(async (response) => {
        if (await isResting(response)) {
          setResting(true)
          return
        }
        const data = await response.json()
        if (data.status === 'ok' && data.messages.length > 0) setMessages(data.messages)
      })
      .catch(() => setMessage('Could not load your earlier conversation. Please try again.'))
      .finally(() => setHistoryLoaded(true))
  }, [customerId])

  async function startNewConversation() {
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(apiUrl(`/api/bike-shop/chat?customerId=${encodeURIComponent(customerId)}`), {
        method: 'DELETE',
      })
      if (await isResting(response)) {
        setResting(true)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, message: text }),
      })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      const data = await response.json()
      if (data.status === 'ok') {
        setMessages((current) => [...current, { role: 'model', text: data.reply }])
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

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px', color: colors.onPaper }}>
        Bike shop help
      </h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Ask about repairs, prices or opening hours. Your conversation is saved, so it is still here when you come back.
      </p>

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
    </main>
  )
}
