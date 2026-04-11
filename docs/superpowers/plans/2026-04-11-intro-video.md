# Intro Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a cinematic 8-second aerial night video of Kremlin Palace via fal.ai, then wire it as a first-visit fullscreen intro overlay in the Next.js site.

**Architecture:** A one-time Node.js generation script produces `public/intro.mp4` by chaining Flux 2 Pro (2 images) → Kling v3 Pro (video). A self-contained `IntroVideo` client component checks `localStorage` on mount, shows the video fullscreen with a skip button, then fades out and unmounts so the main site appears normally.

**Tech Stack:** `@fal-ai/client`, `tsx` (script runner), Next.js App Router, Framer Motion (already installed), CSS Modules

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/generate-intro-video.ts` | Create | One-time CLI: calls Flux 2 Pro × 2, then Kling, saves MP4 |
| `public/intro.mp4` | Create (generated) | Static video asset served by Next.js |
| `components/IntroVideo.tsx` | Create | Fullscreen overlay: localStorage gate, video, skip, fade out |
| `components/IntroVideo.module.css` | Create | Overlay layout + skip button styles |
| `app/client-page.tsx` | Modify | Mount IntroVideo at top of tree |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @fal-ai/client and tsx**

```bash
npm install @fal-ai/client
npm install --save-dev tsx
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('@fal-ai/client')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @fal-ai/client and tsx for intro video generation"
```

---

## Task 2: Video generation script

**Files:**
- Create: `scripts/generate-intro-video.ts`

- [ ] **Step 1: Create the generation script**

Create `scripts/generate-intro-video.ts` with this exact content:

```typescript
import { fal } from '@fal-ai/client'
import { writeFileSync } from 'fs'

fal.config({ credentials: process.env.FAL_API_KEY })

const START_PROMPT = `Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 800 meters altitude directly above. The night sky is deep midnight blue-black (#030d5f), fading into dark cobalt (#2b457a) near the horizon. The dense Lara Beach city grid glows with warm amber-gold lights (#edd29d, #cdad70), the hotel complex itself radiating a warmer bronze-gold light (#af9055). Multiple large swimming pools scatter across the resort, each shimmering with vivid electric sapphire blue (#3d82ff). A thin cobalt atmospheric haze (#5c89d1) softens the light spread across the city. The dark Mediterranean sea (#030d5f to #2b457a) is visible at the frame edges. Photorealistic drone photography, cinematic, no plane, no people, no text.`

const END_PROMPT = `Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 200 meters altitude directly above. The grand resort architecture fills most of the frame with warm bronze-gold illumination (#af9055, #d0b275). Multiple large luxurious swimming pools glow intensely with electric sapphire blue light (#3d82ff) — clearly defined and prominent. Surrounding Lara Beach city lights (#edd29d) are visible but peripheral, the hotel dominating the composition. Dark Mediterranean sea (#030d5f) barely visible at extreme edges. The deep night sky (#030d5f) is only a thin strip. Cobalt atmospheric glow (#5c89d1) emanates from the resort. Photorealistic drone photography, cinematic, no plane, no people, no text.`

const VIDEO_PROMPT = `Extremely slow and perfectly smooth vertical aerial descent from 800 meters down to 200 meters, zero camera shake, steady dolly-down movement, no drift or lateral movement. The deep midnight navy sky (#030d5f) gradually recedes as the warm gold city lights (#edd29d, #cdad70) of Lara Beach grow larger and more detailed. The Kremlin Palace resort rises to dominate the frame, its bronze-gold light (#af9055) intensifying, electric sapphire blue pools (#3d82ff) shimmering and expanding. A soft cobalt atmospheric haze (#5c89d1) pulses gently over the city. The dark cobalt Mediterranean sea (#2b457a, #030d5f) slowly disappears to the edges. IMAX aerial drone cinematography, luxury travel documentary, breathtaking arrival, awe-inspiring.`

const NEGATIVE_PROMPT = `camera shake, fast movement, quick cut, daylight, sunrise, sunset, people, text, watermark, airplane, helicopter, blur, distortion, low quality, overexposed, washed out colors, desaturated, gray tones`

async function generateImage(prompt: string, label: string): Promise<string> {
  console.log(`\n[${label}] Generating image with Flux 2 Pro...`)
  const result = await fal.subscribe('fal-ai/flux-2-pro', {
    input: {
      prompt,
      image_size: 'portrait_16_9',
      seed: 42,
      output_format: 'jpeg',
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        update.logs?.map((log: { message: string }) => log.message).forEach(console.log)
      }
    },
  })
  const url = (result.data as { images: { url: string }[] }).images[0].url
  console.log(`[${label}] Done: ${url}`)
  return url
}

async function generateVideo(startImageUrl: string, endImageUrl: string): Promise<string> {
  console.log('\n[VIDEO] Generating video with Kling v3 Pro...')
  const result = await fal.subscribe('fal-ai/kling-video/v3/pro/image-to-video', {
    input: {
      prompt: VIDEO_PROMPT,
      start_image_url: startImageUrl,
      end_image_url: endImageUrl,
      duration: '8',
      generate_audio: false,
      cfg_scale: 0.7,
      negative_prompt: NEGATIVE_PROMPT,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        update.logs?.map((log: { message: string }) => log.message).forEach(console.log)
      }
    },
  })
  const url = (result.data as { video: { url: string } }).video.url
  console.log(`[VIDEO] Done: ${url}`)
  return url
}

async function downloadMp4(url: string, dest: string): Promise<void> {
  console.log(`\n[DOWNLOAD] Saving to ${dest}...`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  const buffer = await response.arrayBuffer()
  writeFileSync(dest, Buffer.from(buffer))
  console.log(`[DOWNLOAD] Saved ${buffer.byteLength} bytes`)
}

async function main() {
  if (!process.env.FAL_API_KEY) {
    console.error('FAL_API_KEY not set in environment')
    process.exit(1)
  }

  const startImageUrl = await generateImage(START_PROMPT, 'START IMAGE')
  const endImageUrl   = await generateImage(END_PROMPT,   'END IMAGE')
  const videoUrl      = await generateVideo(startImageUrl, endImageUrl)
  await downloadMp4(videoUrl, 'public/intro.mp4')

  console.log('\n✓ Done. public/intro.mp4 is ready.')
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Add script to package.json**

In `package.json`, add to `"scripts"`:

```json
"generate:intro": "dotenv -e .env.local -- tsx scripts/generate-intro-video.ts"
```

Install dotenv-cli so the .env.local is loaded:

```bash
npm install --save-dev dotenv-cli
git add package.json package-lock.json scripts/generate-intro-video.ts
git commit -m "feat: add intro video generation script"
```

---

## Task 3: Run the generation script

**Files:**
- Create: `public/intro.mp4` (generated output)

> ⏱ This task takes 3–8 minutes. Kling video generation queues can be slow.

- [ ] **Step 1: Run the script**

```bash
npm run generate:intro
```

Expected output (condensed):
```
[START IMAGE] Generating image with Flux 2 Pro...
[START IMAGE] Done: https://...fal.media/...jpeg
[END IMAGE] Generating image with Flux 2 Pro...
[END IMAGE] Done: https://...fal.media/...jpeg
[VIDEO] Generating video with Kling v3 Pro...
[VIDEO] Done: https://...fal.media/...mp4
[DOWNLOAD] Saving to public/intro.mp4...
[DOWNLOAD] Saved XXXXXXX bytes
✓ Done. public/intro.mp4 is ready.
```

- [ ] **Step 2: Verify the file exists and is a valid MP4**

```bash
ls -lh public/intro.mp4
```

Expected: file of several MB (typically 5–15MB for 8s video).

Play it to confirm it looks right before continuing.

- [ ] **Step 3: Add intro.mp4 to .gitignore (large binary)**

Add to `.gitignore`:

```
public/intro.mp4
```

If the video looks good, you may choose to commit it anyway for deployment. But do not commit it by default — it's a large binary that should be uploaded to a CDN or Vercel Blob instead.

```bash
git add .gitignore
git commit -m "chore: gitignore generated intro.mp4"
```

---

## Task 4: IntroVideo component

**Files:**
- Create: `components/IntroVideo.tsx`
- Create: `components/IntroVideo.module.css`

- [ ] **Step 1: Create the CSS module**

Create `components/IntroVideo.module.css`:

```css
/* components/IntroVideo.module.css */

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #06091a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.skip {
  position: absolute;
  bottom: max(2rem, env(safe-area-inset-bottom, 2rem));
  right: 1.5rem;
  background: rgba(244, 243, 239, 0.12);
  border: 1px solid rgba(244, 243, 239, 0.25);
  color: rgba(244, 243, 239, 0.7);
  font-family: 'Gilroy', 'Helvetica Neue', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  padding: 0.45rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.skip:hover {
  background: rgba(244, 243, 239, 0.2);
  color: rgba(244, 243, 239, 0.95);
}

.logo {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.logoImg {
  width: min(260px, 60vw);
  opacity: 0;
}
```

- [ ] **Step 2: Create the component**

Create `components/IntroVideo.tsx`:

```tsx
// components/IntroVideo.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import styles from './IntroVideo.module.css'

type Phase = 'playing' | 'fading' | 'logo' | 'done'

export default function IntroVideo() {
  const [phase, setPhase] = useState<Phase | null>(null)
  const [showSkip, setShowSkip] = useState(false)
  const skipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (localStorage.getItem('intro_seen')) {
      setPhase('done')
    } else {
      setPhase('playing')
      skipTimer.current = setTimeout(() => setShowSkip(true), 2000)
    }
    return () => {
      if (skipTimer.current) clearTimeout(skipTimer.current)
    }
  }, [])

  function finish() {
    localStorage.setItem('intro_seen', '1')
    setShowSkip(false)
    setPhase('fading')
    setTimeout(() => setPhase('logo'), 800)
    setTimeout(() => setPhase('done'), 1800)
  }

  if (phase === null || phase === 'done') return null

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fading' ? 0 : 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {phase === 'playing' && (
            <video
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              onEnded={finish}
              className={styles.video}
            />
          )}

          {phase === 'logo' && (
            <motion.div
              className={styles.logo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src="/wordmark-light.svg"
                alt="Sapphire Momentum II"
                width={260}
                height={32}
                priority
              />
            </motion.div>
          )}

          {showSkip && phase === 'playing' && (
            <motion.button
              className={styles.skip}
              onClick={finish}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Atla
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

> **Note on wordmark:** The logo phase uses `/wordmark-light.svg`. Check if this file exists in `public/`. If not, copy the SVG from `website_materials_given/Başlıksız-1_sapphire momentum  2 yazı  açık renk.svg` to `public/wordmark-light.svg`.

- [ ] **Step 3: Copy wordmark SVG to public if not already there**

```bash
ls public/wordmark-light.svg 2>/dev/null || cp "website_materials_given/Başlıksız-1_sapphire momentum  2 yazı  açık renk.svg" public/wordmark-light.svg
```

- [ ] **Step 4: Commit**

```bash
git add components/IntroVideo.tsx components/IntroVideo.module.css public/wordmark-light.svg
git commit -m "feat: add IntroVideo component with fade and logo transition"
```

---

## Task 5: Wire IntroVideo into the page

**Files:**
- Modify: `app/client-page.tsx`

- [ ] **Step 1: Add IntroVideo import and mount it**

In `app/client-page.tsx`, add the import at the top:

```tsx
import IntroVideo from '@/components/IntroVideo'
```

Then add `<IntroVideo />` as the **first child** inside the returned JSX, before `<StarfieldCanvas />`:

```tsx
return (
  <div className={styles.page}>
    <IntroVideo />          {/* ← add this line */}
    <StarfieldCanvas />

    <div className={styles.container}>
      {/* ... rest unchanged ... */}
    </div>
  </div>
)
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```

Expected: No TypeScript errors, server starts on http://localhost:3000

- [ ] **Step 3: Test first-visit flow in browser**

1. Open http://localhost:3000 in an incognito window (or clear localStorage)
2. Confirm video plays fullscreen
3. Wait 2 seconds — confirm "Atla" button appears
4. Let video finish (or click Atla) — confirm fade to black, wordmark flash, then site appears
5. Refresh same tab — confirm video does NOT play again (localStorage gate works)

- [ ] **Step 4: Commit**

```bash
git add app/client-page.tsx
git commit -m "feat: mount IntroVideo as first-visit entrance animation"
```

---

## Task 6: Handle missing intro.mp4 gracefully

**Files:**
- Modify: `components/IntroVideo.tsx`

If `public/intro.mp4` hasn't been generated yet (local dev without running the script), the `<video>` element will 404 silently and `onEnded` never fires, leaving users stuck. Add an `onError` fallback:

- [ ] **Step 1: Add onError to the video element**

In `components/IntroVideo.tsx`, update the `<video>` tag:

```tsx
<video
  src="/intro.mp4"
  autoPlay
  muted
  playsInline
  onEnded={finish}
  onError={finish}   {/* ← add this */}
  className={styles.video}
/>
```

- [ ] **Step 2: Commit**

```bash
git add components/IntroVideo.tsx
git commit -m "fix: skip intro gracefully if intro.mp4 is missing (onError fallback)"
```

---

## Self-Review Checklist

- [x] **Generation script** covers Step 1 (Flux start), Step 2 (Flux end), Step 3 (Kling video), Step 4 (download MP4)
- [x] **API parameters** match spec: `portrait_9_16`, `seed: 42`, `duration: "8"`, `generate_audio: false`, `cfg_scale: 0.7`, `negative_prompt`
- [x] **Component** gates on `localStorage.getItem('intro_seen')` — renders null immediately on repeat visits
- [x] **Skip button** appears after 2s delay
- [x] **Fade sequence** — playing → fading (0.8s) → logo (0.5s show) → done
- [x] **onError fallback** prevents users getting stuck if video is missing
- [x] **Wordmark** uses existing SVG asset from `website_materials_given/`
- [x] **`public/intro.mp4`** gitignored by default (large binary)
- [x] No TBD, no placeholder steps
