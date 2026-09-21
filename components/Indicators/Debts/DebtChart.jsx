'use client'

import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import HintQuestion from '@/components/shared/HintQuestion'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { formatDebtValue, readDebtsResponse, sortDebts } from './utils'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

// Просроченная часть — красная в обоих графиках (это то, на что надо смотреть);
// остальной долг спокойный: дебиторка синяя, кредиторка серая
const PALETTE = {
  debitorka: { expired: '#ef4444', rest: '#93c5fd', dot: '#3b82f6' },
  kreditorka: { expired: '#ef4444', rest: '#cbd5e1', dot: '#64748b' },
}

const METHODS = {
  debitorka: 'get_counterparties_debitorka',
  kreditorka: 'get_counterparties_kreditorka',
}

// Сколько строк видно без прокрутки
const VISIBLE_ROWS = 8
const ROW_HEIGHT = 52

/**
 * Долги по контрагентам — рейтинг строками: имя, полоса и одна сумма справа.
 *
 * Раньше это был график ECharts, где сумма стояла и в конце каждой полосы,
 * и ещё раз на оси под графиком повёрнутыми числами — вдвое больше цифр, чем
 * нужно. Теперь оси нет: длины полос сравниваются между собой, а под суммой
 * мелко — просроченная часть, если она есть.
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
      // «Просроченная» — отдельная выборка на бэке, поэтому смена сортировки
      // меняет queryKey и данные перезапрашиваются
      expired: debtsSort === 'expired',
      period_from: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
      period_to: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
      period_type: periodType,
      legal_entity_ids: debtsLegalEntities,
      project_ids: projects,
      sellingDealId: deals,
      currencyCode,
    }),
    [rangeMonth?.start, rangeMonth?.end, periodType, currencyCode, debtsLegalEntities, projects, deals, debtsSort]
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [METHODS[type], filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: METHODS[type], data: filterData })),
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
  const currency = mounted ? GlobalCurrency?.name : ''

  // Длина полосы — доля от самого крупного долга в списке
  const max = Math.max(...items.map((item) => Number(item.total) || 0), 1)
  const total = Number(data?.total) || 0
  const expiredTotal = Number(data?.expired) || 0
  const expiredShare = total ? Math.round((expiredTotal / total) * 100) : 0

  const isEmpty = !isLoading && items.length === 0

  return (
    <div className="relative flex min-w-0 flex-col rounded-xl border border-slate-200 p-5">
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
          <Loader />
        </div>
      )}

      {/* Заголовок карточки */}
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          {t(`debts.${type}.title`)}
          {currency ? `, ${currency}` : ''}
        </h3>
        <span
          className="flex size-5 cursor-help items-center justify-center rounded-full bg-slate-100"
          title={t(`debts.${type}.hint`)}
        >
          <HintQuestion className="size-3 text-slate-400" />
        </span>
      </div>

      {/* Итоги: общая сумма и просроченная часть с долей */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span className="size-2.5 rounded-full" style={{ background: colors.dot }} />
            {t(`debts.${type}.total`)}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{formatValue(data?.total)}</div>
          {items.length > 0 && (
            <div className="text-xs text-slate-500">{t('debts.counterparties', { count: items.length })}</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span className="size-2.5 rounded-full" style={{ background: colors.expired }} />
            {expiredLabel}
          </div>
          <div className={cn('mt-1 text-2xl font-semibold tabular-nums', expiredTotal ? 'text-red-600' : 'text-slate-900')}>
            {formatValue(data?.expired)}
          </div>
          {total > 0 && <div className="text-xs text-slate-500">{t('debts.share', { percent: expiredShare })}</div>}
        </div>
      </div>

      {/* Легенда полос */}
      {!isEmpty && (
        <div className="mb-2 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: colors.expired }} />
            {expiredLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: colors.rest }} />
            {notExpiredLabel}
          </span>
        </div>
      )}

      {isEmpty ? (
        <div
          className="flex items-center justify-center text-sm text-slate-400"
          style={{ height: VISIBLE_ROWS * ROW_HEIGHT }}
        >
          {t('debts.empty')}
        </div>
      ) : (
        <ol className="flex flex-col overflow-y-auto" style={{ maxHeight: VISIBLE_ROWS * ROW_HEIGHT }}>
          {items.map((item, index) => {
            const itemTotal = Number(item.total) || 0
            const itemExpired = Math.min(Number(item.expired) || 0, itemTotal)
            const width = (itemTotal / max) * 100
            const expiredWidth = itemTotal ? (itemExpired / itemTotal) * 100 : 0
            return (
              <li
                key={item.guid ?? `${item.name}-${index}`}
                className="grid items-center gap-3 border-b border-slate-100 last:border-b-0 grid-cols-[minmax(0,160px)_1fr_auto]"
                style={{ minHeight: ROW_HEIGHT }}
                title={`${item.name}: ${formatValue(itemTotal)}${itemExpired ? ` · ${expiredLabel.toLowerCase()} ${formatValue(itemExpired)}` : ''}`}
              >
                <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="flex h-full" style={{ width: `${width}%` }}>
                    {itemExpired > 0 && (
                      <span className="h-full" style={{ width: `${expiredWidth}%`, background: colors.expired }} />
                    )}
                    <span className="h-full flex-1" style={{ background: colors.rest }} />
                  </span>
                </span>
                {debtsShowValues ? (
                  <span className="flex min-w-[96px] flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{formatValue(itemTotal)}</span>
                    {itemExpired > 0 && (
                      <span className="text-xs tabular-nums text-red-600">
                        {t('debts.expiredShort', { value: formatValue(itemExpired) })}
                      </span>
                    )}
                  </span>
                ) : (
                  <span />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
})

export default DebtChart
