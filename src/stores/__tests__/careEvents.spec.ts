import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCareEventsStore } from '../careEvents'
import { db } from '@/db'

describe('useCareEventsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
  })

  // ─── fetchByPlant ───────────────────────────────────────────────────────────

  it('fetchByPlant zwraca zdarzenia dla danej rośliny', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date('2024-01-10') })
    await db.careEvents.add({ plantId: 1, type: 'fertilizing', date: new Date('2024-01-15') })
    await db.careEvents.add({ plantId: 2, type: 'watering', date: new Date('2024-01-12') })

    await store.fetchByPlant(1)
    expect(store.events).toHaveLength(2)
    expect(store.events.every((e) => e.plantId === 1)).toBe(true)
  })

  it('fetchByPlant nie zwraca zdarzeń innych roślin', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 5, type: 'pruning', date: new Date() })
    await store.fetchByPlant(1)
    expect(store.events).toHaveLength(0)
  })

  it('fetchByPlant ustawia loading na false po zakończeniu', async () => {
    const store = useCareEventsStore()
    await store.fetchByPlant(1)
    expect(store.loading).toBe(false)
  })

  it('fetchByPlant sortuje zdarzenia od najnowszego', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date('2024-01-01') })
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date('2024-06-01') })
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date('2024-03-01') })

    await store.fetchByPlant(1)

    const dates = store.events.map((e) => new Date(e.date).getTime())
    expect(dates[0]).toBeGreaterThan(dates[1])
    expect(dates[1]).toBeGreaterThan(dates[2])
  })

  // ─── fetchAll ───────────────────────────────────────────────────────────────

  it('fetchAll zwraca wszystkie zdarzenia z bazy', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date() })
    await db.careEvents.add({ plantId: 2, type: 'fertilizing', date: new Date() })
    await db.careEvents.add({ plantId: 3, type: 'misting', date: new Date() })

    const all = await store.fetchAll()
    expect(all).toHaveLength(3)
  })

  it('fetchAll zwraca pustą tablicę gdy baza pusta', async () => {
    const store = useCareEventsStore()
    const all = await store.fetchAll()
    expect(all).toHaveLength(0)
  })

  // ─── add ────────────────────────────────────────────────────────────────────

  it('add dodaje zdarzenie do bazy', async () => {
    const store = useCareEventsStore()
    await store.add({ plantId: 1, type: 'watering', date: new Date() })
    const all = await db.careEvents.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].type).toBe('watering')
  })

  it('add z notatką zapisuje notes', async () => {
    const store = useCareEventsStore()
    await store.add({ plantId: 1, type: 'repotting', date: new Date(), notes: 'Nowa doniczka 20cm' })
    const all = await db.careEvents.toArray()
    expect(all[0].notes).toBe('Nowa doniczka 20cm')
  })

  it('add zwraca nowe zdarzenie z id', async () => {
    const store = useCareEventsStore()
    const event = await store.add({ plantId: 1, type: 'misting', date: new Date() })
    expect(typeof event.id).toBe('number')
    expect(event.id).toBeGreaterThan(0)
    expect(event.type).toBe('misting')
  })

  it('add odświeża events gdy dodajemy zdarzenie aktualnie załadowanej rośliny', async () => {
    const store = useCareEventsStore()
    // There must be at least one event so the store knows which plant's data is loaded
    await db.careEvents.add({ plantId: 1, type: 'fertilizing', date: new Date('2024-01-01') })
    await store.fetchByPlant(1)
    expect(store.events).toHaveLength(1)

    await store.add({ plantId: 1, type: 'watering', date: new Date() })
    expect(store.events).toHaveLength(2)
  })

  it('add nie odświeża events gdy dodajemy zdarzenie innej rośliny', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 2, type: 'watering', date: new Date() })
    await store.fetchByPlant(2)
    expect(store.events).toHaveLength(1)

    await store.add({ plantId: 99, type: 'pruning', date: new Date() })
    // events still shows plant 2
    expect(store.events).toHaveLength(1)
    expect(store.events[0].plantId).toBe(2)
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  it('remove usuwa zdarzenie', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'pruning', date: new Date() })
    await store.fetchByPlant(1)
    const id = store.events[0].id as number
    await store.remove(id)
    expect(store.events).toHaveLength(0)
  })

  it('remove usuwa tylko wskazane zdarzenie, reszta niezmieniona', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'watering', date: new Date('2024-01-01') })
    await db.careEvents.add({ plantId: 1, type: 'fertilizing', date: new Date('2024-06-01') })
    await store.fetchByPlant(1)
    const idToRemove = store.events[0].id as number
    await store.remove(idToRemove)
    expect(store.events).toHaveLength(1)
  })

  // ─── lastEventByType ────────────────────────────────────────────────────────

  it('lastEventByType zwraca najnowsze zdarzenie z załadowanych danych', async () => {
    const store = useCareEventsStore()
    const older = new Date('2024-01-01')
    const newer = new Date('2024-06-01')
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: older },
      { plantId: 1, type: 'watering', date: newer },
    ])
    await store.fetchByPlant(1)

    const last = store.lastEventByType(1, 'watering')
    expect(last?.date).toEqual(newer)
  })

  it('lastEventByType zwraca undefined gdy brak zdarzeń danego typu w store', async () => {
    const store = useCareEventsStore()
    await db.careEvents.add({ plantId: 1, type: 'fertilizing', date: new Date() })
    await store.fetchByPlant(1)

    expect(store.lastEventByType(1, 'watering')).toBeUndefined()
  })

  it('lastEventByType filtruje po plantId', async () => {
    const store = useCareEventsStore()
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: new Date('2024-01-01') },
      { plantId: 2, type: 'watering', date: new Date('2024-12-01') },
    ])
    await store.fetchByPlant(1)

    const last = store.lastEventByType(1, 'watering')
    expect(last?.plantId).toBe(1)
  })

  // ─── getLastEventByType ─────────────────────────────────────────────────────

  it('getLastEventByType zwraca najnowsze zdarzenie danego typu', async () => {
    const store = useCareEventsStore()
    const older = new Date('2024-01-01')
    const newer = new Date('2024-06-01')
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: older },
      { plantId: 1, type: 'watering', date: newer },
    ])

    const last = await store.getLastEventByType(1, 'watering')
    expect(last?.date).toEqual(newer)
  })

  it('getLastEventByType zwraca undefined gdy brak zdarzeń danego typu', async () => {
    const store = useCareEventsStore()
    const result = await store.getLastEventByType(1, 'watering')
    expect(result).toBeUndefined()
  })

  it('getLastEventByType filtruje po typie — nie myli typów', async () => {
    const store = useCareEventsStore()
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'fertilizing', date: new Date('2024-12-01') },
      { plantId: 1, type: 'watering', date: new Date('2024-01-01') },
    ])

    const last = await store.getLastEventByType(1, 'watering')
    expect(last?.type).toBe('watering')
  })

  it('getLastEventByType filtruje po plantId', async () => {
    const store = useCareEventsStore()
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: new Date('2024-01-01') },
      { plantId: 2, type: 'watering', date: new Date('2024-12-01') },
    ])

    const result = await store.getLastEventByType(1, 'watering')
    expect(result?.plantId).toBe(1)
  })
})
