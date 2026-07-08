<script setup lang="ts">
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconArrowBack from '@/components/icons/IconArrowBack.vue'
</script>

<template>
  <div class="not-found">
    <div class="not-found__card">
      <div class="not-found__deco">
        <IconPlantBrand :size="56" class="not-found__plant" />
        <div class="not-found__code">404</div>
      </div>
      <h1 class="not-found__title">Strona nie istnieje</h1>
      <p class="not-found__sub">
        Ta ścieżka nie prowadzi do żadnego miejsca w aplikacji.<br />
        Może roślina wyrosła gdzie indziej?
      </p>
      <RouterLink to="/" class="not-found__btn">
        <IconArrowBack :size="15" />
        Wróć do strony głównej
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.not-found__card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 40px 32px 32px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.not-found__deco {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
}

.not-found__plant {
  color: var(--accent-deep);
  opacity: 0.18;
  position: absolute;
  inset: 0;
  margin: auto;
}

.not-found__code {
  font-family: 'Lato', sans-serif;
  font-size: 72px;
  font-weight: 700;
  color: var(--accent-deep);
  line-height: 1;
  position: relative;
  z-index: 1;
  letter-spacing: -2px;
}

.not-found__title {
  font-family: 'Lato', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}

.not-found__sub {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.6;
  max-width: 280px;
}

.not-found__btn {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--paper);
  background: var(--accent-deep);
  border: 1.8px solid var(--accent-deep);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  box-shadow: 2px 2px 0 color-mix(in oklab, var(--accent-deep) 50%, black);
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.1s;
}
.not-found__btn:hover {
  transform: translateY(-1px);
}
</style>
