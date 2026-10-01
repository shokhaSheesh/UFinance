'use client'

import { AXIS_LABEL, SPLIT_LINE } from '@/components/Indicators/shared/chartTheme'
import { formatValueLength } from '@/utils/helpers'
import ReactECharts from 'echarts-for-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

/**
 * Графики «Показателей» на телефоне.
 *
 * На компьютере у каждого графика свой ползунок периода, своя легенда и
 * высота под 450 точек. На телефоне график — часть карточки: невысокий,
 * подписи оси сокращены («млн / тыс»), подсказка не вылезает за экран
 * (confine), легенда — под графиком.
 */

/** Подпись суммы на оси: «12 млн», «450 тыс». */
export function useShortValue() {
  const t = useTranslations('Indicators')
  const billion = t('common.billion')
  const million = t('common.million')
  const thousand = t('common.thousand')
  return (value) => (value === 0 ? '0' : formatValueLength(value, billion, million, thousand))
}

const baseOption = (labels, shortValue, percent) => ({
  tooltip: { trigger: 'axis', confine: true, textStyle: { fontSize: 12 } },
  legend: { bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b', fontSize: 11 } },
  grid: { left: 4, right: 8, top: 12, bottom: 30, containLabel: true },
  xAxis: {
    type: 'category',
    data: labels,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, interval: 'auto', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: SPLIT_LINE,
    axisLabel: { ...AXIS_LABEL, fontSize: 10, formatter: (value) => (percent ? `${value}%` : shortValue(value)) },
  },
})

/**
 * Столбики и линия поверх: доходы и расходы с прибылью, поступления и
 * выплаты с разницей.
 * bars: [{ name, data, color }], lines: [{ name, data, color, dashed }]
 */
export function BarsChart({ labels = [], bars = [], lines = [], height = 220, percent = false }) {
  const shortValue = useShortValue()
  const option = useMemo(
    () => ({
      ...baseOption(labels, shortValue, percent),
      series: [
        ...bars.map((bar) => ({
          name: bar.name,
          type: 'bar',
          data: bar.data,
          barMaxWidth: 14,
          itemStyle: { color: bar.color, borderRadius: [3, 3, 0, 0] },
        })),
        ...lines.map((line) => ({
          name: line.name,
          type: 'line',
          data: line.data,
          smooth: 0.25,
          connectNulls: false,
          showSymbol: labels.length <= 12,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2.5, color: line.color, type: line.dashed ? 'dashed' : 'solid' },
          itemStyle: { color: line.color, borderColor: '#fff', borderWidth: 2 },
          areaStyle: line.area ? { color: line.area } : undefined,
        })),
      ],
    }),
    // shortValue зависит только от перевода
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels, bars, lines, percent]
  )

  return (
    <div style={{ height }} className="w-full">
      <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  )
}
