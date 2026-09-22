'use client'

import HintQuestion from '@/components/shared/HintQuestion'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { indicators } from '@/store/indicatos.store'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import { useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import StatTiles from '../shared/StatTiles'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

// Сколько сделок берём для разбивки — больше за период обычно не бывает;
// если бывает, внизу честно пишем, по скольким посчитано
const LIMIT = 500

const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'

/**
 * «Сделки по статусам» — воронка продаж за период: сколько сделок в каждом
 * статусе, на какую сумму и какая часть уже оплачена.
 *
 * В «Показателях» не было ничего про продажи как процесс — только деньги.
 * Руководителю важно видеть, сколько денег «висит» в сделках, которые ещё в
 * работе или ждут оплаты. Цвет статуса — из справочника статусов (как на
 * странице сделок).
 */
const DealsByStatus = () => {
  const t = useTranslations('Indicators')
  const mounted = useMounted()
  const { rangeMonth, projects } = indicators

  const filterData = {
    limit: LIMIT,
    page: 1,
    from_date: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
    to_date: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
    project_ids: projects?.length ? projects : null,
    // бэк ждёт название метода по-русски — как в списке сделок
    accounting_method: 'Метод начисления',
    isCalculation: false,
  }

  const { data, isFetching } = useQuery({
    queryKey: ['indicators_deals_by_status', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'get_sales_list_simple', data: filterData })),
    select: (res) => ({ items: res?.data?.data || [], summary: res?.data?.summary }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const { groups, totals } = useMemo(() => {
    const map = new Map()
    ;(data?.items || []).forEach((deal) => {
      const name = deal?.Status?.[0] || t('dealsByStatus.noStatus')
      const sum = Number(deal?.total_products_summa) || 0
      const paid = (sum * (Number(deal?.receipts_percentage) || 0)) / 100
      const group = map.get(name) || { name, color: deal?.color || '#64748b', count: 0, sum: 0, paid: 0 }
      group.count += 1
      group.sum += sum
      group.paid += Math.min(paid, sum)
      map.set(name, group)
    })
    const list = [...map.values()].sort((a, b) => b.sum - a.sum)
    const sum = list.reduce((acc, g) => acc + g.sum, 0)
    const paid = list.reduce((acc, g) => acc + g.paid, 0)
    const count = list.reduce((acc, g) => acc + g.count, 0)
    return { groups: list, totals: { sum, paid, count } }
  }, [data, t])

  const currency = mounted ? GlobalCurrency?.name : ''
  const max = Math.max(...groups.map((g) => g.sum), 1)
  const paidPercent = totals.sum ? Math.round((totals.paid / totals.sum) * 100) : 0
  const totalCount = data?.summary?.count ?? totals.count

  const tiles = [
    { label: t('dealsByStatus.count'), value: String(totalCount) },
    { label: t('dealsByStatus.sum'), value: money(totals.sum), symbol: currency },
    { label: t('dealsByStatus.average'), value: money(totals.count ? totals.sum / totals.count : 0), symbol: currency },
    { label: t('dealsByStatus.paid'), value: money(totals.paid), symbol: currency },
  ]

  return (
    <div className="relative w-full bg-white p-6">
      {isFetching && (
        <div className="absolute inset-0 z-100 flex items-center justify-center rounded-xl bg-white/80">
          <Loader />
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('dealsByStatus.title')}
          {currency ? `, ${currency}` : ''}
        </h2>
        <span className="flex size-5 cursor-help items-center justify-center rounded-full bg-slate-100" title={t('dealsByStatus.hint')}>
          <HintQuestion className="size-3 text-slate-400" />
        </span>
      </div>

      {groups.length === 0 && !isFetching ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">{t('dealsByStatus.noData')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <StatTiles items={tiles} />

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-slate-500" />
              {t('dealsByStatus.paidPart')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-slate-500/25" />
              {t('dealsByStatus.unpaidPart')}
            </span>
            {totals.sum > 0 && <span className="ml-auto">{t('dealsByStatus.paidHint', { percent: paidPercent })}</span>}
          </div>

          <ol className="flex flex-col">
            {groups.map((group) => {
              const width = (group.sum / max) * 100
              const paidWidth = group.sum ? (group.paid / group.sum) * 100 : 0
              return (
                <li
                  key={group.name}
                  className="grid min-h-[52px] grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4 border-b border-slate-100 last:border-b-0"
                  title={`${group.name}: ${money(group.sum)} ${currency || ''} · ${t('dealsByStatus.paidPart').toLowerCase()} ${money(group.paid)}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: group.color }} />
                    <span className="truncate text-sm font-medium text-slate-700">{group.name}</span>
                  </span>
                  {/* Полоса: вся — сумма сделок статуса, тёмная часть — уже оплачено */}
                  <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="flex h-full" style={{ width: `${width}%` }}>
                      <span className="h-full" style={{ width: `${paidWidth}%`, background: group.color }} />
                      <span className="h-full flex-1" style={{ background: group.color, opacity: 0.25 }} />
                    </span>
                  </span>
                  <span className="flex min-w-[140px] flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{money(group.sum)}</span>
                    <span className="text-xs tabular-nums text-slate-500">{t('dealsByStatus.dealsCount', { count: group.count })}</span>
                  </span>
                </li>
              )
            })}
          </ol>

          {totalCount > totals.count && (
            <p className="text-xs text-slate-400">{t('dealsByStatus.partial', { shown: totals.count, total: totalCount })}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default observer(DealsByStatus)
