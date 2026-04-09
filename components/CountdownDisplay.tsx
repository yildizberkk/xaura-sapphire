// components/CountdownDisplay.tsx
'use client'
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
  const { days, hours, minutes } = getParts(msUntilEvent)

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
