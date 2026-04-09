# Logo Integration Design

**Date:** 2026-04-10  
**Project:** Sapphire Momentum II — xaura-sapphire  
**Status:** Approved

## Overview

Integrate two brand assets into the app: the Xaura Global company logo and the ×2 anniversary emblem prepared specifically for Sapphire Momentum II (2nd anniversary of Xaura Global).

## Source Assets

Both source SVGs live in `website_materials_given/` and contain embedded base64-encoded PNG images. They are not used directly — the embedded PNGs are extracted and saved to `public/`.

| File | Dimensions | Size | Embedded PNG |
|------|-----------|------|--------------|
| `Başlıksız-1_x2 logo.svg` | 770×773 viewBox | 3.6 MB | 2110×2112 RGBA, 2.7 MB |
| `Başlıksız-1_xaura logo.svg` | 1225×700 viewBox | 56 KB | 2500×1250 RGBA, 42 KB |

## Asset Extraction

Both embedded PNGs are extracted via `base64 -d` and saved as standalone files in `public/`:

- `public/x2-emblem.png` — extracted from the ×2 SVG
- `public/xaura-logo.png` — extracted from the Xaura SVG

Next.js `<Image>` will then serve them optimized (auto WebP, sized to display dimensions), so the 2.7 MB source PNG becomes ~5 KB on the wire at 38px display size.

## Placements

### 1. ×2 Emblem — BoardingPass header bar

**Location:** `components/BoardingPass.tsx`

**Before:** `<span className={styles.airline}>Xaura Global</span>` — plain uppercase text, blue, left side of header row.

**After:** Next.js `<Image>` of `x2-emblem.png`, replacing that span entirely.

- Display size: **38×38 px**
- Alignment: left side of the header row (paired with "Boarding Pass" label on the right)
- No additional opacity — the emblem renders at full opacity

**CSS:** Remove `.airline` text styles; add `.emblemImg` with `width: 38px; height: 38px; object-fit: contain;` and adjust `.header` `align-items` from `baseline` to `center`.

### 2. Xaura Logo — Timeline footer

**Location:** `components/Timeline.tsx`

**Before:** `<div className={styles.footerText}>Xaura Global · Sapphire Momentum II · Nisan 2026</div>` — small uppercase text at 15% opacity.

**After:** Next.js `<Image>` of `xaura-logo.png`, replacing the text div entirely.

- Display width: **110 px**, height auto (native ratio 2:1, so ~55 px tall)
- Opacity: **75%**
- Alignment: centered (`.footer` already has `text-align: center`)

**CSS:** Replace `.footerText` text styles with `.footerLogo` with `width: 110px; height: auto; opacity: 0.75; display: block; margin: 0 auto;`.

## Files Changed

| File | Change |
|------|--------|
| `public/x2-emblem.png` | New — extracted from source SVG |
| `public/xaura-logo.png` | New — extracted from source SVG |
| `components/BoardingPass.tsx` | Replace airline `<span>` with `<Image>` |
| `components/BoardingPass.module.css` | Replace `.airline` with `.emblemImg`, adjust `.header` alignment |
| `components/Timeline.tsx` | Replace footer text `<div>` with `<Image>` |
| `components/Timeline.module.css` | Replace `.footerText` with `.footerLogo` |

## Constraints

- Source SVG files in `website_materials_given/` are **not copied to `public/`** — only the extracted PNGs are.
- No changes to any other components (CountdownDisplay, SessionRow, FlightStatusBar, etc.).
- The `next/image` `<Image>` component requires explicit `width` and `height` props or a `fill` layout; use explicit props for both placements.
