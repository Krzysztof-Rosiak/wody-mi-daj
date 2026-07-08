import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSurveysStore } from '../surveys'
import { db } from '@/db'
import type { PlantSurvey } from '@/types'

const makeSurvey = (plantId: number, daysAgo = 0): Omit<PlantSurvey, 'id'> => ({
  plantId,
  date: new Date(Date.now() - daysAgo * 86_400_000),
  condition: 3,
  heightCm: 30,
})

describe('useSurveysStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plantSurveys.clear()
  })

  it('add zapisuje ankietę i zwraca id', async () => {
    const store = useSurveysStore()
    const id = await store.add(makeSurvey(1))
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })

  it('fetchByPlant zwraca ankiety danej rośliny w kolejności malejącej', async () => {
    const store = useSurveysStore()
    await store.add(makeSurvey(1, 10))
    await store.add(makeSurvey(1, 3))
    await store.add(makeSurvey(2, 1)) // different plant

    await store.fetchByPlant(1)
    expect(store.surveys).toHaveLength(2)
    // the newer one (3 days ago) should be first
    const first = new Date(store.surveys[0].date).getTime()
    const second = new Date(store.surveys[1].date).getTime()
    expect(first).toBeGreaterThan(second)
  })

  it('fetchByPlant nie zwraca ankiet innych roślin', async () => {
    const store = useSurveysStore()
    await store.add(makeSurvey(2))
    await store.fetchByPlant(1)
    expect(store.surveys).toHaveLength(0)
  })

  it('fetchAll zwraca wszystkie ankiety', async () => {
    const store = useSurveysStore()
    await store.add(makeSurvey(1))
    await store.add(makeSurvey(2))

    const all = await store.fetchAll()
    expect(all).toHaveLength(2)
  })

  it('remove usuwa ankietę z bazy i reaktywnej listy', async () => {
    const store = useSurveysStore()
    const id1 = await store.add(makeSurvey(1))
    const id2 = await store.add(makeSurvey(1))
    await store.fetchByPlant(1)
    expect(store.surveys).toHaveLength(2)

    await store.remove(id1)
    expect(store.surveys).toHaveLength(1)
    expect(store.surveys[0].id).toBe(id2)
  })

  it('getLastByPlant zwraca najnowszą ankietę', async () => {
    const store = useSurveysStore()
    await store.add(makeSurvey(1, 10))
    const recentId = await store.add(makeSurvey(1, 1))

    const last = await store.getLastByPlant(1)
    expect(last?.id).toBe(recentId)
  })

  it('getLastByPlant zwraca undefined gdy brak ankiet', async () => {
    const store = useSurveysStore()
    const last = await store.getLastByPlant(999)
    expect(last).toBeUndefined()
  })
})
