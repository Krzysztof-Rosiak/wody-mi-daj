import { ref, computed, type ComputedRef } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useSurveysStore } from '@/stores/surveys'
import { usePhotosStore } from '@/stores/photos'
import { formatDatePl } from '@/utils/date'
import type { GalleryPhoto } from '@/components/plants/PhotoGallery.vue'
import type { Plant } from '@/types'

export function usePlantPhotoGallery(plantId: ComputedRef<number>, plant: ComputedRef<Plant | undefined>) {
  const plantsStore = usePlantsStore()
  const surveysStore = useSurveysStore()
  const photosStore = usePhotosStore()

  const showGallery = ref(false)
  const galleryStartIndex = ref(0)

  const allPhotos = computed((): GalleryPhoto[] => {
    const mainSrc = plant.value?.imageBase64
    const seen = new Set<string>()
    const photos: GalleryPhoto[] = []

    for (const s of [...surveysStore.surveys].reverse()) {
      if (s.imageBase64 && !seen.has(s.imageBase64)) {
        const dateLabel = formatDatePl(new Date(s.date), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        photos.push({
          src: s.imageBase64,
          label: s.imageBase64 === mainSrc ? `${dateLabel} · Główne` : dateLabel,
          isMain: s.imageBase64 === mainSrc,
          sourceType: 'survey',
          sourceId: s.id,
        })
        seen.add(s.imageBase64)
      }
    }

    for (const p of photosStore.photos) {
      if (!seen.has(p.imageBase64)) {
        const dateLabel = formatDatePl(new Date(p.createdAt), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        photos.push({
          src: p.imageBase64,
          label: p.imageBase64 === mainSrc ? `${dateLabel} · Główne` : dateLabel,
          isMain: p.imageBase64 === mainSrc,
          sourceType: 'standalone',
          sourceId: p.id,
        })
        seen.add(p.imageBase64)
      }
    }

    if (mainSrc && !seen.has(mainSrc))
      photos.push({ src: mainSrc, label: 'Zdjęcie główne', isMain: true, sourceType: 'plant' })

    return photos
  })

  function openGallery(index = 0) {
    galleryStartIndex.value = index
    showGallery.value = true
  }

  function openGalleryAtMain() {
    const idx = allPhotos.value.findIndex((p) => p.isMain)
    openGallery(idx >= 0 ? idx : 0)
  }

  async function setAsMainPhoto(src: string) {
    await plantsStore.update(plantId.value, { imageBase64: src })
  }

  async function deletePhoto(photo: GalleryPhoto) {
    if (photo.sourceType === 'survey' && photo.sourceId !== undefined) {
      await surveysStore.update(photo.sourceId, { imageBase64: undefined })
      await surveysStore.fetchByPlant(plantId.value)
    } else if (photo.sourceType === 'standalone' && photo.sourceId !== undefined) {
      await photosStore.remove(photo.sourceId)
    } else if (photo.sourceType === 'plant') {
      await plantsStore.update(plantId.value, { imageBase64: undefined })
    }
    if (photo.isMain && photo.sourceType !== 'plant') {
      await plantsStore.update(plantId.value, { imageBase64: undefined })
    }
  }

  async function addPhotoToGallery(imageBase64: string) {
    await photosStore.add({ plantId: plantId.value, imageBase64, createdAt: new Date() })
    if (!plant.value?.imageBase64) await plantsStore.update(plantId.value, { imageBase64 })
  }

  return {
    showGallery,
    galleryStartIndex,
    allPhotos,
    openGallery,
    openGalleryAtMain,
    setAsMainPhoto,
    deletePhoto,
    addPhotoToGallery,
  }
}
