import { computed } from 'vue'
import { getTemplateForPlant } from '@/composables/usePlantSchedule'
import { useSettingsStore } from '@/stores/settings'
import { CARE_TYPE_LABELS, type Plant, type CareEvent, type Snooze, type SnoozedCareType } from '@/types'

export const MONTH_SHORT = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru',
]
export const MONTH_SHORT_PL = MONTH_SHORT.map((m) => m.toLowerCase())

export const TYPE_KEY: Record<string, string> = Object.fromEntries(
  (['watering', 'fertilizing', 'misting'] as const).map((type) => [CARE_TYPE_LABELS[type], type]),
)

export interface NextCare {
  label: string
  snoozed: boolean
}

export interface ChartDef {
  label: string
  color: string
  cssClass: string
  values: readonly number[]
  unitLabel: (v: number) => string
}

export function barHeight(interval: number): number {
  if (interval === 0) return 0
  return Math.round(Math.min(100, (3 / interval) * 100))
}

export function usePlantCareChartData(props: {
  plant: Plant
  events?: CareEvent[]
  snoozes?: Snooze[]
}) {
  const settingsStore = useSettingsStore()
  const currentMonth = new Date().getMonth()

  const template = computed(() => getTemplateForPlant(props.plant))

  function activeSnooze(careType: SnoozedCareType): Date | null {
    if (!props.snoozes) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const s = props.snoozes.find((s) => s.careType === careType)
    if (!s) return null
    const until = new Date(s.until)
    until.setHours(0, 0, 0, 0)
    return until >= today ? until : null
  }

  function intervalFor(careType: string): number | undefined {
    const t = template.value
    if (!t) return undefined
    return careType === 'watering'
      ? t.wateringByMonth[currentMonth]
      : careType === 'fertilizing'
        ? t.fertilizingByMonth[currentMonth]
        : t.mistingByMonth[currentMonth]
  }

  function lastEventDate(careType: string): Date | null {
    let best: Date | null = null
    for (const e of props.events ?? []) {
      if (e.type !== careType) continue
      const d = new Date(e.date)
      if (!best || d > best) best = d
    }
    return best
  }

  function nextWateringDaysUntil(): number | null {
    const interval = intervalFor('watering')
    if (!interval) return null
    const best = lastEventDate('watering')
    const elapsed = best ? Math.floor((Date.now() - best.getTime()) / 86_400_000) : interval
    return interval - elapsed
  }

  function nextCareRing(
    careType: string,
  ): { progress: number; status: 'ok' | 'soon' | 'overdue' | 'snoozed' } | null {
    const interval = intervalFor(careType)
    if (!interval) return null
    const snoozeDate = activeSnooze(careType as SnoozedCareType)
    const best = lastEventDate(careType)
    const elapsed = best ? Math.floor((Date.now() - best.getTime()) / 86_400_000) : interval
    if (snoozeDate) {
      const totalSpan = best ? Math.round((snoozeDate.getTime() - best.getTime()) / 86_400_000) : null
      const progress = totalSpan ? Math.min(elapsed / totalSpan, 1) : 0
      const status: 'ok' | 'soon' | 'overdue' = progress >= 1 ? 'overdue' : progress >= 0.7 ? 'soon' : 'ok'
      return { progress, status }
    }
    const daysUntil = interval - elapsed

    if (careType === 'fertilizing' && settingsStore.combineWateringFertilizing && daysUntil <= 0) {
      const wDays = nextWateringDaysUntil()
      if (wDays !== null && wDays > 0) {
        const totalSpan = elapsed + wDays
        return {
          progress: Math.min(elapsed / totalSpan, 1),
          status: wDays <= 2 ? 'soon' : 'ok',
        }
      }
    }

    const progress = Math.min(elapsed / interval, 1)
    const status: 'ok' | 'soon' | 'overdue' = daysUntil <= 0 ? 'overdue' : daysUntil <= 2 ? 'soon' : 'ok'
    return { progress, status }
  }

  function nextCareLabel(careType: string): NextCare | null {
    const interval = intervalFor(careType)
    if (!interval) return null

    const snoozeDate = activeSnooze(careType as SnoozedCareType)
    if (snoozeDate) {
      return {
        label: `${snoozeDate.getDate()} ${MONTH_SHORT_PL[snoozeDate.getMonth()]}`,
        snoozed: true,
      }
    }

    const best = lastEventDate(careType)
    const elapsed = best ? Math.floor((Date.now() - best.getTime()) / 86_400_000) : interval
    let daysUntil = interval - elapsed

    // In combined mode: overdue fertilizing → move to the next watering date
    if (careType === 'fertilizing' && settingsStore.combineWateringFertilizing && daysUntil <= 0) {
      const wDays = nextWateringDaysUntil()
      if (wDays !== null && wDays > 0) daysUntil = wDays
    }

    if (daysUntil <= 0) return { label: 'Dzisiaj', snoozed: false }
    if (daysUntil === 1) return { label: 'Jutro', snoozed: false }
    const next = new Date()
    next.setDate(next.getDate() + daysUntil)
    return { label: `${next.getDate()} ${MONTH_SHORT_PL[next.getMonth()]}`, snoozed: false }
  }

  const charts = computed<ChartDef[]>(() => {
    const t = template.value
    if (!t) return []
    const defs: ChartDef[] = [
      {
        label: 'Podlewanie',
        color: 'info',
        cssClass: 'bar--watering',
        values: t.wateringByMonth,
        unitLabel: (v: number) => (v ? `co ${v} dni` : 'spoczynek'),
      },
      {
        label: 'Nawożenie',
        color: 'success',
        cssClass: 'bar--fertilizing',
        values: t.fertilizingByMonth,
        unitLabel: (v: number) => (v ? `co ${v} dni` : 'nie nawóź'),
      },
    ]
    if (t.mistingByMonth.some((v) => v > 0)) {
      defs.push({
        label: 'Zraszanie',
        color: 'teal',
        cssClass: 'bar--misting',
        values: t.mistingByMonth,
        unitLabel: (v: number) => (v ? `co ${v} dni` : 'bez zraszania'),
      })
    }
    return defs
  })

  return {
    currentMonth,
    template,
    charts,
    nextCareLabel,
    nextCareRing,
  }
}
