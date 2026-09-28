'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestInfinite } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { formatDeals } from '@/modules/deals/deals-list'
import { sealDeal } from '@/store/saleDeal.store'
import { StringtoNumber } from '@/utils/helpers'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Briefcase, Loader2, Search, X } from 'lucide-react'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Сделки на телефоне.
 *
 * На большом экране это таблица со столбцами «поступило» и «отгружено» в
 * процентах. Здесь сделка — карточка списка: монограмма контрагента,
 * название и статус, сумма справа, а ход сделки показан двумя полосками
 * под строкой. Метод учёта и поиск — над списком, остальные фильтры
 * остаются на компьютере.
 */

/** Цвет статуса: новые синим, завершённые зелёным, отменённые серым. */
const statusTone = (status = '') => {
  const value = status.toLowerCase()
  if (value.includes('заверш') || value.includes('выполн')) return 'bg-emerald-50 text-emerald-700'
  if (value.includes('отмен')) return 'bg-slate-100 text-slate-500'
  if (value.includes('работ')) return 'bg-amber-50 text-amber-700'
  return 'bg-[#e8f1ff] text-[#0e73f6]'
}

/** Полоска хода сделки: сколько получено и сколько отгружено. */
const Progress = ({ label, value, tone }) => {
  const percent = Math.min(Number(String(value).replace('%', '')) || 0, 100)
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-slate-400">{label}</span>
        <span className="shrink-0 text-[11px] font-semibold text-slate-500 tabular-nums">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

const MobileDealsPage = observer(() => {
  const t = useTranslations('Deals')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const mounted = useMounted()

  const { dealsMethod, search: searchValue, dateRange, amountFrom, amountTo, profitFrom, profitTo,
    selectedCounterparties, selectedProjects, status, setState } = sealDeal

  const dateRanges = useMemo(() => toJS(dateRange), [dateRange])

  const filters = useMemo(
    () => ({
      limit: 20,
      search: searchValue,
      from_date: dateRanges?.start ? moment(dateRanges.start).format('YYYY-MM-DD') : null,
      to_date: dateRanges?.end ? moment(dateRanges.end).format('YYYY-MM-DD') : null,
      amount_from: StringtoNumber(amountFrom) || null,
      amount_to: StringtoNumber(amountTo) || null,
      profit_from: StringtoNumber(profitFrom) || null,
      profit_to: StringtoNumber(profitTo) || null,
      counterparty_ids: selectedCounterparties?.length > 0 ? selectedCounterparties : null,
      project_ids: selectedProjects?.length > 0 ? selectedProjects : null,
      status: status?.length > 0 ? status : null,
      accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
      isCalculation: false,
    }),
    [searchValue, dateRanges, amountFrom, amountTo, profitFrom, profitTo, selectedCounterparties, selectedProjects, status, dealsMethod, t]
  )

  // Запрос отстаёт от ввода на секунду — как на большом экране
  const [requestFilters, setRequestFilters] = useState(filters)
  useEffect(() => {
    const timer = setTimeout(() => setRequestFilters(filters), 700)
    return () => clearTimeout(timer)
  }, [filters])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUcodeRequestInfinite({
    method: 'get_sales_list_simple',
    data: requestFilters,
    querySetting: { staleTime: 0 },
  })

  const deals = useMemo(
    () => formatDeals(data?.pages?.flatMap((page) => page?.data?.data || []) || [], t),
    [data, t]
  )
  const summary = useMemo(() => data?.pages?.[0]?.data?.summary, [data])
  const profit = dealsMethod === 'accrual_method' ? summary?.accrual_profit : summary?.cash_profit

  const sentinelRef = useRef(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const currency = mounted ? GlobalCurrency?.name : ''

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('pageTitle')} />

        {/* Метод учёта */}
        <div className="flex rounded-2xl bg-white p-1">
          {[
            { value: 'accrual_method', label: t('methods.accrual') },
            { value: 'cash_method', label: t('methods.cash') },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setState('dealsMethod', item.value)}
              className={cn(
                'min-w-0 flex-1 truncate rounded-xl py-2.5 text-[13px] font-semibold',
                dealsMethod === item.value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Поиск */}
        <div className="mt-2.5 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={searchValue || ''}
            onChange={(event) => setState('search', event.target.value || null)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {searchValue && (
            <button type="button" onClick={() => setState('search', null)} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Итоги */}
        {mounted && summary && (
          <div className="mt-2.5 grid grid-cols-3 divide-x divide-slate-100 rounded-[20px] bg-white px-4 py-3">
            <div className="min-w-0 pr-2">
              <div className="truncate text-[11px] text-slate-400">{tm('deals.count')}</div>
              <div className="mt-1 truncate text-[15px] font-bold text-slate-900 tabular-nums">
                {summary?.total_count ?? deals.length}
              </div>
            </div>
            <div className="min-w-0 px-2">
              <div className="truncate text-[11px] text-slate-400">{tm('deals.amount')}</div>
              <div className="mt-1 truncate text-[15px] font-bold text-slate-900 tabular-nums">
                <Money value={summary?.total_summa ?? 0} currency="" />
              </div>
            </div>
            <div className="min-w-0 pl-2">
              <div className="truncate text-[11px] text-slate-400">{tm('deals.profit')}</div>
              <div
                className={cn(
                  'mt-1 truncate text-[15px] font-bold tabular-nums',
                  (profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                <Money value={profit ?? 0} currency="" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Список сделок */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !deals.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !deals.length && <MEmpty icon={Briefcase} title={tm('deals.empty')} />}

        <div className="flex flex-col gap-2.5">
          {deals.map((deal) => (
            <MCard key={deal.guid} className="p-4" onClick={() => router.push(`/m/deals/${deal.guid}`)}>
              <button type="button" className="w-full text-left" onClick={() => router.push(`/m/deals/${deal.guid}`)}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[14px] font-bold text-slate-500">
                    {(deal.kontragent?.nazvanie || '?').trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{deal.nazvanie}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {deal.kontragent?.nazvanie}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-bold text-slate-900 tabular-nums">
                      <Money value={deal.summa_sdelki} currency={currency} />
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {deal.data_nachala ? moment(deal.data_nachala).format('DD.MM.YYYY') : ''}
                    </span>
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', statusTone(deal.status))}>
                    {deal.status}
                  </span>
                  <Progress label={tm('deals.received')} value={deal.postupilo} tone="bg-emerald-500" />
                  <Progress label={tm('deals.shipped')} value={deal.otgruzheno} tone="bg-[#0e73f6]" />
                </div>
              </button>
            </MCard>
          ))}
        </div>

        <div ref={sentinelRef} className="h-10">
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default MobileDealsPage
