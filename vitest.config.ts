import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// Plugin do ignorowania importów CSS w testach
const cssNoop = {
  name: 'css-noop',
  transform(_code: string, id: string) {
    if (id.endsWith('.css')) {
      return { code: 'export default {}', map: null }
    }
  },
  resolveId(id: string) {
    if (id.endsWith('.css')) {
      return id
    }
  },
  load(id: string) {
    if (id.endsWith('.css')) {
      return 'export default {}'
    }
  },
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [cssNoop],
    test: {
      environment: 'jsdom',
      pool: 'forks',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test-setup.ts'],
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    },
  }),
)
