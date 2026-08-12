"use client"

import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { indicators } from '@/store/indicatos.store'
import { formatStudentTableDate } from '@/utils/formatDate'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import CustomMonthSlider from '../shared/CustomMonthSlider'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

const Students = () => {
  const t = useTranslations('Indicators')
  const chartRef = useRef(null)
  const mounted = useMounted()
  const [zoomRange, setZoomRange] = useState([0, 100])
  const indicatorsStore = indicators


  const billion = t('common.billion')
  const million = t('common.million')
  const thousand = t('common.thousand')
  const planLabel = t('students.series.plan')
  const factLabel = t('students.series.fact')
  const diffLabel = t('students.series.difference')

  const filterData = useMemo(() => ({
    accounting_method: indicatorsStore.accounting,
    currency_code: GlobalCurrency?.code || 'UZS',
    company_id: authStore.userData?.company_id,
    from_date: indicatorsStore.rangeMonth?.start
      ? moment.parseZone(indicatorsStore.rangeMonth.start).format('YYYY-MM-DD')
      : null,
    to_date: indicatorsStore.rangeMonth?.end
      ? moment.parseZone(indicatorsStore.rangeMonth.end).format('YYYY-MM-DD')
      : null,
    limit: 5000,
    page: 1,
  }), [indicatorsStore.accounting, indicatorsStore.rangeMonth])

  const { data: apiData, isLoading, isFetching, isPending } = useQuery({
    queryKey: ['students_indicators', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({
      method: 'get_counterparties_data_by_query',
      data: filterData
    })),
    select: (res) => res?.data?.data,
    enabled: appStore.isDonoSchool,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const studentList = useMemo(() => apiData?.counterparties?.items || [], [apiData])
  const totalMonths = useMemo(() => apiData?.total_by_months || [], [apiData])
  const fullTotal = useMemo(() => apiData?.total || {}, [apiData])

  const { months, planData, factData, diffData } = useMemo(() => ({
    months: totalMonths.map(m => formatStudentTableDate(m?.month)),
    planData: totalMonths.map(m => Number(m?.total_plan ?? 0)),
    factData: totalMonths.map(m => Number(m?.total_fact ?? 0)),
    diffData: totalMonths.map(m => Number(m?.total_plan_fact ?? 0)),
  }), [totalMonths])

  const stats = useMemo(() => {
    const activeCount = studentList.filter(s => s?.contract_status === true).length
    const passiveCount = studentList.filter(s => s?.contract_status === false).length

    return [
      {
        label: t('students.stats.totalPlan'),
        value: formatNumber(formatTotalSumma(fullTotal?.total_plan, 0)) || '0',
        symbol: GlobalCurrency?.name,
      },
      {
        label: t('students.stats.totalFact'),
        value: formatNumber(formatTotalSumma(fullTotal?.total_fact, 0)) || '0',
        symbol: GlobalCurrency?.name,
      },
      {
        label: t('students.stats.difference'),
        value: formatNumber(formatTotalSumma(fullTotal?.total_plan_fact, 0)) || '0',
        symbol: GlobalCurrency?.name,
      },
      {
        label: t('students.stats.activeStudents'),
        value: formatNumber(activeCount),
        symbol: '',
      },
      {
        label: t('students.stats.passiveStudents'),
        value: formatNumber(passiveCount),
        symbol: '',
      },
    ]
  }, [studentList, fullTotal, t])

  const interval = months?.length > 50 ? 5 : months?.length > 10 ? 1 : 0

  const options = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#111827', fontSize: 12 },
      shadowColor: 'rgba(255, 26, 26, 0.1)',
      shadowBlur: 10,
      formatter: (params) => {
        let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name}</div>`
        params.forEach(item => {
          res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                      ${item.seriesName}
                    </div>
                    <div class="font-medium text-slate-900">${Number(item.value ?? 0).toLocaleString('ru-RU')} ${GlobalCurrency?.name || ''}</div>
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
      data: [planLabel, factLabel, diffLabel]
    },
    dataZoom: [{ type: 'slider', show: false, start: zoomRange[0], end: zoomRange[1] }],
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#0F0F0F', fontSize: 12, interval, rotate: 0 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value) => {
          if (value === 0) return '0'
          const abs = Math.abs(value)
          if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} ${billion}`
          if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} ${million}`
          if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} ${thousand}`
          return `${value}`
        }
      }
    },
    series: [
      {
        name: planLabel,
        type: 'bar',
        data: planData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#38bdf8' }
      },
      {
        name: factLabel,
        type: 'bar',
        data: factData,
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#fbab7e' }
      },
      {
        name: diffLabel,
        type: 'line',
        data: diffData,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10b981', type: 'dashed' },
        itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' }
      }
    ]
  }), [zoomRange, months, planData, factData, diffData, interval, planLabel, factLabel, diffLabel, billion, million, thousand])

  if (!mounted) return null
  if (!appStore.isDonoSchool) return null

  return (
    <div className="w-full bg-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-bold text-[#111827]">
            {t('students.title')}, {GlobalCurrency?.name || ''}
          </h2>
          <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
            <HelpCircle className="size-3 text-neutral-400" />
          </div>
        </div>
        <div className="items-center rounded-md">
          <button
            type="button"
            onClick={() => indicatorsStore.setState('accounting', 'accrual')}
            className={`text-neutral-700 border rounded-l-md cursor-pointer text-sm p-2 w-52 ${indicatorsStore.accounting === 'accrual' ? 'border-primary rounded-l-md' : ''}`}
          >
            {t('students.accrualMethod')}
          </button>
          <button
            type="button"
            onClick={() => indicatorsStore.setState('accounting', 'cash')}
            className={`text-neutral-700 border rounded-r-md cursor-pointer text-sm p-2 w-52 ${indicatorsStore.accounting === 'cash' ? 'border-primary rounded-r-md' : ''}`}
          >
            {t('students.cashMethod')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        {(isLoading || isFetching || isPending) && (
          <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
              <span className="text-sm text-neutral-600">{t('common.loading')}</span>
            </div>
          </div>
        )}

        {/* Statistics panel */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-7 pr-4 mt-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <span className="text-xs 2xl:text-sm font-medium text-neutral-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                {stat.label}
              </span>
              <div className="flex flex-col items-end">
                <span className={cn("text-xl xl:text-2xl 2xl:text-3xl font-bold leading-none mb-1 text-slate-900")} suppressHydrationWarning>
                  {stat.value}
                  {stat.symbol ? <span className="text-base font-medium text-neutral-500 ml-1">{stat.symbol}</span> : null}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart container */}
        <div className="flex-1 overflow-visible!">
          <div className="mb-4 pt-4 px-2 overflow-visible!">
            <CustomMonthSlider value={zoomRange} onChange={setZoomRange} />
          </div>
          <div className="h-[450px] w-full">
            <ReactECharts
              ref={chartRef}
              option={options}
              style={{ height: '100%', width: 'fit' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(Students)
