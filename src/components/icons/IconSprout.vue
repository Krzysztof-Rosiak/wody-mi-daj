<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20V12M8 20v-4M16 20v-6M4 20h16M7 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
  </svg>
</template>
