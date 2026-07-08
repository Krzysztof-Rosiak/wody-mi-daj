<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 21h8M12 21v-7M7 10c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
    <path d="M5 10h14l-1.5 4h-11L5 10z"/>
  </svg>
</template>
