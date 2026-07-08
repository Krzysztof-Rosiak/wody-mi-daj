# Wody mi daj

Private PWA app for tracking houseplant care. Works offline, stores data locally in the browser — no account, no server, no fees. UI is in Polish.

---

## Features

- **Daily view** — calendar bar with a preview of tasks for past and future days; snooze a task with one tap; jump to any date via a date picker
- **7 care types** — watering, fertilizing, misting, pruning, repotting, cleaning, other; each with its own history and color
- **Linking watering with fertilizing** — a settings option automatically shows fertilizing and watering as one combined task whenever both are due together
- **Seasonal schedules** — over 350 species with ready-made intervals that change monthly according to the plant's natural rhythm, plus a per-plant care chart showing the yearly watering/fertilizing/misting rhythm
- **Custom plants** — no template: manually set how often to water, fertilize, mist, and clean
- **This month** — list of plants due for repotting and pruning based on the current month, with soil/repotting hints per plant category; a plant can be dismissed for the year
- **Observations** — regular "check-in": condition on a 1–5 scale, growth in cm (with delta from the previous observation), a note and a photo
- **Filterable history** — filter by care type; the last entries are shown by default, "show more" extends it further
- **Photo gallery** — all photos from observations and standalone uploads in one place, with the option to set one as the main photo
- **Statistics** — watering/care charts, care streak, plants-over-time chart, condition trend from observations, room distribution, list of overdue plants
- **Rooms** — group and filter plants by location (list or by-room view); reorder, hide, or add custom rooms in settings
- **Archive** — move a plant to the archive instead of deleting it, restore it anytime
- **Notifications** — push notifications for daily care (where supported by the browser/OS)
- **Light/dark "Garden" theme** — follows the system by default, can be overridden in settings
- **JSON export / import** — full data backup and transfer between devices, with validation and size limits on import
- **PWA** — installable on phone and computer, works fully offline; requests persistent storage so data isn't evicted under storage pressure

---

## Stack

|           |                                                                |
| --------- | -------------------------------------------------------------- |
| Framework | Vue 3 (`<script setup>`) + Vite                                |
| UI        | Vuetify 4, "Garden" light/dark theme                           |
| State     | Pinia                                                          |
| Database  | Dexie.js (IndexedDB), versioned schema/migrations              |
| Charts    | Chart.js + vue-chartjs                                         |
| Routing   | Vue Router                                                     |
| Tests     | Vitest + @vue/test-utils + fake-indexeddb                      |
| PWA       | vite-plugin-pwa + Workbox, custom service worker (`src/sw.ts`) |

---

## Local development

```sh
npm install
npm run dev
```

### Other commands

```sh
npm run build          # type-check + production build
npm run build-only     # production build without type-check
npm run preview        # preview the build
npm run test:unit      # unit tests (watch mode; add -- --run for a single pass)
npm run type-check     # TypeScript type checking (vue-tsc)
npm run lint           # ESLint + autofix
npm run format         # Prettier, writes src/
npm run ci             # type-check + build + tests, as run in CI
npm run generate-icons # regenerate PWA icons from favicon.svg
```

`scripts/download-plant-images.mjs` fetches and caches thumbnail images for the built-in plant species catalog; it is run manually (not wired to an npm script) and its output is not required for the app to run.

---

## Project structure

```
src/
├── db/                    # Dexie (IndexedDB) database class and versioned migrations
├── types/                 # Plant, CareEvent, CareType, PlantSurvey, AppSettings, ExportData, ...
├── data/                  # Static data: plant species templates, care categories, difficulty colors
├── stores/                # Pinia stores: plants, careEvents, surveys, photos, rooms, snoozes,
│                           #   settings, theme, repottingDismissals, wateringCache
├── composables/           # Reusable logic: usePlantTasks, useStats, usePlantSchedule,
│                           #   useSeasonalTasks, useDataBackup, usePlantsFilter,
│                           #   usePlantPhotoGallery, useTodayCalendar, useImageUpload, ...
├── views/                 # Routed pages: Today, This month, Stats, Plants, Plant detail,
│                           #   Archive, Settings
├── components/
│   ├── plants/            # PlantCard, PlantForm (+ sub-fields), PlantCareChart,
│   │                       #   PlantTemplateSearch, SurveyForm, PhotoGallery
│   ├── plant/              # Plant-detail-page building blocks (header, quick actions,
│   │                       #   care schedule, observations card, ...)
│   ├── care/               # CareEventForm/List, TaskSection, MonthlyTaskSection,
│   │                       #   RepottingSection, SnoozeDialog, CalendarStrip
│   ├── today/              # Today-view-specific pieces (welcome screen, date picker,
│   │                       #   install guide, room-grouped task list)
│   ├── stats/              # Chart tiles used by StatsView
│   ├── settings/           # Notifications and rooms settings cards
│   ├── data/               # ExportImport (backup UI)
│   ├── ui/                  # Small shared UI primitives (buttons, dialogs, empty states)
│   └── icons/               # SVG icon components
├── router/                 # Vue Router routes
├── plugins/                 # Vuetify/icon plugin setup
├── utils/                   # Small stateless helpers (date formatting, ...)
└── sw.ts                    # Custom service worker (notifications, periodic background sync)
```

Every composable and most components have a matching spec under a local `__tests__/` folder next to the source file.

---

## Data

All data is stored locally in IndexedDB (via Dexie.js). Nothing is sent anywhere except optional, best-effort lookups against the public Wikipedia API to fetch a representative photo for a known species (cached locally afterwards). The app requests `persistent storage` mode on startup — data won't be removed by the browser when space runs low.

Backup: **Settings → Export JSON** (also supports importing a previously exported file, or pasting its JSON contents directly).

---

## Deploy

The app is static — it can be deployed to Cloudflare Pages, Vercel, or Netlify:

1. Build command: `npm run build`
2. Output directory: `dist`
