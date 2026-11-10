import { useState } from 'react'
import { buttonStyle, colors } from './theme.js'

// The browser's built-in speech recognition (works in Chrome and Edge).
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const messages = {
  'not-allowed': 'The microphone is blocked. Allow it in your browser settings.',
  'no-speech': 'I did not hear anything. Try again.',
}

// Press once to start speaking; the words you say are added to the text box.
export default function DictateButton({ onText }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  if (!SpeechRecognition) {
    return <p style={{ margin: 0, fontSize: 14, color: colors.muted }}>Dictation works in Chrome and Edge.</p>
  }

  function handleClick() {
    const recognition = new SpeechRecognition()
    recognition.lang = navigator.language
    recognition.interimResults = false
    setError('')
    setListening(true)

    recognition.onresult = (event) => onText(event.results[0][0].transcript)
    recognition.onerror = (event) => setError(messages[event.error] || 'Dictation stopped. Try again.')
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <button type="button" style={buttonStyle} onClick={handleClick} disabled={listening}>
        {listening ? 'Listening…' : '🎤 Dictate'}
      </button>
      {error && <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}
    </div>
  )
}
