# Sapphire Momentum II - Event Experience Website

## Project Overview

An immersive, mobile-first event website for **Sapphire Momentum II** — a 3-day event (April 24-26, 2025) in Antalya, Turkey, organized by **Xaura Global**. The website is accessed via QR codes placed around the event venue (Kremlin Palace). It serves as a live schedule and an experiential, flight-themed interactive experience that evolves dynamically with the time of day/event.

## Event Details

- **Event**: Sapphire Momentum II (2nd Anniversary Edition)
- **Organizer**: Xaura Global
- **Venue**: Kremlin Palace, Kundu Mah. Yaşar Sobutay Bulv. Kremlin Otel Sit. No:98/10 No: A201 Aksu / Antalya
- **Dates**: April 24-26 (Perşembe-Cumartesi... actually Cuma-Pazar / Friday-Sunday)
- **Language**: Turkish — the entire website should be in Turkish (UI, schedule, navigation, everything)

## Schedule Data

### Friday (Cuma) — MC: Sinan Guler & Ayse Ozcobanlar
| Time | Event |
|------|-------|
| 10:00 - 12:30 | Giris (Entry) |
| 12:30 - 14:30 | Ogle Yemegi (Lunch) |
| 16:15 - 17:30 | Ruby Okulu - Gurkan Kandemir |
| 17:30 - 20:30 | Serbest Zaman ve Aksam Yemegi (Free Time & Dinner) |
| 20:30 | Kapi Acilis (Door Opening) |
| 20:45 | 2. Yil Donumu Acilis Konusmasi - Nuran & Gurkan Kandemir |
| 21:15 | Konser (Concert) |

### Saturday (Cumartesi) — MC: Esra & Kadir Turgut
| Time | Event |
|------|-------|
| 07:00 - 09:30 | Kahvalti (Breakfast) |
| 09:30 - 10:15 | Ikna Problemi Degil Inanc Problemi - Yusuf Erdem Bakir |
| 10:15 - 10:30 | Ara (Break) |
| 10:30 - 11:15 | Network'te Servet Mantigi - Kadir Yildiz |
| 11:15 - 11:30 | Ara |
| 11:30 - 12:30 | Insanlar Neden Katilir Neden Kalir - Yasar Guler |
| 12:30 - 13:45 | Ogle Yemegi (Lunch) |
| 13:45 - 15:15 | Kisisel Marka ve Storytelling ile Guven Insasi - Serdar Ors |
| 15:15 - 15:30 | Ara |
| 15:30 - 16:30 | Sistem Kurmak: Sen Olmadan Calisan Organizasyon - Sule Unal |
| 16:30 - 18:00 | Ara |
| 18:00 | Vizyon Liderligi - Ayberk Dedecan |
| - | Aksam Yemegi (Dinner) |
| 21:00 | Takdir Toreni (Awards Ceremony) - SP Kutlamasi |

### Sunday (Pazar) — MC: Metin Kilic & Meral Cimen
| Time | Event |
|------|-------|
| 07:00 - 09:30 | Kahvalti (Breakfast) |
| 09:45 - 10:30 | Kupe Modeli - Isin Anayasi - Erdal Cakir |
| 10:30 - 10:45 | Ara (Break) |
| 10:45 - 12:00 | Kuresel Vizyon Insasi - Jean Marc Colaianni |
| 12:00 - 13:00 | Oda Bosaltma ve Coffee Break |
| 13:15 - 15:00 | Kapanis Konusmasi - Gurkan Kandemir |

## Brand Identity

### Colors
- **Deep Navy**: `#030d5f`, `#171f6b`
- **Sapphire Blue**: `#345092`, `#284589`, `#5574b8`, `#5884cc`
- **Bright Blue**: `#3d82ff`
- **Blue Gradients**: `#5c89d1` -> `#2b457a`
- **Gold/Bronze**: `#b39369`, `#af9055`, `#cdad70`, `#d0b275`
- **Gold Gradient**: `#edd29d` -> `#95753a` -> `#edd29d`
- **Off-white/Cream**: `#f4f3ef`, `#f9f5f5`
- **Gray accent**: `#939393`

### Typography
- **Primary font**: Gilroy (full family provided: Thin through Black, with italics)
- **Secondary font**: Neue Montreal (used in anniversary edition text)
- **Weights used in brand**: ExtraBold (headings), Bold, SemiBold, Regular, Light

### Logo Assets (in `website_materials_given/`)
- `Web gerekli_sapphire momentum  2 yazı  açık renk.svg` — Light/cream text logo "SAPPHIRE MOMENTUM II"
- `Web gerekli_sapphire momentum  2 yazı .svg` — Dark/blue text logo "SAPPHIRE MOMENTUM II"
- `Web gerekli_x2 logo.svg` — X2 circular logo with "2ND ANNIVERSARY EDITION" + "YEAR" text paths, color grid blocks (3.4MB, contains embedded raster)
- `Web gerekli_xaura logo.svg` — Xaura Global logo (large, contains embedded raster image)
- `Web gerekli_Çalışma Yüzeyi 1 kopya.svg` — Design composition: color grid, gradient blocks, "2ND ANNIVERSARY EDITION" circular text
- `Web gerekli_24-26 nisan yazı.svg` — "24-26 NİSAN" date text in Gilroy Light
- `gilroy/` — Full Gilroy font family (TTF files)
- `schedule.jpeg` — Event schedule poster image

## Tech Stack (Planned)

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: TBD (candidates: Framer Motion, GSAP, Three.js/R3F for 3D)
- **Deployment**: Vercel
- **Font loading**: `next/font` local fonts (Gilroy family)

## Design Concepts (To Be Developed)

- **Flight theme**: The website should evoke a flight-related experience (boarding pass metaphor, altitude/clouds, departure board aesthetics, etc.)
- **Time-dynamic**: The experience should change based on event time — different visuals for morning/afternoon/evening sessions, "now playing" indicators, countdowns
- **Mobile-first**: Primary access is via QR code on phones at the event venue
- **Immersive animations**: Not just a schedule — an experience. Smooth transitions, parallax, micro-interactions
- **QR code entry**: The landing experience should feel like "boarding" the event

## Development Guidelines

- Mobile-first responsive design (test at 375px, 390px, 414px widths)
- Performance is critical — fast load over QR, aim for 90+ Lighthouse score
- Use Turkish for all schedule content, keep UI navigation minimal
- Optimize SVG assets before use (the logo SVGs with embedded rasters should be converted to optimized PNG/WebP)
- Use `next/font` for Gilroy loading — only load weights actually used (Regular, Light, Bold, ExtraBold, SemiBold)
- All schedule data should be defined as structured TypeScript constants, not hardcoded in JSX
- Dark theme by default (matching the event's deep navy/sapphire brand aesthetic)

## Project Structure (Planned)

```
/
├── CLAUDE.md
├── website_materials_given/     # Original assets from organizer
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # React components
│   ├── lib/                     # Utilities, schedule data, types
│   └── styles/                  # Global styles, fonts
├── public/                      # Static assets (optimized logos, etc.)
├── tailwind.config.ts
├── next.config.ts
└── package.json
```
