<script setup lang="ts">
import type { CareType } from '@/types'
import { CARE_TYPE_BG, CARE_TYPE_FG } from '@/types'
import IconWater from '@/components/icons/IconWater.vue'
import IconMisting from '@/components/icons/IconMisting.vue'
import IconFertilizing from '@/components/icons/IconFertilizing.vue'
import IconPruning from '@/components/icons/IconPruning.vue'
import IconRepotting from '@/components/icons/IconRepotting.vue'
import IconCleaning from '@/components/icons/IconCleaning.vue'
import IconClipboard from '@/components/icons/IconClipboard.vue'
import IconCheck from '@/components/icons/IconCheck.vue'

defineProps<{
  visible: boolean
  type: CareType
  text: string
}>()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="care-toast"
      :style="{
        background: CARE_TYPE_BG[type],
        borderColor: CARE_TYPE_FG[type],
        color: CARE_TYPE_FG[type],
      }"
    >
      <IconWater v-if="type === 'watering'" :size="18" />
      <IconMisting v-else-if="type === 'misting'" :size="18" />
      <IconFertilizing v-else-if="type === 'fertilizing'" :size="18" />
      <IconPruning v-else-if="type === 'pruning'" :size="18" />
      <IconRepotting v-else-if="type === 'repotting'" :size="18" />
      <IconCleaning v-else-if="type === 'cleaning'" :size="18" />
      <IconClipboard v-else :size="18" />
      <span class="care-toast__text">{{ text }}</span>
      <IconCheck :size="15" />
    </div>
  </Transition>
</template>

<style scoped>
.care-toast {
  position: fixed;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border: 1.8px solid;
  border-radius: 14px 18px 15px 17px;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 3px 3px 0 color-mix(in oklab, currentColor 20%, transparent);
  z-index: 9999;
  white-space: nowrap;
  pointer-events: none;
}

.care-toast__text { line-height: 1; }

.toast-enter-active { transition: opacity 0.15s, transform 0.15s; }
.toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from  { opacity: 0; transform: translateX(-50%) translateY(12px); }
.toast-leave-to    { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
