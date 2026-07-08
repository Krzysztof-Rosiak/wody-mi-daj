import { Chart as ChartJS, type Chart } from 'chart.js'

const tickColor = '#a09080'
const gridColor = 'rgba(160,144,128,0.12)'

const fontMono = { family: 'JetBrains Mono', size: 10 } as const

export const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, barTotals: { enabled: true, horizontal: false } },
  scales: {
    y: { beginAtZero: true, grace: '15%', ticks: { stepSize: 1, color: tickColor, font: fontMono }, grid: { color: gridColor } },
    x: { ticks: { color: tickColor, maxTicksLimit: 10, font: fontMono }, grid: { display: false } },
  },
} as const

export const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grace: '10%', ticks: { stepSize: 1, color: tickColor, font: fontMono }, grid: { color: gridColor } },
    x: { ticks: { color: tickColor, font: fontMono }, grid: { display: false } },
  },
} as const

export const conditionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { min: 1, max: 5, ticks: { stepSize: 1, color: tickColor, font: fontMono }, grid: { color: gridColor } },
    x: { ticks: { color: tickColor, font: fontMono }, grid: { display: false } },
  },
} as const

export const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' as const, labels: { color: tickColor, font: fontMono, boxWidth: 12, padding: 10 } },
    barTotals: { enabled: true, horizontal: false },
  },
  scales: {
    x: { stacked: true, ticks: { color: tickColor, font: fontMono }, grid: { display: false } },
    y: { stacked: true, beginAtZero: true, grace: '10%', ticks: { stepSize: 1, color: tickColor, font: fontMono }, grid: { color: gridColor } },
  },
} as const

export const roomBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    barTotals: { enabled: true, horizontal: true },
  },
  scales: {
    x: { beginAtZero: true, grace: '15%', ticks: { display: false }, grid: { color: gridColor } },
    y: { ticks: { color: tickColor, font: fontMono }, grid: { display: false } },
  },
} as const

type BarTotalsOptions = { enabled?: boolean; horizontal?: boolean }

export function registerStackedTotalsPlugin() {
  ChartJS.register({
    id: 'barTotals',
    afterDatasetsDraw(chart: Chart) {
      const opts = (chart.options.plugins as { barTotals?: BarTotalsOptions } | undefined)?.barTotals
      if (!opts?.enabled) return
      const { ctx, data } = chart
      ctx.save()
      ctx.font = `600 10px 'JetBrains Mono', monospace`
      ctx.fillStyle = tickColor
      const totals: number[] = new Array((data.labels ?? []).length).fill(0)
      data.datasets.forEach((ds) => {
        ;(ds.data as number[]).forEach((v, i) => { totals[i] += v })
      })
      const lastMeta = chart.getDatasetMeta(data.datasets.length - 1)
      totals.forEach((total, i) => {
        if (!total) return
        const bar = lastMeta.data[i]
        if (!bar) return
        if (opts.horizontal) {
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(total), bar.x + 4, bar.y)
        } else {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(String(total), bar.x, bar.y - 4)
        }
      })
      ctx.restore()
    },
  })
}
