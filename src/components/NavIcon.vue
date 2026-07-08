<script setup lang="ts">
import IconCheckCircle from '@/components/icons/IconCheckCircle.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import IconLeaf from '@/components/icons/IconLeaf.vue'
import IconBarChart from '@/components/icons/IconBarChart.vue'
import IconSettings from '@/components/icons/IconSettings.vue'

const props = defineProps<{ id: string; size?: number }>()
</script>

<template>
  <IconCheckCircle v-if="id === 'today'" :size="props.size ?? 18" />
  <IconCalendar v-else-if="id === 'month'" :size="props.size ?? 18" />
  <IconLeaf v-else-if="id === 'plants'" :size="props.size ?? 18" />
  <IconBarChart v-else-if="id === 'stats'" :size="props.size ?? 18" />
  <IconSettings v-else-if="id === 'settings'" :size="props.size ?? 18" />
</template>
