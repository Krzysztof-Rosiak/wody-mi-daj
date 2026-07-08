<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants'
import PlantAvatar from '@/components/plants/PlantAvatar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import IconArrowBack from '@/components/icons/IconArrowBack.vue'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconRestore from '@/components/icons/IconRestore.vue'
import IconTrash from '@/components/icons/IconTrash.vue'
import IconWarning from '@/components/icons/IconWarning.vue'

const plantsStore = usePlantsStore()
const router = useRouter()

const confirmDeleteId = ref<number | null>(null)

onMounted(async () => {
  await plantsStore.fetchArchived()
})

async function restore(id: number) {
  await plantsStore.unarchive(id)
}

async function confirmDelete() {
  if (confirmDeleteId.value !== null) {
    await plantsStore.remove(confirmDeleteId.value)
    confirmDeleteId.value = null
  }
}
</script>

<template>
  <div class="archive-page">
    <div class="page-head">
      <button class="back-btn" @click="router.back()">
        <IconArrowBack :size="16" />
      </button>
      <div>
        <div class="page-caption">Rośliny</div>
        <h1 class="page-title">Archiwum</h1>
      </div>
    </div>

    <EmptyState
      v-if="plantsStore.archivedPlants.length === 0"
      title="Archiwum jest puste"
      sub="Zarchiwizowane rośliny pojawią się tutaj"
    >
      <IconArchive :size="48" class="empty-icon" />
    </EmptyState>

    <div v-else class="sketch-card">
      <div v-for="plant in plantsStore.archivedPlants" :key="plant.id" class="archive-row">
        <PlantAvatar :name="plant.name" :image-base64="plant.imageBase64" />
        <div class="plant-info">
          <div class="plant-name">{{ plant.name }}</div>
          <div class="plant-meta">
            <span v-if="plant.species">{{ plant.species }} · </span>{{ plant.room }}
          </div>
        </div>
        <div class="archive-actions">
          <button class="arch-btn arch-btn--restore" title="Przywróć" @click="restore(plant.id as number)">
            <IconRestore :size="15" />
            Przywróć
          </button>
          <button class="arch-btn arch-btn--delete" title="Usuń na zawsze" @click="confirmDeleteId = plant.id as number">
            <IconTrash :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :model-value="confirmDeleteId !== null"
    title="Usuń na zawsze?"
    confirm-label="Usuń"
    :max-width="340"
    @update:model-value="confirmDeleteId = null"
    @confirm="confirmDelete"
  >
    <template #icon>
      <IconWarning :size="16" stroke="var(--warn)" />
    </template>
    Ta operacja jest nieodwracalna. Roślina oraz cała historia pielęgnacji zostaną trwale usunięte.
  </ConfirmDialog>
</template>

<style scoped>
.archive-page { display: flex; flex-direction: column; gap: 20px; }

.page-head {
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

.page-caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
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

.archive-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 40%, transparent);
}
.archive-row:last-child { border-bottom: 0; }

.plant-info { min-width: 0; }
.plant-name {
  font-family: 'Kalam', sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.plant-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-3);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archive-actions { display: flex; align-items: center; gap: 6px; }

.arch-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  border-radius: 8px 11px 9px 12px;
  border: 1.3px solid var(--line);
  background: var(--paper);
  cursor: pointer;
  color: var(--ink-2);
  transition: transform 0.1s;
}
.arch-btn:hover { transform: translateY(-1px); }
.arch-btn--restore { color: var(--accent-deep); border-color: var(--accent-deep); background: var(--accent-soft); }
.arch-btn--delete { color: var(--warn); border-color: var(--warn); background: var(--warn-soft); padding: 5px 8px; }
.empty-icon { color: var(--ink-3); opacity: 0.4; }

@media (max-width: 400px) { .page-title { font-size: 36px; } }
</style>
