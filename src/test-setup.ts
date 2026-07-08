import 'fake-indexeddb/auto'

// Mock CSS imports (Vuetify imports CSS via ESM which doesn't work in vitest)
// @ts-expect-error jsdom does not define CSS
globalThis.CSS = { supports: () => false }

// Vuetify 4 requires visualViewport (missing in jsdom)
if (!window.visualViewport) {
  // @ts-expect-error jsdom does not define visualViewport
  window.visualViewport = {
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
}
