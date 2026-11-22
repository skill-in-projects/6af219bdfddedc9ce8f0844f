import { useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Memories from './pages/Memories.jsx'
import NewMemory from './pages/NewMemory.jsx'
import FindOnMap from './pages/FindOnMap.jsx'
import Beatles from './pages/Beatles.jsx'
import CowboyGame from './pages/CowboyGame.jsx'
import Chatbot from './pages/Chatbot.jsx'
import PianoGame from './pages/PianoGame.jsx'
import Account from './pages/Account.jsx'
import BikeShopSupport from './pages/BikeShopSupport.jsx'
import About from './pages/About.jsx'
import { sampleMemories } from './data.js'
import { colors } from './components/theme.js'

export default function App() {
  const [memories, setMemories] = useState(sampleMemories)

  function addMemory(memory) {
    setMemories((current) => [memory, ...current])
  }

  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', background: colors.paper, color: colors.onPaper, fontFamily: 'system-ui, sans-serif' }}>
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
          <Link to="/" style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: colors.onPaper, textDecoration: 'none' }}>
            Memory Book
          </Link>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/memories" style={{ color: colors.onPaper }}>
              Memories
            </Link>
            <Link to="/new" style={{ color: colors.onPaper }}>
              New memory
            </Link>
            <Link to="/map" style={{ color: colors.onPaper }}>
              Find on map
            </Link>
            <Link to="/beatles" style={{ color: colors.onPaper }}>
              Beatles
            </Link>
            <Link to="/game" style={{ color: colors.onPaper }}>
              Cowboy game
            </Link>
            <Link to="/chat" style={{ color: colors.onPaper }}>
              Chatbot
            </Link>
            <Link to="/piano" style={{ color: colors.onPaper }}>
              Piano
            </Link>
            <Link to="/account" style={{ color: colors.onPaper }}>
              Account
            </Link>
            <Link to="/bike-shop" style={{ color: colors.onPaper }}>
              Bike shop help
            </Link>
            <Link to="/about" style={{ color: colors.onPaper }}>
              About
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home memories={memories} />} />
          <Route path="/memories" element={<Memories memories={memories} />} />
          <Route path="/new" element={<NewMemory onAdd={addMemory} />} />
          <Route path="/map" element={<FindOnMap />} />
          <Route path="/beatles" element={<Beatles />} />
          <Route path="/game" element={<CowboyGame />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/piano" element={<PianoGame />} />
          <Route path="/account" element={<Account />} />
          <Route path="/bike-shop" element={<BikeShopSupport />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
