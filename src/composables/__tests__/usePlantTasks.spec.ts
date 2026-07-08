import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import {
  buildLastEventIndex,
  buildTasksFromEvents,
  buildUpcomingTasks,
  toLocalDateKey,
  usePlantTasks,
} from '../usePlantTasks'
import type { CareEvent, Plant } from '@/types'
import { db } from '@/db'

// ─── buildTasksFromEvents ─────────────────────────────────────────────────────

describe('buildTasksFromEvents', () => {
  const makePlant = (id: number, wateringIntervalDays?: number): Plant => ({
    id,
    name: `Plant ${id}`,
    room: 'Salon',
    createdAt: new Date(),
    wateringIntervalDays,
  })

  it('zwraca pustą listę gdy brak roślin', () => {
    expect(buildTasksFromEvents([], buildLastEventIndex([]), () => 7, 'watering')).toHaveLength(0)
  })

  it('wyklucza rośliny gdy getInterval zwraca null', () => {
    const plants = [makePlant(1)]
    const result = buildTasksFromEvents(plants, buildLastEventIndex([]), () => null, 'fertilizing')
    expect(result).toHaveLength(0)
  })

  it('używa interwału z getInterval', () => {
    const plants = [makePlant(1)] // no wateringIntervalDays
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: sevenDaysAgo }]
    const result = buildTasksFromEvents(plants, buildLastEventIndex(events), () => 7, 'watering')
    expect(result).toHaveLength(1) // overdue = 0 → included
  })

  it('wyklucza rośliny przed terminem (overdue < 0)', () => {
    const plants = [makePlant(1, 14)]
    const yesterday = new Date(Date.now() - 1 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: yesterday }]
    const result = buildTasksFromEvents(plants, buildLastEventIndex(events), () => 14, 'watering')
    expect(result).toHaveLength(0) // daysSince=1, interval=14, overdue=-13 → excluded
  })

  it('sortuje malejąco po overdue', () => {
    const plants = [makePlant(1, 3), makePlant(2, 3)]
    const longAgo = new Date(Date.now() - 15 * 86_400_000)
    const shortAgo = new Date(Date.now() - 8 * 86_400_000)
    const events: CareEvent[] = [
      { id: 1, plantId: 1, type: 'watering', date: longAgo },
      { id: 2, plantId: 2, type: 'watering', date: shortAgo },
    ]
    const result = buildTasksFromEvents(plants, buildLastEventIndex(events), () => 3, 'watering')
    expect(result[0].plant.id).toBe(1) // more overdue
  })

  it('roślina dodana dziś bez zdarzeń nie pojawia się na liście', () => {
    const plants = [makePlant(1, 7)]
    const result = buildTasksFromEvents(plants, buildLastEventIndex([]), () => 7, 'watering')
    expect(result).toHaveLength(0)
  })

  it('roślina bez zdarzeń pojawia się na liście z overdue=0 (bez licznika zaległości)', () => {
    const old = { ...makePlant(1, 7), createdAt: new Date(Date.now() - 8 * 86_400_000) }
    const result = buildTasksFromEvents([old], buildLastEventIndex([]), () => 7, 'watering')
    expect(result).toHaveLength(1)
    expect(result[0].overdue).toBe(0)
    expect(result[0].daysSince).toBeNull()
  })

  it('ukrywa zadanie gdy snooze jest aktywny', () => {
    const plants = [makePlant(1, 7)]
    const longAgo = new Date(Date.now() - 10 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: longAgo }]
    const snoozes = [{ plantId: 1, careType: 'watering' as const, until: new Date(Date.now() + 2 * 86_400_000) }]
    const result = buildTasksFromEvents(plants, buildLastEventIndex(events), () => 7, 'watering', snoozes)
    expect(result).toHaveLength(0)
  })

  it('liczy zaległość od daty snooze po jego wygaśnięciu', () => {
    const plants = [makePlant(1, 1)]
    // Snooze expired 3 days ago
    const snoozeUntil = new Date(Date.now() - 3 * 86_400_000)
    snoozeUntil.setHours(0, 0, 0, 0)
    const snoozes = [{ plantId: 1, careType: 'watering' as const, until: snoozeUntil }]
    const result = buildTasksFromEvents(plants, buildLastEventIndex([]), () => 7, 'watering', snoozes)
    expect(result).toHaveLength(1)
    expect(result[0].overdue).toBe(3)
  })
})

// ─── toLocalDateKey ───────────────────────────────────────────────────────────

describe('toLocalDateKey', () => {
  it('formatuje datę jako YYYY-MM-DD w lokalnej strefie', () => {
    const d = new Date(2025, 3, 5) // April 5, 2025, local
    expect(toLocalDateKey(d)).toBe('2025-04-05')
  })

  it('północ lokalna daje poprawną datę lokalną (nie UTC)', () => {
    // For UTC+N: local midnight = previous day in UTC
    // toISOString() would give the previous day — toLocalDateKey doesn't
    const d = new Date(2025, 0, 1, 0, 0, 0) // January 1, 00:00 local
    expect(toLocalDateKey(d)).toBe('2025-01-01')
  })

  it('uzupełnia miesiąc i dzień zerami', () => {
    const d = new Date(2025, 0, 9) // January 9
    expect(toLocalDateKey(d)).toBe('2025-01-09')
  })

  it('grudzień ma numer 12', () => {
    const d = new Date(2025, 11, 31) // December 31
    expect(toLocalDateKey(d)).toBe('2025-12-31')
  })
})

// ─── usePlantTasks (integration) ─────────────────────────────────────────────

describe('usePlantTasks', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
  })

  it('loading=true przed load(), false po load()', async () => {
    const tasks = usePlantTasks()
    expect(tasks.loading.value).toBe(true)
    await tasks.load()
    expect(tasks.loading.value).toBe(false)
  })

  it('wateringTasks zawiera rośliny wymagające podlewania', async () => {
    const id = await db.plants.add({
      name: 'A', room: 'Salon', wateringIntervalDays: 3, createdAt: new Date(),
    })
    const longAgo = new Date(Date.now() - 10 * 86_400_000)
    await db.careEvents.add({ plantId: id as number, type: 'watering', date: longAgo })

    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.wateringTasks.value).toHaveLength(1)
  })

  it('totalTasks liczy połączone podlewanie+nawożenie jako jedno zadanie', async () => {
    const id = await db.plants.add({
      name: 'A', room: 'Salon',
      wateringIntervalDays: 3,
      fertilizingIntervalDays: 3,
      surveyEnabled: false,
      createdAt: new Date(),
    })
    const longAgo = new Date(Date.now() - 10 * 86_400_000)
    await db.careEvents.bulkAdd([
      { plantId: id as number, type: 'watering', date: longAgo },
      { plantId: id as number, type: 'fertilizing', date: longAgo },
    ])

    const tasks = usePlantTasks()
    await tasks.load()
    // By default combineWateringFertilizing=true → watering+fertilizing → 1 combined task
    expect(tasks.totalTasks.value).toBe(1)
    expect(tasks.combinedTasks.value).toHaveLength(1)
    expect(tasks.wateringOnlyTasks.value).toHaveLength(0)
    expect(tasks.fertilizingOnlyTasks.value).toHaveLength(0)
  })

  it('totalTasks liczy osobno gdy combine=false', async () => {
    await db.settings.put({ id: 1, snoozeDays: 2, combineWateringFertilizing: false, isDark: false })
    const id = await db.plants.add({
      name: 'A', room: 'Salon',
      wateringIntervalDays: 3,
      fertilizingIntervalDays: 3,
      surveyEnabled: false,
      createdAt: new Date(),
    })
    const longAgo = new Date(Date.now() - 10 * 86_400_000)
    await db.careEvents.bulkAdd([
      { plantId: id as number, type: 'watering', date: longAgo },
      { plantId: id as number, type: 'fertilizing', date: longAgo },
    ])

    const settings = useSettingsStore()
    await settings.load()
    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.totalTasks.value).toBe(2)
    expect(tasks.combinedTasks.value).toHaveLength(0)
  })

  it('todayDone zawiera zdarzenia z dzisiaj', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    await db.careEvents.add({ plantId: id as number, type: 'watering', date: new Date() })

    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.todayDone.value).toHaveLength(1)
  })

  it('todayDone nie zawiera zdarzeń sprzed dzisiaj', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    const yesterday = new Date(Date.now() - 86_400_000)
    yesterday.setHours(0, 0, 0, 0)
    await db.careEvents.add({ plantId: id as number, type: 'watering', date: yesterday })

    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.todayDone.value).toHaveLength(0)
  })

  it('markDone dodaje zdarzenie i odświeża listę', async () => {
    const id = await db.plants.add({
      name: 'A', room: 'Salon', wateringIntervalDays: 1, createdAt: new Date(),
    })

    const tasks = usePlantTasks()
    await tasks.load()
    const before = tasks.todayDone.value.length

    await tasks.markDone(id as number, 'watering')
    expect(tasks.todayDone.value.length).toBe(before + 1)
  })
})

// ─── doneByDay — timezone ───────────────────────────────────────────────

describe('doneByDay (strefa czasowa)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
  })

  it('zdarzenie o północy lokalnej trafia do właściwego dnia', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })

    const localMidnight = new Date()
    localMidnight.setHours(0, 0, 0, 0)
    await db.careEvents.add({ plantId: id as number, type: 'watering', date: localMidnight })

    const tasks = usePlantTasks()
    await tasks.load()

    const expectedKey = toLocalDateKey(localMidnight)
    expect(tasks.doneByDay.value[expectedKey]).toBe(1)
  })

  it('zdarzenie wczoraj nie trafia do dzisiejszego klucza', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)
    await db.careEvents.add({ plantId: id as number, type: 'watering', date: yesterday })

    const tasks = usePlantTasks()
    await tasks.load()

    const todayKey = toLocalDateKey(new Date())
    const yesterdayKey = toLocalDateKey(yesterday)
    expect(tasks.doneByDay.value[todayKey] ?? 0).toBe(0)
    expect(tasks.doneByDay.value[yesterdayKey]).toBe(1)
  })

  it('dwa zdarzenia tego samego dnia są sumowane pod jednym kluczem', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })

    const day = new Date()
    day.setDate(day.getDate() - 2)
    day.setHours(10, 0, 0, 0)
    const day2 = new Date(day)
    day2.setHours(14, 0, 0, 0)

    await db.careEvents.bulkAdd([
      { plantId: id as number, type: 'watering', date: day },
      { plantId: id as number, type: 'fertilizing', date: day2 },
    ])

    const tasks = usePlantTasks()
    await tasks.load()

    const key = toLocalDateKey(day)
    expect(tasks.doneByDay.value[key]).toBe(2)
  })

  it('zdarzenia różnych dni nie są mieszane', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })

    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(10, 0, 0, 0)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(10, 0, 0, 0)

    await db.careEvents.bulkAdd([
      { plantId: id as number, type: 'watering', date: twoDaysAgo },
      { plantId: id as number, type: 'watering', date: threeDaysAgo },
    ])

    const tasks = usePlantTasks()
    await tasks.load()

    expect(tasks.doneByDay.value[toLocalDateKey(twoDaysAgo)]).toBe(1)
    expect(tasks.doneByDay.value[toLocalDateKey(threeDaysAgo)]).toBe(1)
  })
})

// ─── buildUpcomingTasks ───────────────────────────────────────────────────────


describe('buildUpcomingTasks', () => {
  const makePlant = (id: number): Plant => ({ id, name: `Plant ${id}`, room: 'Salon', createdAt: new Date() })

  it('zwraca pustą listę gdy brak roślin', () => {
    expect(buildUpcomingTasks([], buildLastEventIndex([]), () => 7, 'watering')).toHaveLength(0)
  })

  it('wyklucza zadania już wymagalne (overdue >= 0)', () => {
    const plant = makePlant(1)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: sevenDaysAgo }]
    // overdue = 7 - 7 = 0 → not upcoming
    expect(buildUpcomingTasks([plant], buildLastEventIndex(events), () => 7, 'watering')).toHaveLength(0)
  })

  it('zwraca zadanie wymagalne za 2 dni', () => {
    const plant = makePlant(1)
    const fiveDaysAgo = new Date(Date.now() - 5 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: fiveDaysAgo }]
    // overdue = 5 - 7 = -2 → daysUntil = 2
    const result = buildUpcomingTasks([plant], buildLastEventIndex(events), () => 7, 'watering')
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBe(2)
  })

  it('wyklucza zadania dalej niż daysAhead', () => {
    const plant = makePlant(1)
    const oneDayAgo = new Date(Date.now() - 1 * 86_400_000)
    const events: CareEvent[] = [{ id: 1, plantId: 1, type: 'watering', date: oneDayAgo }]
    // overdue = 1 - 7 = -6 → beyond the default daysAhead=5
    expect(buildUpcomingTasks([plant], buildLastEventIndex(events), () => 7, 'watering')).toHaveLength(0)
  })

  it('sortuje rosnąco po daysUntil', () => {
    const p1 = makePlant(1)
    const p2 = makePlant(2)
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000)
    const fourDaysAgo = new Date(Date.now() - 4 * 86_400_000)
    const events: CareEvent[] = [
      { id: 1, plantId: 1, type: 'watering', date: threeDaysAgo }, // overdue = -4
      { id: 2, plantId: 2, type: 'watering', date: fourDaysAgo },  // overdue = -3
    ]
    const result = buildUpcomingTasks([p1, p2], buildLastEventIndex(events), () => 7, 'watering')
    expect(result[0].daysUntil).toBeLessThanOrEqual(result[1].daysUntil)
  })
})

// ─── surveyTasks (integration) ───────────────────────────────────────────────

describe('surveyTasks', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
    await db.plantSurveys.clear()
    await db.snoozes.clear()
  })

  it('roślina z surveyEnabled=false nie trafia do surveyTasks', async () => {
    await db.plants.add({ name: 'A', room: 'Salon', surveyEnabled: false, createdAt: new Date() })
    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.surveyTasks.value).toHaveLength(0)
  })

  it('roślina bez surveyEnabled (domyślnie true) trafia do surveyTasks', async () => {
    await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.surveyTasks.value).toHaveLength(1)
    expect(tasks.surveyTasks.value[0].daysSince).toBeNull()
    // overdue = day number of the month (0 = 1st day of the month)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const expectedOverdue = Math.floor((today.getTime() - monthStart.getTime()) / 86_400_000)
    expect(tasks.surveyTasks.value[0].overdue).toBe(expectedOverdue)
  })

  it('roślina z ankietą z bieżącego miesiąca nie trafia do surveyTasks', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    // Survey from today (this month)
    await db.plantSurveys.add({
      plantId: id as number,
      date: new Date(),
      condition: 3,
      heightCm: 20,
    })
    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.surveyTasks.value).toHaveLength(0)
  })

  it('roślina z ankietą z poprzedniego miesiąca trafia do surveyTasks', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    await db.plantSurveys.add({
      plantId: id as number,
      date: lastMonth,
      condition: 4,
      heightCm: 25,
    })
    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.surveyTasks.value).toHaveLength(1)
    expect(tasks.surveyTasks.value[0].daysSince).toBeGreaterThan(20)
  })

  it('saveSurvey zapisuje ankietę i usuwa snooze', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', surveyEnabled: true, createdAt: new Date() })
    await db.snoozes.add({ plantId: id as number, careType: 'survey', until: new Date() })

    const tasks = usePlantTasks()
    await tasks.load()

    await tasks.saveSurvey({
      plantId: id as number,
      date: new Date(),
      condition: 5,
      heightCm: 30,
    })

    const snoozes = await db.snoozes.toArray()
    expect(snoozes.filter(s => s.plantId === id && s.careType === 'survey')).toHaveLength(0)

    const surveys = await db.plantSurveys.toArray()
    expect(surveys).toHaveLength(1)
  })

  it('aktywny snooze ukrywa zadanie ankiety', async () => {
    const id = await db.plants.add({ name: 'A', room: 'Salon', surveyEnabled: true, createdAt: new Date() })
    const futureDate = new Date(Date.now() + 3 * 86_400_000)
    await db.snoozes.add({ plantId: id as number, careType: 'survey', until: futureDate })

    const tasks = usePlantTasks()
    await tasks.load()
    expect(tasks.surveyTasks.value).toHaveLength(0)
  })
})
