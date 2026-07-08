import { useCareEventsStore } from '@/stores/careEvents'
import { useSnoozesStore } from '@/stores/snoozes'
import { useSettingsStore } from '@/stores/settings'
import type { CareType } from '@/types'

const SNOOZEABLE = new Set(['watering', 'fertilizing', 'misting', 'cleaning'])

export function useCareActions() {
  const careEventsStore = useCareEventsStore()
  const snoozesStore = useSnoozesStore()
  const settingsStore = useSettingsStore()

  async function addCareEvent(plantId: number, type: CareType, date: Date = new Date()) {
    const created = [await careEventsStore.add({ plantId, type, date })]
    if (SNOOZEABLE.has(type)) {
      await snoozesStore.clear(plantId, type as 'watering' | 'fertilizing' | 'misting' | 'cleaning')
    }
    if (type === 'fertilizing' && settingsStore.combineWateringFertilizing) {
      created.push(await careEventsStore.add({ plantId, type: 'watering', date }))
      await snoozesStore.clear(plantId, 'watering')
    }
    return created
  }

  return { addCareEvent }
}
