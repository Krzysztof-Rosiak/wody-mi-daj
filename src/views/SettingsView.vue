<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlantsStore } from '@/stores/plants'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import { useRoomsStore } from '@/stores/rooms'
import ExportImport from '@/components/data/ExportImport.vue'
import SettingsRoomsCard from '@/components/settings/SettingsRoomsCard.vue'
import SettingsNotificationsCard from '@/components/settings/SettingsNotificationsCard.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconClock from '@/components/icons/IconClock.vue'
import IconMinus from '@/components/icons/IconMinus.vue'
import IconPlus from '@/components/icons/IconPlus.vue'

const plantsStore = usePlantsStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const roomsStore = useRoomsStore()

const plantCount = computed(() => plantsStore.plants.length)
const isIos = /ipad|iphone|ipod/i.test(navigator.userAgent)

onMounted(async () => {
  if (!plantsStore.plants.length) await plantsStore.fetchAll()
  await roomsStore.fetchAll()
})

function onThemeChange(e: Event) {
  themeStore.setDark((e.target as HTMLInputElement).checked)
}

function onCombineWateringChange(e: Event) {
  settingsStore.setCombineWateringFertilizing((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="settings-page">
    <div class="page-head">
      <div class="page-caption">Aplikacja</div>
      <h1 class="page-title">Ustawienia</h1>
    </div>

    <!-- Kolekcja -->
    <div class="sketch-card">
      <div class="collection-banner">
        <IconPlantBrand :size="36" class="collection-icon" />
        <div>
          <div class="collection-count">{{ plantCount }}</div>
          <div class="collection-label">
            {{ plantCount === 1 ? 'roślina' : plantCount < 5 ? 'rośliny' : 'roślin' }} w kolekcji
          </div>
        </div>
      </div>
    </div>

    <!-- Wygląd -->
    <div class="sketch-card">
      <div class="card-head">
        <IconSettings :size="15" />
        <span class="card-head__label">Wygląd</span>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Ciemny motyw</div>
          <div class="setting-hint">
            {{
              settingsStore.themeOverride === null || settingsStore.themeOverride === undefined
                ? `Automatyczny — ${themeStore.isDark ? 'ciemny' : 'jasny'} (jak system)`
                : themeStore.isDark
                  ? 'Włączony — motyw ciemny'
                  : 'Wyłączony — motyw jasny'
            }}
          </div>
        </div>
        <label class="bot-toggle">
          <input
            type="checkbox"
            :checked="themeStore.isDark"
            class="bot-toggle__input"
            @change="onThemeChange"
          />
          <span class="bot-toggle__track"><span class="bot-toggle__thumb"></span></span>
        </label>
      </div>
    </div>

    <SettingsRoomsCard />

    <!-- Pielęgnacja -->
    <div class="sketch-card">
      <div class="card-head">
        <IconClock :size="15" />
        <span class="card-head__label">Pielęgnacja</span>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Nawożenie zawsze z podlewaniem</div>
          <div class="setting-hint">
            Przy każdym nawożeniu automatycznie rejestrowane jest też podlewanie. Jeśli roślina była już dziś podlana, nawożenie zostanie przesunięte na kolejny termin podlewania.
          </div>
        </div>
        <label class="bot-toggle">
          <input
            type="checkbox"
            :checked="settingsStore.combineWateringFertilizing"
            class="bot-toggle__input"
            @change="onCombineWateringChange"
          />
          <span class="bot-toggle__track"><span class="bot-toggle__thumb"></span></span>
        </label>
      </div>
      <div class="setting-divider" />
      <div class="setting-row setting-row--col">
        <div class="setting-info">
          <div class="setting-name">Domyślne odroczenie zadania</div>
          <div class="setting-hint">Liczba dni przy szybkim odkładaniu</div>
        </div>
        <div class="stepper">
          <button
            class="stepper-btn"
            :disabled="settingsStore.snoozeDays <= 1"
            @click="settingsStore.setSnoozeDays(settingsStore.snoozeDays - 1)"
          >
            <IconMinus :size="14" />
          </button>
          <span class="stepper-val"
            >{{ settingsStore.snoozeDays }}
            {{ settingsStore.snoozeDays === 1 ? 'dzień' : 'dni' }}</span
          >
          <button
            class="stepper-btn"
            :disabled="settingsStore.snoozeDays >= 30"
            @click="settingsStore.setSnoozeDays(settingsStore.snoozeDays + 1)"
          >
            <IconPlus :size="14" />
          </button>
        </div>
      </div>
    </div>

    <SettingsNotificationsCard v-if="!isIos" />

    <ExportImport />
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  margin-bottom: 2px;
}
.page-title {
  font-family: 'Lato', sans-serif;
  font-size: 52px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.sketch-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px dashed var(--line);
  color: var(--ink-2);
}
.card-head__label {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
}

.collection-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
}
.collection-icon {
  color: var(--accent-deep);
}
.collection-count {
  font-family: 'Lato', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}
.collection-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin-top: 2px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}
.setting-row--col {
  flex-wrap: wrap;
  gap: 10px;
}
.setting-info {
  flex: 1;
  min-width: 0;
}
.setting-name {
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.2;
}
.setting-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  margin-top: 3px;
  line-height: 1.4;
}
.setting-divider {
  height: 1px;
  background: color-mix(in oklab, var(--line) 60%, transparent);
  margin: 0 16px;
  border-top: 1px dashed var(--line);
}

.bot-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.bot-toggle__input {
  display: none;
}
.bot-toggle__track {
  width: 42px;
  height: 24px;
  background: var(--paper-2);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  position: relative;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.bot-toggle__input:checked + .bot-toggle__track {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
}
.bot-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  border: 1.3px solid var(--line);
  transition: transform 0.2s;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.15);
}
.bot-toggle__input:checked + .bot-toggle__track .bot-toggle__thumb {
  transform: translateX(18px);
  border-color: transparent;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.stepper-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 9px 11px 10px 12px;
  cursor: pointer;
  color: var(--ink-2);
  transition: background 0.1s;
}
.stepper-btn:hover:not(:disabled) {
  background: var(--paper-2);
}
.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.stepper-val {
  font-family: 'Lato', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  min-width: 64px;
  text-align: center;
}

@media (max-width: 400px) {
  .page-title {
    font-size: 36px;
  }
  .collection-count {
    font-size: 32px;
  }
  .collection-banner {
    padding: 12px 14px;
    gap: 10px;
  }
}
</style>
