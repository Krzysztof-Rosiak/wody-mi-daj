import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/fonts.css'
import './assets/base.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { mdiSvg } from './plugins/icons'

// ─── "Garden" color palette ──────────────────────────────────────────────────

const colors = {
  // Greens — primary
  mossForest:      '#4A7A3A', // primary light — dark green
  mossLight:       '#6AAF56', // primary dark  — vivid green

  // Greens — secondary (olive)
  oliveDark:       '#556035', // secondary light — dark olive (contrast 6.4:1)
  oliveLight:      '#8FAA60', // secondary dark  — light olive

  // Light backgrounds
  mintSurface:     '#FFFFFF', // surface light  — white
  sageBackground:  '#F4F4F4', // background light — neutral grey

  // Dark backgrounds
  forestNight:     '#1E1E1E', // surface dark   — dark grey
  deepMoss:        '#121212', // background dark — deep black

  // Floral accents
  coralRose:       '#D4896A', // accent 1 light — rose coral
  peach:           '#E8A882', // accent 1 dark  — peach
  lavender:        '#6040A0', // accent 2 light — dark violet (contrast 7:1)
  lilac:           '#C4A0E0', // accent 2 dark  — lilac

  // States
  freshGreen:      '#1D7A45', // success light — dark green (contrast 4.5:1)
  lushGreen:       '#6DC98A', // success dark
  honey:           '#8B6200', // warning light — dark amber (contrast 4.6:1)
  warmAmber:       '#E4AF4A', // warning dark
  cherry:          '#A52020', // error light — dark red (contrast 7:1)
  rosyRed:         '#E06060', // error dark

  // Text
  darkForest:      '#1A2614', // on-surface text light — dark green
  paleLeaf:        '#EDF5E8', // on-surface text dark  — light leaf
}

// ─── Vuetify themes ──────────────────────────────────────────────────────────

const gardenLight = {
  dark: false,
  colors: {
    primary:            colors.mossForest,
    'primary-darken-1': '#3A6230',
    'primary-lighten-1': colors.mossLight,
    secondary:          colors.oliveDark,
    'secondary-darken-1': '#556035',
    'secondary-lighten-1': colors.oliveLight,
    accent:             colors.coralRose,
    'accent-lavender':  colors.lavender,
    background:         colors.sageBackground,
    surface:            colors.mintSurface,
    'surface-variant':  '#DCE9D4',
    'on-surface':       colors.darkForest,
    'on-primary':       '#FFFFFF',
    'on-secondary':     '#FFFFFF',
    'on-background':    colors.darkForest,
    success:            colors.freshGreen,
    warning:            colors.honey,
    error:              colors.cherry,
    info:               colors.lavender,
  },
}

const gardenDark = {
  dark: true,
  colors: {
    primary:            colors.mossLight,
    'primary-darken-1': colors.mossForest,
    'primary-lighten-1': '#8FCC78',
    secondary:          colors.oliveLight,
    'secondary-darken-1': colors.oliveDark,
    'secondary-lighten-1': '#AACE80',
    accent:             colors.peach,
    'accent-lavender':  colors.lilac,
    background:         colors.deepMoss,
    surface:            colors.forestNight,
    'surface-variant':  '#1A2A14',
    'on-surface':       colors.paleLeaf,
    'on-primary':       colors.darkForest,
    'on-secondary':     colors.darkForest,
    'on-background':    colors.paleLeaf,
    success:            colors.lushGreen,
    warning:            colors.warmAmber,
    error:              colors.rosyRed,
    info:               colors.lilac,
  },
}

// ─── Bootstrap (async — waits for settings to load from IndexedDB) ─────────────

;(async () => {
  if (navigator.storage?.persist) {
    navigator.storage.persist()
  }

  const pinia = createPinia()

  // Load settings before creating Vuetify so the theme is correct right away
  const { useSettingsStore } = await import('./stores/settings')
  setActivePinia(pinia)
  const settingsStore = useSettingsStore()
  await settingsStore.load()

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = (settingsStore.themeOverride !== null && settingsStore.themeOverride !== undefined)
    ? settingsStore.isDark
    : systemDark
  if (isDark !== settingsStore.isDark) settingsStore.isDark = isDark
  const defaultTheme = isDark ? 'gardenDark' : 'gardenLight'
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')

  const vuetify = createVuetify({
    icons: {
      defaultSet: 'mdi',
      sets: { mdi: mdiSvg },
    },
    theme: {
      defaultTheme,
      themes: {
        gardenLight,
        gardenDark,
      },
    },
  })

  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(vuetify)
  app.mount('#app')

  const { db } = await import('./db')
  window.addEventListener('pagehide', () => db.close())
  window.addEventListener('pageshow', (e) => { if (e.persisted) db.open() })
})()
