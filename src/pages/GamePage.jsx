import React, { useEffect, useRef, useState } from 'react'
import GameCanvas from '../components/GameCanvas.jsx'
import Hud from '../components/Hud.jsx'
import Controls from '../components/Controls.jsx'
import GameOver from '../components/GameOver.jsx'
import './GamePage.css'

export default function GamePage({ onExit }) {
  // Game state held outside React (in refs) for performance;
  // mirror to React state only what the HUD displays.
  const [hud, setHud] = useState({
    speed: 0,
    distance: 0,
    coins: 0,
    topSpeed: 0,
  })
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(null)

  const inputRef = useRef({
    left: false,
    right: false,
    accel: false,
    brake: false,
  })

  const handleControl = (key, isDown) => {
    inputRef.current[key] = isDown
  }

  // Keyboard fallback (desktop / preview)
  useEffect(() => {
    const map = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'accel', w: 'accel', W: 'accel',
      ArrowDown: 'brake', s: 'brake', S: 'brake',
    }
    const down = (e) => {
      const k = map[e.key]
      if (k) { inputRef.current[k] = true; e.preventDefault() }
      if (e.key === 'Escape') setPaused(p => !p)
    }
    const up = (e) => {
      const k = map[e.key]
      if (k) { inputRef.current[k] = false; e.preventDefault() }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const handleGameOver = (stats) => {
    setGameOver(stats)
  }

  const handleExitWithStats = () => {
    onExit(gameOver || hud)
  }

  return (
    <div className="game-page">
      <GameCanvas
        inputRef={inputRef}
        paused={paused || !!gameOver}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
      />

      <Hud
        speed={hud.speed}
        distance={hud.distance}
        coins={hud.coins}
        onPause={() => setPaused(true)}
      />

      <Controls onControl={handleControl} />

      {paused && !gameOver && (
        <div className="overlay pause-overlay">
          <div className="overlay-card">
            <h2 className="display-font">إيقاف مؤقت</h2>
            <p>اختر الإجراء التالي</p>
            <button className="overlay-btn primary" onClick={() => setPaused(false)}>
              متابعة اللعب
            </button>
            <button className="overlay-btn" onClick={() => onExit(hud)}>
              الخروج إلى القائمة
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <GameOver stats={gameOver} onExit={handleExitWithStats} />
      )}
    </div>
  )
}
