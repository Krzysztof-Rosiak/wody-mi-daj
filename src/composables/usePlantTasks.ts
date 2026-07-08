import { ref, computed } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'
import { useSnoozesStore } from '@/stores/snoozes'
import { useSurveysStore } from '@/stores/surveys'
import { useSettingsStore } from '@/stores/settings'
import { useRoomsStore } from '@/stores/rooms'
import { useCareActions } from './useCareActions'
import { useAddSurvey } from './useAddSurvey'
import { sortByRoom as sortItemsByRoom } from './groupByRoom'
import {
  getWateringInterval,
  getFertilizingInterval,
  getMistingInterval,
  getCleaningInterval,
} from './usePlantSchedule'
import type {
  CareEvent,
  CareType,
  DoneItem,
  Plant,
  PlantSurvey,
  Snooze,
  SnoozedCareType,
  TaskItem,
} from '@/types'

const MS_PER_DAY = 86_400_000

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// ─── Pure helper functions (exported for tests) ──────────────────────

type IntervalCareType = 'watering' | 'fertilizing' | 'misting' | 'cleaning'

type CareKey = `${number}:${IntervalCareType}`

export function buildLastEventIndex(events: CareEvent[]): Map<CareKey, number> {
  const index: Map<CareKey, number> = new Map()
  for (const e of events) {
    if (
      e.type !== 'watering' &&
      e.type !== 'fertilizing' &&
      e.type !== 'misting' &&
      e.type !== 'cleaning'
    )
      continue
    const key: CareKey = `${e.plantId}:${e.type}`
    const ts = new Date(e.date).getTime()
    const existing = index.get(key)
    if (existing === undefined || ts > existing) index.set(key, ts)
  }
  return index
}

export function daysSinceLastIndexed(
  index: Map<CareKey, number>,
  plantId: number,
  type: IntervalCareType,
): number | null {
  const ts = index.get(`${plantId}:${type}`)
  if (ts === undefined) return null
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)
  const eventMidnight = new Date(ts)
  eventMidnight.setHours(0, 0, 0, 0)
  return Math.floor((todayMidnight.getTime() - eventMidnight.getTime()) / MS_PER_DAY)
}

export function buildTasksFromEvents(
  plants: Plant[],
  index: Map<CareKey, number>,
  getInterval: (plant: Plant) => number | null,
  careType: IntervalCareType,
  snoozes: Snooze[] = [],
): TaskItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const snoozeMap = new Map(snoozes.map((s) => [`${s.plantId}:${s.careType}`, s]))

  return plants
    .map((plant) => {
      const interval = getInterval(plant)
      if (!interval) return null

      const snooze = snoozeMap.get(`${plant.id}:${careType}`)

      // Active snooze — hide the task
      if (snooze && new Date(snooze.until) > today) return null

      const days = daysSinceLastIndexed(index, plant.id as number, careType)

      let overdue: number
      if (snooze) {
        const snoozeUntil = new Date(snooze.until)
        snoozeUntil.setHours(0, 0, 0, 0)
        if (days !== null && days < interval) {
          // Last care falls within the interval — task isn't overdue, ignore the snooze
          overdue = days - interval
        } else {
          // No recent care — count overdue days from the snooze.until date
          overdue = Math.floor((today.getTime() - snoozeUntil.getTime()) / MS_PER_DAY)
        }
      } else if (days === null) {
        // No events — appears only once the plant is older than the interval, without an overdue counter
        const createdAt = plant.createdAt ? new Date(plant.createdAt) : today
        createdAt.setHours(0, 0, 0, 0)
        const daysSinceCreated = Math.floor((today.getTime() - createdAt.getTime()) / MS_PER_DAY)
        overdue = daysSinceCreated >= interval ? 0 : -1
      } else {
        overdue = days - interval
      }

      return { plant, daysSince: days, overdue }
    })
    .filter((t): t is TaskItem => t !== null && t.overdue >= 0)
    .sort((a, b) => b.overdue - a.overdue)
}

type UpcomingIntervalTask = TaskItem & { daysUntil: number; careType: IntervalCareType }

function isUpcomingTask(t: UpcomingIntervalTask | null): t is UpcomingIntervalTask {
  return t !== null
}

export function buildUpcomingTasks(
  plants: Plant[],
  index: Map<CareKey, number>,
  getInterval: (plant: Plant) => number | null,
  careType: IntervalCareType,
  snoozes: Snooze[] = [],
  daysAhead = 5,
): Array<TaskItem & { daysUntil: number; careType: IntervalCareType }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const snoozeMap = new Map(snoozes.map((s) => [`${s.plantId}:${s.careType}`, s]))

  return plants
    .map((plant) => {
      const interval = getInterval(plant)
      if (!interval) return null

      const snooze = snoozeMap.get(`${plant.id}:${careType}`)
      if (snooze) {
        const until = new Date(snooze.until)
        until.setHours(0, 0, 0, 0)
        if (until > today) {
          const daysUntil = Math.round((until.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntil > daysAhead) return null
          return { plant, daysSince: null, overdue: -daysUntil, daysUntil, careType }
        }
      }

      const days = daysSinceLastIndexed(index, plant.id as number, careType)
      const overdue = days === null ? interval : days - interval

      if (overdue < -daysAhead || overdue >= 0) return null

      return { plant, daysSince: days, overdue, daysUntil: Math.abs(overdue), careType }
    })
    .filter(isUpcomingTask)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function usePlantTasks() {
  const plantsStore = usePlantsStore()
  const careEventsStore = useCareEventsStore()
  const snoozesStore = useSnoozesStore()
  const surveysStore = useSurveysStore()
  const settingsStore = useSettingsStore()
  const roomsStore = useRoomsStore()
  const { addCareEvent } = useCareActions()
  const { addSurvey: addSurveyToDb } = useAddSurvey()

  const allEvents = ref<CareEvent[]>([])
  const allSnoozes = ref<Snooze[]>([])
  const allSurveys = ref<PlantSurvey[]>([])
  const loading = ref(true)

  async function load() {
    await Promise.all([
      plantsStore.plants.length ? Promise.resolve() : plantsStore.fetchAll(),
      roomsStore.fetchAll(),
      careEventsStore.fetchAll().then((v) => {
        allEvents.value = v
      }),
      snoozesStore.getAll().then((v) => {
        allSnoozes.value = v
      }),
      surveysStore.fetchAll().then((v) => {
        // strip imageBase64 — task computation needs only date/condition/plantId
        allSurveys.value = v.map(({ imageBase64: _img, ...s }) => s as PlantSurvey)
      }),
    ])
    loading.value = false
  }

  async function markDone(plantId: number, type: SnoozedCareType) {
    const created = await addCareEvent(plantId, type as CareType)
    allEvents.value = [...allEvents.value, ...created]
    allSnoozes.value = await snoozesStore.getAll()
  }

  async function markCombinedDone(plantId: number) {
    const created = await addCareEvent(plantId, 'fertilizing')
    allEvents.value = [...allEvents.value, ...created]
    allSnoozes.value = await snoozesStore.getAll()
  }

  async function snoozeTask(plantId: number, type: SnoozedCareType, until: Date) {
    await snoozesStore.snooze(plantId, type, until)
    allSnoozes.value = await snoozesStore.getAll()
  }

  async function saveSurvey(survey: Omit<PlantSurvey, 'id'>) {
    await addSurveyToDb(survey)
    await snoozesStore.clear(survey.plantId, 'survey')
    allSurveys.value = await surveysStore.fetchAll()
    allSnoozes.value = await snoozesStore.getAll()
  }

  const lastEventIndex = computed(() => buildLastEventIndex(allEvents.value))

  const wateringTasks = computed(() =>
    buildTasksFromEvents(
      plantsStore.plants,
      lastEventIndex.value,
      (plant) => getWateringInterval(plant),
      'watering',
      allSnoozes.value,
    ),
  )

  const fertilizingTasks = computed(() =>
    buildTasksFromEvents(
      plantsStore.plants,
      lastEventIndex.value,
      (plant) => getFertilizingInterval(plant),
      'fertilizing',
      allSnoozes.value,
    ),
  )

  const mistingTasks = computed(() =>
    sortByRoom(buildTasksFromEvents(
      plantsStore.plants,
      lastEventIndex.value,
      (plant) => getMistingInterval(plant),
      'misting',
      allSnoozes.value,
    )),
  )

  const cleaningTasks = computed(() =>
    sortByRoom(buildTasksFromEvents(
      plantsStore.plants,
      lastEventIndex.value,
      (plant) => getCleaningInterval(plant),
      'cleaning',
      allSnoozes.value,
    )),
  )

  const _surveyTasksUnsorted = computed<TaskItem[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    function surveyInterval(condition: number | undefined): number {
      if (condition === 1) return 7
      if (condition === 2 || condition === 3) return 14
      return 30
    }

    const lastSurveyByPlant = new Map<number, PlantSurvey>()
    for (const s of allSurveys.value) {
      const existing = lastSurveyByPlant.get(s.plantId)
      if (!existing || new Date(s.date) > new Date(existing.date)) {
        lastSurveyByPlant.set(s.plantId, s)
      }
    }

    const snoozedSurveyPlants = new Set(
      allSnoozes.value
        .filter((s) => s.careType === 'survey' && new Date(s.until) > today)
        .map((s) => s.plantId),
    )

    return plantsStore.plants
      .filter(
        (plant) => plant.surveyEnabled !== false && !snoozedSurveyPlants.has(plant.id as number),
      )
      .map((plant) => {
        const lastSurvey = lastSurveyByPlant.get(plant.id as number)
        let daysSince: number | null = null
        if (lastSurvey) {
          const lastDate = new Date(lastSurvey.date)
          lastDate.setHours(0, 0, 0, 0)
          daysSince = Math.floor((today.getTime() - lastDate.getTime()) / MS_PER_DAY)
        }
        const interval = surveyInterval(lastSurvey?.condition)
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const overdue =
          daysSince === null
            ? Math.floor((today.getTime() - monthStart.getTime()) / MS_PER_DAY)
            : daysSince - interval
        return { plant, daysSince, overdue, interval }
      })
      .filter((item) => item.overdue >= 0)
  })

  const surveyTasks = computed<TaskItem[]>(() => {
    // Stable sort: secondary criterion first, then by room (order within a room is preserved).
    const bySecondary = _surveyTasksUnsorted.value.slice().sort((a, b) => {
      if (a.daysSince === null && b.daysSince !== null) return -1
      if (a.daysSince !== null && b.daysSince === null) return 1
      return (b.overdue ?? 0) - (a.overdue ?? 0)
    })
    return sortByRoom(bySecondary)
  })

  function sortByRoom(tasks: TaskItem[]): TaskItem[] {
    return sortItemsByRoom(tasks, roomsStore.allRooms)
  }

  // When using liquid fertilizer: combined = watering AND fertilizing required at the same time.
  // Fertilizing without a required watering is deferred to the next watering (not shown separately).
  const combinedTasks = computed<TaskItem[]>(() => {
    if (!settingsStore.combineWateringFertilizing) return []
    const wateringMap = new Map(wateringTasks.value.map((t) => [t.plant.id, t]))
    return sortByRoom(
      fertilizingTasks.value
        .filter((t) => wateringMap.has(t.plant.id as number))
        .map((t) => wateringMap.get(t.plant.id as number)!),
    )
  })

  const combinedPlantIds = computed(() => new Set(combinedTasks.value.map((t) => t.plant.id)))

  // Watering without combined ones (plants with no fertilizing due)
  const wateringOnlyTasks = computed(() => {
    const base = settingsStore.combineWateringFertilizing
      ? wateringTasks.value.filter((t) => !combinedPlantIds.value.has(t.plant.id))
      : wateringTasks.value
    return sortByRoom(base)
  })

  // Fertilizing separately — always empty in combined mode (fertilizing waits for watering)
  const fertilizingOnlyTasks = computed(() => {
    if (!settingsStore.combineWateringFertilizing) return sortByRoom(fertilizingTasks.value)
    return []
  })

  const totalTasks = computed(
    () =>
      combinedTasks.value.length +
      wateringOnlyTasks.value.length +
      fertilizingOnlyTasks.value.length +
      mistingTasks.value.length +
      cleaningTasks.value.length +
      surveyTasks.value.length,
  )

  const upcomingTasks = computed(() => {
    const idx = lastEventIndex.value
    const wateringUp = buildUpcomingTasks(
      plantsStore.plants,
      idx,
      (p) => getWateringInterval(p),
      'watering',
      allSnoozes.value,
      60,
    )
    const fertilizingUp = buildUpcomingTasks(
      plantsStore.plants,
      idx,
      (p) => getFertilizingInterval(p),
      'fertilizing',
      allSnoozes.value,
      60,
    )
    const mistingUp = buildUpcomingTasks(
      plantsStore.plants,
      idx,
      (p) => getMistingInterval(p),
      'misting',
      allSnoozes.value,
      60,
    )
    const cleaningUp = buildUpcomingTasks(
      plantsStore.plants,
      idx,
      (p) => getCleaningInterval(p),
      'cleaning',
      allSnoozes.value,
      60,
    )

    type UpcomingTask = TaskItem & {
      daysUntil: number
      careType: IntervalCareType | 'combined'
    }

    if (!settingsStore.combineWateringFertilizing) {
      return [...wateringUp, ...fertilizingUp, ...mistingUp, ...cleaningUp].sort(
        (a, b) => a.daysUntil - b.daysUntil,
      ) as UpcomingTask[]
    }

    const fertMap = new Map(fertilizingUp.map((t) => [t.plant.id as number, t]))

    // Plants where fertilizing is overdue (didn't make it into fertilizingUp)
    const overdueOrDueFertIds = new Set(
      fertilizingTasks.value.map((t) => t.plant.id as number),
    )

    const result: UpcomingTask[] = []

    for (const wTask of wateringUp) {
      const plantId = wTask.plant.id as number
      const fTask = fertMap.get(plantId)
      if (fTask || overdueOrDueFertIds.has(plantId)) {
        result.push({ ...wTask, careType: 'combined' })
      } else {
        result.push(wTask)
      }
    }
    // In combined mode, fertilizing without a scheduled watering is skipped

    return [...result, ...mistingUp, ...cleaningUp].sort((a, b) => a.daysUntil - b.daysUntil)
  })

  const upcomingByDay = computed<Record<number, number>>(() =>
    upcomingTasks.value.reduce(
      (acc, t) => {
        acc[t.daysUntil] = (acc[t.daysUntil] ?? 0) + 1
        return acc
      },
      {} as Record<number, number>,
    ),
  )

  const activePlantIds = computed(() => new Set(plantsStore.plants.map((p) => p.id as number)))

  const eventsByDay = computed(() => {
    const map = new Map<string, CareEvent[]>()
    for (const e of allEvents.value) {
      const key = toLocalDateKey(new Date(e.date))
      const bucket = map.get(key)
      if (bucket) bucket.push(e)
      else map.set(key, [e])
    }
    return map
  })

  const doneByDay = computed(() => {
    const acc: { [k: string]: number } = {}
    for (const e of allEvents.value) {
      if (!activePlantIds.value.has(e.plantId)) continue
      const key = toLocalDateKey(new Date(e.date))
      acc[key] = (acc[key] ?? 0) + 1
    }
    return acc
  })

  const todayDone = computed<DoneItem[]>(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return allEvents.value
      .filter((e) => new Date(e.date).getTime() >= todayStart.getTime())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => ({ event: e, plant: plantsStore.plants.find((p) => p.id === e.plantId) }))
      .filter(
        (item): item is DoneItem & { plant: NonNullable<DoneItem['plant']> } =>
          item.plant !== undefined,
      )
  })

  return {
    loading,
    load,
    markDone,
    markCombinedDone,
    snoozeTask,
    saveSurvey,
    wateringTasks,
    wateringOnlyTasks,
    fertilizingTasks,
    fertilizingOnlyTasks,
    combinedTasks,
    mistingTasks,
    cleaningTasks,
    surveyTasks,
    totalTasks,
    upcomingTasks,
    upcomingByDay,
    eventsByDay,
    doneByDay,
    todayDone,
    allEvents,
  }
}
