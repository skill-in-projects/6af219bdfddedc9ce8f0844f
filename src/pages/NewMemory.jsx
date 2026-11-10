import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotSavedNote } from '../components/ui.jsx'
import DictateButton from '../components/DictateButton.jsx'
import { buttonStyle, colors } from '../components/theme.js'
import { moods } from '../data.js'

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

export default function NewMemory({ onAdd }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [mood, setMood] = useState(moods[0])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !text.trim()) {
      setError('Please add a title and a few words.')
      return
    }
    onAdd({ id: Date.now(), title: title.trim(), date, mood, text: text.trim() })
    navigate('/memories')
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>New memory</h1>
      <p style={{ color: colors.muted, margin: '0 0 16px' }}>Write down what you want to remember.</p>
      <NotSavedNote />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Title
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6, flex: 1 }}>
            Date
            <input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6, flex: 1 }}>
            Mood
            <select style={inputStyle} value={mood} onChange={(e) => setMood(e.target.value)}>
              {moods.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          Memory
          <textarea
            rows={6}
            style={inputStyle}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <DictateButton onText={(spoken) => setText((current) => [current, spoken].filter(Boolean).join(' '))} />

        {error && <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}

        <div>
          <button type="submit" style={buttonStyle}>
            Add to book
          </button>
        </div>
      </form>
    </main>
  )
}
