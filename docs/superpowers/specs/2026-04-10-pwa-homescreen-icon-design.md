# PWA Homescreen Icon — Design Spec

**Date:** 2026-04-10  
**Project:** Sapphire Momentum II  
**Scope:** Make the app installable as a PWA with the x2 emblem as the homescreen icon. Push notification delivery is out of scope (future work).

---

## Goals

- Users who visit the site on Android or iOS can add it to their homescreen
- The homescreen icon shows `x2-emblem.png`
- Android Chrome shows the native "Add to Home Screen" install prompt
- iOS Safari uses the correct icon via `apple-touch-icon`
- The codebase is set up cleanly for push notification subscription logic to be added later

## Non-Goals

- Push notification delivery (scheduled for a future iteration)
- Offline caching / offline experience
- App store submission

---

## Architecture

### 1. Icon Generation Script

**File:** `scripts/generate-icons.ts`  
**Run once manually:** `npx tsx scripts/generate-icons.ts`

Uses Sharp to read `public/x2-emblem.png` and output:

| Output file | Size | Purpose |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | Android required minimum |
| `public/icons/icon-512.png` | 512×512 | Android splash screen |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS homescreen |

Add `sharp` as a `devDependency` (`npm install -D sharp`). Next.js also bundles Sharp internally, but the script needs it explicitly available to run via `npx tsx`.

### 2. Web App Manifest

**File:** `app/manifest.ts`

Uses Next.js 13+ `MetadataRoute.Manifest` return type (native Metadata API, no extra config needed).

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sapphire Momentum II",
    short_name: "Sapphire",
    description: "Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#06091a",
    background_color: "#06091a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // Note: maskable icons require the subject to be within the inner 80% safe zone.
      // Reusing icon-512.png is acceptable for installability; a dedicated maskable
      // variant with padding can be added later if Android launcher cropping is an issue.
    ],
  }
}
```

Next.js automatically serves this at `/manifest.webmanifest` and injects the `<link rel="manifest">` tag.

### 3. Apple Touch Icon

Add to `app/layout.tsx` metadata:

```ts
icons: {
  apple: "/icons/apple-touch-icon.png",
}
```

This injects `<link rel="apple-touch-icon">` for iOS Safari.

### 4. Service Worker

**File:** `public/sw.js`

Minimal service worker — no caching. Its only purpose is satisfying Android Chrome's PWA installability requirement.

```js
self.addEventListener('install', (e) => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
```

### 5. PWA Init Component

**File:** `components/PwaInit.tsx`  
**Directive:** `'use client'`

Registers the service worker on mount via `useEffect`. Mounted once in `app/layout.tsx` inside `<body>`.

```tsx
'use client'
import { useEffect } from 'react'

export default function PwaInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])
  return null
}
```

This component is the designated future home for push notification subscription logic (requesting permission, sending the subscription to a backend endpoint).

---

## File Changes Summary

| Action | File |
|---|---|
| Create | `scripts/generate-icons.ts` |
| Create | `public/icons/icon-192.png` (generated) |
| Create | `public/icons/icon-512.png` (generated) |
| Create | `public/icons/apple-touch-icon.png` (generated) |
| Create | `app/manifest.ts` |
| Create | `public/sw.js` |
| Create | `components/PwaInit.tsx` |
| Modify | `app/layout.tsx` — add apple icon metadata + mount `<PwaInit />` |

---

## Testing

- **Android Chrome:** Visit site → three-dot menu → "Add to Home Screen" (or automatic install banner). Icon should appear on homescreen.
- **iOS Safari:** Visit site → Share → "Add to Home Screen". Icon should be the x2 emblem.
- **Lighthouse:** Run PWA audit — should pass installability checks.

---

## Future: Push Notifications

When ready, `components/PwaInit.tsx` is extended to:
1. Call `Notification.requestPermission()` after a suitable trigger (e.g., user taps a button, or after first session view)
2. Call `navigator.serviceWorker.ready` to get the registration
3. Subscribe with `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
4. POST the subscription object to a backend API route
5. Backend uses a Web Push library to send notifications 10 minutes before each session

The service worker (`public/sw.js`) will need a `push` event listener added at that point.
