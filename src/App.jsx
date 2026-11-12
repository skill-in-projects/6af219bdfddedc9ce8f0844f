import { useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Memories from './pages/Memories.jsx'
import NewMemory from './pages/NewMemory.jsx'
import FindOnMap from './pages/FindOnMap.jsx'
import Shops from './pages/Shops.jsx'
import { sampleMemories } from './data.js'
import { colors } from './components/theme.js'

export default function App() {
  const [memories, setMemories] = useState(sampleMemories)

  function addMemory(memory) {
    setMemories((current) => [memory, ...current])
  }

  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', background: colors.paper, color: colors.ink, fontFamily: 'system-ui, sans-serif' }}>
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px 24px',
            borderBottom: `1px solid ${colors.line}`,
          }}
        >
          <Link to="/" style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: colors.ink, textDecoration: 'none' }}>
            Memory Book
          </Link>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/memories" style={{ color: colors.ink }}>
              Memories
            </Link>
            <Link to="/new" style={{ color: colors.ink }}>
              New memory
            </Link>
            <Link to="/map" style={{ color: colors.ink }}>
              Find on map
            </Link>
            <Link to="/shops" style={{ color: colors.ink }}>
              Shops
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home memories={memories} />} />
          <Route path="/memories" element={<Memories memories={memories} />} />
          <Route path="/new" element={<NewMemory onAdd={addMemory} />} />
          <Route path="/map" element={<FindOnMap />} />
          <Route path="/shops" element={<Shops />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
