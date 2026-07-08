import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataBackup } from '../useDataBackup'
import { db } from '@/db'

describe('useDataBackup', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
    await db.plantSurveys.clear()
    await db.customRooms.clear()
  })

  describe('stan początkowy', () => {
    it('nie ma błędu ani sukcesu, tryb wklejania jest wyłączony', () => {
      const backup = useDataBackup()
      expect(backup.importError.value).toBeNull()
      expect(backup.importSuccess.value).toBe(false)
      expect(backup.pasteMode.value).toBe(false)
      expect(backup.pasteText.value).toBe('')
    })
  })

  describe('resetImportStatus', () => {
    it('czyści błąd i flagę sukcesu', () => {
      const backup = useDataBackup()
      backup.importError.value = 'coś'
      backup.importSuccess.value = true
      backup.resetImportStatus()
      expect(backup.importError.value).toBeNull()
      expect(backup.importSuccess.value).toBe(false)
    })
  })

  describe('importFile — walidacja', () => {
    function makeFile(content: string): File {
      const file = new File([content], 'test.json', { type: 'application/json' })
      if (!file.text) {
        Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) })
      }
      return file
    }

    it('ustawia błąd dla nieprawidłowego JSON', async () => {
      const backup = useDataBackup()
      await backup.importFile(makeFile('not valid json {{{'))
      expect(backup.importError.value).toContain('Błąd podczas importu')
      expect(backup.importSuccess.value).toBe(false)
    })

    it('ustawia błąd gdy brak wymaganych pól', async () => {
      const backup = useDataBackup()
      await backup.importFile(makeFile(JSON.stringify({ version: 1 })))
      expect(backup.importError.value).toContain('Nieprawidłowy format')
    })

    it('ustawia błąd gdy plik jest za duży', async () => {
      const backup = useDataBackup()
      const bigFile = { size: 51 * 1024 * 1024, text: () => Promise.resolve('{}') } as File
      await backup.importFile(bigFile)
      expect(backup.importError.value).toContain('za duży')
    })

    it('odrzuca plik z za dużą liczbą roślin (walidacja rzuca, import łapie jako błąd ogólny)', async () => {
      const backup = useDataBackup()
      const plants = Array.from({ length: 10_001 }, (_, i) => ({
        id: i,
        name: `P${i}`,
        room: 'Salon',
        createdAt: new Date().toISOString(),
      }))
      await backup.importFile(
        makeFile(JSON.stringify({ version: 2, plants, careEvents: [] })),
      )
      expect(backup.importError.value).toContain('Błąd podczas importu')
      expect(await db.plants.count()).toBe(0)
    })

    it('importuje poprawny plik i ustawia importSuccess', async () => {
      const backup = useDataBackup()
      await backup.importFile(
        makeFile(
          JSON.stringify({
            version: 2,
            exportedAt: new Date().toISOString(),
            plants: [{ id: 1, name: 'Monstera', room: 'Salon', createdAt: new Date().toISOString() }],
            careEvents: [{ id: 1, plantId: 1, type: 'watering', date: new Date().toISOString() }],
          }),
        ),
      )
      expect(backup.importSuccess.value).toBe(true)
      expect(backup.importError.value).toBeNull()

      const plants = await db.plants.toArray()
      expect(plants).toHaveLength(1)
      const events = await db.careEvents.toArray()
      expect(events[0].plantId).toBe(plants[0].id)
    })

    it('remapuje plantId dla ankiet i pomija zdarzenia z nieznanym plantId', async () => {
      const backup = useDataBackup()
      await backup.importFile(
        makeFile(
          JSON.stringify({
            version: 2,
            exportedAt: new Date().toISOString(),
            plants: [{ id: 5, name: 'Aloes', room: 'Kuchnia', createdAt: new Date().toISOString() }],
            careEvents: [
              { id: 1, plantId: 5, type: 'watering', date: new Date().toISOString() },
              { id: 2, plantId: 999, type: 'fertilizing', date: new Date().toISOString() },
            ],
            surveys: [{ id: 10, plantId: 5, date: new Date().toISOString(), condition: 4, heightCm: 30 }],
          }),
        ),
      )

      const plants = await db.plants.toArray()
      const events = await db.careEvents.toArray()
      const surveys = await db.plantSurveys.toArray()
      expect(events).toHaveLength(1)
      expect(events[0].plantId).toBe(plants[0].id)
      expect(surveys[0].plantId).toBe(plants[0].id)
    })

    it('czyści poprzednie dane przed importem', async () => {
      await db.plants.add({ name: 'Stara roślina', room: 'Salon', createdAt: new Date() })
      const backup = useDataBackup()
      await backup.importFile(
        makeFile(JSON.stringify({ version: 2, plants: [], careEvents: [] })),
      )
      expect(await db.plants.count()).toBe(0)
    })

    it('importuje ustawienia aplikacji', async () => {
      const backup = useDataBackup()
      await backup.importFile(
        makeFile(
          JSON.stringify({
            version: 2,
            plants: [],
            careEvents: [],
            settings: { snoozeDays: 5, combineWateringFertilizing: false, isDark: true },
          }),
        ),
      )
      const settings = await db.settings.get(1)
      expect(settings?.snoozeDays).toBe(5)
      expect(settings?.combineWateringFertilizing).toBe(false)
    })
  })

  describe('handlePasteImport', () => {
    it('ustawia błąd dla za długiego wklejonego tekstu', async () => {
      const backup = useDataBackup()
      backup.pasteText.value = 'x'.repeat(51 * 1024 * 1024)
      await backup.handlePasteImport()
      expect(backup.importError.value).toContain('za duży')
    })

    it('ustawia błąd dla nieprawidłowego JSON', async () => {
      const backup = useDataBackup()
      backup.pasteText.value = 'not json'
      await backup.handlePasteImport()
      expect(backup.importError.value).toContain('Nieprawidłowy JSON')
    })

    it('importuje poprawne dane i czyści tekst oraz zamyka tryb wklejania', async () => {
      const backup = useDataBackup()
      backup.pasteMode.value = true
      backup.pasteText.value = JSON.stringify({
        version: 2,
        plants: [{ id: 1, name: 'Fikus', room: 'Salon', createdAt: new Date().toISOString() }],
        careEvents: [],
      })
      await backup.handlePasteImport()
      expect(backup.pasteText.value).toBe('')
      expect(backup.pasteMode.value).toBe(false)
      expect(await db.plants.count()).toBe(1)
    })
  })

  describe('cancelPaste', () => {
    it('wyłącza tryb wklejania i czyści tekst', () => {
      const backup = useDataBackup()
      backup.pasteMode.value = true
      backup.pasteText.value = 'coś'
      backup.cancelPaste()
      expect(backup.pasteMode.value).toBe(false)
      expect(backup.pasteText.value).toBe('')
    })
  })

  describe('exportData', () => {
    it('tworzy plik JSON z aktualnym stanem bazy i wyzwala pobranie', async () => {
      await db.plants.add({ name: 'Monstera', room: 'Salon', createdAt: new Date() })

      const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock')
      const revokeObjectURL = vi.fn()
      vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

      const backup = useDataBackup()
      await backup.exportData()

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      const blob = createObjectURL.mock.calls[0][0]
      expect(blob.type).toBe('application/json')
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

      clickSpy.mockRestore()
      vi.unstubAllGlobals()
    })
  })
})
