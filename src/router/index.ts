import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'today',
      component: () => import('../views/TodayView.vue'),
    },
    {
      path: '/ten-miesiac',
      name: 'this-month',
      component: () => import('../views/ThisMonthView.vue'),
    },
    {
      path: '/statystyki',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
    },
    {
      path: '/rosliny',
      name: 'plants',
      component: () => import('../views/PlantsView.vue'),
    },
    {
      path: '/rosliny/:id',
      name: 'plant-detail',
      component: () => import('../views/PlantDetailView.vue'),
    },
    {
      path: '/archiwum',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue'),
    },
    {
      path: '/ustawienia',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
