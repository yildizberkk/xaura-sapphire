// components/SessionRow.tsx
'use client'
import { motion } from 'framer-motion'
import type { ClassifiedSession, SessionType, SessionState } from '@/lib/schedule'
import { useTranslation } from '@/hooks/useTranslation'
import { getSessionTitle } from '@/lib/i18n'
import styles from './SessionRow.module.css'

const TYPE_CLASS: Record<SessionType, string> = {
  keynote:       styles.typeKeynote,
  ceremony:      styles.typeCeremony,
  entertainment: styles.typeEntertainment,
  session:       styles.typeSession,
  general:       styles.typeGeneral,
  meal:          styles.typeMeal,
  break:         styles.typeBreak,
}

const STATE_CLASS: Record<SessionState, string> = {
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
  const { t, locale } = useTranslation()
  const { state, type, start, end, subtitle, progressPct } = session
  const title = getSessionTitle(session, locale)
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
          <span className={styles.badge + ' ' + styles.badgeActive}>{t('timeline.active')}</span>
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
