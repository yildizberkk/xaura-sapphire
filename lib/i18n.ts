// lib/i18n.ts

export type Locale = 'tr' | 'en' | 'ru' | 'bg' | 'it' | 'mn'

export const LOCALES: readonly Locale[] = ['tr', 'en', 'ru', 'bg', 'it', 'mn']

export interface LocaleMeta {
  flag: string
  nativeName: string
  enName: string
  bcp47: string
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  tr: { flag: '🇹🇷', nativeName: 'Türkçe',    enName: 'Turkish',    bcp47: 'tr-TR' },
  en: { flag: '🇬🇧', nativeName: 'English',    enName: 'English',    bcp47: 'en-GB' },
  ru: { flag: '🇷🇺', nativeName: 'Русский',    enName: 'Russian',    bcp47: 'ru-RU' },
  bg: { flag: '🇧🇬', nativeName: 'Български',  enName: 'Bulgarian',  bcp47: 'bg-BG' },
  it: { flag: '🇮🇹', nativeName: 'Italiano',   enName: 'Italian',    bcp47: 'it-IT' },
  mn: { flag: '🇲🇳', nativeName: 'Монгол',     enName: 'Mongolian',  bcp47: 'mn-MN' },
}

/** Match navigator.language (e.g. "ru-RU", "en", "bg") to a supported Locale. Falls back to 'tr'. */
export function detectLocale(lang: string): Locale {
  const prefix = lang.split('-')[0].toLowerCase()
  return (LOCALES as readonly string[]).includes(prefix) ? (prefix as Locale) : 'tr'
}

interface SessionLike {
  title: string
  titleEN?: string
  titleRU?: string
  titleBG?: string
  titleIT?: string
  titleMN?: string
}

interface DayLike {
  day: string
  dayEN: string
  dayRU?: string
  dayBG?: string
  dayIT?: string
  dayMN?: string
}

const LOCALE_TITLE_KEY: Record<Locale, keyof SessionLike> = {
  tr: 'title',
  en: 'titleEN',
  ru: 'titleRU',
  bg: 'titleBG',
  it: 'titleIT',
  mn: 'titleMN',
}

const LOCALE_DAY_KEY: Record<Locale, keyof DayLike> = {
  tr: 'day',
  en: 'dayEN',
  ru: 'dayRU',
  bg: 'dayBG',
  it: 'dayIT',
  mn: 'dayMN',
}

export function getSessionTitle(session: SessionLike, locale: Locale): string {
  return (session[LOCALE_TITLE_KEY[locale]] as string | undefined) ?? session.title
}

export function getDayName(day: DayLike, locale: Locale): string {
  return (day[LOCALE_DAY_KEY[locale]] as string | undefined) ?? day.day
}
