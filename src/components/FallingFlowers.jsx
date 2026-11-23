import { useState } from 'react'

const PETALS = ['#f472b6', '#f9a8d4', '#fde047', '#fb923c', '#c4b5fd']
const FLOWER_COUNT = 18

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

// Flowers that drift down from the top of the page, each with its own start, speed and sway
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

  return (
    <div aria-hidden="true">
      <style>{css}</style>
      {flowers.map((flower, index) => (
        <div
          key={index}
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
    </div>
  )
}
