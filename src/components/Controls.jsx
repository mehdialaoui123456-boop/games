import React, { useEffect, useRef, useCallback } from 'react'
import './Controls.css'

/**
 * Mobile touch controls — per-button touch listeners.
 *
 * Each button attaches its own touchstart/touchend directly on the
 * DOM element. This avoids hit-testing, coordinate math, and the
 * WebView issues with document-level touch interception.
 *
 * Hold = continuous input. Multi-touch works because each finger
 * gets its own Touch.identifier tracked per-button.
 */

function ControlButton({ controlKey, onControl, className, children }) {
  const ref = useRef(null)
  const activeTouches = useRef(new Set())

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const press = (e) => {
      e.preventDefault()
      e.stopPropagation()
      for (const t of e.changedTouches) {
        activeTouches.current.add(t.identifier)
      }
      onControl(controlKey, true)
      el.classList.add('pressed')
    }

    const release = (e) => {
      e.preventDefault()
      e.stopPropagation()
      for (const t of e.changedTouches) {
        activeTouches.current.delete(t.identifier)
      }
      // Only release if ALL fingers are off this button
      if (activeTouches.current.size === 0) {
        onControl(controlKey, false)
        el.classList.remove('pressed')
      }
    }

    // Also handle mouse for desktop testing
    const mouseDown = (e) => {
      e.preventDefault()
      onControl(controlKey, true)
      el.classList.add('pressed')

      const mouseUp = () => {
        onControl(controlKey, false)
        el.classList.remove('pressed')
        window.removeEventListener('mouseup', mouseUp)
      }
      window.addEventListener('mouseup', mouseUp)
    }

    el.addEventListener('touchstart', press, { passive: false })
    el.addEventListener('touchend', release, { passive: false })
    el.addEventListener('touchcancel', release, { passive: false })
    el.addEventListener('mousedown', mouseDown, { passive: false })

    // Prevent context menu (long press on Android)
    el.addEventListener('contextmenu', (e) => e.preventDefault())

    return () => {
      el.removeEventListener('touchstart', press)
      el.removeEventListener('touchend', release)
      el.removeEventListener('touchcancel', release)
      el.removeEventListener('mousedown', mouseDown)
      // Safety: release on unmount
      if (activeTouches.current.size > 0) {
        onControl(controlKey, false)
        activeTouches.current.clear()
      }
    }
  }, [controlKey, onControl])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export default function Controls({ onControl }) {
  // Stable callback ref so child effects don't re-run
  const onControlRef = useRef(onControl)
  onControlRef.current = onControl
  const stableControl = useCallback((key, down) => {
    onControlRef.current(key, down)
  }, [])

  return (
    <div className="controls">
      {/* Left side — steering */}
      <div className="steer-pad">
        <ControlButton
          controlKey="left"
          onControl={stableControl}
          className="ctrl-btn steer-btn"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ControlButton>
        <ControlButton
          controlKey="right"
          onControl={stableControl}
          className="ctrl-btn steer-btn"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ControlButton>
      </div>

      {/* Right side — pedals */}
      <div className="pedal-pad">
        <ControlButton
          controlKey="brake"
          onControl={stableControl}
          className="ctrl-btn pedal-btn brake-btn"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="8" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="2.5"/>
          </svg>
          <span className="pedal-label">فرامل</span>
        </ControlButton>
        <ControlButton
          controlKey="accel"
          onControl={stableControl}
          className="ctrl-btn pedal-btn gas-btn"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="pedal-label">بنزين</span>
        </ControlButton>
      </div>
    </div>
  )
}
