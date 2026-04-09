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
