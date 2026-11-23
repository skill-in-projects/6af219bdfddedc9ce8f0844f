import { useState } from 'react'

const PETALS = ['#f472b6', '#f9a8d4', '#fde047', '#fb923c', '#c4b5fd']
const FLOWER_COUNT = 18
const SNOW_COUNT = 30
const ORANGE_COUNT = 12

const css = `
  .falling-flower {
    position: fixed;
    top: -60px;
    pointer-events: none;
    animation-name: falling-flower;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  @keyframes falling-flower {
    from { transform: translate3d(0, 0, 0) rotate(0deg); }
    to { transform: translate3d(var(--sway), calc(100vh + 120px), 0) rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .falling-flower { display: none; }
  }
`

// A five-petal flower drawn in SVG
function Flower({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="20" cy="10" rx="6" ry="9" fill={color} transform={`rotate(${angle} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="5" fill="#fef08a" />
    </svg>
  )
}

// A snowflake: a soft white dot
function Snowflake({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

// An orange: an orange ball with a small green leaf on top
function Orange({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="22" r="16" fill="#f97316" />
      <ellipse cx="25" cy="7" rx="6" ry="3" fill="#22c55e" transform="rotate(-25 25 7)" />
    </svg>
  )
}

// Flowers, snow and oranges that drift down from the top of the page, each with its own start, speed and sway
export default function FallingFlowers() {
  const [flowers] = useState(() =>
    Array.from({ length: FLOWER_COUNT }, (_, index) => ({
      left: Math.random() * 100,
      size: 18 + Math.random() * 16,
      color: PETALS[index % PETALS.length],
      duration: 9 + Math.random() * 8,
      // A negative delay means the flowers are already falling when the page opens
      delay: -Math.random() * 17,
      sway: `${(Math.random() - 0.5) * 120}px`,
    }))
  )
  const [snow] = useState(() =>
    Array.from({ length: SNOW_COUNT }, () => ({
      left: Math.random() * 100,
      size: 5 + Math.random() * 7,
      duration: 12 + Math.random() * 10,
      delay: -Math.random() * 22,
      sway: `${(Math.random() - 0.5) * 60}px`,
    }))
  )

  const [oranges] = useState(() =>
    Array.from({ length: ORANGE_COUNT }, () => ({
      left: Math.random() * 100,
      size: 22 + Math.random() * 14,
      duration: 11 + Math.random() * 9,
      delay: -Math.random() * 20,
      sway: `${(Math.random() - 0.5) * 100}px`,
    }))
  )

  return (
    <div aria-hidden="true">
      <style>{css}</style>
      {oranges.map((orange, index) => (
        <div
          key={`orange-${index}`}
          className="falling-flower"
          style={{
            left: `${orange.left}%`,
            animationDuration: `${orange.duration}s`,
            animationDelay: `${orange.delay}s`,
            '--sway': orange.sway,
          }}
        >
          <Orange size={orange.size} />
        </div>
      ))}
      {flowers.map((flower, index) => (
        <div
          key={`flower-${index}`}
          className="falling-flower"
          style={{
            left: `${flower.left}%`,
            animationDuration: `${flower.duration}s`,
            animationDelay: `${flower.delay}s`,
            '--sway': flower.sway,
          }}
        >
          <Flower color={flower.color} size={flower.size} />
        </div>
      ))}
      {snow.map((flake, index) => (
        <div
          key={`snow-${index}`}
          className="falling-flower"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            '--sway': flake.sway,
          }}
        >
          <Snowflake size={flake.size} />
        </div>
      ))}
    </div>
  )
}
