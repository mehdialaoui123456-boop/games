import React from 'react'

export default function GameOver({ stats, onExit }) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2 className="display-font">انتهت الجولة</h2>
        <p>وقعت في حادث — جرب من جديد</p>

        <div className="result-grid">
          <div className="result-row">
            <span className="result-label">المسافة</span>
            <span className="result-value eng-num">{stats.distance}<small> m</small></span>
          </div>
          <div className="result-row">
            <span className="result-label">العملات</span>
            <span className="result-value eng-num" style={{color:'#ffd166'}}>{stats.coins}</span>
          </div>
          <div className="result-row">
            <span className="result-label">أعلى سرعة</span>
            <span className="result-value eng-num">{stats.topSpeed}<small> km/h</small></span>
          </div>
        </div>

        <button className="overlay-btn primary" onClick={onExit}>
          العودة إلى القائمة
        </button>
      </div>
    </div>
  )
}
