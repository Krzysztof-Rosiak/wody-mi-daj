import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db'
import type { PlantSurvey } from '@/types'

export const useSurveysStore = defineStore('surveys', () => {
  const surveys = ref<PlantSurvey[]>([])

  async function fetchByPlant(plantId: number) {
    surveys.value = await db.plantSurveys
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('date')
  }

  async function fetchAll(): Promise<PlantSurvey[]> {
    return db.plantSurveys.orderBy('date').reverse().toArray()
  }

  async function add(survey: Omit<PlantSurvey, 'id'>): Promise<number> {
    const id = await db.plantSurveys.add(survey)
    return id as number
  }

  async function update(id: number, data: Partial<Omit<PlantSurvey, 'id' | 'plantId'>>) {
    await db.plantSurveys.update(id, data)
    const idx = surveys.value.findIndex((s) => s.id === id)
    if (idx !== -1) surveys.value[idx] = { ...surveys.value[idx], ...data }
  }

  async function remove(id: number) {
    await db.plantSurveys.delete(id)
    surveys.value = surveys.value.filter((s) => s.id !== id)
  }

  /** Last survey for a given plant */
  async function getLastByPlant(plantId: number): Promise<PlantSurvey | undefined> {
    const results = await db.plantSurveys
      .where('plantId')
      .equals(plantId)
      .sortBy('date')
    return results[results.length - 1]
  }

  return { surveys, fetchByPlant, fetchAll, add, update, remove, getLastByPlant }
})
