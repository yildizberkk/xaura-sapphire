import { fal } from '@fal-ai/client'
import { writeFileSync } from 'fs'

fal.config({ credentials: process.env.FAL_API_KEY })

const START_PROMPT = `Pre-dawn airport runway shot from ground level, camera positioned at centerline looking straight down the runway into darkness. Two parallel rows of amber-gold runway edge lights (#edd29d, #af9055) converge sharply to a vanishing point in the far distance. Wet dark asphalt reflects the amber lights in long golden streaks (#cdad70). Deep midnight navy sky above (#030d5f). A razor-thin line of cobalt-gold pre-dawn glow at the horizon (#5c89d1, #cdad70) — the faintest suggestion of dawn breaking. White painted centerline dashes stretch ahead into the darkness. No aircraft, no people, no terminal buildings visible. Cinematic wide-angle perspective with strong depth compression, photorealistic, dramatic, moody.`

const VIDEO_PROMPT = `Camera starts perfectly still at runway level, then begins a slow deliberate forward movement that gradually accelerates as if a plane beginning its takeoff roll. The amber runway edge lights (#edd29d, #af9055) on both sides start to blur and stream past faster and faster. The acceleration builds — the lights trail into streaks. Then the camera tilts slightly upward, the nose lifts, and the ground drops away as we lift off the runway. In the final moments the runway disappears below and a vast dark coastline reveals itself, dense warm gold city lights (#af9055, #cdad70) spreading across the darkness to the horizon, the cobalt pre-dawn sky (#5c89d1, #030d5f) glowing at the edge of the world. Smooth continuous motion, no cuts, perfectly cinematic takeoff sequence, awe-inspiring.`

const NEGATIVE_PROMPT = `camera shake, fast movement, quick cut, daylight, sunrise, sunset, people, text, watermark, airplane, helicopter, blur, distortion, low quality, overexposed, washed out colors, desaturated, gray tones`

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
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  const buffer = await response.arrayBuffer()
  writeFileSync(dest, Buffer.from(buffer))
  console.log(`[DOWNLOAD] Saved ${buffer.byteLength} bytes`)
}

async function main() {
  if (!process.env.FAL_API_KEY) {
    console.error('FAL_API_KEY not set in environment')
    process.exit(1)
  }

  const startImageUrl = await generateImage(START_PROMPT, 'START IMAGE')
  const videoUrl      = await generateVideo(startImageUrl)
  await downloadMp4(videoUrl, 'public/intro.mp4')

  console.log('\n✓ Done. public/intro.mp4 is ready.')
}

main().catch((err) => { console.error(err); process.exit(1) })
