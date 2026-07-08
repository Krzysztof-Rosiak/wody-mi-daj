<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.5 5.5l-2 2M7.5 16.5l-2 2M18.5 18.5l-2-2M7.5 7.5l-2-2"/>
  </svg>
</template>
