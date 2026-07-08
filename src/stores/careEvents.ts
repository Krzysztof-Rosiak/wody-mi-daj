import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db'
import type { CareEvent, CareType } from '@/types'

export const useCareEventsStore = defineStore('careEvents', () => {
  const events = ref<CareEvent[]>([])
  const loading = ref(false)
  const writeVersion = ref(0)
  const loadedForPlantId = ref<number | null>(null)

  async function fetchByPlant(plantId: number) {
    loading.value = true
    events.value = await db.careEvents
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('date')
    loadedForPlantId.value = plantId
    loading.value = false
  }

  async function fetchAll(): Promise<CareEvent[]> {
    return db.careEvents.orderBy('date').toArray()
  }

  async function add(event: Omit<CareEvent, 'id'>): Promise<CareEvent> {
    const id = await db.careEvents.add(event)
    writeVersion.value++
    if (loadedForPlantId.value === event.plantId) {
      await fetchByPlant(event.plantId)
    }
    return { ...event, id: id as number }
  }

  async function remove(id: number) {
    await db.careEvents.delete(id)
    writeVersion.value++
    events.value = events.value.filter((e) => e.id !== id)
  }

  function lastEventByType(plantId: number, type: CareType): CareEvent | undefined {
    let best: CareEvent | undefined
    for (const e of events.value) {
      if (e.plantId !== plantId || e.type !== type) continue
      if (!best || new Date(e.date) > new Date(best.date)) best = e
    }
    return best
  }

  async function getLastEventByType(
    plantId: number,
    type: CareType,
  ): Promise<CareEvent | undefined> {
    const results = await db.careEvents
      .where('plantId')
      .equals(plantId)
      .filter((e) => e.type === type)
      .toArray()
    return results.reduce<CareEvent | undefined>(
      (best, e) => (!best || new Date(e.date) > new Date(best.date) ? e : best),
      undefined,
    )
  }

  return { events, loading, writeVersion, fetchByPlant, fetchAll, add, remove, lastEventByType, getLastEventByType }
})
