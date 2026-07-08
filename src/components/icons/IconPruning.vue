<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 3v12M6 15a3 3 0 100 6 3 3 0 000-6zM18 3v6M18 9a3 3 0 100 6 3 3 0 000-6zM6 9l12-6"/>
  </svg>
</template>
