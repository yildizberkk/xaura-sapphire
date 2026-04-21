# i18n Multilingual Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full TR/EN/RU/BG/IT/MN multilingual support to the Sapphire Momentum II event PWA with auto locale detection, localStorage persistence, and zero new npm dependencies.

**Architecture:** Custom lightweight i18n React context (`LanguageProvider` + `useTranslation` hook) with 6 statically-bundled locale JSON files. Language is auto-detected from `navigator.language` and stored in `localStorage('sapphire_lang')`. Two UI entry points: a flag-pill strip on the registration form and a flag chip in the boarding pass stub that opens a bottom sheet. All session titles translated directly in `schedule.json` following the existing `titleEN` pattern.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion (already installed), CSS Modules.

**Spec:** `docs/superpowers/specs/2026-04-16-i18n-multilingual-design.md`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `locales/tr.json` | Turkish UI strings (source of truth) |
| Create | `locales/en.json` | English UI strings |
| Create | `locales/ru.json` | Russian UI strings |
| Create | `locales/bg.json` | Bulgarian UI strings |
| Create | `locales/it.json` | Italian UI strings |
| Create | `locales/mn.json` | Mongolian (Cyrillic) UI strings |
| Create | `lib/i18n.ts` | Locale type, LOCALE_META, detectLocale, getSessionTitle, getDayName |
| Create | `hooks/useTranslation.ts` | LanguageContext + useTranslation hook |
| Create | `components/LanguageProvider.tsx` | Context provider, localStorage, auto-detect |
| Create | `components/LanguagePicker.tsx` | Bottom sheet UI for language selection |
| Create | `components/LanguagePicker.module.css` | Bottom sheet styles |
| Modify | `schedule.json` | Add titleRU/BG/IT/MN, complete titleEN, add dayRU/BG/IT/MN |
| Modify | `lib/schedule.ts` | Update RawSession/Day types; fmtDuration accepts locale units |
| Modify | `hooks/useSchedule.ts` | Pass locale duration units into getCurrentSegment |
| Modify | `app/client-page.tsx` | Split into LanguageProvider wrapper + ClientPageInner; Clock uses locale |
| Modify | `components/RegistrationForm.tsx` | Add flag strip; replace hardcoded strings with t() |
| Modify | `components/RegistrationForm.module.css` | Add .langStrip, .langPill, .langPillActive |
| Modify | `components/BoardingPass.tsx` | Add flag chip to stub; replace labels with t(); locale-aware fmtDate |
| Modify | `components/BoardingPass.module.css` | Add .langChip, .stubRow |
| Modify | `components/CountdownDisplay.tsx` | Replace all strings with t(); locale-aware event date |
| Modify | `components/Timeline.tsx` | Replace "Uçuş Programı" with t() |
| Modify | `components/SessionRow.tsx` | Replace "✦ Aktif" with t(); use getSessionTitle |
| Modify | `components/DayTabs.tsx` | Use getDayName for tab labels |

---

## Task 1: Create locale JSON files

**Files:**
- Create: `locales/tr.json`
- Create: `locales/en.json`
- Create: `locales/ru.json`
- Create: `locales/bg.json`
- Create: `locales/it.json`
- Create: `locales/mn.json`

- [ ] **Step 1: Create `locales/tr.json`**

```json
{
  "reg": {
    "welcome": "Hoş Geldiniz",
    "firstName": "Ad",
    "lastName": "Soyad",
    "phone": "Telefon",
    "email": "E-posta (isteğe bağlı)",
    "consent": "Etkinlik süresince bildirim almak istiyorum",
    "submit": "Devam Et",
    "loading": "Kaydediliyor…",
    "fieldError": "Ad, soyad ve telefon zorunludur.",
    "serverError": "Bir hata oluştu, lütfen tekrar deneyin."
  },
  "boarding": {
    "pass": "Boarding Pass",
    "passenger": "Yolcu",
    "gate": "Kapı / Otel",
    "departure": "Kalkış",
    "arrival": "İniş",
    "date": "Tarih",
    "duration": "Uçuş Süresi",
    "days3": "3 Gün · 2026",
    "daySelect": "Gün Seçin",
    "ended": "Uçuşunuz sona erdi — liderlik yolunda önümüzdeki yolculuklarda görüşmek üzere.",
    "h": "sa",
    "m": "dak"
  },
  "timeline": {
    "header": "Uçuş Programı",
    "active": "✦ Aktif"
  },
  "countdown": {
    "preEvent": "Uçuşa Kalan Süre",
    "nextFlight": "Sonraki Kalkışa Kalan",
    "days": "Gün",
    "hours": "Saat",
    "minutes": "Dakika",
    "seconds": "Saniye"
  },
  "schedule": {
    "scheduled": "Bekleniyor",
    "activeFlight": "Aktif Uçuş",
    "boarding": "İnişe Hazır",
    "landed": "Tamamlandı",
    "active": "Aktif"
  }
}
```

- [ ] **Step 2: Create `locales/en.json`**

```json
{
  "reg": {
    "welcome": "Welcome",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phone": "Phone",
    "email": "Email (optional)",
    "consent": "I want to receive notifications during the event",
    "submit": "Continue",
    "loading": "Saving…",
    "fieldError": "First name, last name and phone are required.",
    "serverError": "An error occurred, please try again."
  },
  "boarding": {
    "pass": "Boarding Pass",
    "passenger": "Passenger",
    "gate": "Gate / Hotel",
    "departure": "Departure",
    "arrival": "Arrival",
    "date": "Date",
    "duration": "Flight Duration",
    "days3": "3 Days · 2026",
    "daySelect": "Select Day",
    "ended": "Your flight has ended — see you on future journeys on the path of leadership.",
    "h": "h",
    "m": "min"
  },
  "timeline": {
    "header": "Flight Schedule",
    "active": "✦ Active"
  },
  "countdown": {
    "preEvent": "Time Until Flight",
    "nextFlight": "Until Next Departure",
    "days": "Days",
    "hours": "Hours",
    "minutes": "Minutes",
    "seconds": "Seconds"
  },
  "schedule": {
    "scheduled": "Scheduled",
    "activeFlight": "Active Flight",
    "boarding": "Boarding",
    "landed": "Completed",
    "active": "Active"
  }
}
```

- [ ] **Step 3: Create `locales/ru.json`**

```json
{
  "reg": {
    "welcome": "Добро пожаловать",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "phone": "Телефон",
    "email": "Эл. почта (необязательно)",
    "consent": "Я хочу получать уведомления во время мероприятия",
    "submit": "Продолжить",
    "loading": "Сохранение…",
    "fieldError": "Имя, фамилия и телефон обязательны.",
    "serverError": "Произошла ошибка, пожалуйста, попробуйте снова."
  },
  "boarding": {
    "pass": "Посадочный талон",
    "passenger": "Пассажир",
    "gate": "Выход / Отель",
    "departure": "Отправление",
    "arrival": "Прибытие",
    "date": "Дата",
    "duration": "Длительность рейса",
    "days3": "3 Дня · 2026",
    "daySelect": "Выберите день",
    "ended": "Ваш рейс завершён — увидимся в следующих путешествиях на пути лидерства.",
    "h": "ч",
    "m": "мин"
  },
  "timeline": {
    "header": "Расписание рейса",
    "active": "✦ Активно"
  },
  "countdown": {
    "preEvent": "До начала рейса",
    "nextFlight": "До следующего вылета",
    "days": "Дни",
    "hours": "Часы",
    "minutes": "Минуты",
    "seconds": "Секунды"
  },
  "schedule": {
    "scheduled": "Запланировано",
    "activeFlight": "Активный рейс",
    "boarding": "Посадка",
    "landed": "Завершено",
    "active": "Активно"
  }
}
```

- [ ] **Step 4: Create `locales/bg.json`**

```json
{
  "reg": {
    "welcome": "Добре дошли",
    "firstName": "Собствено име",
    "lastName": "Фамилия",
    "phone": "Телефон",
    "email": "Имейл (по желание)",
    "consent": "Искам да получавам известия по време на събитието",
    "submit": "Продължи",
    "loading": "Запазване…",
    "fieldError": "Собственото име, фамилията и телефонът са задължителни.",
    "serverError": "Възникна грешка, моля опитайте отново."
  },
  "boarding": {
    "pass": "Бордна карта",
    "passenger": "Пътник",
    "gate": "Изход / Хотел",
    "departure": "Заминаване",
    "arrival": "Пристигане",
    "date": "Дата",
    "duration": "Продължителност на полета",
    "days3": "3 Дни · 2026",
    "daySelect": "Изберете ден",
    "ended": "Вашият полет приключи — ще се видим в бъдещи пътувания по пътя на лидерството.",
    "h": "ч",
    "m": "мин"
  },
  "timeline": {
    "header": "Разписание на полета",
    "active": "✦ Активно"
  },
  "countdown": {
    "preEvent": "Време до полета",
    "nextFlight": "До следващото излитане",
    "days": "Дни",
    "hours": "Часове",
    "minutes": "Минути",
    "seconds": "Секунди"
  },
  "schedule": {
    "scheduled": "Планиран",
    "activeFlight": "Активен полет",
    "boarding": "Качване",
    "landed": "Завършен",
    "active": "Активен"
  }
}
```

- [ ] **Step 5: Create `locales/it.json`**

```json
{
  "reg": {
    "welcome": "Benvenuti",
    "firstName": "Nome",
    "lastName": "Cognome",
    "phone": "Telefono",
    "email": "Email (opzionale)",
    "consent": "Voglio ricevere notifiche durante l'evento",
    "submit": "Continua",
    "loading": "Salvataggio…",
    "fieldError": "Nome, cognome e telefono sono obbligatori.",
    "serverError": "Si è verificato un errore, riprova."
  },
  "boarding": {
    "pass": "Carta d'imbarco",
    "passenger": "Passeggero",
    "gate": "Gate / Hotel",
    "departure": "Partenza",
    "arrival": "Arrivo",
    "date": "Data",
    "duration": "Durata del volo",
    "days3": "3 Giorni · 2026",
    "daySelect": "Seleziona giorno",
    "ended": "Il tuo volo è terminato — ci vediamo nei prossimi viaggi sul percorso della leadership.",
    "h": "h",
    "m": "min"
  },
  "timeline": {
    "header": "Programma del volo",
    "active": "✦ Attivo"
  },
  "countdown": {
    "preEvent": "Tempo al volo",
    "nextFlight": "Al prossimo decollo",
    "days": "Giorni",
    "hours": "Ore",
    "minutes": "Minuti",
    "seconds": "Secondi"
  },
  "schedule": {
    "scheduled": "Programmato",
    "activeFlight": "Volo attivo",
    "boarding": "Imbarco",
    "landed": "Completato",
    "active": "Attivo"
  }
}
```

- [ ] **Step 6: Create `locales/mn.json`**

```json
{
  "reg": {
    "welcome": "Тавтай морилно уу",
    "firstName": "Нэр",
    "lastName": "Овог",
    "phone": "Утас",
    "email": "И-мэйл (заавал биш)",
    "consent": "Арга хэмжээний туршид мэдэгдэл авахыг хүсч байна",
    "submit": "Үргэлжлүүлэх",
    "loading": "Хадгалж байна…",
    "fieldError": "Нэр, овог болон утасны дугаар заавал шаардлагатай.",
    "serverError": "Алдаа гарлаа, дахин оролдоно уу."
  },
  "boarding": {
    "pass": "Суудлын тасалбар",
    "passenger": "Зорчигч",
    "gate": "Гарц / Зочид буудал",
    "departure": "Хөдлөх",
    "arrival": "Ирэлт",
    "date": "Огноо",
    "duration": "Нислэгийн үргэлжлэх хугацаа",
    "days3": "3 Өдөр · 2026",
    "daySelect": "Өдрөө сонгоно уу",
    "ended": "Таны нислэг дууслаа — манлайллын замд дараагийн аялалуудад уулзацгаая.",
    "h": "ц",
    "m": "мин"
  },
  "timeline": {
    "header": "Нислэгийн хуваарь",
    "active": "✦ Идэвхтэй"
  },
  "countdown": {
    "preEvent": "Нислэг хүртэл",
    "nextFlight": "Дараагийн хөдлөлт хүртэл",
    "days": "Өдөр",
    "hours": "Цаг",
    "minutes": "Минут",
    "seconds": "Секунд"
  },
  "schedule": {
    "scheduled": "Төлөвлөсөн",
    "activeFlight": "Идэвхтэй нислэг",
    "boarding": "Суудлын бэлтгэл",
    "landed": "Дууссан",
    "active": "Идэвхтэй"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add locales/
git commit -m "feat: add locale JSON files for TR/EN/RU/BG/IT/MN"
```

---

## Task 2: Create `lib/i18n.ts`

**Files:**
- Create: `lib/i18n.ts`

- [ ] **Step 1: Create `lib/i18n.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`

Expected: no errors about `lib/i18n.ts`. (There will be other errors in later tasks as we update types — that's fine for now.)

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add i18n types, locale meta, and schedule helpers"
```

---

## Task 3: Create `hooks/useTranslation.ts` and `components/LanguageProvider.tsx`

**Files:**
- Create: `hooks/useTranslation.ts`
- Create: `components/LanguageProvider.tsx`

- [ ] **Step 1: Create `hooks/useTranslation.ts`**

```typescript
// hooks/useTranslation.ts
'use client'
import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/i18n'

type Messages = Record<string, Record<string, string>>

export interface LanguageContextValue {
  locale: Locale
  messages: Messages
  setLocale: (l: Locale) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  locale: 'tr',
  messages: {},
  setLocale: () => {},
})

export function useTranslation() {
  const { locale, messages, setLocale } = useContext(LanguageContext)

  function t(key: string): string {
    const [ns, k] = key.split('.', 2)
    return messages[ns]?.[k] ?? key
  }

  return { locale, t, setLocale }
}
```

- [ ] **Step 2: Create `components/LanguageProvider.tsx`**

```typescript
// components/LanguageProvider.tsx
'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { LanguageContext } from '@/hooks/useTranslation'
import { detectLocale, LOCALES, type Locale } from '@/lib/i18n'
import tr from '@/locales/tr.json'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import bg from '@/locales/bg.json'
import it from '@/locales/it.json'
import mn from '@/locales/mn.json'

type Messages = Record<string, Record<string, string>>

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

  function setLocale(l: Locale) {
    localStorage.setItem(STORAGE_KEY, l)
    setLocaleState(l)
  }

  return (
    <LanguageContext.Provider value={{ locale, messages: ALL_MESSAGES[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useTranslation.ts components/LanguageProvider.tsx
git commit -m "feat: add LanguageProvider context and useTranslation hook"
```

---

## Task 4: Create `LanguagePicker` bottom sheet

**Files:**
- Create: `components/LanguagePicker.tsx`
- Create: `components/LanguagePicker.module.css`

- [ ] **Step 1: Create `components/LanguagePicker.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  z-index: 300;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #0f0f1e;
  border-radius: 20px 20px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-bottom: env(safe-area-inset-bottom, 0);
  max-height: 80vh;
  overflow-y: auto;
}

.handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 10px auto 6px;
}

.title {
  text-align: center;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.35);
  padding: 0 1rem 0.875rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0 0.875rem 1.25rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
}

.rowActive {
  background: rgba(179, 147, 105, 0.15);
  border-color: rgba(179, 147, 105, 0.4);
}

.flag {
  font-size: 1.375rem;
  line-height: 1;
}

.names {
  flex: 1;
}

.nativeName {
  font-size: 0.8rem;
  color: #f4f3ef;
  font-weight: 500;
}

.enName {
  font-size: 0.63rem;
  color: rgba(255, 255, 255, 0.38);
}

.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #b39369;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: #08080f;
  flex-shrink: 0;
  font-weight: 700;
}
```

- [ ] **Step 2: Create `components/LanguagePicker.tsx`**

```typescript
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
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.sheet}
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
                  <div
                    key={l}
                    className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
                    onClick={() => pick(l)}
                  >
                    <span className={styles.flag}>{meta.flag}</span>
                    <div className={styles.names}>
                      <div className={styles.nativeName}>{meta.nativeName}</div>
                      {meta.enName !== meta.nativeName && (
                        <div className={styles.enName}>{meta.enName}</div>
                      )}
                    </div>
                    {isActive && <div className={styles.check}>✓</div>}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/LanguagePicker.tsx components/LanguagePicker.module.css
git commit -m "feat: add LanguagePicker bottom sheet component"
```

---

## Task 5: Extend `schedule.json` with all translations

**Files:**
- Modify: `schedule.json`

- [ ] **Step 1: Replace `schedule.json` with the fully-translated version**

Replace the entire contents of `schedule.json` with:

```json
{
  "event": {
    "name": "Sapphire Momentum II",
    "subtitle": "2nd Anniversary Edition",
    "dates": "24-26 Nisan",
    "location": "Kremlin Palace, Antalya",
    "address": "Kundu Mah. Yaşar Sobutay Bulv. Kremlin Otel Sit. No:98/10 No: A201 Aksu / Antalya"
  },
  "days": [
    {
      "day": "Cuma", "dayEN": "Friday", "dayRU": "Пятница", "dayBG": "Петък", "dayIT": "Venerdì", "dayMN": "Баасан",
      "date": "2026-04-24",
      "sessions": [
        {
          "start": "10:00", "end": "12:30", "type": "general",
          "title": "Giriş", "titleEN": "Entry", "titleRU": "Вход", "titleBG": "Вход", "titleIT": "Ingresso", "titleMN": "Оролт"
        },
        {
          "start": "12:30", "end": "14:30", "type": "meal",
          "title": "Öğle Yemeği", "titleEN": "Lunch", "titleRU": "Обед", "titleBG": "Обяд", "titleIT": "Pranzo", "titleMN": "Өдрийн хоол"
        },
        {
          "start": "16:15", "end": "17:30", "type": "session",
          "title": "Ruby Okulu", "titleEN": "Ruby School", "titleRU": "Школа Ruby", "titleBG": "Школа Ruby", "titleIT": "Scuola Ruby", "titleMN": "Ruby Сургууль"
        },
        {
          "start": "17:30", "end": "20:30", "type": "meal",
          "title": "Serbest Zaman ve Akşam Yemeği", "titleEN": "Free Time & Dinner", "titleRU": "Свободное время и ужин", "titleBG": "Свободно време и вечеря", "titleIT": "Tempo libero e cena", "titleMN": "Чөлөөт цаг ба оройн хоол"
        },
        {
          "start": "20:30", "end": null, "type": "general",
          "title": "Kapı Açılış", "titleEN": "Door Opening", "titleRU": "Открытие дверей", "titleBG": "Отваряне на вратите", "titleIT": "Apertura porte", "titleMN": "Хаалга нээлт"
        },
        {
          "start": "20:45", "end": null, "type": "keynote",
          "title": "2. Yıl Dönümü Açılış Konuşması", "titleEN": "2nd Anniversary Opening Speech", "titleRU": "Вступительная речь 2-й годовщины", "titleBG": "Встъпително слово на 2-годишнината", "titleIT": "Discorso di apertura del 2° anniversario", "titleMN": "2 дахь ойн нээлтийн үг"
        },
        {
          "start": "21:15", "end": null, "type": "entertainment",
          "title": "Konser", "titleEN": "Concert", "titleRU": "Концерт", "titleBG": "Концерт", "titleIT": "Concerto", "titleMN": "Тоглолт"
        }
      ]
    },
    {
      "day": "Cumartesi", "dayEN": "Saturday", "dayRU": "Суббота", "dayBG": "Събота", "dayIT": "Sabato", "dayMN": "Бямба",
      "date": "2026-04-25",
      "sessions": [
        {
          "start": "07:00", "end": "09:30", "type": "meal",
          "title": "Kahvaltı", "titleEN": "Breakfast", "titleRU": "Завтрак", "titleBG": "Закуска", "titleIT": "Colazione", "titleMN": "Өглийн цай"
        },
        {
          "start": "09:30", "end": "10:15", "type": "session",
          "title": "Eğitim - 1", "titleEN": "Training - 1", "titleRU": "Обучение - 1", "titleBG": "Обучение - 1", "titleIT": "Formazione - 1", "titleMN": "Сургалт - 1"
        },
        {
          "start": "10:15", "end": "10:30", "type": "break",
          "title": "Ara", "titleEN": "Break", "titleRU": "Перерыв", "titleBG": "Почивка", "titleIT": "Pausa", "titleMN": "Завсарлага"
        },
        {
          "start": "10:30", "end": "11:15", "type": "session",
          "title": "Eğitim - 2", "titleEN": "Training - 2", "titleRU": "Обучение - 2", "titleBG": "Обучение - 2", "titleIT": "Formazione - 2", "titleMN": "Сургалт - 2"
        },
        {
          "start": "11:15", "end": "11:30", "type": "break",
          "title": "Ara", "titleEN": "Break", "titleRU": "Перерыв", "titleBG": "Почивка", "titleIT": "Pausa", "titleMN": "Завсарлага"
        },
        {
          "start": "11:30", "end": "12:30", "type": "session",
          "title": "Eğitim - 3", "titleEN": "Training - 3", "titleRU": "Обучение - 3", "titleBG": "Обучение - 3", "titleIT": "Formazione - 3", "titleMN": "Сургалт - 3"
        },
        {
          "start": "12:30", "end": "13:45", "type": "meal",
          "title": "Öğle Yemeği", "titleEN": "Lunch", "titleRU": "Обед", "titleBG": "Обяд", "titleIT": "Pranzo", "titleMN": "Өдрийн хоол"
        },
        {
          "start": "13:45", "end": "15:15", "type": "session",
          "title": "Eğitim - 4", "titleEN": "Training - 4", "titleRU": "Обучение - 4", "titleBG": "Обучение - 4", "titleIT": "Formazione - 4", "titleMN": "Сургалт - 4"
        },
        {
          "start": "15:15", "end": "15:30", "type": "break",
          "title": "Ara", "titleEN": "Break", "titleRU": "Перерыв", "titleBG": "Почивка", "titleIT": "Pausa", "titleMN": "Завсарлага"
        },
        {
          "start": "15:30", "end": "16:30", "type": "session",
          "title": "Sistem Kurmak: Sen Olmadan Çalışan Organizasyon",
          "titleEN": "Building Systems: Organization That Works Without You",
          "titleRU": "Построение систем: организация, работающая без вас",
          "titleBG": "Изграждане на системи: организация, работеща без вас",
          "titleIT": "Costruire sistemi: organizzazione che funziona senza di te",
          "titleMN": "Системийг бүтээх: Чамгүйгээр ажилладаг байгууллага"
        },
        {
          "start": "16:30", "end": "18:00", "type": "break",
          "title": "Ara", "titleEN": "Break", "titleRU": "Перерыв", "titleBG": "Почивка", "titleIT": "Pausa", "titleMN": "Завсарлага"
        },
        {
          "start": "18:00", "end": null, "type": "session",
          "title": "Vizyon Liderliği", "titleEN": "Vision Leadership", "titleRU": "Лидерство с видением", "titleBG": "Лидерство с визия", "titleIT": "Leadership Visionaria", "titleMN": "Алсын харааны манлайлал"
        },
        {
          "start": null, "end": null, "type": "meal",
          "title": "Akşam Yemeği", "titleEN": "Dinner", "titleRU": "Ужин", "titleBG": "Вечеря", "titleIT": "Cena", "titleMN": "Оройн хоол"
        },
        {
          "start": "21:00", "end": null, "type": "ceremony",
          "title": "Takdir Töreni", "titleEN": "Awards Ceremony", "titleRU": "Торжественная церемония", "titleBG": "Церемония по награждаване", "titleIT": "Cerimonia dei premi", "titleMN": "Шагналын ёслол",
          "subtitle": "SP Kutlaması Son ve Yenisi"
        }
      ]
    },
    {
      "day": "Pazar", "dayEN": "Sunday", "dayRU": "Воскресенье", "dayBG": "Неделя", "dayIT": "Domenica", "dayMN": "Ням",
      "date": "2026-04-26",
      "sessions": [
        {
          "start": "07:00", "end": "09:30", "type": "meal",
          "title": "Kahvaltı", "titleEN": "Breakfast", "titleRU": "Завтрак", "titleBG": "Закуска", "titleIT": "Colazione", "titleMN": "Өглийн цай"
        },
        {
          "start": "09:45", "end": "10:30", "type": "session",
          "title": "Eğitim - 1", "titleEN": "Training - 1", "titleRU": "Обучение - 1", "titleBG": "Обучение - 1", "titleIT": "Formazione - 1", "titleMN": "Сургалт - 1"
        },
        {
          "start": "10:30", "end": "10:45", "type": "break",
          "title": "Ara", "titleEN": "Break", "titleRU": "Перерыв", "titleBG": "Почивка", "titleIT": "Pausa", "titleMN": "Завсарлага"
        },
        {
          "start": "10:45", "end": "12:00", "type": "session",
          "title": "Eğitim - 2", "titleEN": "Training - 2", "titleRU": "Обучение - 2", "titleBG": "Обучение - 2", "titleIT": "Formazione - 2", "titleMN": "Сургалт - 2"
        },
        {
          "start": "12:00", "end": "13:00", "type": "break",
          "title": "Oda Boşaltma ve Coffee Break", "titleEN": "Room Checkout & Coffee Break", "titleRU": "Выезд из номера и кофе-пауза", "titleBG": "Освобождаване на стаята и кафе пауза", "titleIT": "Check-out e pausa caffè", "titleMN": "Өрөө чөлөөлөх ба кофены завсарлага"
        },
        {
          "start": "13:15", "end": "15:00", "type": "keynote",
          "title": "Kapanış Konuşması", "titleEN": "Closing Speech", "titleRU": "Заключительная речь", "titleBG": "Заключителна реч", "titleIT": "Discorso di chiusura", "titleMN": "Хаалтын үг"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add schedule.json
git commit -m "feat: add multilingual translations to all schedule sessions and day names"
```

---

## Task 6: Update `lib/schedule.ts` — types and `fmtDuration`

**Files:**
- Modify: `lib/schedule.ts`

- [ ] **Step 1: Update `RawSession` and `Day` interfaces to include new locale fields**

In `lib/schedule.ts`, replace:

```typescript
export interface RawSession {
  start: string | null
  end: string | null
  title: string
  titleEN?: string
  subtitle?: string
  type: SessionType
}

export interface Day {
  day: string
  dayEN: string
  date: string // "YYYY-MM-DD"
  sessions: RawSession[]
}
```

With:

```typescript
export interface RawSession {
  start: string | null
  end: string | null
  title: string
  titleEN?: string
  titleRU?: string
  titleBG?: string
  titleIT?: string
  titleMN?: string
  subtitle?: string
  type: SessionType
}

export interface Day {
  day: string
  dayEN: string
  dayRU?: string
  dayBG?: string
  dayIT?: string
  dayMN?: string
  date: string // "YYYY-MM-DD"
  sessions: RawSession[]
}
```

- [ ] **Step 2: Update `fmtDuration` to accept locale unit strings**

In `lib/schedule.ts`, replace:

```typescript
function fmtDuration(ms: number): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}dak`
  if (m === 0) return `${h}sa`
  return `${h}sa ${m}dak`
}
```

With:

```typescript
function fmtDuration(ms: number, units = { h: 'sa', m: 'dak' }): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}${units.m}`
  if (m === 0) return `${h}${units.h}`
  return `${h}${units.h} ${m}${units.m}`
}
```

- [ ] **Step 3: Thread `durationUnits` through `getCurrentSegment`**

Replace the `getCurrentSegment` signature:

```typescript
export function getCurrentSegment(days: Day[], now: Date): BoardingSegment {
```

With:

```typescript
export function getCurrentSegment(
  days: Day[],
  now: Date,
  durationUnits = { h: 'sa', m: 'dak' },
): BoardingSegment {
```

Then update every call to `fmtDuration` inside `getCurrentSegment` to pass `durationUnits` as the second argument. There are two calls — find them both by searching for `fmtDuration(` in the function body and change:

```typescript
fmtDuration(curr.effectiveEndDt.getTime() - curr.startDt.getTime())
```
to:
```typescript
fmtDuration(curr.effectiveEndDt.getTime() - curr.startDt.getTime(), durationUnits)
```

And:
```typescript
fmtDuration(nextSess.startDt!.getTime() - prevSess.effectiveEndDt.getTime())
```
to:
```typescript
fmtDuration(nextSess.startDt!.getTime() - prevSess.effectiveEndDt.getTime(), durationUnits)
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | grep -E "error|Error" | head -20`

Expected: no errors in `lib/schedule.ts`. (Errors in other files that haven't been updated yet are expected.)

- [ ] **Step 5: Commit**

```bash
git add lib/schedule.ts
git commit -m "feat: add multilingual type fields to RawSession/Day; fmtDuration accepts locale units"
```

---

## Task 7: Update `hooks/useSchedule.ts`

**Files:**
- Modify: `hooks/useSchedule.ts`

- [ ] **Step 1: Replace `hooks/useSchedule.ts` entirely**

```typescript
// hooks/useSchedule.ts
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  classifySessions,
  getCurrentSegment,
  getNextSessionDeadline,
  getTodayDayIdx,
} from '@/lib/schedule'
import type { Day, ClassifiedSession, BoardingSegment } from '@/lib/schedule'
import { useTranslation } from '@/hooks/useTranslation'

export function useSchedule(days: Day[]) {
  const { t } = useTranslation()
  const todayIdx = useMemo(() => getTodayDayIdx(days), [days])
  const [selectedDay, setSelectedDay] = useState(() => todayIdx >= 0 ? todayIdx : 0)
  const [now, setNow] = useState<Date>(() => new Date())

  // Tick every 30 seconds — enough for session boundary detection
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sessions: ClassifiedSession[] = useMemo(
    () => classifySessions(days[selectedDay], now),
    [days, selectedDay, now],
  )

  const currentSegment: BoardingSegment = useMemo(
    () => getCurrentSegment(days, now, { h: t('boarding.h'), m: t('boarding.m') }),
    [days, now, t],
  )

  const nextSessionDeadline: Date | null = useMemo(
    () => getNextSessionDeadline(days, now),
    [days, now],
  )

  return {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    now,
    currentSegment,
    nextSessionDeadline,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useSchedule.ts
git commit -m "feat: thread locale duration units through useSchedule into getCurrentSegment"
```

---

## Task 8: Wire `LanguageProvider` and fix `Clock` in `app/client-page.tsx`

**Files:**
- Modify: `app/client-page.tsx`

- [ ] **Step 1: Replace `app/client-page.tsx` entirely**

```typescript
// app/client-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSchedule } from '@/hooks/useSchedule'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import type { ScheduleData } from '@/lib/schedule'

import { LanguageProvider } from '@/components/LanguageProvider'
import StarfieldCanvas   from '@/components/StarfieldCanvas'
import IntroVideo        from '@/components/IntroVideo'
import RegistrationForm  from '@/components/RegistrationForm'
import BoardingPass      from '@/components/BoardingPass'
import CountdownDisplay  from '@/components/CountdownDisplay'
import Timeline          from '@/components/Timeline'
import styles from './client-page.module.css'

type Phase = 'loading' | 'intro' | 'register' | 'app'

interface StoredUser {
  firstName: string
  lastName:  string
  expiresAt: string
}

interface ClientPageProps {
  schedule: ScheduleData
}

function Clock() {
  const { locale } = useTranslation()
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const bcp47 = LOCALE_META[locale].bcp47
      setTime(new Date().toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [locale])
  return <p className={styles.clock}>{time}</p>
}

function ClientPageInner({ schedule }: ClientPageProps) {
  const [phase,  setPhase] = useState<Phase>('loading')
  const [user,   setUser]  = useState<StoredUser | null>(null)

  const {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    currentSegment,
    nextSessionDeadline,
  } = useSchedule(schedule.days)

  useEffect(() => {
    const raw = localStorage.getItem('sapphire_user')
    if (raw) {
      try {
        const saved: StoredUser = JSON.parse(raw)
        if (new Date(saved.expiresAt) > new Date()) {
          setUser(saved)
          setPhase('app')
          return
        }
      } catch {}
      localStorage.removeItem('sapphire_user')
    }
    setPhase('intro')
  }, [])

  function handleIntroComplete() {
    setPhase('register')
  }

  function handleRegistrationComplete(newUser: { firstName: string; lastName: string }) {
    const full = { ...newUser, expiresAt: '2026-04-28T00:00:00.000Z' }
    setUser(full)
    setPhase('app')
  }

  function prevDay() { setSelectedDay(d => Math.max(0, d - 1)) }
  function nextDay() { setSelectedDay(d => Math.min(schedule.days.length - 1, d + 1)) }

  return (
    <div className={styles.page}>
      <StarfieldCanvas />
      {phase === 'loading' && <div className={styles.loadingScreen} />}

      <AnimatePresence>
        {phase === 'intro' && (
          <IntroVideo key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'register' && (
          <RegistrationForm key="register" onComplete={handleRegistrationComplete} />
        )}
      </AnimatePresence>

      {phase === 'app' && (
        <div className={styles.container}>
          <BoardingPass
            days={schedule.days}
            selectedDay={selectedDay}
            todayIdx={todayIdx}
            onDayChange={setSelectedDay}
            segment={currentSegment}
            passenger={user ?? undefined}
          />

          {nextSessionDeadline && (
            <CountdownDisplay deadline={nextSessionDeadline} />
          )}

          <Clock />

          <Timeline
            sessions={sessions}
            selectedDay={selectedDay}
            onSwipeLeft={nextDay}
            onSwipeRight={prevDay}
          />
        </div>
      )}
    </div>
  )
}

export default function ClientPage({ schedule }: ClientPageProps) {
  return (
    <LanguageProvider>
      <ClientPageInner schedule={schedule} />
    </LanguageProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/client-page.tsx
git commit -m "feat: wrap app with LanguageProvider; Clock reads active locale"
```

---

## Task 9: Update `components/RegistrationForm.tsx`

**Files:**
- Modify: `components/RegistrationForm.tsx`
- Modify: `components/RegistrationForm.module.css`

- [ ] **Step 1: Add language strip styles to `RegistrationForm.module.css`**

Append to the end of `components/RegistrationForm.module.css`:

```css
.langStrip {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.langPill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.langPillActive {
  background: rgba(179, 147, 105, 0.18);
  border-color: #b39369;
  color: #b39369;
}
```

- [ ] **Step 2: Replace `components/RegistrationForm.tsx` entirely**

```typescript
// components/RegistrationForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { registerUser, type RegistrationInput } from '@/app/actions/register'
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
      setError(t('reg.fieldError'))
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
      console.error('[RegistrationForm] registerUser failed', err)
      setError(t('reg.serverError'))
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
            <p className={styles.subtitle}>Sapphire Momentum II</p>

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
```

- [ ] **Step 3: Commit**

```bash
git add components/RegistrationForm.tsx components/RegistrationForm.module.css
git commit -m "feat: add language strip to registration form; all strings translated"
```

---

## Task 10: Update `components/BoardingPass.tsx`

**Files:**
- Modify: `components/BoardingPass.tsx`
- Modify: `components/BoardingPass.module.css`

- [ ] **Step 1: Add flag chip styles to `BoardingPass.module.css`**

Append to the end of `components/BoardingPass.module.css`:

```css
.stubRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.langChip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 3px 10px 3px 8px;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
}

.langChipCaret {
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.3);
  margin-left: 1px;
}
```

- [ ] **Step 2: Replace `components/BoardingPass.tsx` entirely**

```typescript
// components/BoardingPass.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Day } from '@/lib/schedule'
import type { BoardingSegment } from '@/lib/schedule'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import DayTabs from './DayTabs'
import LanguagePicker from './LanguagePicker'
import styles from './BoardingPass.module.css'

interface BoardingPassProps {
  days: Day[]
  selectedDay: number
  todayIdx: number
  onDayChange: (idx: number) => void
  segment: BoardingSegment
  passenger?: { firstName: string; lastName: string }
}

export default function BoardingPass({
  days, selectedDay, todayIdx, onDayChange, segment, passenger,
}: BoardingPassProps) {
  const { t, locale } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)

  function fmtDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(LOCALE_META[locale].bcp47, { day: 'numeric', month: 'short' })
  }

  const isEnded = segment.type === 'ended'
  const meta = LOCALE_META[locale]

  return (
    <>
      <motion.div
        className={styles.pass}
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.top}>

          {/* Header */}
          <div className={styles.header}>
            <Image
              src="/x2-emblem.png"
              alt="Sapphire Momentum II ×2"
              width={28}
              height={28}
              className={styles.emblemImg}
              sizes="28px"
              priority
            />
            <span className={styles.bpLabel}>{t('boarding.pass')}</span>
          </div>

          {/* Wordmark SVG — unchanged */}
          <div className={styles.wordmark}>
            <svg viewBox="0 0 1316.5 159" xmlns="http://www.w3.org/2000/svg" aria-label="Sapphire Momentum II">
              <style>{`.wg{fill:#b39369}.wc{fill:#f4f3ef}`}</style>
              <path className="wc" d="M90.42,113.53c-6.95,0-12.79-1.55-17.53-4.66-4.74-3.11-8.08-7.33-10.02-12.67l11.82-6.91c2.74,7.15,8.11,10.72,16.12,10.72,3.87,0,6.71-.7,8.51-2.1s2.7-3.17,2.7-5.31c0-2.47-1.1-4.39-3.3-5.76-2.2-1.37-6.14-2.85-11.82-4.46-3.14-.93-5.79-1.87-7.96-2.8-2.17-.93-4.34-2.19-6.51-3.76-2.17-1.57-3.82-3.55-4.96-5.96-1.14-2.4-1.7-5.21-1.7-8.41,0-6.34,2.25-11.4,6.76-15.17,4.51-3.77,9.93-5.66,16.27-5.66,5.67,0,10.67,1.39,14.97,4.16,4.31,2.77,7.66,6.63,10.07,11.57l-11.62,6.71c-2.8-6.01-7.28-9.01-13.42-9.01-2.87,0-5.12.65-6.76,1.95-1.64,1.3-2.45,2.99-2.45,5.06,0,2.2.92,3.99,2.75,5.36,1.84,1.37,5.36,2.86,10.57,4.46,2.14.67,3.76,1.19,4.86,1.55,1.1.37,2.6.94,4.51,1.7,1.9.77,3.37,1.49,4.41,2.15,1.03.67,2.22,1.57,3.56,2.7,1.33,1.14,2.35,2.3,3.05,3.5.7,1.2,1.3,2.65,1.8,4.36.5,1.7.75,3.55.75,5.56,0,6.48-2.35,11.62-7.06,15.42s-10.83,5.71-18.38,5.71Z"/>
              <path className="wc" d="M174.86,112.13l-4.46-12.62h-28.8l-4.21,12.62h-14.92l24.54-70.11h17.13l24.73,70.11h-14.01ZM146.11,86.59h19.73l-10.12-28.64-9.61,28.64Z"/>
              <path className="wc" d="M226.83,42.02c6.74,0,12.42,2.27,17.03,6.81,4.61,4.54,6.91,10.12,6.91,16.73s-2.3,12.19-6.91,16.73c-4.61,4.54-10.28,6.81-17.03,6.81h-12.32v23.03h-13.82V42.02h26.14ZM226.83,76.17c2.94,0,5.37-1.02,7.31-3.05,1.94-2.04,2.9-4.56,2.9-7.56s-.97-5.61-2.9-7.61c-1.94-2-4.37-3-7.31-3h-12.32v21.23h12.32Z"/>
              <path className="wc" d="M290.93,42.02c6.74,0,12.42,2.27,17.03,6.81,4.61,4.54,6.91,10.12,6.91,16.73s-2.3,12.19-6.91,16.73c-4.61,4.54-10.28,6.81-17.03,6.81h-12.32v23.03h-13.82V42.02h26.14ZM290.93,76.17c2.94,0,5.37-1.02,7.31-3.05,1.94-2.04,2.9-4.56,2.9-7.56s-.97-5.61-2.9-7.61c-1.94-2-4.37-3-7.31-3h-12.32v21.23h12.32Z"/>
              <path className="wc" d="M368.74,42.02h13.72v70.11h-13.72v-29.04h-26.04v29.04h-13.82V42.02h13.82v27.84h26.04v-27.84Z"/>
              <path className="wc" d="M400.49,42.02h13.82v70.11h-13.82V42.02Z"/>
              <path className="wc" d="M470.8,112.13l-14.17-24.34h-10.47v24.34h-13.82V42.02h28.04c6.47,0,11.98,2.27,16.52,6.81,4.54,4.54,6.81,10.02,6.81,16.42,0,4.34-1.24,8.36-3.71,12.07-2.47,3.71-5.74,6.49-9.81,8.36l15.52,26.44h-14.92ZM446.16,54.94v20.73h14.22c2.6,0,4.84-1.02,6.71-3.05,1.87-2.04,2.8-4.49,2.8-7.36s-.94-5.31-2.8-7.31c-1.87-2-4.11-3-6.71-3h-14.22Z"/>
              <path className="wc" d="M512.66,98.91h29.54v13.22h-43.37V42.02h42.87v13.22h-29.04v14.92h26.54v13.02h-26.54v15.72Z"/>
              <path className="wg" d="M652.57,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
              <path className="wg" d="M731.59,102.76c-7.01,7.04-15.59,10.57-25.74,10.57s-18.73-3.52-25.74-10.57c-7.01-7.04-10.52-15.61-10.52-25.69s3.51-18.64,10.52-25.69c7.01-7.04,15.59-10.57,25.74-10.57s18.73,3.52,25.74,10.57c7.01,7.05,10.52,15.61,10.52,25.69s-3.5,18.65-10.52,25.69ZM685.02,97.96c5.61,5.71,12.55,8.56,20.83,8.56s15.22-2.85,20.83-8.56c5.61-5.71,8.41-12.67,8.41-20.88s-2.8-15.17-8.41-20.88-12.55-8.56-20.83-8.56-15.22,2.85-20.83,8.56-8.41,12.67-8.41,20.88,2.8,15.17,8.41,20.88Z"/>
              <path className="wg" d="M823.23,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
              <path className="wg" d="M851.27,105.52h34.05v6.61h-41.06V42.02h40.56v6.61h-33.55v24.84h31.05v6.61h-31.05v25.44Z"/>
              <path className="wg" d="M947.41,42.02h7.01v70.11h-6.01l-39.06-57.09v57.09h-7.01V42.02h6.11l38.96,56.94v-56.94Z"/>
              <path className="wg" d="M1019.52,42.02v6.61h-21.53v63.5h-7.01v-63.5h-21.53v-6.61h50.08Z"/>
              <path className="wg" d="M1078.41,106.52c-4.81,4.54-11.08,6.81-18.83,6.81s-14.02-2.27-18.83-6.81c-4.81-4.54-7.21-10.62-7.21-18.23v-46.27h7.01v46.27c0,5.61,1.67,10.05,5.01,13.32,3.34,3.27,8.01,4.91,14.02,4.91s10.68-1.63,14.02-4.91c3.34-3.27,5.01-7.71,5.01-13.32v-46.27h7.01v46.27c0,7.61-2.4,13.69-7.21,18.23Z"/>
              <path className="wg" d="M1169.75,42.02v70.11h-7.01v-59.49l-24.54,41.06h-1l-24.54-41.06v59.49h-7.01V42.02h8.6l23.45,39.24,23.45-39.24h8.6Z"/>
              <path className="wg" d="M1219.32,42.02h13.82v70.11h-13.82V42.02Z"/>
              <path className="wg" d="M1251.17,42.02h13.82v70.11h-13.82V42.02Z"/>
            </svg>
          </div>

          {/* Route */}
          <div className={styles.route}>
            <div className={styles.city}>
              <div className={styles.iata}>{segment.dep || '–'}</div>
              <div className={styles.cityName}>{segment.depName}</div>
            </div>
            <div className={styles.routeMid}>
              <div className={styles.routeTrack}>
                <div className={styles.routeLine} />
                <div className={styles.routeDot} />
                <div className={styles.routeLine} style={{ background: 'linear-gradient(to right, rgba(179,147,105,0.4), rgba(85,116,184,0.2))' }} />
              </div>
              <div className={styles.plane}>✈</div>
              <div className={styles.duration}>{t('boarding.days3')}</div>
            </div>
            <div className={`${styles.city} ${styles.cityRight}`}>
              <div className={styles.iata}>{segment.arr || '–'}</div>
              <div className={styles.cityName}>{segment.arrName}</div>
            </div>
          </div>

          {/* Details grid */}
          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>{t('boarding.passenger')}</span>
              <span className={styles.detailVal}>
                {passenger
                  ? `${passenger.firstName.toUpperCase()} ${passenger.lastName.toUpperCase()}`
                  : '–'}
              </span>
            </div>
            <div className={`${styles.detail} ${styles.colRight}`}>
              <span className={styles.detailLabel}>{t('boarding.gate')}</span>
              <span className={styles.detailVal}>Kremlin Palace</span>
            </div>

            {isEnded ? (
              <div className={`${styles.detail} ${styles.col2} ${styles.endedDetail}`}>
                <span className={styles.endedText}>{t('boarding.ended')}</span>
              </div>
            ) : (
              <>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>{t('boarding.departure')}</span>
                  <span className={styles.detailVal}>{segment.kalkis ?? '--:--'}</span>
                </div>
                <div className={`${styles.detail} ${styles.colRight}`}>
                  <span className={styles.detailLabel}>{t('boarding.arrival')}</span>
                  <span className={styles.detailVal}>{segment.inis ?? '--:--'}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>{t('boarding.date')}</span>
                  <span className={styles.detailVal}>
                    {segment.dateStr ? fmtDate(segment.dateStr) : '–'}
                  </span>
                </div>
                <div className={`${styles.detail} ${styles.colRight}`}>
                  <span className={styles.detailLabel}>{t('boarding.duration')}</span>
                  <span className={styles.detailVal}>{segment.suresi ?? '–'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Perforation */}
        <div className={styles.perf}>
          <div className={styles.perfLine} />
        </div>

        {/* Stub */}
        <div className={styles.stub}>
          <div className={styles.stubRow}>
            <span className={styles.stubLabel}>{t('boarding.daySelect')}</span>
            <button
              type="button"
              className={styles.langChip}
              onClick={() => setPickerOpen(true)}
              aria-label="Select language"
            >
              <span>{meta.flag}</span>
              <span>{locale.toUpperCase()}</span>
              <span className={styles.langChipCaret}>▾</span>
            </button>
          </div>
          <DayTabs
            days={days}
            selectedDay={selectedDay}
            todayIdx={todayIdx}
            onSelect={onDayChange}
          />
        </div>
      </motion.div>

      <LanguagePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BoardingPass.tsx components/BoardingPass.module.css
git commit -m "feat: add language chip to boarding pass stub; all labels translated"
```

---

## Task 11: Update `components/CountdownDisplay.tsx`

**Files:**
- Modify: `components/CountdownDisplay.tsx`

- [ ] **Step 1: Replace `components/CountdownDisplay.tsx` entirely**

```typescript
// components/CountdownDisplay.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import styles from './CountdownDisplay.module.css'

interface CountdownDisplayProps {
  deadline: Date
}

const SHOW_DAYS_BEFORE = new Date('2026-04-24T00:00:00')
const EVENT_DATE = new Date(2026, 3, 24) // April 24 2026

function getParts(deadline: Date, now: Date) {
  const ms      = Math.max(0, deadline.getTime() - now.getTime())
  const days    = Math.floor(ms / 86_400_000)
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000)  / 60_000)
  const seconds = Math.floor((ms % 60_000)      / 1_000)
  return { days, hours, minutes, seconds }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownDisplay({ deadline }: CountdownDisplayProps) {
  const { t, locale } = useTranslation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(id)
  }, [])

  const isPreEvent = now < SHOW_DAYS_BEFORE
  const { days, hours, minutes, seconds } = getParts(deadline, now)
  const label = isPreEvent ? t('countdown.preEvent') : t('countdown.nextFlight')

  const formattedEventDate = EVENT_DATE.toLocaleDateString(
    LOCALE_META[locale].bcp47,
    { day: 'numeric', month: 'long' },
  ) + ' 2026'

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.units}>
        {isPreEvent && (
          <>
            <div className={styles.unit}>
              <span className={`${styles.value} ${styles.gold}`}>{pad(days)}</span>
              <span className={styles.unitLabel}>{t('countdown.days')}</span>
            </div>
            <span className={styles.sep}>:</span>
          </>
        )}
        <div className={styles.unit}>
          <span className={styles.value}>{pad(hours)}</span>
          <span className={styles.unitLabel}>{t('countdown.hours')}</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={styles.value}>{pad(minutes)}</span>
          <span className={styles.unitLabel}>{t('countdown.minutes')}</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={`${styles.value} ${styles.seconds}`}>{pad(seconds)}</span>
          <span className={styles.unitLabel}>{t('countdown.seconds')}</span>
        </div>
      </div>
      {isPreEvent && (
        <p className={styles.subtext}>
          {formattedEventDate} · Kremlin Palace, <span className={styles.gold}>Antalya</span>
        </p>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CountdownDisplay.tsx
git commit -m "feat: translate countdown labels and locale-format event date"
```

---

## Task 12: Update `Timeline.tsx`, `SessionRow.tsx`, and `DayTabs.tsx`

**Files:**
- Modify: `components/Timeline.tsx`
- Modify: `components/SessionRow.tsx`
- Modify: `components/DayTabs.tsx`

- [ ] **Step 1: Update `components/Timeline.tsx`** — replace the header string

Find this line in `Timeline.tsx`:

```typescript
      <div className={styles.header}>Uçuş Programı</div>
```

Replace with:

```typescript
      <div className={styles.header}>{t('timeline.header')}</div>
```

Also add the import at the top of the file (after the existing imports):

```typescript
import { useTranslation } from '@/hooks/useTranslation'
```

And add `const { t } = useTranslation()` as the first line inside the `Timeline` function body (before the `direction` call):

```typescript
export default function Timeline({ sessions, selectedDay, onSwipeLeft, onSwipeRight }: TimelineProps) {
  const { t } = useTranslation()
  const direction = useDirection(selectedDay)
  // ... rest unchanged
```

- [ ] **Step 2: Update `components/SessionRow.tsx`** — translate badge and use getSessionTitle

Add imports at the top:

```typescript
import { useTranslation } from '@/hooks/useTranslation'
import { getSessionTitle } from '@/lib/i18n'
```

Replace the top of the `SessionRow` function body. Change this existing block:

```typescript
export default function SessionRow({ session, index }: SessionRowProps) {
  const { state, type, start, end, title, subtitle, progressPct } = session
  const isSpotlight = SPOTLIGHT_TYPES.has(type) && state !== 'past'
```

To:

```typescript
export default function SessionRow({ session, index }: SessionRowProps) {
  const { t, locale } = useTranslation()
  const { state, type, start, end, subtitle, progressPct } = session
  const title = getSessionTitle(session, locale)
  const isSpotlight = SPOTLIGHT_TYPES.has(type) && state !== 'past'
```

Then replace the badge:

```typescript
        {state === 'active' && (
          <span className={styles.badge + ' ' + styles.badgeActive}>{t('timeline.active')}</span>
        )}
```

- [ ] **Step 3: Update `components/DayTabs.tsx`** — use getDayName for tab labels

Add imports at the top:

```typescript
import { useTranslation } from '@/hooks/useTranslation'
import { getDayName } from '@/lib/i18n'
```

Add hook call inside `DayTabs`:

```typescript
export default function DayTabs({ days, selectedDay, todayIdx, onSelect }: DayTabsProps) {
  const { locale } = useTranslation()
```

Replace the tab day label:

```typescript
            <span className={styles.tabDay}>{getDayName(d, locale)}</span>
```

Also update the `aria-label`:

```typescript
            aria-label={getDayName(d, locale)}
```

- [ ] **Step 4: Verify full build passes**

Run: `npm run build 2>&1 | tail -20`

Expected: build completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add components/Timeline.tsx components/SessionRow.tsx components/DayTabs.tsx
git commit -m "feat: translate timeline header, active badge, session titles, and day tab labels"
```

---

## Task 13: Smoke testing

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Open: http://localhost:3000

- [ ] **Step 2: Test language auto-detection**

Open DevTools → Application → Local Storage → delete `sapphire_lang` key if present. Reload. Then in the browser console run:

```javascript
// Simulate a Russian browser
Object.defineProperty(navigator, 'language', { value: 'ru-RU', configurable: true })
```

Reload. Expected: registration form shows "Добро пожаловать" and RU pill is gold.

- [ ] **Step 3: Test registration form language strip**

With the app showing the registration form, tap each of the 6 flag pills. Expected for each:
- TR: "Hoş Geldiniz", "Ad", "Soyad", "Devam Et"
- EN: "Welcome", "First Name", "Last Name", "Continue"
- RU: "Добро пожаловать", "Имя", "Фамилия", "Продолжить"
- BG: "Добре дошли", "Собствено име", "Фамилия", "Продължи"
- IT: "Benvenuti", "Nome", "Cognome", "Continua"
- MN: "Тавтай морилно уу", "Нэр", "Овог", "Үргэлжлүүлэх"

- [ ] **Step 4: Test localStorage persistence**

Set language to RU on the registration form. Reload the page. Expected: RU is still active (not reset to TR).

- [ ] **Step 5: Register and enter the app**

Complete registration. Expected: boarding pass labels are in the active language. Day tabs show translated day names. Timeline header matches the language.

- [ ] **Step 6: Test LanguagePicker bottom sheet**

In the app phase, tap the `🇷🇺 RU ▾` chip in the boarding pass stub. Expected: bottom sheet slides up with all 6 languages. Tap a different language. Expected: sheet closes, entire app instantly updates, chip shows new flag + code.

- [ ] **Step 7: Test countdown (pre-event only)**

Set system clock or mock `Date` to before 2026-04-24. Expected: "Uçuşa Kalan Süre" / "Time Until Flight" / "До начала рейса" etc. appear correctly per locale. Event date below shows locale-formatted month (e.g. "24 апреля 2026" in Russian).

- [ ] **Step 8: Test session titles on timeline**

Switch to RU. Check the timeline sessions. Expected: "Завтрак" instead of "Kahvaltı", "Обед" instead of "Öğle Yemeği", etc.

- [ ] **Step 9: Final build check**

Run: `npm run build`

Expected: exits 0 with no errors.

- [ ] **Step 10: Commit smoke test confirmation**

```bash
git commit --allow-empty -m "chore: i18n smoke tests passed — TR/EN/RU/BG/IT/MN verified"
```
