# Sapphire Momentum II — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive, flight-themed event schedule website for Sapphire Momentum II with real-time sky background, boarding pass animations, and push notifications.

**Architecture:** Single Next.js page driven by a unified time engine (`useCurrentTime`). Schedule data is static TypeScript constants. All visual state (sky gradient, session statuses, countdown) derives from the current time. Service Worker handles push notifications client-side.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion 11, Vitest, Vercel deployment.

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/types.ts` | Schedule data types (Day, Session, SessionType, SessionStatus, EventState) |
| `src/lib/schedule.ts` | Static schedule constants + utility functions (getCurrentSession, getNextSession, getSessionStatus) |
| `src/lib/time.ts` | `useCurrentTime` hook, `getEventState()`, time formatting helpers |
| `src/lib/sky.ts` | `getSkyGradient(date)` — maps current time to CSS gradient string + cloud opacity |
| `src/lib/notifications.ts` | SW registration, permission helpers, notification scheduling |
| `src/components/SkyBackground.tsx` | Full-viewport animated sky gradient + drifting cloud layers |
| `src/components/Header.tsx` | "SAPPHIRE MOMENTUM II" logo text |
| `src/components/DayTabs.tsx` | Cuma / Cumartesi / Pazar pill tab selector |
| `src/components/StatusBadge.tsx` | Session status label (Biniş Başladı / Sıradaki / Tamamlandı) |
| `src/components/FlipDigit.tsx` | Single animated split-flap digit |
| `src/components/FlipCountdown.tsx` | MM:SS countdown using FlipDigit, shown on active session |
| `src/components/SessionCard.tsx` | Frosted glass boarding-pass-styled session card |
| `src/components/SessionList.tsx` | Scrollable session list with auto-scroll to active |
| `src/components/ContextualMessage.tsx` | Pre-event / between-days / post-event messages |
| `src/components/BoardingIntro.tsx` | 3s intro animation sequence (0.5s on repeat) |
| `src/components/NotificationPrompt.tsx` | Bottom sheet push notification permission UI |
| `src/app/layout.tsx` | Root layout with font loading + metadata |
| `src/app/page.tsx` | Main (only) page — wires all components |
| `src/app/manifest.ts` | PWA manifest for Add to Home Screen |
| `src/styles/globals.css` | Tailwind imports, CSS variables, cloud keyframe animations |
| `public/sw.js` | Service Worker for scheduling local notifications |
| `__tests__/lib/schedule.test.ts` | Tests for schedule utility functions |
| `__tests__/lib/time.test.ts` | Tests for time engine + event state |
| `__tests__/lib/sky.test.ts` | Tests for sky gradient calculation |
| `tailwind.config.ts` | Brand colors, font family extension |
| `next.config.ts` | Next.js configuration |
| `vitest.config.ts` | Test configuration |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `src/styles/globals.css`, `src/app/layout.tsx`, `.gitignore`
- Modify: existing `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

Select defaults when prompted. This creates the project skeleton with App Router + Tailwind + TypeScript.

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to the `"scripts"` section of `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Copy Gilroy font files**

```bash
mkdir -p public/fonts
cp website_materials_given/gilroy/Gilroy-Light.ttf public/fonts/
cp website_materials_given/gilroy/Gilroy-Regular.ttf public/fonts/
cp website_materials_given/gilroy/Gilroy-SemiBold.ttf public/fonts/
cp website_materials_given/gilroy/Gilroy-Bold.ttf public/fonts/
cp website_materials_given/gilroy/Gilroy-ExtraBold.ttf public/fonts/
```

- [ ] **Step 6: Set up font loading in layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const gilroy = localFont({
  src: [
    { path: "../../public/fonts/Gilroy-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Gilroy-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Gilroy-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sapphire Momentum II",
  description: "24-26 Nisan | Kremlin Palace, Antalya",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#030d5f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={gilroy.variable}>
      <body className="font-gilroy antialiased bg-[#030d5f] text-cream overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Set up global CSS with brand tokens**

Replace `src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-sky-deep: #030d5f;
  --color-sky-navy: #171f6b;
  --color-sapphire: #345092;
  --color-sapphire-mid: #5884cc;
  --color-blue-bright: #3d82ff;
  --color-gold: #b39369;
  --color-gold-light: #edd29d;
  --color-gold-dark: #95753a;
  --color-cream: #f4f3ef;
  --font-gilroy: var(--font-gilroy);
}

@layer base {
  body {
    font-family: var(--font-gilroy), system-ui, sans-serif;
  }
}

@keyframes cloud-drift {
  0% {
    transform: translateX(-10%);
  }
  100% {
    transform: translateX(10%);
  }
}

@keyframes cloud-drift-slow {
  0% {
    transform: translateX(5%);
  }
  100% {
    transform: translateX(-5%);
  }
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}
```

- [ ] **Step 8: Update Tailwind config with brand extensions**

Replace `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gilroy: ["var(--font-gilroy)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 9: Create minimal page to verify setup**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-widest text-cream">
          SAPPHIRE
        </h1>
        <p className="text-sm font-light tracking-[0.3em] text-gold mt-1">
          MOMENTUM II
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Verify everything works**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Dark navy background fills the screen
- "SAPPHIRE" in cream ExtraBold with wide tracking
- "MOMENTUM II" in gold Light weight
- Gilroy font is loading (check Network tab for font files)

- [ ] **Step 11: Run tests to verify Vitest works**

Create a quick smoke test at `__tests__/setup.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("setup", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Framer Motion, Gilroy fonts"
```

---

## Task 2: Schedule Data & Types

**Files:**
- Create: `src/lib/types.ts`, `src/lib/schedule.ts`, `__tests__/lib/schedule.test.ts`

- [ ] **Step 1: Define TypeScript types**

Create `src/lib/types.ts`:

```ts
export type SessionType =
  | "general"
  | "meal"
  | "session"
  | "keynote"
  | "entertainment"
  | "ceremony"
  | "break";

export type SessionStatus =
  | "completed"
  | "active"
  | "next"
  | "upcoming";

export type EventState =
  | "pre-event"
  | "during-event"
  | "between-days"
  | "post-event";

export interface Session {
  start: string | null; // "HH:MM" or null
  end: string | null;   // "HH:MM" or null
  title: string;
  titleEN?: string;
  speaker?: string;
  subtitle?: string;
  type: SessionType;
}

export interface Day {
  day: string;        // "Cuma" | "Cumartesi" | "Pazar"
  dayEN: string;      // "Friday" | "Saturday" | "Sunday"
  date: string;       // "2025-04-25"
  mc: string;
  sessions: Session[];
}

export interface EventInfo {
  name: string;
  subtitle: string;
  dates: string;
  location: string;
  address: string;
}
```

- [ ] **Step 2: Write schedule utility tests**

Create `__tests__/lib/schedule.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  SCHEDULE,
  EVENT_INFO,
  getSessionsForDay,
  getSessionStatus,
  getCurrentDayIndex,
  getActiveSession,
  getNextSpeakerSession,
} from "@/lib/schedule";

describe("schedule data", () => {
  it("has 3 days", () => {
    expect(SCHEDULE).toHaveLength(3);
  });

  it("has correct day names", () => {
    expect(SCHEDULE.map((d) => d.day)).toEqual([
      "Cuma",
      "Cumartesi",
      "Pazar",
    ]);
  });

  it("has event info", () => {
    expect(EVENT_INFO.name).toBe("Sapphire Momentum II");
  });
});

describe("getSessionsForDay", () => {
  it("returns sessions for Cumartesi", () => {
    const sessions = getSessionsForDay(1);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].title).toBe("Kahvaltı");
  });
});

describe("getSessionStatus", () => {
  it("returns completed for past sessions", () => {
    // Saturday, 11:30 — the 09:30 session should be completed
    const date = new Date("2025-04-25T11:30:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15 session
    expect(getSessionStatus(session, date)).toBe("completed");
  });

  it("returns active for current session", () => {
    // Saturday, 09:45 — the 09:30-10:15 session should be active
    const date = new Date("2025-04-25T09:45:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15
    expect(getSessionStatus(session, date)).toBe("active");
  });

  it("returns upcoming for future sessions", () => {
    const date = new Date("2025-04-25T08:00:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15
    expect(getSessionStatus(session, date)).toBe("upcoming");
  });
});

describe("getCurrentDayIndex", () => {
  it("returns 1 for Saturday", () => {
    const date = new Date("2025-04-26T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(1);
  });

  it("returns 0 for pre-event", () => {
    const date = new Date("2025-04-20T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(0);
  });

  it("returns 2 for post-event", () => {
    const date = new Date("2025-04-28T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(2);
  });
});

describe("getActiveSession", () => {
  it("returns active session during event", () => {
    const date = new Date("2025-04-25T09:45:00+03:00");
    const result = getActiveSession(1, date);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("İkna Problemi Değil İnanç Problemi");
  });

  it("returns null when no session active", () => {
    const date = new Date("2025-04-25T06:00:00+03:00");
    const result = getActiveSession(1, date);
    expect(result).toBeNull();
  });
});

describe("getNextSpeakerSession", () => {
  it("returns next session with a speaker", () => {
    const date = new Date("2025-04-25T08:00:00+03:00");
    const result = getNextSpeakerSession(1, date);
    expect(result).not.toBeNull();
    expect(result!.speaker).toBe("Yusuf Erdem Bakır");
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm test
```

Expected: All tests fail (modules don't exist yet).

- [ ] **Step 4: Implement schedule data and utilities**

Create `src/lib/schedule.ts`:

```ts
import { Day, EventInfo, Session, SessionStatus } from "./types";

export const EVENT_INFO: EventInfo = {
  name: "Sapphire Momentum II",
  subtitle: "2nd Anniversary Edition",
  dates: "24-26 Nisan",
  location: "Kremlin Palace, Antalya",
  address:
    "Kundu Mah. Yaşar Sobutay Bulv. Kremlin Otel Sit. No:98/10 No: A201 Aksu / Antalya",
};

export const SCHEDULE: Day[] = [
  {
    day: "Cuma",
    dayEN: "Friday",
    date: "2025-04-25",
    mc: "Sinan Güler & Ayşe Özçobanlar",
    sessions: [
      { start: "10:00", end: "12:30", title: "Giriş", type: "general" },
      { start: "12:30", end: "14:30", title: "Öğle Yemeği", type: "meal" },
      { start: "16:15", end: "17:30", title: "Ruby Okulu", speaker: "Gürkan Kandemir", type: "session" },
      { start: "17:30", end: "20:30", title: "Serbest Zaman ve Akşam Yemeği", type: "meal" },
      { start: "20:30", end: null, title: "Kapı Açılış", type: "general" },
      { start: "20:45", end: null, title: "2. Yıl Dönümü Açılış Konuşması", speaker: "Nuran & Gürkan Kandemir", type: "keynote" },
      { start: "21:15", end: null, title: "Konser", type: "entertainment" },
    ],
  },
  {
    day: "Cumartesi",
    dayEN: "Saturday",
    date: "2025-04-26",
    mc: "Esra & Kadir Turgut",
    sessions: [
      { start: "07:00", end: "09:30", title: "Kahvaltı", type: "meal" },
      { start: "09:30", end: "10:15", title: "İkna Problemi Değil İnanç Problemi", speaker: "Yusuf Erdem Bakır", type: "session" },
      { start: "10:15", end: "10:30", title: "Ara", type: "break" },
      { start: "10:30", end: "11:15", title: "Network'te Servet Mantığı", speaker: "Kadir Yıldız", type: "session" },
      { start: "11:15", end: "11:30", title: "Ara", type: "break" },
      { start: "11:30", end: "12:30", title: "İnsanlar Neden Katılır Neden Kalır", speaker: "Yaşar Güler", type: "session" },
      { start: "12:30", end: "13:45", title: "Öğle Yemeği", type: "meal" },
      { start: "13:45", end: "15:15", title: "Kişisel Marka ve Storytelling ile Güven İnşası", speaker: "Serdar Örs", type: "session" },
      { start: "15:15", end: "15:30", title: "Ara", type: "break" },
      { start: "15:30", end: "16:30", title: "Sistem Kurmak: Sen Olmadan Çalışan Organizasyon", speaker: "Şule Ünal", type: "session" },
      { start: "16:30", end: "18:00", title: "Ara", type: "break" },
      { start: "18:00", end: null, title: "Vizyon Liderliği", speaker: "Ayberk Dedecan", type: "session" },
      { start: null, end: null, title: "Akşam Yemeği", type: "meal" },
      { start: "21:00", end: null, title: "Takdir Töreni", subtitle: "SP Kutlaması Son ve Yenisi", type: "ceremony" },
    ],
  },
  {
    day: "Pazar",
    dayEN: "Sunday",
    date: "2025-04-27",
    mc: "Metin Kılıç & Meral Çimen",
    sessions: [
      { start: "07:00", end: "09:30", title: "Kahvaltı", type: "meal" },
      { start: "09:45", end: "10:30", title: "Küpe Modeli - İşin Anayası", speaker: "Erdal Çakır", type: "session" },
      { start: "10:30", end: "10:45", title: "Ara", type: "break" },
      { start: "10:45", end: "12:00", title: "Küresel Vizyon İnşası", speaker: "Jean Marc Colaïanni", type: "session" },
      { start: "12:00", end: "13:00", title: "Oda Boşaltma ve Coffee Break", type: "break" },
      { start: "13:15", end: "15:00", title: "Kapanış Konuşması", speaker: "Gürkan Kandemir", type: "keynote" },
    ],
  },
];

/** Parse "HH:MM" string to { hours, minutes } */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

/** Convert "HH:MM" to minutes since midnight */
function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

/** Get sessions for a given day index (0=Cuma, 1=Cumartesi, 2=Pazar) */
export function getSessionsForDay(dayIndex: number): Session[] {
  return SCHEDULE[dayIndex]?.sessions ?? [];
}

/** Determine the status of a session given the current time */
export function getSessionStatus(
  session: Session,
  now: Date
): SessionStatus {
  if (!session.start) return "upcoming";

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(session.start);

  if (session.end) {
    const endMinutes = timeToMinutes(session.end);
    if (nowMinutes >= endMinutes) return "completed";
    if (nowMinutes >= startMinutes) return "active";
    return "upcoming";
  }

  // Session with no end time — find the next session's start to determine end
  const dayIndex = SCHEDULE.findIndex((d) =>
    d.sessions.includes(session)
  );
  if (dayIndex === -1) return "upcoming";

  const sessions = SCHEDULE[dayIndex].sessions;
  const sessionIndex = sessions.indexOf(session);
  const nextSession = sessions[sessionIndex + 1];

  if (nextSession?.start) {
    const nextStartMinutes = timeToMinutes(nextSession.start);
    if (nowMinutes >= nextStartMinutes) return "completed";
  }

  if (nowMinutes >= startMinutes) return "active";
  return "upcoming";
}

/** Get the currently active day index based on date */
export function getCurrentDayIndex(now: Date): number {
  const dateStr = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  }); // YYYY-MM-DD

  for (let i = 0; i < SCHEDULE.length; i++) {
    if (SCHEDULE[i].date === dateStr) return i;
  }

  // Before event → show first day, after event → show last day
  if (dateStr < SCHEDULE[0].date) return 0;
  return SCHEDULE.length - 1;
}

/** Get the currently active session for a day, or null */
export function getActiveSession(
  dayIndex: number,
  now: Date
): Session | null {
  const sessions = getSessionsForDay(dayIndex);
  return (
    sessions.find((s) => getSessionStatus(s, now) === "active") ?? null
  );
}

/** Get the next upcoming session that has a speaker (for notifications) */
export function getNextSpeakerSession(
  dayIndex: number,
  now: Date
): Session | null {
  const sessions = getSessionsForDay(dayIndex);
  return (
    sessions.find(
      (s) => s.speaker && getSessionStatus(s, now) === "upcoming"
    ) ?? null
  );
}

/** Get remaining seconds until a session ends, or null */
export function getSessionRemainingSeconds(
  session: Session,
  now: Date
): number | null {
  if (!session.end) return null;
  const { hours, minutes } = parseTime(session.end);
  const endDate = new Date(now);
  endDate.setHours(hours, minutes, 0, 0);
  const diff = Math.floor((endDate.getTime() - now.getTime()) / 1000);
  return diff > 0 ? diff : 0;
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test
```

Expected: All schedule tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/schedule.ts __tests__/lib/schedule.test.ts
git commit -m "feat: add schedule data types, constants, and utility functions"
```

---

## Task 3: Time Engine

**Files:**
- Create: `src/lib/time.ts`, `__tests__/lib/time.test.ts`

- [ ] **Step 1: Write time engine tests**

Create `__tests__/lib/time.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getEventState, formatCountdown } from "@/lib/time";

describe("getEventState", () => {
  it("returns pre-event before April 25", () => {
    const date = new Date("2025-04-24T12:00:00+03:00");
    expect(getEventState(date)).toBe("pre-event");
  });

  it("returns during-event on Saturday morning", () => {
    const date = new Date("2025-04-26T10:00:00+03:00");
    expect(getEventState(date)).toBe("during-event");
  });

  it("returns between-days on Friday night late", () => {
    const date = new Date("2025-04-25T23:30:00+03:00");
    expect(getEventState(date)).toBe("between-days");
  });

  it("returns post-event after April 27 15:00", () => {
    const date = new Date("2025-04-27T16:00:00+03:00");
    expect(getEventState(date)).toBe("post-event");
  });
});

describe("formatCountdown", () => {
  it("formats seconds to MM:SS", () => {
    expect(formatCountdown(125)).toEqual({ minutes: "02", seconds: "05" });
  });

  it("handles zero", () => {
    expect(formatCountdown(0)).toEqual({ minutes: "00", seconds: "00" });
  });

  it("handles large values", () => {
    expect(formatCountdown(3661)).toEqual({ minutes: "61", seconds: "01" });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- __tests__/lib/time.test.ts
```

Expected: Fails (module doesn't exist).

- [ ] **Step 3: Implement time engine**

Create `src/lib/time.ts`:

```ts
"use client";

import { useState, useEffect } from "react";
import { EventState } from "./types";
import { SCHEDULE } from "./schedule";

/** Hook that returns the current Date, updating every second */
export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

/** Determine the overall event state from the current time */
export function getEventState(now: Date): EventState {
  const dateStr = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
  const hours = now.getHours();

  const firstDate = SCHEDULE[0].date;
  const lastDate = SCHEDULE[SCHEDULE.length - 1].date;

  // Before the first event day
  if (dateStr < firstDate) return "pre-event";

  // After the last event day
  if (dateStr > lastDate) return "post-event";

  // On the last day, after the last session (15:00)
  if (dateStr === lastDate && hours >= 16) return "post-event";

  // During event days — check if we're in session hours
  const dayIndex = SCHEDULE.findIndex((d) => d.date === dateStr);
  if (dayIndex === -1) return "pre-event";

  const day = SCHEDULE[dayIndex];
  const sessions = day.sessions;

  // Find the first and last session times for the day
  const firstStart = sessions.find((s) => s.start)?.start;
  const lastSession = [...sessions].reverse().find((s) => s.start);

  if (!firstStart || !lastSession?.start) return "between-days";

  const firstHour = parseInt(firstStart.split(":")[0]);
  const lastHour = parseInt(lastSession.start.split(":")[0]);

  // Before first session of the day or after last session + 2 hours
  if (hours < firstHour - 1) return "between-days";
  if (hours > lastHour + 2) return "between-days";

  return "during-event";
}

/** Format seconds into { minutes, seconds } zero-padded strings */
export function formatCountdown(totalSeconds: number): {
  minutes: string;
  seconds: string;
} {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return {
    minutes: String(mins).padStart(2, "0"),
    seconds: String(secs).padStart(2, "0"),
  };
}

/** Get seconds until a specific date/time */
export function getSecondsUntil(target: Date, now: Date): number {
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

/** Build a Date object for a specific event day + time */
export function buildEventDate(dayDate: string, timeStr: string): Date {
  return new Date(`${dayDate}T${timeStr}:00+03:00`);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: All time tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/time.ts __tests__/lib/time.test.ts
git commit -m "feat: add time engine with useCurrentTime hook and event state logic"
```

---

## Task 4: Sky Background System

**Files:**
- Create: `src/lib/sky.ts`, `__tests__/lib/sky.test.ts`, `src/components/SkyBackground.tsx`

- [ ] **Step 1: Write sky gradient tests**

Create `__tests__/lib/sky.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getSkyConfig } from "@/lib/sky";

describe("getSkyConfig", () => {
  it("returns dawn palette in early morning", () => {
    const date = new Date("2025-04-26T07:00:00+03:00");
    const config = getSkyConfig(date);
    expect(config.gradient).toContain("#");
    expect(config.showStars).toBe(false);
    expect(config.cloudOpacity).toBeGreaterThan(0);
  });

  it("returns night palette with stars at midnight", () => {
    const date = new Date("2025-04-26T01:00:00+03:00");
    const config = getSkyConfig(date);
    expect(config.showStars).toBe(true);
  });

  it("returns golden hour palette in late afternoon", () => {
    const date = new Date("2025-04-26T17:00:00+03:00");
    const config = getSkyConfig(date);
    expect(config.gradient).toContain("#b39369");
    expect(config.showStars).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- __tests__/lib/sky.test.ts
```

- [ ] **Step 3: Implement sky gradient calculation**

Create `src/lib/sky.ts`:

```ts
export interface SkyConfig {
  gradient: string;
  cloudOpacity: number;
  showStars: boolean;
}

interface SkyPreset {
  stops: string[];
  cloudOpacity: number;
  showStars: boolean;
}

const SKY_PRESETS: { hour: number; preset: SkyPreset }[] = [
  {
    hour: 0,
    preset: {
      stops: ["#020a3a 0%", "#030d5f 50%", "#0a1a4a 100%"],
      cloudOpacity: 0.02,
      showStars: true,
    },
  },
  {
    hour: 6,
    preset: {
      stops: ["#0a1a4a 0%", "#345092 40%", "#b39369 80%", "#edd29d 100%"],
      cloudOpacity: 0.04,
      showStars: false,
    },
  },
  {
    hour: 9,
    preset: {
      stops: ["#030d5f 0%", "#345092 40%", "#5884cc 70%", "#5c89d1 100%"],
      cloudOpacity: 0.06,
      showStars: false,
    },
  },
  {
    hour: 14,
    preset: {
      stops: ["#030d5f 0%", "#345092 35%", "#5884cc 60%", "#b39369 100%"],
      cloudOpacity: 0.06,
      showStars: false,
    },
  },
  {
    hour: 18,
    preset: {
      stops: ["#030d5f 0%", "#171f6b 30%", "#b39369 70%", "#edd29d 100%"],
      cloudOpacity: 0.04,
      showStars: false,
    },
  },
  {
    hour: 21,
    preset: {
      stops: ["#020a3a 0%", "#030d5f 40%", "#171f6b 70%", "#0a1a4a 100%"],
      cloudOpacity: 0.03,
      showStars: true,
    },
  },
  {
    hour: 24,
    preset: {
      stops: ["#020a3a 0%", "#030d5f 50%", "#0a1a4a 100%"],
      cloudOpacity: 0.02,
      showStars: true,
    },
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(colorA: string, colorB: string, t: number): string {
  const parseHex = (hex: string) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);

  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function parseStop(stop: string): { color: string; position: string } {
  const parts = stop.trim().split(" ");
  return { color: parts[0], position: parts[1] || "0%" };
}

export function getSkyConfig(now: Date): SkyConfig {
  const hours = now.getHours() + now.getMinutes() / 60;

  // Find the two presets to interpolate between
  let lower = SKY_PRESETS[0];
  let upper = SKY_PRESETS[1];

  for (let i = 0; i < SKY_PRESETS.length - 1; i++) {
    if (hours >= SKY_PRESETS[i].hour && hours < SKY_PRESETS[i + 1].hour) {
      lower = SKY_PRESETS[i];
      upper = SKY_PRESETS[i + 1];
      break;
    }
  }

  const range = upper.hour - lower.hour;
  const t = range > 0 ? (hours - lower.hour) / range : 0;

  // Interpolate gradient stops
  const maxStops = Math.max(
    lower.preset.stops.length,
    upper.preset.stops.length
  );
  const interpolatedStops: string[] = [];

  for (let i = 0; i < maxStops; i++) {
    const lStop = parseStop(
      lower.preset.stops[Math.min(i, lower.preset.stops.length - 1)]
    );
    const uStop = parseStop(
      upper.preset.stops[Math.min(i, upper.preset.stops.length - 1)]
    );
    const color = lerpColor(lStop.color, uStop.color, t);
    interpolatedStops.push(`${color} ${lStop.position}`);
  }

  const gradient = `linear-gradient(180deg, ${interpolatedStops.join(", ")})`;
  const cloudOpacity = lerp(lower.preset.cloudOpacity, upper.preset.cloudOpacity, t);
  const showStars = t < 0.5 ? lower.preset.showStars : upper.preset.showStars;

  return { gradient, cloudOpacity, showStars };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- __tests__/lib/sky.test.ts
```

Expected: All sky tests pass.

- [ ] **Step 5: Implement SkyBackground component**

Create `src/components/SkyBackground.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { getSkyConfig } from "@/lib/sky";

interface SkyBackgroundProps {
  now: Date;
}

export function SkyBackground({ now }: SkyBackgroundProps) {
  const skyConfig = useMemo(() => getSkyConfig(now), [now]);

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-[5000ms] ease-linear"
      style={{ background: skyConfig.gradient }}
    >
      {/* Cloud layer 1 — slow drift left to right */}
      <div
        className="absolute top-[35%] -left-[10%] w-[60%] h-[25%] rounded-full blur-[40px]"
        style={{
          background: `radial-gradient(ellipse at 40% 50%, rgba(255,255,255,${skyConfig.cloudOpacity}) 0%, transparent 60%)`,
          animation: "cloud-drift 60s ease-in-out infinite alternate",
        }}
      />

      {/* Cloud layer 2 — slower drift right to left */}
      <div
        className="absolute top-[50%] left-[30%] w-[70%] h-[20%] rounded-full blur-[50px]"
        style={{
          background: `radial-gradient(ellipse at 60% 50%, rgba(255,255,255,${skyConfig.cloudOpacity * 0.7}) 0%, transparent 60%)`,
          animation: "cloud-drift-slow 80s ease-in-out infinite alternate",
        }}
      />

      {/* Cloud layer 3 — high, subtle */}
      <div
        className="absolute top-[20%] left-[50%] w-[40%] h-[15%] rounded-full blur-[35px]"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,${skyConfig.cloudOpacity * 0.5}) 0%, transparent 60%)`,
          animation: "cloud-drift 90s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Stars — only visible at night */}
      {skyConfig.showStars && (
        <div className="absolute inset-0">
          {STAR_POSITIONS.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                background: star.color,
                boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
                animation: `star-twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const STAR_POSITIONS = [
  { top: "8%", left: "15%", size: 1.5, color: "#edd29d", duration: 3, delay: 0 },
  { top: "12%", left: "65%", size: 1, color: "#f4f3ef", duration: 4, delay: 1 },
  { top: "5%", left: "82%", size: 1.5, color: "#edd29d", duration: 3.5, delay: 0.5 },
  { top: "18%", left: "35%", size: 1, color: "#f4f3ef", duration: 5, delay: 2 },
  { top: "15%", left: "50%", size: 2, color: "#edd29d", duration: 4, delay: 1.5 },
  { top: "3%", left: "28%", size: 1, color: "#f4f3ef", duration: 3, delay: 0.8 },
  { top: "10%", left: "90%", size: 1.5, color: "#edd29d", duration: 4.5, delay: 2.5 },
  { top: "22%", left: "72%", size: 1, color: "#f4f3ef", duration: 3.5, delay: 1.2 },
  { top: "7%", left: "45%", size: 1, color: "#edd29d", duration: 5, delay: 0.3 },
  { top: "25%", left: "10%", size: 1.5, color: "#f4f3ef", duration: 4, delay: 1.8 },
];
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/sky.ts __tests__/lib/sky.test.ts src/components/SkyBackground.tsx
git commit -m "feat: add sky background system with time-based gradient and cloud layers"
```

---

## Task 5: Core UI Components

**Files:**
- Create: `src/components/Header.tsx`, `src/components/DayTabs.tsx`, `src/components/StatusBadge.tsx`

- [ ] **Step 1: Implement Header component**

Create `src/components/Header.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      className="text-center pt-4 pb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-xl tracking-[0.08em]">
        <span className="font-extrabold text-cream">SAPPHIRE</span>
        <span className="font-light tracking-[0.3em] text-gold ml-2">
          MOMENTUM
        </span>
        <span className="font-bold text-gold ml-2">II</span>
      </h1>
      <p className="text-[10px] tracking-[0.2em] text-cream/40 mt-1">
        24-26 NİSAN • ANTALYA
      </p>
    </motion.header>
  );
}
```

- [ ] **Step 2: Implement DayTabs component**

Create `src/components/DayTabs.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { SCHEDULE } from "@/lib/schedule";

interface DayTabsProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function DayTabs({ activeIndex, onSelect }: DayTabsProps) {
  return (
    <div className="flex gap-2 justify-center px-4 pb-3">
      {SCHEDULE.map((day, index) => (
        <motion.button
          key={day.day}
          onClick={() => onSelect(index)}
          className={`
            relative px-4 py-1.5 rounded-full text-[13px] transition-colors duration-300
            ${
              index === activeIndex
                ? "text-cream font-semibold"
                : "text-cream/50 font-normal"
            }
          `}
          whileTap={{ scale: 0.95 }}
        >
          {index === activeIndex && (
            <motion.div
              layoutId="day-tab-bg"
              className="absolute inset-0 rounded-full bg-white/15 border border-gold/40"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{day.day}</span>
        </motion.button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
import { SessionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: SessionStatus;
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  active: {
    label: "✈ BİNİŞ BAŞLADI",
    className: "text-gold font-bold",
  },
  next: {
    label: "SIRADAKİ",
    className: "text-sapphire-mid",
  },
  completed: {
    label: "TAMAMLANDI",
    className: "text-gold/60",
  },
  upcoming: {
    label: "",
    className: "text-cream/40",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config.label) return null;

  return (
    <span
      className={`text-[10px] tracking-[0.1em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Components created — will be wired together in the page assembly task.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/DayTabs.tsx src/components/StatusBadge.tsx
git commit -m "feat: add Header, DayTabs, and StatusBadge components"
```

---

## Task 6: Flip Countdown

**Files:**
- Create: `src/components/FlipDigit.tsx`, `src/components/FlipCountdown.tsx`

- [ ] **Step 1: Implement FlipDigit component**

Create `src/components/FlipDigit.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface FlipDigitProps {
  value: string;
  highlight?: boolean;
}

export function FlipDigit({ value, highlight = false }: FlipDigitProps) {
  return (
    <div
      className={`
        relative w-7 h-9 rounded overflow-hidden
        bg-sky-navy border border-white/10
        flex items-center justify-center
      `}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`
            text-lg font-bold tabular-nums
            ${highlight ? "text-gold-light" : "text-cream"}
          `}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Implement FlipCountdown component**

Create `src/components/FlipCountdown.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { FlipDigit } from "./FlipDigit";
import { formatCountdown } from "@/lib/time";

interface FlipCountdownProps {
  remainingSeconds: number;
}

export function FlipCountdown({ remainingSeconds }: FlipCountdownProps) {
  const { minutes, seconds } = useMemo(
    () => formatCountdown(remainingSeconds),
    [remainingSeconds]
  );

  const highlight = remainingSeconds <= 300; // Last 5 minutes

  return (
    <div className="mt-2 pt-2 border-t border-white/10">
      <span className="text-[10px] text-cream/50">Kalan</span>
      <div className="flex items-center gap-1 mt-1">
        <FlipDigit value={minutes[0]} highlight={highlight} />
        <FlipDigit value={minutes[1]} highlight={highlight} />
        <span
          className={`text-lg font-bold mx-0.5 ${highlight ? "text-gold-light" : "text-cream/60"}`}
        >
          :
        </span>
        <FlipDigit value={seconds[0]} highlight={highlight} />
        <FlipDigit value={seconds[1]} highlight={highlight} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FlipDigit.tsx src/components/FlipCountdown.tsx
git commit -m "feat: add FlipDigit and FlipCountdown split-flap display components"
```

---

## Task 7: Session Card

**Files:**
- Create: `src/components/SessionCard.tsx`

- [ ] **Step 1: Implement SessionCard component**

Create `src/components/SessionCard.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Session, SessionStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { FlipCountdown } from "./FlipCountdown";

interface SessionCardProps {
  session: Session;
  status: SessionStatus;
  remainingSeconds: number | null;
  index: number;
}

const BORDER_COLORS: Record<SessionStatus, string> = {
  active: "border-l-gold",
  next: "border-l-sapphire-mid/50",
  upcoming: "border-l-sapphire-mid/30",
  completed: "border-l-white/15",
};

export function SessionCard({
  session,
  status,
  remainingSeconds,
  index,
}: SessionCardProps) {
  const isActive = status === "active";
  const isCompleted = status === "completed";

  const timeDisplay = session.start
    ? session.end
      ? `${session.start} – ${session.end}`
      : session.start
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`
        mx-3 mb-1.5 p-3 rounded-xl border-l-[3px]
        backdrop-blur-xl
        ${BORDER_COLORS[status]}
        ${isActive
          ? "bg-white/[0.08] shadow-[0_0_20px_rgba(179,147,105,0.12)]"
          : "bg-white/[0.05]"
        }
        ${isCompleted ? "opacity-45" : ""}
        transition-all duration-500
      `}
    >
      {/* Top row: status + time */}
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={status} />
        {timeDisplay && (
          <span className="text-[11px] text-cream/50">{timeDisplay}</span>
        )}
      </div>

      {/* Session title */}
      <h3
        className={`
          font-bold leading-snug
          ${isActive ? "text-[15px] text-cream" : "text-[14px] text-cream/90"}
        `}
      >
        {session.title}
      </h3>

      {/* Speaker name */}
      {session.speaker && (
        <p className="text-xs text-cream/50 mt-0.5">{session.speaker}</p>
      )}

      {/* Subtitle (for ceremony) */}
      {session.subtitle && (
        <p className="text-xs text-cream/40 mt-0.5 italic">
          {session.subtitle}
        </p>
      )}

      {/* Countdown — only on active session */}
      {isActive && remainingSeconds !== null && (
        <FlipCountdown remainingSeconds={remainingSeconds} />
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SessionCard.tsx
git commit -m "feat: add SessionCard component with status-aware styling and countdown"
```

---

## Task 8: Session List & Contextual Messages

**Files:**
- Create: `src/components/SessionList.tsx`, `src/components/ContextualMessage.tsx`

- [ ] **Step 1: Implement SessionList with auto-scroll**

Create `src/components/SessionList.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Session, SessionStatus } from "@/lib/types";
import { getSessionStatus, getSessionRemainingSeconds } from "@/lib/schedule";
import { SessionCard } from "./SessionCard";

interface SessionListProps {
  sessions: Session[];
  now: Date;
}

export function SessionList({ sessions, now }: SessionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Auto-scroll to active session on first render
  useEffect(() => {
    if (!hasScrolled.current && activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      hasScrolled.current = true;
    }
  }, []);

  // Derive statuses and find active/next
  const sessionData = sessions.map((session) => {
    const status = getSessionStatus(session, now);
    const remainingSeconds =
      status === "active"
        ? getSessionRemainingSeconds(session, now)
        : null;
    return { session, status, remainingSeconds };
  });

  // Mark the first "upcoming" as "next"
  let nextFound = false;
  const enhancedData = sessionData.map((item) => {
    if (!nextFound && item.status === "upcoming" && item.session.start) {
      nextFound = true;
      return { ...item, status: "next" as SessionStatus };
    }
    return item;
  });

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto pb-8 pt-1">
      {enhancedData.map((item, index) => (
        <div
          key={`${item.session.title}-${index}`}
          ref={item.status === "active" ? activeRef : undefined}
        >
          <SessionCard
            session={item.session}
            status={item.status}
            remainingSeconds={item.remainingSeconds}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement ContextualMessage component**

Create `src/components/ContextualMessage.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { EventState } from "@/lib/types";
import { getSecondsUntil, buildEventDate, formatCountdown } from "@/lib/time";
import { SCHEDULE } from "@/lib/schedule";

interface ContextualMessageProps {
  eventState: EventState;
  now: Date;
}

export function ContextualMessage({
  eventState,
  now,
}: ContextualMessageProps) {
  if (eventState === "during-event") return null;

  let message = "";
  let submessage = "";

  switch (eventState) {
    case "pre-event": {
      const firstSession = SCHEDULE[0].sessions.find((s) => s.start);
      if (firstSession) {
        const target = buildEventDate(SCHEDULE[0].date, firstSession.start!);
        const seconds = getSecondsUntil(target, now);
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          message = `Kalkışa ${days} gün`;
        } else if (hours > 0) {
          message = `Kalkışa ${hours} saat ${mins} dakika`;
        } else {
          const { minutes, seconds: secs } = formatCountdown(seconds);
          message = `Kalkışa ${minutes}:${secs}`;
        }
      }
      submessage = "Sapphire Momentum II • Kremlin Palace, Antalya";
      break;
    }
    case "between-days":
      message = "İyi geceler, yarın görüşürüz ✈";
      submessage = "Programa aşağıdan göz atabilirsiniz";
      break;
    case "post-event":
      message = "Uçuş tamamlandı. Teşekkürler.";
      submessage = "Sapphire Momentum II • 24-26 Nisan 2025";
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-center px-6 py-6"
    >
      <p className="text-lg font-semibold text-cream">{message}</p>
      {submessage && (
        <p className="text-xs text-cream/40 mt-2">{submessage}</p>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionList.tsx src/components/ContextualMessage.tsx
git commit -m "feat: add SessionList with auto-scroll and ContextualMessage for event states"
```

---

## Task 9: Main Page Assembly

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Wire all components together in page.tsx**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useCurrentTime, getEventState } from "@/lib/time";
import { getCurrentDayIndex, getSessionsForDay, SCHEDULE } from "@/lib/schedule";
import { SkyBackground } from "@/components/SkyBackground";
import { Header } from "@/components/Header";
import { DayTabs } from "@/components/DayTabs";
import { SessionList } from "@/components/SessionList";
import { ContextualMessage } from "@/components/ContextualMessage";

export default function Home() {
  const now = useCurrentTime();
  const eventState = getEventState(now);
  const autoDayIndex = getCurrentDayIndex(now);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const dayIndex = selectedDay ?? autoDayIndex;
  const sessions = getSessionsForDay(dayIndex);

  return (
    <>
      <SkyBackground now={now} />

      <main className="relative min-h-screen flex flex-col max-w-[440px] mx-auto">
        <Header />

        <ContextualMessage eventState={eventState} now={now} />

        <DayTabs
          activeIndex={dayIndex}
          onSelect={(index) => setSelectedDay(index)}
        />

        {/* MC info */}
        <p className="text-center text-[10px] text-cream/30 mb-2">
          MC: {SCHEDULE[dayIndex].mc}
        </p>

        <SessionList sessions={sessions} now={now} />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify the full schedule renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Sky background renders with gradient
- Logo header shows "SAPPHIRE MOMENTUM II"
- Day tabs work — clicking switches between Cuma/Cumartesi/Pazar
- Session cards render with correct titles, speakers, times
- Status badges show (will show "upcoming" for all since the event is in the past/future)
- Contextual message shows for the current event state

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble main page with sky, schedule, and time engine"
```

---

## Task 10: Boarding Intro Animation

**Files:**
- Create: `src/components/BoardingIntro.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement BoardingIntro component**

Create `src/components/BoardingIntro.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardingIntroProps {
  onComplete: () => void;
}

export function BoardingIntro({ onComplete }: BoardingIntroProps) {
  const [phase, setPhase] = useState<"void" | "card" | "reveal" | "done">(
    "void"
  );

  // Check if this is a repeat visit
  const isRepeat =
    typeof window !== "undefined" &&
    localStorage.getItem("sapphire-visited") === "true";

  useEffect(() => {
    if (isRepeat) {
      // Fast version — 0.5s flash then done
      setPhase("card");
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Full sequence
    const timers = [
      setTimeout(() => setPhase("card"), 500),
      setTimeout(() => setPhase("reveal"), 1800),
      setTimeout(() => {
        setPhase("done");
        localStorage.setItem("sapphire-visited", "true");
        onComplete();
      }, 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isRepeat, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#020a3a" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Phase: void — single warm light */}
          {phase === "void" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-1 h-1 rounded-full bg-gold-light"
              style={{ boxShadow: "0 0 30px 10px rgba(237,210,157,0.15)" }}
            />
          )}

          {/* Phase: card — boarding pass */}
          {(phase === "card" || phase === "reveal") && (
            <motion.div
              initial={isRepeat ? { opacity: 0.7, scale: 0.98 } : { opacity: 0, scale: 0.95 }}
              animate={
                phase === "reveal"
                  ? { opacity: 0, scale: 0.7, y: -100 }
                  : { opacity: isRepeat ? 0.7 : 1, scale: 1 }
              }
              transition={{
                duration: phase === "reveal" ? 0.7 : 0.8,
                ease: "easeInOut",
              }}
              className="bg-white/[0.07] border border-gold/20 rounded-xl p-7 text-center backdrop-blur-xl max-w-[280px] w-full"
              style={{
                boxShadow: "0 15px 50px rgba(0,0,0,0.4)",
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isRepeat ? 0 : 0.1, duration: 0.3 }}
                className="text-[8px] tracking-[0.3em] text-cream/30 mb-4"
              >
                BİNİŞ KARTI • BOARDING PASS
              </motion.p>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isRepeat ? 0 : 0.2, duration: 0.3 }}
                className="text-[28px] font-extrabold tracking-[0.08em] text-cream"
              >
                SAPPHIRE
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isRepeat ? 0 : 0.25, duration: 0.3 }}
                className="text-[13px] font-light tracking-[0.3em] text-gold mt-0.5"
              >
                MOMENTUM II
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: isRepeat ? 0 : 0.4, duration: 0.4 }}
                className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-5"
              />

              {/* Details row */}
              <div className="flex justify-between text-center">
                {[
                  { label: "TARİH", value: "24-26 NİSAN", delay: 0.5 },
                  { label: "KONUM", value: "ANTALYA", delay: 0.65 },
                  { label: "KAPI", value: "A1", delay: 0.8 },
                ].map((detail) => (
                  <motion.div
                    key={detail.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: isRepeat ? 0 : detail.delay,
                      duration: 0.3,
                    }}
                  >
                    <p className="text-[8px] tracking-[0.15em] text-cream/25 mb-1">
                      {detail.label}
                    </p>
                    <p className="text-[11px] tracking-[0.1em] text-cream/70">
                      {detail.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isRepeat ? 0 : 0.95, duration: 0.3 }}
                className="text-[10px] tracking-[0.2em] text-gold mt-5"
              >
                ✈ HOŞ GELDİNİZ
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Integrate BoardingIntro into page.tsx**

Edit `src/app/page.tsx` — add the import and state:

Add to imports at top:

```tsx
import { useCallback } from "react";
import { BoardingIntro } from "@/components/BoardingIntro";
```

Add state inside the `Home` component, before `return`:

```tsx
const [introComplete, setIntroComplete] = useState(false);
const handleIntroComplete = useCallback(() => setIntroComplete(true), []);
```

Add `BoardingIntro` as the first child inside the `<>` fragment, before `<SkyBackground>`:

```tsx
{!introComplete && <BoardingIntro onComplete={handleIntroComplete} />}
```

Add to the `useState` import (replace existing):

```tsx
import { useState, useCallback } from "react";
```

- [ ] **Step 3: Verify the boarding sequence**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Dark void appears for ~0.5s with a warm light dot
- Boarding pass card fades in with staggered details
- Card floats up and the sky reveals behind
- Schedule cascades in
- Clear localStorage and reload to see full intro again: run `localStorage.removeItem('sapphire-visited')` in console

- [ ] **Step 4: Commit**

```bash
git add src/components/BoardingIntro.tsx src/app/page.tsx
git commit -m "feat: add boarding pass intro animation with first/repeat visit detection"
```

---

## Task 11: Push Notifications

**Files:**
- Create: `src/lib/notifications.ts`, `src/components/NotificationPrompt.tsx`, `public/sw.js`, `src/app/manifest.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement notification helpers**

Create `src/lib/notifications.ts`:

```ts
import { SCHEDULE } from "./schedule";

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (error) {
    console.error("SW registration failed:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function getNotificationPreference(): "granted" | "denied" | "undecided" {
  const stored = localStorage.getItem("sapphire-notification-pref");
  if (stored === "dismissed") return "denied";
  if ("Notification" in window && Notification.permission === "granted") return "granted";
  return "undecided";
}

export function dismissNotificationPrompt(): void {
  localStorage.setItem("sapphire-notification-pref", "dismissed");
}

export function scheduleNotifications(): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();

  SCHEDULE.forEach((day) => {
    day.sessions.forEach((session) => {
      if (!session.speaker || !session.start) return;

      const sessionDate = new Date(`${day.date}T${session.start}:00+03:00`);

      // 5-minute reminder
      const reminderTime = sessionDate.getTime() - 5 * 60 * 1000;
      const reminderDelay = reminderTime - now.getTime();

      if (reminderDelay > 0 && reminderDelay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification("⏱ 5 dk sonra", {
            body: `${session.title} — ${session.speaker}`,
            icon: "/logos/icon-192.png",
            tag: `reminder-${session.start}`,
          });
        }, reminderDelay);
      }

      // Now live notification
      const liveDelay = sessionDate.getTime() - now.getTime();

      if (liveDelay > 0 && liveDelay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification("✈ Şimdi", {
            body: `${session.title} — ${session.speaker}`,
            icon: "/logos/icon-192.png",
            tag: `live-${session.start}`,
          });
        }, liveDelay);
      }
    });
  });
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  );
}
```

- [ ] **Step 2: Create Service Worker**

Create `public/sw.js`:

```js
// Service Worker for Sapphire Momentum II
// Handles caching and notification re-scheduling on activation

const CACHE_NAME = "sapphire-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main thread to schedule notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATIONS") {
    // Re-schedule notifications when page regains focus
    // The main thread handles the actual scheduling via setTimeout
    // This SW primarily enables the Notification API and caching
  }
});

// Basic offline caching for the schedule page
self.addEventListener("fetch", (event) => {
  // Network-first strategy for the single page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

- [ ] **Step 3: Implement NotificationPrompt component**

Create `src/components/NotificationPrompt.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotificationPreference,
  requestNotificationPermission,
  dismissNotificationPrompt,
  scheduleNotifications,
  isIOS,
  isStandalone,
} from "@/lib/notifications";

interface NotificationPromptProps {
  show: boolean;
}

export function NotificationPrompt({ show }: NotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!show) return;

    const pref = getNotificationPreference();
    if (pref === "undecided") {
      // Small delay after intro completes
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleAccept = async () => {
    if (isIOS() && !isStandalone()) {
      setShowIOSGuide(true);
      return;
    }

    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleNotifications();
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissNotificationPrompt();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 inset-x-0 z-40 p-4"
        >
          <div className="max-w-[440px] mx-auto bg-white/[0.08] backdrop-blur-xl border border-gold/20 rounded-xl p-5">
            {showIOSGuide ? (
              <>
                <p className="text-sm font-semibold text-cream mb-2">
                  Bildirimleri almak için Ana Ekrana ekleyin
                </p>
                <div className="text-xs text-cream/60 space-y-2">
                  <p>1. Alttaki paylaş butonuna (↑) dokunun</p>
                  <p>2. &quot;Ana Ekrana Ekle&quot; seçeneğini bulun</p>
                  <p>3. &quot;Ekle&quot;ye dokunun</p>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="mt-4 w-full py-2 text-sm text-cream/50 rounded-lg"
                >
                  Anladım
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-cream mb-3">
                  Oturum hatırlatıcılarını açmak ister misiniz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 py-2.5 bg-gold/20 border border-gold/30 rounded-lg text-sm font-semibold text-gold-light"
                  >
                    Evet, hatırlat
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 bg-white/5 rounded-lg text-sm text-cream/50"
                  >
                    Şimdi değil
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Create PWA manifest**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sapphire Momentum II",
    short_name: "Sapphire II",
    description: "24-26 Nisan | Kremlin Palace, Antalya",
    start_url: "/",
    display: "standalone",
    background_color: "#030d5f",
    theme_color: "#030d5f",
    icons: [
      {
        src: "/logos/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logos/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

- [ ] **Step 5: Integrate notifications into page.tsx**

Add import to `src/app/page.tsx`:

```tsx
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { registerServiceWorker, scheduleNotifications, getNotificationPreference } from "@/lib/notifications";
```

Add a `useEffect` inside the `Home` component for SW registration:

```tsx
useEffect(() => {
  registerServiceWorker().then(() => {
    if (getNotificationPreference() === "granted") {
      scheduleNotifications();
    }
  });
}, []);
```

Add the `NotificationPrompt` component before the closing `</>`:

```tsx
<NotificationPrompt show={introComplete} />
```

Add a `useEffect` to re-schedule notifications on page focus (handles SW termination):

```tsx
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === "visible" && getNotificationPreference() === "granted") {
      scheduleNotifications();
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}, []);
```

- [ ] **Step 6: Create placeholder icon files**

```bash
mkdir -p public/logos
```

Create a simple SVG icon that can serve as the PWA icon (we'll optimize real logos later):

```bash
echo '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect fill="#030d5f" width="192" height="192" rx="24"/><text x="96" y="96" text-anchor="middle" dominant-baseline="central" fill="#b39369" font-size="48" font-weight="800" font-family="system-ui">S</text></svg>' > public/logos/icon-192.svg
```

Note: Proper PNG icons should be generated from the brand SVG logos before production deploy.

- [ ] **Step 7: Verify notifications prompt**

```bash
npm run dev
```

Open `http://localhost:3000`. After the boarding intro, the notification prompt should slide up from the bottom after 1.5s. Test both buttons.

- [ ] **Step 8: Commit**

```bash
git add src/lib/notifications.ts src/components/NotificationPrompt.tsx public/sw.js src/app/manifest.ts src/app/page.tsx public/logos/
git commit -m "feat: add push notification system with service worker, prompt, and PWA manifest"
```

---

## Task 12: Responsive Polish & Performance

**Files:**
- Modify: `src/styles/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Add responsive utilities to global CSS**

Add to the end of `src/styles/globals.css`:

```css
/* Scrollbar styling for the session list */
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
  -webkit-tap-highlight-color: transparent;
}

/* Safe area insets for notched phones */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 2: Add scrollbar-hide to SessionList**

Edit `src/components/SessionList.tsx` — update the outer div className:

Change:
```tsx
<div ref={listRef} className="flex-1 overflow-y-auto pb-8 pt-1">
```
To:
```tsx
<div ref={listRef} className="flex-1 overflow-y-auto pb-8 pt-1 scrollbar-hide">
```

- [ ] **Step 3: Verify responsive behavior**

```bash
npm run dev
```

Test at these widths using browser DevTools:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 414px (iPhone 14 Plus)
- 768px (iPad — should center content)
- 1440px (Desktop — content centered, expansive sky)

- [ ] **Step 4: Run build to check for errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/styles/globals.css src/components/SessionList.tsx
git commit -m "feat: add responsive polish, scrollbar hiding, and safe area support"
```

---

## Task 13: Production Readiness

**Files:**
- Modify: `src/app/layout.tsx`, `next.config.ts`

- [ ] **Step 1: Add Open Graph metadata**

Edit `src/app/layout.tsx` — update the `metadata` export:

```ts
export const metadata: Metadata = {
  title: "Sapphire Momentum II",
  description: "24-26 Nisan 2025 | Kremlin Palace, Antalya | Xaura Global",
  openGraph: {
    title: "Sapphire Momentum II",
    description: "24-26 Nisan 2025 | Kremlin Palace, Antalya",
    type: "website",
  },
};
```

- [ ] **Step 2: Configure next.config.ts for production**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/fonts/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache",
        },
      ],
    },
  ],
};

export default nextConfig;
```

- [ ] **Step 3: Final build verification**

```bash
npm run build && npm run start
```

Open `http://localhost:3000`. Full end-to-end check:
- Boarding intro plays
- Sky background renders
- Day tabs switch
- Session cards display with correct statuses
- Notification prompt appears
- Responsive at all breakpoints

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx next.config.ts
git commit -m "feat: add OG metadata, production headers, and cache configuration"
```

---

## Task 14: Deploy to Vercel

- [ ] **Step 1: Install Vercel CLI**

```bash
npm i -g vercel
```

- [ ] **Step 2: Deploy preview**

```bash
vercel
```

Follow the prompts to link the project. Verify the preview deployment loads correctly.

- [ ] **Step 3: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 4: Verify production deployment**

Open the production URL. Full check:
- Boarding intro → schedule → sky background → day tabs → session cards
- Mobile responsive
- Notification prompt works
- Performance: run Lighthouse audit (target: 90+ mobile)

- [ ] **Step 5: Commit deployment config**

```bash
git add .vercel
git commit -m "chore: add Vercel project configuration"
```
