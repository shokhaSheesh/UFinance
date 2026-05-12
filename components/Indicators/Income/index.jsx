"use client"

import { cn } from '@/lib/utils'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import useMounted from '../../../hooks/useMounted'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import { getRandomColor } from '../../../utils/randomColor'
import CustomMonthSlider from '../shared/CustomMonthSlider'
import { localizeMonthTitle } from '../utils/localizeMonth'

const findRowById = (rows, id) => (rows || []).find((r) => r?.id === id)

const colors = [
  '#1C7AD8',
  '#073259',
  '#5CD9FF',
  '#00C3FF',
  '#8AE4FF',
  '#007DA3',
  '#005A75',
  '#003747',
  '#00A0D1',
  '#B8DAFF',
  '#8AC2FF',
  '#2990FF',
  '#003975',
  '#0065D1',
  '#5CABFF',
  '#004FA3',
  '#002347',
  '#7C5CFF',
  '#5429FF',
  '#3300FF',
  '#2A00D1'
]

export function findByName(data, targetName) {
  const results = [];

  function traverse(node) {
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }
    if (node && typeof node === 'object') {
      if (node.name === targetName) {
        node?.details?.map(item => results.push(item))
      }
      if (Array.isArray(node.details)) {
        node.details.forEach(traverse);
      }
    }
  }

  traverse(data);
  return results;
}


const Income = observer(({ method, profitAndLossDataList, cashFlowDataList, isLoading }) => {
  const t = useTranslations('Indicators')
  const chartRef = useRef(null)
  const [zoomRange, setZoomRange] = useState([0, 100])
  const locale = useLocale()
  const mounted = useMounted()

  const billion = t('common.billion')
  const million = t('common.million')
  const thousand = t('common.thousand')



  const { months, incomeData, childrens } = useMemo(() => {
    //  method = income_expenses
    const profit = profitAndLossDataList?.rows?.find(item => item?.name === 'Доходы')
    const legend = profit?.months || []
    const rows = profitAndLossDataList?.rows || []

    const keys = Object.entries(legend).map(([key]) => key).filter(Boolean)

    const titles = profitAndLossDataList?.legend.map((l) => localizeMonthTitle(locale, l.startDate))

    const revenueRow = findRowById(rows, 'revenue')

    const readValues = (row) => {
      const src = row?.values || row?.months || {}
      return keys.map((k) => Number(src?.[k] ?? 0))
    }

    const childrens = profit?.details?.filter(item => item?.total !== 0)?.map(item => ({
      ...item,
      values: readValues(item)
    })) || []


    //  method = receipts_payments
    const sections = ['Операционный поток', 'Инвестиционный поток', 'Финансовый поток']
    const cashFlowLegend = cashFlowDataList?.legend
    const allIncomeList = cashFlowDataList?.rows?.filter(item => sections?.includes(item?.name))
    const income = findByName(allIncomeList, 'Поступления')
    const childrensForCashFlow = income?.filter(item => item?.totalValue !== 0)?.map(item => ({
      ...item,
      values: readValues(item)
    })) || []
    const monthsCashFlow = cashFlowLegend?.map((l) => localizeMonthTitle(locale, l.startDate))
    const cashFlowRevenueRow = income?.map(item => item?.totalValue)

    return {
      months: method === 'income_expenses' ? titles : monthsCashFlow,
      incomeData: method === 'income_expenses' ? readValues(revenueRow) : cashFlowRevenueRow,
      childrens: method === 'income_expenses' ? childrens : childrensForCashFlow
    }
  }, [profitAndLossDataList, cashFlowDataList, method, locale])


  const stats = useMemo(() => {
    const revenueTotal = incomeData.reduce((a, b) => a + b, 0)

    const details = childrens?.map((item, index) => {
      const color = colors[index]
      return {
        values: item?.values,
        id: item?.id,
        label: item?.name,
        value: formatNumber(formatTotalSumma(item.values.reduce((a, b) => a + b, 0))),
        color: color,
        planColor: color
      }
    }) || []


    return {
      income: { label: method === 'income_expenses' ? t('income.labelIncome') : t('income.labelReceipts'), value: formatNumber(formatTotalSumma(revenueTotal, 0)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
      details
    }
  }, [incomeData, childrens, method])


  const donutOption = useMemo(() => {

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        confine: false,
        appendToBody: true,
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Income Breakdown',
          type: 'pie',
          radius: ['60%', '90%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 0,
            borderColor: '#fff',
            borderWidth: 1
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: false
            }
          },
          labelLine: {
            show: false
          },
          data: stats?.details?.map(item => ({ value: Number(item.value.replace(/\s/g, '')) || 250, name: item.label, itemStyle: { color: item.color, z: 10000 } })),

        }
      ],
      graphic: [{
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${stats.income.label}\n${stats.income.value}`,
          textAlign: 'center',
          fill: '#111827',
          fontSize: 20,
          fontWeight: 'bold',
          lineHeight: 34
        }
      }]
    }
  }, [stats])

  const inteval = months?.length > 5000 ? 400 : months?.length > 1500 ? 300 : months?.length > 1000 ? 100 : months?.length > 500 ? 50 : 10

  const barOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#111827', fontSize: 12 },
        formatter: (params) => {
          let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name}</div>`
          params.forEach(item => {
            res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                      ${item.seriesName}
                    </div>
                    <div class="font-medium text-slate-900">${Number(item.value ?? 0).toLocaleString('ru-RU')} $</div>
                  </div>`
          })
          return res
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '5%',   // ← room for rotated labels
        top: '10%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'slider',
          show: false,
          start: zoomRange[0],
          end: zoomRange[1],
        },
        {
          type: 'inside',                  // ← lets the zoom actually shrink the visible window
          start: zoomRange[0],
          end: zoomRange[1],
        }
      ],
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#111827',
          fontSize: 12,
          interval: inteval,   // ← stop forcing every label
          rotate: 40,         // ← tilt when crowded
          hideOverlap: true
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: {
          color: '#111827',
          fontSize: 12,
          formatter: (value) => {
            if (value === 0) return '0'
            const abs = Math.abs(value)
            if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} ${billion}`
            if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} ${million}`
            if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} ${thousand}`
            return `${formatTotalSumma(value, 0)}`
          }
        }
      },
      series: stats?.details?.map((child, index) => ({
        name: child?.label,
        type: 'bar',
        stack: 'total',
        data: child?.values.map((value) => ({ value: formatTotalSumma(value, 0) })),
        barWidth: 40,
        itemStyle: {
          color: stats?.details?.[index]?.color || getRandomColor('#D69B42'),
          borderColor: '#fff',
          borderWidth: 1
        }
      }))
    }
  }, [months, zoomRange, stats?.details, inteval])


  return (
    <div className="w-full p-6 rounded-lg mt-6 relative">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[14px] font-medium text-[#111827]">{stats.income.label}, {mounted ? GlobalCurrency.name : ''}</h2>
        <div className="flex items-center justify-center size-4 bg-neutral-100 rounded-full cursor-help">
          <HelpCircle className="size-2.5 text-neutral-400" />
        </div>
      </div>
      <div className="w-full h-px bg-neutral-100 mb-8" />

      {/* Loading Overlay */}
      {(isLoading) && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
            <span className="text-sm text-neutral-600">{t('common.loading')}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Donut Pane */}
        <div className="w-full flex-1 shrink-0 flex items-start justify-between relative z-10">
          <div className=" relative shrink-0">
            <ReactECharts
              option={donutOption}
              style={{ height: '300px', width: '300px' }}
            />
          </div>
          <div className="flex-1 pl-6 space-y-4 items-start">
            {stats?.details?.map(item => (
              <div key={item?.id} className="flex flex-wrap justify-between items-center ">
                <div className="flex items-center gap-2">
                  <div className="size-3" style={{ backgroundColor: item?.color }}></div>
                  <span className="text-sm text-gray-600">{item?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-bold", item?.color)}>{item?.value}</span>
                  <span className="text-sm text-gray-400" suppressHydrationWarning></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Pane */}
        <div className="flex-1 relative z-10">
          <div className="mb-4 px-2">
            <CustomMonthSlider
              value={zoomRange}
              onChange={setZoomRange}
            />
          </div>
          <div className="h-[300px] w-full overflow-visible">
            <ReactECharts
              ref={chartRef}
              option={barOption}
              style={{ height: '100%', width: 'fit' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default Income