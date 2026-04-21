# PWA Homescreen Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sapphire Momentum II site installable as a PWA with the x2 emblem appearing as the homescreen icon on both Android and iOS.

**Architecture:** A one-time script generates icon PNGs from `public/x2-emblem.png` using Sharp. Next.js's native `app/manifest.ts` serves the web app manifest. A minimal service worker satisfies Android Chrome's installability requirement and is registered by a `'use client'` component mounted in the root layout.

**Tech Stack:** Next.js 16 App Router, Sharp (devDependency), native browser Service Worker API

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `scripts/generate-icons.ts` | One-time script: reads x2-emblem.png, writes 3 icon sizes |
| Create | `public/icons/icon-192.png` | Android minimum icon (generated) |
| Create | `public/icons/icon-512.png` | Android splash + maskable icon (generated) |
| Create | `public/icons/apple-touch-icon.png` | iOS homescreen icon 180×180 (generated) |
| Create | `app/manifest.ts` | Web app manifest via Next.js Metadata API |
| Create | `public/sw.js` | Minimal service worker for Android installability |
| Create | `components/PwaInit.tsx` | Client component that registers the service worker |
| Modify | `app/layout.tsx` | Add apple-touch-icon metadata + mount `<PwaInit />` |

---

## Task 1: Install Sharp and generate icons

**Files:**
- Create: `scripts/generate-icons.ts`
- Create: `public/icons/` (directory, via script)

- [ ] **Step 1: Install Sharp as a devDependency**

```bash
npm install -D sharp
```

Expected output: `added 1 package` (or similar). Sharp may already be present as a transitive Next.js dependency — if so, it just gets pinned as explicit devDep.

- [ ] **Step 2: Create the icon generation script**

Create `scripts/generate-icons.ts` with this exact content:

```ts
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const src = path.join(process.cwd(), 'public', 'x2-emblem.png')
const outDir = path.join(process.cwd(), 'public', 'icons')

fs.mkdirSync(outDir, { recursive: true })

await sharp(src).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'))
await sharp(src).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'))
await sharp(src).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'))

console.log('Icons generated in public/icons/')
```

- [ ] **Step 3: Run the script**

```bash
npx tsx scripts/generate-icons.ts
```

Expected output:
```
Icons generated in public/icons/
```

- [ ] **Step 4: Verify the output files exist**

```bash
ls -lh public/icons/
```

Expected: three files — `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — each non-zero bytes.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-icons.ts public/icons/
git commit -m "feat: add icon generation script and generate PWA icons from x2 emblem"
```

---

## Task 2: Create the Web App Manifest

**Files:**
- Create: `app/manifest.ts`

- [ ] **Step 1: Create `app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sapphire Momentum II',
    short_name: 'Sapphire',
    description: 'Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#06091a',
    background_color: '#06091a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

Next.js automatically:
- Serves this at `/manifest.webmanifest`
- Injects `<link rel="manifest" href="/manifest.webmanifest">` into `<head>`

No changes to `next.config.ts` needed.

- [ ] **Step 2: Start dev server and verify manifest is served**

```bash
npm run dev
```

In a second terminal:

```bash
curl http://localhost:3000/manifest.webmanifest
```

Expected: JSON with `name`, `short_name`, `icons` array.

- [ ] **Step 3: Commit**

```bash
git add app/manifest.ts
git commit -m "feat: add PWA web app manifest via Next.js Metadata API"
```

---

## Task 3: Create the minimal service worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Create `public/sw.js`**

```js
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
```

This is intentionally minimal. Its only purpose is satisfying Android Chrome's requirement that a PWA has a registered service worker before it shows the "Add to Home Screen" prompt. No caching is added — that's future work if offline support becomes a goal.

- [ ] **Step 2: Verify the file is reachable**

With `npm run dev` running:

```bash
curl http://localhost:3000/sw.js
```

Expected: the two lines of JS above.

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat: add minimal service worker for PWA installability"
```

---

## Task 4: Create the PwaInit component

**Files:**
- Create: `components/PwaInit.tsx`

- [ ] **Step 1: Create `components/PwaInit.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

export default function PwaInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  return null
}
```

This component renders nothing visible. It exists only to run the `serviceWorker.register` call on the client after hydration. The `.catch(console.error)` surfaces registration failures in DevTools without crashing the app.

This is also the designated location for future push notification subscription logic.

- [ ] **Step 2: Commit**

```bash
git add components/PwaInit.tsx
git commit -m "feat: add PwaInit client component to register service worker"
```

---

## Task 5: Wire everything into the root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaInit from '@/components/PwaInit'

export const metadata: Metadata = {
  title: 'Sapphire Momentum II — Program',
  description: 'Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya',
  openGraph: {
    title: 'Sapphire Momentum II',
    description: '24–26 Nisan 2026 · Kremlin Palace, Antalya',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#06091a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <PwaInit />
        {children}
      </body>
    </html>
  )
}
```

Two changes from the original:
1. `icons: { apple: '/icons/apple-touch-icon.png' }` added to metadata — injects `<link rel="apple-touch-icon">` for iOS Safari
2. `<PwaInit />` mounted inside `<body>` — registers the service worker on client

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: build completes with no errors. You may see a warning about the service worker not being pre-cached — that's fine.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wire PWA manifest, apple icon, and service worker into root layout"
```

---

## Task 6: Verify end-to-end

No automated tests exist in this project. Verification is manual.

- [ ] **Step 1: Run the production build locally**

```bash
npm run build && npm run start
```

- [ ] **Step 2: Open Chrome DevTools → Application tab**

Navigate to `http://localhost:3000`. In DevTools:
- **Application → Manifest:** Should show name "Sapphire Momentum II", icons listed, display "standalone"
- **Application → Service Workers:** Should show `sw.js` as "activated and running"

- [ ] **Step 3: Run Lighthouse PWA audit**

In Chrome DevTools → Lighthouse tab:
- Select "Progressive Web App" category
- Run audit on `http://localhost:3000`

Expected: passes all "Installable" checks. The "PWA Optimized" section may flag missing offline support — that's acceptable and matches our non-goals.

- [ ] **Step 4: Test on a real device (optional but recommended before deploying)**

**Android (Chrome):**
1. Visit the deployed URL
2. Three-dot menu → "Add to Home Screen"
3. Confirm: x2 emblem appears on homescreen, app opens in standalone mode (no browser chrome)

**iOS (Safari):**
1. Visit the deployed URL
2. Share button → "Add to Home Screen"
3. Confirm: x2 emblem appears as the icon
