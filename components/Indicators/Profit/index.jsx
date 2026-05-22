"use client"

import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import useMounted from '../../../hooks/useMounted'
import { apiClient } from '../../../lib/api/ucode/base'
import { queryClient } from '../../../lib/queryClient'
import { indicators } from '../../../store/indicatos.store'
import { operationFilterStore } from '../../../store/operationFilter.store'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import { STATIC_PROFIT_DATA } from '../constants/staticChartData'
import CustomMonthSlider from '../shared/CustomMonthSlider'
import { localizeMonthTitle } from '../utils/localizeMonth'


const findRowById = (rows, id) => (rows || []).find((r) => r?.id === id)

const Profit = () => {
  const t = useTranslations('Indicators')
  const locale = useLocale()
  const chartRef = useRef(null);
  const mounted = useMounted()
  const [zoomRange, setZoomRange] = useState([0, 100]); // [start, end] percentage
  const indicatorsStore = indicators

  const billion = t('common.billion')
  const million = t('common.million')
  const thousand = t('common.thousand')
  const incomeLabel = t('profit.series.income')
  const expensesLabel = t('profit.series.expenses')
  const netProfitLabel = t('profit.series.netProfit')
  const dividendsLabel = t('profit.series.dividends')

  const filterData = {
    periodStartDate: moment(indicatorsStore.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicatorsStore.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicatorsStore.periodType,
    userCurrencyCode: GlobalCurrency.code,
    accounting_method: indicatorsStore.profitableclientsMethod,
    currencyCode: indicators?.currencyCode,
    accountId: indicatorsStore.accounts,
    sellingDealId: indicatorsStore?.deals,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }

  const filterOperationData = useMemo(() => {
    const data = { limit: 50 }

    if (indicatorsStore.profitableclientsMethod === 'cash') {
      data.paymentConfirm = true
      data.paymentNotConfirm = false
      data.accrualConfirm = true
      data.accrualNotConfirm = true
      data.paymentDateStart = filterData.periodStartDate
      data.paymentDateEnd = filterData.periodEndDate
      data.accrualDateStart = ''
      data.accrualDateEnd = ''
    }

    if (indicatorsStore.profitableclientsMethod === 'accrual') {
      data.paymentConfirm = true
      data.paymentNotConfirm = true
      data.accrualConfirm = true
      data.accrualNotConfirm = false
      data.accrualDateStart = filterData.periodStartDate
      data.accrualDateEnd = filterData.periodEndDate
      data.paymentDateStart = ''
      data.paymentDateEnd = ''
    }

    return data
  }, [indicatorsStore.profitableclientsMethod, filterData.periodStartDate, filterData.periodEndDate])

  const { data: apiProfitData, isLoading, isFetching, isPending } = useQuery({
    queryKey: ["profit_indicators", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "profit_and_loss", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
  })

  // Fallback to static data if API returns no data
  const profitAndLossDataList = apiProfitData || STATIC_PROFIT_DATA

  const rows = useMemo(() => {
    const list = profitAndLossDataList?.rows || []

    // Har bir node ichidan leaf id larni yig'ib chiqadi
    // (details bo'lmagan va id sida raqam bo'lgan objectlar)
    const collectLeafIds = (node) => {
      const hasChildren = node?.details && node.details.length > 0

      if (!hasChildren) {
        if (String(node?.id)?.match(/\d+/)) {
          return [node.id]
        }
        return []
      }

      return node.details.flatMap(child => collectLeafIds(child))
    }

    // tip esa har doim root (top-level) item asosida hisoblanadi
    const getTip = (rootItem) => {
      let tips = []
      const income =
        rootItem?.name === "income" ||
        rootItem?.id === "income" ||
        rootItem?.type === "income"
      const expenses =
        rootItem?.name === "expenses" ||
        rootItem?.id === "expenses" ||
        rootItem?.type === "expenses"

      if (indicatorsStore.profitableclientsMethod === 'accrual') {
        tips.push("Отгрузка")
      }
      if (expenses) {
        tips = ["Выплата", "Кредит", "Начисление"]
      }
      if (income) {
        tips = [...tips, "Поступление", "Кредит", "Начисление"]
      }
      if (!income && !expenses) {
        tips = [...tips, "Выплата", "Поступление", "Дебет", "Кредит", "Начисление"]
      }
      return tips
    }

    // Har bir node va uning details ichidagi childlarga filterdata qo'shadi
    const enrichNode = (node, rootItem) => {
      const enriched = {
        ...node,
        filterdata: {
          ids: collectLeafIds(node),
          tip: getTip(rootItem),
        },
      }

      if (node.details && node.details.length > 0) {
        enriched.details = node.details.map(child => enrichNode(child, rootItem))
      }

      return enriched
    }

    // Top-level: details bo'lmaganlar oldingi (details bor) sibling lardan ids ni meros oladi
    const accumulatedIds = []

    return list.map((item) => {
      const hasChildren = item.details && item.details.length > 0

      if (hasChildren) {
        const enriched = enrichNode(item, item)
        accumulatedIds.push(...enriched.filterdata.ids)
        return enriched
      }

      // details yo'q top-level item — accumulated idlarni oladi
      return {
        ...item,
        filterdata: {
          ids: [...accumulatedIds],
          tip: getTip(item),
        },
      }
    })
  }, [profitAndLossDataList, indicatorsStore.profitableclientsMethod])


  const { months, incomeData, expenseData, netProfitData, dividendData, incomeTotal,
    expenseTotal,
    dividendsTotal } = useMemo(() => {
      const legend = profitAndLossDataList?.legend || []
      const rows = profitAndLossDataList?.rows || []

      const keys = legend.map((l) => l?.key).filter(Boolean)
      const titles = legend.map((l) => localizeMonthTitle(locale, l.startDate))


      const revenueRow = findRowById(rows, 'revenue')
      const expensesRow = findRowById(rows, 'expenses')
      const netProfitRow = findRowById(rows, 'net-profit')
      const dividendsRow = findRowById(rows, 'dividends')

      const readValues = (row) => {
        const src = row?.values || row?.months || {}
        return keys.map((k) => Number(src?.[k] ?? 0))
      }

      return {
        months: titles,
        incomeData: readValues(revenueRow),
        expenseData: readValues(expensesRow),
        netProfitData: readValues(netProfitRow),
        dividendData: readValues(dividendsRow),
        incomeTotal: revenueRow?.totalValue,
        expenseTotal: expensesRow?.totalValue,
        dividendsTotal: dividendsRow?.totalValue
      }
    }, [profitAndLossDataList, locale])

  const handleIncomePress = useCallback(() => {
    const filterdata = {
      tip: rows?.[0]?.filterdata?.tip,
      chart_of_accounts_ids: rows?.[0]?.filterdata?.ids,
      ...filterOperationData
    }
    operationFilterStore.setAutoFilter(filterdata)
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
    if (typeof window !== 'undefined') {
      window.open('/operations', '_blank')
    }
  }, [rows, filterOperationData])

  const handleExpensePress = useCallback(() => {
    const filterdata = {
      tip: rows?.[1]?.filterdata?.tip,
      chart_of_accounts_ids: rows?.[1]?.filterdata?.ids,
      ...filterOperationData
    }
    operationFilterStore.setAutoFilter(filterdata)
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
    if (typeof window !== 'undefined') {
      window.open('/operations', '_blank')
    }
  }, [rows, filterOperationData])

  const stats = useMemo(() => {
    const netProfitTotal = profitAndLossDataList?.netProfit ?? (incomeTotal - expenseTotal)
    const dividendTotal = dividendsTotal
    const margin = incomeTotal ? (netProfitTotal / incomeTotal) * 100 : 0

    return [
      { label: t('profit.stats.income'), value: formatNumber(formatTotalSumma(incomeTotal, 0)) || 0, symbol: GlobalCurrency.name, plan: '0', color: 'text-slate-900', planColor: 'text-blue-500', onClick: handleIncomePress },
      { label: t('profit.stats.expenses'), value: formatNumber(formatTotalSumma(expenseTotal, 0)) || 0, symbol: GlobalCurrency.name, plan: '0', color: 'text-slate-900', planColor: 'text-blue-500', onClick: handleExpensePress },
      { label: t('profit.stats.netProfit'), value: formatNumber(formatTotalSumma(netProfitTotal, 0)) || 0, symbol: GlobalCurrency.name, plan: '0', color: 'text-slate-900', planColor: 'text-blue-500', onClick: () => { } },
      { label: t('profit.stats.profitability'), value: formatNumber(margin) || 0, symbol: '%', plan: '0%', color: 'text-slate-900', planColor: 'text-blue-500' },
      { label: t('profit.stats.dividends'), value: formatNumber(formatTotalSumma(dividendTotal, 0)) || 0, symbol: GlobalCurrency.name, plan: '0', color: 'text-slate-900', planColor: 'text-blue-500', onClick: () => { } },
    ]
  }, [profitAndLossDataList, incomeTotal, expenseTotal, dividendsTotal, handleExpensePress, handleIncomePress, t,])
  const inteval = months?.length > 50 ? 5 : months?.length > 10 ? 1 : 0

  const options = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#111827', fontSize: 12 },
      shadowColor: 'rgba(255 26 26 / 0.1)',
      shadowBlur: 10,
      formatter: (params) => {
        let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name}</div>`
        params.forEach(item => {
          res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                      ${item.seriesName}
                    </div>
                    <div class="font-medium text-slate-900">${Number(item.value ?? 0).toLocaleString('ru-RU')} ${GlobalCurrency?.name}</div>
                  </div>`
        })
        return res
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: '#6b7280', fontSize: 12 },
      data: [incomeLabel, expensesLabel, netProfitLabel, dividendsLabel]
    },
    dataZoom: [{
      type: 'slider',
      show: false,
      start: zoomRange[0],
      end: zoomRange[1],
    }],
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#0F0F0F', fontSize: 12, interval: inteval, rotate: 0 }
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
        name: incomeLabel,
        type: 'bar',
        data: incomeData,
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#38bdf8'
        }
      },
      {
        name: expensesLabel,
        type: 'bar',
        data: expenseData,
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#fbab7e'
        }
      },
      {
        name: netProfitLabel,
        type: 'line',
        data: netProfitData,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10b981', type: 'dashed' },
        itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' }
      },
      {
        name: dividendsLabel,
        type: 'line',
        data: dividendData,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2, color: '#c084fc' },
        itemStyle: { color: '#920DF8', borderWidth: 2, borderColor: '#fff' }
      }
    ]
  }), [zoomRange, months, incomeData, expenseData, netProfitData, dividendData, inteval, incomeLabel, expensesLabel, netProfitLabel, dividendsLabel, billion, million, thousand])



  if (!mounted) return null

  return (
    <div className="w-full bg-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-bold text-[#111827]">{t('profit.title')}, {GlobalCurrency?.name || ''}</h2>
          <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
            <HelpCircle className="size-3 text-neutral-400" />
          </div>
        </div>
        <div className="items-center rounded-md">
          <button type="button" onClick={() => indicatorsStore.setState('profitableclientsMethod', 'accrual')} id="income_expenses" className={`text-neutral-700 border rounded-l-md cursor-pointer text-sm p-2  w-52 ${indicatorsStore.profitableclientsMethod === 'accrual' ? 'border-primary rounded-l-md ' : ''}`}>{t('profit.accrualMethod')}</button>
          <button type="button" onClick={() => indicatorsStore.setState('profitableclientsMethod', 'cash')} id="receipts_payments" className={`text-neutral-700 border rounded-r-md cursor-pointer text-sm p-2  w-52 ${indicatorsStore.profitableclientsMethod === 'cash' ? 'border-primary rounded-r-md ' : ''}`}>{t('profit.cashMethod')}</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6  relative">
        {/* Loading Overlay */}
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
              <span className=" text-xs 2xl:text-sm font-medium text-neutral-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                {stat.label}
              </span>
              <div className="flex flex-col items-end">
                <span onClick={stat.onClick} className={cn(" text-xl cursor-pointer xl:text-2xl 2xl:text-3xl font-bold leading-none mb-1", stat.color)} suppressHydrationWarning>
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart container */}
        <div className="flex-1 overflow-visible!">
          <div className="mb-4 pt-4 px-2 overflow-visible!">
            <CustomMonthSlider
              value={zoomRange}
              onChange={setZoomRange}
            />
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

export default observer(Profit)