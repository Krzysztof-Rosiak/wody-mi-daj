<script setup lang="ts">
import { ref } from 'vue'
import { useDataBackup } from '@/composables/useDataBackup'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconWarning from '@/components/icons/IconWarning.vue'
import IconDownload from '@/components/icons/IconDownload.vue'
import IconUpload from '@/components/icons/IconUpload.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'

const {
  importError,
  importSuccess,
  pasteMode,
  pasteText,
  exportData,
  resetImportStatus,
  handlePasteImport,
  importFile,
  cancelPaste,
} = useDataBackup()

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

function triggerImport() {
  resetImportStatus()
  fileInput.value?.click()
}

async function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  await importFile(file)
  if (fileInput.value) fileInput.value.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) importFile(file)
}
</script>

<template>
  <div class="backup-card">
    <div class="backup-card__head">
      <div class="backup-card__title">Kopia zapasowa danych</div>
    </div>
    <div class="backup-card__body">
      <p class="backup-desc">
        Eksportuj dane do pliku JSON i zachowaj go w bezpiecznym miejscu. Przy zmianie telefonu
        zaimportuj ten plik aby przywrócić swoje rośliny.
      </p>

      <!-- Komunikat błędu -->
      <div v-if="importError" class="status-banner status-banner--error">
        <IconWarning :size="15" />
        {{ importError }}
        <button class="status-banner__close" @click="importError = null">✕</button>
      </div>

      <!-- Komunikat sukcesu -->
      <div v-if="importSuccess" class="status-banner status-banner--success">
        <IconCheck :size="15" />
        Import zakończony pomyślnie!
        <button class="status-banner__close" @click="importSuccess = false">✕</button>
      </div>

      <!-- Eksport -->
      <button class="action-btn action-btn--primary" @click="exportData">
        <IconDownload :size="15" />
        Eksportuj dane
      </button>

      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--over': dragOver }"
        role="button"
        tabindex="0"
        @click="triggerImport"
        @keydown.enter="triggerImport"
        @keydown.space.prevent="triggerImport"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
      >
        <IconUpload class="drop-zone__icon" :size="28" />
        <span class="drop-zone__main">Przeciągnij plik JSON tutaj</span>
        <span class="drop-zone__sub">lub kliknij aby wybrać plik</span>
      </div>

      <!-- Wklej JSON -->
      <button
        class="action-btn"
        :class="{ 'action-btn--active': pasteMode }"
        @click="pasteMode = !pasteMode"
      >
        <IconClipboard :size="15" />
        Wklej JSON
      </button>

      <!-- Paste area -->
      <div v-if="pasteMode" class="paste-area">
        <p class="paste-area__hint">
          Otwórz plik JSON w edytorze tekstu, zaznacz wszystko (Ctrl+A), skopiuj i wklej poniżej:
        </p>
        <textarea
          v-model="pasteText"
          class="paste-area__textarea"
          rows="6"
          placeholder='{"version":2,"plants":[...]}'
        />
        <div class="paste-actions">
          <button
            class="action-btn action-btn--primary"
            :disabled="!pasteText.trim()"
            @click="handlePasteImport"
          >
            Importuj
          </button>
          <button class="action-btn" @click="cancelPaste">
            Anuluj
          </button>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json,text/plain"
        class="file-input-hidden"
        @change="handleFileImport"
      />
    </div>
  </div>
</template>

<style scoped>
.backup-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.backup-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px dashed var(--line);
}

.backup-card__title {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
}

.backup-card__body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-desc {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.5;
  margin: 0;
}

/* Status banners */
.status-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px 13px 11px 14px;
  border: 1.5px solid;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  line-height: 1.4;
}
.status-banner--error {
  background: var(--warn-soft);
  border-color: var(--warn);
  color: var(--warn);
}
.status-banner--success {
  background: color-mix(in oklab, var(--accent-soft) 60%, white);
  border-color: var(--accent-deep);
  color: var(--accent-deep);
}
.status-banner svg { flex-shrink: 0; margin-top: 1px; }
.status-banner__close {
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 12px;
  opacity: 0.6;
  padding: 0 2px;
}
.status-banner__close:hover { opacity: 1; }

/* Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow: 2px 2px 0 var(--paper-2), 2px 2px 0 1.5px var(--line);
  cursor: pointer;
  transition: transform 0.1s;
  align-self: flex-start;
}
.action-btn:hover { transform: translateY(-1px); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.action-btn--primary {
  color: var(--paper);
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  box-shadow: 2px 2px 0 color-mix(in oklab, var(--accent-deep) 50%, black);
}
.action-btn--active {
  background: var(--accent-soft);
  border-color: var(--accent-deep);
  color: var(--accent-deep);
}

/* Drop zone */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 20px;
  border: 2px dashed var(--ink-3);
  border-radius: 14px 18px 15px 17px;
  background: var(--paper);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
  outline: none;
}
.drop-zone:hover,
.drop-zone:focus-visible {
  border-color: var(--accent-deep);
  background: var(--accent-soft);
}
.drop-zone--over {
  border-color: var(--accent-deep);
  background: var(--accent-soft);
  transform: scale(1.01);
}
.drop-zone__icon {
  color: var(--ink-3);
  transition: color 0.15s;
}
.drop-zone:hover .drop-zone__icon,
.drop-zone:focus-visible .drop-zone__icon,
.drop-zone--over .drop-zone__icon {
  color: var(--accent-deep);
}
.drop-zone__main {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  font-weight: 500;
}
.drop-zone__sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

/* Paste area */
.paste-area {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.paste-area__hint {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-2);
  margin: 0 0 8px;
  line-height: 1.4;
}
.paste-area__textarea {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
}
.paste-area__textarea:focus {
  border-color: var(--accent-deep);
}
.paste-area__textarea::placeholder {
  color: var(--ink-3);
}
.paste-actions { display: flex; gap: 8px; margin-top: 8px; }
.file-input-hidden { display: none; }
</style>
