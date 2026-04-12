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
      <body>
        <PwaInit />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
