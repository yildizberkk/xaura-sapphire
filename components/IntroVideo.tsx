// components/IntroVideo.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './IntroVideo.module.css'

interface Props {
  onComplete: () => void
}

export default function IntroVideo({ onComplete }: Props) {
  const [showSkip, setShowSkip] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000)
    return () => clearTimeout(t)
  }, [])

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
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        onError={onComplete}
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
