import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db'
import type { PlantPhoto } from '@/types'

export const usePhotosStore = defineStore('photos', () => {
  const photos = ref<PlantPhoto[]>([])

  async function fetchByPlant(plantId: number) {
    photos.value = await db.plantPhotos
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('createdAt')
  }

  async function add(photo: Omit<PlantPhoto, 'id'>): Promise<number> {
    const id = await db.plantPhotos.add(photo)
    await fetchByPlant(photo.plantId)
    return id as number
  }

  async function remove(id: number) {
    await db.plantPhotos.delete(id)
    photos.value = photos.value.filter((p) => p.id !== id)
  }

  return { photos, fetchByPlant, add, remove }
})
