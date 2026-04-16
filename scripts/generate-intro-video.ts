import { fal } from '@fal-ai/client'
import { existsSync, readFileSync, writeFileSync } from 'fs'

fal.config({ credentials: process.env.FAL_API_KEY })

const FRAME_CACHE = 'public/intro-frame.jpg'

const START_PROMPT = `Pre-dawn airport runway shot from ground level, camera positioned at centerline looking straight down the runway into darkness. Two parallel rows of amber-gold runway edge lights (#edd29d, #af9055) converge sharply to a single vanishing point at the very center of the horizon. Wet dark asphalt reflects the amber lights in long golden streaks (#cdad70). Deep midnight navy sky above (#030d5f). A soft cobalt-gold glow radiates from the vanishing point on the horizon (#5c89d1, #cdad70) — as if a light source or beacon sits exactly at the end of the runway. White painted centerline dashes stretch ahead into that glow. No aircraft, no people, no terminal buildings visible. Cinematic wide-angle perspective with extreme depth compression, photorealistic, dramatic, moody.`

// v1 — 8s, cobalt-gold ending
const VIDEO_PROMPT_V1 = `Camera starts perfectly still at runway level, then begins a very slow and deliberate forward push that gradually and smoothly accelerates — as if a plane beginning its takeoff roll. The amber runway edge lights (#edd29d, #af9055) on both sides slowly begin to stream past. The acceleration builds steadily — lights blur into golden streaks on both sides. The glowing cobalt-gold beacon at the horizon (#5c89d1, #cdad70) grows steadily larger and more radiant as the camera rushes forward. In the final moments, the beacon light expands and floods more and more of the frame — the horizon dissolves into a radiant wash of cobalt-gold light that fills the screen as the camera charges into it. Pure forward motion only — no tilt, no lift, no vertical movement — just an unstoppable momentum building into the light. Smooth continuous acceleration into a luminous ending, no cuts, perfectly cinematic.`

// v2 — 12s, full warm amber overexposure ending
const VIDEO_PROMPT_V2 = `Camera starts perfectly still at runway level, then begins a very slow and deliberate forward push that gradually and smoothly accelerates — as if a plane beginning its takeoff roll. The amber runway edge lights (#edd29d, #af9055) on both sides slowly begin to stream past. The acceleration builds with relentless smoothness — lights blur into long rivers of warm gold on both sides. The cobalt-gold beacon at the horizon grows steadily, pulling the camera toward it with increasing urgency. As the camera charges forward, the amber glow expands from the center — first flooding the lower half of the frame, then rising to consume the sky. In the final 4 seconds, the entire frame is overwhelmed by a pure saturated warm amber light (#edd29d, #cdad70, #af9055) — the runway, the darkness, the sky all dissolve completely into a blinding luminous amber-gold overexposure that fills every pixel from edge to edge. The ending is a total immersion in warm amber radiance, held for a long graceful beat. Pure forward motion only — no tilt, no lift — just unstoppable momentum dissolving into light. Smooth, cinematic, breathtaking.`

// v3 — 12s, parabolic (exponential) acceleration: near-still start → explosive finish
const VIDEO_PROMPT_V3 = `Camera begins absolutely motionless at runway level — the opening seconds are nearly frozen, barely a breath of forward movement, as if the world is holding still. Then the motion begins to creep — so slowly at first it is almost imperceptible. But the acceleration is relentless and exponential: each second measurably faster than the last, the pace compounding on itself like a curve bending upward. The amber runway edge lights (#edd29d, #af9055) start as fixed points on either side, then gradually begin to drift past — first slowly, then flowing, then streaming. The dark wet asphalt and centerline dashes begin to blur. By the midpoint the camera is moving at real speed, lights becoming golden rivers. In the final third, the acceleration explodes — the runway lights smear into continuous blazing streaks of amber-gold (#cdad70), the beacon at the horizon expands and floods the frame with overwhelming warm light, and the camera is hurtling forward at full velocity, completely unstoppable. The very last moments are pure kinetic rush — maximum speed, frame filled with radiant golden light. Pure forward motion only — no tilt, no lift — a parabolic arc from absolute stillness to explosive momentum. One seamless continuous take, perfectly cinematic.`

const NEGATIVE_PROMPT = `camera shake, tilt, lift, vertical movement, quick cut, daylight, people, text, watermark, airplane, helicopter, distortion, low quality, desaturated, gray tones, cold blue`

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
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function getStartFrame(noCache: boolean): Promise<Buffer> {
  if (!noCache && existsSync(FRAME_CACHE)) {
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

async function generateVideo(startImageUrl: string, prompt: string, duration: string): Promise<string> {
  console.log(`\n[VIDEO] Generating ${duration}s video with Kling v3 Pro...`)
  const result = await fal.subscribe('fal-ai/kling-video/v3/pro/image-to-video', {
    input: {
      prompt,
      start_image_url: startImageUrl,
      duration,
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

  const args    = process.argv.slice(2)
  const noCache = args.includes('--no-cache')
  const version = args.includes('--v3') ? 'v3' : args.includes('--v2') ? 'v2' : 'v1'

  const prompts  = { v1: VIDEO_PROMPT_V1, v2: VIDEO_PROMPT_V2, v3: VIDEO_PROMPT_V3 }
  const durations = { v1: '8', v2: '12', v3: '12' }
  const outputs   = { v1: 'public/intro.mp4', v2: 'public/intro-v2.mp4', v3: 'public/intro-v3.mp4' }

  const prompt   = prompts[version]
  const duration = durations[version]
  const output   = outputs[version]

  console.log(`\n[CONFIG] version=${version} duration=${duration}s output=${output}`)

  const frameBuffer   = await getStartFrame(noCache)
  const startImageUrl = await uploadToFal(frameBuffer, 'runway-start.jpg')
  const videoUrl      = await generateVideo(startImageUrl, prompt, duration)
  await downloadMp4(videoUrl, output)

  console.log(`\n✓ Done. ${output} is ready.`)
}

main().catch((err) => { console.error(err); process.exit(1) })
