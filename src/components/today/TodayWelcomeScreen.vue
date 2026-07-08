<script setup lang="ts">
import IconPlantBrand from '@/components/icons/IconPlantBrand.vue'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconSun from '@/components/icons/IconSun.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import IconPerson from '@/components/icons/IconPerson.vue'
import IconCheckSquare from '@/components/icons/IconCheckSquare.vue'
import IconBarChart from '@/components/icons/IconBarChart.vue'
import IconBroadcast from '@/components/icons/IconBroadcast.vue'
import IconInfo from '@/components/icons/IconInfo.vue'
import InstallGuideCard from '@/components/today/InstallGuideCard.vue'

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone)
</script>

<template>
  <div class="welcome">
    <div class="welcome__hero">
      <IconPlantBrand :size="64" class="welcome__plant-ico" />
      <h1 class="welcome__title">Witaj w WodyMiDaj</h1>
      <p class="welcome__sub">
        Twój prywatny dziennik pielęgnacji roślin. Nigdy więcej "kiedy ostatnio podlewałam?"
      </p>
      <RouterLink to="/rosliny" class="welcome__cta">
        <IconPlus :size="15" />
        Dodaj pierwszą roślinę
      </RouterLink>
    </div>

    <div class="welcome__features">
      <div class="feat-card">
        <div class="feat-card__ico"><IconSun :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">Dziś</div>
          <div class="feat-card__desc">
            Na ekranie głównym widzisz co trzeba zrobić dziś — podlewanie, nawożenie, zraszanie i
            inne zabiegi. Możesz odłożyć zadanie na później albo od razu oznaczyć jako zrobione.
          </div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-card__ico"><IconCalendar :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">W tym miesiącu</div>
          <div class="feat-card__desc">
            Co miesiąc pojawia się lista roślin do przesadzenia i przycinania — dobrana do gatunku i
            pory roku. Możesz odhaczyć zrobione albo pominąć na ten miesiąc.
          </div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-card__ico"><IconPerson :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">Rośliny</div>
          <div class="feat-card__desc">
            Wszystkie rośliny w jednym miejscu, z możliwością posortowania po pokojach. Każda ma
            własną stronę z historią zabiegów, harmonogramem podlewania i galerią zdjęć.
          </div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-card__ico"><IconCheckSquare :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">Obserwacje</div>
          <div class="feat-card__desc">
            Zapisuj jak czuje się roślina: oceń kondycję, zmierz wzrost, dodaj notatkę lub zdjęcie.
            Z czasem powstaje wizualny dziennik jej historii.
          </div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-card__ico"><IconBarChart :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">Statystyki</div>
          <div class="feat-card__desc">
            Wykres aktywności z ostatnich 30 dni, aktualna seria pielęgnacyjna i lista roślin, które
            czekają najdłużej na uwagę.
          </div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-card__ico"><IconBroadcast :size="22" /></div>
        <div class="feat-card__body">
          <div class="feat-card__title">Offline i prywatność</div>
          <div class="feat-card__desc">
            Działa bez internetu — zainstaluj jako aplikację i używaj wszędzie. Dane zostają tylko
            na Twoim urządzeniu, bez konta i bez serwera.
          </div>
        </div>
      </div>
    </div>

    <div class="welcome__tip">
      <IconInfo :size="16" />
      <span
        ><strong>Wskazówka:</strong> Zacznij od wybrania rośliny z listy ponad 400 gatunków —
        harmonogram ustawi się sam i będzie zmieniał interwały wraz z porą roku. Możesz też dodać
        własną roślinę i ustawić interwały ręcznie.</span
      >
    </div>

    <InstallGuideCard v-if="!isStandalone" />
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome__hero {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.welcome__plant-ico {
  color: var(--accent-deep);
  opacity: 0.85;
}

.welcome__title {
  font-family: 'Caveat', cursive;
  font-size: 36px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.1;
}

.welcome__sub {
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  color: var(--ink-2);
  max-width: 360px;
  line-height: 1.5;
}

.welcome__cta {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  font-family: 'Kalam', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--paper);
  background: var(--accent-deep);
  border: 1.8px solid var(--accent-deep);
  border-radius: 10px 14px 11px 13px / 13px 11px 14px 10px;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.1s,
    opacity 0.1s;
}
.welcome__cta:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.welcome__features {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.feat-card {
  background: var(--paper-card);
  border: 1.8px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feat-card__ico {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-deep);
  border-radius: 10px 13px 11px 14px;
  border: 1.3px solid var(--accent-deep);
}

.feat-card__body {
  min-width: 0;
}

.feat-card__title {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 3px;
}

.feat-card__desc {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.5;
}

.welcome__tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: var(--accent-soft);
  border: 1.5px solid var(--accent-deep);
  border-radius: var(--r-card);
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: var(--accent-deep);
  line-height: 1.5;
}
.welcome__tip svg {
  flex-shrink: 0;
  margin-top: 2px;
}

@media (min-width: 560px) {
  .welcome__features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 860px) {
  .welcome__features {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
