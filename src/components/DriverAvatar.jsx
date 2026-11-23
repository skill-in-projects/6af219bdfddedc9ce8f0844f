const SKINS = ['#f1c9a5', '#e0b08a', '#c68a5b', '#8d5a3b']
const CAPS = ['#1f3a5f', '#7a1f1f', '#2f5d3a', '#c9a227', '#3b3b3b']

// Each driver gets their own skin, cap and shirt colors (spread around the color wheel by id), and a beard on some
function lookFor(driver) {
  const hue = (driver.id * 137.508) % 360
  return {
    skin: SKINS[driver.id % SKINS.length],
    cap: CAPS[driver.id % CAPS.length],
    shirt: `hsl(${hue} 55% 42%)`,
    beard: driver.id % 3 === 0,
  }
}

// A round face with a trucker cap, drawn in SVG so no image files are needed
export default function DriverAvatar({ driver, size = 56 }) {
  const { skin, cap, shirt, beard } = lookFor(driver)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Avatar of ${driver.name}`}
      style={{ flexShrink: 0, borderRadius: '50%', background: '#eadfce' }}
    >
      <path d="M8 64 C8 46 18 42 32 42 C46 42 56 46 56 64 Z" fill={shirt} />
      <ellipse cx="32" cy="28" rx="11" ry="12.5" fill={skin} />
      {beard && <path d="M21 32 Q32 48 43 32 Q40 39 32 39 Q24 39 21 32 Z" fill="#4a3a2c" />}
      <circle cx="28" cy="28" r="1.5" fill="#2b2f31" />
      <circle cx="36" cy="28" r="1.5" fill="#2b2f31" />
      <path d="M28 34 Q32 36.5 36 34" fill="none" stroke="#2b2f31" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 22 Q32 9 44 22 Z" fill={cap} />
      <rect x="17" y="21" width="30" height="4" rx="2" fill={cap} />
    </svg>
  )
}
