import { colors } from '../components/theme.js'

// The owner writes this text. It stays a placeholder until they send their own words.
export default function About() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 16px', color: colors.onPaper }}>About</h1>
      <p style={{ color: colors.onPaperMuted, lineHeight: 1.6, margin: 0 }}>This is where the story will go.</p>
    </main>
  )
}
