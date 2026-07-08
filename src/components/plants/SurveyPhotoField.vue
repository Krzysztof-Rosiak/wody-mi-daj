<script setup lang="ts">
import { ref, watch } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { formatDatePl } from '@/utils/date'
import { SURVEY_CONDITION_LABELS, SURVEY_CONDITION_FG } from '@/types'
import type { PlantSurvey } from '@/types'
import IconCamera from '@/components/icons/IconCamera.vue'
import IconTrash from '@/components/icons/IconTrash.vue'

defineProps<{
  isEditMode: boolean
  lastSurvey?: PlantSurvey
}>()

const imageBase64 = defineModel<string | undefined>('imageBase64')
const compressingModel = defineModel<boolean>('compressing', { default: false })

const { imagePreview, fileInput, compressing, handleFileChange, handleFileDrop, removeImage, setImage } =
  useImageUpload(imageBase64.value)

const dragOver = ref(false)

watch(imagePreview, (v) => {
  imageBase64.value = v
})
watch(compressing, (v) => {
  compressingModel.value = v
})
// Sync external resets of the model (e.g. switching to a different survey) back into this field.
watch(
  () => imageBase64.value,
  (v) => {
    if (v !== imagePreview.value) setImage(v)
  },
)

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFileDrop(e)
}

function formatDate(d: Date): string {
  return formatDatePl(d, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <!-- Sekcja zdjęć: poprzednie + nowe obok siebie -->
  <div v-if="!isEditMode && lastSurvey?.imageBase64 && !imagePreview" class="photos-row">
    <div class="prev-photo">
      <img :src="lastSurvey.imageBase64" alt="Poprzednie zdjęcie" class="prev-photo__img" />
      <div class="prev-photo__caption">
        <span class="prev-photo__date">{{ formatDate(new Date(lastSurvey.date)) }}</span>
        <span class="prev-photo__cond" :style="`color: ${SURVEY_CONDITION_FG[lastSurvey.condition]}`">{{
          SURVEY_CONDITION_LABELS[lastSurvey.condition]
        }}</span>
      </div>
    </div>

    <div
      class="new-photo-btn"
      :class="{ 'new-photo-btn--over': dragOver }"
      @click="fileInput?.click()"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <IconCamera :size="22" />
      <span class="new-photo-btn__label">Dodaj<br />zdjęcie</span>
    </div>
  </div>

  <!-- Zdjęcie (normalny widok — brak poprzedniego lub już dodano nowe) -->
  <div
    v-else
    class="photo-area"
    :class="{ 'photo-area--over': dragOver }"
    @click="!imagePreview && fileInput?.click()"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <div v-if="imagePreview" class="photo-area__preview">
      <img :src="imagePreview" alt="Zdjęcie ankiety" class="photo-area__img" />
      <div class="photo-area__overlay">
        <button class="photo-btn" :class="{ loading: compressing }" @click.stop="fileInput?.click()">
          <IconCamera :size="14" />
        </button>
        <button class="photo-btn photo-btn--del" @click.stop="removeImage">
          <IconTrash :size="14" />
        </button>
      </div>
    </div>
    <div v-else class="photo-area__placeholder">
      <IconCamera :size="28" />
      <span class="photo-area__label">Dodaj zdjęcie</span>
      <span class="photo-area__sublabel">lub przeciągnij tutaj</span>
    </div>
  </div>
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    capture="environment"
    class="d-none"
    @change="handleFileChange"
  />
</template>

<style scoped>
/* Side-by-side photos row */
.photos-row {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px dashed var(--line);
  height: 180px;
}

.prev-photo {
  flex: 7;
  position: relative;
  overflow: hidden;
}

.prev-photo__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.prev-photo__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px 10px 8px;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.6));
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prev-photo__date {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.prev-photo__cond {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.new-photo-btn {
  flex: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  background: var(--paper);
  border-left: 1px dashed var(--line);
  color: var(--ink-3);
  transition:
    background 0.15s,
    color 0.15s;
}
.new-photo-btn:hover,
.new-photo-btn--over {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.new-photo-btn__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: center;
  line-height: 1.4;
}

/* Photo */
.photo-area {
  flex-shrink: 0;
  cursor: pointer;
  background: var(--paper);
  border-bottom: 2px dashed var(--line);
  overflow: hidden;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.photo-area:hover,
.photo-area--over {
  border-color: var(--accent-deep);
  background: var(--accent-soft);
}

.photo-area__preview {
  position: relative;
  aspect-ratio: 16/7;
}
.photo-area__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-area__overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.photo-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1.3px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}
.photo-btn--del {
  color: #ff8a8a;
  border-color: rgba(255, 100, 100, 0.4);
}

.photo-area__placeholder {
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--ink-3);
  transition: color 0.15s;
}
.photo-area:hover .photo-area__placeholder,
.photo-area--over .photo-area__placeholder {
  color: var(--accent-deep);
}
.photo-area__label {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
}
.photo-area__sublabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}
</style>
