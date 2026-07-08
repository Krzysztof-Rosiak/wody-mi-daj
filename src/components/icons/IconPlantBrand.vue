<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 32" :height="size ?? 32" viewBox="0 0 32 32" fill="none">
    <path d="M16 28 C 16 20, 8 16, 8 10 C 14 10, 16 14, 16 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 28 C 16 22, 22 18, 24 12 C 20 13, 17 16, 16 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 28 L 18 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>
