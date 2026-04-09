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
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
