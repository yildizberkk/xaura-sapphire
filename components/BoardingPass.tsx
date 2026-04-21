// components/BoardingPass.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Day } from '@/lib/schedule'
import type { BoardingSegment } from '@/lib/schedule'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import DayTabs from './DayTabs'
import LanguagePicker from './LanguagePicker'
import styles from './BoardingPass.module.css'

interface BoardingPassProps {
  days: Day[]
  selectedDay: number
  todayIdx: number
  onDayChange: (idx: number) => void
  segment: BoardingSegment
  passenger?: { firstName: string; lastName: string }
}

export default function BoardingPass({
  days, selectedDay, todayIdx, onDayChange, segment, passenger,
}: BoardingPassProps) {
  const { t, locale } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)

  function fmtDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(LOCALE_META[locale].bcp47, { day: 'numeric', month: 'short' })
  }

  const isEnded = segment.type === 'ended'
  const meta = LOCALE_META[locale]

  return (
    <>
      <motion.div
        className={styles.pass}
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.top}>

          {/* Header */}
          <div className={styles.header}>
            <Image
              src="/x2-emblem.png"
              alt="Sapphire Momentum II ×2"
              width={28}
              height={28}
              className={styles.emblemImg}
              sizes="28px"
              priority
            />
            <span className={styles.bpLabel} lang="en">{t('boarding.pass')}</span>
          </div>

          {/* Wordmark SVG — unchanged */}
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
              <div className={styles.iata}>{segment.dep || '–'}</div>
              <div className={styles.cityName}>{segment.depName}</div>
            </div>
            <div className={styles.routeMid}>
              <div className={styles.routeTrack}>
                <div className={styles.routeLineTraveled} style={{ width: `${segment.progressPct * 100}%` }} />
                <div className={styles.routeLineRemaining} style={{ width: `${(1 - segment.progressPct) * 100}%` }} />
                <div
                  className={styles.plane}
                  style={{ left: `${segment.progressPct * 100}%` }}
                >✈</div>
              </div>
              <div className={styles.duration}>{t('boarding.days3')}</div>
            </div>
            <div className={`${styles.city} ${styles.cityRight}`}>
              <div className={styles.iata}>{segment.arr || '–'}</div>
              <div className={styles.cityName}>{segment.arrName}</div>
            </div>
          </div>

          {/* Details grid */}
          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>{t('boarding.passenger')}</span>
              <span className={styles.detailVal}>
                {passenger
                  ? `${passenger.firstName.toUpperCase()} ${passenger.lastName.toUpperCase()}`
                  : '–'}
              </span>
            </div>
            <div className={`${styles.detail} ${styles.colRight}`}>
              <span className={styles.detailLabel}>{t('boarding.gate')}</span>
              <span className={styles.detailVal}>Kremlin Palace</span>
            </div>

            {isEnded ? (
              <div className={`${styles.detail} ${styles.col2} ${styles.endedDetail}`}>
                <span className={styles.endedText}>{t('boarding.ended')}</span>
              </div>
            ) : (
              <>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>{t('boarding.departure')}</span>
                  <span className={styles.detailVal}>{segment.kalkis ?? '--:--'}</span>
                </div>
                <div className={`${styles.detail} ${styles.colRight}`}>
                  <span className={styles.detailLabel}>{t('boarding.arrival')}</span>
                  <span className={styles.detailVal}>{segment.inis ?? '--:--'}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>{t('boarding.date')}</span>
                  <span className={styles.detailVal}>
                    {segment.dateStr ? fmtDate(segment.dateStr) : '–'}
                  </span>
                </div>
                <div className={`${styles.detail} ${styles.colRight}`}>
                  <span className={styles.detailLabel}>{t('boarding.duration')}</span>
                  <span className={styles.detailVal}>{segment.suresi ?? '–'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Perforation */}
        <div className={styles.perf}>
          <div className={styles.perfLine} />
        </div>

        {/* Stub */}
        <div className={styles.stub}>
          <div className={styles.stubRow}>
            <span className={styles.stubLabel}>{t('boarding.daySelect')}</span>
            <button
              type="button"
              className={styles.langChip}
              onClick={() => setPickerOpen(true)}
              aria-label="Select language"
            >
              <span>{meta.flag}</span>
              <span>{locale.toUpperCase()}</span>
              <span className={styles.langChipCaret}>▾</span>
            </button>
          </div>
          <DayTabs
            days={days}
            selectedDay={selectedDay}
            todayIdx={todayIdx}
            onSelect={onDayChange}
          />
        </div>
      </motion.div>

      <LanguagePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
