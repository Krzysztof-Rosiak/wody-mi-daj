<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2C6.5 8 4 13 4 16a8 8 0 0016 0c0-3-2.5-8-8-14z"/>
  </svg>
</template>
