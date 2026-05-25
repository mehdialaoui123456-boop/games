import React, { useState, useEffect } from 'react'
import MenuPage from './pages/MenuPage.jsx'
import GamePage from './pages/GamePage.jsx'

export default function App() {
  const [route, setRoute] = useState('menu')
  const [highScore, setHighScore] = useState(0)
  const [lastRun, setLastRun] = useState(null)

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('hi_distance') || '0', 10)
    if (!Number.isNaN(saved)) setHighScore(saved)
  }, [])

  const handleGameOver = (stats) => {
    setLastRun(stats)
    if (stats.distance > highScore) {
      setHighScore(stats.distance)
      localStorage.setItem('hi_distance', String(stats.distance))
    }
    setRoute('menu')
  }

  return (
    <div className="phone-frame">
      {route === 'menu' && (
        <MenuPage
          onStart={() => setRoute('game')}
          highScore={highScore}
          lastRun={lastRun}
        />
      )}
      {route === 'game' && (
        <GamePage
          onExit={handleGameOver}
        />
      )}
    </div>
  )
}
