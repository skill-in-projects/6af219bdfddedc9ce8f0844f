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
// The cowboy's face is red after a fart, then slowly fades to green
const FACE = '#e0b08a'
const RED = '#d62828'
const GREEN = '#2a9d3f'
const FACE_FADE_MS = 8000
// The cleaner robot: its nozzle is at this point inside its box
const ROBOT_W = 90
const ROBOT_H = 64
const NOZZLE_X = 45
const NOZZLE_Y = 62
const INITIAL_ROBOT = { x: 120, y: 160, vx: 1.5, vy: 0.8 }

const gasCss = `
  @keyframes gas-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
  @keyframes gas-drift { from { transform: translate(-30px, 10px); } to { transform: translate(30px, -15px); } }
  @keyframes robot-flutter { from { transform: scaleX(1); } to { transform: scaleX(-1); } }
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

// The colour part of the way from one hex colour to another (t from 0 to 1)
function mixColor(from, to, t) {
  const channels = [1, 3, 5].map((start) => {
    const a = parseInt(from.slice(start, start + 2), 16)
    const b = parseInt(to.slice(start, start + 2), 16)
    return Math.round(a + (b - a) * t)
  })
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

// A random place above the piano, where the elephant's feet do not reach any key
function randomSpot() {
  return {
    x: Math.random() * (STAGE_W - ELEPHANT_W),
    y: Math.random() * 120,
  }
}

// A speed that changes a little at random, but never goes faster than the limit
function wander(velocity, limit) {
  return clamp(velocity + (Math.random() - 0.5) * 0.8, -limit, limit)
}

// Moves a position by its speed, and bounces it back when it reaches the edge
function drift(position, velocity, min, max) {
  const next = position + velocity
  if (next >= min && next <= max) return { position: next, velocity }
  return { position: clamp(next, min, max), velocity: -velocity }
}

// The cleaner robot flies on its own, in a random direction, and bounces off the edges of the screen
function moveRobot(robot) {
  const vx = wander(robot.vx, 2.5)
  const vy = wander(robot.vy, 2.5)
  const horizontal = drift(robot.x, vx, 0, window.innerWidth - ROBOT_W)
  const vertical = drift(robot.y, vy, 0, window.innerHeight - ROBOT_H)
  return { x: horizontal.position, y: vertical.position, vx: horizontal.velocity, vy: vertical.velocity }
}

// The robot's nozzle pulls in a gas cloud it passes over: the cloud is drawn toward the nozzle and shrinks away.
// A cloud is gone once it is fully pulled in
function suck(cloud, nozzle) {
  const centerX = cloud.x + cloud.size / 2
  const centerY = cloud.y + cloud.size * 0.3
  if (Math.hypot(centerX - nozzle.x, centerY - nozzle.y) > cloud.size * 0.6) return cloud
  return {
    ...cloud,
    x: cloud.x + (nozzle.x - centerX) * 0.05,
    y: cloud.y + (nozzle.y - centerY) * 0.05,
    sucked: Math.min(cloud.sucked + 0.04, 1),
  }
}

// Moves one cloud a little, then pulls it in if the robot's nozzle is over it
function moveCloud(cloud, nozzle) {
  const vx = wander(cloud.vx, 3)
  const vy = wander(cloud.vy, 3)
  const horizontal = drift(cloud.x, vx, -cloud.size / 3, window.innerWidth - (cloud.size * 2) / 3)
  const vertical = drift(cloud.y, vy, -cloud.size / 3, window.innerHeight - (cloud.size * 2) / 3)
  return suck(
    { ...cloud, x: horizontal.position, y: vertical.position, vx: horizontal.velocity, vy: vertical.velocity },
    nozzle,
  )
}

// One gas cloud: it fades in where it was released, drifts slowly, and shrinks as the robot pulls it in
function Cloud({ cloud }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: cloud.x,
        top: cloud.y,
        width: cloud.size,
        height: cloud.size * 0.6,
        opacity: 1 - cloud.sucked,
        transform: `scale(${1 - cloud.sucked * 0.6})`,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, animation: 'gas-in 2.5s ease-out forwards' }}>
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
    </div>
  )
}

// The cleaner robot: a body, two spinning rotors and a suction nozzle underneath
function Robot({ robot }) {
  return (
    <div style={{ position: 'absolute', left: robot.x, top: robot.y, width: ROBOT_W, height: ROBOT_H }}>
      <div style={{ position: 'absolute', left: 2, top: 4, width: 40, height: 6, background: '#607d8b', borderRadius: 3, animation: 'robot-flutter 0.15s linear infinite alternate' }} />
      <div style={{ position: 'absolute', left: 48, top: 4, width: 40, height: 6, background: '#607d8b', borderRadius: 3, animation: 'robot-flutter 0.15s linear infinite alternate' }} />
      <div style={{ position: 'absolute', left: 20, top: 12, width: 50, height: 26, background: '#cfd8dc', border: '2px solid #607d8b', borderRadius: 12 }} />
      <div style={{ position: 'absolute', left: 52, top: 19, width: 8, height: 8, background: '#4fc3f7', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', left: 40, top: 36, width: 10, height: 20, background: '#37474f' }} />
      <div style={{ position: 'absolute', left: 36, top: 54, width: 18, height: 8, background: '#263238', borderRadius: 4 }} />
    </div>
  )
}

export default function PianoGame() {
  const [pos, setPos] = useState(START_SPOT)
  const [touching, setTouching] = useState(false)
  const [touches, setTouches] = useState(0)
  const [clouds, setClouds] = useState([])
  const [robot, setRobot] = useState(INITIAL_ROBOT)
  const [gameOver, setGameOver] = useState(false)
  const [lastNote, setLastNote] = useState('')
  const [pressedMidi, setPressedMidi] = useState(null)
  const [faceColor, setFaceColor] = useState(FACE)
  const [coughing, setCoughing] = useState(false)
  const audioRef = useRef(null)
  const busy = useRef(false)
  const nextCloudId = useRef(0)
  const robotRef = useRef(INITIAL_ROBOT)
  const elephantRef = useRef(null)
  const lastFartAt = useRef(null)
  const stepTimer = useRef(null)
  const pressTimer = useRef(null)

  const cloudCount = clouds.length

  useEffect(() => {
    return () => {
      clearTimeout(stepTimer.current)
      clearTimeout(pressTimer.current)
      audioRef.current?.close()
    }
  }, [])

  // Every 50 milliseconds the robot flies a little, and the clouds drift and get pulled in by its nozzle
  useEffect(() => {
    const timer = setInterval(() => {
      const next = moveRobot(robotRef.current)
      robotRef.current = next
      setRobot(next)
      const nozzle = { x: next.x + NOZZLE_X, y: next.y + NOZZLE_Y }
      setClouds((list) => (list.length === 0 ? list : list.map((cloud) => moveCloud(cloud, nozzle)).filter((cloud) => cloud.sucked < 1)))
    }, 50)
    return () => clearInterval(timer)
  }, [])

  // The face fades from red back to green over a few seconds after each fart
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastFartAt.current === null) return
      const t = Math.min((Date.now() - lastFartAt.current) / FACE_FADE_MS, 1)
      setFaceColor(mixColor(RED, GREEN, t))
    }, 200)
    return () => clearInterval(timer)
  }, [])

  // The cowboy coughs, and the coughs come more often as the gas builds up
  useEffect(() => {
    if (cloudCount === 0) return undefined
    const interval = Math.max(400, 2400 - cloudCount * 200)
    const timer = setInterval(() => {
      setCoughing(true)
      setTimeout(() => setCoughing(false), 600)
    }, interval)
    return () => clearInterval(timer)
  }, [cloudCount])

  // The gas takes a few seconds to fill the screen, then the game is over
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

  // The cloud starts at the elephant's rear, where the fart comes out, and stays close to that spot
  function addCloud() {
    const rect = elephantRef.current?.getBoundingClientRect()
    const size = 260 + Math.random() * 180
    const x = (rect?.left ?? 0) + 330 + (Math.random() - 0.5) * 120
    const y = (rect?.top ?? 0) + 150 + (Math.random() - 0.5) * 80
    const id = nextCloudId.current++
    lastFartAt.current = Date.now()
    setFaceColor(RED)
    setClouds((list) => [
      ...list,
      {
        id,
        x: x - size / 2,
        y: y - size * 0.3,
        size,
        drift: 12 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        sucked: 0,
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
    lastFartAt.current = null
    setFaceColor(FACE)
    setCoughing(false)
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
          ref={elephantRef}
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
          <JumpingElephant bouncing={!touching} fartRequest={touches} onFart={addCloud} faceColor={faceColor} />
          {coughing && (
            <span
              style={{
                position: 'absolute',
                left: 250,
                top: 10,
                background: '#ffffff',
                color: colors.ink,
                borderRadius: 10,
                padding: '4px 10px',
                fontWeight: 700,
                pointerEvents: 'none',
              }}
            >
              Cough!
            </span>
          )}
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

      {/* The air layer: the gas clouds and the cleaner robot, over the whole screen */}
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
        <Robot robot={robot} />
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
