<script setup lang="ts">
import type { Plant } from '@/types'
import IconArrowBack from '@/components/icons/IconArrowBack.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconImage from '@/components/icons/IconImage.vue'

defineProps<{
  plant: Plant
  plantAge: string | null
  allPhotos: { src: string; isMain: boolean }[]
}>()

const emit = defineEmits<{
  back: []
  edit: []
  archive: []
  openPhoto: []
}>()
</script>

<template>
  <div class="detail-head">
    <button class="back-btn" @click="emit('back')">
      <IconArrowBack :size="16" />
    </button>
    <div class="detail-head__info">
      <h1 class="detail-name">{{ plant.name }}</h1>
      <div v-if="plant.species" class="detail-species">{{ plant.species }}</div>
    </div>
    <div class="detail-head__actions">
      <button class="icon-btn" :title="`Edytuj ${plant.name}`" @click="emit('edit')">
        <IconEdit :size="15" />
      </button>
      <button class="icon-btn icon-btn--warn" title="Archiwizuj" @click="emit('archive')">
        <IconArchive :size="15" />
      </button>
    </div>
  </div>

  <div class="plant-tags">
    <div class="room-tag">{{ plant.room }}</div>
<div v-if="plantAge" class="age-tag">{{ plantAge }}</div>
  </div>

  <div v-if="allPhotos.length" class="main-photo" @click="emit('openPhoto')">
    <img
      :src="plant.imageBase64 ?? allPhotos[0].src"
      :alt="plant.name"
      class="main-photo__img"
      loading="lazy"
    />
    <div v-if="allPhotos.length > 1" class="main-photo__count">
      <IconImage :size="12" />
      {{ allPhotos.length }}
    </div>
  </div>

  <div v-if="plant.notes" class="notes-card">{{ plant.notes }}</div>
</template>

<style scoped>
.detail-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  cursor: pointer;
  color: var(--ink-2);
  flex-shrink: 0;
  margin-top: 4px;
}
.back-btn:hover { background: var(--paper-2); }

.detail-head__info {
  flex: 1;
  min-width: 0;
}

.detail-name {
  font-family: 'Lato', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.05;
}

.detail-species {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin-top: 2px;
}

.detail-head__actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-shrink: 0;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 9px 12px 10px 13px;
  cursor: pointer;
  color: var(--ink-2);
}
.icon-btn:hover { background: var(--paper-2); }
.icon-btn--warn { color: var(--warn); border-color: var(--warn); }
.icon-btn--warn:hover { background: var(--warn-soft); }

.plant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.room-tag {
  display: inline-block;
  padding: 3px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  border: 1.3px solid var(--ink-3);
  border-radius: 8px 10px 9px 11px;
}

.age-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-deep);
  border: 1.3px solid var(--accent-deep);
  border-radius: 8px 10px 9px 11px;
}

.main-photo {
  position: relative;
  border-radius: var(--r-card);
  overflow: hidden;
  border: 1.8px solid var(--line);
  cursor: pointer;
  aspect-ratio: 16 / 9;
}
.main-photo__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.main-photo__count {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notes-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 14px 16px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.5;
}

@media (max-width: 400px) {
  .detail-name { font-size: 28px; }
}
</style>
