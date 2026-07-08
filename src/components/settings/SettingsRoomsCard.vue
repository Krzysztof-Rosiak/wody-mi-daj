<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoomsStore, DEFAULT_ROOMS } from '@/stores/rooms'
import draggable from 'vuedraggable'
import IconHouse from '@/components/icons/IconHouse.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconTrash from '@/components/icons/IconTrash.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconRestore from '@/components/icons/IconRestore.vue'
import IconDragHandle from '@/components/icons/IconDragHandle.vue'
import IconPlus from '@/components/icons/IconPlus.vue'

const roomsStore = useRoomsStore()

const newRoomName = ref('')
const editingRoom = ref<{ id: number; name: string; originalName: string } | null>(null)

const draggableRooms = computed({
  get: () => roomsStore.allRooms,
  set: (ordered: string[]) => roomsStore.reorder(ordered),
})

function isDefault(name: string): boolean {
  return (DEFAULT_ROOMS as readonly string[]).includes(name)
}

async function addRoom() {
  if (!newRoomName.value.trim()) return
  await roomsStore.add(newRoomName.value)
  newRoomName.value = ''
}

async function saveEdit() {
  if (!editingRoom.value || !editingRoom.value.name.trim()) return
  await roomsStore.rename(editingRoom.value.id, editingRoom.value.name)
  editingRoom.value = null
}

function startEditRoom(room: string) {
  const r = roomsStore.customRooms.find((r) => r.name === room)
  if (r?.id !== undefined) editingRoom.value = { id: r.id, name: room, originalName: room }
}

function startRemoveRoom(room: string) {
  const r = roomsStore.customRooms.find((r) => r.name === room)
  if (r?.id !== undefined) roomsStore.remove(r.id)
}
</script>

<template>
  <div class="sketch-card">
    <div class="card-head">
      <IconHouse :size="15" />
      <span class="card-head__label">Pokoje</span>
    </div>

    <draggable v-model="draggableRooms" item-key="name" handle=".drag-handle">
      <template #item="{ element: room }">
        <div class="room-row">
          <input
            v-if="!isDefault(room) && editingRoom?.originalName === room"
            v-model="editingRoom!.name"
            class="room-edit-input"
            autofocus
            @keyup.enter="saveEdit"
            @keyup.esc="editingRoom = null"
          />
          <span v-else class="room-name">{{ room }}</span>

          <div class="room-actions">
            <template v-if="!isDefault(room) && editingRoom?.originalName === room">
              <button class="room-btn room-btn--ok" @click="saveEdit">
                <IconCheck :size="13" />
              </button>
              <button class="room-btn" @click="editingRoom = null">
                <IconClose :size="13" />
              </button>
            </template>
            <template v-else-if="isDefault(room)">
              <button class="room-btn room-btn--del" @click="roomsStore.hideDefault(room)">
                <IconTrash :size="13" />
              </button>
            </template>
            <template v-else>
              <button class="room-btn" @click="startEditRoom(room)">
                <IconEdit :size="13" />
              </button>
              <button class="room-btn room-btn--del" @click="startRemoveRoom(room)">
                <IconTrash :size="13" />
              </button>
            </template>
          </div>
          <span class="drag-handle"><IconDragHandle :size="14" /></span>
        </div>
      </template>
    </draggable>

    <template v-if="roomsStore.hiddenDefaults.size > 0">
      <div class="section-divider">Ukryte</div>
      <div
        v-for="room in DEFAULT_ROOMS.filter((r) => roomsStore.hiddenDefaults.has(r))"
        :key="room"
        class="room-row room-row--hidden"
      >
        <span class="room-name">{{ room }}</span>
        <button class="room-btn room-btn--restore" @click="roomsStore.restoreDefault(room)">
          <IconRestore :size="13" />
        </button>
      </div>
    </template>

    <div class="add-room-row">
      <input
        v-model="newRoomName"
        type="text"
        class="bot-input"
        placeholder="Nowy pokój…"
        @keyup.enter="addRoom"
      />
      <button class="add-room-btn" :disabled="!newRoomName.trim()" @click="addRoom">
        <IconPlus :size="15" />
      </button>
    </div>
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

.room-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px dashed color-mix(in oklab, var(--ink-3) 30%, transparent);
}
.room-row:last-of-type { border-bottom: 0; }
.room-row--hidden { opacity: 0.5; }

.drag-handle {
  color: var(--ink-3);
  cursor: grab;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.drag-handle:active { cursor: grabbing; }

.room-name {
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink);
  flex: 1;
}

.room-edit-input {
  flex: 1;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--accent-deep);
  border-radius: 8px 10px 9px 11px;
  padding: 4px 8px;
  outline: none;
}

.room-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.room-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.3px solid var(--line);
  border-radius: 7px 9px 8px 10px;
  cursor: pointer;
  color: var(--ink-3);
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.room-btn:hover { background: var(--paper-2); color: var(--ink-2); }
.room-btn--ok  { color: var(--accent-deep); border-color: var(--accent-deep); }
.room-btn--ok:hover { background: var(--accent-soft); }
.room-btn--del { color: var(--warn); border-color: var(--warn); }
.room-btn--del:hover { background: var(--warn-soft); }
.room-btn--restore { color: var(--accent-deep); border-color: var(--accent-deep); }
.room-btn--restore:hover { background: var(--accent-soft); }

.section-divider {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  padding: 6px 14px 4px;
  border-top: 1px dashed var(--line);
}

.add-room-row {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px dashed var(--line);
}

.bot-input {
  flex: 1;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 10px 13px 11px 14px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.15s;
}
.bot-input:focus { border-color: var(--accent-deep); }

.add-room-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-deep);
  border: 1.5px solid var(--accent-deep);
  border-radius: 10px 13px 11px 14px;
  cursor: pointer;
  color: var(--paper);
  flex-shrink: 0;
  transition: opacity 0.1s;
}
.add-room-btn:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
