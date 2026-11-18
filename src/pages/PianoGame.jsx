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
// The piano spans exactly the positions the feet can reach, so every key, including the edge ones, can be touched
const WHITE_W = (STAGE_W - 2 * FEET_X) / 14
const WHITE_H = 130
const BLACK_W = 24
const BLACK_H = 80
const PIANO_TOP = 500
const PIANO_LEFT = FEET_X
const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11]
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// Each touch on a key makes one fart; after this many the air is full and the cowboy is choked
const FARTS_TO_CHOKE = 10

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

// The key under a point on the piano. Black keys sit on top of the white ones, so they are checked first
function keyUnder(px, py) {
  const inside = (key) => px >= key.x && px <= key.x + key.w && py >= key.y && py <= key.y + key.h
  return KEYS.find((key) => key.black && inside(key)) ?? KEYS.find((key) => !key.black && inside(key)) ?? null
}

// A random place above the piano, where the elephant's feet do not reach any key
function randomSpot() {
  return {
    x: Math.random() * (STAGE_W - ELEPHANT_W),
    y: Math.random() * 120,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

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

export default function PianoGame() {
  const [position, setPosition] = useState({ x: 230, y: 40 })
  const [lastNote, setLastNote] = useState('')
  const [pressedMidi, setPressedMidi] = useState(null)
  const [farts, setFarts] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const stageRef = useRef(null)
  const audioRef = useRef(null)
  const drag = useRef(null)
  const pressTimer = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(pressTimer.current)
      audioRef.current?.close()
    }
  }, [])

  // The gas takes a few seconds to fill the screen, then the game is over
  useEffect(() => {
    if (farts < FARTS_TO_CHOKE) return undefined
    const timer = setTimeout(() => setGameOver(true), 3000)
    return () => clearTimeout(timer)
  }, [farts])

  // Browsers only allow sound after a click, so the audio is started when the elephant is first grabbed
  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    audioRef.current.resume()
    return audioRef.current
  }

  function stagePoint(event) {
    const stage = stageRef.current.getBoundingClientRect()
    return { x: event.clientX - stage.left, y: event.clientY - stage.top }
  }

  function handlePointerDown(event) {
    if (gameOver) return
    getAudio()
    const point = stagePoint(event)
    drag.current = { offsetX: point.x - position.x, offsetY: point.y - position.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    if (!drag.current) return
    const point = stagePoint(event)
    const x = clamp(point.x - drag.current.offsetX, 0, STAGE_W - ELEPHANT_W)
    const y = clamp(point.y - drag.current.offsetY, 0, STAGE_H - ELEPHANT_H)

    const key = keyUnder(x + FEET_X, y + FEET_Y)
    if (key) {
      // The first touch on a key plays it, then the elephant jumps to a random spot and the drag stops
      drag.current = null
      playKey(key)
      setPosition(randomSpot())
    } else {
      setPosition({ x, y })
    }
  }

  function endDrag() {
    drag.current = null
  }

  function playKey(key) {
    setFarts((count) => count + 1)
    playNote(getAudio(), key.midi)
    setLastNote(key.name)
    setPressedMidi(key.midi)
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setPressedMidi(null), 250)
  }

  function playAgain() {
    setFarts(0)
    setGameOver(false)
    setLastNote('')
    setPressedMidi(null)
    setPosition({ x: 230, y: 40 })
  }

  // The stick starts at the elephant's rear and its tip sits where the feet touch, so the key it points at is the key touched
  const stickStart = { x: position.x + 322, y: position.y + 200 }
  const stickEnd = { x: position.x + FEET_X, y: position.y + FEET_Y }
  const stickLength = Math.hypot(stickEnd.x - stickStart.x, stickEnd.y - stickStart.y)
  const stickAngle = Math.atan2(stickEnd.y - stickStart.y, stickEnd.x - stickStart.x)

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '0 0 8px' }}>Piano elephant</h1>
      <p style={{ color: colors.onPaperMuted, margin: '0 0 24px' }}>
        Drag the elephant so its feet land on a piano key. The key plays, and the elephant jumps to a new spot.
      </p>

      <div ref={stageRef} style={{ position: 'relative', width: STAGE_W, height: STAGE_H, maxWidth: '100%', margin: '0 auto' }}>
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: ELEPHANT_W,
            height: ELEPHANT_H,
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          <JumpingElephant bouncing={false} fartRequest={farts} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: stickStart.x,
            top: stickStart.y,
            width: stickLength,
            height: 6,
            marginTop: -3,
            background: '#6b4423',
            borderRadius: 3,
            transformOrigin: '0 50%',
            transform: `rotate(${stickAngle}rad)`,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: stickEnd.x - 6,
            top: stickEnd.y - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#f0b27a',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

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
            style={{
              position: 'absolute',
              left: key.x,
              top: key.y,
              width: key.w,
              height: key.h,
              boxSizing: 'border-box',
              border: '1px solid #222',
              borderRadius: '0 0 6px 6px',
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

      <p style={{ fontSize: 18, margin: '20px 0 0' }}>{lastNote ? `Last key played: ${lastNote}` : 'Drag the elephant onto a key to hear it.'}</p>
      {/* The yellow gas slowly spreads over the whole screen, one layer per fart */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(245, 215, 66, 0.6), rgba(222, 184, 30, 0.95))',
          opacity: Math.min(farts / FARTS_TO_CHOKE, 1),
          transition: 'opacity 3s ease-in-out',
        }}
      />

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
