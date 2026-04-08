# Sapphire Momentum II — Event Experience Website

## Overview

An immersive, mobile-first event schedule website for Sapphire Momentum II — a 3-day leadership event (April 24-26, 2025) at Kremlin Palace, Antalya, organized by Xaura Global. Attendees access the site by scanning QR codes placed around the venue. The website is not just a schedule — it's a flight-themed, time-dynamic experience.

**Aesthetic direction:** Luxury Aviation — first-class lounge meets midnight sky. Refined, premium, understated power. Deep sapphire/navy gradients, gold accents, frosted glass surfaces, slow confident animations.

**Language:** Full Turkish.

**Scope:** Schedule experience + push notifications. No venue map, speaker bios, social sharing, or sponsor pages.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js (App Router) | Static schedule data + client-side time engine. Ideal for Vercel. |
| Language | TypeScript | Typed schedule constants, clean data flow. |
| Styling | Tailwind CSS | Mobile-first responsive, CSS variables for brand tokens. |
| Animation | Framer Motion | Boarding intro, card cascades, flip countdown, layout transitions. Native React integration. |
| Deployment | Vercel | Zero-config Next.js hosting, edge performance. |
| Fonts | `next/font` (local) | Gilroy family loaded from local TTF files. |
| Notifications | Service Worker + Push API | Client-side scheduling, no backend push server needed. |

### Not Using

- **Three.js / R3F** — No 3D needed. The luxury aesthetic is layered 2D gradients and blur, not a 3D scene. Would kill mobile load time.
- **GSAP** — Framer Motion covers all animation needs with better React integration.
- **Backend / Database** — Schedule is static. Notifications are client-side. No server state needed.

## Architecture

### Single Page, Four States

The entire app is one Next.js page (`/`) with no client-side routing. A unified time engine (`useCurrentTime()`) ticks every second and drives all dynamic behavior.

**Page States:**

1. **Pre-event** (before April 24, 10:00) — Boarding pass centered on screen + countdown to event start. Full schedule visible below the fold.
2. **During event** (April 24-26, during session hours) — Full schedule with live indicators, time-dynamic sky, auto-scroll to current session.
3. **Between days** (after last session → before first session next day) — Schedule visible, night sky with stars, message: "İyi geceler, yarın görüşürüz ✈"
4. **Post-event** (after April 26, 15:00) — All sessions marked "Tamamlandı", farewell: "Uçuş tamamlandı. Teşekkürler."

### Component Tree

```
App
├── BoardingIntro            # 3s intro on first visit, 0.5s on repeat
├── SkyBackground            # Full-viewport gradient + cloud layers, time-driven
├── Header                   # Logo (morphed from boarding pass) + date
├── DayTabs                  # Cuma / Cumartesi / Pazar pill selectors
├── SessionList
│   └── SessionCard[]        # Boarding-pass-styled frosted glass cards
│       ├── StatusBadge      # Biniş Başladı / Sıradaki / Tamamlandı
│       └── FlipCountdown    # Split-flap digits, only on active session
├── ContextualMessage        # Pre/between/post event contextual messages
├── NotificationPrompt       # Bottom sheet for push permission (first visit)
└── ServiceWorkerRegistration
```

### Data Flow

- **Schedule data** — Static TypeScript constants generated from `schedule.json`. No API calls. Imported at build time.
- **Current time** — `useCurrentTime()` hook, client-side, updates every second. Drives: sky gradient, session statuses, countdown, auto-scroll, contextual messages.
- **First visit flag** — `localStorage` boolean. Controls boarding intro length (full 3s vs 0.5s).
- **Notification subscription** — Service Worker registration + push permission state in `localStorage`.

## Visual Design System

### Color Tokens (CSS Variables)

```css
--sky-deep:       #030d5f;
--sky-navy:       #171f6b;
--sapphire:       #345092;
--sapphire-mid:   #5884cc;
--blue-bright:    #3d82ff;
--gold:           #b39369;
--gold-light:     #edd29d;
--gold-dark:      #95753a;
--cream:          #f4f3ef;
--glass:          rgba(255, 255, 255, 0.06);
--glass-border:   rgba(179, 147, 105, 0.25);
```

### Typography

All text uses the Gilroy font family, loaded via `next/font` from local TTF files.

| Element | Weight | Size | Spacing | Color |
|---------|--------|------|---------|-------|
| Event title "SAPPHIRE" | ExtraBold (800) | 20px | 0.08em | `--cream` |
| "MOMENTUM II" | Light (300) | 14px | 0.3em | `--gold` |
| Day tabs (active) | SemiBold (600) | 13px | — | `--cream` |
| Day tabs (inactive) | Regular (400) | 13px | — | `rgba(255,255,255,0.5)` |
| Session title | Bold (700) | 14-16px | — | `--cream` |
| Speaker name | Regular (400) | 12px | — | `rgba(255,255,255,0.6)` |
| Status badge | Bold (700) | 10px | 0.1em | `--gold` / `--sapphire-mid` |
| Countdown digits | Bold (700) | 20px | — | `--gold-light` / `--cream` |
| Time range | Regular (400) | 11px | — | `rgba(255,255,255,0.6)` |

### Sky Background System

Full-viewport CSS gradient that transitions smoothly based on real time. Two to three translucent radial-gradient cloud layers with `filter: blur()`, drifting left-to-right via CSS animation (~60s cycle). Star particles (small CSS dots with box-shadow glow) visible only during night hours.

| Time Window | Gradient | Mood |
|-------------|----------|------|
| 06:00 - 09:00 | Pale navy → soft gold horizon | Dawn, gentle awakening |
| 09:00 - 14:00 | Deep sapphire → bright blue | Clear day, full energy |
| 14:00 - 18:00 | Sapphire → warm gold → bronze | Golden hour approaching |
| 18:00 - 21:00 | Deep navy → amber horizon glow | Sunset, evening energy |
| 21:00 - 06:00 | Near-black → deep navy, star particles | Night, calm |

Transitions between states are smooth — the gradient interpolates continuously, not in steps.

### Session Cards

Styled as boarding pass segments:

- **Base:** `background: var(--glass)`, `backdrop-filter: blur(12px)`, `border-radius: 10px`
- **Left border accent:** 3px solid — gold (`--gold`) for active, blue (`--sapphire-mid` at 50% opacity) for upcoming, faded for completed
- **Layout:** Status badge + time on top row, title below, speaker name below that
- **Active card:** Gold glow via `box-shadow: 0 0 20px rgba(179,147,105,0.15)`, slightly elevated
- **Completed cards:** 45% opacity, "TAMAMLANDI" label in gold small-caps
- **Transitions:** Framer Motion `layoutId` for smooth reordering on status changes

### Flip Countdown

Displayed only on the active session card. Four digit boxes (MM:SS) styled as split-flap display:

- Dark navy background (`--sky-navy`) with subtle border
- Digits in `--cream`, switching to `--gold-light` in the last 5 minutes
- Framer Motion `AnimatePresence` for flip effect on each digit change
- Label above: "Kalan" (Remaining)

## Boarding Sequence (Intro Animation)

### First Visit — Full Sequence (~3 seconds)

**Frame 1 (0.0s → 0.5s): Dark Void**
- Screen is near-black (`#020a3a`). A single warm point of light fades in at center.

**Frame 2 (0.5s → 1.3s): Boarding Pass Materializes**
- Frosted glass card fades in with `scale(0.95 → 1.0)` ease.
- Content: "BİNİŞ KARTI" header, "SAPPHIRE MOMENTUM II" title, divider line.
- Details fill in left-to-right with 0.15s stagger: TARİH (24-26 NİSAN) → KONUM (ANTALYA) → KAPI (A1).
- Final line: "✈ HOŞ GELDİNİZ" fades in.

**Frame 3 (1.3s → 2.0s): Sky Reveals**
- Sky gradient blooms outward from behind the card (radial reveal).
- Boarding pass card floats upward and shrinks — morphing into the header logo position.
- Cloud layers begin drifting in.

**Frame 4 (2.0s → 3.0s): Schedule Lands**
- Day tabs fade in.
- Session cards cascade up from the bottom with 0.1s stagger per card.
- Auto-scrolls to the active session.
- Flip countdown begins ticking.

### Repeat Visits — Fast Version (~0.5s)

- Boarding pass flashes at 70% opacity for 0.5s, then dissolves.
- Schedule fades in immediately.
- Detected via `localStorage` flag set after first complete intro.

## Push Notifications

### Permission Flow

After the boarding intro completes on first visit, a bottom sheet slides up (frosted glass, matching UI):

- Text: "Oturum hatırlatıcılarını açmak ister misiniz?"
- Two buttons: "Evet, hatırlat" (primary, gold accent) / "Şimdi değil" (secondary, subtle)
- If "Evet" tapped → browser native permission dialog fires
- If "Şimdi değil" → dismissed, never shown again (`localStorage` flag)
- Not shown on repeat visits if already decided

### Notification Triggers

1. **5-minute reminder:** Fires 5 minutes before each session that has a speaker. Format: "⏱ 5 dk sonra: [Session Title] — [Speaker Name]"
2. **Now live:** Fires when a session begins. Format: "✈ Şimdi: [Session Title] — [Speaker Name]"

Breaks, meals, and free time do not trigger notifications.

### Technical Implementation

- Service Worker registered on first page load.
- All session times are known at build time (static schedule). The SW schedules notifications using `setTimeout` based on time deltas from the current time.
- No backend push server needed — all scheduling is client-side in the SW.
- On page load / SW activation, the SW calculates which upcoming sessions need notifications and sets timers.
- **Fallback for SW termination:** Browsers may kill idle service workers. On each page focus / visibility change, the main thread re-syncs with the SW to re-schedule any missed timers. This ensures notifications still fire even if the SW was briefly terminated.

### iOS Limitation

Web push on iOS Safari requires the user to "Add to Home Screen" first. On iOS detection:

- Show a gentle visual guide after the notification prompt: "Bildirimleri almak için Ana Ekrana ekleyin" with a step-by-step animation (Share icon → Add to Home Screen).
- This guide only appears on iOS, only if the user opted in to notifications, and only if the app is not already running as a PWA.

## Responsive Layout

Mobile-first design. The schedule content stays in a constrained container at all sizes.

| Breakpoint | Behavior |
|------------|----------|
| `< 640px` | Full-width cards, tight 12px horizontal padding. Core mobile experience. |
| `640px - 1024px` | Centered container with more breathing room. Slightly larger card padding. |
| `> 1024px` | 440px max-width container centered. Expansive sky fills viewport. Desktop is "mobile in a bigger theater." |

The sky background always fills the full viewport regardless of breakpoint. On desktop, more screen real estate means more visible cloud layers and atmospheric depth.

## Project Structure

```
/
├── CLAUDE.md
├── schedule.json                        # Source schedule data
├── docs/superpowers/specs/              # Design specs
├── public/
│   ├── logos/                           # Optimized SVG/PNG logos
│   ├── fonts/                           # Gilroy TTF files (subset)
│   └── sw.js                            # Service Worker for push notifications
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout, font loading, metadata
│   │   ├── page.tsx                     # Main (only) page
│   │   └── manifest.ts                  # PWA manifest for Add to Home Screen
│   ├── components/
│   │   ├── BoardingIntro.tsx
│   │   ├── SkyBackground.tsx
│   │   ├── Header.tsx
│   │   ├── DayTabs.tsx
│   │   ├── SessionList.tsx
│   │   ├── SessionCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── FlipCountdown.tsx
│   │   ├── ContextualMessage.tsx
│   │   └── NotificationPrompt.tsx
│   ├── lib/
│   │   ├── schedule.ts                  # Typed schedule constants
│   │   ├── time.ts                      # useCurrentTime hook + time utilities
│   │   ├── sky.ts                       # Sky gradient calculation from time
│   │   └── notifications.ts             # SW registration + notification helpers
│   └── styles/
│       └── globals.css                  # Tailwind imports, CSS variables, cloud animations
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Performance Targets

- **Lighthouse mobile score:** 90+
- **First Contentful Paint:** < 1.5s (the dark void + light point counts)
- **Largest Contentful Paint:** < 2.5s (boarding pass card)
- **Total bundle size:** < 150KB gzipped (Next.js + Framer Motion + Tailwind)
- **No images in critical path** — sky, clouds, and cards are all CSS. Logo SVGs are inline.
- **Font subsetting** — Only load Gilroy weights actually used: Light (300), Regular (400), SemiBold (600), Bold (700), ExtraBold (800). Strip unused glyphs if possible.

## Out of Scope

- Venue map / directions
- Speaker profile pages
- Social sharing features
- Sponsor/branding pages
- Multi-language support
- Admin panel / CMS
- Analytics (can be added later via Vercel Analytics)
