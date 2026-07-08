<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
</template>
