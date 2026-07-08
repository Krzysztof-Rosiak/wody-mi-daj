import { describe, it, expect } from 'vitest'
import type { Plant, CareEvent } from '@/types'

// Helpers
const monsteraPlant = (id = 1): Plant => ({
  id,
  name: 'Monstera',
  room: 'Salon',
  createdAt: new Date(),
  templateSpecies: 'Monstera deliciosa',
})

const repottingEvent = (plantId: number, date: Date): CareEvent => ({
  id: plantId * 100,
  plantId,
  type: 'repotting',
  date,
})

const thisYear = new Date().getFullYear()

const twoYearsAgo = thisYear - 2

import { monthsDiff } from '../usePlantSchedule'

// ─── monthsDiff ───────────────────────────────────────────────────────────────

describe('monthsDiff', () => {
  it('zwraca 0 dla tego samego miesiąca', () => {
    const d = new Date(2024, 3, 15)
    expect(monthsDiff(d, d)).toBe(0)
  })

  it('zwraca 12 dla różnicy roku', () => {
    expect(monthsDiff(new Date(2023, 0, 1), new Date(2024, 0, 1))).toBe(12)
  })

  it('zwraca 6 dla różnicy półrocznej', () => {
    expect(monthsDiff(new Date(2024, 0, 1), new Date(2024, 6, 1))).toBe(6)
  })

  it('zwraca wartość ujemną gdy from > to', () => {
    expect(monthsDiff(new Date(2025, 0, 1), new Date(2024, 0, 1))).toBe(-12)
  })
})

// ─── toRepot filtering in useSeasonalTasks ───────────────────────────────────
// We test the filtering logic directly, without mounting the composable

import { getPlantsToRepot, getCategoryForPlant } from '../usePlantSchedule'

describe('logika filtrowania przesadzania — ten rok', () => {
  it('roślina przesadzona w tym roku nie powinna być na liście', () => {
    const plant = monsteraPlant()
    const event = repottingEvent(1, new Date(thisYear, 1, 1))

    // Simulating the filter from useSeasonalTasks
    const candidates = getPlantsToRepot([plant], 2) // March = Monstera season
    const filtered = candidates.filter((p) => {
      const lastRepot = [event].find((e) => e.plantId === p.id)
      if (lastRepot && new Date(lastRepot.date).getFullYear() === thisYear) return false
      return true
    })

    expect(filtered).toHaveLength(0)
  })

  it('roślina przesadzona w zeszłym roku (poza cooldownem) powinna być na liście', () => {
    const plant = monsteraPlant()
    // Event from 2 years ago — outside the default 18-month cooldown
    const event = repottingEvent(1, new Date(twoYearsAgo, 0, 1))

    const candidates = getPlantsToRepot([plant], 2)
    const filtered = candidates.filter((p) => {
      const lastRepot = [event].find((e) => e.plantId === p.id)
      if (!lastRepot) return true
      if (new Date(lastRepot.date).getFullYear() === thisYear) return false
      const category = getCategoryForPlant(p)
      const cooldown = category?.repottingCooldownMonths ?? 18
      if (monthsDiff(new Date(lastRepot.date), new Date()) < cooldown) return false
      return true
    })

    expect(filtered).toHaveLength(1)
  })

  it('roślina bez historii przesadzania powinna być na liście (w sezonie)', () => {
    const plant = monsteraPlant()
    const candidates = getPlantsToRepot([plant], 2)
    const filtered = candidates.filter((p) => {
      const lastRepot = ([] as CareEvent[]).find((e) => e.plantId === p.id)
      if (lastRepot && new Date(lastRepot.date).getFullYear() === thisYear) return false
      return true
    })

    expect(filtered).toHaveLength(1)
  })

  it('roślina poza sezonem nie pojawia się niezależnie od historii', () => {
    const plant = monsteraPlant()
    // January — Monstera's season is March/April
    const candidates = getPlantsToRepot([plant], 0)
    expect(candidates).toHaveLength(0)
  })
})

// ─── getCategoryForPlant ──────────────────────────────────────────────────────

describe('getCategoryForPlant', () => {
  it('zwraca undefined dla rośliny bez szablonu', () => {
    expect(
      getCategoryForPlant({ id: 1, name: 'X', room: 'Y', createdAt: new Date() }),
    ).toBeUndefined()
  })

  it('zwraca kategorię dla Monstery', () => {
    const category = getCategoryForPlant(monsteraPlant())
    expect(category).toBeDefined()
    expect(category?.repottingCooldownMonths).toBeGreaterThan(0)
  })
})
