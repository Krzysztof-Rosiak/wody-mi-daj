import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'
import { buildTasksFromEvents, buildLastEventIndex } from '@/composables/usePlantTasks'
import { getWateringInterval } from '@/composables/usePlantSchedule'
import type { CareEvent, Snooze } from '@/types'
import { db } from '@/db'

const CACHE_KEY = 'plants-watering-cache'

function readCache(): Record<number, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(map: Record<number, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {}
}

export const useWateringCacheStore = defineStore('wateringCache', () => {
  const lastWateringDates = ref<Record<number, string>>(readCache())
  const loaded = ref(Object.keys(lastWateringDates.value).length > 0)
  const cachedEvents = ref<CareEvent[]>([])
  const cachedSnoozes = ref<Snooze[]>([])
  let fetchPromise: Promise<void> | null = null

  const needsAttentionIds = computed((): number[] => {
    const plantsStore = usePlantsStore()

    const index = buildLastEventIndex(cachedEvents.value)

    const tasks = buildTasksFromEvents(
      plantsStore.plants,
      index,
      (plant) => getWateringInterval(plant),
      'watering',
      cachedSnoozes.value,
    )

    return tasks.map((t) => t.plant.id as number)
  })

  async function refresh(): Promise<void> {
    if (fetchPromise) return fetchPromise
    fetchPromise = _doRefresh().finally(() => {
      fetchPromise = null
    })
    return fetchPromise
  }

  async function _doRefresh(): Promise<void> {
    const careEventsStore = useCareEventsStore()
    const [allEvents, allSnoozes] = await Promise.all([
      careEventsStore.fetchAll(),
      db.snoozes.toArray(),
    ])

    cachedEvents.value = allEvents
    cachedSnoozes.value = allSnoozes

    const map: Record<number, string> = {}
    for (const e of allEvents) {
      if (e.type !== 'watering') continue
      const existing = map[e.plantId]
      const dateStr = new Date(e.date).toISOString()
      if (!existing || dateStr > existing) map[e.plantId] = dateStr
    }
    lastWateringDates.value = map
    loaded.value = true
    writeCache(map)
  }

  function getLastWateringDate(plantId: number): string | undefined {
    return lastWateringDates.value[plantId]
  }

  return { lastWateringDates, loaded, needsAttentionIds, refresh, getLastWateringDate }
})
