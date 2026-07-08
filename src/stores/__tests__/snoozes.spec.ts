import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSnoozesStore } from '../snoozes'
import { db } from '@/db'

describe('useSnoozesStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.snoozes.clear()
  })

  it('snooze zapisuje wpis do bazy', async () => {
    const store = useSnoozesStore()
    const until = new Date(Date.now() + 3 * 86_400_000)
    await store.snooze(1, 'watering', until)

    const all = await store.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].plantId).toBe(1)
    expect(all[0].careType).toBe('watering')
  })

  it('snooze nadpisuje istniejący wpis dla tej samej rośliny i typu', async () => {
    const store = useSnoozesStore()
    const until1 = new Date(Date.now() + 2 * 86_400_000)
    const until2 = new Date(Date.now() + 5 * 86_400_000)

    await store.snooze(1, 'watering', until1)
    await store.snooze(1, 'watering', until2)

    const all = await store.getAll()
    expect(all).toHaveLength(1)
    expect(new Date(all[0].until).getTime()).toBeCloseTo(until2.getTime(), -3)
  })

  it('clear usuwa wpis dla danej rośliny i typu', async () => {
    const store = useSnoozesStore()
    await store.snooze(1, 'watering', new Date())
    await store.snooze(1, 'fertilizing', new Date())

    await store.clear(1, 'watering')

    const all = await store.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].careType).toBe('fertilizing')
  })

  it('clear nie usuwa wpisów innych roślin', async () => {
    const store = useSnoozesStore()
    await store.snooze(1, 'watering', new Date())
    await store.snooze(2, 'watering', new Date())

    await store.clear(1, 'watering')

    const all = await store.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].plantId).toBe(2)
  })

  it('getAll zwraca wszystkie wpisy', async () => {
    const store = useSnoozesStore()
    await store.snooze(1, 'watering', new Date())
    await store.snooze(2, 'fertilizing', new Date())
    await store.snooze(3, 'misting', new Date())

    const all = await store.getAll()
    expect(all).toHaveLength(3)
  })

  it('getAll zwraca pustą tablicę gdy brak snooze', async () => {
    const store = useSnoozesStore()
    const all = await store.getAll()
    expect(all).toHaveLength(0)
  })
})
