<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16h.01M12 8v4"/>
  </svg>
</template>
