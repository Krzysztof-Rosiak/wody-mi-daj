import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { barHeight, usePlantCareChartData } from '../usePlantCareChartData'
import { useSettingsStore } from '@/stores/settings'
import type { Plant, CareEvent, Snooze } from '@/types'

// Pin "today" to April 15 — for Monstera deliciosa this month has
// watering=7, fertilizing=14, misting=4 (see plantTemplates.ts).
const FIXED_NOW = new Date(2024, 3, 15)

const monsteraPlant = (): Plant => ({
  id: 1,
  name: 'Monstera',
  room: 'Salon',
  createdAt: new Date(2020, 0, 1),
  templateSpecies: 'Monstera deliciosa',
})

const customPlant = (): Plant => ({
  id: 2,
  name: 'Bez szablonu',
  room: 'Salon',
  createdAt: new Date(2020, 0, 1),
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('barHeight', () => {
  it('zwraca 0 dla interwału równego 0', () => {
    expect(barHeight(0)).toBe(0)
  })

  it('zwraca 100 gdy interwał jest mniejszy lub równy 3', () => {
    expect(barHeight(3)).toBe(100)
    expect(barHeight(1)).toBe(100)
  })

  it('maleje wraz ze wzrostem interwału', () => {
    expect(barHeight(7)).toBeLessThan(barHeight(3))
    expect(barHeight(14)).toBeLessThan(barHeight(7))
  })
})

describe('usePlantCareChartData — template i charts', () => {
  it('template jest undefined dla rośliny bez templateSpecies', () => {
    const { template, charts } = usePlantCareChartData({ plant: customPlant() })
    expect(template.value).toBeUndefined()
    expect(charts.value).toEqual([])
  })

  it('zwraca dane wykresów dla rośliny z szablonem', () => {
    const { template, charts } = usePlantCareChartData({ plant: monsteraPlant() })
    expect(template.value).toBeDefined()
    const labels = charts.value.map((c) => c.label)
    expect(labels).toContain('Podlewanie')
    expect(labels).toContain('Nawożenie')
    expect(labels).toContain('Zraszanie')
  })

  it('currentMonth odpowiada zamrożonej dacie (kwiecień = indeks 3)', () => {
    const { currentMonth } = usePlantCareChartData({ plant: monsteraPlant() })
    expect(currentMonth).toBe(3)
  })
})

describe('usePlantCareChartData — nextCareLabel', () => {
  it('zwraca null dla typu bez interwału (brak szablonu)', () => {
    const { nextCareLabel } = usePlantCareChartData({ plant: customPlant() })
    expect(nextCareLabel('watering')).toBeNull()
  })

  it('zwraca "Dzisiaj" gdy ostatnie zdarzenie było dokładnie interwał dni temu', () => {
    const sevenDaysAgo = new Date(FIXED_NOW.getTime() - 7 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: sevenDaysAgo }]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), events })
    expect(nextCareLabel('watering')).toEqual({ label: 'Dzisiaj', snoozed: false })
  })

  it('zwraca "Jutro" gdy zostaje jeden dzień', () => {
    const sixDaysAgo = new Date(FIXED_NOW.getTime() - 6 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: sixDaysAgo }]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), events })
    expect(nextCareLabel('watering')).toEqual({ label: 'Jutro', snoozed: false })
  })

  it('zwraca datę dziennomiesięczną gdy zostaje więcej niż jeden dzień', () => {
    const twoDaysAgo = new Date(FIXED_NOW.getTime() - 2 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: twoDaysAgo }]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), events })
    const result = nextCareLabel('watering')
    expect(result?.snoozed).toBe(false)
    expect(result?.label).toMatch(/^\d+ \p{L}+$/u)
  })

  it('respektuje aktywny snooze i pokazuje jego datę', () => {
    const snoozeUntil = new Date(FIXED_NOW.getTime() + 3 * 86_400_000)
    const snoozes: Snooze[] = [{ plantId: 1, careType: 'watering', until: snoozeUntil }]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), snoozes })
    expect(nextCareLabel('watering')).toEqual({
      label: `${snoozeUntil.getDate()} kwi`,
      snoozed: true,
    })
  })

  it('ignoruje snooze który już wygasł', () => {
    const pastSnooze = new Date(FIXED_NOW.getTime() - 1 * 86_400_000)
    const snoozes: Snooze[] = [{ plantId: 1, careType: 'watering', until: pastSnooze }]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), snoozes })
    expect(nextCareLabel('watering')?.snoozed).toBe(false)
  })

  it('w trybie łączonym przesuwa zaległe nawożenie na termin podlewania', () => {
    const settings = useSettingsStore()
    settings.combineWateringFertilizing = true
    // Fertilizing overdue (14+ days), watering due in 2 days.
    const fifteenDaysAgo = new Date(FIXED_NOW.getTime() - 15 * 86_400_000)
    const fiveDaysAgo = new Date(FIXED_NOW.getTime() - 5 * 86_400_000)
    const events: CareEvent[] = [
      { id: 1, plantId: 1, type: 'fertilizing', date: fifteenDaysAgo },
      { id: 2, plantId: 1, type: 'watering', date: fiveDaysAgo },
    ]
    const { nextCareLabel } = usePlantCareChartData({ plant: monsteraPlant(), events })
    // watering: 7 - 5 = 2 days until due
    const wateringLabel = nextCareLabel('watering')
    expect(wateringLabel?.label).toBeTruthy()
    // fertilizing should follow watering's schedule instead of showing overdue "Dzisiaj"
    const fertilizingLabel = nextCareLabel('fertilizing')
    expect(fertilizingLabel).toEqual(wateringLabel)
  })
})

describe('usePlantCareChartData — nextCareRing', () => {
  it('zwraca null dla typu bez interwału', () => {
    const { nextCareRing } = usePlantCareChartData({ plant: customPlant() })
    expect(nextCareRing('watering')).toBeNull()
  })

  it('status "ok" gdy do terminu zostaje dużo czasu', () => {
    const oneDayAgo = new Date(FIXED_NOW.getTime() - 1 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: oneDayAgo }]
    const { nextCareRing } = usePlantCareChartData({ plant: monsteraPlant(), events })
    const ring = nextCareRing('watering')
    expect(ring?.status).toBe('ok')
    expect(ring?.progress).toBeLessThan(1)
  })

  it('status "overdue" i progress=1 gdy zadanie jest zaległe', () => {
    const tenDaysAgo = new Date(FIXED_NOW.getTime() - 10 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: tenDaysAgo }]
    const { nextCareRing } = usePlantCareChartData({ plant: monsteraPlant(), events })
    const ring = nextCareRing('watering')
    expect(ring?.status).toBe('overdue')
    expect(ring?.progress).toBe(1)
  })

  it('status "soon" tuż przed terminem', () => {
    const fiveDaysAgo = new Date(FIXED_NOW.getTime() - 5 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: fiveDaysAgo }]
    const { nextCareRing } = usePlantCareChartData({ plant: monsteraPlant(), events })
    expect(nextCareRing('watering')?.status).toBe('soon')
  })

  it('gdy aktywny snooze, progress liczony jest względem rozpiętości do snooze.until', () => {
    const lastEvent = new Date(FIXED_NOW.getTime() - 4 * 86_400_000)
    const snoozeUntil = new Date(FIXED_NOW.getTime() + 4 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: lastEvent }]
    const snoozes: Snooze[] = [{ plantId: 1, careType: 'watering', until: snoozeUntil }]
    const { nextCareRing } = usePlantCareChartData({ plant: monsteraPlant(), events, snoozes })
    const ring = nextCareRing('watering')
    // elapsed=4, totalSpan=8 → progress=0.5
    expect(ring?.progress).toBeCloseTo(0.5)
    expect(ring?.status).toBe('ok')
  })
})
