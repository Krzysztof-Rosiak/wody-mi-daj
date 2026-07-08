import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useSettingsStore } from './settings'

export const useThemeStore = defineStore('theme', () => {
  const vuetifyTheme = useTheme()
  const settingsStore = useSettingsStore()
  const isDark = computed(() => settingsStore.isDark)

  function applyTheme(dark: boolean) {
    vuetifyTheme.change(dark ? 'gardenDark' : 'gardenLight')
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  async function setDark(value: boolean) {
    await settingsStore.setIsDark(value)
    applyTheme(value)
  }

  function toggle() {
    return setDark(!settingsStore.isDark)
  }

  function init() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    if (settingsStore.themeOverride === null || settingsStore.themeOverride === undefined) {
      // No manual choice — follow the system
      settingsStore.isDark = mq.matches
      applyTheme(mq.matches)
    } else {
      applyTheme(settingsStore.isDark)
    }

    mq.addEventListener('change', (e) => {
      if (settingsStore.themeOverride === null || settingsStore.themeOverride === undefined) {
        settingsStore.isDark = e.matches
        applyTheme(e.matches)
      }
    })
  }

  return { isDark, init, toggle, setDark }
})
