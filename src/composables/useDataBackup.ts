import { ref } from 'vue'
import { db } from '@/db'
import { usePlantsStore } from '@/stores/plants'
import { useRoomsStore } from '@/stores/rooms'
import { useSettingsStore } from '@/stores/settings'
import { toISODateString } from '@/utils/date'
import type { ExportData } from '@/types'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_PLANTS = 10_000
const MAX_EVENTS = 100_000
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (!d.version || !Array.isArray(d.plants) || !Array.isArray(d.careEvents)) return false
  if (d.plants.length > MAX_PLANTS) throw new Error(`Za wiele roślin w pliku (max ${MAX_PLANTS})`)
  if (d.careEvents.length > MAX_EVENTS)
    throw new Error(`Za wiele zdarzeń w pliku (max ${MAX_EVENTS})`)
  for (const plant of d.plants as Record<string, unknown>[]) {
    if (typeof plant.name !== 'string' || plant.name.length > 200)
      throw new Error('Nieprawidłowa nazwa rośliny')
    if (
      plant.imageBase64 !== undefined &&
      typeof plant.imageBase64 === 'string' &&
      plant.imageBase64.length > MAX_IMAGE_SIZE
    )
      throw new Error('Zdjęcie rośliny przekracza dopuszczalny rozmiar (max 5MB)')
  }
  return true
}

export function useDataBackup() {
  const plantsStore = usePlantsStore()
  const roomsStore = useRoomsStore()
  const settingsStore = useSettingsStore()

  const importError = ref<string | null>(null)
  const importSuccess = ref(false)
  const pasteMode = ref(false)
  const pasteText = ref('')

  async function exportData() {
    const [plants, careEvents, surveys, customRooms, settingsRow] = await Promise.all([
      db.plants.toArray(),
      db.careEvents.toArray(),
      db.plantSurveys.toArray(),
      db.customRooms.toArray(),
      db.settings.get(1),
    ])

    const data: ExportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      plants,
      careEvents,
      surveys,
      customRooms,
      settings: settingsRow
        ? {
            snoozeDays: settingsRow.snoozeDays,
            combineWateringFertilizing: settingsRow.combineWateringFertilizing,
            isDark: settingsRow.isDark,
          }
        : undefined,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wodymidaj-backup-${toISODateString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function doImport(data: ExportData) {
    await db.transaction(
      'rw',
      db.plants,
      db.careEvents,
      db.plantSurveys,
      db.customRooms,
      async () => {
        await db.plants.clear()
        await db.careEvents.clear()
        await db.plantSurveys.clear()
        await db.customRooms.clear()

        const idMap = new Map<number, number>()

        for (const plant of data.plants) {
          const { id, ...plantData } = plant
          plantData.createdAt = new Date(plantData.createdAt)
          if (plantData.archivedAt) plantData.archivedAt = new Date(plantData.archivedAt)
          const newId = await db.plants.add(plantData)
          if (id !== undefined) idMap.set(id, newId as number)
        }

        for (const event of data.careEvents) {
          const { id: _id, ...eventData } = event
          const newPlantId = idMap.get(eventData.plantId)
          if (newPlantId === undefined) continue
          await db.careEvents.add({
            ...eventData,
            plantId: newPlantId,
            date: new Date(eventData.date),
          })
        }

        for (const survey of data.surveys ?? []) {
          const { id: _id, ...surveyData } = survey
          const newPlantId = idMap.get(surveyData.plantId)
          if (newPlantId === undefined) continue
          await db.plantSurveys.add({
            ...surveyData,
            plantId: newPlantId,
            date: new Date(surveyData.date),
          })
        }

        for (const room of data.customRooms ?? []) {
          const { id: _id, ...roomData } = room
          await db.customRooms.add(roomData)
        }
      },
    )

    if (data.settings) {
      await db.settings.put({ id: 1, ...data.settings })
      await settingsStore.load()
    }

    await plantsStore.fetchAll()
    await roomsStore.fetchAll()
    importSuccess.value = true
    importError.value = null
  }

  function resetImportStatus() {
    importError.value = null
    importSuccess.value = false
  }

  async function handlePasteImport() {
    resetImportStatus()
    if (pasteText.value.length > MAX_FILE_SIZE) {
      importError.value = 'Wklejony tekst jest za duży (max 50MB).'
      return
    }
    try {
      const raw: unknown = JSON.parse(pasteText.value)
      if (!validateImportData(raw)) {
        importError.value = 'Nieprawidłowy format. Upewnij się, że to plik eksportu z tej aplikacji.'
        return
      }
      await doImport(raw)
      pasteText.value = ''
      pasteMode.value = false
    } catch {
      importError.value = 'Nieprawidłowy JSON. Sprawdź czy skopiowałaś cały plik.'
    }
  }

  async function importFile(file: File) {
    resetImportStatus()
    if (file.size > MAX_FILE_SIZE) {
      importError.value = 'Plik jest za duży (max 50MB).'
      return
    }
    try {
      const raw: unknown = JSON.parse(await file.text())
      if (!validateImportData(raw)) {
        importError.value =
          'Nieprawidłowy format pliku. Upewnij się, że to plik eksportu z tej aplikacji.'
        return
      }
      await doImport(raw)
    } catch {
      importError.value = 'Błąd podczas importu pliku. Sprawdź czy plik nie jest uszkodzony.'
    }
  }

  function cancelPaste() {
    pasteMode.value = false
    pasteText.value = ''
  }

  return {
    importError,
    importSuccess,
    pasteMode,
    pasteText,
    exportData,
    resetImportStatus,
    handlePasteImport,
    importFile,
    cancelPaste,
  }
}
