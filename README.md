# Moje Roślinki

Prywatna aplikacja PWA do śledzenia pielęgnacji roślin domowych. Działa offline, dane przechowuje lokalnie w przeglądarce — bez konta, bez serwera, bez opłat.

---

## Funkcje

- **Dzienny widok** — pasek kalendarza z podglądem zadań na przeszłe i przyszłe dni; odłóż zadanie (snooze) jednym tapnięciem
- **7 typów pielęgnacji** — podlewanie, nawożenie, zraszanie, przycinanie, przesadzanie, czyszczenie, inne; każde z osobną historią i kolorem
- **Łączenie podlewania z nawożeniem** — opcja w ustawieniach automatycznie dodaje podlanie przy każdym nawożeniu
- **Harmonogramy sezonowe** — ponad 350 gatunków z gotowymi interwałami, które zmieniają się co miesiąc zgodnie z naturalnym rytmem rośliny
- **Rośliny niestandardowe** — bez szablonu: ręcznie ustaw co ile dni podlewać, nawozić, zraszać i czyścić
- **W tym miesiącu** — lista roślin do przesadzenia i przycinania na podstawie bieżącego miesiąca
- **Obserwacje** — regularny "check-in": kondycja w skali 1–5, wzrost w cm (z delta względem poprzedniej obserwacji), notatka i zdjęcie; edytowalne przez 24 h
- **Historia z filtrowaniem** — filtruj po typie pielęgnacji; domyślnie widoczne ostatnie pół roku, "pokaż więcej" rozszerza o kolejne
- **Galeria zdjęć** — wszystkie zdjęcia z obserwacji w jednym miejscu, z możliwością ustawienia jako zdjęcie główne
- **Statystyki** — wykres podlewań, seria dni, liczba zabiegów w miesiącu, lista zaległych roślin
- **Pokoje** — grupuj i filtruj rośliny według miejsca; edytowalna lista pokoi w ustawieniach
- **Stanowisko** — przypisz warunki świetlne do każdej rośliny (cień / półcień / jasne / pełne słońce)
- **Archiwum** — przenieś roślinę do archiwum zamiast usuwać, przywróć w każdej chwili
- **Powiadomienia** — push o codziennej pielęgnacji (opcjonalne, z wyborem godziny)
- **Ciemny motyw** — motyw "Ogród" w wersji jasnej i ciemnej
- **Export / Import JSON** — backup danych i przenoszenie między urządzeniami
- **PWA** — instalowalna na telefonie i komputerze, działa w pełni offline

---

## Stack

|             |                           |
| ----------- | ------------------------- |
| Framework   | Vue 3 + Vite              |
| UI          | Vuetify 3 (dark theme)    |
| State       | Pinia                     |
| Baza danych | Dexie.js (IndexedDB)      |
| Testy       | Vitest + @vue/test-utils  |
| PWA         | vite-plugin-pwa + Workbox |

---

## Rozwój lokalny

```sh
npm install
npm run dev
```

### Inne komendy

```sh
npm run build          # build produkcyjny
npm run preview        # podgląd builda
npm run test:unit      # testy jednostkowe
npm run type-check     # sprawdzenie typów TypeScript
npm run lint           # ESLint + autofix
npm run generate-icons # regeneracja ikon PWA z favicon.svg
```

---

## Struktura projektu

```
src/
├── db/              # Dexie (IndexedDB) — schemat i migracje
├── stores/          # Pinia — plants, careEvents, settings
├── views/           # Widoki: lista roślin, szczegół, ustawienia
├── components/
│   ├── plants/      # PlantCard, PlantForm
│   ├── care/        # CareEventForm, CareEventList
│   └── data/        # ExportImport
└── types/           # Plant, CareEvent, CareType, AppSettings
```

---

## Dane

Wszystkie dane są przechowywane lokalnie w IndexedDB (przez Dexie.js). Nie są wysyłane nigdzie. Aplikacja żąda trybu `persistent storage` przy starcie — dane nie zostaną usunięte przez przeglądarkę gdy skończy się miejsce.

Backup: **Ustawienia → Eksportuj JSON**.

---

## Deploy

Aplikacja jest statyczna — można wdrożyć na Cloudflare Pages, Vercel lub Netlify:

1. Build command: `npm run build`
2. Output directory: `dist`
