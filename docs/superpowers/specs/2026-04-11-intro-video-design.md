# Intro Video — First Visit Entrance Animation

**Date:** 2026-04-11  
**Project:** Sapphire Momentum II — xaura-sapphire  
**Status:** Approved

---

## Overview

A cinematic aerial entrance video shown to first-time visitors before they see the main site. Triggered on first load when no `intro_seen` flag exists in `localStorage`. After the video plays (or the user skips), the flag is set and the main site fades in.

---

## Video Concept

**Type:** AI-generated, image-to-video via fal.ai Kling v3 Pro  
**Theme:** Cinematic night aerial descent over Kremlin Palace, Lara Beach, Antalya  
**Perspective:** Pure bird's eye — no plane, no aircraft visible  
**Camera movement:** Perfectly smooth vertical descent from ~800m to ~200m altitude, zero lateral drift, zero shake  
**Aspect ratio:** 9:16 portrait (mobile-first — site accessed via QR code on phones)  
**Resolution:** 576×1024 — native Flux 2 Pro `"portrait_9_16"` preset  
**Duration:** 8 seconds  
**Audio:** Silent (`generate_audio: false`)  
**Cost:** ~$0.90 (Kling 8s silent) + ~$0.10 (2× Flux Pro images) = ~$1.00

---

## Color Theme

All prompts are anchored to the brand palette from the SVG design system:

| Hex | Element |
|-----|---------|
| `#030d5f` | Night sky and deep Mediterranean sea |
| `#2b457a` | Mid-tone sea and sky gradient |
| `#284589` | Secondary deep blue |
| `#3d82ff` | Pool reflections (electric sapphire) |
| `#5c89d1` | Atmospheric city haze |
| `#edd29d` | City lights — bright warm gold |
| `#cdad70` | Light halos and glow |
| `#af9055` | Kremlin Palace warm light |
| `#d0b275` | Bronze accent light |
| `#f4f3ef` | Cream — faint stars |

---

## Generation Pipeline

### Step 1 — Start Image (Flux 2 Pro, fal-ai/flux-2-pro)

**Altitude:** ~800m  
**Frame:** Kremlin Palace small but centered, dense Lara Beach city grid fills lower 60%, Mediterranean sea at top/edges, stars visible  
**API parameters:**
```json
{
  "image_size": "portrait_9_16",
  "seed": 42,
  "output_format": "jpeg"
}
```
> `"portrait_9_16"` is the native Flux 2 Pro enum preset producing **576×1024** images (confirmed in playground). Use the **same `seed`** for both start and end images — ensures consistent lighting style, color temperature, and atmospheric conditions across both frames.

**Prompt:**
```
Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 800 meters altitude directly above. The night sky is deep midnight blue-black (#030d5f), fading into dark cobalt (#2b457a) near the horizon. The dense Lara Beach city grid glows with warm amber-gold lights (#edd29d, #cdad70), the hotel complex itself radiating a warmer bronze-gold light (#af9055). Multiple large swimming pools scatter across the resort, each shimmering with vivid electric sapphire blue (#3d82ff). A thin cobalt atmospheric haze (#5c89d1) softens the light spread across the city. The dark Mediterranean sea (#030d5f to #2b457a) is visible at the frame edges. Photorealistic drone photography, cinematic, no plane, no people, no text.
```

### Step 2 — End Image (Flux 2 Pro, fal-ai/flux-2-pro)

**Altitude:** ~200m  
**Frame:** Kremlin Palace fills most of frame, pools prominent and vivid, city lights peripheral, sea barely visible at extreme edges  
**API parameters:**
```json
{
  "image_size": { "width": 1080, "height": 1920 },
  "seed": 42,
  "output_format": "jpeg"
}
```
> Same `seed: 42` as start image — locks in matching color palette and atmosphere.

**Prompt:**
```
Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 200 meters altitude directly above. The grand resort architecture fills most of the frame with warm bronze-gold illumination (#af9055, #d0b275). Multiple large luxurious swimming pools glow intensely with electric sapphire blue light (#3d82ff) — clearly defined and prominent. Surrounding Lara Beach city lights (#edd29d) are visible but peripheral, the hotel dominating the composition. Dark Mediterranean sea (#030d5f) barely visible at extreme edges. The deep night sky (#030d5f) is only a thin strip. Cobalt atmospheric glow (#5c89d1) emanates from the resort. Photorealistic drone photography, cinematic, no plane, no people, no text.
```

### Step 3 — Video (Kling v3 Pro, fal-ai/kling-video/v3/pro/image-to-video)

**Prompt:**
```
Extremely slow and perfectly smooth vertical aerial descent from 800 meters down to 200 meters, zero camera shake, steady dolly-down movement, no drift or lateral movement. The deep midnight navy sky (#030d5f) gradually recedes as the warm gold city lights (#edd29d, #cdad70) of Lara Beach grow larger and more detailed. The Kremlin Palace resort rises to dominate the frame, its bronze-gold light (#af9055) intensifying, electric sapphire blue pools (#3d82ff) shimmering and expanding. A soft cobalt atmospheric haze (#5c89d1) pulses gently over the city. The dark cobalt Mediterranean sea (#2b457a, #030d5f) slowly disappears to the edges. IMAX aerial drone cinematography, luxury travel documentary, breathtaking arrival, awe-inspiring.
```

**API parameters:**
```json
{
  "start_image_url": "<flux-pro output step 1>",
  "end_image_url": "<flux-pro output step 2>",
  "duration": "8",
  "generate_audio": false,
  "cfg_scale": 0.7,
  "negative_prompt": "camera shake, fast movement, quick cut, daylight, sunrise, sunset, people, text, watermark, airplane, helicopter, blur, distortion, low quality, overexposed, washed out colors, desaturated, gray tones"
}
```

**Output:** Download the MP4 and place at `public/intro.mp4`

---

## Web Implementation

### Component: `components/IntroVideo.tsx`

**Responsibilities:**
- Check `localStorage.getItem('intro_seen')` on mount
- If not set: render fullscreen video overlay
- If already set: render nothing (returns null immediately)
- On video end OR skip click: set `localStorage.setItem('intro_seen', '1')`, trigger exit transition
- autoPlay, muted, playsInline attributes on `<video>`
- Show skip button after 2 seconds

**Props:** none — fully self-contained

### Transition Sequence

1. Video plays (8s) — or user clicks skip
2. Overlay fades to black (0.8s, Framer Motion)
3. Sapphire Momentum II wordmark fades in on black (0.5s)
4. Wordmark fades out (0.3s), main site content fades in (0.5s)
5. StarfieldCanvas + BoardingPass slide-up animation plays as normal

### Integration point

`IntroVideo` is added to `app/client-page.tsx` as the first child, wrapped in `AnimatePresence`. When it exits (via `onComplete`), the main content below becomes visible.

### File structure

```
public/
  intro.mp4               ← generated video output
components/
  IntroVideo.tsx          ← new component
  IntroVideo.module.css   ← fullscreen overlay styles
```

### localStorage key

`intro_seen` — set to `"1"` after first view. No expiry — persists until user clears browser data.

---

## FAL API Key

Available in `.env.local` as `FAL_API_KEY`. Used as `FAL_KEY` in fal.ai client (`fal.config({ credentials: process.env.FAL_API_KEY })`). The generation script runs once locally — the output `intro.mp4` is committed to `public/` and served statically. No server-side API call at runtime.

---

## API Parameter Decisions

### `cfg_scale: 0.7` (raised from default 0.5)
Higher adherence to prompt means the specific hex colors and shot composition are respected more faithfully by the model. Since we are describing precise colors (`#030d5f`, `#3d82ff`, etc.), `0.7` is preferable over the default `0.5`.

### `multi_prompt` — deliberately not used
Kling's `multi_prompt` divides the video into distinct shots with their own prompts. For a smooth unbroken 8-second aerial descent this would introduce visible cut transitions between phases. Using `start_image_url` + `end_image_url` + a single prompt gives Kling two anchor frames to interpolate between, which produces a more fluid and predictable continuous motion.

### `aspect_ratio` — not a Kling parameter
The Kling v3 Pro image-to-video API has no `aspect_ratio` parameter. The video output ratio is automatically inherited from the `start_image_url` dimensions. Providing a 576×1024 (9:16) start image via Flux 2 Pro's `"portrait_9_16"` preset produces a 9:16 video.

### `elements` — not applicable
The `elements` parameter injects custom characters or objects referenced as `@Element1` etc. Not relevant for an abstract aerial landscape shot.

---

## Open Questions

None — all decisions confirmed.
