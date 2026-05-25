import React, { useEffect, useRef } from 'react'

/**
 * Top-down endless city driver.
 *
 * World coordinates: x = horizontal across road, y = world position
 *   (increases as the player drives forward). We render with the camera
 *   following the player's y, so the road scrolls downward on screen.
 *
 * Road layout (in canvas pixels, scaled to canvas width):
 *   - Sidewalks on the outer 12% each side
 *   - 4 lanes for traffic (2 same-direction lanes for player + slow cars,
 *     2 opposite-direction lanes for oncoming cars)
 */
export default function GameCanvas({ inputRef, paused, onHudUpdate, onGameOver }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const hudThrottleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // === Setup canvas to device pixel ratio ===
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (stateRef.current) {
        stateRef.current.viewW = rect.width
        stateRef.current.viewH = rect.height
      }
    }

    // === Initial state ===
    const rect = canvas.getBoundingClientRect()
    const viewW = rect.width
    const viewH = rect.height

    const ROAD_PAD_RATIO = 0.10
    const LANES = 4
    const roadLeft = viewW * ROAD_PAD_RATIO
    const roadRight = viewW * (1 - ROAD_PAD_RATIO)
    const roadWidth = roadRight - roadLeft
    const laneW = roadWidth / LANES
    // lane x-centers (0..3). Lanes 0,1 = same direction as player (right side
    // of road, but in RTL/top-down view we pick lane 1 as the player start
    // for symmetry). Lanes 2,3 = oncoming.
    const laneCenters = [
      roadLeft + laneW * 0.5,
      roadLeft + laneW * 1.5,
      roadLeft + laneW * 2.5,
      roadLeft + laneW * 3.5,
    ]

    stateRef.current = {
      viewW,
      viewH,
      roadLeft,
      roadRight,
      roadWidth,
      laneW,
      laneCenters,
      // Player car
      player: {
        x: laneCenters[1],
        y: 0,            // world y
        w: Math.min(40, laneW * 0.55),
        h: 70,
        speed: 0,        // world units / sec  (1 unit ≈ 1 px)
        maxSpeed: 480,
        steer: 0,        // tilt -1..1 for sprite lean
      },
      // World
      cameraY: 0,
      distance: 0,         // meters (1m ≈ 6 world units)
      coins: 0,
      topSpeed: 0,
      alive: true,
      // Spawned things
      cars: [],
      coinsList: [],
      // Spawn timers
      nextCarY: 600,
      nextCoinY: 300,
      // Decorative
      buildings: seedBuildings(viewW, viewH),
      lampOffset: 0,
      // Background bobbing
      time: 0,
    }

    setupCanvas()
    window.addEventListener('resize', setupCanvas)

    // === Main loop ===
    let lastT = performance.now()
    const loop = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000)
      lastT = t

      if (!paused && stateRef.current.alive) {
        update(stateRef.current, dt, inputRef.current)

        // HUD update throttled to ~12 Hz
        hudThrottleRef.current += dt
        if (hudThrottleRef.current > 0.08) {
          hudThrottleRef.current = 0
          const s = stateRef.current
          const speedKmh = Math.round(s.player.speed * 0.45)
          if (speedKmh > s.topSpeed) s.topSpeed = speedKmh
          onHudUpdate({
            speed: speedKmh,
            distance: Math.floor(s.distance),
            coins: s.coins,
            topSpeed: s.topSpeed,
          })
        }

        if (!stateRef.current.alive) {
          const s = stateRef.current
          onGameOver({
            distance: Math.floor(s.distance),
            coins: s.coins,
            topSpeed: s.topSpeed,
          })
        }
      }

      render(ctx, stateRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', setupCanvas)
    }
    // We deliberately re-init only on mount; pause/inputs are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className="game-canvas" />
}

// ====================== HELPERS & GAME LOGIC ======================

function seedBuildings(viewW, viewH) {
  const result = []
  // Two columns of buildings - left and right of road
  for (let side = 0; side < 2; side++) {
    let y = -200
    while (y < viewH * 6) {
      const h = 60 + Math.random() * 160
      const color = pickBuildingColor()
      const lit = Math.random() > 0.25
      result.push({ side, y, h, color, lit, seed: Math.random() })
      y += h + 20 + Math.random() * 30
    }
  }
  return result
}

function pickBuildingColor() {
  const palette = [
    '#1a1838', '#2a1850', '#1b2a55', '#2a1a40',
    '#3a1f5a', '#1a2840', '#2c1450', '#1e1530',
  ]
  return palette[(Math.random() * palette.length) | 0]
}

function update(s, dt, input) {
  const p = s.player

  // === Acceleration / braking ===
  const accelForce = 280
  const brakeForce = 520
  const drag = 60
  if (input.accel) p.speed += accelForce * dt
  if (input.brake) p.speed -= brakeForce * dt
  p.speed -= drag * dt
  if (p.speed < 0) p.speed = 0
  if (p.speed > p.maxSpeed) p.speed = p.maxSpeed

  // === Steering ===
  const steerSpeed = 260 + p.speed * 0.4
  let targetSteer = 0
  if (input.left)  { p.x -= steerSpeed * dt; targetSteer = -1 }
  if (input.right) { p.x += steerSpeed * dt; targetSteer = 1 }
  // Limit to road bounds
  const margin = p.w * 0.5 + 4
  if (p.x < s.roadLeft + margin)  p.x = s.roadLeft + margin
  if (p.x > s.roadRight - margin) p.x = s.roadRight - margin
  // Smooth steer indicator
  p.steer += (targetSteer - p.steer) * Math.min(1, dt * 8)

  // === Move world forward ===
  p.y += p.speed * dt
  s.distance += (p.speed * dt) / 6  // 6 world units per meter
  s.cameraY = p.y
  s.time += dt
  s.lampOffset = (s.lampOffset + p.speed * dt) % 180

  // === Spawn traffic ahead ===
  // We keep cars within ~2 screens ahead.
  while (s.nextCarY < p.y + s.viewH * 1.8) {
    spawnCar(s, s.nextCarY)
    s.nextCarY += 140 + Math.random() * 220
  }

  // Move and cull cars
  for (let i = s.cars.length - 1; i >= 0; i--) {
    const c = s.cars[i]
    c.y += c.speed * dt
    // Cull if far behind
    if (c.y < p.y - s.viewH * 0.8) {
      s.cars.splice(i, 1)
      continue
    }
    // Collision check (AABB in world space)
    if (Math.abs(c.x - p.x) < (c.w + p.w) * 0.5 - 4 &&
        Math.abs(c.y - p.y) < (c.h + p.h) * 0.5 - 4) {
      s.alive = false
    }
  }

  // === Spawn coins ===
  while (s.nextCoinY < p.y + s.viewH * 1.8) {
    if (Math.random() > 0.35) {
      const lane = (Math.random() * 4) | 0
      s.coinsList.push({
        x: s.laneCenters[lane] + (Math.random() - 0.5) * (s.laneW * 0.3),
        y: s.nextCoinY,
        collected: false,
        wobble: Math.random() * Math.PI * 2,
      })
    }
    s.nextCoinY += 90 + Math.random() * 160
  }
  // Coin collection / cull
  for (let i = s.coinsList.length - 1; i >= 0; i--) {
    const co = s.coinsList[i]
    if (co.y < p.y - s.viewH * 0.8) {
      s.coinsList.splice(i, 1)
      continue
    }
    if (!co.collected &&
        Math.abs(co.x - p.x) < 20 + p.w * 0.5 &&
        Math.abs(co.y - p.y) < 20 + p.h * 0.5) {
      co.collected = true
      s.coins += 1
      s.coinsList.splice(i, 1)
    }
  }

  // === Recycle buildings ===
  for (const b of s.buildings) {
    if (b.y < p.y - 300) {
      b.y = p.y + s.viewH + 80 + Math.random() * 120
      b.h = 60 + Math.random() * 160
      b.color = pickBuildingColor()
      b.lit = Math.random() > 0.25
      b.seed = Math.random()
    }
  }
}

function spawnCar(s, y) {
  // Lane 0..1 → same direction (slower than player), Lane 2..3 → oncoming
  const lane = (Math.random() * 4) | 0
  const sameDir = lane < 2
  const sp = sameDir
    ? 120 + Math.random() * 140
    : -(160 + Math.random() * 180)
  // Avoid spawning on top of another close car in the same lane
  for (const c of s.cars) {
    if (c.lane === lane && Math.abs(c.y - y) < 160) return
  }
  s.cars.push({
    x: s.laneCenters[lane],
    y,
    lane,
    speed: sp,
    w: Math.min(38, s.laneW * 0.52),
    h: 68,
    color: pickCarColor(),
    accent: pickCarAccent(),
  })
}

function pickCarColor() {
  const palette = ['#e84545', '#3a86ff', '#ffd166', '#06d6a0', '#f78c6b', '#c77dff', '#cdd6f4']
  return palette[(Math.random() * palette.length) | 0]
}
function pickCarAccent() {
  return ['#1a1a2e', '#0f0f1a', '#2a2a3e'][(Math.random() * 3) | 0]
}

// =================== RENDERING ===================

function render(ctx, s) {
  const { viewW, viewH } = s
  // Sky / ground base
  const grd = ctx.createLinearGradient(0, 0, 0, viewH)
  grd.addColorStop(0, '#080a1a')
  grd.addColorStop(0.45, '#0a0e22')
  grd.addColorStop(1, '#05060d')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, viewW, viewH)

  drawSidewalksAndBuildings(ctx, s)
  drawRoad(ctx, s)
  drawCoins(ctx, s)
  drawCars(ctx, s)
  drawPlayer(ctx, s)
  drawVignette(ctx, s)
}

function worldToScreenY(s, worldY) {
  // Player is at ~75% down the screen
  const playerScreenY = s.viewH * 0.72
  return playerScreenY - (worldY - s.player.y)
}

function drawSidewalksAndBuildings(ctx, s) {
  // Sidewalk base
  ctx.fillStyle = '#0e0f1d'
  ctx.fillRect(0, 0, s.roadLeft, s.viewH)
  ctx.fillRect(s.roadRight, 0, s.viewW - s.roadRight, s.viewH)

  // Curb glow
  ctx.fillStyle = 'rgba(0, 240, 255, 0.18)'
  ctx.fillRect(s.roadLeft - 2, 0, 2, s.viewH)
  ctx.fillRect(s.roadRight, 0, 2, s.viewH)

  // Buildings
  for (const b of s.buildings) {
    const sy = worldToScreenY(s, b.y) - b.h
    if (sy > s.viewH || sy + b.h < -20) continue
    const x = b.side === 0 ? 0 : s.roadRight
    const w = b.side === 0 ? s.roadLeft : (s.viewW - s.roadRight)
    // Building body
    ctx.fillStyle = b.color
    ctx.fillRect(x, sy, w, b.h)
    // Roof line accent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fillRect(x, sy, w, 2)
    // Windows grid
    const cols = Math.max(2, Math.floor(w / 10))
    const rows = Math.max(2, Math.floor(b.h / 12))
    const cellW = w / cols
    const cellH = b.h / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // deterministic-ish lit pattern using seed
        const lit = b.lit && ((c + r + Math.floor(b.seed * 9)) % 3 !== 0)
        if (lit) {
          const tint = ((c * 31 + r * 17 + Math.floor(b.seed * 100)) % 4)
          ctx.fillStyle = ['#ffd166', '#ffb347', '#ffe1a8', '#fff3c4'][tint]
          ctx.globalAlpha = 0.75
          ctx.fillRect(x + c * cellW + 2, sy + r * cellH + 2, cellW - 4, cellH - 5)
          ctx.globalAlpha = 1
        }
      }
    }
  }

  // Street lamps along the curb every 180 world units
  drawStreetLamps(ctx, s)
}

function drawStreetLamps(ctx, s) {
  const spacing = 180
  // Find first lamp y in world coords below camera-top
  const topWorld = s.player.y + s.viewH * 0.28
  const firstY = Math.ceil((s.player.y - s.viewH * 0.3) / spacing) * spacing
  for (let wy = firstY; wy < topWorld + s.viewH; wy += spacing) {
    const sy = worldToScreenY(s, wy)
    if (sy < -20 || sy > s.viewH + 20) continue
    // Left lamp
    drawLamp(ctx, s.roadLeft - 6, sy, +1)
    // Right lamp
    drawLamp(ctx, s.roadRight + 6, sy, -1)
  }
}

function drawLamp(ctx, x, y, dir) {
  // Pole
  ctx.fillStyle = '#3a3f55'
  ctx.fillRect(x - 1.5, y - 18, 3, 18)
  // Arm
  ctx.fillRect(x, y - 18, 10 * dir, 2)
  // Glow
  const grad = ctx.createRadialGradient(x + 10 * dir, y - 16, 1, x + 10 * dir, y - 16, 28)
  grad.addColorStop(0, 'rgba(255, 220, 130, 0.7)')
  grad.addColorStop(1, 'rgba(255, 220, 130, 0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x + 10 * dir, y - 16, 28, 0, Math.PI * 2)
  ctx.fill()
  // Bulb
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.arc(x + 10 * dir, y - 16, 2, 0, Math.PI * 2)
  ctx.fill()
}

function drawRoad(ctx, s) {
  // Asphalt
  ctx.fillStyle = '#1c1f2b'
  ctx.fillRect(s.roadLeft, 0, s.roadWidth, s.viewH)

  // Subtle asphalt texture (vertical streaks)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.018)'
  for (let i = 0; i < 6; i++) {
    const sx = s.roadLeft + ((i * 47) % s.roadWidth)
    ctx.fillRect(sx, 0, 1, s.viewH)
  }

  // Outer solid lines (curb stripes)
  ctx.fillStyle = '#f5d442'
  ctx.fillRect(s.roadLeft + 2, 0, 2, s.viewH)
  ctx.fillRect(s.roadRight - 4, 0, 2, s.viewH)

  // Lane divider dashes between lanes 0|1, 2|3 (dashed white)
  // and double-yellow between lanes 1|2 (centerline)
  const dashSpacing = 36
  const dashLen = 18
  const offset = (s.player.y % dashSpacing)
  // dashed lines
  ctx.fillStyle = '#dde3ff'
  for (const idx of [1, 3]) {
    const lx = s.roadLeft + s.laneW * idx
    for (let y = -offset; y < s.viewH + dashSpacing; y += dashSpacing) {
      ctx.fillRect(lx - 1, y, 2, dashLen)
    }
  }
  // centerline double yellow
  const cx = s.roadLeft + s.laneW * 2
  ctx.fillStyle = '#f5d442'
  ctx.fillRect(cx - 4, 0, 2, s.viewH)
  ctx.fillRect(cx + 2, 0, 2, s.viewH)
}

function drawCoins(ctx, s) {
  for (const co of s.coinsList) {
    const sy = worldToScreenY(s, co.y)
    if (sy < -20 || sy > s.viewH + 20) continue
    const wob = Math.sin(s.time * 4 + co.wobble) * 0.4 + 0.6
    // Outer glow
    const grad = ctx.createRadialGradient(co.x, sy, 1, co.x, sy, 18)
    grad.addColorStop(0, 'rgba(255, 215, 80, 0.8)')
    grad.addColorStop(1, 'rgba(255, 215, 80, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(co.x, sy, 18, 0, Math.PI * 2)
    ctx.fill()
    // Coin disc (squished by wobble for 3D feel)
    ctx.save()
    ctx.translate(co.x, sy)
    ctx.scale(1, wob)
    ctx.fillStyle = '#ffd166'
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b8860b'
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawCars(ctx, s) {
  for (const c of s.cars) {
    const sy = worldToScreenY(s, c.y)
    if (sy < -80 || sy > s.viewH + 80) continue
    drawCarShape(ctx, c.x, sy, c.w, c.h, c.color, c.accent, c.speed < 0)
  }
}

function drawPlayer(ctx, s) {
  const p = s.player
  const sy = worldToScreenY(s, p.y)
  // Tire smoke / shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.beginPath()
  ctx.ellipse(p.x, sy + p.h * 0.45, p.w * 0.55, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Slight tilt to indicate steering
  ctx.save()
  ctx.translate(p.x, sy)
  ctx.rotate(p.steer * 0.08)
  drawCarShape(ctx, 0, 0, p.w, p.h, '#00f0ff', '#022a30', false, true)
  ctx.restore()

  // Headlight cones (forward = up)
  const lightGrad = ctx.createLinearGradient(p.x, sy - p.h * 0.5, p.x, sy - p.h * 0.5 - 140)
  lightGrad.addColorStop(0, 'rgba(255, 255, 220, 0.35)')
  lightGrad.addColorStop(1, 'rgba(255, 255, 220, 0)')
  ctx.fillStyle = lightGrad
  ctx.beginPath()
  ctx.moveTo(p.x - p.w * 0.4, sy - p.h * 0.45)
  ctx.lineTo(p.x + p.w * 0.4, sy - p.h * 0.45)
  ctx.lineTo(p.x + p.w * 1.8, sy - p.h * 0.45 - 140)
  ctx.lineTo(p.x - p.w * 1.8, sy - p.h * 0.45 - 140)
  ctx.closePath()
  ctx.fill()
}

function drawCarShape(ctx, cx, cy, w, h, color, accent, oncoming = false, isPlayer = false) {
  ctx.save()
  ctx.translate(cx, cy)
  // Body
  roundRect(ctx, -w/2, -h/2, w, h, 8)
  ctx.fillStyle = color
  ctx.fill()
  // Hood vs trunk shading
  const grad = ctx.createLinearGradient(0, -h/2, 0, h/2)
  grad.addColorStop(0, 'rgba(255,255,255,0.18)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = grad
  roundRect(ctx, -w/2, -h/2, w, h, 8)
  ctx.fill()

  // Windshield (front = upward in world; for oncoming cars, swap)
  ctx.fillStyle = accent
  const winFrontY = oncoming ? h * 0.18 : -h * 0.32
  roundRect(ctx, -w * 0.36, winFrontY, w * 0.72, h * 0.18, 3)
  ctx.fill()
  // Rear window
  const winRearY = oncoming ? -h * 0.36 : h * 0.10
  roundRect(ctx, -w * 0.34, winRearY, w * 0.68, h * 0.16, 3)
  ctx.fill()

  // Side mirrors
  ctx.fillStyle = accent
  ctx.fillRect(-w/2 - 2, -h * 0.18, 3, 5)
  ctx.fillRect(w/2 - 1, -h * 0.18, 3, 5)

  // Lights
  if (!oncoming) {
    // Headlights front (top)
    ctx.fillStyle = isPlayer ? '#fff8d0' : '#fff5a8'
    ctx.fillRect(-w * 0.42, -h * 0.48, w * 0.18, 3)
    ctx.fillRect( w * 0.24, -h * 0.48, w * 0.18, 3)
    // Tail lights (bottom)
    ctx.fillStyle = '#ff3344'
    ctx.fillRect(-w * 0.42, h * 0.45, w * 0.18, 2)
    ctx.fillRect( w * 0.24, h * 0.45, w * 0.18, 2)
  } else {
    // Oncoming car: bright headlights at bottom (facing us)
    ctx.fillStyle = '#fff8d0'
    ctx.fillRect(-w * 0.42, h * 0.45, w * 0.18, 3)
    ctx.fillRect( w * 0.24, h * 0.45, w * 0.18, 3)
    // Glow
    const lg = ctx.createRadialGradient(0, h * 0.5, 1, 0, h * 0.5, 24)
    lg.addColorStop(0, 'rgba(255, 248, 200, 0.5)')
    lg.addColorStop(1, 'rgba(255, 248, 200, 0)')
    ctx.fillStyle = lg
    ctx.beginPath()
    ctx.arc(0, h * 0.6, 24, 0, Math.PI * 2)
    ctx.fill()
  }

  // Body outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 1
  roundRect(ctx, -w/2, -h/2, w, h, 8)
  ctx.stroke()

  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawVignette(ctx, s) {
  const grd = ctx.createRadialGradient(
    s.viewW / 2, s.viewH * 0.6, s.viewH * 0.4,
    s.viewW / 2, s.viewH * 0.6, s.viewH * 0.9
  )
  grd.addColorStop(0, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, s.viewW, s.viewH)
}
