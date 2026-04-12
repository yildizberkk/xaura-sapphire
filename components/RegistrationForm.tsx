// components/RegistrationForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { registerUser, type RegistrationInput } from '@/app/actions/register'
import styles from './RegistrationForm.module.css'

interface Props {
  onComplete: (user: { firstName: string; lastName: string }) => void
}

// Persists through the event + 2 days buffer
const EXPIRES_AT = '2026-04-28T00:00:00.000Z'

export default function RegistrationForm({ onComplete }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    phone:     '',
    email:     '',
    consent:   false,
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
      setError('Ad, soyad ve telefon zorunludur.')
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
      }
      await registerUser(input)
      localStorage.setItem('sapphire_user', JSON.stringify({
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
      setError('Bir hata oluştu, lütfen tekrar deneyin.')
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

            <h1 className={styles.greeting}>Hoş Geldiniz</h1>
            <p className={styles.subtitle}>Sapphire Momentum II</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ad"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  autoComplete="given-name"
                  required
                />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Soyad"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>

              <input
                className={styles.input}
                type="tel"
                placeholder="Telefon"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                autoComplete="tel"
                required
              />

              <input
                className={styles.input}
                type="email"
                placeholder="E-posta (isteğe bağlı)"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                autoComplete="email"
              />

              <label className={styles.consentRow}>
                <span className={styles.consentText}>
                  Etkinlik süresince bildirim almak istiyorum
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
                {loading ? 'Kaydediliyor…' : 'Devam Et'}
              </button>
            </form>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
