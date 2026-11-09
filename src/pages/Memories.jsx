import { EmptyLink, MemoryCard, NotSavedNote } from '../components/ui.jsx'
import { colors } from '../components/theme.js'

export default function Memories({ memories }) {
  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>All memories</h1>
      <p style={{ color: colors.muted, margin: '0 0 16px' }}>Newest first.</p>
      <NotSavedNote />

      {memories.length === 0 ? (
        <EmptyLink />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}
    </main>
  )
}
