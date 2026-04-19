'use client'

export interface EventClockConfig {
  baseVirtual: Date
  baseReal: number
  speed: number
}

export function parseEventClock(): EventClockConfig {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }
  const params = new URLSearchParams(window.location.search)
  const nowParam = params.get('now')
  const speedParam = params.get('speed')

  if (!nowParam) {
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }

  const baseVirtual = new Date(nowParam)
  if (Number.isNaN(baseVirtual.getTime())) {
    console.warn('[event-clock] invalid ?now=, falling back to real time')
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }
  const speed = speedParam ? Number(speedParam) : 0
  return { baseVirtual, baseReal: Date.now(), speed: Number.isFinite(speed) ? speed : 0 }
}

export function currentVirtualTime(cfg: EventClockConfig): Date {
  const elapsed = Date.now() - cfg.baseReal
  return new Date(cfg.baseVirtual.getTime() + elapsed * cfg.speed)
}
