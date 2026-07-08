import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'

const NOTIFIED_KEY = 'lastNotifiedDate'

let scheduledTimer: number | null = null

function openMetaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('sw-meta', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('kv')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, key: IDBValidKey): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv', 'readonly').objectStore('kv').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, value: unknown, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function hasNotifiedToday(): Promise<boolean> {
  try {
    const db = await openMetaDb()
    const val = await idbGet(db, NOTIFIED_KEY)
    return val === new Date().toDateString()
  } catch {
    return false
  }
}

async function markNotifiedToday(): Promise<void> {
  try {
    const db = await openMetaDb()
    await idbPut(db, new Date().toDateString(), NOTIFIED_KEY)
  } catch { /* ignore */ }
}

export function useNotifications() {
  const settingsStore = useSettingsStore()

  const permissionStatus = computed((): 'unsupported' | 'default' | 'granted' | 'denied' => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  })

  async function requestPermission() {
    if (typeof Notification === 'undefined') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  async function getDueTaskCount() {
    const plantsStore = usePlantsStore()
    const eventsStore = useCareEventsStore()
    await plantsStore.fetchAll()
    const events = await eventsStore.fetchAll()

    const lastDays: { [k: string]: number } = {}
    const now = Date.now()
    for (const e of events) {
      const key = `${e.plantId}:${e.type}`
      const days = Math.floor((now - new Date(e.date).getTime()) / 86_400_000)
      if (lastDays[key] === undefined || days < lastDays[key]) lastDays[key] = days
    }

    const dueIds: { [id: number]: true } = {}
    for (const plant of plantsStore.plants) {
      if (plant.archivedAt) continue
      const id = plant.id as number
      const wInterval = plant.wateringIntervalDays ?? 7
      const fInterval = plant.fertilizingIntervalDays
      const mInterval = plant.mistingIntervalDays
      const isDue =
        (lastDays[`${id}:watering`] ?? Infinity) >= wInterval ||
        (fInterval != null && (lastDays[`${id}:fertilizing`] ?? Infinity) >= fInterval) ||
        (mInterval != null && (lastDays[`${id}:misting`] ?? Infinity) >= mInterval)
      if (isDue) dueIds[id] = true
    }
    return Object.keys(dueIds).length
  }

  function taskBody(count: number): string {
    if (count === 1) return '1 roślina wymaga dzisiaj pielęgnacji'
    if (count < 5) return `${count} rośliny wymagają dzisiaj pielęgnacji`
    return `${count} roślin wymaga dzisiaj pielęgnacji`
  }

  async function showNotification() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const count = await getDueTaskCount()
    if (count === 0) return
    const title = 'WodyMiDaj'
    const options: NotificationOptions = {
      body: taskBody(count),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    }
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
    } catch {
      new Notification(title, options)
    }
    await markNotifiedToday()
  }

  async function registerPeriodicSync() {
    if (typeof navigator.serviceWorker === 'undefined') return
    const reg = await navigator.serviceWorker.ready
    type PeriodicSyncReg = ServiceWorkerRegistration & {
      periodicSync: { register(tag: string, opts: { minInterval: number }): void }
    }
    const syncReg = reg as PeriodicSyncReg
    if (!syncReg.periodicSync) return
    try {
      await syncReg.periodicSync.register('daily-care-check', { minInterval: 60 * 60 * 1000 })
    } catch { /* permission denied or unsupported */ }
  }

  function scheduleNext() {
    if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null }
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const delay = tomorrow.getTime() - now.getTime()
    scheduledTimer = window.setTimeout(async () => {
      scheduledTimer = null
      await showNotification()
      if (settingsStore.notificationsEnabled && Notification.permission === 'granted') {
        scheduleNext()
      }
    }, delay)
  }

  async function schedule() {
    if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null }
    if (!settingsStore.notificationsEnabled) return
    if (Notification.permission !== 'granted') return

    registerPeriodicSync()

    if (!(await hasNotifiedToday())) {
      await showNotification()
    }
    scheduleNext()
  }

  return { permissionStatus, requestPermission, showNotification, schedule }
}
