import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'

import { defineConfig } from 'vite'

function prefetchChunksPlugin(): Plugin {
  return {
    name: 'prefetch-chunks',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html
      const tags = Object.values(ctx.bundle)
        .filter((c) => c.type === 'chunk' && !c.isEntry)
        .map((c) => `<link rel="prefetch" href="/assets/${c.fileName}" as="script" crossorigin>`)
        .join('\n    ')
      return html.replace('</head>', `    ${tags}\n  </head>`)
    },
  }
}
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    prefetchChunksPlugin(),
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'WodyMiDaj',
        short_name: 'WodyMiDaj',
        description: 'Aplikacja do śledzenia pielęgnacji roślin domowych',
        theme_color: '#388E3C',
        background_color: '#1a1a1a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    host: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    cssCodeSplit: false,
  },
})
