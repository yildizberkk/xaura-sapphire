'use client'

import { useState } from 'react'
import quotes from '@/lib/quotes.json'
import { useTranslation } from '@/hooks/useTranslation'
import type { Locale } from '@/lib/i18n'
import styles from './QuoteDisplay.module.css'

const QUOTES: Record<Locale, string[]> = quotes

export default function QuoteDisplay() {
  const { locale } = useTranslation()
  const [index] = useState(() => Math.floor(Math.random() * QUOTES.tr.length))
  const list: string[] = QUOTES[locale] ?? QUOTES.tr
  const quote: string = list[index] ?? QUOTES.tr[index]

  return (
    <div className={styles.wrap}>
      <p className={styles.text}>{'\u201C'}{quote}{'\u201D'}</p>
    </div>
  )
}
