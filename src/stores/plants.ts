import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db'
import type { Plant } from '@/types'

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<Plant[]>([])
  const loading = ref(false)

  const archivedPlants = ref<Plant[]>([])

  async function fetchAll() {
    loading.value = true
    plants.value = await db.plants
      .orderBy('createdAt')
      .reverse()
      .filter((p) => !p.archivedAt)
      .toArray()
    loading.value = false
  }

  async function fetchArchived() {
    loading.value = true
    archivedPlants.value = await db.plants
      .orderBy('archivedAt')
      .reverse()
      .filter((p) => !!p.archivedAt)
      .toArray()
    loading.value = false
  }

  async function add(plant: Omit<Plant, 'id' | 'createdAt'>) {
    const id = await db.plants.add({ ...plant, createdAt: new Date() })
    await fetchAll()
    return id
  }

  async function update(id: number, changes: Partial<Omit<Plant, 'id' | 'createdAt'>>) {
    await db.plants.update(id, changes)
    await fetchAll()
  }

  async function archive(id: number) {
    await db.plants.update(id, { archivedAt: new Date() })
    await fetchAll()
  }

  async function unarchive(id: number) {
    await db.plants.update(id, { archivedAt: undefined })
    await fetchArchived()
  }

  async function remove(id: number) {
    await db.careEvents.where('plantId').equals(id).delete()
    await db.repottingDismissals.where('plantId').equals(id).delete()
    await db.plantSurveys.where('plantId').equals(id).delete()
    await db.snoozes.where('plantId').equals(id).delete()
    await db.plants.delete(id)
    await fetchAll()
    await fetchArchived()
  }

  function getById(id: number): Plant | undefined {
    return plants.value.find((p) => p.id === id)
  }

  return { plants, archivedPlants, loading, fetchAll, fetchArchived, add, update, archive, unarchive, remove, getById }
})
