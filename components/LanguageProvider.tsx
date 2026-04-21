'use client'
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { LanguageContext, type Messages } from '@/hooks/useTranslation'
import { detectLocale, LOCALE_META, LOCALES, type Locale } from '@/lib/i18n'
import tr from '@/locales/tr.json'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import bg from '@/locales/bg.json'
import it from '@/locales/it.json'
import mn from '@/locales/mn.json'

const ALL_MESSAGES: Record<Locale, Messages> = {
  tr: tr as Messages,
  en: en as Messages,
  ru: ru as Messages,
  bg: bg as Messages,
  it: it as Messages,
  mn: mn as Messages,
}

const STORAGE_KEY = 'sapphire_lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setLocaleState(stored as Locale)
    } else {
      setLocaleState(detectLocale(navigator.language))
    }
  }, [])

  // Sync <html lang> with selected locale so CSS text-transform uses the right rules
  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].bcp47
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLocaleState(l)
  }, [])

  const contextValue = useMemo(
    () => ({ locale, messages: ALL_MESSAGES[locale], setLocale }),
    [locale, setLocale],
  )

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}
