<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { useNotifications } from '@/composables/useNotifications'
import IconBell from '@/components/icons/IconBell.vue'

const settingsStore = useSettingsStore()
const notifications = useNotifications()

async function toggleNotifications(e: Event) {
  const value = (e.target as HTMLInputElement).checked
  if (value && notifications.permissionStatus.value !== 'granted') {
    const granted = await notifications.requestPermission()
    if (!granted) return
  }
  await settingsStore.setNotificationsEnabled(value)
  notifications.schedule()
}
</script>

<template>
  <div class="sketch-card">
    <div class="card-head">
      <IconBell :size="15" />
      <span class="card-head__label">Powiadomienia</span>
    </div>

    <div v-if="notifications.permissionStatus.value === 'unsupported'" class="setting-row">
      <div class="setting-info">
        <div class="setting-name">Niedostępne</div>
        <div class="setting-hint">Twoja przeglądarka nie wspiera powiadomień push.</div>
      </div>
    </div>

    <template v-else>
      <div v-if="notifications.permissionStatus.value === 'denied'" class="setting-row">
        <div class="setting-info">
          <div class="setting-name setting-name--warn">Powiadomienia zablokowane</div>
          <div class="setting-hint">
            Odblokuj powiadomienia w ustawieniach przeglądarki dla tej strony.
          </div>
        </div>
      </div>

      <div v-else class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Codzienne przypomnienie</div>
          <div class="setting-hint">Powiadomienie o pielęgnacji roślin raz dziennie</div>
        </div>
        <label class="bot-toggle">
          <input
            type="checkbox"
            :checked="settingsStore.notificationsEnabled"
            class="bot-toggle__input"
            @change="toggleNotifications"
          />
          <span class="bot-toggle__track">
            <span class="bot-toggle__thumb"></span>
          </span>
        </label>
      </div>

    </template>
  </div>
</template>

<style scoped>
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

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}
.setting-info { flex: 1; min-width: 0; }
.setting-name {
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.2;
}
.setting-name--warn { color: var(--warn); }
.setting-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  margin-top: 3px;
  line-height: 1.4;
}

.bot-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.bot-toggle__input { display: none; }
.bot-toggle__track {
  width: 42px;
  height: 24px;
  background: var(--paper-2);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
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

</style>
