import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

;(async () => {
  const src = path.join(process.cwd(), 'public', 'x2-emblem.png')
  const outDir = path.join(process.cwd(), 'public', 'icons')

  fs.mkdirSync(outDir, { recursive: true })

  await sharp(src).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'))
  await sharp(src).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'))
  await sharp(src).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'))

  console.log('Icons generated in public/icons/')
})()
