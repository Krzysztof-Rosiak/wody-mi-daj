import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStats } from '../useStats'
import { db } from '@/db'

describe('useStats', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
  })

  // ─── totalPlants ────────────────────────────────────────────────────────────

  it('totalPlants zwraca 0 gdy brak roślin', async () => {
    const stats = useStats()
    await stats.load()
    expect(stats.totalPlants.value).toBe(0)
  })

  it('totalPlants zwraca liczbę roślin', async () => {
    await db.plants.bulkAdd([
      { name: 'A', room: 'Salon', createdAt: new Date() },
      { name: 'B', room: 'Salon', createdAt: new Date() },
    ])
    const stats = useStats()
    await stats.load()
    expect(stats.totalPlants.value).toBe(2)
  })

  // ─── eventsThisMonth ────────────────────────────────────────────────────────

  it('eventsThisMonth liczy zdarzenia z bieżącego miesiąca', async () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10)
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: now },
      { plantId: 1, type: 'fertilizing', date: now },
      { plantId: 1, type: 'watering', date: lastMonth },
    ])
    const stats = useStats()
    await stats.load()
    expect(stats.eventsThisMonth.value).toBe(2)
  })

  // ─── wateringsThisMonth ─────────────────────────────────────────────────────

  it('wateringsThisMonth liczy tylko podlewania w bieżącym miesiącu', async () => {
    const now = new Date()
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: now },
      { plantId: 1, type: 'watering', date: now },
      { plantId: 1, type: 'fertilizing', date: now },
    ])
    const stats = useStats()
    await stats.load()
    expect(stats.wateringsThisMonth.value).toBe(2)
  })

  // ─── plantStatuses ──────────────────────────────────────────────────────────

  it('plantStatuses zwraca status dla każdej rośliny', async () => {
    await db.plants.bulkAdd([
      { name: 'A', room: 'Salon', createdAt: new Date() },
      { name: 'B', room: 'Salon', createdAt: new Date() },
    ])
    const stats = useStats()
    await stats.load()
    expect(stats.plantStatuses.value).toHaveLength(2)
  })

  it('plantStatuses daysSince=null gdy roślina nigdy nie podlana', async () => {
    await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    const stats = useStats()
    await stats.load()
    expect(stats.plantStatuses.value[0].daysSince).toBeNull()
  })

  it('plantStatuses overdueDays=999 gdy nigdy nie podlana', async () => {
    await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })
    const stats = useStats()
    await stats.load()
    expect(stats.plantStatuses.value[0].overdueDays).toBe(999)
  })

  it('plantStatuses oblicza overdueDays od ostatniego podlewania', async () => {
    const plantId = await db.plants.add({
      name: 'A', room: 'Salon', wateringIntervalDays: 7, createdAt: new Date(),
    })
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    await db.careEvents.add({ plantId, type: 'watering', date: sevenDaysAgo })

    const stats = useStats()
    await stats.load()
    // daysSince ≈ 7, interval = 7 → overdueDays ≈ 0
    expect(stats.plantStatuses.value[0].overdueDays).toBeCloseTo(0, 0)
  })

  // ─── overdueCount ───────────────────────────────────────────────────────────

  it('overdueCount zwraca 0 gdy brak zaległych', async () => {
    const plantId = await db.plants.add({ name: 'A', room: 'Salon', wateringIntervalDays: 30, createdAt: new Date() })
    await db.careEvents.add({ plantId: plantId as number, type: 'watering', date: new Date() })
    const stats = useStats()
    await stats.load()
    expect(stats.overdueCount.value).toBe(0)
  })

  it('overdueCount liczy rośliny z overdueDays > 0', async () => {
    const id1 = await db.plants.add({ name: 'A', room: 'Salon', wateringIntervalDays: 3, createdAt: new Date() })
    const id2 = await db.plants.add({ name: 'B', room: 'Salon', wateringIntervalDays: 3, createdAt: new Date() })
    const longAgo = new Date(Date.now() - 10 * 86_400_000)
    await db.careEvents.add({ plantId: id1 as number, type: 'watering', date: longAgo })
    await db.careEvents.add({ plantId: id2 as number, type: 'watering', date: new Date() })

    const stats = useStats()
    await stats.load()
    expect(stats.overdueCount.value).toBe(1)
  })

  // ─── leastCaredPlant ────────────────────────────────────────────────────────

  it('leastCaredPlant zwraca null gdy brak roślin', async () => {
    const stats = useStats()
    await stats.load()
    expect(stats.leastCaredPlant.value).toBeNull()
  })

  it('leastCaredPlant zwraca roślinę z największym opóźnieniem', async () => {
    const id1 = await db.plants.add({ name: 'Zaległa', room: 'Salon', wateringIntervalDays: 3, createdAt: new Date() })
    const id2 = await db.plants.add({ name: 'Świeża', room: 'Salon', wateringIntervalDays: 7, createdAt: new Date() })
    const longAgo = new Date(Date.now() - 14 * 86_400_000)
    await db.careEvents.add({ plantId: id1 as number, type: 'watering', date: longAgo })
    await db.careEvents.add({ plantId: id2 as number, type: 'watering', date: new Date() })

    const stats = useStats()
    await stats.load()
    expect(stats.leastCaredPlant.value?.plant.name).toBe('Zaległa')
  })

  // ─── overduePlants ──────────────────────────────────────────────────────────

  it('overduePlants jest posortowana malejąco po overdueDays', async () => {
    const id1 = await db.plants.add({ name: 'A', room: 'X', wateringIntervalDays: 3, createdAt: new Date() })
    const id2 = await db.plants.add({ name: 'B', room: 'X', wateringIntervalDays: 3, createdAt: new Date() })
    await db.careEvents.add({ plantId: id1 as number, type: 'watering', date: new Date(Date.now() - 20 * 86_400_000) })
    await db.careEvents.add({ plantId: id2 as number, type: 'watering', date: new Date(Date.now() - 10 * 86_400_000) })

    const stats = useStats()
    await stats.load()
    const plants = stats.overduePlants.value
    expect(plants.length).toBeGreaterThan(0)
    expect(plants[0].overdueDays).toBeGreaterThanOrEqual(plants[plants.length - 1].overdueDays)
  })

  // ─── chartData ──────────────────────────────────────────────────────────────

  it('chartData ma 30 etykiet', async () => {
    const stats = useStats()
    await stats.load()
    expect(stats.chartData.value.labels).toHaveLength(30)
  })

  it('chartData zlicza podlewania per dzień', async () => {
    const today = new Date()
    await db.careEvents.bulkAdd([
      { plantId: 1, type: 'watering', date: today },
      { plantId: 2, type: 'watering', date: today },
      { plantId: 1, type: 'fertilizing', date: today },
    ])
    const stats = useStats()
    await stats.load()
    const counts = stats.chartData.value.datasets[0].data as number[]
    expect(counts[counts.length - 1]).toBe(2) // dzisiaj = ostatnia kolumna
  })
})
