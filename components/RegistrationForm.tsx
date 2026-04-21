// components/RegistrationForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { registerUser, type RegistrationInput } from '@/app/actions/register'
import { normalizePhone } from '@/lib/phone'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALES, LOCALE_META } from '@/lib/i18n'
import styles from './RegistrationForm.module.css'

interface Props {
  onComplete: (user: { firstName: string; lastName: string }) => void
}

const EXPIRES_AT = '2026-04-28T00:00:00.000Z'

export default function RegistrationForm({ onComplete }: Props) {
  const { t, locale, setLocale } = useTranslation()
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    phone:     '',
    email:     '',
    consent:   true,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [exiting, setExiting] = useState(false)

  function update(key: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError(t('reg.fieldError'))
      return
    }
    if (!normalizePhone(form.phone.trim())) {
      setError(t('reg.phoneError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const input: RegistrationInput = {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim(),
        email:     form.email.trim() || undefined,
        consent:   form.consent,
        locale,
      }
      await registerUser(input)
      localStorage.setItem('sapphire_user_v5', JSON.stringify({
        firstName:  input.firstName,
        lastName:   input.lastName,
        expiresAt:  EXPIRES_AT,
      }))
      setExiting(true)
    } catch (err) {
      // Fail loud — the underlying error is what diagnosed the missing env vars.
      // Keep the user-facing message generic, but log the real cause so it shows
      // up in Vercel runtime logs and browser DevTools if anything breaks at the event.
      console.error('[RegistrationForm] registerUser failed', err)
      const isDuplicate =
        err instanceof Error &&
        (err.name === 'DuplicatePhoneError' || err.message === 'DUPLICATE_PHONE')
      setError(t(isDuplicate ? 'reg.duplicatePhone' : 'reg.serverError'))
      setLoading(false)
    }
  }

  return (
    <AnimatePresence
      onExitComplete={() =>
        onComplete({ firstName: form.firstName.trim(), lastName: form.lastName.trim() })
      }
    >
      {!exiting && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <div className={styles.inner}>

            <div className={styles.logoWrap}>
              <div className={styles.logoGlow} />
              <Image
                src="/x2-logo.svg"
                alt="X²"
                width={100}
                height={100}
                className={styles.logo}
                priority
              />
            </div>

            {/* Language strip */}
            <div className={styles.langStrip}>
              {LOCALES.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`${styles.langPill} ${l === locale ? styles.langPillActive : ''}`}
                  onClick={() => setLocale(l)}
                  aria-label={LOCALE_META[l].nativeName}
                >
                  {LOCALE_META[l].flag} {l.toUpperCase()}
                </button>
              ))}
            </div>

            <h1 className={styles.greeting}>{t('reg.welcome')}</h1>
            <p className={styles.subtitle} lang="en">Sapphire Momentum II</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder={t('reg.firstName')}
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  autoComplete="given-name"
                  required
                />
                <input
                  className={styles.input}
                  type="text"
                  placeholder={t('reg.lastName')}
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>

              <input
                className={styles.input}
                type="tel"
                placeholder={t('reg.phone')}
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                autoComplete="tel"
                required
              />

              <input
                className={styles.input}
                type="email"
                placeholder={t('reg.email')}
                value={form.email}
                onChange={e => update('email', e.target.value)}
                autoComplete="email"
              />

              <label className={styles.consentRow}>
                <span className={styles.consentText}>
                  {t('reg.consent')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.consent}
                  className={`${styles.toggle} ${form.consent ? styles.toggleOn : ''}`}
                  onClick={() => update('consent', !form.consent)}
                />
              </label>

              <AnimatePresence>
                {error && (
                  <motion.p
                    className={styles.error}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? t('reg.loading') : t('reg.submit')}
              </button>
            </form>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
