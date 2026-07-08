import { ref, computed, onMounted } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useRepottingDismissalsStore } from '@/stores/repottingDismissals'
import { db } from '@/db'
import {
  getPlantsToRepot,
  getPlantsToPrune,
  getCategoryForPlant,
  monthsDiff,
} from '@/composables/usePlantSchedule'
import type { CareEvent } from '@/types'

export function useSeasonalTasks() {
  const plantsStore = usePlantsStore()
  const repottingDismissalsStore = useRepottingDismissalsStore()

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const dismissedRepottingIds = ref<Set<number>>(new Set())
  const dismissedPruningIds = ref<Set<number>>(new Set())
  const monthEvents = ref<CareEvent[]>([])
  const allRepottingEvents = ref<CareEvent[]>([])

  const dismissPruningKey = `dismissed-pruning-${currentYear}-${currentMonth}`

  function loadDismissedPruning(): Set<number> {
    try {
      const raw = localStorage.getItem(dismissPruningKey)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  }

  async function load() {
    const [[repotting, pruning], dismissals] = await Promise.all([
      Promise.all([
        db.careEvents.where('type').equals('repotting').toArray(),
        db.careEvents.where('type').equals('pruning').filter((e) => {
          const d = new Date(e.date)
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth
        }).toArray(),
      ]),
      repottingDismissalsStore.getAll(),
    ])
    allRepottingEvents.value = repotting
    monthEvents.value = [
      ...repotting.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      }),
      ...pruning,
    ]
    dismissedRepottingIds.value = new Set(
      dismissals.filter((d) => d.dismissedUntilYear > currentYear).map((d) => d.plantId),
    )
    dismissedPruningIds.value = loadDismissedPruning()
  }

  onMounted(load)

  const doneRepottingIds = computed(
    () => new Set(monthEvents.value.filter((e) => e.type === 'repotting').map((e) => e.plantId)),
  )
  const donePruningIds = computed(
    () => new Set(monthEvents.value.filter((e) => e.type === 'pruning').map((e) => e.plantId)),
  )

  const lastRepottingByPlant = computed(() => {
    const map = new Map<number, CareEvent>()
    for (const e of allRepottingEvents.value) {
      const existing = map.get(e.plantId)
      if (!existing || new Date(e.date) > new Date(existing.date)) map.set(e.plantId, e)
    }
    return map
  })

  const toRepot = computed(() =>
    getPlantsToRepot(plantsStore.plants).filter((p) => {
      if (doneRepottingIds.value.has(p.id as number)) return false
      if (dismissedRepottingIds.value.has(p.id as number)) return false
      const lastRepot = lastRepottingByPlant.value.get(p.id as number)
      if (lastRepot) {
        if (new Date(lastRepot.date).getFullYear() === currentYear) return false
        const category = getCategoryForPlant(p)
        const cooldown = category?.repottingCooldownMonths ?? 18
        if (monthsDiff(new Date(lastRepot.date), new Date()) < cooldown) return false
      }
      return true
    }),
  )

  const toPrune = computed(() =>
    getPlantsToPrune(plantsStore.plants).filter(
      (p) =>
        !donePruningIds.value.has(p.id as number) &&
        !dismissedPruningIds.value.has(p.id as number),
    ),
  )

  const seasonalCount = computed(() => toRepot.value.length + toPrune.value.length)

  async function dismissRepotting(plantId: number) {
    await repottingDismissalsStore.dismiss(plantId)
    dismissedRepottingIds.value = new Set([...dismissedRepottingIds.value, plantId])
  }

  function dismissPruning(plantId: number) {
    dismissedPruningIds.value = new Set([...dismissedPruningIds.value, plantId])
    localStorage.setItem(dismissPruningKey, JSON.stringify([...dismissedPruningIds.value]))
  }

  return {
    toRepot,
    toPrune,
    doneRepottingIds,
    donePruningIds,
    dismissedRepottingIds,
    dismissedPruningIds,
    seasonalCount,
    currentMonth,
    currentYear,
    dismissRepotting,
    dismissPruning,
    load,
  }
}
