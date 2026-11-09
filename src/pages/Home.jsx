import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyLink, MemoryCard } from '../components/ui.jsx'
import { buttonStyle, colors } from '../components/theme.js'

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

export default function Home({ memories }) {
  const latest = memories.slice(0, 3)
  const [joke, setJoke] = useState('')
  const [jokeMessage, setJokeMessage] = useState('')
  const [jokeLoading, setJokeLoading] = useState(false)

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
