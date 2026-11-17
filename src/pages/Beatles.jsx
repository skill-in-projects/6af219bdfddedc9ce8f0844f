import { useState } from 'react'
import { buttonStyle, colors } from '../components/theme.js'

const startingSongs = ['Here Comes the Sun', 'Yesterday', 'Let It Be']

export default function Beatles() {
  const [songs, setSongs] = useState(startingSongs)
  const [draft, setDraft] = useState('')

  function addSong(event) {
    event.preventDefault()
    const song = draft.trim()
    if (!song) return
    setSongs((current) => [...current, song])
    setDraft('')
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Beatles</h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>My favorite Beatles songs.</p>

      <form onSubmit={addSong} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="A song title"
          aria-label="Song title"
          style={{
            flex: '1 1 240px',
            padding: '12px 14px',
            borderRadius: 8,
            border: `1px solid ${colors.line}`,
            fontSize: 16,
            background: colors.card,
            color: colors.ink,
          }}
        />
        <button type="submit" style={buttonStyle}>
          Add song
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        {songs.map((song, index) => (
          <li
            key={`${song}-${index}`}
            style={{
              background: colors.card,
              color: colors.ink,
              border: `1px solid ${colors.line}`,
              borderRadius: 8,
              padding: '14px 18px',
              fontSize: 18,
            }}
          >
            {song}
          </li>
        ))}
      </ul>
    </main>
  )
}
