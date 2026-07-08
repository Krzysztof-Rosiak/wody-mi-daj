import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { AppSettings } from '@/types'

const DEFAULTS: AppSettings = {
  id: 1,
  snoozeDays: 2,
  combineWateringFertilizing: true,
  isDark: false,
  notificationsEnabled: false,
}

function migrateFromLocalStorage(): Partial<AppSettings> {
  const patch: Partial<AppSettings> = {}
  const snooze = localStorage.getItem('plants-snooze-days')
  const combine = localStorage.getItem('plants-combine-watering-fertilizing')
  const theme = localStorage.getItem('plants-theme')
  if (snooze !== null) { patch.snoozeDays = parseInt(snooze, 10); localStorage.removeItem('plants-snooze-days') }
  if (combine !== null) { patch.combineWateringFertilizing = combine !== 'false'; localStorage.removeItem('plants-combine-watering-fertilizing') }
  if (theme !== null) { patch.isDark = theme === 'dark'; localStorage.removeItem('plants-theme') }
  return patch
}

export const useSettingsStore = defineStore('settings', () => {
  const snoozeDays = ref(DEFAULTS.snoozeDays)
  const combineWateringFertilizing = ref(DEFAULTS.combineWateringFertilizing)
  const isDark = ref(DEFAULTS.isDark)
  const themeOverride = ref<boolean | null>(null)
  const notificationsEnabled = ref(false)

  async function load() {
    let row = await db.settings.get(1)
    if (!row) {
      row = { ...DEFAULTS, ...migrateFromLocalStorage() }
      await db.settings.put(row)
    }
    snoozeDays.value = row.snoozeDays
    combineWateringFertilizing.value = row.combineWateringFertilizing
    isDark.value = row.isDark
    themeOverride.value = row.themeOverride ?? null
    notificationsEnabled.value = row.notificationsEnabled ?? false
  }

  async function setSnoozeDays(value: number) {
    snoozeDays.value = value
    await db.settings.update(1, { snoozeDays: value })
  }

  async function setCombineWateringFertilizing(value: boolean) {
    combineWateringFertilizing.value = value
    await db.settings.update(1, { combineWateringFertilizing: value })
  }

  async function setIsDark(value: boolean) {
    isDark.value = value
    themeOverride.value = value
    await db.settings.update(1, { isDark: value, themeOverride: value })
  }

  async function setNotificationsEnabled(value: boolean) {
    notificationsEnabled.value = value
    await db.settings.update(1, { notificationsEnabled: value })
  }

  return {
    snoozeDays, combineWateringFertilizing, isDark, themeOverride, notificationsEnabled,
    load, setSnoozeDays, setCombineWateringFertilizing, setIsDark, setNotificationsEnabled,
  }
})
