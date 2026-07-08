import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlantsStore } from '../plants'
import { db } from '@/db'

describe('usePlantsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
  })

  // ─── fetchAll ───────────────────────────────────────────────────────────────

  it('fetchAll zwraca pustą listę gdy baza pusta', async () => {
    const store = usePlantsStore()
    await store.fetchAll()
    expect(store.plants).toHaveLength(0)
  })

  it('fetchAll zwraca rośliny posortowane od najnowszej', async () => {
    const older = new Date('2024-01-01')
    const newer = new Date('2024-06-01')
    await db.plants.add({ name: 'Stara', room: 'Salon', createdAt: older })
    await db.plants.add({ name: 'Nowa', room: 'Salon', createdAt: newer })

    const store = usePlantsStore()
    await store.fetchAll()

    expect(store.plants[0].name).toBe('Nowa')
    expect(store.plants[1].name).toBe('Stara')
  })

  it('loading jest true w trakcie fetchAll i false po zakończeniu', async () => {
    const store = usePlantsStore()
    const promise = store.fetchAll()
    expect(store.loading).toBe(true)
    await promise
    expect(store.loading).toBe(false)
  })

  // ─── add ────────────────────────────────────────────────────────────────────

  it('add dodaje roślinę do bazy', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Kroton', room: 'Salon' })
    expect(store.plants).toHaveLength(1)
    expect(store.plants[0].name).toBe('Kroton')
    expect(store.plants[0].room).toBe('Salon')
  })

  it('add ustawia createdAt automatycznie', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Fikus', room: 'Kuchnia' })
    expect(store.plants[0].createdAt).toBeInstanceOf(Date)
  })

  it('add zwraca id nowej rośliny', async () => {
    const store = usePlantsStore()
    const id = await store.add({ name: 'Aloes', room: 'Taras' })
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })

  it('add zachowuje opcjonalne pola', async () => {
    const store = usePlantsStore()
    await store.add({
      name: 'Monstera',
      room: 'Salon',
      species: 'Monstera deliciosa',
      notes: 'Lubi wilgoć',
      wateringIntervalDays: 7,
      fertilizingIntervalDays: 14,
      mistingIntervalDays: 3,
    })
    const plant = store.plants[0]
    expect(plant.species).toBe('Monstera deliciosa')
    expect(plant.notes).toBe('Lubi wilgoć')
    expect(plant.wateringIntervalDays).toBe(7)
    expect(plant.fertilizingIntervalDays).toBe(14)
    expect(plant.mistingIntervalDays).toBe(3)
  })

  it('add wielu roślin — wszystkie są widoczne w store', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Aloes', room: 'Salon' })
    await store.add({ name: 'Fikus', room: 'Salon' })
    await store.add({ name: 'Palma', room: 'Salon' })
    expect(store.plants).toHaveLength(3)
  })

  // ─── update ─────────────────────────────────────────────────────────────────

  it('update zmienia dane rośliny', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Kroton', room: 'Salon' })
    const id = store.plants[0].id as number
    await store.update(id, { name: 'Kroton Czerwony', room: 'Sypialnia' })
    expect(store.plants[0].name).toBe('Kroton Czerwony')
    expect(store.plants[0].room).toBe('Sypialnia')
  })

  it('update zmienia tylko podane pola, reszta niezmieniona', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Fikus', room: 'Salon', species: 'Ficus benjamina' })
    const id = store.plants[0].id as number
    await store.update(id, { room: 'Kuchnia' })
    const updated = store.plants[0]
    expect(updated.name).toBe('Fikus')
    expect(updated.species).toBe('Ficus benjamina')
    expect(updated.room).toBe('Kuchnia')
  })

  it('update może ustawić wateringIntervalDays', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Monstera', room: 'Salon' })
    const id = store.plants[0].id as number
    await store.update(id, { wateringIntervalDays: 10 })
    expect(store.plants[0].wateringIntervalDays).toBe(10)
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  it('remove usuwa roślinę z bazy', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Kroton', room: 'Salon' })
    const id = store.plants[0].id as number
    await store.remove(id)
    expect(store.plants).toHaveLength(0)
  })

  it('remove usuwa też powiązane zdarzenia pielęgnacji', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Kroton', room: 'Salon' })
    const plantId = store.plants[0].id as number
    await db.careEvents.add({ plantId, type: 'watering', date: new Date() })
    await db.careEvents.add({ plantId, type: 'fertilizing', date: new Date() })
    await store.remove(plantId)
    const events = await db.careEvents.where('plantId').equals(plantId).toArray()
    expect(events).toHaveLength(0)
  })

  it('remove nie usuwa zdarzeń innych roślin', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Roślina A', room: 'Salon' })
    await store.add({ name: 'Roślina B', room: 'Salon' })
    const idA = store.plants[0].id as number
    const idB = store.plants[1].id as number
    await db.careEvents.add({ plantId: idA, type: 'watering', date: new Date() })
    await db.careEvents.add({ plantId: idB, type: 'watering', date: new Date() })

    await store.remove(idA)

    const eventsB = await db.careEvents.where('plantId').equals(idB).toArray()
    expect(eventsB).toHaveLength(1)
  })

  it('remove jednej z wielu roślin — pozostałe widoczne', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Aloes', room: 'Salon' })
    await store.add({ name: 'Fikus', room: 'Salon' })
    const toRemove = store.plants.find((p) => p.name === 'Aloes')
    expect(toRemove).toBeDefined()
    await store.remove(toRemove?.id as number)
    expect(store.plants).toHaveLength(1)
    expect(store.plants[0].name).toBe('Fikus')
  })

  // ─── getById ────────────────────────────────────────────────────────────────

  it('getById zwraca roślinę po id', async () => {
    const store = usePlantsStore()
    await store.add({ name: 'Palma', room: 'Salon' })
    const id = store.plants[0].id as number
    const plant = store.getById(id)
    expect(plant?.name).toBe('Palma')
  })

  it('getById zwraca undefined gdy nie ma rośliny o danym id', async () => {
    const store = usePlantsStore()
    await store.fetchAll()
    expect(store.getById(9999)).toBeUndefined()
  })

  it('getById zwraca undefined przed fetchAll', () => {
    const store = usePlantsStore()
    expect(store.getById(1)).toBeUndefined()
  })
})
