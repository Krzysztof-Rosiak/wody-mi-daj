import type { IconSet, IconProps } from 'vuetify'
import { h } from 'vue'
import {
  mdiAlertCircleOutline,
  mdiChartBoxOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClipboardCheckOutline,
  mdiClockAlertOutline,
  mdiClockCheckOutline,
  mdiClose,
  mdiContentCut,
  mdiDotsHorizontal,
  mdiDownload,
  mdiFlower,
  mdiLeafCircle,
  mdiPotMix,
  mdiSpray,
  mdiSprayBottle,
  mdiSprout,
  mdiStar,
  mdiUpload,
  mdiWater,
  mdiWateringCan,
  mdiWateringCanOutline,
  mdiWeatherNight,
  mdiWeatherPartlyCloudy,
  mdiWeatherSunny,
  mdiWhiteBalanceSunny,
} from '@mdi/js'

const ICONS: Record<string, string> = {
  'mdi-alert-circle-outline':   mdiAlertCircleOutline,
  'mdi-chart-box-outline':      mdiChartBoxOutline,
  'mdi-chevron-left':           mdiChevronLeft,
  'mdi-chevron-right':          mdiChevronRight,
  'mdi-clipboard-check-outline': mdiClipboardCheckOutline,
  'mdi-clock-alert-outline':    mdiClockAlertOutline,
  'mdi-clock-check-outline':    mdiClockCheckOutline,
  'mdi-close':                  mdiClose,
  'mdi-content-cut':            mdiContentCut,
  'mdi-dots-horizontal':        mdiDotsHorizontal,
  'mdi-download':               mdiDownload,
  'mdi-flower':                 mdiFlower,
  'mdi-leaf-circle':            mdiLeafCircle,
  'mdi-pot-mix':                mdiPotMix,
  'mdi-spray':                  mdiSpray,
  'mdi-spray-bottle':           mdiSprayBottle,
  'mdi-sprout':                 mdiSprout,
  'mdi-star':                   mdiStar,
  'mdi-upload':                 mdiUpload,
  'mdi-water':                  mdiWater,
  'mdi-watering-can':           mdiWateringCan,
  'mdi-watering-can-outline':   mdiWateringCanOutline,
  'mdi-weather-night':          mdiWeatherNight,
  'mdi-weather-partly-cloudy':  mdiWeatherPartlyCloudy,
  'mdi-weather-sunny':          mdiWeatherSunny,
  'mdi-white-balance-sunny':    mdiWhiteBalanceSunny,
}

export const mdiSvg: IconSet = {
  component: (props: IconProps) => {
    const path = ICONS[props.icon as string] ?? ''
    return h('svg', {
      class: 'v-icon__svg',
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      width: '1em',
      height: '1em',
      role: 'img',
      'aria-hidden': 'true',
    }, [h('path', { d: path })])
  },
}
