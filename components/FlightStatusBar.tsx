// components/FlightStatusBar.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FlightStatus } from '@/lib/schedule'
import styles from './FlightStatusBar.module.css'

interface FlightStatusBarProps {
  status: FlightStatus
}

export default function FlightStatusBar({ status }: FlightStatusBarProps) {
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
