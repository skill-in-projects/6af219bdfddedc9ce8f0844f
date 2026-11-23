import { useEffect, useState } from 'react'
import DriverAvatar from '../components/DriverAvatar.jsx'
import { colors } from '../components/theme.js'

const cellStyle = {
  padding: '12px 14px',
  borderBottom: `1px solid ${colors.line}`,
  textAlign: 'left',
  verticalAlign: 'middle',
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

export default function TruckDrivers() {
  const [drivers, setDrivers] = useState([])
  const [message, setMessage] = useState('')
  const [resting, setResting] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/truck-drivers'))
      .then(async (response) => {
        if (await isResting(response)) setResting(true)
        else if (response.ok) setDrivers(await response.json())
        else setMessage('Could not load the truck drivers right now. Please try again.')
      })
      .catch(() => setMessage('Could not load the truck drivers right now. Please try again.'))
  }, [])

  if (resting) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 26 }}>This app is resting and will be back soon.</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px', textAlign: 'center' }}>Truck drivers</h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px', textAlign: 'center' }}>
        Every driver, with their address, license class and years on the road.
      </p>

      {message && <p style={{ color: colors.onPaperAccent, textAlign: 'center' }}>{message}</p>}

      {drivers.length > 0 && (
        <div style={{ background: colors.card, color: colors.ink, borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: colors.line }}>
                <th style={cellStyle}>Driver</th>
                <th style={cellStyle}>Address</th>
                <th style={cellStyle}>License</th>
                <th style={cellStyle}>Years driving</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <DriverAvatar driver={driver} />
                      <span>{driver.name}</span>
                    </div>
                  </td>
                  <td style={cellStyle}>{driver.address}</td>
                  <td style={cellStyle}>{driver.licenseClass}</td>
                  <td style={cellStyle}>{driver.yearsDriving}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
