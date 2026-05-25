import React from 'react'
import './MenuPage.css'

export default function MenuPage({ onStart, highScore, lastRun }) {
  return (
    <div className="menu-page">
      {/* Animated background skyline */}
      <div className="skyline">
        <div className="moon" />
        <div className="stars" />
        <div className="buildings back" />
        <div className="buildings front" />
        <div className="road-strip">
          <div className="road-dash" />
          <div className="road-dash" />
          <div className="road-dash" />
          <div className="road-dash" />
        </div>
      </div>

      {/* Foreground content */}
      <div className="menu-content">
        <div className="brand">
          <div className="brand-tag eng-num">CITY · DRIVE · 2026</div>
          <h1 className="brand-title display-font">قيادة حرة</h1>
          <h2 className="brand-subtitle display-font">في المدينة</h2>
          <div className="brand-rule" />
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">أفضل مسافة</span>
            <span className="stat-value eng-num">{highScore}<small> m</small></span>
          </div>
          <div className="stat-card">
            <span className="stat-label">آخر جولة</span>
            <span className="stat-value eng-num">
              {lastRun ? lastRun.distance : 0}<small> m</small>
            </span>
          </div>
        </div>

        {lastRun && (
          <div className="last-run-detail">
            <span>عملات: <b className="eng-num">{lastRun.coins}</b></span>
            <span>أعلى سرعة: <b className="eng-num">{lastRun.topSpeed} km/h</b></span>
          </div>
        )}

        <button className="play-btn" onClick={onStart}>
          <span className="play-btn-inner display-font">ابدأ القيادة</span>
          <span className="play-btn-arrow">◀</span>
        </button>

        <div className="hints">
          <div className="hint-row">
            <span className="hint-key">◀ ▶</span>
            <span className="hint-text">للتوجيه يميناً ويساراً</span>
          </div>
          <div className="hint-row">
            <span className="hint-key">▲</span>
            <span className="hint-text">للتسارع</span>
          </div>
          <div className="hint-row">
            <span className="hint-key">▼</span>
            <span className="hint-text">للفرملة</span>
          </div>
        </div>

        <div className="footer-bar">
          <span className="dot" />
          <span className="eng-num footer-text">v1.0 · BASE44 BUILD</span>
          <span className="dot" />
        </div>
      </div>
    </div>
  )
}
