import { useEffect, useRef, useState } from 'react'

const BODY = '#8e989e'
const PINK = '#f472b6'
const EYE = '#2b2f31'
const TUSK = '#f5efe0'
const SKIN = '#e0b08a'
const SHIRT = '#b5651d'
const JEANS = '#3b5b8a'
const HAT = '#6b4423'

const css = `
  .elephant-scene { animation: elephant-jump 1.6s ease-in-out infinite; }
  .elephant-shadow { animation: elephant-shadow 1.6s ease-in-out infinite; }
  .elephant-puff {
    position: absolute;
    left: 296px;
    top: 106px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle, #d9c77a 0%, rgba(217, 199, 122, 0) 70%);
    opacity: 0;
    animation: elephant-puff 0.9s ease-out forwards;
  }
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
  @keyframes elephant-puff {
    0% { opacity: 0.9; transform: translate(0, 0) scale(0.4); }
    100% { opacity: 0; transform: translate(50px, -36px) scale(2.2); }
  }
  .elephant-still .elephant-scene { animation: none; }
  .elephant-still .elephant-shadow { animation: none; transform: translateX(-50%); opacity: 0.35; }
  @media (prefers-reduced-motion: reduce) {
    .elephant-scene, .elephant-shadow { animation: none; }
    .elephant-puff { display: none; }
  }
`

// One solid box made of six flat faces, so it looks 3D when the scene turns
function Block({ x, y, z, w, h, d, color }) {
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

// The puff cloud is visible for about this long after each landing (0.9s animation plus the 0.24s delay)
const PUFF_MS = 1150

// Colors of the cowboy on the elephant's back
const DEFAULT_LOOK = { shirt: SHIRT, jeans: JEANS, hat: HAT }

// A grey elephant built from boxes, jumping in place. Facing left. A cowboy rides on its back.
// onPuffClick runs when the visitor clicks while the puff cloud is showing.
// look sets the cowboy's shirt, jeans and hat colors.
export default function JumpingElephant({ onPuffClick, look = DEFAULT_LOOK, bouncing = true }) {
  const audioRef = useRef(null)
  const pinkTimer = useRef(null)
  const puffTimer = useRef(null)
  const puffing = useRef(false)
  const [farts, setFarts] = useState(0)
  const [pink, setPink] = useState(false)
  const skin = pink ? PINK : BODY

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
      clearTimeout(pinkTimer.current)
      clearTimeout(puffTimer.current)
    }
  }, [])

  // A short synthesized fart: a low buzz plus noise, with a few sputters
  function playSound() {
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

  // Each loop of the jump ends with the landing, so the fart goes out then
  function handleLanding() {
    playSound()
    setFarts((count) => count + 1)
    setPink(true)
    clearTimeout(pinkTimer.current)
    pinkTimer.current = setTimeout(() => setPink(false), 900)
    puffing.current = true
    clearTimeout(puffTimer.current)
    puffTimer.current = setTimeout(() => {
      puffing.current = false
    }, PUFF_MS)
  }

  // With reduced motion the puff cloud is hidden, so clicks on it do not count
  function handleClick() {
    if (!puffing.current || !onPuffClick) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    onPuffClick()
  }

  return (
    <div
      role="img"
      aria-label="A grey 3D elephant jumping with a cowboy on its back"
      onClick={handleClick}
      className={bouncing ? undefined : 'elephant-still'}
      style={{ position: 'relative', width: 420, height: 380, margin: '0 auto', perspective: 800 }}
    >
      <style>{css}</style>
      <div
        className="elephant-scene"
        onAnimationIteration={handleLanding}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        {[0, 1, 2].map((puff) =>
          farts > 0 ? (
            <span key={`${farts}-${puff}`} className="elephant-puff" style={{ animationDelay: `${puff * 0.12}s` }} />
          ) : null,
        )}
        <Block x={0} y={-40} z={0} w={200} h={120} d={120} color={skin} />
        <Block x={-125} y={-95} z={0} w={90} h={90} d={90} color={skin} />
        <Block x={-175} y={-35} z={0} w={28} h={50} d={28} color={skin} />
        <Block x={-188} y={20} z={0} w={26} h={45} d={26} color={skin} />
        <Block x={-178} y={72} z={0} w={24} h={30} d={24} color={skin} />
        <Block x={-75} y={70} z={35} w={34} h={100} d={34} color={skin} />
        <Block x={-75} y={70} z={-35} w={34} h={100} d={34} color={skin} />
        <Block x={75} y={70} z={35} w={34} h={100} d={34} color={skin} />
        <Block x={75} y={70} z={-35} w={34} h={100} d={34} color={skin} />
        <Block x={-118} y={-100} z={50} w={8} h={70} d={50} color={skin} />
        <Block x={-118} y={-100} z={-50} w={8} h={70} d={50} color={skin} />
        <Block x={112} y={-60} z={0} w={10} h={60} d={10} color={skin} />
        <Block x={-140} y={-110} z={46} w={10} h={10} d={4} color={EYE} />
        <Block x={-110} y={-110} z={46} w={10} h={10} d={4} color={EYE} />
        <Block x={-125} y={-80} z={46} w={30} h={4} d={3} color={EYE} />
        <Block x={-150} y={-35} z={40} w={8} h={30} d={8} color={TUSK} />
        <Block x={10} y={-110} z={0} w={56} h={20} d={44} color={look.jeans} />
        <Block x={10} y={-140} z={0} w={40} h={40} d={28} color={look.shirt} />
        <Block x={10} y={-175} z={0} w={28} h={30} d={28} color={SKIN} />
        <Block x={4} y={-180} z={15} w={4} h={4} d={2} color={EYE} />
        <Block x={16} y={-180} z={15} w={4} h={4} d={2} color={EYE} />
        <Block x={10} y={-166} z={15} w={10} h={2} d={2} color={EYE} />
        <Block x={10} y={-189} z={0} w={56} h={5} d={56} color={look.hat} />
        <Block x={10} y={-198} z={0} w={28} h={14} d={28} color={look.hat} />
      </div>
      <div
        className="elephant-shadow"
        style={{ position: 'absolute', left: '50%', top: 302, width: 220, height: 26, marginLeft: 0, borderRadius: '50%', background: '#000' }}
      />
    </div>
  )
}
