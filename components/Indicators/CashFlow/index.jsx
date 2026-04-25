"use client"

import { cn } from '@/app/lib/utils'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { apiClient } from '../../../lib/api/ucode/base'
import { indicators } from '../../../store/indicatos.store'
import { formatNumber } from '../../../utils/helpers'
import CustomMonthSlider from '../shared/CustomMonthSlider'

const formatValue = (val) => {
  if (!val && val !== 0) return '0'
  const abs = Math.abs(val)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} млрд`
  if (abs >= 1_000_000) return `${(Math.round(abs / 1_000_000)).toLocaleString('ru-RU')} млн`
  return abs.toLocaleString('ru-RU')
}

// Constants outside component — never recreated
const TABS = ['Общий', 'Операционный', 'Инвестиционный', 'Финансовый']

const TAB_TO_POTOK = {
  'Общий': ['Операционный поток', 'Инвестиционный поток', 'Финансовый поток'],
  'Операционный': ['Операционный поток'],
  'Инвестиционный': ['Инвестиционный поток'],
  'Финансовый': ['Финансовый поток'],
}

const CashFlow = () => {
  const chartRef = useRef(null)
  const [zoomRange, setZoomRange] = useState([0, 100])
  const [activeTab, setActiveTab] = useState('Общий')

  const { rangeMonth, periodType, deals, accounts } = indicators

  const filterData = {
    periodStartDate: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
    periodEndDate: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
    periodType: periodType,
    currencyCode: GlobalCurrency.code,
    sellingDealId: deals,
    accountId: accounts,
  }

  const { data: cashFlowDataList, isLoading, isPending, isFetching } = useQuery({
    queryKey: ["cash_flow", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "cash_flow", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const legend = useMemo(() => cashFlowDataList?.legend || [], [cashFlowDataList])
  const months = useMemo(() => legend.map(l => l.title), [legend])
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


  const inteval = months?.length > 50 ? 30 : months?.length > 10 ? 15 : 5

  const options = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
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
                    <div class="font-medium text-slate-900">${formatValue(item.value)}</div>
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
      data: ['Поступления', 'Выплаты', 'Разница']
    },
    dataZoom: [{ type: 'slider', show: false, start: zoomRange[0], end: zoomRange[1] }],
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, interval: inteval, rotate: 40 }
    },
    yAxis: {
      type: 'value',
      max: yAxisMax,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value) => value === 0 ? '0' : formatValue(value)
      }
    },
    series: [
      {
        name: 'Поступления',
        type: 'bar',
        data: receiptsData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#3b82f6' },
      },
      {
        name: 'Выплаты',
        type: 'bar',
        data: paymentsData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#fb923c' },
      },
      {
        name: 'Разница',
        type: 'line',
        data: differenceData,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10b981', type: 'dashed' },
        itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
      }
    ]
  }), [zoomRange, months, receiptsData, paymentsData, differenceData, yAxisMax, inteval])

  const stats = [
    { label: 'Поступления', value: formatNumber(receiptTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
    { label: 'Выплаты', value: formatNumber(paymentTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
    { label: 'Разница', value: formatNumber(receiptTotal - paymentTotal), color: 'text-slate-900', symbol: GlobalCurrency?.name || '' },
  ]


  return (
    <div className="w-full bg-white p-6 mt-6 relative">
      {(isLoading || isPending || isFetching) && (
        <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
            <span className="text-sm text-neutral-600">Загрузка...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-bold text-[#111827]">Денежный поток, {GlobalCurrency?.name}</h2>
          <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
            <HelpCircle className="size-3 text-neutral-400" />
          </div>
        </div>
        <div className="flex flex-wrap bg-[#f3f4f624]  rounded-md p-1">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-neutral-700 border cursor-pointer text-sm p-2 w-32 ${idx === 0 ? 'rounded-l-md' : idx === TABS.length - 1 ? 'rounded-r-md' : ''
                } ${activeTab === tab ? 'border-primary' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[320px] shrink-0 space-y-7 pr-4 mt-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <span className="text-[14px] font-medium text-neutral-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                {stat.label}
              </span>
              <div className="flex flex-col items-end">
                <span className={cn("text-base font-medium leading-none", stat.color)}>
                  {stat.value} <span suppressHydrationWarning>{stat.symbol}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="mb-4 pt-4 px-2">
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