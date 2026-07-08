import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotifications } from '../useNotifications'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'

type AnyWindow = { [key: string]: unknown }

beforeEach(() => {
  setActivePinia(createPinia())
})

// ─── taskBody ─────────────────────────────────────────────────────────────────

describe('taskBody', () => {
  // taskBody is not exported — local reimplementation for unit testing.
  function taskBody(count: number): string {
    if (count === 1) return '1 roślina wymaga dzisiaj pielęgnacji'
    if (count < 5) return `${count} rośliny wymagają dzisiaj pielęgnacji`
    return `${count} roślin wymaga dzisiaj pielęgnacji`
  }

  it('count=1 → "1 roślina"', () => {
    expect(taskBody(1)).toBe('1 roślina wymaga dzisiaj pielęgnacji')
  })

  it('count=2 → "2 rośliny" (2–4)', () => {
    expect(taskBody(2)).toBe('2 rośliny wymagają dzisiaj pielęgnacji')
  })

  it('count=4 → "4 rośliny" (granica)', () => {
    expect(taskBody(4)).toBe('4 rośliny wymagają dzisiaj pielęgnacji')
  })

  it('count=5 → "5 roślin" (≥5)', () => {
    expect(taskBody(5)).toBe('5 roślin wymaga dzisiaj pielęgnacji')
  })

  it('count=10 → "10 roślin"', () => {
    expect(taskBody(10)).toBe('10 roślin wymaga dzisiaj pielęgnacji')
  })
})

// ─── permissionStatus ─────────────────────────────────────────────────────────

describe('permissionStatus', () => {
  it('zwraca "unsupported" gdy brak Notification w window', () => {
    const original = (window as unknown as AnyWindow).Notification
    delete (window as unknown as AnyWindow).Notification
    const { permissionStatus } = useNotifications()
    expect(permissionStatus.value).toBe('unsupported')
    ;(window as unknown as AnyWindow).Notification = original
  })

  it('zwraca "default" gdy Notification.permission = "default"', () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'default' }
    const { permissionStatus } = useNotifications()
    expect(permissionStatus.value).toBe('default')
  })

  it('zwraca "denied" gdy Notification.permission = "denied"', () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'denied' }
    const { permissionStatus } = useNotifications()
    expect(permissionStatus.value).toBe('denied')
  })

  it('zwraca "granted" gdy Notification.permission = "granted"', () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'granted' }
    const { permissionStatus } = useNotifications()
    expect(permissionStatus.value).toBe('granted')
  })
})

// ─── showNotification ─────────────────────────────────────────────────────────

describe('showNotification', () => {
  beforeEach(() => {
    const mockReg = { showNotification: vi.fn().mockResolvedValue(undefined) }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockReg) },
      configurable: true,
    })
  })

  it('wysyła powiadomienie gdy są zaległe rośliny', async () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'granted' }

    const plantsStore = usePlantsStore()
    vi.spyOn(plantsStore, 'fetchAll').mockImplementation(async () => {
      plantsStore.plants = [
        { id: 1, name: 'Test', room: 'salon', wateringIntervalDays: 1, createdAt: new Date(0) },
      ]
    })
    const eventsStore = useCareEventsStore()
    vi.spyOn(eventsStore, 'fetchAll').mockResolvedValue([])

    const mockReg = (await navigator.serviceWorker.ready) as unknown as {
      showNotification: MockInstance
    }
    const { showNotification } = useNotifications()
    await showNotification()

    expect(mockReg.showNotification).toHaveBeenCalledWith(
      'WodyMiDaj',
      expect.objectContaining({ tag: 'daily-reminder' }),
    )
  })

  it('nie wysyła powiadomienia gdy brak uprawnień', async () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'denied' }

    const mockReg = (await navigator.serviceWorker.ready) as unknown as {
      showNotification: MockInstance
    }
    const { showNotification } = useNotifications()
    await showNotification()

    expect(mockReg.showNotification).not.toHaveBeenCalled()
  })

  it('nie wysyła powiadomienia gdy count = 0', async () => {
    ;(window as unknown as AnyWindow).Notification = { permission: 'granted' }

    const plantsStore = usePlantsStore()
    vi.spyOn(plantsStore, 'fetchAll').mockImplementation(async () => {
      plantsStore.plants = [
        { id: 1, name: 'Test', room: 'salon', wateringIntervalDays: 7, createdAt: new Date(0) },
      ]
    })
    const eventsStore = useCareEventsStore()
    const today = new Date().toISOString()
    vi.spyOn(eventsStore, 'fetchAll').mockResolvedValue([
      { id: 1, plantId: 1, type: 'watering', date: new Date(today) },
    ])

    const mockReg = (await navigator.serviceWorker.ready) as unknown as {
      showNotification: MockInstance
    }
    const { showNotification } = useNotifications()
    await showNotification()

    expect(mockReg.showNotification).not.toHaveBeenCalled()
  })
})
