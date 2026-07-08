/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) return (clientList[0] as WindowClient).focus()
        return self.clients.openWindow('/')
      }),
  )
})

// ─── Periodic Background Sync ─────────────────────────────────────────────────

self.addEventListener('periodicsync', (event) => {
  const e = event as ExtendableEvent & { tag: string }
  if (e.tag === 'daily-care-check') {
    e.waitUntil(checkAndNotify())
  }
})

// ─── IDB helpers (raw API — no Dexie in SW) ───────────────────────────────────

function openPlantsDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('plantsDb')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function openMetaDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('sw-meta', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('kv')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, store: string, key: IDBValidKey) {
  return new Promise<unknown>((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGetAll(db: IDBDatabase, store: string) {
  return new Promise<unknown[]>((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, store: string, value: unknown, key: IDBValidKey) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Data types (minimal, no Vue/Pinia imports) ───────────────────────────────

interface SwPlant {
  id?: number
  archivedAt?: unknown
  templateSpecies?: string
  wateringIntervalDays?: number | null
  fertilizingIntervalDays?: number | null
  mistingIntervalDays?: number | null
}

interface SwCareEvent {
  plantId: number
  type: string
  date: Date | string
}

interface SwSettings {
  notificationsEnabled?: boolean
}

// ─── Task count logic ─────────────────────────────────────────────────────────

function daysSince(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date)
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

function buildDueIds(plants: SwPlant[], events: SwCareEvent[]): number[] {
  // Build last-event-days-ago per plant per type
  const lastDays = new Map<string, number>()
  for (const e of events) {
    const key = `${e.plantId}:${e.type}`
    const days = daysSince(e.date)
    const prev = lastDays.get(key)
    if (prev === undefined || days < prev) lastDays.set(key, days)
  }

  const dueSet = new Set<number>()
  for (const plant of plants) {
    if (plant.archivedAt) continue
    const id = plant.id
    if (id === undefined) continue

    // Watering — template plants without explicit interval use 7-day default
    const wInterval = plant.wateringIntervalDays ?? 7
    const wDays = lastDays.get(`${id}:watering`) ?? Infinity
    if (wDays >= wInterval) dueSet.add(id)

    // Fertilizing — only if explicitly configured
    const fInterval = plant.fertilizingIntervalDays
    if (fInterval) {
      const fDays = lastDays.get(`${id}:fertilizing`) ?? Infinity
      if (fDays >= fInterval) dueSet.add(id)
    }

    // Misting — only if explicitly configured
    const mInterval = plant.mistingIntervalDays
    if (mInterval) {
      const mDays = lastDays.get(`${id}:misting`) ?? Infinity
      if (mDays >= mInterval) dueSet.add(id)
    }
  }
  return [...dueSet]
}

function taskBody(count: number): string {
  if (count === 1) return '1 roślina wymaga dzisiaj pielęgnacji'
  if (count < 5) return `${count} rośliny wymagają dzisiaj pielęgnacji`
  return `${count} roślin wymaga dzisiaj pielęgnacji`
}

// ─── Main check ───────────────────────────────────────────────────────────────

async function checkAndNotify() {
  try {
    const [plantsDb, metaDb] = await Promise.all([openPlantsDb(), openMetaDb()])

    const settings = (await idbGet(plantsDb, 'settings', 1)) as SwSettings | undefined
    if (!settings?.notificationsEnabled) return

    const now = new Date()
    const todayKey = now.toDateString()
    const lastNotified = (await idbGet(metaDb, 'kv', 'lastNotifiedDate')) as string | undefined
    if (lastNotified === todayKey) return

    const [rawPlants, rawEvents] = await Promise.all([
      idbGetAll(plantsDb, 'plants'),
      idbGetAll(plantsDb, 'careEvents'),
    ])

    const plants = rawPlants as SwPlant[]
    const events = rawEvents as SwCareEvent[]

    const dueIds = buildDueIds(plants, events)
    const count = dueIds.length
    if (count === 0) return

    await self.registration.showNotification('WodyMiDaj', {
      body: taskBody(count),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    })

    await idbPut(metaDb, 'kv', todayKey, 'lastNotifiedDate')
  } catch {
    // silently ignore — SW cannot log to console in background
  }
}
