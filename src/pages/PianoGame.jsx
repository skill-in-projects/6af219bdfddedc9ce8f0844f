import { useEffect, useRef, useState } from 'react'
import JumpingElephant from '../components/JumpingElephant.jsx'
import { buttonStyle, colors } from '../components/theme.js'

const STAGE_W = 1000
const STAGE_H = 660
const ELEPHANT_W = 420
const ELEPHANT_H = 380
// Where the elephant's feet are, measured from its top-left corner
const FEET_X = 210
const FEET_Y = 328
// The piano spans the whole range the elephant can reach, so every key, including the edge ones, can be clicked
const WHITE_W = (STAGE_W - 2 * FEET_X) / 14
const WHITE_H = 130
const BLACK_W = 24
const BLACK_H = 80
const PIANO_TOP = 500
const PIANO_LEFT = FEET_X
const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11]
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// Each fart leaves a cloud; after this many the air is full and the cowboy is choked
const CLOUDS_TO_CHOKE = 10
const START_SPOT = { x: 230, y: 40 }

const gasCss = `
  @keyframes gas-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
  @keyframes gas-drift { from { transform: translate(-30px, 10px); } to { transform: translate(30px, -15px); } }
`

// Exact pitch of a key from its MIDI number: 69 is A4, which is 440 Hz
function frequencyOf(midi) {
  return 440 * 2 ** ((midi - 69) / 12)
}

// Two octaves from C4 to B5 (14 white keys and 10 black keys)
function buildKeys() {
  const keys = []
  let whiteIndex = 0
  for (let midi = 60; midi <= 83; midi++) {
    const name = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
    if (WHITE_PITCHES.includes(midi % 12)) {
      keys.push({ midi, name, black: false, x: PIANO_LEFT + whiteIndex * WHITE_W, y: PIANO_TOP, w: WHITE_W, h: WHITE_H })
      whiteIndex++
    } else {
      // A black key sits on the line between the white key before it and the one after it
      keys.push({ midi, name, black: true, x: PIANO_LEFT + whiteIndex * WHITE_W - BLACK_W / 2, y: PIANO_TOP, w: BLACK_W, h: BLACK_H })
    }
  }
  return keys
}

const KEYS = buildKeys()

// A piano-like tone: the exact pitch plus a quieter octave above, fading out over about 1.6 seconds
function playNote(ctx, midi) {
  const now = ctx.currentTime
  const frequency = frequencyOf(midi)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
  gain.connect(ctx.destination)

  const tone = ctx.createOscillator()
  tone.type = 'sine'
  tone.frequency.value = frequency
  tone.connect(gain)

  const overtoneGain = ctx.createGain()
  overtoneGain.gain.value = 0.2
  overtoneGain.connect(gain)

  const overtone = ctx.createOscillator()
  overtone.type = 'sine'
  overtone.frequency.value = frequency * 2
  overtone.connect(overtoneGain)

  tone.start(now)
  tone.stop(now + 1.6)
  overtone.start(now)
  overtone.stop(now + 1.6)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// A random place above the piano, where the elephant's feet do not reach any key
function randomSpot() {
  return {
    x: Math.random() * (STAGE_W - ELEPHANT_W),
    y: Math.random() * 120,
  }
}

// One gas cloud: it fades in where it was released, then drifts slowly
function Cloud({ cloud }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${cloud.left}%`,
        top: `${cloud.top}%`,
        width: cloud.size,
        height: cloud.size * 0.6,
        animation: 'gas-in 2.5s ease-out forwards',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(226, 204, 60, 0.9), rgba(226, 204, 60, 0.4) 60%, rgba(226, 204, 60, 0))',
          filter: 'blur(10px)',
          animation: `gas-drift ${cloud.drift}s ease-in-out infinite alternate`,
        }}
      />
    </div>
  )
}

export default function PianoGame() {
  const [pos, setPos] = useState(START_SPOT)
  const [touching, setTouching] = useState(false)
  const [touches, setTouches] = useState(0)
  const [clouds, setClouds] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [lastNote, setLastNote] = useState('')
  const [pressedMidi, setPressedMidi] = useState(null)
  const audioRef = useRef(null)
  const busy = useRef(false)
  const nextCloudId = useRef(0)
  const stepTimer = useRef(null)
  const pressTimer = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(stepTimer.current)
      clearTimeout(pressTimer.current)
      audioRef.current?.close()
    }
  }, [])

  // The gas takes a few seconds to fill the screen, then the game is over
  const cloudCount = clouds.length
  useEffect(() => {
    if (cloudCount < CLOUDS_TO_CHOKE) return undefined
    const timer = setTimeout(() => setGameOver(true), 3000)
    return () => clearTimeout(timer)
  }, [cloudCount])

  // Browsers only allow sound after a click, so the audio is started on the first key click
  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    audioRef.current.resume()
    return audioRef.current
  }

  function addCloud() {
    setClouds((list) => [
      ...list,
      {
        id: nextCloudId.current++,
        left: Math.random() * 85,
        top: Math.random() * 85,
        size: 260 + Math.random() * 180,
        drift: 12 + Math.random() * 10,
      },
    ])
  }

  function playKey(key) {
    setTouches((count) => count + 1)
    playNote(getAudio(), key.midi)
    setLastNote(key.name)
    setPressedMidi(key.midi)
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setPressedMidi(null), 250)
  }

  // Clicking a key: the elephant comes down with its feet on the key, plays it, then jumps back up
  function handleKey(key) {
    if (busy.current || gameOver) return
    busy.current = true
    setPos({ x: clamp(key.x + key.w / 2 - FEET_X, 0, STAGE_W - ELEPHANT_W), y: PIANO_TOP - FEET_Y })
    stepTimer.current = setTimeout(() => {
      // Stands still while the feet are on the key
      setTouching(true)
      playKey(key)
      stepTimer.current = setTimeout(() => {
        setTouching(false)
        setPos(randomSpot())
        busy.current = false
      }, 500)
    }, 700)
  }

  function playAgain() {
    clearTimeout(stepTimer.current)
    busy.current = false
    setClouds([])
    setGameOver(false)
    setTouching(false)
    setTouches(0)
    setLastNote('')
    setPressedMidi(null)
    setPos(START_SPOT)
  }

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <style>{gasCss}</style>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Piano elephant</h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Click a piano key. The elephant comes down, plays the key, and jumps back up.
      </p>

      <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H, maxWidth: '100%', margin: '0 auto' }}>
        <div
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: ELEPHANT_W,
            height: ELEPHANT_H,
            pointerEvents: 'none',
            transition: 'left 0.6s ease-in-out, top 0.6s ease-in-out',
            zIndex: 4,
          }}
        >
          <JumpingElephant bouncing={!touching} fartRequest={touches} onFart={addCloud} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: PIANO_LEFT - 12,
            top: PIANO_TOP - 12,
            width: 14 * WHITE_W + 24,
            height: WHITE_H + 24,
            background: '#3b2a1a',
            borderRadius: 10,
          }}
        />
        {KEYS.map((key) => (
          <div
            key={key.midi}
            onClick={() => handleKey(key)}
            style={{
              position: 'absolute',
              left: key.x,
              top: key.y,
              width: key.w,
              height: key.h,
              boxSizing: 'border-box',
              border: '1px solid #222',
              borderRadius: '0 0 6px 6px',
              cursor: 'pointer',
              zIndex: key.black ? 2 : 1,
              background:
                pressedMidi === key.midi
                  ? key.black
                    ? '#6b7280'
                    : '#d6d3cd'
                  : key.black
                    ? '#1c1c1c'
                    : '#ffffff',
            }}
          />
        ))}
      </div>

      <p style={{ fontSize: 18, margin: '20px 0 0' }}>{lastNote ? `Last key played: ${lastNote}` : 'Click a key to hear it.'}</p>

      {/* The yellow gas: clouds that drift over the whole screen, plus a slow yellow tint */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgb(222, 195, 50)',
            opacity: Math.min(cloudCount / CLOUDS_TO_CHOKE, 1) * 0.35,
            transition: 'opacity 3s ease-in-out',
          }}
        />
        {clouds.map((cloud) => (
          <Cloud key={cloud.id} cloud={cloud} />
        ))}
      </div>

      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(31, 61, 46, 0.6)' }}>
          <div style={{ background: colors.card, color: colors.ink, borderRadius: 16, padding: 32, maxWidth: 420, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', margin: '0 0 12px' }}>Game over</h2>
            <p style={{ margin: '0 0 20px' }}>The yellow gas has filled the air, and the cowboy is choked.</p>
            <button type="button" style={buttonStyle} onClick={playAgain}>
              Play again
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
