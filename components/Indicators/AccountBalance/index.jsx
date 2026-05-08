"use client"

import { STATIC_ACCOUNT_BALANCE_DATA } from '@/components/Indicators/constants/staticChartData'
import CustomMonthSlider from '@/components/Indicators/shared/CustomMonthSlider'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'

const ACCOUNT_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#535364', '#0404DE', '#0059FF']

const AccountBalance = () => {
    const t = useTranslations('Indicators')
    const chartRef = useRef(null)
    const [zoomRange, setZoomRange] = useState([0, 50])
    const mounted = useMounted()

    const billion = t('common.billion')
    const million = t('common.million')
    const MONTH_NAMES = t('accountBalance.monthNames').split(',')
    const totalBalanceLabel = t('accountBalance.totalBalance')
    const todayLabel = t('accountBalance.today')


    const { rangeMonth, accounts } = indicators

    const filterData = {
        from_date: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
        to_date: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
        accountId: accounts,
        currencyCode: indicators?.currencyCode
    }

    const { data: apiAccountBalanceList, isLoading, isFetching, isPending } = useQuery({
        queryKey: ["get_my_accounts_daily_balances", filterData],
        queryFn: () => apiClient.invokeFunction({ method: "get_my_accounts_daily_balances", data: filterData }),
        select: (res) => res?.data?.data?.items,
        staleTime: 0,
        cacheTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    })

    // Fallback to static data if API returns no data
    const accountBalanceList = apiAccountBalanceList?.length ? apiAccountBalanceList : STATIC_ACCOUNT_BALANCE_DATA


    // Build dates array from first account's totalValuesByDays
    const dates = useMemo(() => {
        if (!accountBalanceList?.length) return []
        const days = accountBalanceList[0].totalValuesByDays || []
        return days.map(d => {
            const dt = new Date(d.date)
            const day = dt.getDate().toString().padStart(2, '0')
            const month = MONTH_NAMES[dt.getMonth()]
            const year = dt.getFullYear().toString().slice(-2)
            return `${day} ${month} ${year}`
        })
    }, [accountBalanceList, MONTH_NAMES])

    // Compute total balance (sum of all accounts per day) and per-account data
    const { totalBalanceData, accountSeries, legendData } = useMemo(() => {
        if (!accountBalanceList?.length) {
            return { totalBalanceData: [], accountSeries: [], legendData: [totalBalanceLabel] }
        }

        const dayCount = accountBalanceList[0].totalValuesByDays?.length || 0

        // Sum all accounts per day for total
        const total = new Array(dayCount).fill(0)
        accountBalanceList.forEach(acc => {
            acc.totalValuesByDays?.forEach((day, i) => {
                total[i] += day.totalInUserCurrency ?? 0
            })
        })

        const series = accountBalanceList.map((acc, idx) => ({
            name: acc.account.title,
            type: 'line',
            step: 'end',
            data: acc.totalValuesByDays?.map(d => d.totalInUserCurrency ?? 0) || [],
            symbol: 'circle',
            symbolSize: 0,
            showSymbol: false,
            lineStyle: { width: 1.5, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] },
            itemStyle: { color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length], fontSize: 10 },
        }))

        const names = [totalBalanceLabel, ...accountBalanceList.map(a => a.account.title)]

        return { totalBalanceData: total, accountSeries: series, legendData: names }
    }, [accountBalanceList, totalBalanceLabel])

    // Find today's index
    const todayIndex = useMemo(() => {
        if (!accountBalanceList?.length) return -1
        const today = moment().startOf('day')
        const days = accountBalanceList[0].totalValuesByDays || []
        return days.findIndex(d => moment(d.date).isSame(today, 'day'))
    }, [accountBalanceList])

    const inteval = dates?.length > 5000 ? 400 : dates?.length > 1500 ? 300 : dates?.length > 1000 ? 100 : dates?.length > 500 ? 50 : 10

    const options = useMemo(() => {
        const formatValue = (val) => {
            if (!val && val !== 0) return '0'
            const abs = Math.abs(val)
            if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} ${billion}`
            if (abs >= 1_000_000) return `${(Math.round(val / 1_000_000)).toLocaleString('ru-RU')} ${million}`
            return val.toLocaleString('ru-RU')
        }

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
            <div class="font-medium text-slate-900">${formatValue(item.value)}</div>
          </div>`
                    })
                    return res
                }
            },
            grid: { left: '2%', right: '2%', bottom: '10%', top: '10%', containLabel: true },
            legend: {
                bottom: 0,
                left: 'left',
                icon: 'roundRect',
                itemWidth: 14,
                itemHeight: 14,
                textStyle: { color: '#6b7280', fontSize: 14, marginTop: 10 },
                itemStyle: { marginTop: '20px' },
                data: legendData,
                selected: legendData.slice(1).reduce((acc, name) => ({ ...acc, [name]: false }), {}),
            },
            dataZoom: [{ type: 'slider', show: false, start: zoomRange[0], end: zoomRange[1] }],
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { show: false },

                axisTick: { show: false },
                axisLabel: {
                    color: '#0F0F0F', fontSize: 12,
                    interval: inteval, 
                    rotate: 10,
                },
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { color: '#9ca3af', fontSize: 12, formatter: (v) => v === 0 ? '0' : formatValue(v) },
            },
            series: [
                {
                    name: totalBalanceLabel,
                    type: 'line',
                    step: 'end',
                    data: totalBalanceData,
                    symbol: 'circle',
                    symbolSize: 0,
                    showSymbol: true,
                    lineStyle: { width: 2, color: '#22c55e' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(34, 197, 94, 0.2)' },
                                { offset: 1, color: 'rgba(34, 197, 94, 0.02)' },
                            ],
                        },
                    },
                    itemStyle: { color: '#22c55e' },
                    ...(todayIndex >= 0 ? {
                        markLine: {
                            symbol: 'none',
                            data: [{
                                xAxis: dates[todayIndex],
                                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1 },
                                label: { show: true, formatter: todayLabel, position: 'start', color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
                            }],
                        },
                        markPoint: {
                            data: [{
                                xAxis: dates[todayIndex],
                                yAxis: totalBalanceData[todayIndex],
                                symbol: 'circle',
                                symbolSize: 8,
                                itemStyle: { color: '#fff', borderColor: '#22c55e', borderWidth: 2, fontSize: 18 },
                            }],
                            label: { show: false },
                        },
                    } : {}),
                },
                ...accountSeries,
            ],
        }
    }, [zoomRange, dates, totalBalanceData, accountSeries, legendData, todayIndex, inteval, totalBalanceLabel, todayLabel, billion, million])

    // if (!mounted) return null

    return (
        <div className="w-full bg-white relative p-6 rounded-lg mt-6">
            {/* Loading Overlay */}
            {(isLoading || isFetching || isPending) && (
                <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
                        <span className="text-sm text-neutral-600"><Loader /></span>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-bold text-[#111827]">{t('accountBalance.title')}, {mounted ? GlobalCurrency?.name : ''}</h2>
                    <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
                        <HelpCircle className="size-3 text-neutral-400" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="px-2">
                    <CustomMonthSlider value={zoomRange} onChange={setZoomRange} />
                </div>
                <div className="h-[400px] w-full">
                    <ReactECharts
                        ref={chartRef}
                        option={options}
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </div>
        </div>
    )
}

export default observer(AccountBalance)