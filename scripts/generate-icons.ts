import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

;(async () => {
  const src = path.join(process.cwd(), 'public', 'x2-emblem.png')
  const outDir = path.join(process.cwd(), 'public', 'icons')

  fs.mkdirSync(outDir, { recursive: true })

  const bg = { r: 6, g: 9, b: 26, alpha: 1 }

  async function makeIcon(size: number, emblemScale: number, outFile: string) {
    const emblemSize = Math.round(size * emblemScale)
    const emblem = await sharp(src)
      .resize(emblemSize, emblemSize, { fit: 'inside' })
      .png()
      .toBuffer()

    await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: emblem, gravity: 'center' }])
      .png()
      .toFile(path.join(outDir, outFile))
  }

  // Regular icons — dark background, emblem at 90%
  await makeIcon(192, 0.9, 'icon-192.png')
  await makeIcon(512, 0.9, 'icon-512.png')
  await makeIcon(180, 0.9, 'apple-touch-icon.png')

  // Maskable icon — emblem at 73% so circular text clears the 10% safe zone on all sides
  await makeIcon(512, 0.73, 'icon-512-maskable.png')

  console.log('Icons generated in public/icons/')
})()
