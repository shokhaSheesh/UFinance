'use client'

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
import { useCallback, useMemo } from 'react'
import { formatDebtValue, readDebtsResponse, sortDebts } from './utils'

// Дебиторка — оранжевая, кредиторка — красная; просроченная часть насыщеннее
const PALETTE = {
  debitorka: { expired: '#F59E0B', rest: '#FCD34D', dot: '#F59E0B' },
  kreditorka: { expired: '#EF4444', rest: '#FCA5A5', dot: '#EF4444' },
}

const METHODS = {
  debitorka: 'get_counterparties_debitorka',
  kreditorka: 'get_counterparties_kreditorka',
}

// Сколько строк помещается в область графика — остальные прокручиваются
const VISIBLE_ROWS = 8
const CHART_HEIGHT = 420

/**
 * Горизонтальный график долгов по контрагентам: общая сумма и просроченная часть.
 * @param {'debitorka'|'kreditorka'} type — вид долга
 */
const DebtChart = observer(({ type }) => {
  const t = useTranslations('Indicators')
  const mounted = useMounted()
  const colors = PALETTE[type]

  const {
    rangeMonth,
    projects,
    deals,
    periodType,
    currencyCode,
    debtsSort,
    debtsLegalEntities,
    debtsShowValues,
    debtsRounding,
  } = indicators

  const filterData = useMemo(
    () => ({
      // бэкенд сортировать не умеет — сортируем на клиенте, поэтому флаг постоянный
      // и смена сортировки не вызывает новый запрос
      expired: true,
      period_from: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
      period_to: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
      period_type: periodType,
      legal_entity_ids: debtsLegalEntities,
      project_ids: projects,
      sellingDealId: deals,
      currencyCode,
    }),
    [rangeMonth?.start, rangeMonth?.end, periodType, currencyCode, debtsLegalEntities, projects, deals]
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [METHODS[type], filterData],
    queryFn: () => apiClient.invokeFunction({ method: METHODS[type], data: filterData }),
    select: (res) => readDebtsResponse(res, t('debts.noName')),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const items = useMemo(() => sortDebts(data?.items || [], debtsSort), [data?.items, debtsSort])

  const formatValue = useCallback(
    (value) => formatDebtValue(value, debtsRounding),
    [debtsRounding]
  )

  const expiredLabel = t('debts.expired')
  const notExpiredLabel = t('debts.notExpired')

  const option = useMemo(() => {
    // ECharts рисует категории снизу вверх — разворачиваем, чтобы крупнейший долг был сверху
    const names = items.map((item) => item.name)
    const expiredData = items.map((item) => item.expired)
    const restData = items.map((item) => item.total - item.expired)

    const zoomEnd = items.length > VISIBLE_ROWS ? (VISIBLE_ROWS / items.length) * 100 : 100

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: (params) => {
          const index = params?.[0]?.dataIndex
          const item = items[index]
          if (!item) return ''
          return `
            <div style="
              background: ${colors.expired};
              color: #fff;
              padding: 10px 14px;
              border-radius: 8px;
              font-family: sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
              <div style="font-size: 15px; font-weight: 600; opacity: 0.95; margin-bottom: 6px;">${item.name}</div>
              <div style="font-size: 13px; font-weight: 500; opacity: 0.9;">${t(`debts.${type}.total`)}</div>
              <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${formatValue(item.total)}</div>
              <div style="font-size: 13px; font-weight: 500; opacity: 0.9;">${expiredLabel}</div>
              <div style="font-size: 20px; font-weight: 700;">${formatValue(item.expired)}</div>
            </div>
          `
        },
      },
      grid: { left: 8, right: 110, top: 10, bottom: 70, containLabel: true },
      xAxis: {
        type: 'value',
        position: 'bottom',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#475569',
          fontSize: 13,
          fontWeight: 600,
          rotate: 45,
          formatter: (value) => formatValue(value),
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#0f172a',
          fontSize: 15,
          fontWeight: 600,
          width: 190,
          overflow: 'truncate',
        },
      },
      dataZoom: [
        {
          type: 'inside',
          yAxisIndex: 0,
          start: 0,
          end: zoomEnd,
          zoomOnMouseWheel: false,
          moveOnMouseWheel: true,
          moveOnMouseMove: false,
        },
        {
          type: 'slider',
          yAxisIndex: 0,
          start: 0,
          end: zoomEnd,
          show: items.length > VISIBLE_ROWS,
          width: 6,
          right: 6,
          top: 10,
          bottom: 60,
          showDetail: false,
          brushSelect: false,
          borderColor: 'transparent',
          backgroundColor: '#f1f5f9',
          fillerColor: '#cbd5e1',
          handleSize: 0,
        },
      ],
      series: [
        {
          name: expiredLabel,
          type: 'bar',
          stack: 'debt',
          barMaxWidth: 26,
          data: expiredData,
          itemStyle: { color: colors.expired },
        },
        {
          name: notExpiredLabel,
          type: 'bar',
          stack: 'debt',
          barMaxWidth: 26,
          data: restData,
          itemStyle: { color: colors.rest },
          // подпись общей суммы ставим на последнем сегменте — она всегда в конце полосы
          label: {
            show: debtsShowValues,
            position: 'right',
            distance: 10,
            color: '#0f172a',
            fontSize: 15,
            fontWeight: 700,
            formatter: ({ dataIndex }) => formatValue(items[dataIndex]?.total),
          },
        },
      ],
    }
  }, [items, colors, debtsShowValues, formatValue, expiredLabel, notExpiredLabel, type, t])

  const isEmpty = !isLoading && items.length === 0

  return (
    <div className="relative border border-neutral-200 rounded-lg p-5">
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
          <Loader />
        </div>
      )}

      {/* Заголовок карточки */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-neutral-900">
          {t(`debts.${type}.title`)}
          {mounted && GlobalCurrency?.name ? `, ${GlobalCurrency.name}` : ''}
        </h3>
        <span
          className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help"
          title={t(`debts.${type}.hint`)}
        >
          <HelpCircle className="size-3 text-neutral-400" />
        </span>
      </div>

      {/* Итоги: общая и просроченная сумма */}
      <div className="flex flex-wrap items-start gap-x-14 gap-y-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
            <span className="size-3 rounded-full" style={{ background: colors.rest }} />
            {t(`debts.${type}.total`)}:
          </div>
          <div className="text-3xl font-bold text-neutral-900 mt-1">
            {formatValue(data?.total)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
            <span className="size-3 rounded-full" style={{ background: colors.dot }} />
            {expiredLabel}:
          </div>
          <div className="text-3xl font-bold text-neutral-900 mt-1">
            {formatValue(data?.expired)}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div
          className="flex items-center justify-center text-base font-medium text-neutral-400"
          style={{ height: CHART_HEIGHT }}
        >
          {t('debts.empty')}
        </div>
      ) : (
        <ReactECharts
          // пересоздаём инстанс при смене числа строк — иначе dataZoom держит старый диапазон
          key={items.length}
          option={option}
          notMerge
          style={{ height: CHART_HEIGHT, width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      )}
    </div>
  )
})

export default DebtChart
