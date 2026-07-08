<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useNotifications } from '@/composables/useNotifications'
import NavIcon from '@/components/NavIcon.vue'
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'

const themeStore = useThemeStore()
const notifications = useNotifications()

onMounted(() => {
  themeStore.init()
  notifications.schedule()
})

const navItems = [
  { label: 'Dziś',       to: '/',           iconId: 'today',    exact: true },
  { label: 'Rośliny',    to: '/rosliny',    iconId: 'plants',   exact: false },
  { label: 'Ustawienia', to: '/ustawienia', iconId: 'settings', exact: true },
]
</script>

<template>
  <v-app class="botanical-app">
    <!-- Desktop sidebar -->
    <v-navigation-drawer
      v-if="$vuetify.display.mdAndUp"
      permanent
      :width="220"
      class="botanical-sidebar"
    >
      <div class="brand">
        <IconPlantBrand :size="28" class="brand-icon" />
        WodyMiDaj
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :active-class="item.exact ? '' : 'active'"
          exact-active-class="active"
        >
          <NavIcon :id="item.iconId" class="nav-ico" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </v-navigation-drawer>

<v-main class="botanical-main">
      <div class="content-wrap">
        <RouterView />
      </div>
    </v-main>

    <!-- Mobile: bottom navigation -->
    <v-bottom-navigation v-if="$vuetify.display.smAndDown" grow class="botanical-bottom-nav">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :exact="item.exact"
      >
        <NavIcon :id="item.iconId" :size="24" class="bottom-nav-icon" />
        <span class="bottom-nav-label">{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style>
/* ── Global botanical body ─────────────────────────────────────────────────── */
.botanical-app,
.botanical-app .v-application__wrap {
  background: var(--paper) !important;
  font-family: 'Lato', sans-serif !important;
}

.v-main__scroller {
  background: transparent !important;
}

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
.botanical-sidebar.v-navigation-drawer {
  background: color-mix(in oklab, var(--paper) 92%, var(--accent-soft)) !important;
  border-right: 1.5px dashed var(--ink-3) !important;
  box-shadow: none !important;
}

.botanical-sidebar .v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 8px;
  font-family: 'Caveat', cursive;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  user-select: none;
}

.brand-icon {
  color: var(--accent-deep);
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink-2);
  border: 1.5px solid transparent;
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  cursor: pointer;
  background: transparent;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}

.nav-item .nav-ico {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-deep);
  flex-shrink: 0;
}

.nav-item:hover {
  background: var(--paper);
  color: var(--ink);
}

.nav-item.active {
  background: var(--paper);
  border-color: var(--line);
  color: var(--ink);
  font-weight: 700;
  box-shadow: var(--shadow-nav-active);
}


/* ── Mobile bottom nav ─────────────────────────────────────────────────────── */
.botanical-bottom-nav.v-bottom-navigation {
  background: color-mix(in oklab, var(--paper) 92%, var(--accent-soft)) !important;
  border-top: 1.5px dashed var(--ink-3) !important;
  box-shadow: none !important;
  height: 72px !important;
}

.botanical-bottom-nav .v-btn {
  font-family: 'Lato', sans-serif !important;
  color: var(--ink-2) !important;
  min-width: 0 !important;
  padding: 0 4px !important;
  height: 100% !important;
  flex: 1 !important;
}

.botanical-bottom-nav .v-btn .v-btn__content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.botanical-bottom-nav .v-btn--active {
  color: var(--accent-deep) !important;
}

.bottom-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  flex-shrink: 0;
}


.bottom-nav-label {
  display: block;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
}

/* ── Main content area ─────────────────────────────────────────────────────── */
.botanical-main {
  background: transparent !important;
}

.content-wrap {
  max-width: 860px;
  margin: 0 auto;
  padding: 16px 20px 48px;
}

@media (max-width: 960px) {
  .content-wrap {
    padding: 12px 14px 48px;
  }
}
@media (max-width: 480px) {
  .content-wrap {
    padding: 8px 10px 88px;
  }
}
@media (max-width: 360px) {
  .content-wrap {
    padding: 6px 6px 88px;
  }
}

/* ── Dialog mobile fix ─────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .v-overlay__content {
    margin: 12px !important;
    max-width: calc(100vw - 24px) !important;
  }
}
</style>
