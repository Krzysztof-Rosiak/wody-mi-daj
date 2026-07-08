<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  status: 'ok' | 'soon' | 'overdue' | 'snoozed'
  size?: number
}>()

const R = 8
const CIRCUMFERENCE = 2 * Math.PI * R
const sz = computed(() => props.size ?? 20)
const offset = computed(() => CIRCUMFERENCE * (1 - Math.min(Math.max(props.progress, 0), 1)))

const STROKE_COLORS: Record<string, string> = {
  ok:      'var(--accent-deep)',
  soon:    '#c47d00',
  overdue: 'var(--warn)',
  snoozed: 'var(--ink-3)',
}
const fillColor = computed(() => STROKE_COLORS[props.status] ?? STROKE_COLORS.ok)
</script>

<template>
  <svg
    :width="sz"
    :height="sz"
    viewBox="0 0 20 20"
    style="display:inline-block;flex-shrink:0;transform:rotate(-90deg);vertical-align:middle"
  >
    <circle
      cx="10" cy="10" :r="R"
      fill="none"
      style="stroke: color-mix(in oklab, currentColor 20%, transparent); stroke-width: 2.5"
    />
    <circle
      cx="10" cy="10" :r="R"
      fill="none"
      :style="{
        stroke: fillColor,
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        strokeDasharray: CIRCUMFERENCE,
        strokeDashoffset: offset,
      }"
    />
  </svg>
</template>
