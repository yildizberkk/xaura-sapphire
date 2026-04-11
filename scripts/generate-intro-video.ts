import { fal } from '@fal-ai/client'
import { existsSync, readFileSync, writeFileSync } from 'fs'

fal.config({ credentials: process.env.FAL_API_KEY })

const FRAME_CACHE = 'public/intro-frame.jpg'

const START_PROMPT = `Pre-dawn airport runway shot from ground level, camera positioned at centerline looking straight down the runway into darkness. Two parallel rows of amber-gold runway edge lights (#edd29d, #af9055) converge sharply to a single vanishing point at the very center of the horizon. Wet dark asphalt reflects the amber lights in long golden streaks (#cdad70). Deep midnight navy sky above (#030d5f). A soft cobalt-gold glow radiates from the vanishing point on the horizon (#5c89d1, #cdad70) — as if a light source or beacon sits exactly at the end of the runway. White painted centerline dashes stretch ahead into that glow. No aircraft, no people, no terminal buildings visible. Cinematic wide-angle perspective with extreme depth compression, photorealistic, dramatic, moody.`

const VIDEO_PROMPT = `Camera starts perfectly still at runway level, then begins a very slow and deliberate forward push that gradually and smoothly accelerates — as if a plane beginning its takeoff roll. The amber runway edge lights (#edd29d, #af9055) on both sides slowly begin to stream past. The acceleration builds steadily — lights blur into golden streaks on both sides. The glowing cobalt-gold beacon at the horizon (#5c89d1, #cdad70) grows steadily larger and more radiant as the camera rushes forward. In the final moments, the beacon light expands and floods more and more of the frame — the horizon dissolves into a radiant wash of cobalt-gold light that fills the screen as the camera charges into it. Pure forward motion only — no tilt, no lift, no vertical movement — just an unstoppable momentum building into the light. Smooth continuous acceleration into a luminous ending, no cuts, perfectly cinematic.`

const NEGATIVE_PROMPT = `camera shake, tilt, lift, vertical movement, quick cut, daylight, sunrise, sunset, people, text, watermark, airplane, helicopter, blur, distortion, low quality, overexposed, washed out colors, desaturated, gray tones`

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
        update.logs?.forEach((log) => console.log(`[${log.level}] ${log.message}`))
      }
    },
  })
  const images = (result.data as { images?: { url: string }[] }).images
  if (!images?.length) throw new Error(`[${label}] No images in response: ${JSON.stringify(result.data)}`)
  const url = images[0].url
  console.log(`[${label}] Done: ${url}`)
  return url
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function getStartFrame(): Promise<Buffer> {
  if (existsSync(FRAME_CACHE)) {
    console.log(`\n[FRAME] Reusing cached frame from ${FRAME_CACHE}`)
    return readFileSync(FRAME_CACHE)
  }
  console.log(`\n[FRAME] No cache found — generating new start frame...`)
  const url = await generateImage(START_PROMPT, 'START IMAGE')
  const buffer = await downloadToBuffer(url)
  writeFileSync(FRAME_CACHE, buffer)
  console.log(`[FRAME] Cached to ${FRAME_CACHE}`)
  return buffer
}

async function uploadToFal(buffer: Buffer, filename: string): Promise<string> {
  console.log('\n[UPLOAD] Uploading start frame to fal storage...')
  const file = new File([new Uint8Array(buffer)], filename, { type: 'image/jpeg' })
  const url  = await fal.storage.upload(file)
  console.log(`[UPLOAD] Done: ${url}`)
  return url
}

async function generateVideo(startImageUrl: string): Promise<string> {
  console.log('\n[VIDEO] Generating video with Kling v3 Pro...')
  const result = await fal.subscribe('fal-ai/kling-video/v3/pro/image-to-video', {
    input: {
      prompt: VIDEO_PROMPT,
      start_image_url: startImageUrl,
      duration: '8',
      generate_audio: false,
      cfg_scale: 0.7,
      negative_prompt: NEGATIVE_PROMPT,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        update.logs?.forEach((log) => console.log(`[${log.level}] ${log.message}`))
      }
    },
  })
  const video = (result.data as { video?: { url: string } }).video
  if (!video?.url) throw new Error(`[VIDEO] No video URL in response: ${JSON.stringify(result.data)}`)
  const url = video.url
  console.log(`[VIDEO] Done: ${url}`)
  return url
}

async function downloadMp4(url: string, dest: string): Promise<void> {
  console.log(`\n[DOWNLOAD] Saving to ${dest}...`)
  const buffer = await downloadToBuffer(url)
  writeFileSync(dest, buffer)
  console.log(`[DOWNLOAD] Saved ${buffer.byteLength} bytes`)
}

async function main() {
  if (!process.env.FAL_API_KEY) {
    console.error('FAL_API_KEY not set in environment')
    process.exit(1)
  }

  // Remove --no-cache flag to skip cached frame
  const noCache = process.argv.includes('--no-cache')
  if (noCache && existsSync(FRAME_CACHE)) {
    console.log('[FRAME] --no-cache flag set, ignoring cached frame')
  }
  if (noCache) {
    const { unlinkSync } = await import('fs')
    if (existsSync(FRAME_CACHE)) unlinkSync(FRAME_CACHE)
  }

  const frameBuffer   = await getStartFrame()
  const startImageUrl = await uploadToFal(frameBuffer, 'runway-start.jpg')
  const videoUrl      = await generateVideo(startImageUrl)
  await downloadMp4(videoUrl, 'public/intro.mp4')

  console.log('\n✓ Done. public/intro.mp4 is ready.')
}

main().catch((err) => { console.error(err); process.exit(1) })
