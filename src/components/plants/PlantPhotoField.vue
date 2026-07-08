<script setup lang="ts">
import { watch } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import IconCamera from '@/components/icons/IconCamera.vue'
import IconClose from '@/components/icons/IconClose.vue'

const imageBase64 = defineModel<string | undefined>('imageBase64')

const { imagePreview, fileInput, handleFileChange, removeImage, setImage } = useImageUpload(
  imageBase64.value,
)

watch(imagePreview, (v) => {
  imageBase64.value = v
})

// Sync external resets of the model (e.g. switching to a different plant) back into this field.
watch(
  () => imageBase64.value,
  (v) => {
    if (v !== imagePreview.value) setImage(v)
  },
)
</script>

<template>
  <div class="photo-section">
    <div v-if="imagePreview" class="photo-preview">
      <img :src="imagePreview" alt="Zdjęcie rośliny" class="photo-preview__img" />
      <button class="photo-remove" @click="removeImage">
        <IconClose :size="13" />
      </button>
    </div>
    <button v-else class="photo-placeholder" @click="fileInput?.click()">
      <IconCamera :size="24" />
      <span>Dodaj zdjęcie</span>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="d-none"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.photo-section {
  margin-bottom: 16px;
}

.photo-preview {
  position: relative;
  border-radius: var(--r-card);
  overflow: hidden;
  border: 1.5px solid var(--line);
  aspect-ratio: 16/9;
  margin-bottom: 8px;
}
.photo-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1.3px solid var(--warn);
  border-radius: 7px;
  cursor: pointer;
  color: var(--warn);
}

.photo-placeholder {
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--accent-soft);
  border: 1.5px dashed var(--accent-deep);
  border-radius: var(--r-card);
  cursor: pointer;
  color: var(--accent-deep);
  opacity: 0.6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: opacity 0.1s;
}
.photo-placeholder:hover {
  opacity: 0.9;
}
</style>
