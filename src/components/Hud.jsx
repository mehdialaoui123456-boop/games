import React from 'react'
import './Hud.css'

export default function Hud({ speed, distance, coins, onPause }) {
  // Speed gauge arc: 0..240 km/h shown, capped
  const shown = Math.min(240, speed)
  const pct = shown / 240
  const radius = 26
  const circ = 2 * Math.PI * radius
  const dash = circ * 0.75
  const offset = dash * (1 - pct)

  return (
    <div className="hud">
      <div className="hud-top">
        {/* Pause */}
        <button className="hud-icon-btn" onClick={onPause} aria-label="إيقاف">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
          </svg>
        </button>

        {/* Center: distance + coins */}
        <div className="hud-center">
          <div className="hud-pill">
            <span className="hud-pill-label">المسافة</span>
            <span className="hud-pill-value eng-num">{distance}<small>m</small></span>
          </div>
          <div className="hud-pill coin-pill">
            <span className="coin-dot" />
            <span className="hud-pill-value eng-num">{coins}</span>
          </div>
        </div>

        {/* Speedometer */}
        <div className="speedo">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00f0ff"/>
                <stop offset="60%" stopColor="#ffb347"/>
                <stop offset="100%" stopColor="#ff2bd6"/>
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="5"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset="0"
              transform="rotate(135 32 32)"
              strokeLinecap="round"
            />
            {/* Active arc */}
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="url(#speedGrad)"
              strokeWidth="5"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={offset}
              transform="rotate(135 32 32)"
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
            />
          </svg>
          <div className="speedo-text">
            <span className="speedo-value eng-num">{speed}</span>
            <span className="speedo-unit">km/h</span>
          </div>
        </div>
      </div>
    </div>
  )
}
