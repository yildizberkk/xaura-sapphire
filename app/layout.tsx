// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sapphire Momentum II — Program',
  description: 'Xaura Global · 24–26 Nisan 2026 · Kremlin Palace, Antalya',
  openGraph: {
    title: 'Sapphire Momentum II',
    description: '24–26 Nisan 2026 · Kremlin Palace, Antalya',
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
      <body>{children}</body>
    </html>
  )
}
