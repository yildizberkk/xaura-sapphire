// components/IntroVideo.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './IntroVideo.module.css'

interface Props {
  onComplete: () => void
}

// If the video doesn't start playing within this many ms, give up and move on.
// Protects against hotel-wifi stalls where the download never completes.
const PLAY_WATCHDOG_MS = 8000

export default function IntroVideo({ onComplete }: Props) {
  const [showSkip, setShowSkip] = useState(false)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 2000)

    // Watchdog: if the video hasn't started playing within 8s, fail forward.
    const watchdog = setTimeout(() => {
      if (!hasStartedRef.current) {
        // Fail loud so we can see this in Vercel logs / browser console if it happens at the event
        console.error('[IntroVideo] Video failed to start within watchdog window — skipping')
        onComplete()
      }
    }, PLAY_WATCHDOG_MS)

    return () => {
      clearTimeout(skipTimer)
      clearTimeout(watchdog)
    }
  }, [onComplete])

  function handleError(e: React.SyntheticEvent<HTMLVideoElement, Event>) {
    const video = e.currentTarget
    // Fail loud — don't silently hide missing/broken video like the prior version did
    console.error('[IntroVideo] Video element error', {
      src: video.currentSrc,
      networkState: video.networkState,
      readyState: video.readyState,
      error: video.error,
    })
    onComplete()
  }

  function handlePlaying() {
    hasStartedRef.current = true
  }

  // Called on video end, error, or skip — parent's AnimatePresence handles the exit animation
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <video
        className={styles.video}
        src="/intro-v2.mp4"
        poster="/intro-frame.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onComplete}
        onError={handleError}
        onPlaying={handlePlaying}
      />

      <AnimatePresence>
        {showSkip && (
          <motion.button
            className={styles.skipBtn}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onComplete}
          >
            Geç
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
