import React, { useEffect, useRef, useCallback } from 'react'
import './Controls.css'

/**
 * Mobile-first touch controls.
 *
 * Key design decisions for reliable phone gameplay:
 *  1. Use touchstart/touchend (NOT pointer events) — pointer events +
 *     setPointerCapture fight with WebView and cause stuck buttons.
 *  2. Track touches by Touch.identifier, not pointerId.
 *  3. Every button gets touch-action:none AND we preventDefault on
 *     touchstart to kill the 300ms delay, long-press menu, and scroll.
 *  4. Multi-touch: user can hold gas + steer at the same time because
 *     we track each finger independently.
 *  5. Big hit areas (80×80 minimum) with generous padding.
 *  6. Visual feedback via CSS classes toggled from JS (not :active which
 *     is unreliable on mobile WebView).
 */
export default function Controls({ onControl }) {
  const activeTouches = useRef(new Map()) // touchIdentifier → key
  const btnRefs = useRef({})

  // Register a button ref by key
  const setRef = useCallback((key) => (el) => {
    btnRefs.current[key] = el
  }, [])

  useEffect(() => {
    const buttons = btnRefs.current
    const map = activeTouches.current

    const findKey = (touch) => {
      // Check which button this touch is over
      for (const [key, el] of Object.entries(buttons)) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (
          touch.clientX >= r.left &&
          touch.clientX <= r.right &&
          touch.clientY >= r.top &&
          touch.clientY <= r.bottom
        ) {
          return key
        }
      }
      return null
    }

    const handleStart = (e) => {
      e.preventDefault() // kills 300ms delay, scroll, long-press
      for (const touch of e.changedTouches) {
        const key = findKey(touch)
        if (key) {
          map.set(touch.identifier, key)
          onControl(key, true)
          buttons[key]?.classList.add('pressed')
        }
      }
    }

    const handleEnd = (e) => {
      e.preventDefault()
      for (const touch of e.changedTouches) {
        const key = map.get(touch.identifier)
        if (key) {
          onControl(key, false)
          buttons[key]?.classList.remove('pressed')
          map.delete(touch.identifier)
        }
      }
    }

    const handleMove = (e) => {
      e.preventDefault()
      // If finger slides off a button, release it;
      // if it slides onto a new button, press that one.
      for (const touch of e.changedTouches) {
        const prevKey = map.get(touch.identifier)
        const currKey = findKey(touch)

        if (prevKey && prevKey !== currKey) {
          // Finger left the old button
          onControl(prevKey, false)
          buttons[prevKey]?.classList.remove('pressed')
          map.delete(touch.identifier)
        }
        if (currKey && currKey !== prevKey) {
          // Finger entered a new button
          map.set(touch.identifier, currKey)
          onControl(currKey, true)
          buttons[currKey]?.classList.add('pressed')
        }
      }
    }

    // Attach to the document so we catch all touches even if they
    // start on the button and slide off screen.
    document.addEventListener('touchstart', handleStart, { passive: false })
    document.addEventListener('touchend', handleEnd, { passive: false })
    document.addEventListener('touchcancel', handleEnd, { passive: false })
    document.addEventListener('touchmove', handleMove, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleStart)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      // Release all on unmount
      for (const key of map.values()) onControl(key, false)
      map.clear()
    }
  }, [onControl])

  return (
    <div className="controls">
      {/* Left side — steering */}
      <div className="steer-pad">
        <div className="ctrl-btn steer-btn" ref={setRef('left')} aria-label="يسار">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="ctrl-btn steer-btn" ref={setRef('right')} aria-label="يمين">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Right side — pedals */}
      <div className="pedal-pad">
        <div className="ctrl-btn pedal-btn brake-btn" ref={setRef('brake')} aria-label="فرامل">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="8" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="2.5"/>
          </svg>
          <span className="pedal-label">فرامل</span>
        </div>
        <div className="ctrl-btn pedal-btn gas-btn" ref={setRef('accel')} aria-label="بنزين">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="pedal-label">بنزين</span>
        </div>
      </div>
    </div>
  )
}
