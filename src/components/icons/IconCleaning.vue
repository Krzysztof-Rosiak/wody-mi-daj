<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 3h6M12 3v4M5 8h14l-1 10a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
</template>
