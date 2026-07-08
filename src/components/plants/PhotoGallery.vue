<script setup lang="ts">
import { ref, watch } from 'vue'
import { compressImage } from '@/composables/useImageUpload'
import IconTrash from '@/components/icons/IconTrash.vue'
import IconCamera from '@/components/icons/IconCamera.vue'
import IconSetMain from '@/components/icons/IconSetMain.vue'

export interface GalleryPhoto {
  src: string
  label: string
  isMain: boolean
  sourceType: 'plant' | 'survey' | 'standalone'
  sourceId?: number
}

const props = defineProps<{
  modelValue: boolean
  photos: GalleryPhoto[]
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'set-main': [src: string]
  'delete-photo': [photo: GalleryPhoto]
  'add-photo': [imageBase64: string]
}>()

const index = ref(props.startIndex ?? 0)
const showDeleteConfirm = ref(false)

watch(
  () => props.startIndex,
  (v: number | undefined) => {
    if (v !== undefined) index.value = v
  },
)
watch(
  () => props.photos.length,
  (newLen, oldLen) => {
    if (newLen < oldLen && index.value >= newLen) index.value = Math.max(0, newLen - 1)
  },
)

function prev() {
  index.value = (index.value - 1 + props.photos.length) % props.photos.length
}
function next() {
  index.value = (index.value + 1) % props.photos.length
}

async function onFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const raw = e.target?.result as string
    emit('add-photo', await compressImage(raw))
  }
  reader.readAsDataURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

function requestDelete() {
  showDeleteConfirm.value = true
}

function confirmDelete() {
  emit('delete-photo', props.photos[index.value])
  showDeleteConfirm.value = false
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event as boolean)"
  >
    <v-card class="gallery-card" rounded="xl">
      <div class="gallery-toolbar">
        <span class="gallery-label">{{ photos[index]?.label }}</span>
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="photos[index] && !photos[index].isMain"
            icon
            size="small"
            variant="text"
            title="Ustaw jako główne"
            @click="emit('set-main', photos[index].src)"
          >
            <IconSetMain :size="16" />
          </v-btn>
          <v-btn icon size="small" variant="text" @click="requestDelete">
            <IconTrash :size="16" />
          </v-btn>
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="emit('update:modelValue', false)"
          />
        </div>
      </div>

      <div class="gallery-img-wrap">
        <v-img v-if="photos.length" :src="photos[index]?.src" height="100%" contain />
      </div>

      <div v-if="photos.length > 1" class="gallery-nav">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          size="small"
          :disabled="index === 0"
          @click="prev"
        />
        <span class="gallery-counter">{{ index + 1 }} / {{ photos.length }}</span>
        <v-btn
          icon="mdi-chevron-right"
          variant="tonal"
          size="small"
          :disabled="index === photos.length - 1"
          @click="next"
        />
      </div>

      <div class="gallery-thumbs">
        <div
          v-for="(photo, i) in photos"
          :key="i"
          class="gallery-thumb"
          :class="{ 'gallery-thumb--active': i === index }"
          @click="index = i"
        >
          <v-img :src="photo.src" cover width="56" height="56" rounded="lg" />
        </div>
        <label class="gallery-thumb gallery-thumb--add" title="Dodaj zdjęcie">
          <IconCamera :size="20" class="add-icon" />
          <input type="file" accept="image/*" class="hidden-input" @change="onFilePicked" />
        </label>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDeleteConfirm" max-width="360">
    <v-card rounded="xl" class="pa-4">
      <div class="confirm-title">Usuń zdjęcie</div>
      <div class="confirm-body">
        Czy chcesz usunąć to zdjęcie z galerii? Operacji nie można cofnąć.
      </div>
      <div class="d-flex justify-end ga-2 mt-4">
        <v-btn variant="text" @click="showDeleteConfirm = false">Anuluj</v-btn>
        <v-btn color="error" variant="tonal" @click="confirmDelete">Usuń</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gallery-card {
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
  overflow: hidden;
}
.gallery-img-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.gallery-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.gallery-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.gallery-nav {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
}
.gallery-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.gallery-thumbs {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
}
.gallery-thumb {
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.5;
  transition:
    opacity 0.15s,
    box-shadow 0.15s;
}
.gallery-thumb:hover,
.gallery-thumb--active {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--accent-deep);
}
.gallery-thumb--add {
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--ink-3);
  opacity: 0.6;
  cursor: pointer;
}
.gallery-thumb--add:hover {
  opacity: 1;
  border-color: var(--accent-deep);
}
.add-icon {
  color: var(--ink-3);
}
.hidden-input {
  display: none;
}
.confirm-title {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  margin-bottom: 8px;
}
.confirm-body {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
}
</style>
