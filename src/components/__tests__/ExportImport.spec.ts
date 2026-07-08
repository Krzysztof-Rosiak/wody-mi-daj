import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import ExportImport from '../data/ExportImport.vue'
import { db } from '@/db'

const vuetify = createVuetify({ components, directives })

function makeFile(content: string): File {
  const file = new File([content], 'test.json', { type: 'application/json' })
  if (!file.text) {
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) })
  }
  return file
}

function mountComponent() {
  return mount(ExportImport, {
    global: { plugins: [vuetify] },
    attachTo: document.body,
  })
}

async function importFile(vm: any, content: string) {
  const file = makeFile(content)
  const event = { target: { files: [file], value: '' } } as any
  await vm.handleFileImport(event)
  await flushPromises()
}

describe('ExportImport', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.plants.clear()
    await db.careEvents.clear()
    await db.plantSurveys.clear()
    await db.customRooms.clear()
  })

  it('renderuje przyciski eksportu i importu', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Eksportuj dane')
    expect(wrapper.text()).toContain('Przeciągnij plik JSON tutaj')
    wrapper.unmount()
  })

  it('wyświetla błąd przy imporcie nieprawidłowego JSON', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, 'not valid json {{{')
    expect((wrapper.vm as any).importError).toContain('Błąd podczas importu')
    wrapper.unmount()
  })

  it('wyświetla błąd przy imporcie pliku bez wymaganych pól', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({ version: 1 }))
    expect((wrapper.vm as any).importError).toContain('Nieprawidłowy format')
    wrapper.unmount()
  })

  it('importuje rośliny i zdarzenia, remapuje plantId', async () => {
    await db.plants.add({ name: 'Stara roślina', room: 'Salon', createdAt: new Date() })

    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [{ id: 99, name: 'Monstera', room: 'Salon', createdAt: new Date().toISOString() }],
      careEvents: [{ id: 1, plantId: 99, type: 'watering', date: new Date().toISOString() }],
    }))

    const plants = await db.plants.toArray()
    expect(plants).toHaveLength(1)
    expect(plants[0].name).toBe('Monstera')

    const events = await db.careEvents.toArray()
    expect(events).toHaveLength(1)
    expect(events[0].plantId).toBe(plants[0].id) // remapped id
    expect((wrapper.vm as any).importSuccess).toBe(true)
    wrapper.unmount()
  })

  it('importuje ankiety z poprawnym remapowaniem plantId', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [{ id: 5, name: 'Aloes', room: 'Kuchnia', createdAt: new Date().toISOString() }],
      careEvents: [],
      surveys: [
        { id: 10, plantId: 5, date: new Date().toISOString(), condition: 4, heightCm: 30 },
      ],
    }))

    const plants = await db.plants.toArray()
    const surveys = await db.plantSurveys.toArray()
    expect(surveys).toHaveLength(1)
    expect(surveys[0].plantId).toBe(plants[0].id)
    expect(surveys[0].condition).toBe(4)
    expect(surveys[0].heightCm).toBe(30)
    wrapper.unmount()
  })

  it('importuje pokoje niestandardowe', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [],
      careEvents: [],
      customRooms: [{ id: 1, name: 'Sypialnia' }, { id: 2, name: 'Balkon' }],
    }))

    const rooms = await db.customRooms.toArray()
    expect(rooms).toHaveLength(2)
    expect(rooms.map((r) => r.name)).toContain('Sypialnia')
    expect(rooms.map((r) => r.name)).toContain('Balkon')
    wrapper.unmount()
  })

  it('pomija zdarzenia z nieznanym plantId', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [{ id: 1, name: 'Fikus', room: 'Salon', createdAt: new Date().toISOString() }],
      careEvents: [
        { id: 1, plantId: 1, type: 'watering', date: new Date().toISOString() },
        { id: 2, plantId: 999, type: 'fertilizing', date: new Date().toISOString() }, // unknown id
      ],
    }))

    const events = await db.careEvents.toArray()
    expect(events).toHaveLength(1) // only the event with plantId: 1
    wrapper.unmount()
  })

  it('czyści poprzednie dane przy imporcie', async () => {
    await db.plants.add({ name: 'Stara roślina', room: 'Salon', createdAt: new Date() })
    await db.plantSurveys.add({ plantId: 1, date: new Date(), condition: 3, heightCm: 20 })

    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [],
      careEvents: [],
      surveys: [],
    }))

    expect(await db.plants.count()).toBe(0)
    expect(await db.plantSurveys.count()).toBe(0)
    wrapper.unmount()
  })

  it('importuje ustawienia aplikacji', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      plants: [],
      careEvents: [],
      settings: { snoozeDays: 5, combineWateringFertilizing: false, isDark: true },
    }))

    const settings = await db.settings.get(1)
    expect(settings?.snoozeDays).toBe(5)
    expect(settings?.combineWateringFertilizing).toBe(false)
    expect(settings?.isDark).toBe(true)
    wrapper.unmount()
  })

  it('obsługuje plik v1 bez surveys i customRooms', async () => {
    const wrapper = mountComponent()
    await importFile(wrapper.vm as any, JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      plants: [{ id: 1, name: 'Pothos', room: 'Biuro', createdAt: new Date().toISOString() }],
      careEvents: [],
    }))

    expect((wrapper.vm as any).importSuccess).toBe(true)
    expect(await db.plants.count()).toBe(1)
    wrapper.unmount()
  })
})
