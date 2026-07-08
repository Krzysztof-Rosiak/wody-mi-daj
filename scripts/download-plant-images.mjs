/**
 * Pobiera miniatury Wikipedie dla wszystkich szablonów roślin.
 * Zapisuje pliki do public/plant-images/ i generuje src/data/templateImages.ts
 *
 * Użycie: node scripts/download-plant-images.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'plant-images')
const MAP_FILE = path.join(ROOT, 'src', 'data', 'templateImages.ts')

const DELAY_MS = 800          // przerwa między każdym gatunkiem
const RETRY_DELAY_MS = 5000   // czekaj po 429
const MAX_RETRIES = 4

// ── Wyciągnij gatunki z plantTemplates.ts ──────────────────────────────────

const templatesSource = await readFile(
  path.join(ROOT, 'src', 'data', 'plantTemplates.ts'),
  'utf-8',
)
const speciesMatches = [...templatesSource.matchAll(/species:\s*['"]([^'"]+)['"]/g)]
const allSpecies = [...new Set(speciesMatches.map((m) => m[1]))]
console.log(`Znaleziono ${allSpecies.length} gatunków.\n`)

await mkdir(OUT_DIR, { recursive: true })

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(species) {
  return species.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function imageExt(url) {
  const m = url.match(/\.(jpe?g|png|gif|webp|svg)/i)
  const e = m ? m[0].toLowerCase() : '.jpg'
  return e === '.jpeg' ? '.jpg' : e
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 429) {
        const wait = RETRY_DELAY_MS * attempt
        process.stdout.write(`    429 — czekam ${wait / 1000}s (próba ${attempt}/${retries})\n`)
        await sleep(wait)
        continue
      }
      return res
    } catch (e) {
      if (attempt === retries) throw e
      await sleep(RETRY_DELAY_MS)
    }
  }
  return null
}

async function fetchThumbnailUrl(species) {
  const res = await fetchWithRetry(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(species.trim())}`,
    { headers: { 'User-Agent': 'MojeRosliny/1.0 (plant care PWA; bot)' } },
  )
  if (!res || !res.ok) return null
  const data = await res.json()
  return data?.thumbnail?.source ?? null
}

async function downloadImage(url, destPath) {
  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'MojeRosliny/1.0 (plant care PWA; bot)',
      'Referer': 'https://en.wikipedia.org/',
    },
    redirect: 'follow',
  })
  if (!res || !res.ok) return false
  const buffer = await res.arrayBuffer()
  if (buffer.byteLength < 500) return false
  await writeFile(destPath, Buffer.from(buffer))
  return true
}

// ── Wczytaj istniejącą mapę (wznowienie) ─────────────────────────────────

let imageMap = {}
if (existsSync(MAP_FILE)) {
  const existing = await readFile(MAP_FILE, 'utf-8')
  const matches = [...existing.matchAll(/"([^"]+)":\s*"(\/plant-images\/[^"]+)"/g)]
  for (const [, species, url] of matches) imageMap[species] = url
  if (Object.keys(imageMap).length > 0) {
    console.log(`Wznowienie — mam już ${Object.keys(imageMap).length} wpisów w mapie.\n`)
  }
}

// ── Przetwarzaj sekwencyjnie (Wikimedia nie lubi równoległych requestów) ──

let downloaded = 0
let skipped = 0
let noImage = 0
let failed = 0

for (let i = 0; i < allSpecies.length; i++) {
  const species = allSpecies[i]
  const slug = slugify(species)
  const prefix = `[${i + 1}/${allSpecies.length}]`

  // Sprawdź czy plik już istnieje
  let alreadyHave = false
  for (const ext of ['.jpg', '.png', '.webp', '.svg']) {
    const candidate = `${slug}${ext}`
    if (existsSync(path.join(OUT_DIR, candidate))) {
      if (!imageMap[species]) imageMap[species] = `/plant-images/${candidate}`
      skipped++
      alreadyHave = true
      break
    }
  }
  if (alreadyHave) {
    process.stdout.write(`${prefix} ↩ ${species.trim()}\n`)
    continue
  }

  // Sprawdź czy mamy już wpis w mapie (może brak zdjęcia)
  if (species in imageMap) {
    skipped++
    process.stdout.write(`${prefix} ↩ ${species.trim()} (mapa)\n`)
    continue
  }

  const thumbUrl = await fetchThumbnailUrl(species)
  if (!thumbUrl) {
    noImage++
    process.stdout.write(`${prefix} — ${species.trim()} (brak zdjęcia na Wikipedii)\n`)
    await sleep(DELAY_MS)
    continue
  }

  const filename = `${slug}${imageExt(thumbUrl)}`
  const destPath = path.join(OUT_DIR, filename)
  const ok = await downloadImage(thumbUrl, destPath)

  if (ok) {
    imageMap[species] = `/plant-images/${filename}`
    downloaded++
    process.stdout.write(`${prefix} ✓ ${species.trim()}\n`)
  } else {
    failed++
    process.stdout.write(`${prefix} ✗ ${species.trim()} (błąd pobierania)\n`)
  }

  // Zapisuj mapę co 10 gatunków (checkpoint)
  if ((i + 1) % 10 === 0) await saveMap()

  await sleep(DELAY_MS)
}

await saveMap()

// ── Zapis mapy ────────────────────────────────────────────────────────────

async function saveMap() {
  const entries = Object.entries(imageMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, u]) => `  ${JSON.stringify(s)}: ${JSON.stringify(u)},`)
    .join('\n')

  await writeFile(MAP_FILE, `// Wygenerowane automatycznie przez scripts/download-plant-images.mjs
// Nie edytuj ręcznie — uruchom skrypt ponownie żeby odświeżyć.

export const TEMPLATE_IMAGES: Record<string, string> = {
${entries}
}
`, 'utf-8')
}

console.log(`\n═══════════════════════════════════`)
console.log(`Gotowe!`)
console.log(`  ✓ Pobrane:      ${downloaded}`)
console.log(`  — Brak zdjęcia: ${noImage}`)
console.log(`  ✗ Błędy:        ${failed}`)
console.log(`  ↩ Pominięte:    ${skipped}`)
console.log(`  Pliki:          public/plant-images/ (${downloaded + skipped} plików)`)
console.log(`  Mapa:           src/data/templateImages.ts`)
