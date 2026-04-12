// components/IntroVideo.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './IntroVideo.module.css'

interface Props {
  onComplete: () => void
}

export default function IntroVideo({ onComplete }: Props) {
  const [show, setShow]         = useState(true)
  const [showSkip, setShowSkip] = useState(false)
  const videoRef                = useRef<HTMLVideoElement>(null)

  // Reveal skip button after 2 s
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function finish() {
    setShow(false)
  }

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <video
            ref={videoRef}
            className={styles.video}
            src="/intro-v2.mp4"
            autoPlay
            muted
            playsInline
            onEnded={finish}
            onError={finish}
          />

          <AnimatePresence>
            {showSkip && (
              <motion.button
                className={styles.skipBtn}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={finish}
              >
                Geç
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
