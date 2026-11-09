import { Link } from 'react-router-dom'
import { EmptyLink, MemoryCard } from '../components/ui.jsx'
import { buttonStyle, colors } from '../components/theme.js'

export default function Home({ memories }) {
  const latest = memories.slice(0, 3)

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
