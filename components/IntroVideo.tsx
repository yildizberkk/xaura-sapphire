// components/IntroVideo.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './IntroVideo.module.css'

export default function IntroVideo() {
  // null = not yet hydrated (avoids SSR mismatch)
  const [show, setShow]         = useState<boolean | null>(null)
  const [showSkip, setShowSkip] = useState(false)
  const videoRef                = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setShow(!localStorage.getItem('intro_seen'))
  }, [])

  // Reveal skip button after 2 s
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShowSkip(true), 2000)
    return () => clearTimeout(t)
  }, [show])

  function finish() {
    localStorage.setItem('intro_seen', '1')
    setShow(false)
  }

  // Not yet hydrated — render nothing to avoid layout shift
  if (show === null) return null

  return (
    <AnimatePresence>
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
            src="/intro.mp4"
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
