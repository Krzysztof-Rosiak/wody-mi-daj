<script setup lang="ts">
type Platform = 'ios' | 'android' | 'desktop'
type Browser = 'chrome' | 'firefox' | 'edge' | 'safari' | 'samsung' | 'opera' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/ipad|iphone|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function detectBrowser(): Browser {
  const ua = navigator.userAgent
  if (/SamsungBrowser/i.test(ua)) return 'samsung'
  if (/OPR|Opera/i.test(ua)) return 'opera'
  if (/Edg\//i.test(ua)) return 'edge'
  if (/Firefox/i.test(ua)) return 'firefox'
  if (/Chrome/i.test(ua)) return 'chrome'
  if (/Safari/i.test(ua)) return 'safari'
  return 'other'
}

const detectedPlatform = detectPlatform()
const detectedBrowser = detectBrowser()

interface Step {
  text: string
}
interface BrowserSection {
  id: Browser
  label: string
  steps: Step[]
}

const androidBrowsers: BrowserSection[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    steps: [
      { text: 'Dotknij ikony menu (trzy kropki) w prawym górnym rogu.' },
      { text: 'Wybierz „Dodaj do ekranu głównego" lub „Zainstaluj aplikację".' },
      { text: 'Potwierdź dotykając „Dodaj" lub „Zainstaluj".' },
    ],
  },
  {
    id: 'edge',
    label: 'Edge',
    steps: [
      { text: 'Dotknij ikony menu (trzy kropki) w dolnym pasku.' },
      { text: 'Wybierz „Dodaj do telefonu".' },
      { text: 'Potwierdź dotykając „Dodaj".' },
    ],
  },
  {
    id: 'firefox',
    label: 'Firefox',
    steps: [
      { text: 'Dotknij ikony menu (trzy kropki) w prawym górnym rogu.' },
      { text: 'Wybierz „Zainstaluj".' },
      { text: 'Potwierdź dotykając „Dodaj".' },
    ],
  },
  {
    id: 'samsung',
    label: 'Samsung Browser',
    steps: [
      { text: 'Dotknij ikony menu (trzy poziome linie) w prawym dolnym rogu.' },
      { text: 'Wybierz „Dodaj stronę do" → „Ekran główny".' },
      { text: 'Potwierdź nazwę i dotknij „Dodaj".' },
    ],
  },
  {
    id: 'opera',
    label: 'Opera',
    steps: [
      { text: 'Dotknij ikony „O" (menu) w prawym dolnym rogu.' },
      { text: 'Wybierz „Ekran główny".' },
      { text: 'Potwierdź dotykając „Dodaj".' },
    ],
  },
]

const iosBrowsers: BrowserSection[] = [
  {
    id: 'safari',
    label: 'Safari',
    steps: [
      { text: 'Dotknij ikony Udostępnij (kwadrat ze strzałką w górę) na dole ekranu.' },
      { text: 'Przewiń listę i wybierz „Dodaj do ekranu głównego".' },
      { text: 'Potwierdź nazwę i dotknij „Dodaj" w prawym górnym rogu.' },
    ],
  },
  {
    id: 'chrome',
    label: 'Chrome / Firefox / inne',
    steps: [
      { text: 'Na iPhone i iPad instalacja jako aplikacja działa wyłącznie przez Safari.' },
      { text: 'Skopiuj adres strony z paska adresu.' },
      { text: 'Otwórz Safari, wklej adres i załaduj stronę.' },
      { text: 'Następnie postępuj zgodnie z instrukcją dla Safari powyżej.' },
    ],
  },
]

const desktopBrowsers: BrowserSection[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    steps: [
      { text: 'Kliknij ikonę instalacji (ekran z strzałką w dół) w prawej części paska adresu.' },
      { text: 'Lub: menu (trzy kropki) → „Zapisz i udostępnij" → „Zainstaluj WodyMiDaj…".' },
      { text: 'Kliknij „Zainstaluj" w okienku potwierdzenia.' },
    ],
  },
  {
    id: 'edge',
    label: 'Edge',
    steps: [
      { text: 'Kliknij ikonę instalacji (ekran z plusem) w prawej części paska adresu.' },
      { text: 'Lub: menu (trzy kropki) → „Aplikacje" → „Zainstaluj tę witrynę jako aplikację".' },
      { text: 'Kliknij „Zainstaluj" w okienku potwierdzenia.' },
    ],
  },
  {
    id: 'safari',
    label: 'Safari (macOS)',
    steps: [
      { text: 'W pasku menu kliknij „Plik".' },
      { text: 'Wybierz „Dodaj do Docka…".' },
      { text: 'Potwierdź klikając „Dodaj".' },
    ],
  },
  {
    id: 'firefox',
    label: 'Firefox',
    steps: [
      { text: 'Firefox na komputerze nie obsługuje instalacji aplikacji PWA.' },
      { text: 'Użyj Chrome lub Edge, aby zainstalować WodyMiDaj na pulpicie.' },
    ],
  },
]

const browsersByPlatform: Record<Platform, BrowserSection[]> = {
  android: androidBrowsers,
  ios: iosBrowsers,
  desktop: desktopBrowsers,
}

function getVisibleBrowsers(): BrowserSection[] {
  const sections = browsersByPlatform[detectedPlatform]
  if (detectedPlatform === 'ios') {
    return detectedBrowser === 'safari'
      ? sections.filter((s) => s.id === 'safari')
      : sections.filter((s) => s.id === 'chrome')
  }
  const match = sections.find((s) => s.id === detectedBrowser)
  return match ? [match] : sections
}

const visibleBrowsers = getVisibleBrowsers()
</script>

<template>
  <div class="install-card">
    <div class="install-card__head">
      <div class="install-card__title">Zainstaluj aplikację</div>
      <div class="install-card__sub">
        Dodaj do ekranu głównego i używaj jak natywnej aplikacji — offline, bez przeglądarki.
      </div>
    </div>
    <div class="install-card__body">
      <div class="install-browsers">
        <div v-for="section in visibleBrowsers" :key="section.id" class="install-browser">
          <div class="install-browser__label">
            {{ section.label }}
          </div>
          <div class="install-steps">
            <div v-for="(step, i) in section.steps" :key="i" class="install-step">
              <span class="install-step__num">{{ i + 1 }}.</span>
              <span class="install-step__text">{{ step.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.install-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.install-card__head {
  padding: 12px 16px 10px;
  border-bottom: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.install-card__title {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.install-card__sub {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.4;
}

.install-card__body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Platform tabs */
.install-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.install-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-3);
  background: transparent;
  border: 1.3px solid color-mix(in oklab, var(--ink-3) 50%, transparent);
  border-radius: 10px 13px 11px 12px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s,
    border-color 0.1s;
}
.install-tab:hover {
  background: var(--paper-2);
  color: var(--ink-2);
}
.install-tab--active {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--ink-3);
  font-weight: 700;
}
.install-tab__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-deep);
  flex-shrink: 0;
}

/* Browser sections */
.install-browsers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.install-browser {
  border: 1.3px solid var(--line);
  border-radius: 11px 14px 12px 13px;
  overflow: hidden;
}

.install-browser__label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--paper-2);
  border-bottom: 1px dashed var(--line);
}

.install-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
}

.install-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.install-step__num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-deep);
  min-width: 18px;
  flex-shrink: 0;
  padding-top: 2px;
}

.install-step__text {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink);
  line-height: 1.45;
}
</style>
