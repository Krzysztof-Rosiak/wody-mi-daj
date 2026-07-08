// Generuje proste zielone PNG ikonki bez zewnętrznych zależności
// Uruchom: node scripts/generate-icons-simple.mjs
import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

function createPNG(size) {
  const width = size
  const height = size

  // Kolor tła: #388E3C (zielony)
  const r = 0x38, g = 0x8E, b = 0x3C

  // Nagłówek PNG
  const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuffer = Buffer.from(type, 'ascii')
    const crcData = Buffer.concat([typeBuffer, data])

    let crc = 0xFFFFFFFF
    for (const byte of crcData) {
      crc ^= byte
      for (let i = 0; i < 8; i++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0
    const crcBuffer = Buffer.alloc(4)
    crcBuffer.writeUInt32BE(crc, 0)
    return Buffer.concat([len, typeBuffer, data, crcBuffer])
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // IDAT chunk - dane obrazu
  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0 // filter type: None
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3
      rawData[offset] = r
      rawData[offset + 1] = g
      rawData[offset + 2] = b
    }
  }

  const compressed = deflateSync(rawData, { level: 9 })

  const png = Buffer.concat([
    PNG_HEADER,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])

  return png
}

for (const size of [192, 512]) {
  const png = createPNG(size)
  writeFileSync(`public/icon-${size}.png`, png)
  console.log(`Created public/icon-${size}.png (${size}x${size}, ${png.length} bytes)`)
}
