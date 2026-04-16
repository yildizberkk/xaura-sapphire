// components/CountdownDisplay.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import styles from './CountdownDisplay.module.css'

interface CountdownDisplayProps {
  deadline: Date
}

const SHOW_DAYS_BEFORE = new Date('2026-04-24T00:00:00')
const EVENT_DATE = new Date(2026, 3, 24) // April 24 2026

function getParts(deadline: Date, now: Date) {
  const ms      = Math.max(0, deadline.getTime() - now.getTime())
  const days    = Math.floor(ms / 86_400_000)
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000)  / 60_000)
  const seconds = Math.floor((ms % 60_000)      / 1_000)
  return { days, hours, minutes, seconds }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownDisplay({ deadline }: CountdownDisplayProps) {
  const { t, locale } = useTranslation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(id)
  }, [])

  const isPreEvent = now < SHOW_DAYS_BEFORE
  const { days, hours, minutes, seconds } = getParts(deadline, now)
  const label = isPreEvent ? t('countdown.preEvent') : t('countdown.nextFlight')

  const formattedEventDate = EVENT_DATE.toLocaleDateString(
    LOCALE_META[locale].bcp47,
    { day: 'numeric', month: 'long' },
  ) + ' 2026'

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.units}>
        {isPreEvent && (
          <>
            <div className={styles.unit}>
              <span className={`${styles.value} ${styles.gold}`}>{pad(days)}</span>
              <span className={styles.unitLabel}>{t('countdown.days')}</span>
            </div>
            <span className={styles.sep}>:</span>
          </>
        )}
        <div className={styles.unit}>
          <span className={styles.value}>{pad(hours)}</span>
          <span className={styles.unitLabel}>{t('countdown.hours')}</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={styles.value}>{pad(minutes)}</span>
          <span className={styles.unitLabel}>{t('countdown.minutes')}</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={`${styles.value} ${styles.seconds}`}>{pad(seconds)}</span>
          <span className={styles.unitLabel}>{t('countdown.seconds')}</span>
        </div>
      </div>
      {isPreEvent && (
        <p className={styles.subtext}>
          {formattedEventDate} · Kremlin Palace, <span className={styles.gold}>Antalya</span>
        </p>
      )}
    </motion.div>
  )
}
