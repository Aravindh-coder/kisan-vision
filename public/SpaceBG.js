(function () {
  function init() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;'
  document.body.insertBefore(canvas, document.body.firstChild)
  const ctx = canvas.getContext('2d')

  let W, H
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)

  // ── STARS ─────────────────────────────────────────────
  const stars = Array.from({ length: 300 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.2 + 0.2,
    a: Math.random(),
    speed: Math.random() * 0.0003 + 0.0001
  }))

  // ── HUD GRID ──────────────────────────────────────────
  const GRID = 60

  // ── SCAN LINE ─────────────────────────────────────────
  let scanY = 0

  // ── TARGETING RETICLES ────────────────────────────────
  const reticles = Array.from({ length: 4 }, () => ({
    x: Math.random() * 0.8 + 0.1,
    y: Math.random() * 0.7 + 0.1,
    size: Math.random() * 30 + 20,
    angle: Math.random() * Math.PI * 2,
    speed: (Math.random() - 0.5) * 0.0003,
    pulse: Math.random() * Math.PI * 2,
    color: Math.random() > 0.5 ? '#4ade80' : '#22c55e'
  }))

  // ── SATELLITES ────────────────────────────────────────
  const satellites = Array.from({ length: 3 }, (_, i) => ({
    angle: (i / 3) * Math.PI * 2,
    orbitX: 0.5, orbitY: 0.38,
    rx: 0.28, ry: 0.12,
    speed: 0.004 + i * 0.002,
    laserOn: false,
    laserTarget: { x: 0.3 + i * 0.15, y: 0.7 }
  }))

  // ── DATA NODES ────────────────────────────────────────
  const nodes = Array.from({ length: 12 }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0003,
    vy: (Math.random() - 0.5) * 0.0003,
    r: Math.random() * 3 + 2,
    connections: []
  }))

  // ── DEBRIS ────────────────────────────────────────────
  const debris = Array.from({ length: 25 }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0004,
    size: Math.random() * 3 + 1,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.04
  }))

  // ── TERRAIN BARS (bottom) ─────────────────────────────
  const terrain = Array.from({ length: 80 }, (_, i) => ({
    x: i / 80,
    h: Math.random() * 0.08 + 0.02,
    speed: Math.random() * 0.002 + 0.001,
    phase: Math.random() * Math.PI * 2
  }))

  // ── ALERT FLASHES ─────────────────────────────────────
  let alertTimer = 0
  let alertActive = false

  // ── DATA STREAMS (vertical) ───────────────────────────
  const streams = Array.from({ length: 10 }, () => ({
    x: Math.random(),
    y: Math.random(),
    chars: Array.from({ length: 8 }, () => Math.random() > 0.5 ? '1' : '0'),
    speed: Math.random() * 0.003 + 0.001,
    opacity: Math.random() * 0.3 + 0.05
  }))

  let t = 0

  function drawReticle(rx, ry, size, angle, pulse, color) {
    const x = rx * W, y = ry * H
    const s = size + Math.sin(pulse) * 4
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.7 + Math.sin(pulse) * 0.3
    ctx.translate(x, y)
    ctx.rotate(angle)

    // Corner brackets
    const b = s * 0.4
    ;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy]) => {
      ctx.beginPath()
      ctx.moveTo(sx*s, sy*s - sy*b)
      ctx.lineTo(sx*s, sy*s)
      ctx.lineTo(sx*s - sx*b, sy*s)
      ctx.stroke()
    })

    // Center cross
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(-s*0.3, 0); ctx.lineTo(s*0.3, 0)
    ctx.moveTo(0, -s*0.3); ctx.lineTo(0, s*0.3)
    ctx.stroke()

    // Center dot
    ctx.globalAlpha = 0.9
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(0, 0, 2, 0, Math.PI*2)
    ctx.fill()

    ctx.restore()
  }

  function drawSatellite(x, y, color) {
    ctx.save()
    ctx.translate(x, y)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5

    // Body
    ctx.globalAlpha = 0.9
    ctx.fillRect(-6, -4, 12, 8)

    // Solar panels
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#93c5fd'
    ctx.fillRect(-22, -2, 14, 4)
    ctx.fillRect(8, -2, 14, 4)

    // Panel lines
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 0.5
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-22 + i*4.5, -2); ctx.lineTo(-22 + i*4.5, 2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(8 + i*4.5, -2); ctx.lineTo(8 + i*4.5, 2); ctx.stroke()
    }

    // Antenna
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.moveTo(0, -4); ctx.lineTo(0, -12); ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, -12, 3, 0, Math.PI*2); ctx.stroke()

    ctx.restore()
  }

  function draw() {
    t += 0.016
    ctx.clearRect(0, 0, W, H)

    // ── BACKGROUND ──────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#000500')
    bg.addColorStop(0.5, '#010a02')
    bg.addColorStop(1, '#000300')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // ── STARS ───────────────────────────────────────────
    stars.forEach(s => {
      s.a += s.speed
      const alpha = 0.3 + Math.abs(Math.sin(s.a)) * 0.6
      ctx.globalAlpha = alpha
      ctx.fillStyle = Math.random() > 0.98 ? '#86efac' : '#ffffff'
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // ── HUD GRID ────────────────────────────────────────
    ctx.globalAlpha = 0.06
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Grid intersection dots
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#4ade80'
    for (let x = 0; x < W; x += GRID) {
      for (let y = 0; y < H; y += GRID) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill()
      }
    }

    // ── PERSPECTIVE GRID (bottom) ────────────────────────
    ctx.globalAlpha = 0.08
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 0.5
    const horizon = H * 0.72
    const vp = { x: W * 0.5, y: horizon }
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath()
      ctx.moveTo(vp.x + i * 80, H)
      ctx.lineTo(vp.x, horizon)
      ctx.stroke()
    }
    for (let i = 0; i < 8; i++) {
      const y = horizon + (H - horizon) * (i / 8)
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // ── DATA NODES + CONNECTIONS ─────────────────────────
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy
      if (n.x < 0 || n.x > 1) n.vx *= -1
      if (n.y < 0 || n.y > 1) n.vy *= -1
    })
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j <= i) return
        const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 180) {
          ctx.globalAlpha = (1 - dist/180) * 0.12
          ctx.strokeStyle = '#4ade80'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(a.x*W, a.y*H)
          ctx.lineTo(b.x*W, b.y*H)
          ctx.stroke()
        }
      })
      ctx.globalAlpha = 0.4
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(a.x*W, a.y*H, a.r, 0, Math.PI*2)
      ctx.fill()
    })

    // ── SATELLITES + ORBITS + LASERS ─────────────────────
    satellites.forEach((sat, i) => {
      sat.angle += sat.speed
      const sx = (sat.orbitX + Math.cos(sat.angle) * sat.rx) * W
      const sy = (sat.orbitY + Math.sin(sat.angle) * sat.ry) * H

      // Orbit ellipse
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = '#4ade80'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(sat.orbitX*W, sat.orbitY*H, sat.rx*W, sat.ry*H, 0, 0, Math.PI*2)
      ctx.stroke()

      // Laser scan beam
      if (Math.sin(t * 0.8 + i * 2) > 0.3) {
        const tx = sat.laserTarget.x * W + Math.sin(t*0.5+i)*80
        const ty = sat.laserTarget.y * H
        const grad = ctx.createLinearGradient(sx, sy, tx, ty)
        grad.addColorStop(0, 'rgba(74,222,128,0.8)')
        grad.addColorStop(0.5, 'rgba(74,222,128,0.3)')
        grad.addColorStop(1, 'rgba(74,222,128,0)')
        ctx.globalAlpha = 0.6 + Math.sin(t*3+i)*0.3
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx, ty)
        ctx.stroke()

        // Impact circle
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = '#4ade80'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(tx, ty, 8 + Math.sin(t*4)*3, 0, Math.PI*2)
        ctx.stroke()
      }

      drawSatellite(sx, sy, i === 0 ? '#4ade80' : i === 1 ? '#86efac' : '#fbbf24')
    })

    // ── TARGETING RETICLES ───────────────────────────────
    reticles.forEach(r => {
      r.angle += r.speed
      r.pulse += 0.04
      drawReticle(r.x, r.y, r.size, r.angle, r.pulse, r.color)
    })

    // ── SCAN LINE ────────────────────────────────────────
    scanY = (scanY + 1.2) % H
    const scanGrad = ctx.createLinearGradient(0, scanY-20, 0, scanY+20)
    scanGrad.addColorStop(0, 'rgba(74,222,128,0)')
    scanGrad.addColorStop(0.5, 'rgba(74,222,128,0.15)')
    scanGrad.addColorStop(1, 'rgba(74,222,128,0)')
    ctx.globalAlpha = 1
    ctx.fillStyle = scanGrad
    ctx.fillRect(0, scanY-20, W, 40)

    // ── DEBRIS ───────────────────────────────────────────
    debris.forEach(d => {
      d.x += d.vx; d.y += d.vy; d.angle += d.spin
      if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0
      if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0
      ctx.save()
      ctx.translate(d.x*W, d.y*H)
      ctx.rotate(d.angle)
      ctx.globalAlpha = 0.25
      ctx.strokeStyle = '#365f45'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-d.size, 0); ctx.lineTo(0, -d.size)
      ctx.lineTo(d.size, 0); ctx.lineTo(0, d.size)
      ctx.closePath(); ctx.stroke()
      ctx.restore()
    })

    // ── BINARY DATA STREAMS ──────────────────────────────
    ctx.font = '9px monospace'
    streams.forEach(s => {
      s.y += s.speed
      if (s.y > 1) { s.y = 0; s.x = Math.random() }
      s.chars.forEach((c, i) => {
        ctx.globalAlpha = s.opacity * (1 - i/8)
        ctx.fillStyle = '#4ade80'
        ctx.fillText(c, s.x*W, (s.y + i*0.02)*H)
      })
    })

    // ── HUD CORNERS ──────────────────────────────────────
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 1.5
    const cSize = 28
    ;[[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([cx,cy,dx,dy]) => {
      ctx.beginPath()
      ctx.moveTo(cx + dx*cSize, cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy + dy*cSize)
      ctx.stroke()
    })

    // ── ALERT FLASH ──────────────────────────────────────
    alertTimer++
    if (alertTimer > 300) { alertActive = !alertActive; alertTimer = 0 }
    if (alertActive && Math.sin(t*8) > 0) {
      ctx.globalAlpha = 0.03
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, W-4, H-4)
    }

    // ── TERRAIN SILHOUETTE ───────────────────────────────
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#052e16'
    ctx.beginPath()
    ctx.moveTo(0, H)
    terrain.forEach(t2 => {
      const hh = t2.h + Math.sin(t * t2.speed * 10 + t2.phase) * 0.01
      ctx.lineTo(t2.x * W, H - hh * H)
    })
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fill()

    // Terrain glow line
    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 1
    ctx.beginPath()
    terrain.forEach((t2, i) => {
      const hh = t2.h + Math.sin(t * t2.speed * 10 + t2.phase) * 0.01
      i === 0 ? ctx.moveTo(t2.x*W, H - hh*H) : ctx.lineTo(t2.x*W, H - hh*H)
    })
    ctx.stroke()

    // ── STATUS TEXT ──────────────────────────────────────
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#4ade80'
    ctx.font = '10px monospace'
    ctx.fillText(`SYS:ONLINE · SAT:3/3 · NDVI:ACTIVE · ${new Date().toISOString().slice(11,19)} UTC`, 12, H-10)

    ctx.globalAlpha = 1
    requestAnimationFrame(draw)
  }

  draw()
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
})()
