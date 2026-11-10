import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyLink, MemoryCard } from '../components/ui.jsx'
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

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

export default function Home({ memories }) {
  const latest = memories.slice(0, 3)
  const [joke, setJoke] = useState('')
  const [jokeMessage, setJokeMessage] = useState('')
  const [jokeLoading, setJokeLoading] = useState(false)
  const [fridge, setFridge] = useState('')
  const [dinners, setDinners] = useState([])
  const [dinnerMessage, setDinnerMessage] = useState('')
  const [dinnerLoading, setDinnerLoading] = useState(false)

  async function handleDinner() {
    const items = fridge.trim()
    setDinners([])
    setDinnerMessage('')
    if (!items) {
      setDinnerMessage('Please tell me what is in your fridge.')
      return
    }

    setDinnerLoading(true)
    try {
      const response = await fetch(apiUrl(`/api/dinner/ideas?ingredients=${encodeURIComponent(items)}`))
      const data = await response.json()
      if (data.status === 'ok') {
        setDinners(data.ideas)
      } else {
        setDinnerMessage(data.message)
      }
    } catch {
      setDinnerMessage('Could not get dinner ideas right now. Please try again.')
    } finally {
      setDinnerLoading(false)
    }
  }

  async function handleJoke() {
    setJokeLoading(true)
    setJoke('')
    setJokeMessage('')
    try {
      const response = await fetch(apiUrl('/api/jokes/random'))
      const data = await response.json()
      if (data.status === 'ok') {
        setJoke(data.joke)
      } else {
        setJokeMessage(data.message)
      }
    } catch {
      setJokeMessage('Could not get a joke right now. Please try again.')
    } finally {
      setJokeLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <section style={{ textAlign: 'center', padding: '32px 0 48px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 44, margin: '0 0 12px' }}>
          Keep the moments that matter
        </h1>
        <p style={{ fontSize: 18, color: colors.muted, margin: '0 0 28px' }}>
          A private book for small days, big feelings and the people in them.
        </p>
        <Link to="/new" style={buttonStyle}>
          Write a memory
        </Link>
        <div style={{ marginTop: 16 }}>
          <button type="button" style={{ ...buttonStyle, background: colors.ink }} onClick={handleJoke} disabled={jokeLoading}>
            {jokeLoading ? 'Thinking...' : 'Tell me a joke'}
          </button>
        </div>
        {joke && <p style={{ fontSize: 18, margin: '20px 0 0' }}>{joke}</p>}
        {jokeMessage && <p style={{ color: '#b91c1c', margin: '20px 0 0' }}>{jokeMessage}</p>}
      </section>

      <section style={{ padding: '0 0 48px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: '0 0 8px' }}>What is for dinner?</h2>
        <p style={{ color: colors.muted, margin: '0 0 16px' }}>Type what is in your fridge and get three dinner ideas.</p>
        <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
          <input
            type="text"
            value={fridge}
            onChange={(event) => setFridge(event.target.value)}
            placeholder="eggs, spinach, rice, cheese"
            style={inputStyle}
          />
          <div>
            <button type="button" style={{ ...buttonStyle, background: colors.ink }} onClick={handleDinner} disabled={dinnerLoading}>
              {dinnerLoading ? 'Thinking...' : 'Suggest 3 dinners'}
            </button>
          </div>
        </div>
        {dinners.length > 0 && (
          <ol style={{ fontSize: 18, margin: '20px 0 0', paddingLeft: 24 }}>
            {dinners.map((idea) => (
              <li key={idea} style={{ marginBottom: 8 }}>
                {idea}
              </li>
            ))}
          </ol>
        )}
        {dinnerMessage && <p style={{ color: '#b91c1c', margin: '20px 0 0' }}>{dinnerMessage}</p>}
      </section>

      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26 }}>Latest memories</h2>
      {latest.length > 0 ? (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {latest.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      ) : (
        <EmptyLink />
      )}
    </main>
  )
}
