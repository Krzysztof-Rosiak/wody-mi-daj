<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v6M6.34 6.34l4.24 4.24M2 12h6M6.34 17.66l4.24-4.24M12 22v-6M17.66 17.66l-4.24-4.24M22 12h-6M17.66 6.34l-4.24 4.24"/>
  </svg>
</template>
