'use client'
import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/i18n'

export type Messages = Record<string, Record<string, string>>

export interface LanguageContextValue {
  locale: Locale
  messages: Messages
  setLocale: (l: Locale) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  locale: 'tr',
  messages: {},
  setLocale: () => { throw new Error('useTranslation must be used within LanguageProvider') },
})

export function useTranslation() {
  const { locale, messages, setLocale } = useContext(LanguageContext)

  function t(key: string): string {
    const [ns, k] = key.split('.', 2)
    return messages[ns]?.[k] ?? key
  }

  return { locale, t, setLocale }
}
