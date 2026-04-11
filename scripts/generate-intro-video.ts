import { fal } from '@fal-ai/client'
import { writeFileSync } from 'fs'

fal.config({ credentials: process.env.FAL_API_KEY })

const START_PROMPT = `Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 800 meters altitude directly above. The night sky is deep midnight blue-black (#030d5f), fading into dark cobalt (#2b457a) near the horizon. The dense Lara Beach city grid glows with warm amber-gold lights (#edd29d, #cdad70), the hotel complex itself radiating a warmer bronze-gold light (#af9055). Multiple large swimming pools scatter across the resort, each shimmering with vivid electric sapphire blue (#3d82ff). A thin cobalt atmospheric haze (#5c89d1) softens the light spread across the city. The dark Mediterranean sea (#030d5f to #2b457a) is visible at the frame edges. Photorealistic drone photography, cinematic, no plane, no people, no text.`

const END_PROMPT = `Bird's eye aerial night photography of Kremlin Palace hotel complex in Lara Beach, Antalya, Turkey, shot from approximately 200 meters altitude directly above. The grand resort architecture fills most of the frame with warm bronze-gold illumination (#af9055, #d0b275). Multiple large luxurious swimming pools glow intensely with electric sapphire blue light (#3d82ff) — clearly defined and prominent. Surrounding Lara Beach city lights (#edd29d) are visible but peripheral, the hotel dominating the composition. Dark Mediterranean sea (#030d5f) barely visible at extreme edges. The deep night sky (#030d5f) is only a thin strip. Cobalt atmospheric glow (#5c89d1) emanates from the resort. Photorealistic drone photography, cinematic, no plane, no people, no text.`

const VIDEO_PROMPT = `Extremely slow and perfectly smooth vertical aerial descent from 800 meters down to 200 meters, zero camera shake, steady dolly-down movement, no drift or lateral movement. The deep midnight navy sky (#030d5f) gradually recedes as the warm gold city lights (#edd29d, #cdad70) of Lara Beach grow larger and more detailed. The Kremlin Palace resort rises to dominate the frame, its bronze-gold light (#af9055) intensifying, electric sapphire blue pools (#3d82ff) shimmering and expanding. A soft cobalt atmospheric haze (#5c89d1) pulses gently over the city. The dark cobalt Mediterranean sea (#2b457a, #030d5f) slowly disappears to the edges. IMAX aerial drone cinematography, luxury travel documentary, breathtaking arrival, awe-inspiring.`

const NEGATIVE_PROMPT = `camera shake, fast movement, quick cut, daylight, sunrise, sunset, people, text, watermark, airplane, helicopter, blur, distortion, low quality, overexposed, washed out colors, desaturated, gray tones`

async function generateImage(prompt: string, label: string): Promise<string> {
  console.log(`\n[${label}] Generating image with Flux 2 Pro...`)
  const result = await fal.subscribe('fal-ai/flux-2-pro', {
    input: {
      prompt,
      image_size: 'portrait_9_16',
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

async function generateVideo(startImageUrl: string, endImageUrl: string): Promise<string> {
  console.log('\n[VIDEO] Generating video with Kling v3 Pro...')
  const result = await fal.subscribe('fal-ai/kling-video/v3/pro/image-to-video', {
    input: {
      prompt: VIDEO_PROMPT,
      start_image_url: startImageUrl,
      end_image_url: endImageUrl,
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
  const endImageUrl   = await generateImage(END_PROMPT,   'END IMAGE')
  const videoUrl      = await generateVideo(startImageUrl, endImageUrl)
  await downloadMp4(videoUrl, 'public/intro.mp4')

  console.log('\n✓ Done. public/intro.mp4 is ready.')
}

main().catch((err) => { console.error(err); process.exit(1) })
