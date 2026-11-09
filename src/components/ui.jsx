import { Link } from 'react-router-dom'
import { colors } from './theme.js'

// Shown next to data the user changes on screen, until saving is turned on.
export function NotSavedNote() {
  return (
    <p style={{ margin: '0 0 16px', fontSize: 14, color: colors.accent }}>
      Not saved yet: upgrade to keep your changes
    </p>
  )
}

export function MemoryCard({ memory }) {
  return (
    <article
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 13, color: colors.muted }}>
        {memory.date} · {memory.mood}
      </p>
      <h3 style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontSize: 20 }}>{memory.title}</h3>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{memory.text}</p>
    </article>
  )
}

export function EmptyLink() {
  return (
    <Link to="/new" style={{ color: colors.accent }}>
      Write your first memory
    </Link>
  )
}
