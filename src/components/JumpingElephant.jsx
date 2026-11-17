import { useEffect, useRef } from 'react'

const BODY = '#8e989e'
const EYE = '#2b2f31'
const TUSK = '#f5efe0'

const css = `
  .elephant-scene { animation: elephant-jump 1.6s ease-in-out infinite; }
  .elephant-shadow { animation: elephant-shadow 1.6s ease-in-out infinite; }
  @keyframes elephant-jump {
    0%, 100% { transform: translateY(0) rotateY(-20deg) scale(1.08, 0.9); }
    20% { transform: translateY(0) rotateY(-20deg) scale(1, 1); }
    50% { transform: translateY(-120px) rotateY(20deg) scale(0.95, 1.05); }
    80% { transform: translateY(0) rotateY(-10deg) scale(1, 1); }
  }
  @keyframes elephant-shadow {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.35; }
    50% { transform: translateX(-50%) scale(0.55); opacity: 0.15; }
  }
  @media (prefers-reduced-motion: reduce) {
    .elephant-scene, .elephant-shadow { animation: none; }
  }
`

// One solid box made of six flat faces, so it looks 3D when the scene turns
function Block({ x, y, z, w, h, d, color = BODY }) {
  const face = (extra) => ({ position: 'absolute', background: color, ...extra })
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={face({ width: w, height: h, transform: `translateZ(${d / 2}px)` })} />
      <div style={face({ width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` })} />
      <div style={face({ width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)`, filter: 'brightness(0.8)' })} />
      <div style={face({ width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)`, filter: 'brightness(0.8)' })} />
      <div style={face({ width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)`, filter: 'brightness(1.15)' })} />
      <div style={face({ width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)`, filter: 'brightness(0.7)' })} />
    </div>
  )
}

// A grey elephant built from boxes, jumping in place. Facing left.
export default function JumpingElephant() {
  const audioRef = useRef(null)

  // Browsers only allow sound after the visitor clicks or presses a key, so the audio is started on the first one
  useEffect(() => {
    function unlockAudio() {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      audioRef.current.resume()
    }
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // A short synthesized fart: a low buzz plus noise, with a few sputters
  function playFart() {
    const ctx = audioRef.current
    if (!ctx || ctx.state !== 'running') return
    const now = ctx.currentTime
    const length = 0.7 + Math.random() * 0.4
    const end = now + length

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.05)
    for (let t = 0.1; t < length - 0.1; t += 0.12 + Math.random() * 0.08) {
      gain.gain.linearRampToValueAtTime(0.2 + Math.random() * 0.5, now + t)
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    gain.connect(ctx.destination)

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 500
    lowpass.connect(gain)

    const tone = ctx.createOscillator()
    tone.type = 'sawtooth'
    tone.frequency.setValueAtTime(60 + Math.random() * 40, now)
    tone.frequency.linearRampToValueAtTime(35 + Math.random() * 20, end)
    tone.connect(lowpass)

    const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate)
    const samples = noiseBuffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.connect(lowpass)

    tone.start(now)
    tone.stop(end)
    noise.start(now)
    noise.stop(end)
  }

  return (
    <div role="img" aria-label="A grey 3D elephant jumping" style={{ position: 'relative', width: 420, height: 300, margin: '0 auto', perspective: 800 }}>
      <style>{css}</style>
      {/* Each loop of the jump ends with the landing, so the sound plays then */}
      <div
        className="elephant-scene"
        onAnimationIteration={playFart}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        <Block x={0} y={-40} z={0} w={200} h={120} d={120} />
        <Block x={-125} y={-95} z={0} w={90} h={90} d={90} />
        <Block x={-175} y={-35} z={0} w={28} h={50} d={28} />
        <Block x={-188} y={20} z={0} w={26} h={45} d={26} />
        <Block x={-178} y={72} z={0} w={24} h={30} d={24} />
        <Block x={-75} y={70} z={35} w={34} h={100} d={34} />
        <Block x={-75} y={70} z={-35} w={34} h={100} d={34} />
        <Block x={75} y={70} z={35} w={34} h={100} d={34} />
        <Block x={75} y={70} z={-35} w={34} h={100} d={34} />
        <Block x={-118} y={-100} z={50} w={8} h={70} d={50} />
        <Block x={-118} y={-100} z={-50} w={8} h={70} d={50} />
        <Block x={112} y={-60} z={0} w={10} h={60} d={10} />
        <Block x={-140} y={-110} z={46} w={10} h={10} d={4} color={EYE} />
        <Block x={-150} y={-35} z={40} w={8} h={30} d={8} color={TUSK} />
      </div>
      <div
        className="elephant-shadow"
        style={{ position: 'absolute', left: '50%', top: 262, width: 220, height: 26, marginLeft: 0, borderRadius: '50%', background: '#000' }}
      />
    </div>
  )
}
