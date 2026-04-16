# i18n Multilingual Support — Design Spec
**Date:** 2026-04-16  
**Event:** Sapphire Momentum II · 24–26 Nisan 2026 · Kremlin Palace, Antalya  
**Languages:** Turkish (TR), English (EN), Russian (RU), Bulgarian (BG), Italian (IT), Mongolian (MN — Cyrillic)

---

## Overview

Add full multilingual support to the Sapphire Momentum II event app. All UI strings, countdown labels, registration form copy, boarding pass labels, and schedule session titles are translated into all 6 languages. Language is auto-detected from the browser locale, persisted in `localStorage`, and changeable at any time via two UI entry points.

The implementation uses a custom lightweight i18n context — no new dependencies — with all locale files bundled at build time for complete offline (PWA) support.

---

## Architecture

### Translation files — UI strings

Six static JSON files under `locales/`:

```
locales/
  tr.json   (Turkish — source of truth)
  en.json
  ru.json
  bg.json
  it.json
  mn.json
```

All files share the same key structure (namespaced flat keys). They are imported statically in `LanguageProvider` so they are included in the JS bundle and available offline.

**Key namespaces:**

| Namespace | Contents |
|-----------|----------|
| `reg.*` | Registration form: greeting, field placeholders, consent, submit, error messages |
| `boarding.*` | Boarding pass labels: Boarding Pass, Passenger, Gate, Departure, Arrival, Date, Duration, Day Select, ended message, duration units (h/min abbreviations) |
| `timeline.*` | Timeline header, Active badge |
| `countdown.*` | Pre-event label, next-flight label, unit labels (Days, Hours, Minutes, Seconds) |
| `schedule.*` | Flight status strings: Scheduled, Active, Boarding, Landed |

### Schedule content — session title translations

`schedule.json` is extended with per-language title fields on every session, mirroring the existing `titleEN` pattern:

```jsonc
{
  "title": "Kahvaltı",          // Turkish (always present)
  "titleEN": "Breakfast",
  "titleRU": "Завтрак",
  "titleBG": "Закуска",
  "titleIT": "Colazione",
  "titleMN": "Өглийн цай"
}
```

Day objects get matching `dayRU`, `dayBG`, `dayIT`, `dayMN` fields alongside existing `day` (TR) and `dayEN`.

A helper `getSessionTitle(session, locale)` in `lib/i18n.ts` picks the right field, falling back to Turkish if a translation is missing.

### i18n module — new files

**`lib/i18n.ts`**
- `Locale` type: `'tr' | 'en' | 'ru' | 'bg' | 'it' | 'mn'`
- `LOCALES`: ordered array of supported locales
- `LOCALE_META`: map of locale → `{ flag, nativeName, browserPrefix }` (e.g. `ru → { flag: '🇷🇺', nativeName: 'Русский', browserPrefix: 'ru' }`)
- `detectLocale(navigatorLanguage: string): Locale` — matches `navigator.language` to the closest supported locale, defaults to `'tr'`
- `getSessionTitle(session: RawSession, locale: Locale): string`
- `getDayName(day: Day, locale: Locale): string`

**`hooks/useTranslation.ts`**
- Reads active locale from `LanguageContext`
- Returns `{ t: (key: string) => string, locale: Locale, setLocale: (l: Locale) => void }`
- `t(key)` does a dot-path lookup into the active locale's message object

**`components/LanguageProvider.tsx`**
- Imports all 6 locale JSON files statically
- On mount: reads `localStorage('sapphire_lang')` → validates it's a known locale → falls back to `detectLocale(navigator.language)` → falls back to `'tr'`
- Provides `LanguageContext` to the entire tree
- `setLocale` writes to `localStorage` and triggers a re-render
- Wraps `ClientPage` (added in `app/client-page.tsx`)

**`components/LanguagePicker.tsx`**
- Renders the bottom sheet (Framer Motion slide-up from bottom)
- Props: `open: boolean`, `onClose: () => void`
- Sheet shows all 6 locales as rows: `flag + nativeName + (EN name in small text)` + gold checkmark on active
- Sheet header: "Dil Seçin · Select Language" (bilingual, always legible)
- Drag handle at top; tapping backdrop dismisses
- Used by both entry points

---

## UI Entry Points

### 1. Registration form — language strip

A horizontal row of 6 flag pills is inserted above the greeting (`Hoş Geldiniz`) in `RegistrationForm.tsx`. The active language pill is gold-highlighted; others are muted. Tapping any pill switches immediately (no sheet needed — direct tap). The form copy (greeting, placeholders, submit button, errors) re-renders instantly in the new language.

Layout: wrapping flexbox row, centered, 6 pills max.

### 2. Boarding pass stub — flag chip

A compact `🇹🇷 TR ▾` chip is added to the right side of the stub row that already contains "Gün Seçin" in `BoardingPass.tsx`. Tapping it opens the `LanguagePicker` bottom sheet. The chip updates to the active locale flag + code on switch.

---

## Component changes

| Component | Change |
|-----------|--------|
| `app/client-page.tsx` | Wrap with `LanguageProvider` |
| `components/RegistrationForm.tsx` | Add language strip above greeting; replace all hardcoded strings with `t()` calls |
| `components/BoardingPass.tsx` | Add flag chip to stub; replace all label strings with `t()` calls; update `fmtDate` to use active locale; use `getSessionTitle`/`getDayName` for dynamic content |
| `components/Timeline.tsx` | Replace "Uçuş Programı" header with `t('timeline.header')` |
| `components/SessionRow.tsx` | Replace "✦ Aktif" badge with `t('timeline.active')`; call `getSessionTitle(session, locale)` for title display — calls `useTranslation()` directly (no prop drilling; it's a client component) |
| `components/CountdownDisplay.tsx` | Replace all unit labels and header strings with `t()` calls; update date string to use active locale |
| `components/DayTabs.tsx` | Call `getDayName(day, locale)` for tab labels — reads locale from `useTranslation()` directly |
| `hooks/useSchedule.ts` | Pass `t('boarding.hour')` / `t('boarding.min')` unit strings into `getCurrentSegment` → `fmtDuration` |
| `lib/schedule.ts` | `fmtDuration(ms, units: {h: string, m: string})` — accepts locale unit strings instead of hardcoded Turkish; `getFlightStatus` returns a `key` only (no text), translated at the call site |
| `app/client-page.tsx` | `Clock` component reads locale from `useTranslation()` and passes it to `toLocaleTimeString` |

---

## schedule.json translation content

All session titles translated into all 5 non-Turkish languages (EN already partially covered — complete it). Day names translated in all 5 non-Turkish languages. I (Claude) provide all translations.

Sessions to translate (29 unique titles across 3 days):
- Meals: Kahvaltı, Öğle Yemeği, Akşam Yemeği, Serbest Zaman ve Akşam Yemeği
- Breaks: Ara, Oda Boşaltma ve Coffee Break
- General: Giriş, Kapı Açılış
- Sessions: Eğitim 1–4, Ruby Okulu, Sistem Kurmak, Vizyon Liderliği, Kapanış Konuşması, Keynote
- Events: Konser, Takdir Töreni, 2. Yıl Dönümü Açılış Konuşması

---

## Performance & reliability

- Zero new npm dependencies
- All locale files bundled (no runtime fetches, no CDN dependency at the event)
- Language switch is synchronous — React state update, Framer Motion handles visual transition
- Total locale bundle overhead: ~25–30 KB across all 6 files (negligible)
- No URL routing changes — the app stays at `/`, no redirects, no middleware
- `localStorage` read/write is synchronous and fast; no async race conditions
- 700–1000 concurrent users: all i18n work is client-side, zero server load added

---

## What is NOT in scope

- URL-based locale routing (`/ru`, `/en`, etc.) — unnecessary for a single-route PWA
- Server-side locale detection — overkill, client localStorage is sufficient
- RTL layout support — all 6 languages are left-to-right
- Pluralisation rules — no plural strings exist in the current UI
- Date/number formatting via `Intl` beyond what `toLocaleDateString`/`toLocaleTimeString` already provide
