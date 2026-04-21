// components/LanguagePicker.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALES, LOCALE_META } from '@/lib/i18n'
import styles from './LanguagePicker.module.css'

interface LanguagePickerProps {
  open: boolean
  onClose: () => void
}

export default function LanguagePicker({ open, onClose }: LanguagePickerProps) {
  const { locale, setLocale } = useTranslation()

  function pick(l: typeof locale) {
    setLocale(l)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="language-picker-overlay"
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Dil Seçin"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.handle} />
            <p className={styles.title}>Dil Seçin · Select Language</p>
            <div className={styles.list}>
              {LOCALES.map(l => {
                const meta = LOCALE_META[l]
                const isActive = l === locale
                return (
                  <button
                    key={l}
                    type="button"
                    className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
                    onClick={() => pick(l)}
                    aria-pressed={isActive}
                  >
                    <span className={styles.flag}>{meta.flag}</span>
                    <div className={styles.names}>
                      <div className={styles.nativeName}>{meta.nativeName}</div>
                      {meta.enName !== meta.nativeName && (
                        <div className={styles.enName}>{meta.enName}</div>
                      )}
                    </div>
                    {isActive && <div className={styles.check}>✓</div>}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
