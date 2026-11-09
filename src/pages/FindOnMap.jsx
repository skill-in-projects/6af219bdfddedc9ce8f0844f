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

function apiUrl(path) {
  return `${window.CONFIG?.API_URL ?? ''}${path}`
}

export default function FindOnMap() {
  const [address, setAddress] = useState('')
  const [place, setPlace] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const query = address.trim()
    setPlace(null)
    setMessage('')
    if (!query) {
      setMessage('Please type an address.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(apiUrl(`/api/maps/locate?address=${encodeURIComponent(query)}`))
      const data = await response.json()
      if (data.status === 'ok') {
        setPlace(data)
      } else {
        setMessage(data.message)
      }
    } catch {
      setMessage('Could not reach the map service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Find on map</h1>
      <p style={{ color: colors.muted, margin: '0 0 16px' }}>Type an address to see where it is.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Address
          <input
            style={inputStyle}
            placeholder="For example: 10 Downing Street, London"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <div>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Searching...' : 'Show on map'}
          </button>
        </div>
      </form>

      {message && <p style={{ color: '#b91c1c', margin: '16px 0 0' }}>{message}</p>}

      {place && (
        <section style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{place.address}</p>
          <img
            src={apiUrl(`/api/maps/image?lat=${place.lat}&lng=${place.lng}`)}
            alt={`Map of ${place.address}`}
            onError={() => setMessage('The map image could not be loaded right now.')}
            style={{ width: '100%', maxWidth: 600, borderRadius: 16, border: `1px solid ${colors.line}` }}
          />
        </section>
      )}
    </main>
  )
}
