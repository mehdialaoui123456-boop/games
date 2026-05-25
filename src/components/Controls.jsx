import React, { useEffect, useRef } from 'react'
import './Controls.css'

export default function Controls({ onControl }) {
  // Track active buttons so a finger sliding off still releases properly.
  const activeRef = useRef(new Map())  // pointerId -> key

  const bindEvents = (key) => {
    const handleDown = (e) => {
      e.preventDefault()
      activeRef.current.set(e.pointerId, key)
      onControl(key, true)
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const handleUp = (e) => {
      e.preventDefault()
      const k = activeRef.current.get(e.pointerId)
      if (k) {
        onControl(k, false)
        activeRef.current.delete(e.pointerId)
      }
    }
    return {
      onPointerDown: handleDown,
      onPointerUp: handleUp,
      onPointerCancel: handleUp,
      onPointerLeave: handleUp,
    }
  }

  // Safety: release everything if component unmounts
  useEffect(() => {
    return () => {
      for (const k of activeRef.current.values()) onControl(k, false)
      activeRef.current.clear()
    }
  }, [onControl])

  return (
    <div className="controls">
      {/* Left side - steering. In RTL, the visual "left" side of the
          screen is on the user's left regardless of language direction. */}
      <div className="steer-pad">
        <button className="ctrl-btn steer-btn" {...bindEvents('left')} aria-label="يسار">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="ctrl-btn steer-btn" {...bindEvents('right')} aria-label="يمين">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Right side - pedals */}
      <div className="pedal-pad">
        <button className="ctrl-btn pedal-btn brake-btn" {...bindEvents('brake')} aria-label="فرامل">
          <span className="pedal-label">فرامل</span>
        </button>
        <button className="ctrl-btn pedal-btn gas-btn" {...bindEvents('accel')} aria-label="بنزين">
          <span className="pedal-label">بنزين</span>
        </button>
      </div>
    </div>
  )
}
