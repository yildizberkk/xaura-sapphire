# Logo Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Xaura Global company logo to the Timeline footer and the ×2 anniversary emblem to the BoardingPass header, replacing the existing plain text in both spots.

**Architecture:** Both source SVGs contain embedded base64 PNG images. Extract each PNG to `public/`, then swap the relevant JSX in two components to use Next.js `<Image>` which auto-serves optimized WebP at display size. No new components needed — two targeted edits.

**Tech Stack:** Next.js 16 `next/image`, CSS Modules, bash for PNG extraction

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `public/x2-emblem.png` | Create | ×2 anniversary emblem, extracted from source SVG |
| `public/xaura-logo.png` | Create | Xaura company logo, extracted from source SVG |
| `components/BoardingPass.tsx` | Modify | Swap `<span className={styles.airline}>` for `<Image>` |
| `components/BoardingPass.module.css` | Modify | Remove `.airline`, add `.emblemImg`, fix header alignment |
| `components/Timeline.tsx` | Modify | Swap footer text `<div>` for `<Image>` |
| `components/Timeline.module.css` | Modify | Replace `.footerText` with `.footerLogo` |

---

### Task 1: Extract PNGs from source SVGs

**Files:**
- Create: `public/x2-emblem.png`
- Create: `public/xaura-logo.png`

- [ ] **Step 1: Extract ×2 emblem PNG**

```bash
grep -o 'base64,[A-Za-z0-9+/=]*' \
  "website_materials_given/Başlıksız-1_x2 logo.svg" \
  | head -1 \
  | sed 's/base64,//' \
  | base64 -d > public/x2-emblem.png
```

- [ ] **Step 2: Verify ×2 emblem**

```bash
file public/x2-emblem.png
```

Expected output: `public/x2-emblem.png: PNG image data, 2110 x 2112, 8-bit/color RGBA, non-interlaced`

- [ ] **Step 3: Extract Xaura logo PNG**

```bash
grep -o 'base64,[A-Za-z0-9+/=]*' \
  "website_materials_given/Başlıksız-1_xaura logo.svg" \
  | head -1 \
  | sed 's/base64,//' \
  | base64 -d > public/xaura-logo.png
```

- [ ] **Step 4: Verify Xaura logo**

```bash
file public/xaura-logo.png
```

Expected output: `public/xaura-logo.png: PNG image data, 2500 x 1250, 8-bit/color RGBA, non-interlaced`

- [ ] **Step 5: Commit**

```bash
git add public/x2-emblem.png public/xaura-logo.png
git commit -m "feat: add extracted logo PNGs to public assets"
```

---

### Task 2: ×2 emblem in BoardingPass header

**Files:**
- Modify: `components/BoardingPass.tsx` (lines 34–37)
- Modify: `components/BoardingPass.module.css` (lines 16–29)

- [ ] **Step 1: Update BoardingPass.tsx**

Add `import Image from 'next/image'` after the existing imports, then replace the `<span className={styles.airline}>Xaura Global</span>` with an `<Image>`.

Full updated import block and header JSX (lines 1–37 of the file):

```tsx
// components/BoardingPass.tsx
'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Day } from '@/lib/schedule'
import DayTabs from './DayTabs'
import styles from './BoardingPass.module.css'
```

Replace this JSX:
```tsx
        <div className={styles.header}>
          <span className={styles.airline}>Xaura Global</span>
          <span className={styles.bpLabel}>Boarding Pass</span>
        </div>
```

With:
```tsx
        <div className={styles.header}>
          <Image
            src="/x2-emblem.png"
            alt="Sapphire Momentum II ×2"
            width={38}
            height={38}
            className={styles.emblemImg}
          />
          <span className={styles.bpLabel}>Boarding Pass</span>
        </div>
```

- [ ] **Step 2: Update BoardingPass.module.css**

Replace:
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.airline {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: var(--blue-mid);
  text-transform: uppercase;
}
```

With:
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.emblemImg {
  width: 38px;
  height: 38px;
  object-fit: contain;
  display: block;
}
```

- [ ] **Step 3: Visual check**

Run `npm run dev` and open the app. The BoardingPass header should show the ×2 emblem image on the left and "Boarding Pass" label on the right. No "Xaura Global" text should be visible.

- [ ] **Step 4: Commit**

```bash
git add components/BoardingPass.tsx components/BoardingPass.module.css
git commit -m "feat: replace airline text with x2 emblem in BoardingPass header"
```

---

### Task 3: Xaura logo in Timeline footer

**Files:**
- Modify: `components/Timeline.tsx` (lines 109–111)
- Modify: `components/Timeline.module.css` (lines 76–82)

- [ ] **Step 1: Update Timeline.tsx**

Add `import Image from 'next/image'` after the existing imports:

```tsx
// components/Timeline.tsx
'use client'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClassifiedSession } from '@/lib/schedule'
import SessionRow from './SessionRow'
import styles from './Timeline.module.css'
```

Replace this JSX:
```tsx
      <div className={styles.footer}>
        <div className={styles.footerText}>Xaura Global · Sapphire Momentum II · Nisan 2026</div>
      </div>
```

With:
```tsx
      <div className={styles.footer}>
        <Image
          src="/xaura-logo.png"
          alt="Xaura Global"
          width={110}
          height={55}
          className={styles.footerLogo}
        />
      </div>
```

- [ ] **Step 2: Update Timeline.module.css**

Replace:
```css
.footerText {
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.28em;
  color: var(--c15);
  text-transform: uppercase;
}
```

With:
```css
.footerLogo {
  width: 110px;
  height: 55px;
  opacity: 0.75;
  display: block;
  margin: 0 auto;
}
```

- [ ] **Step 3: Visual check**

Open the app. Scroll to the bottom of the Timeline. The footer should show the Xaura logo image at 75% opacity, centered, instead of the text line.

- [ ] **Step 4: Commit**

```bash
git add components/Timeline.tsx components/Timeline.module.css
git commit -m "feat: replace footer text with Xaura logo in Timeline"
```
