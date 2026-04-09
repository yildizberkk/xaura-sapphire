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
    let raf = 0
    let t = 0

    function resize() {
      W = cv.width  = window.innerWidth
      H = cv.height = window.innerHeight
      initStars()
    }

    function initStars() {
      // ~1 star per 3500px² — significantly denser than before (was 9000)
      const n = Math.floor((W * H) / 3500)
      stars = Array.from({ length: n }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.4 + 0.1,
        base:  Math.random() * 0.55 + 0.05,
        amp:   Math.random() * 0.40,
        speed: Math.random() * 0.40 + 0.10,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.011
      for (const s of stars) {
        const a = s.base + s.amp * Math.sin(s.phase + t * s.speed)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244,243,239,${a.toFixed(3)})`
        ctx.fill()
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
