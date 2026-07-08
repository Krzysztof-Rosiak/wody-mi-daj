import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'public', 'favicon.svg')
const svgBuffer = readFileSync(svgPath)

async function generateIcon(outputFile, size, bgPadding = 0) {
  const pad = Math.round(size * bgPadding)
  const inner = size - pad * 2

  const resizedSvg = await sharp(svgBuffer)
    .resize(inner, inner)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 56, g: 142, b: 60, alpha: 1 },
    },
  })
    .composite([{ input: resizedSvg, top: pad, left: pad }])
    .png()
    .toFile(resolve(root, 'public', outputFile))

  console.log(`OK ${outputFile} (${size}x${size}, padding=${bgPadding * 100}%)`)
}

await generateIcon('icon-192.png', 192)
await generateIcon('icon-512.png', 512)
await generateIcon('apple-touch-icon.png', 180, 0.1)
