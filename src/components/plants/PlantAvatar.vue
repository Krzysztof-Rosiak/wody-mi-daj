<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  imageBase64?: string
  size?: number
}>()

const resolvedSize = computed(() => props.size ?? 40)
const letterSize = computed(() => Math.round(resolvedSize.value * 0.48))
</script>

<template>
  <div
    class="plant-avatar"
    :style="{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }"
  >
    <img v-if="imageBase64" :src="imageBase64" :alt="name" class="plant-avatar__img" loading="lazy" />
    <span
      v-else
      class="plant-avatar__letter"
      :style="{ fontSize: `${letterSize}px` }"
    >{{ name[0]?.toUpperCase() ?? '?' }}</span>
  </div>
</template>

<style scoped>
.plant-avatar {
  border: 2px solid var(--line);
  background: var(--accent-soft);
  border-radius: var(--r-blob);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.plant-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-avatar__letter {
  font-family: 'Caveat', cursive;
  font-weight: 700;
  color: var(--accent-deep);
  line-height: 1;
  user-select: none;
}
</style>
