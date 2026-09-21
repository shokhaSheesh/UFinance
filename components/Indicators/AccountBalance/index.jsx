"use client"

import { AXIS_LABEL, CHART_COLORS, SPLIT_LINE } from '../shared/chartTheme'
import { STATIC_ACCOUNT_BALANCE_DATA } from '@/components/Indicators/constants/staticChartData'
import CustomMonthSlider from '@/components/Indicators/shared/CustomMonthSlider'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { indicators } from '@/store/indicatos.store'
import { formatValueLength } from '@/utils/helpers'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import HintQuestion from '@/components/shared/HintQuestion'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

const ACCOUNT_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#535364', '#0404DE', '#0059FF']

const AccountBalance = () => {
    const t = useTranslations('Indicators')
    const chartRef = useRef(null)
    const [zoomRange, setZoomRange] = useState([0, 50])
    const mounted = useMounted()

    const billion = t('common.billion')
    const million = t('common.million')
    const thousand = t('common.thousand')
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
        queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: "get_my_accounts_daily_balances", data: filterData })),
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

    // Полная дата для подсказки: «12 января 2026, понедельник»
    const monthsFull = t('common.monthNamesFull').split(',')
    const weekdayNames = t('common.weekdayNames').split(',')
    const fullDates = useMemo(() => {
        if (!accountBalanceList?.length) return []
        return (accountBalanceList[0].totalValuesByDays || []).map(d => {
            const dt = new Date(d.date)
            return `${dt.getDate()} ${monthsFull[dt.getMonth()]} ${dt.getFullYear()}, ${weekdayNames[dt.getDay()]}`
        })
    }, [accountBalanceList, monthsFull, weekdayNames])

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

    const options = useMemo(() => { 

        return {
            tooltip: {
                trigger: 'axis',
                // вертикальная линия под курсором — видно, какой день показан
                axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                textStyle: { color: '#111827', fontSize: 12 },
                formatter: (params) => {
                    const title = fullDates[params[0]?.dataIndex] || params[0].name
                    let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${title}</div>`
                    params.forEach(item => {
                        res += `<div class="flex items-center justify-between gap-4 py-0.5">
            <div class="flex items-center gap-2 text-gray-500">
              <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
              ${item.seriesName}
            </div>
            <div class="font-medium text-slate-900">${formatValueLength(item.value, billion, million)} ${GlobalCurrency?.name}</div>
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
                textStyle: { color: '#334155', fontSize: 13 },
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
                // Подписей столько, сколько помещается без наложения (раньше — каждый
                // 10-й день с наклоном, и за год даты налезали друг на друга);
                // конкретный день — в подсказке при наведении
                axisLabel: {
                    ...AXIS_LABEL,
                    interval: 'auto',
                    rotate: 0,
                    formatter: (value) => String(value).replace(/\s\d{2}$/, ''),
                },
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: SPLIT_LINE,
                axisLabel: { ...AXIS_LABEL, formatter: (v) => v === 0 ? '0' : formatValueLength(v, billion, million, thousand) },
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
                    lineStyle: { width: 2, color: CHART_COLORS.balance },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(14, 115, 246, 0.16)' },
                                { offset: 1, color: 'rgba(14, 115, 246, 0.02)' },
                            ],
                        },
                    },
                    itemStyle: { color: CHART_COLORS.balance },
                    ...(todayIndex >= 0 ? {
                        markLine: {
                            symbol: 'none',
                            data: [{
                                xAxis: dates[todayIndex],
                                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1 },
                                label: { show: true, formatter: todayLabel, position: 'insideEndTop', color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
                            }],
                        },
                        markPoint: {
                            data: [{
                                xAxis: dates[todayIndex],
                                yAxis: totalBalanceData[todayIndex],
                                symbol: 'circle',
                                symbolSize: 8,
                                itemStyle: { color: '#fff', borderColor: CHART_COLORS.balance, borderWidth: 2 },
                            }],
                            label: { show: false },
                        },
                    } : {}),
                },
                ...accountSeries,
            ],
        }
    }, [zoomRange, dates, fullDates, totalBalanceData, accountSeries, legendData, todayIndex, totalBalanceLabel, todayLabel, billion, million, thousand])

    // if (!mounted) return null

    return (
        <div className="w-full bg-white relative p-6">
            {/* Loading Overlay */}
            {(isLoading || isFetching || isPending) && (
                <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
                        <span className="text-sm text-neutral-600"><Loader /></span>
                    </div>
                </div>
            )}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{t('accountBalance.title')}, {mounted ? GlobalCurrency?.name : ''}</h2>
                    <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
                        <HintQuestion className="size-3 text-neutral-400" />
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