// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaInit from '@/components/PwaInit'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Sapphire Momentum II — Program',
  description: 'Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya',
  openGraph: {
    title: 'Sapphire Momentum II',
    description: '24–26 Nisan 2026 · Kremlin Palace, Antalya',
  },
  icons: {
    icon: '/icons/apple-touch-icon.png',
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
      <head>
        {/*
          Preload the intro video in parallel with HTML parse + JS hydration.
          Most first-time visitors at the event need this asset almost immediately,
          so getting a head start on the download cuts perceived latency on venue wifi.
          Returning users (localStorage set) will skip the intro phase, but the file
          is 1.5 MB and cached — the wasted bandwidth is negligible.
        */}
        <link rel="preload" as="video" href="/intro-v2.mp4" type="video/mp4" />
      </head>
      <body>
        <PwaInit />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
