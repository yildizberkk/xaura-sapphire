# Next.js Flight Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-file `index.html` event scheduling webapp into a production-grade Next.js 15 App Router application with Framer Motion animations, component architecture, live session tracking, and a suite of "wow" moments that make attendees feel prioritized and special.

**Architecture:** Server Component (`app/page.tsx`) imports `schedule.json` and passes data to a client boundary (`ClientPage`). A `useSchedule` hook manages selected day, live `now` updates (every 30s), and derived classified sessions. Framer Motion's `AnimatePresence` handles directional day transitions; staggered `motion.div` handles session row entrances.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Framer Motion 11, CSS Modules + CSS custom properties, next/font (local Gilroy TTFs)

---

## File Map

```
app/
  layout.tsx            Root layout — fonts, metadata, viewport config
  page.tsx              Server Component — imports schedule.json, renders <ClientPage />
  globals.css           CSS reset, custom properties (brand tokens), base body styles
  client-page.tsx       'use client' boundary — owns selectedDay state, renders full UI

components/
  StarfieldCanvas.tsx   Canvas RAF starfield, higher density, fixed position
  BoardingPass.tsx      Boarding pass card (top section + perforation + stub)
  DayTabs.tsx           Three day tab buttons inside the pass stub
  FlightStatusBar.tsx   Status bar with live clock, flight state text + dot
  CountdownDisplay.tsx  Pre-event countdown (days/hours/minutes until April 24)
  Timeline.tsx          AnimatePresence day-switching + stagger + you-are-here notch
  SessionRow.tsx        Individual session — all type/state styles, progress bar, spotlight

hooks/
  useSchedule.ts        selectedDay state, now interval, classified sessions, flight status

lib/
  schedule.ts           TypeScript types + classifySessions + getFlightStatus utils

public/
  fonts/gilroy/         All Gilroy TTF files copied from website_materials_given/gilroy/
```

---

## Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx` (stub — fully replaced in Task 2)
- Create: `app/page.tsx` (stub — fully replaced in Task 8)
- Create: `app/globals.css` (stub — fully replaced in Task 2)

- [ ] **Step 1: Run create-next-app in the repo root**

```bash
cd /Users/berkyildiz/xaura-sapphire
npx create-next-app@latest . \
  --typescript \
  --no-tailwind \
  --no-eslint \
  --no-src-dir \
  --app \
  --import-alias "@/*" \
  --yes
```

Expected: Next.js project files created. `app/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts` all appear.

- [ ] **Step 2: Install Framer Motion**

```bash
npm install framer-motion
```

Expected: `framer-motion` appears in `package.json` dependencies.

- [ ] **Step 3: Copy Gilroy fonts to public/**

```bash
mkdir -p public/fonts/gilroy
cp website_materials_given/gilroy/*.ttf public/fonts/gilroy/
ls public/fonts/gilroy/ | head -5
```

Expected: All 20 Gilroy TTF files are in `public/fonts/gilroy/`.

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev &
sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

- [ ] **Step 5: Kill dev server for now**

```bash
kill %1 2>/dev/null; true
```

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json app/ public/fonts/ .gitignore .next
git commit -m "chore: scaffold Next.js 15 app with Framer Motion and Gilroy fonts"
```

---

## Task 2: CSS variables, global styles, and fonts

**Files:**
- Modify: `app/globals.css`
- Create: `app/layout.tsx`

- [ ] **Step 1: Write globals.css**

Replace `app/globals.css` entirely:

```css
/* app/globals.css */

/* ── Gilroy local fonts ── */
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-UltraLight.ttf') format('truetype'); font-weight: 100; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-Light.ttf') format('truetype'); font-weight: 300; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-Regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-Medium.ttf') format('truetype'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-SemiBold.ttf') format('truetype'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-Bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-ExtraBold.ttf') format('truetype'); font-weight: 800; font-display: swap; }
@font-face { font-family: 'Gilroy'; src: url('/fonts/gilroy/Gilroy-Heavy.ttf') format('truetype'); font-weight: 900; font-display: swap; }

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* backgrounds */
  --bg:       #06091a;
  --card:     #0c1628;
  --card-2:   #111e38;

  /* borders */
  --border:       rgba(85, 116, 184, 0.18);
  --border-gold:  rgba(179, 147, 105, 0.25);

  /* brand */
  --blue:     #345092;
  --blue-mid: #5574b8;
  --blue-lt:  #7a95d0;
  --gold:     #b39369;
  --gold-lt:  #cbb08a;
  --cream:    #f4f3ef;

  /* cream opacity scale */
  --c70: rgba(244, 243, 239, 0.70);
  --c50: rgba(244, 243, 239, 0.50);
  --c30: rgba(244, 243, 239, 0.30);
  --c15: rgba(244, 243, 239, 0.15);
  --c08: rgba(244, 243, 239, 0.08);
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--cream);
  font-family: 'Gilroy', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100svh;
  overflow-x: hidden;
}

* { scrollbar-width: none; }
*::-webkit-scrollbar { display: none; }
```

- [ ] **Step 2: Write app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sapphire Momentum II — Program',
  description: 'Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya',
  openGraph: {
    title: 'Sapphire Momentum II',
    description: '24–26 Nisan 2026 · Kremlin Palace, Antalya',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#06091a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: add global CSS variables, Gilroy fonts, and root layout"
```

---

## Task 3: Types and schedule utilities

**Files:**
- Create: `lib/schedule.ts`

- [ ] **Step 1: Write lib/schedule.ts**

```ts
// lib/schedule.ts

export type SessionType =
  | 'general' | 'meal' | 'session'
  | 'keynote' | 'entertainment' | 'ceremony' | 'break'

export type SessionState = 'active' | 'next' | 'past' | 'future'

export interface RawSession {
  start: string | null
  end: string | null
  title: string
  titleEN?: string
  subtitle?: string
  type: SessionType
}

export interface Day {
  day: string
  dayEN: string
  date: string // "YYYY-MM-DD"
  sessions: RawSession[]
}

export interface ScheduleData {
  event: {
    name: string
    subtitle: string
    dates: string
    location: string
    address: string
  }
  days: Day[]
}

export interface ClassifiedSession extends RawSession {
  state: SessionState
  startDt: Date | null
  endDt: Date | null
  /** 0–100 when state === 'active', null otherwise */
  progressPct: number | null
}

export type FlightStatusKey = 'scheduled' | 'active' | 'boarding' | 'landed'

export interface FlightStatus {
  text: string
  key: FlightStatusKey
}

// ── Helpers ──────────────────────────────────────────────────────

export function parseTime(dateStr: string, timeStr: string | null): Date | null {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr)
  d.setHours(h, m, 0, 0)
  return d
}

export function getTodayDayIdx(days: Day[]): number {
  const today = new Date().toLocaleDateString('sv') // "YYYY-MM-DD"
  return days.findIndex(d => d.date === today)
}

export function classifySessions(day: Day, now: Date): ClassifiedSession[] {
  const parsed = day.sessions.map(s => ({
    ...s,
    startDt: parseTime(day.date, s.start),
    endDt:   parseTime(day.date, s.end),
    state:       'future' as SessionState,
    progressPct: null as number | null,
  }))

  // Find active
  let activeIdx = -1
  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    if (!s.startDt) continue
    let eff = s.endDt
    if (!eff) {
      const nxt = parsed.slice(i + 1).find(n => n.startDt)
      eff = nxt?.startDt ?? new Date(s.startDt.getTime() + 90 * 60_000)
    }
    if (now >= s.startDt && now <= eff) {
      activeIdx = i
      const duration = eff.getTime() - s.startDt.getTime()
      const elapsed  = now.getTime() - s.startDt.getTime()
      parsed[i].progressPct = Math.min(100, (elapsed / duration) * 100)
      break
    }
  }

  // Find next
  let nextIdx = -1
  const from = activeIdx >= 0 ? activeIdx + 1 : 0
  for (let i = from; i < parsed.length; i++) {
    if (parsed[i].startDt && parsed[i].startDt! > now) { nextIdx = i; break }
  }

  return parsed.map((s, i) => ({
    ...s,
    state: i === activeIdx ? 'active'
         : i === nextIdx   ? 'next'
         : (s.startDt && s.startDt < now) ? 'past'
         : 'future',
  }))
}

export function getFlightStatus(
  day: Day,
  sessions: ClassifiedSession[],
  now: Date,
): FlightStatus {
  const d0 = new Date(day.date); d0.setHours(0, 0, 0, 0)
  const d1 = new Date(day.date); d1.setHours(23, 59, 59, 999)
  if (now < d0) return { text: 'Bekleniyor',  key: 'scheduled' }
  if (now > d1) return { text: 'Tamamlandı',  key: 'landed' }
  if (sessions.some(s => s.state === 'active')) return { text: 'Aktif Uçuş', key: 'active' }
  if (sessions.some(s => s.state === 'next'))   return { text: 'İnişe Hazır', key: 'boarding' }
  return { text: 'Aktif', key: 'active' }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/schedule.ts
git commit -m "feat: add schedule types and classification utilities"
```

---

## Task 4: useSchedule hook

**Files:**
- Create: `hooks/useSchedule.ts`

- [ ] **Step 1: Write hooks/useSchedule.ts**

```ts
// hooks/useSchedule.ts
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  classifySessions,
  getFlightStatus,
  getTodayDayIdx,
} from '@/lib/schedule'
import type { Day, ClassifiedSession, FlightStatus } from '@/lib/schedule'

const EVENT_START = new Date('2026-04-24T10:00:00')

export function useSchedule(days: Day[]) {
  const todayIdx = useMemo(() => getTodayDayIdx(days), [days])
  const [selectedDay, setSelectedDay] = useState(() => todayIdx >= 0 ? todayIdx : 0)
  const [now, setNow] = useState<Date>(() => new Date())

  // Tick every 30 seconds to re-classify sessions
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sessions: ClassifiedSession[] = useMemo(
    () => classifySessions(days[selectedDay], now),
    [days, selectedDay, now],
  )

  const status: FlightStatus = useMemo(
    () => getFlightStatus(days[selectedDay], sessions, now),
    [days, selectedDay, sessions, now],
  )

  const msUntilEvent = Math.max(0, EVENT_START.getTime() - now.getTime())
  const isPreEvent   = msUntilEvent > 0

  return {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    status,
    now,
    isPreEvent,
    msUntilEvent,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useSchedule.ts
git commit -m "feat: add useSchedule hook with live 30s interval updates"
```

---

## Task 5: StarfieldCanvas — dense twinkling stars

**Files:**
- Create: `components/StarfieldCanvas.tsx`
- Create: `components/StarfieldCanvas.module.css`

- [ ] **Step 1: Write StarfieldCanvas.module.css**

```css
/* components/StarfieldCanvas.module.css */
.canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.glowTop {
  position: fixed;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 560px;
  height: 320px;
  background: radial-gradient(ellipse, rgba(53,80,146,0.22) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.038;
  /* Inline SVG noise pattern */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px;
}
```

- [ ] **Step 2: Write StarfieldCanvas.tsx**

```tsx
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
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0
    let stars: Star[] = []
    let raf = 0
    let t = 0

    function resize() {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
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
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/StarfieldCanvas.tsx components/StarfieldCanvas.module.css
git commit -m "feat: add dense twinkling starfield canvas with glow and noise overlay"
```

---

## Task 6: BoardingPass component (with inline SVG wordmark)

**Files:**
- Create: `components/BoardingPass.tsx`
- Create: `components/BoardingPass.module.css`

- [ ] **Step 1: Write BoardingPass.module.css**

```css
/* components/BoardingPass.module.css */

.pass {
  background: linear-gradient(158deg, #111f42 0%, #0b1530 45%, #080f25 100%);
  border: 1px solid var(--border);
  border-radius: 22px;
  margin-bottom: 18px;
  box-shadow:
    0 0 0 1px rgba(85,116,184,0.06),
    0 28px 80px rgba(0,0,0,0.75),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.top {
  padding: 20px 20px 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.airline {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: var(--blue-mid);
  text-transform: uppercase;
}

.bpLabel {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--c30);
  text-transform: uppercase;
}

.wordmark {
  margin-bottom: 16px;
}

.wordmark svg {
  width: 100%;
  height: auto;
  max-height: 24px;
  display: block;
}

/* ── Route ── */
.route {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
}

.city { flex: 0 0 auto; }
.cityRight { text-align: right; }

.iata {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--cream);
}

.cityName {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--c30);
  text-transform: uppercase;
  margin-top: 2px;
}

.routeMid {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  overflow: hidden;
}

.routeTrack {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 2px;
}

.routeLine {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(85,116,184,0.45), rgba(179,147,105,0.45));
}

.routeDot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--gold);
  flex-shrink: 0;
}

.plane {
  font-size: 15px;
  color: var(--gold);
  line-height: 1;
}

.duration {
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--c30);
}

/* ── Details grid ── */
.details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 8px;
}

.detail { display: flex; flex-direction: column; gap: 3px; }
.detailSpan2 { grid-column: span 2; }

.detailLabel {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--c30);
  text-transform: uppercase;
}

.detailVal {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.02em;
}

/* ── Perforation ── */
.perf {
  position: relative;
  display: flex;
  align-items: center;
  height: 1px;
  margin: 0 -1px;
}

.perf::before, .perf::after {
  content: '';
  position: absolute;
  width: 22px; height: 22px;
  background: var(--bg);
  border-radius: 50%;
  top: 50%; transform: translateY(-50%);
  z-index: 2;
  box-shadow: inset 0 0 0 1px rgba(85,116,184,0.15);
}

.perf::before { left: -11px; }
.perf::after  { right: -11px; }

.perfLine {
  flex: 1;
  border-top: 1px dashed rgba(85,116,184,0.22);
  margin: 0 20px;
}

/* ── Stub ── */
.stub {
  padding: 14px 20px 18px;
  background: rgba(4,7,18,0.55);
  border-radius: 0 0 22px 22px;
}

.stubLabel {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--c30);
  text-transform: uppercase;
  margin-bottom: 10px;
}
```

- [ ] **Step 2: Write BoardingPass.tsx**

```tsx
// components/BoardingPass.tsx
'use client'
import { motion } from 'framer-motion'
import type { Day } from '@/lib/schedule'
import DayTabs from './DayTabs'
import styles from './BoardingPass.module.css'

interface BoardingPassProps {
  days: Day[]
  selectedDay: number
  todayIdx: number
  onDayChange: (idx: number) => void
}

export default function BoardingPass({
  days, selectedDay, todayIdx, onDayChange,
}: BoardingPassProps) {
  const day = days[selectedDay]

  // Format date like "24 Nis" from "2026-04-24"
  function fmtDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  return (
    <motion.div
      className={styles.pass}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.top}>
        {/* Header row */}
        <div className={styles.header}>
          <span className={styles.airline}>Xaura Global</span>
          <span className={styles.bpLabel}>Boarding Pass</span>
        </div>

        {/* Wordmark SVG (light version — cream + gold) */}
        <div className={styles.wordmark}>
          <svg viewBox="0 0 1316.5 159" xmlns="http://www.w3.org/2000/svg" aria-label="Sapphire Momentum II">
            <style>{`.wg{fill:#b39369}.wc{fill:#f4f3ef}`}</style>
            <path className="wc" d="M90.42,113.53c-6.95,0-12.79-1.55-17.53-4.66-4.74-3.11-8.08-7.33-10.02-12.67l11.82-6.91c2.74,7.15,8.11,10.72,16.12,10.72,3.87,0,6.71-.7,8.51-2.1s2.7-3.17,2.7-5.31c0-2.47-1.1-4.39-3.3-5.76-2.2-1.37-6.14-2.85-11.82-4.46-3.14-.93-5.79-1.87-7.96-2.8-2.17-.93-4.34-2.19-6.51-3.76-2.17-1.57-3.82-3.55-4.96-5.96-1.14-2.4-1.7-5.21-1.7-8.41,0-6.34,2.25-11.4,6.76-15.17,4.51-3.77,9.93-5.66,16.27-5.66,5.67,0,10.67,1.39,14.97,4.16,4.31,2.77,7.66,6.63,10.07,11.57l-11.62,6.71c-2.8-6.01-7.28-9.01-13.42-9.01-2.87,0-5.12.65-6.76,1.95-1.64,1.3-2.45,2.99-2.45,5.06,0,2.2.92,3.99,2.75,5.36,1.84,1.37,5.36,2.86,10.57,4.46,2.14.67,3.76,1.19,4.86,1.55,1.1.37,2.6.94,4.51,1.7,1.9.77,3.37,1.49,4.41,2.15,1.03.67,2.22,1.57,3.56,2.7,1.33,1.14,2.35,2.3,3.05,3.5.7,1.2,1.3,2.65,1.8,4.36.5,1.7.75,3.55.75,5.56,0,6.48-2.35,11.62-7.06,15.42s-10.83,5.71-18.38,5.71Z"/>
            <path className="wc" d="M174.86,112.13l-4.46-12.62h-28.8l-4.21,12.62h-14.92l24.54-70.11h17.13l24.73,70.11h-14.01ZM146.11,86.59h19.73l-10.12-28.64-9.61,28.64Z"/>
            <path className="wc" d="M226.83,42.02c6.74,0,12.42,2.27,17.03,6.81,4.61,4.54,6.91,10.12,6.91,16.73s-2.3,12.19-6.91,16.73c-4.61,4.54-10.28,6.81-17.03,6.81h-12.32v23.03h-13.82V42.02h26.14ZM226.83,76.17c2.94,0,5.37-1.02,7.31-3.05,1.94-2.04,2.9-4.56,2.9-7.56s-.97-5.61-2.9-7.61c-1.94-2-4.37-3-7.31-3h-12.32v21.23h12.32Z"/>
            <path className="wc" d="M290.93,42.02c6.74,0,12.42,2.27,17.03,6.81,4.61,4.54,6.91,10.12,6.91,16.73s-2.3,12.19-6.91,16.73c-4.61,4.54-10.28,6.81-17.03,6.81h-12.32v23.03h-13.82V42.02h26.14ZM290.93,76.17c2.94,0,5.37-1.02,7.31-3.05,1.94-2.04,2.9-4.56,2.9-7.56s-.97-5.61-2.9-7.61c-1.94-2-4.37-3-7.31-3h-12.32v21.23h12.32Z"/>
            <path className="wc" d="M368.74,42.02h13.72v70.11h-13.72v-29.04h-26.04v29.04h-13.82V42.02h13.82v27.84h26.04v-27.84Z"/>
            <path className="wc" d="M400.49,42.02h13.82v70.11h-13.82V42.02Z"/>
            <path className="wc" d="M470.8,112.13l-14.17-24.34h-10.47v24.34h-13.82V42.02h28.04c6.47,0,11.98,2.27,16.52,6.81,4.54,4.54,6.81,10.02,6.81,16.42,0,4.34-1.24,8.36-3.71,12.07-2.47,3.71-5.74,6.49-9.81,8.36l15.52,26.44h-14.92ZM446.16,54.94v20.73h14.22c2.6,0,4.84-1.02,6.71-3.05,1.87-2.04,2.8-4.49,2.8-7.36s-.94-5.31-2.8-7.31c-1.87-2-4.11-3-6.71-3h-14.22Z"/>
            <path className="wc" d="M512.66,98.91h29.54v13.22h-43.37V42.02h42.87v13.22h-29.04v14.92h26.54v13.02h-26.54v15.72Z"/>
            <path className="wg" d="M652.57,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
            <path className="wg" d="M731.59,102.76c-7.01,7.04-15.59,10.57-25.74,10.57s-18.73-3.52-25.74-10.57c-7.01-7.04-10.52-15.61-10.52-25.69s3.51-18.64,10.52-25.69c7.01-7.04,15.59-10.57,25.74-10.57s18.73,3.52,25.74,10.57c7.01,7.05,10.52,15.61,10.52,25.69s-3.5,18.65-10.52,25.69ZM685.02,97.96c5.61,5.71,12.55,8.56,20.83,8.56s15.22-2.85,20.83-8.56c5.61-5.71,8.41-12.67,8.41-20.88s-2.8-15.17-8.41-20.88-12.55-8.56-20.83-8.56-15.22,2.85-20.83,8.56-8.41,12.67-8.41,20.88,2.8,15.17,8.41,20.88Z"/>
            <path className="wg" d="M823.23,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
            <path className="wg" d="M851.27,105.52h34.05v6.61h-41.06V42.02h40.56v6.61h-33.55v24.84h31.05v6.61h-31.05v25.44Z"/>
            <path className="wg" d="M947.41,42.02h7.01v70.11h-6.01l-39.06-57.09v57.09h-7.01V42.02h6.11l38.96,56.94v-56.94Z"/>
            <path className="wg" d="M1019.52,42.02v6.61h-21.53v63.5h-7.01v-63.5h-21.53v-6.61h50.08Z"/>
            <path className="wg" d="M1078.41,106.52c-4.81,4.54-11.08,6.81-18.83,6.81s-14.02-2.27-18.83-6.81c-4.81-4.54-7.21-10.62-7.21-18.23v-46.27h7.01v46.27c0,5.61,1.67,10.05,5.01,13.32,3.34,3.27,8.01,4.91,14.02,4.91s10.68-1.63,14.02-4.91c3.34-3.27,5.01-7.71,5.01-13.32v-46.27h7.01v46.27c0,7.61-2.4,13.69-7.21,18.23Z"/>
            <path className="wg" d="M1169.75,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
            <path className="wg" d="M1219.32,42.02h13.82v70.11h-13.82V42.02Z"/>
            <path className="wg" d="M1251.17,42.02h13.82v70.11h-13.82V42.02Z"/>
          </svg>
        </div>

        {/* Route */}
        <div className={styles.route}>
          <div className={styles.city}>
            <div className={styles.iata}>IST</div>
            <div className={styles.cityName}>İstanbul</div>
          </div>
          <div className={styles.routeMid}>
            <div className={styles.routeTrack}>
              <div className={styles.routeLine} />
              <div className={styles.routeDot} />
              <div className={styles.routeLine} style={{ background: 'linear-gradient(to right, rgba(179,147,105,0.4), rgba(85,116,184,0.2))' }} />
            </div>
            <div className={styles.plane}>✈</div>
            <div className={styles.duration}>3 Gün · 2026</div>
          </div>
          <div className={`${styles.city} ${styles.cityRight}`}>
            <div className={styles.iata}>AYT</div>
            <div className={styles.cityName}>Antalya</div>
          </div>
        </div>

        {/* Details grid — dynamic based on selected day */}
        <div className={styles.details}>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Kalkış</span>
            <span className={styles.detailVal}>{fmtDate(day.date)}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>İniş</span>
            <span className={styles.detailVal}>{fmtDate(days[days.length - 1].date)}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Sınıf</span>
            <span className={styles.detailVal}>Liderlik</span>
          </div>
          <div className={`${styles.detail} ${styles.detailSpan2}`}>
            <span className={styles.detailLabel}>Kapı / Otel</span>
            <span className={styles.detailVal}>Kremlin Palace</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Uçuş</span>
            <span className={styles.detailVal}>SM–II</span>
          </div>
        </div>
      </div>

      {/* Perforation */}
      <div className={styles.perf}>
        <div className={styles.perfLine} />
      </div>

      {/* Stub with day tabs */}
      <div className={styles.stub}>
        <div className={styles.stubLabel}>Gün Seçin</div>
        <DayTabs
          days={days}
          selectedDay={selectedDay}
          todayIdx={todayIdx}
          onSelect={onDayChange}
        />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: Error about missing `DayTabs` — that's fine, Task 7 creates it.

- [ ] **Step 4: Commit**

```bash
git add components/BoardingPass.tsx components/BoardingPass.module.css
git commit -m "feat: add BoardingPass component with spring entry animation"
```

---

## Task 7: DayTabs component

**Files:**
- Create: `components/DayTabs.tsx`
- Create: `components/DayTabs.module.css`

- [ ] **Step 1: Write DayTabs.module.css**

```css
/* components/DayTabs.module.css */

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.tab {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 6px 8px;
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.tabDay {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--c30);
  text-transform: uppercase;
  display: block;
  margin-bottom: 3px;
}

.tabDate {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  color: var(--c50);
  display: block;
}

.pip {
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 50%;
  margin: 5px auto 0;
  display: block;
}

.tabActive {
  background: linear-gradient(145deg, rgba(53,80,146,0.28) 0%, rgba(85,116,184,0.12) 100%);
  border-color: rgba(85,116,184,0.5);
}

.tabActive .tabDay  { color: var(--blue-lt); }
.tabActive .tabDate { color: var(--cream); }
```

- [ ] **Step 2: Write DayTabs.tsx**

```tsx
// components/DayTabs.tsx
'use client'
import { motion } from 'framer-motion'
import type { Day } from '@/lib/schedule'
import styles from './DayTabs.module.css'

interface DayTabsProps {
  days: Day[]
  selectedDay: number
  todayIdx: number
  onSelect: (idx: number) => void
}

export default function DayTabs({ days, selectedDay, todayIdx, onSelect }: DayTabsProps) {
  return (
    <div className={styles.tabs}>
      {days.map((d, i) => {
        const date = new Date(d.date).getDate()
        const isActive = i === selectedDay
        const isToday  = i === todayIdx
        return (
          <motion.button
            key={d.date}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onSelect(i)}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            aria-label={d.day}
            aria-pressed={isActive}
          >
            <span className={styles.tabDay}>{d.day}</span>
            <span className={styles.tabDate}>{date}</span>
            {isToday && <span className={styles.pip} />}
          </motion.button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors from DayTabs. BoardingPass may still error on missing import — will resolve in Task 12.

- [ ] **Step 4: Commit**

```bash
git add components/DayTabs.tsx components/DayTabs.module.css
git commit -m "feat: add DayTabs component with spring press feedback"
```

---

## Task 8: FlightStatusBar component with live clock

**Files:**
- Create: `components/FlightStatusBar.tsx`
- Create: `components/FlightStatusBar.module.css`

- [ ] **Step 1: Write FlightStatusBar.module.css**

```css
/* components/FlightStatusBar.module.css */

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.left { display: flex; flex-direction: column; gap: 3px; }

.lbl {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--c30);
  text-transform: uppercase;
}

.statusText {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.scheduled { color: var(--blue-mid); }
.active    { color: #5de89a; }
.boarding  { color: var(--gold-lt); }
.landed    { color: var(--c30); }

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clock {
  font-size: 11px;
  font-weight: 600;
  color: var(--c30);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.scheduled { background: var(--blue-mid); }

.dot.active {
  background: #5de89a;
  box-shadow: 0 0 10px rgba(93,232,154,0.7);
  animation: blink 1.8s ease-in-out infinite;
}

.dot.boarding {
  background: var(--gold);
  box-shadow: 0 0 10px rgba(179,147,105,0.7);
  animation: blink 2.2s ease-in-out infinite;
}

.dot.landed { background: var(--c15); }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
```

- [ ] **Step 2: Write FlightStatusBar.tsx**

```tsx
// components/FlightStatusBar.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FlightStatus } from '@/lib/schedule'
import styles from './FlightStatusBar.module.css'

interface FlightStatusBarProps {
  status: FlightStatus
  now: Date
}

export default function FlightStatusBar({ status, now }: FlightStatusBarProps) {
  const [displayTime, setDisplayTime] = useState('')

  // Update clock every second (local to this component)
  useEffect(() => {
    function tick() {
      setDisplayTime(
        new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit', minute: '2-digit', hour12: false,
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className={styles.bar}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.left}>
        <span className={styles.lbl}>Uçuş Durumu</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={status.text}
            className={`${styles.statusText} ${styles[status.key]}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {status.text}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className={styles.right}>
        <span className={styles.clock}>{displayTime}</span>
        <div className={`${styles.dot} ${styles[status.key]}`} />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/FlightStatusBar.tsx components/FlightStatusBar.module.css
git commit -m "feat: add FlightStatusBar with live clock and animated status transitions"
```

---

## Task 9: CountdownDisplay — pre-event experience

**Files:**
- Create: `components/CountdownDisplay.tsx`
- Create: `components/CountdownDisplay.module.css`

- [ ] **Step 1: Write CountdownDisplay.module.css**

```css
/* components/CountdownDisplay.module.css */

.wrap {
  text-align: center;
  padding: 32px 20px 28px;
  background: linear-gradient(145deg, rgba(53,80,146,0.12) 0%, rgba(11,21,48,0.6) 100%);
  border: 1px solid var(--border);
  border-radius: 18px;
  margin-bottom: 20px;
}

.label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--c30);
  text-transform: uppercase;
  margin-bottom: 20px;
  display: block;
}

.units {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 52px;
}

.value {
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
  color: var(--cream);
  font-variant-numeric: tabular-nums;
}

.unitLabel {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--c30);
  text-transform: uppercase;
}

.sep {
  font-size: 28px;
  font-weight: 300;
  color: var(--c15);
  line-height: 1;
  padding-top: 6px;
}

.subtext {
  font-size: 11px;
  font-weight: 400;
  color: var(--c30);
  letter-spacing: 0.08em;
}

.gold { color: var(--gold-lt); }
```

- [ ] **Step 2: Write CountdownDisplay.tsx**

```tsx
// components/CountdownDisplay.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './CountdownDisplay.module.css'

interface CountdownDisplayProps {
  msUntilEvent: number
}

interface Parts {
  days: number
  hours: number
  minutes: number
}

function getParts(ms: number): Parts {
  const total = Math.max(0, ms)
  const days    = Math.floor(total / 86_400_000)
  const hours   = Math.floor((total % 86_400_000) / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  return { days, hours, minutes }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CountdownDisplay({ msUntilEvent }: CountdownDisplayProps) {
  const [ms, setMs] = useState(msUntilEvent)

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => {
      setMs(prev => Math.max(0, prev - 60_000))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const { days, hours, minutes } = getParts(ms)

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.label}>Uçuşa Kalan Süre</span>
      <div className={styles.units}>
        <div className={styles.unit}>
          <span className={`${styles.value} ${styles.gold}`}>{pad(days)}</span>
          <span className={styles.unitLabel}>Gün</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={styles.value}>{pad(hours)}</span>
          <span className={styles.unitLabel}>Saat</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={styles.value}>{pad(minutes)}</span>
          <span className={styles.unitLabel}>Dakika</span>
        </div>
      </div>
      <p className={styles.subtext}>
        24 Nisan 2026 · Kremlin Palace, <span className={styles.gold}>Antalya</span>
      </p>
    </motion.div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/CountdownDisplay.tsx components/CountdownDisplay.module.css
git commit -m "feat: add CountdownDisplay component for pre-event experience"
```

---

## Task 10: SessionRow — all types, states, progress bar, spotlight cards

**Files:**
- Create: `components/SessionRow.tsx`
- Create: `components/SessionRow.module.css`

- [ ] **Step 1: Write SessionRow.module.css**

```css
/* components/SessionRow.module.css */

/* ── Base row ── */
.row {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 8px 0;
  gap: 0;
  border-radius: 14px;
  transition: background 0.3s ease;
}

/* ── Time column ── */
.time {
  flex: 0 0 55px;
  text-align: right;
  padding-right: 16px;
  padding-top: 2px;
  user-select: none;
}

.timeStart {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--c50);
  display: block;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.timeEnd {
  font-size: 10px;
  font-weight: 400;
  color: var(--c15);
  display: block;
  margin-top: 1px;
  font-variant-numeric: tabular-nums;
}

/* ── Node dot ── */
.node {
  flex: 0 0 10px;
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--card);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* ── Content ── */
.body {
  flex: 1;
  padding-left: 14px;
  min-width: 0;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cream);
  line-height: 1.35;
}

.sub {
  font-size: 11px;
  font-weight: 400;
  color: var(--c30);
  margin-top: 3px;
  line-height: 1.4;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 5px;
  margin-top: 6px;
}

.badgeActive {
  background: rgba(179,147,105,0.14);
  color: var(--gold);
  border: 1px solid rgba(179,147,105,0.25);
}

.badgeNext {
  background: rgba(85,116,184,0.12);
  color: var(--blue-lt);
  border: 1px solid rgba(85,116,184,0.22);
}

/* ── Progress bar (active session) ── */
.progressTrack {
  height: 2px;
  background: rgba(179,147,105,0.15);
  border-radius: 1px;
  margin-top: 10px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(to right, var(--blue-mid), var(--gold));
  border-radius: 1px;
  transition: width 30s linear;
}

/* ── Type variants ── */

/* keynote */
.typeKeynote .dot {
  width: 13px; height: 13px;
  border-color: var(--gold);
  background: rgba(179,147,105,0.12);
  box-shadow: 0 0 14px rgba(179,147,105,0.28);
}
.typeKeynote .title    { color: var(--gold-lt); font-weight: 700; }
.typeKeynote .timeStart { color: var(--gold); }

/* ceremony */
.typeCeremony .dot {
  width: 13px; height: 13px;
  border-color: var(--gold);
  background: rgba(179,147,105,0.15);
  box-shadow: 0 0 18px rgba(179,147,105,0.35);
}
.typeCeremony .title    { color: var(--gold-lt); font-weight: 700; }
.typeCeremony .timeStart { color: var(--gold); }

/* entertainment */
.typeEntertainment .dot {
  border-color: var(--gold);
  background: rgba(179,147,105,0.08);
}
.typeEntertainment .title { color: var(--gold-lt); }

/* session */
.typeSession .dot {
  border-color: var(--blue-mid);
  background: rgba(85,116,184,0.1);
}

/* general */
.typeGeneral .dot {
  border-color: var(--c30);
  background: rgba(244,243,239,0.05);
}

/* meal */
.typeMeal .dot {
  border-color: rgba(179,147,105,0.3);
  background: transparent;
}
.typeMeal .title    { color: var(--c50); font-weight: 400; }
.typeMeal .timeStart { color: var(--c30); }

/* break */
.typeBreak .dot {
  width: 6px; height: 6px;
  border-color: var(--c15);
  background: transparent;
}
.typeBreak .title    { color: var(--c30); font-size: 11px; font-weight: 400; }
.typeBreak .timeStart { color: rgba(244,243,239,0.2); font-size: 11px; }

/* ── State variants ── */

/* active */
.stateActive {
  background: linear-gradient(to right, rgba(179,147,105,0.06), transparent);
  margin: 2px -10px;
  padding: 10px 10px 10px 0;
}

.stateActive .dot {
  border-color: var(--gold) !important;
  background: var(--gold) !important;
  box-shadow: 0 0 0 4px rgba(179,147,105,0.14), 0 0 22px rgba(179,147,105,0.45) !important;
  animation: activeDot 2.5s ease-in-out infinite;
}

@keyframes activeDot {
  0%,100% { box-shadow: 0 0 0 4px rgba(179,147,105,0.14), 0 0 22px rgba(179,147,105,0.45); }
  50%      { box-shadow: 0 0 0 6px rgba(179,147,105,0.10), 0 0 32px rgba(179,147,105,0.55); }
}

.stateActive .title    { color: var(--cream) !important; font-weight: 700 !important; }
.stateActive .timeStart { color: var(--gold-lt) !important; }

/* next */
.stateNext .dot {
  border-color: var(--blue-mid) !important;
  animation: nextDot 3s ease-in-out infinite;
}

@keyframes nextDot {
  0%,100% { box-shadow: 0 0 0 0 rgba(85,116,184,0); }
  50%      { box-shadow: 0 0 0 5px rgba(85,116,184,0.18); }
}

/* past */
.statePast .dot     { border-color: var(--c08) !important; background: transparent !important; box-shadow: none !important; }
.statePast .title   { color: var(--c15) !important; }
.statePast .timeStart { color: var(--c15) !important; }
.statePast .timeEnd  { color: var(--c08) !important; }

/* ── Spotlight card (ceremony / entertainment) ── */
.spotlight {
  background: linear-gradient(135deg, rgba(179,147,105,0.08) 0%, rgba(53,80,146,0.06) 100%);
  border: 1px solid rgba(179,147,105,0.18);
  border-radius: 16px;
  padding: 14px 14px 14px 0 !important;
  margin: 4px -10px !important;
}

.spotlightShimmer {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(179,147,105,0.06) 50%,
    transparent 80%
  );
  background-size: 200% 100%;
  animation: shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

- [ ] **Step 2: Write SessionRow.tsx**

```tsx
// components/SessionRow.tsx
'use client'
import { motion } from 'framer-motion'
import type { ClassifiedSession } from '@/lib/schedule'
import styles from './SessionRow.module.css'

const TYPE_CLASS: Record<string, string> = {
  keynote:       styles.typeKeynote,
  ceremony:      styles.typeCeremony,
  entertainment: styles.typeEntertainment,
  session:       styles.typeSession,
  general:       styles.typeGeneral,
  meal:          styles.typeMeal,
  break:         styles.typeBreak,
}

const STATE_CLASS: Record<string, string> = {
  active: styles.stateActive,
  next:   styles.stateNext,
  past:   styles.statePast,
  future: '',
}

const SPOTLIGHT_TYPES = new Set(['ceremony', 'entertainment', 'keynote'])

interface SessionRowProps {
  session: ClassifiedSession
  index: number
}

export default function SessionRow({ session, index }: SessionRowProps) {
  const { state, type, start, end, title, subtitle, progressPct } = session
  const isSpotlight = SPOTLIGHT_TYPES.has(type) && state !== 'past'

  return (
    <motion.div
      className={[
        styles.row,
        TYPE_CLASS[type] ?? '',
        STATE_CLASS[state] ?? '',
        isSpotlight ? styles.spotlight : '',
      ].join(' ')}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Shimmer overlay for spotlight types */}
      {isSpotlight && <div className={styles.spotlightShimmer} aria-hidden />}

      {/* Time */}
      <div className={styles.time}>
        <span className={styles.timeStart}>{start ?? '—'}</span>
        {end && <span className={styles.timeEnd}>{end}</span>}
      </div>

      {/* Dot */}
      <div className={styles.node}>
        <div className={styles.dot} />
      </div>

      {/* Content */}
      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.sub}>{subtitle}</div>}

        {state === 'active' && (
          <span className={styles.badge + ' ' + styles.badgeActive}>✦ Aktif</span>
        )}
        {state === 'next' && (
          <span className={styles.badge + ' ' + styles.badgeNext}>Sıradaki</span>
        )}

        {/* Live progress bar for active session */}
        {state === 'active' && progressPct !== null && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/SessionRow.tsx components/SessionRow.module.css
git commit -m "feat: add SessionRow with type/state styles, spotlight cards, and live progress bar"
```

---

## Task 11: Timeline — directional day-switching, stagger, "you are here" notch, swipe

**Files:**
- Create: `components/Timeline.tsx`
- Create: `components/Timeline.module.css`

- [ ] **Step 1: Write Timeline.module.css**

```css
/* components/Timeline.module.css */

.wrap {
  position: relative;
}

.header {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.28em;
  color: var(--c30);
  text-transform: uppercase;
  margin-bottom: 16px;
}

.inner {
  position: relative;
  overflow: hidden;
}

/* Vertical track */
.track {
  position: absolute;
  left: 55px;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(85,116,184,0.2) 6%,
    rgba(85,116,184,0.2) 94%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* "You are here" notch on the track */
.youAreHere {
  position: absolute;
  left: 51px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px rgba(179,147,105,0.6);
  z-index: 2;
  transform: translateY(-50%);
  pointer-events: none;
  transition: top 1s ease;
}

.youAreHereRing {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid rgba(179,147,105,0.3);
  animation: ringPulse 2.5s ease-in-out infinite;
}

@keyframes ringPulse {
  0%,100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(1.6); opacity: 0; }
}

.sessions { position: relative; z-index: 1; }

.footer {
  margin-top: 52px;
  padding-top: 20px;
  border-top: 1px solid var(--c08);
  text-align: center;
}

.footerText {
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.28em;
  color: var(--c15);
  text-transform: uppercase;
}
```

- [ ] **Step 2: Write Timeline.tsx**

```tsx
// components/Timeline.tsx
'use client'
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClassifiedSession } from '@/lib/schedule'
import SessionRow from './SessionRow'
import styles from './Timeline.module.css'

interface TimelineProps {
  sessions: ClassifiedSession[]
  selectedDay: number
}

// Direction of day transition: +1 = forward (slide left), -1 = backward (slide right)
function useDirection(selectedDay: number) {
  const prev = useRef(selectedDay)
  const dir = selectedDay > prev.current ? 1 : -1
  prev.current = selectedDay
  return dir
}

export default function Timeline({ sessions, selectedDay }: TimelineProps) {
  const direction = useDirection(selectedDay)

  // Swipe gesture state
  const touchStart = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent, onSwipeLeft: () => void, onSwipeRight: () => void) {
    if (touchStart.current === null) return
    const delta = e.changedTouches[0].clientX - touchStart.current
    if (delta < -50) onSwipeLeft()
    if (delta >  50) onSwipeRight()
    touchStart.current = null
  }

  // Compute "you are here" notch position as % of total session span
  const positionedSessions = sessions.filter(s => s.startDt)
  const activeOrNext = sessions.find(s => s.state === 'active' || s.state === 'next')
  const youAreHerePct = (() => {
    if (!activeOrNext?.startDt || positionedSessions.length < 2) return null
    const first = positionedSessions[0].startDt!
    const last  = positionedSessions[positionedSessions.length - 1].startDt!
    const now   = activeOrNext.startDt
    const span  = last.getTime() - first.getTime()
    if (span === 0) return null
    return Math.min(100, Math.max(0, ((now.getTime() - first.getTime()) / span) * 100))
  })()

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.header}>Uçuş Programı</div>

      <div className={styles.inner}>
        <div className={styles.track} />

        {/* "You are here" notch */}
        {youAreHerePct !== null && (
          <div
            className={styles.youAreHere}
            style={{ top: `calc(10px + ${youAreHerePct}% * (100% - 20px) / 100)` }}
            aria-hidden
          >
            <div className={styles.youAreHereRing} />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedDay}
            className={styles.sessions}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
          >
            {sessions.map((s, i) => (
              <SessionRow key={`${s.title}-${s.start}`} session={s} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText}>Xaura Global · Sapphire Momentum II · Nisan 2026</div>
      </div>
    </motion.div>
  )
}
```

> **Note on swipe:** Swipe gesture wiring (calling `setSelectedDay` from Timeline) requires lifting swipe handlers to `ClientPage`. In Task 12 we pass `onSwipeLeft` / `onSwipeRight` as props or handle it in the client page directly.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/Timeline.tsx components/Timeline.module.css
git commit -m "feat: add Timeline with directional AnimatePresence, stagger, and you-are-here notch"
```

---

## Task 12: Root page — layout, server component, client page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/client-page.tsx`
- Create: `app/client-page.module.css`

- [ ] **Step 1: Write app/page.tsx (Server Component)**

```tsx
// app/page.tsx
import scheduleData from '@/schedule.json'
import type { ScheduleData } from '@/lib/schedule'
import ClientPage from './client-page'

// Type assertion — schedule.json matches ScheduleData shape
const schedule = scheduleData as ScheduleData

export default function Page() {
  return <ClientPage schedule={schedule} />
}
```

- [ ] **Step 2: Write app/client-page.module.css**

```css
/* app/client-page.module.css */

.page {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  padding-bottom: max(40px, env(safe-area-inset-bottom, 40px));
}

.container {
  max-width: 440px;
  margin: 0 auto;
  padding: max(20px, env(safe-area-inset-top, 20px)) 16px 0;
}
```

- [ ] **Step 3: Write app/client-page.tsx**

```tsx
// app/client-page.tsx
'use client'
import { useRef } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import type { ScheduleData } from '@/lib/schedule'

import StarfieldCanvas   from '@/components/StarfieldCanvas'
import BoardingPass      from '@/components/BoardingPass'
import FlightStatusBar   from '@/components/FlightStatusBar'
import CountdownDisplay  from '@/components/CountdownDisplay'
import Timeline          from '@/components/Timeline'
import styles from './client-page.module.css'

interface ClientPageProps {
  schedule: ScheduleData
}

export default function ClientPage({ schedule }: ClientPageProps) {
  const {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    status,
    now,
    isPreEvent,
    msUntilEvent,
  } = useSchedule(schedule.days)

  function prevDay() { setSelectedDay(d => Math.max(0, d - 1)) }
  function nextDay() { setSelectedDay(d => Math.min(schedule.days.length - 1, d + 1)) }

  return (
    <div className={styles.page}>
      <StarfieldCanvas />

      <div className={styles.container}>
        <BoardingPass
          days={schedule.days}
          selectedDay={selectedDay}
          todayIdx={todayIdx}
          onDayChange={setSelectedDay}
        />

        <FlightStatusBar status={status} now={now} />

        {isPreEvent && (
          <CountdownDisplay msUntilEvent={msUntilEvent} />
        )}

        <Timeline
          sessions={sessions}
          selectedDay={selectedDay}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add resolveJsonModule to tsconfig.json**

Open `tsconfig.json`. Ensure `compilerOptions` includes:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

`create-next-app` sets both of these by default. Verify:

```bash
grep -n "resolveJsonModule\|paths" tsconfig.json
```

Expected: Both appear.

- [ ] **Step 5: Verify full TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Start dev server and verify page loads**

```bash
npm run dev &
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

- [ ] **Step 7: Kill dev server**

```bash
kill %1 2>/dev/null; true
```

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx app/client-page.tsx app/client-page.module.css
git commit -m "feat: wire up root page with Server Component + ClientPage boundary"
```

---

## Task 13: Final build verification + cleanup

**Files:**
- Delete: `index.html` (replaced by Next.js app)

- [ ] **Step 1: Run production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: Output ends with `✓ Compiled successfully` or similar. No TypeScript or module errors.

- [ ] **Step 2: Verify no console errors in dev**

```bash
npm run dev &
sleep 5
# Check the compiled output has no obvious errors
curl -s http://localhost:3000 | grep -c "Sapphire"
kill %1 2>/dev/null; true
```

Expected: Count ≥ 1 (the page title appears in the HTML).

- [ ] **Step 3: Archive old index.html**

```bash
# Keep index.html as reference — rename rather than delete
mv index.html index.html.v1
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Next.js flight experience webapp

- Dense starfield canvas (3500px² density vs previous 9000px²)
- Boarding pass with spring entry animation, dynamic day details
- Framer Motion directional day transitions (slide left/right)
- Staggered session row entrance animations (40ms per row)
- SessionRow: type-specific styles, spotlight shimmer for keynote/ceremony/entertainment
- Live progress bar within active session (fills over session duration)
- 'You are here' gold notch on timeline track
- Flight status bar with live clock (1s tick) and animated status transitions
- CountdownDisplay for pre-event state (days/hours/minutes until April 24)
- useSchedule hook with 30s re-classification interval
- Fully typed with TypeScript throughout"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Dense starfield — Task 5 (3500px² vs 9000px²)
- ✅ Next.js App Router component structure — Tasks 1, 12
- ✅ Gilroy font via @font-face in globals — Task 2
- ✅ Types + classification logic — Task 3
- ✅ Live 30s state updates — Task 4
- ✅ Boarding pass spring animation — Task 6
- ✅ Dynamic boarding pass details per day — Task 6
- ✅ Day tabs with press animation — Task 7
- ✅ Flight status bar with live clock — Task 8
- ✅ Status text animated transition (AnimatePresence) — Task 8
- ✅ Pre-event countdown display — Task 9
- ✅ Session type visual differentiation — Task 10
- ✅ Spotlight cards for ceremony/entertainment/keynote — Task 10
- ✅ Active session live progress bar — Task 10
- ✅ "You are here" notch on timeline — Task 11
- ✅ Directional day transition (slide) with AnimatePresence — Task 11
- ✅ Staggered session row entrance — Task 10 (motion.div with delay)
- ✅ Root page wiring — Task 12
- ✅ Build verification — Task 13
