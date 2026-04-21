// components/StarfieldCanvas.tsx
'use client'
import { useEffect, useRef } from 'react'
import styles from './StarfieldCanvas.module.css'

interface Star {
  x: number
  y: number
  r: number
  base: number
  amp: number
  speed: number
  phase: number
  vx: number
  vy: number
}

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  len: number
  life: number
  maxLife: number
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx: CanvasRenderingContext2D = ctxOrNull
    const cv = canvas
    let W = 0, H = 0
    let stars: Star[] = []
    let meteors: Meteor[] = []
    let raf = 0
    let t = 0
    let frame = 0

    function resize() {
      const newW = window.innerWidth
      const newH = window.innerHeight

      // Mobile browsers fire 'resize' during scroll because the URL bar
      // hides/shows, which changes innerHeight but never innerWidth. If we
      // regenerate stars on those events they visibly teleport mid-scroll.
      // Ignore height-only changes; only respond to real width changes
      // (desktop window resize, mobile orientation flip).
      if (stars.length > 0 && newW === W) {
        return
      }

      const oldW = W
      const oldH = H
      W = cv.width  = newW
      H = cv.height = newH

      if (stars.length === 0) {
        // First mount — generate the starfield.
        initStars()
      } else {
        // Orientation change: rescale positions proportionally so existing
        // stars slide to their new spots instead of re-randomizing.
        const sx = newW / oldW
        const sy = newH / oldH
        for (const s of stars) {
          s.x *= sx
          s.y *= sy
        }
      }
    }

    function initStars() {
      // ~1 star per 3500px² — significantly denser than before (was 9000)
      const n = Math.floor((W * H) / 2200)
      stars = Array.from({ length: n }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.4 + 0.1,
        base:  Math.random() * 0.55 + 0.05,
        amp:   Math.random() * 0.40,
        speed: Math.random() * 0.40 + 0.10,
        phase: Math.random() * Math.PI * 2,
        // slow drift — stars float gently upward with slight horizontal wander
        vx:    (Math.random() - 0.5) * 0.28,
        vy:    (Math.random() - 0.5) * 0.28,
      }))
    }

    function spawnMeteor() {
      // Start from random point along top or left edge, travel diagonally
      const fromTop = Math.random() > 0.3
      meteors.push({
        x:       fromTop ? Math.random() * W : -20,
        y:       fromTop ? -20 : Math.random() * H * 0.5,
        vx:      Math.random() * 4 + 3,
        vy:      Math.random() * 1.5 + 0.5,
        len:     Math.random() * 90 + 60,
        life:    0,
        maxLife: Math.random() * 50 + 40,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.011
      frame++

      // Randomly spawn meteors (~1 every 4-8 seconds at 60fps)
      if (Math.random() < 0.004) spawnMeteor()

      // Draw and move stars
      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        // Wrap around edges
        if (s.x < -2) s.x = W + 2
        if (s.x > W + 2) s.x = -2
        if (s.y < -2) s.y = H + 2
        if (s.y > H + 2) s.y = -2

        const a = s.base + s.amp * Math.sin(s.phase + t * s.speed)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244,243,239,${a.toFixed(3)})`
        ctx.fill()
      }

      // Draw meteors
      meteors = meteors.filter(m => m.life < m.maxLife)
      for (const m of meteors) {
        const progress = m.life / m.maxLife
        // Fade in quickly, then fade out
        const a = progress < 0.2
          ? progress / 0.2
          : 1 - (progress - 0.2) / 0.8
        const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len
        const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len
        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
        grad.addColorStop(0, `rgba(244,243,239,0)`)
        grad.addColorStop(0.6, `rgba(244,243,239,${(a * 0.5).toFixed(3)})`)
        grad.addColorStop(1, `rgba(244,243,239,${a.toFixed(3)})`)
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()
        m.x += m.vx
        m.y += m.vy
        m.life++
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    let resizeTimer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 150)
    }
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div className={styles.glowTop} aria-hidden />
      <div className={styles.noise} aria-hidden />
    </>
  )
}
