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

const STORAGE_KEY = 'bikeShopChat'

// The conversation is kept in this browser, so it is there when the customer comes back on the same device
function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch {
    // Nothing saved yet, or the saved copy cannot be read
  }
  return [greeting]
}

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

export default function BikeShopSupport() {
  const [messages, setMessages] = useState(loadMessages)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // The browser does not allow saving here, so the chat only lasts until the page is reloaded
    }
  }, [messages])

  function startNewConversation() {
    setMessages([greeting])
    setMessage('')
  }

  async function handleSend() {
    const text = question.trim()
    if (!text || loading) return

    const history = messages
    setMessages([...messages, { role: 'user', text }])
    setQuestion('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/bike-shop/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
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

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px', color: colors.onPaper }}>
        Bike shop help
      </h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Ask about repairs, prices or opening hours. Your conversation is kept on this device.
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
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          Send
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <button type="button" style={quietButtonStyle} onClick={startNewConversation} disabled={loading}>
          Start a new conversation
        </button>
      </div>

      {message && <p style={{ color: colors.onPaperAccent, margin: '20px 0 0' }}>{message}</p>}
    </main>
  )
}
