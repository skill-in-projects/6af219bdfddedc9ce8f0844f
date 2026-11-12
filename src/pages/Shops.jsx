import { useState } from 'react'
import { buttonStyle, colors } from '../components/theme.js'
import { NotSavedNote } from '../components/ui.jsx'

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

export default function Shops() {
  const [home, setHome] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [shops, setShops] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleAdd(event) {
    event.preventDefault()
    const shopName = name.trim()
    const shopAddress = address.trim()
    if (!shopName || !shopAddress) {
      setMessage('Please type a shop name and its address.')
      return
    }

    setShops((current) => [...current, { id: Date.now(), name: shopName, address: shopAddress, walk: null }])
    setName('')
    setAddress('')
    setMessage('')
  }

  function handleRemove(id) {
    setShops((current) => current.filter((shop) => shop.id !== id))
  }

  async function handleShowTimes() {
    const start = home.trim()
    setMessage('')
    if (!start) {
      setMessage('Please type your address first.')
      return
    }
    if (shops.length === 0) {
      setMessage('Add at least one shop first.')
      return
    }

    setLoading(true)
    try {
      for (const shop of shops) {
        let walk
        try {
          const response = await fetch(
            apiUrl(`/api/shops/walk-time?from=${encodeURIComponent(start)}&to=${encodeURIComponent(shop.address)}`),
          )
          walk = await response.json()
        } catch {
          walk = { status: 'error', message: 'Could not reach the map service. Please try again.' }
        }
        setShops((current) => current.map((item) => (item.id === shop.id ? { ...item, walk } : item)))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Shops</h1>
      <p style={{ color: colors.muted, margin: '0 0 16px' }}>
        Type your address and the shops you want to visit, then see how long it takes to walk to each one.
      </p>
      <NotSavedNote />

      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Your address
          <input
            style={inputStyle}
            placeholder="For example: 10 Downing Street, London"
            value={home}
            onChange={(e) => setHome(e.target.value)}
          />
        </label>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'grid', gap: 16, maxWidth: 640, marginTop: 32 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0 }}>Add a shop</h2>
        <label style={{ display: 'grid', gap: 6 }}>
          Shop name
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Shop address
          <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <div>
          <button type="submit" style={buttonStyle}>
            Add shop
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32 }}>
        <button type="button" style={{ ...buttonStyle, background: colors.ink }} onClick={handleShowTimes} disabled={loading}>
          {loading ? 'Checking...' : 'Show walking times'}
        </button>
      </div>

      {message && <p style={{ color: '#b91c1c', margin: '16px 0 0' }}>{message}</p>}

      {shops.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 12, maxWidth: 640 }}>
          {shops.map((shop) => (
            <li
              key={shop.id}
              style={{
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: 16,
                padding: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 20 }}>{shop.name}</h3>
                <p style={{ margin: 0, color: colors.muted }}>{shop.address}</p>
                {shop.walk?.status === 'ok' && (
                  <p style={{ margin: 0, fontWeight: 600, color: colors.accent }}>{shop.walk.minutes} min walk</p>
                )}
                {shop.walk && shop.walk.status !== 'ok' && (
                  <p style={{ margin: 0, color: '#b91c1c' }}>{shop.walk.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(shop.id)}
                style={{
                  background: 'none',
                  border: `1px solid ${colors.line}`,
                  borderRadius: 999,
                  padding: '6px 14px',
                  color: colors.muted,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
