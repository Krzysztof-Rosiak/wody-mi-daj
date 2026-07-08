import { ref, computed } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useCareEventsStore } from '@/stores/careEvents'
import { useSurveysStore } from '@/stores/surveys'
import type { CareEvent, PlantWateringStatus, PlantSurvey } from '@/types'
import { formatDatePl } from '@/utils/date'

export const CARE_TYPE_CONFIG = {
  watering:    { label: 'Podlewanie',   color: 'rgba(33,150,243,0.75)' },
  fertilizing: { label: 'Nawożenie',    color: 'rgba(76,175,80,0.75)' },
  misting:     { label: 'Zraszanie',    color: 'rgba(0,188,212,0.75)' },
  pruning:     { label: 'Przycinanie',  color: 'rgba(255,193,7,0.75)' },
  repotting:   { label: 'Przesadzanie', color: 'rgba(121,85,72,0.75)' },
  cleaning:    { label: 'Czyszczenie',  color: 'rgba(156,39,176,0.75)' },
  other:       { label: 'Inne',         color: 'rgba(158,158,158,0.75)' },
} satisfies Record<string, { label: string; color: string }>

export type ChartCareType = keyof typeof CARE_TYPE_CONFIG

const MS_PER_DAY = 86_400_000
const CHART_DAYS = 30
const DEFAULT_WATERING_INTERVAL = 7
const OVERDUE_NEVER = 999

function daysSinceDate(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - d.getTime()) / MS_PER_DAY)
}


export function useStats() {
  const plantsStore = usePlantsStore()
  const careEventsStore = useCareEventsStore()
  const surveysStore = useSurveysStore()

  const allEvents = ref<CareEvent[]>([])
  const allSurveys = ref<PlantSurvey[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    await plantsStore.fetchAll()
    await plantsStore.fetchArchived()
    allEvents.value = await careEventsStore.fetchAll()
    allSurveys.value = await surveysStore.fetchAll()
    loading.value = false
  }

  // ─── General cards ──────────────────────────────────────────────────────────

  const totalPlants = computed(() => plantsStore.plants.length)

  const currentMonthEvents = computed(() => {
    const now = new Date()
    return eventsByYearMonth.value.get(monthKey(now)) ?? []
  })

  const eventsThisMonth = computed(() => currentMonthEvents.value.length)

  const wateringsThisMonth = computed(() =>
    currentMonthEvents.value.filter((e) => e.type === 'watering').length,
  )

  // ─── Event indexes ──────────────────────────────────────────────────────

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  function monthKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}`
  }

  const eventsByDay = computed(() => {
    const map = new Map<string, CareEvent[]>()
    for (const e of allEvents.value) {
      const d = new Date(e.date)
      const key = dayKey(d)
      const bucket = map.get(key)
      if (bucket) bucket.push(e)
      else map.set(key, [e])
    }
    return map
  })

  const eventsByYearMonth = computed(() => {
    const map = new Map<string, CareEvent[]>()
    for (const e of allEvents.value) {
      const key = monthKey(new Date(e.date))
      const bucket = map.get(key)
      if (bucket) bucket.push(e)
      else map.set(key, [e])
    }
    return map
  })

  const surveysByYearMonth = computed(() => {
    const map = new Map<string, PlantSurvey[]>()
    for (const s of allSurveys.value) {
      const key = monthKey(new Date(s.date))
      const bucket = map.get(key)
      if (bucket) bucket.push(s)
      else map.set(key, [s])
    }
    return map
  })

  // ─── Care streak ───────────────────────────────────────────────────────────

  const careStreak = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    const cur = new Date(today)
    while (eventsByDay.value.has(dayKey(cur))) {
      streak++
      cur.setDate(cur.getDate() - 1)
    }
    return streak
  })

  // ─── Care chart — last 30 days (per type) ────────────────────────────

  function buildChartData(type: ChartCareType) {
    const cfg = CARE_TYPE_CONFIG[type]
    const labels: string[] = []
    const counts: number[] = []
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(formatDatePl(date, { day: '2-digit', month: '2-digit' }))
      const bucket = eventsByDay.value.get(dayKey(date)) ?? []
      counts.push(bucket.filter((e) => e.type === type).length)
    }
    return {
      labels,
      datasets: [{ label: cfg.label, data: counts, backgroundColor: cfg.color, borderRadius: 4 }],
    }
  }

  const chartData = computed(() => buildChartData('watering'))

  function getChartData(type: ChartCareType) {
    return buildChartData(type)
  }

  // ─── Line chart: number of plants over time (12 months) ──────────────────

  const plantsOverTimeData = computed(() => {
    const now = new Date()
    const labels: string[] = []
    const counts: number[] = []
    const allPlantsEver = [...plantsStore.plants, ...plantsStore.archivedPlants]

    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(formatDatePl(monthStart, { month: 'short', year: '2-digit' }))
      const count = allPlantsEver.filter((p) => {
        const created = new Date(p.createdAt)
        const archived = p.archivedAt ? new Date(p.archivedAt) : null
        return created <= monthEnd && (!archived || archived > monthEnd)
      }).length
      counts.push(count)
    }

    const color = 'rgba(76,175,80,1)'
    const colorFill = 'rgba(76,175,80,0.15)'
    return {
      labels,
      datasets: [
        {
          label: 'Rośliny',
          data: counts,
          borderColor: color,
          backgroundColor: colorFill,
          pointBackgroundColor: color,
          pointRadius: 4,
          tension: 0.3,
          fill: true,
        },
      ],
    }
  })

  // ─── Care by type — this month ─────────────────────────────────────────

  const careByTypeData = computed(() => {
    const counts: Record<string, number> = {}
    for (const e of currentMonthEvents.value) {
      counts[e.type] = (counts[e.type] || 0) + 1
    }

    const order = [
      'watering',
      'fertilizing',
      'misting',
      'pruning',
      'repotting',
      'cleaning',
      'other',
    ]
    const labels: Record<ChartCareType, string> = {
      watering: 'Podlewanie',
      fertilizing: 'Nawożenie',
      misting: 'Zraszanie',
      pruning: 'Przycinanie',
      repotting: 'Przesadzanie',
      cleaning: 'Czyszczenie',
      other: 'Inne',
    }
    const colors: Record<ChartCareType, string> = {
      watering: 'rgba(33,150,243,0.75)',
      fertilizing: 'rgba(76,175,80,0.75)',
      misting: 'rgba(0,188,212,0.75)',
      pruning: 'rgba(255,193,7,0.75)',
      repotting: 'rgba(121,85,72,0.75)',
      cleaning: 'rgba(156,39,176,0.75)',
      other: 'rgba(158,158,158,0.75)',
    }

    const active = order.filter((t) => counts[t])
    return {
      labels: active.map((t) => labels[t as ChartCareType]),
      datasets: [
        {
          data: active.map((t) => counts[t]),
          backgroundColor: active.map((t) => colors[t as ChartCareType]),
          borderRadius: 4,
        },
      ],
    }
  })

  // ─── Distribution by room ────────────────────────────────────────────────────

  const plantsByRoomData = computed(() => {
    const counts: Record<string, number> = {}
    plantsStore.plants.forEach((p) => {
      counts[p.room] = (counts[p.room] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return {
      labels: sorted.map(([room]) => room),
      datasets: [
        {
          data: sorted.map(([, c]) => c),
          backgroundColor: 'rgba(76,175,80,0.65)',
          borderRadius: 4,
        },
      ],
    }
  })

  // ─── Condition from surveys — last 6 months ───────────────────────────────

  const conditionTrendData = computed(() => {
    const now = new Date()
    const labels: string[] = []
    const avgs: (number | null)[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(formatDatePl(d, { month: 'long' }))
      const month = surveysByYearMonth.value.get(monthKey(d)) ?? []
      avgs.push(
        month.length
          ? Math.round((month.reduce((s, v) => s + v.condition, 0) / month.length) * 10) / 10
          : null,
      )
    }

    const color = 'rgba(255,152,0,1)'
    return {
      labels,
      datasets: [
        {
          label: 'Śr. kondycja',
          data: avgs,
          borderColor: color,
          backgroundColor: 'rgba(255,152,0,0.12)',
          pointBackgroundColor: color,
          pointRadius: 5,
          tension: 0.3,
          fill: true,
          spanGaps: true,
        },
      ],
    }
  })

  const hasSurveyData = computed(() => allSurveys.value.length > 0)

  // ─── Care by month — last 12 months ────────────────────────────────────────

  const careByMonthData = computed(() => {
    const now = new Date()
    const labels: string[] = []
    const datasets = Object.entries(CARE_TYPE_CONFIG).map(([type, cfg]) => ({
      type,
      label: cfg.label,
      data: [] as number[],
      backgroundColor: cfg.color,
      borderRadius: 3,
    }))

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(formatDatePl(d, { month: 'short' }))
      const bucket = eventsByYearMonth.value.get(monthKey(d)) ?? []
      const countByType: Record<string, number> = {}
      for (const e of bucket) countByType[e.type] = (countByType[e.type] ?? 0) + 1
      datasets.forEach((ds) => {
        ds.data.push(countByType[ds.type] ?? 0)
      })
    }

    return {
      labels,
      datasets: datasets
        .filter((ds) => ds.data.some((v) => v > 0))
        .map(({ label, data, backgroundColor, borderRadius }) => ({
          label, data, backgroundColor, borderRadius,
        })),
    }
  })

  const newPlantsLastYear = computed(() => {
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    return plantsStore.plants.filter((p) => new Date(p.createdAt) >= cutoff).length
  })

  const avgCondition = computed((): number | null => {
    if (!allSurveys.value.length) return null
    const latest = new Map<number, { date: Date; condition: number }>()
    for (const s of allSurveys.value) {
      const d = new Date(s.date)
      const cur = latest.get(s.plantId)
      if (!cur || d > cur.date) latest.set(s.plantId, { date: d, condition: s.condition })
    }
    const vals = [...latest.values()].map((v) => v.condition)
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  })

  // ─── Plant watering status ───────────────────────────────────────────────

  const lastWateringByPlant = computed(() => {
    const map = new Map<number, CareEvent>()
    for (const e of allEvents.value) {
      if (e.type !== 'watering') continue
      const existing = map.get(e.plantId)
      if (!existing || new Date(e.date) > new Date(existing.date)) map.set(e.plantId, e)
    }
    return map
  })

  const plantStatuses = computed(() =>
    plantsStore.plants.map((plant) => {
      const lastWatering = plant.id !== undefined ? lastWateringByPlant.value.get(plant.id) : undefined
      const interval = plant.wateringIntervalDays ?? DEFAULT_WATERING_INTERVAL
      const daysSince = lastWatering ? daysSinceDate(new Date(lastWatering.date)) : null
      const overdueDays = daysSince === null ? OVERDUE_NEVER : daysSince - interval
      return { plant, daysSince, interval, overdueDays }
    }),
  )

  const leastCaredPlant = computed<PlantWateringStatus | null>(() => {
    if (!plantStatuses.value.length) return null
    return [...plantStatuses.value].sort((a, b) => b.overdueDays - a.overdueDays)[0]
  })

  const overdueCount = computed(() => plantStatuses.value.filter((s) => s.overdueDays > 0).length)

  const overduePlants = computed(() =>
    [...plantStatuses.value]
      .filter((s) => s.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays),
  )

  return {
    allEvents,
    loading,
    load,
    totalPlants,
    eventsThisMonth,
    wateringsThisMonth,
    careStreak,
    chartData,
    getChartData,
    CARE_TYPE_CONFIG,
    plantsOverTimeData,
    careByTypeData,
    plantsByRoomData,
    conditionTrendData,
    hasSurveyData,
    plantStatuses,
    leastCaredPlant,
    overdueCount,
    overduePlants,
    newPlantsLastYear,
    avgCondition,
    careByMonthData,
  }
}
