import { useEffect, useState } from 'react'
import JumpingElephant from '../components/JumpingElephant.jsx'
import { colors } from '../components/theme.js'

const selectStyle = {
  width: '100%',
  maxWidth: 520,
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 10,
  border: `1px solid ${colors.line}`,
  fontSize: 16,
  fontFamily: 'inherit',
  background: colors.card,
  color: colors.ink,
}

const HATS = ['#6b4423', '#2f2a24', '#8a5a2b', '#d8c3a5']

// Each cowboy gets its own shirt and jeans colors (spread around the color wheel by id) and one of the hats
function lookFor(cowboy) {
  const hue = (cowboy.id * 137.508) % 360
  return {
    shirt: `hsl(${hue} 65% 45%)`,
    jeans: `hsl(${(hue + 180) % 360} 35% 35%)`,
    hat: HATS[cowboy.id % HATS.length],
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

export default function CowboyGame() {
  const [cowboys, setCowboys] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [resting, setResting] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/cowboys'))
      .then(async (response) => {
        if (await isResting(response)) setResting(true)
        else if (response.ok) setCowboys(await response.json())
        else setMessage('Could not load the cowboys right now. Please try again.')
      })
      .catch(() => setMessage('Could not load the cowboys right now. Please try again.'))
  }, [])

  // Each click during the puff gives the chosen cowboy a 10% raise, saved in the database
  async function handleRaise() {
    if (!selectedId) {
      setMessage('Choose a cowboy first.')
      return
    }

    try {
      const response = await fetch(apiUrl(`/api/cowboys/${selectedId}/raise`), { method: 'POST' })
      if (await isResting(response)) {
        setResting(true)
        return
      }
      if (!response.ok) {
        setMessage('Could not raise the salary right now. Please try again.')
        return
      }
      const data = await response.json()
      setCowboys((list) => list.map((cowboy) => (cowboy.id === data.id ? { ...cowboy, salary: data.salary } : cowboy)))
      setMessage('')
    } catch {
      setMessage('Could not raise the salary right now. Please try again.')
    }
  }

  if (resting) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 26 }}>This app is resting and will be back soon.</p>
      </main>
    )
  }

  const selected = cowboys.find((cowboy) => String(cowboy.id) === selectedId)

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Cowboy game</h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Choose a cowboy, then click the elephant while its puff cloud is showing to give the cowboy a 10% raise.
      </p>

      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={selectStyle}>
        <option value="">Choose a cowboy</option>
        {cowboys.map((cowboy) => (
          <option key={cowboy.id} value={cowboy.id}>
            {cowboy.name} ({cowboy.address})
          </option>
        ))}
      </select>

      {selected && (
        <p style={{ fontSize: 20, margin: '20px 0 0' }}>
          {`${selected.name}'s salary: ${Number(selected.salary).toLocaleString('en-US')}`}
        </p>
      )}

      <div className="cowboy-elephant" style={{ marginTop: 32 }}>
        <JumpingElephant onPuffClick={handleRaise} look={selected ? lookFor(selected) : undefined} />
      </div>

      {message && <p style={{ color: colors.onPaperAccent, margin: '20px 0 0' }}>{message}</p>}
    </main>
  )
}
