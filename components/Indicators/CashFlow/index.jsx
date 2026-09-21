"use client"

import { AXIS_LABEL, CHART_COLORS, SPLIT_LINE, TOOLTIP_BOX } from '../shared/chartTheme'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import HintQuestion from '@/components/shared/HintQuestion'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { apiClient } from '../../../lib/api/ucode/base'
import { indicators } from '../../../store/indicatos.store'
import { formatAmount, formatNumber } from '../../../utils/helpers'
import { STATIC_CASHFLOW_DATA } from '../constants/staticChartData'
import Segmented from '@/components/shared/Segmented/Segmented'
import CustomMonthSlider from '../shared/CustomMonthSlider'
import StatTiles from '../shared/StatTiles'
import { localizeMonthTitle } from '../utils/localizeMonth'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

const TAB_TO_POTOK = {
  'total': ['Операционный поток', 'Инвестиционный поток', 'Финансовый поток'],
  'operational': ['Операционный поток'],
  'investment': ['Инвестиционный поток'],
  'financial': ['Финансовый поток'],
}

const CashFlow = () => {
  const t = useTranslations('Indicators')
  const chartRef = useRef(null)
  const [zoomRange, setZoomRange] = useState([0, 100])
  const [activeTab, setActiveTab] = useState('total')
  const locale = useLocale()
  const mounted = useMounted()

  const billion = t('common.billion')
  const million = t('common.million')

  const formatValue = (val) => {
    if (!val && val !== 0) return '0'
    const abs = Math.abs(val)
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} ${billion}`
    if (abs >= 1_000_000) return `${(Math.round(abs / 1_000_000)).toLocaleString('ru-RU')} ${million}`
    return abs.toLocaleString('ru-RU')
  }

  const TABS = [
    { value: 'total', label: t('cashFlow.tabs.total') },
    { value: 'operational', label: t('cashFlow.tabs.operational') },
    { value: 'investment', label: t('cashFlow.tabs.investment') },
    { value: 'financial', label: t('cashFlow.tabs.financial') },
  ]

  const receiptsLabel = t('cashFlow.series.receipts')
  const paymentsLabel = t('cashFlow.series.payments')
  const differenceLabel = t('cashFlow.series.difference')
  const monthsShort = t('common.monthNamesShort').split(',')

  const { rangeMonth, periodType, deals, accounts } = indicators

  const filterData = {
    periodStartDate: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
    periodEndDate: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
    periodType: periodType,
    currencyCode: GlobalCurrency?.code,
    sellingDealId: deals,
    project_ids: indicators.projects,
    accountId: accounts,
  }

  const { data: apiCashFlowData, isLoading, isPending, isFetching } = useQuery({
    queryKey: ["cash_flow", filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: "cash_flow", data: filterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Fallback to static data if API returns no data
  const cashFlowDataList = apiCashFlowData || STATIC_CASHFLOW_DATA

  const legend = useMemo(() => cashFlowDataList?.legend || [], [cashFlowDataList])
  const months = useMemo(() => legend.map((l) => localizeMonthTitle(locale, l.startDate)), [legend, locale])
  const monthKeys = useMemo(() => legend.map(l => l.key), [legend])
  const rows = useMemo(() => cashFlowDataList?.rows || [], [cashFlowDataList])

  // ✅ Core fix: extract Поступления/Выплаты from INSIDE each поток
  const { receiptsData, paymentsData, receiptTotal, paymentTotal } = useMemo(() => {
    const potokNames = TAB_TO_POTOK[activeTab] || []

    // Find the relevant поток rows (level 0)
    const potoks = rows.filter(r => potokNames.includes(r.name))

    // Collect all Поступления children across selected потоки
    const allReceipts = potoks.flatMap(p =>
      p.details?.filter(d => d.name === 'Поступления') || []
    )

    // Collect all Выплаты children across selected потоки
    const allPayments = potoks.flatMap(p =>
      p.details?.filter(d => d.name === 'Выплаты') || []
    )

    // Sum month by month
    const receipts = monthKeys.map(key =>
      allReceipts.reduce((sum, r) => sum + (r.values?.[key] ?? 0), 0)
    )

    const payments = monthKeys.map(key =>
      allPayments.reduce((sum, p) => sum + Math.abs(p.values?.[key] ?? 0), 0)
    )

    const rTotal = allReceipts.reduce((sum, r) => sum + (r.totalValue ?? 0), 0)
    const pTotal = allPayments.reduce((sum, p) => sum + Math.abs(p.totalValue ?? 0), 0)

    return {
      receiptsData: receipts,
      paymentsData: payments,
      receiptTotal: rTotal,
      paymentTotal: pTotal,
    }
  }, [activeTab, monthKeys, rows])

  const differenceData = useMemo(() =>
    receiptsData.map((val, idx) => val - paymentsData[idx]),
    [receiptsData, paymentsData]
  )

  const yAxisMax = useMemo(() => {
    const allVals = [...receiptsData, ...paymentsData, ...differenceData.map(Math.abs)]
    const max = Math.max(...allVals, 0)
    if (max === 0) return 1000
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    return Math.ceil(max / magnitude) * magnitude
  }, [receiptsData, paymentsData, differenceData])



  const options = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_BOX,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#111827', fontSize: 12 },
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowBlur: 10,
      formatter: (params) => {
        let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name}</div>`
        params.forEach(item => {
          res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                      ${item.seriesName}
                    </div>
                    <div class="font-medium text-slate-900">${formatValue(item.value)} ${GlobalCurrency?.name}</div>
                  </div>`
        })
        return res
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: '#6b7280', fontSize: 12 },
      data: [receiptsLabel, paymentsLabel, differenceLabel]
    },
    dataZoom: [{ type: 'slider', show: false, start: zoomRange[0], end: zoomRange[1] }],
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0 }
    },
    yAxis: {
      type: 'value',
      max: yAxisMax,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: SPLIT_LINE,
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 11,
        formatter: (value) => value === 0 ? '0' : formatValue(value)
      }
    },
    series: [
      {
        name: receiptsLabel,
        type: 'bar',
        data: receiptsData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: CHART_COLORS.income },
      },
      {
        name: paymentsLabel,
        type: 'bar',
        data: paymentsData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: CHART_COLORS.expense },
      },
      {
        name: differenceLabel,
        type: 'line',
        data: differenceData,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: CHART_COLORS.result, type: 'dashed' },
        itemStyle: { color: CHART_COLORS.result, borderWidth: 2, borderColor: '#fff' },
      }
    ]
  }), [zoomRange, months, receiptsData, paymentsData, differenceData, yAxisMax, receiptsLabel, paymentsLabel, differenceLabel, formatValue])

  const stats = [
    { label: receiptsLabel, value: formatAmount(receiptTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
    { label: paymentsLabel, value: formatAmount(paymentTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
    { label: differenceLabel, value: formatAmount(receiptTotal - paymentTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
  ]

  if (!mounted) return null

  return (
    <div className="w-full bg-white p-6 relative">
      {(isLoading || isPending || isFetching) && (
        <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
            <span className="text-sm text-neutral-600">{t('common.loading')}</span>
          </div>
        </div>
      )}
      <div className="mb-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{t('cashFlow.title')}, {GlobalCurrency?.name}</h2>
          <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
            <HintQuestion className="size-3 text-neutral-400" />
          </div>
        </div>
        <Segmented ariaLabel={t('cashFlow.title')} options={TABS} value={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Итоги — плитками над графиком */}
        <StatTiles items={stats} />

        <div className="w-full">
          <div className="mb-4 px-2">
            <CustomMonthSlider value={zoomRange} onChange={setZoomRange} />
          </div>
          <div className="h-[450px] w-full">
            <ReactECharts
              ref={chartRef}
              option={options}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(CashFlow)