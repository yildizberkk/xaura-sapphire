'use client'

import { useState } from 'react'
import quotes from '@/lib/quotes.json'
import styles from './QuoteDisplay.module.css'

export default function QuoteDisplay() {
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)])

  return (
    <div className={styles.wrap}>
      <p className={styles.text}>{'\u201C'}{quote}{'\u201D'}</p>
    </div>
  )
}
