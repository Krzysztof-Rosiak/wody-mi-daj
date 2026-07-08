import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'
import { db } from '@/db'

describe('useSettingsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await db.settings.clear()
  })

  it('domyślne wartości przed load()', () => {
    const store = useSettingsStore()
    expect(store.snoozeDays).toBe(2)
    expect(store.combineWateringFertilizing).toBe(true)
    expect(store.isDark).toBe(false)
  })

  it('load() tworzy wiersz z domyślnymi wartościami', async () => {
    const store = useSettingsStore()
    await store.load()
    expect(store.snoozeDays).toBe(2)
    expect(store.combineWateringFertilizing).toBe(true)
    expect(store.isDark).toBe(false)
  })

  it('load() migruje snoozeDays z localStorage', async () => {
    localStorage.setItem('plants-snooze-days', '10')
    const store = useSettingsStore()
    await store.load()
    expect(store.snoozeDays).toBe(10)
    expect(localStorage.getItem('plants-snooze-days')).toBeNull()
  })

  it('load() migruje combineWateringFertilizing=false z localStorage', async () => {
    localStorage.setItem('plants-combine-watering-fertilizing', 'false')
    const store = useSettingsStore()
    await store.load()
    expect(store.combineWateringFertilizing).toBe(false)
    expect(localStorage.getItem('plants-combine-watering-fertilizing')).toBeNull()
  })

  it('load() migruje motyw dark z localStorage', async () => {
    localStorage.setItem('plants-theme', 'dark')
    const store = useSettingsStore()
    await store.load()
    expect(store.isDark).toBe(true)
    expect(localStorage.getItem('plants-theme')).toBeNull()
  })

  it('setSnoozeDays aktualizuje wartość reaktywną', async () => {
    const store = useSettingsStore()
    await store.load()
    await store.setSnoozeDays(5)
    expect(store.snoozeDays).toBe(5)
  })

  it('setCombineWateringFertilizing aktualizuje wartość reaktywną', async () => {
    const store = useSettingsStore()
    await store.load()
    await store.setCombineWateringFertilizing(false)
    expect(store.combineWateringFertilizing).toBe(false)
  })

  it('setIsDark aktualizuje wartość reaktywną', async () => {
    const store = useSettingsStore()
    await store.load()
    await store.setIsDark(true)
    expect(store.isDark).toBe(true)
  })
})
