import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { computed, ref } from 'vue'
import { usePlantPhotoGallery } from '../usePlantPhotoGallery'
import { usePlantsStore } from '@/stores/plants'
import { useSurveysStore } from '@/stores/surveys'
import { usePhotosStore } from '@/stores/photos'
import { db } from '@/db'
import type { Plant } from '@/types'

async function setup(plantId: number) {
  const plantsStore = usePlantsStore()
  const surveysStore = useSurveysStore()
  const photosStore = usePhotosStore()
  await plantsStore.fetchAll()
  await surveysStore.fetchByPlant(plantId)
  await photosStore.fetchByPlant(plantId)

  const plantIdRef = ref(plantId)
  const plant = computed<Plant | undefined>(() => plantsStore.getById(plantIdRef.value))
  const gallery = usePlantPhotoGallery(
    computed(() => plantIdRef.value),
    plant,
  )
  return { ...gallery, plantsStore, surveysStore, photosStore }
}

describe('usePlantPhotoGallery', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.plantSurveys.clear()
    await db.plantPhotos.clear()
  })

  describe('allPhotos', () => {
    it('zwraca pustą listę gdy roślina nie ma żadnych zdjęć', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const { allPhotos } = await setup(id)
      expect(allPhotos.value).toEqual([])
    })

    it('zawiera zdjęcie główne rośliny gdy nie występuje gdzie indziej', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'main.jpg', createdAt: new Date(),
      })) as number
      const { allPhotos } = await setup(id)
      expect(allPhotos.value).toHaveLength(1)
      expect(allPhotos.value[0]).toMatchObject({
        src: 'main.jpg',
        label: 'Zdjęcie główne',
        isMain: true,
        sourceType: 'plant',
      })
    })

    it('zawiera zdjęcia z ankiet i oznacza jako główne to zgodne z imageBase64 rośliny', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'survey.jpg', createdAt: new Date(),
      })) as number
      await db.plantSurveys.add({
        plantId: id, date: new Date(2024, 0, 1), condition: 3, imageBase64: 'survey.jpg',
      })
      const { allPhotos } = await setup(id)
      expect(allPhotos.value).toHaveLength(1)
      expect(allPhotos.value[0]).toMatchObject({
        src: 'survey.jpg',
        isMain: true,
        sourceType: 'survey',
      })
      expect(allPhotos.value[0].label).toContain('Główne')
    })

    it('zawiera samodzielne zdjęcia z galerii (standalone)', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      await db.plantPhotos.add({ plantId: id, imageBase64: 'gallery.jpg', createdAt: new Date() })
      const { allPhotos } = await setup(id)
      expect(allPhotos.value).toHaveLength(1)
      expect(allPhotos.value[0]).toMatchObject({ src: 'gallery.jpg', isMain: false, sourceType: 'standalone' })
    })

    it('nie duplikuje tego samego zdjęcia widocznego w kilku miejscach', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'shared.jpg', createdAt: new Date(),
      })) as number
      await db.plantSurveys.add({ plantId: id, date: new Date(), condition: 3, imageBase64: 'shared.jpg' })
      await db.plantPhotos.add({ plantId: id, imageBase64: 'shared.jpg', createdAt: new Date() })
      const { allPhotos } = await setup(id)
      expect(allPhotos.value).toHaveLength(1)
    })
  })

  describe('openGallery / openGalleryAtMain', () => {
    it('openGallery ustawia startIndex i otwiera galerię', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const { openGallery, showGallery, galleryStartIndex } = await setup(id)
      openGallery(2)
      expect(showGallery.value).toBe(true)
      expect(galleryStartIndex.value).toBe(2)
    })

    it('openGalleryAtMain ustawia indeks zdjęcia głównego', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'main.jpg', createdAt: new Date(),
      })) as number
      await db.plantPhotos.add({ plantId: id, imageBase64: 'other.jpg', createdAt: new Date(2020, 0, 1) })
      const { openGalleryAtMain, galleryStartIndex, allPhotos } = await setup(id)
      openGalleryAtMain()
      const mainIndex = allPhotos.value.findIndex((p) => p.isMain)
      expect(galleryStartIndex.value).toBe(mainIndex)
    })

    it('openGalleryAtMain otwiera na indeksie 0 gdy brak zdjęcia głównego', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      await db.plantPhotos.add({ plantId: id, imageBase64: 'x.jpg', createdAt: new Date() })
      const { openGalleryAtMain, galleryStartIndex } = await setup(id)
      openGalleryAtMain()
      expect(galleryStartIndex.value).toBe(0)
    })
  })

  describe('setAsMainPhoto', () => {
    it('ustawia imageBase64 rośliny na wskazane zdjęcie', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const { setAsMainPhoto, plantsStore } = await setup(id)
      await setAsMainPhoto('new-main.jpg')
      expect(plantsStore.getById(id)?.imageBase64).toBe('new-main.jpg')
    })
  })

  describe('addPhotoToGallery', () => {
    it('dodaje zdjęcie do galerii standalone', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const { addPhotoToGallery, photosStore } = await setup(id)
      await addPhotoToGallery('new.jpg')
      expect(photosStore.photos.some((p) => p.imageBase64 === 'new.jpg')).toBe(true)
    })

    it('ustawia jako główne zdjęcie rośliny gdy roślina jeszcze go nie ma', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const { addPhotoToGallery, plantsStore } = await setup(id)
      await addPhotoToGallery('first.jpg')
      expect(plantsStore.getById(id)?.imageBase64).toBe('first.jpg')
    })

    it('nie nadpisuje istniejącego zdjęcia głównego', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'existing.jpg', createdAt: new Date(),
      })) as number
      const { addPhotoToGallery, plantsStore } = await setup(id)
      await addPhotoToGallery('second.jpg')
      expect(plantsStore.getById(id)?.imageBase64).toBe('existing.jpg')
    })
  })

  describe('deletePhoto', () => {
    it('usuwa zdjęcie typu standalone z galerii', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const photoId = await db.plantPhotos.add({ plantId: id, imageBase64: 'x.jpg', createdAt: new Date() })
      const { deletePhoto, photosStore } = await setup(id)
      await deletePhoto({
        src: 'x.jpg', label: 'x', isMain: false, sourceType: 'standalone', sourceId: photoId as number,
      })
      expect(photosStore.photos).toHaveLength(0)
    })

    it('czyści imageBase64 ankiety przy usunięciu zdjęcia typu survey', async () => {
      const id = (await db.plants.add({ name: 'A', room: 'Salon', createdAt: new Date() })) as number
      const surveyId = await db.plantSurveys.add({
        plantId: id, date: new Date(), condition: 3, imageBase64: 'survey.jpg',
      })
      const { deletePhoto, surveysStore } = await setup(id)
      await deletePhoto({
        src: 'survey.jpg', label: 'survey', isMain: false, sourceType: 'survey', sourceId: surveyId as number,
      })
      const survey = await db.plantSurveys.get(surveyId as number)
      expect(survey?.imageBase64).toBeUndefined()
      expect(surveysStore.surveys.find((s) => s.id === surveyId)?.imageBase64).toBeUndefined()
    })

    it('czyści imageBase64 rośliny przy usunięciu zdjęcia głównego typu plant', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'main.jpg', createdAt: new Date(),
      })) as number
      const { deletePhoto, plantsStore } = await setup(id)
      await deletePhoto({ src: 'main.jpg', label: 'main', isMain: true, sourceType: 'plant' })
      expect(plantsStore.getById(id)?.imageBase64).toBeUndefined()
    })

    it('czyści też imageBase64 rośliny gdy usuwane zdjęcie było jej głównym, choć pochodzi z innego źródła', async () => {
      const id = (await db.plants.add({
        name: 'A', room: 'Salon', imageBase64: 'shared.jpg', createdAt: new Date(),
      })) as number
      const photoId = await db.plantPhotos.add({ plantId: id, imageBase64: 'shared.jpg', createdAt: new Date() })
      const { deletePhoto, plantsStore } = await setup(id)
      await deletePhoto({
        src: 'shared.jpg', label: 'shared', isMain: true, sourceType: 'standalone', sourceId: photoId as number,
      })
      expect(plantsStore.getById(id)?.imageBase64).toBeUndefined()
    })
  })
})
