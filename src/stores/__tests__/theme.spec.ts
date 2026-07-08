import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db'

let mockCurrentTheme = 'gardenLight'
vi.mock('vuetify', () => ({
  useTheme: () => ({
    change: (name: string) => { mockCurrentTheme = name },
  }),
}))

const { useThemeStore } = await import('../theme')
const { useSettingsStore } = await import('../settings')

describe('useThemeStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.settings.clear()
    mockCurrentTheme = 'gardenLight'
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    })
  })

  it('isDark jest false przed load()', () => {
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
  })

  it('isDark jest true po load() gdy w DB isDark=true', async () => {
    await db.settings.put({ id: 1, snoozeDays: 2, combineWateringFertilizing: true, isDark: true })
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    expect(store.isDark).toBe(true)
  })

  it('init ustawia motyw jasny gdy isDark=false', () => {
    const store = useThemeStore()
    store.init()
    expect(mockCurrentTheme).toBe('gardenLight')
  })

  it('init ustawia motyw ciemny gdy isDark=true i themeOverride=true', async () => {
    await db.settings.put({ id: 1, snoozeDays: 2, combineWateringFertilizing: true, isDark: true, themeOverride: true })
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    store.init()
    expect(mockCurrentTheme).toBe('gardenDark')
  })

  it('setDark(true) ustawia isDark=true', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(true)
    expect(store.isDark).toBe(true)
  })

  it('setDark(false) ustawia isDark=false', async () => {
    await db.settings.put({ id: 1, snoozeDays: 2, combineWateringFertilizing: true, isDark: true })
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(false)
    expect(store.isDark).toBe(false)
  })

  it('setDark(true) zapisuje isDark=true w DB', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(true)
    const row = await db.settings.get(1)
    expect(row?.isDark).toBe(true)
  })

  it('setDark(false) zapisuje isDark=false w DB', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(false)
    const row = await db.settings.get(1)
    expect(row?.isDark).toBe(false)
  })

  it('setDark(true) przełącza motyw Vuetify na gardenDark', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(true)
    expect(mockCurrentTheme).toBe('gardenDark')
  })

  it('setDark(false) przełącza motyw Vuetify na gardenLight', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(true)
    await store.setDark(false)
    expect(mockCurrentTheme).toBe('gardenLight')
  })

  it('toggle przełącza z false na true', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
    await store.toggle()
    expect(store.isDark).toBe(true)
  })

  it('toggle przełącza z true na false', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.setDark(true)
    await store.toggle()
    expect(store.isDark).toBe(false)
  })

  it('toggle dwukrotnie wraca do wyjściowego stanu', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    const initial = store.isDark
    await store.toggle()
    await store.toggle()
    expect(store.isDark).toBe(initial)
  })

  it('toggle aktualizuje motyw Vuetify', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const store = useThemeStore()
    await store.toggle()
    expect(mockCurrentTheme).toBe('gardenDark')
    await store.toggle()
    expect(mockCurrentTheme).toBe('gardenLight')
  })
})
