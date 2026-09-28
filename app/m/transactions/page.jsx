'use client'

import OperationFilters from '@/components/mobile/OperationFilters'
import { FilterPill, MCard, MEmpty, MRow, MScreenHeader, MSkeleton } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useUcodeRequestInfinite } from '@/hooks/useDashboard'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { useOperationsFilters } from '@/modules/operations/hooks/useOperationsFilters'
import { useOperationFilterChips } from '@/modules/operations/list-page/useOperationFilterChips'
import { operationFilterStore } from '@/store/operationFilter.store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Loader2,
  PackageCheck,
  Scale,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Транзакции на телефоне.
 *
 * Не таблица из тринадцати колонок, а лента: итоги периода плитками, ниже —
 * дни, внутри дня белая карточка со строками. У строки значок типа, название
 * и сумма — всё, что видно с расстояния вытянутой руки. Подробности и
 * действия открываются панелью снизу.
 */

/** Значок и цвет по типу операции. */
const TYPE_LOOK = {
  Поступление: { icon: ArrowDownLeft, tone: 'in' },
  Выплата: { icon: ArrowUpRight, tone: 'out' },
  Перемещение: { icon: ArrowLeftRight, tone: 'neutral' },
  Начисление: { icon: Scale, tone: 'neutral' },
  Отгрузка: { icon: Truck, tone: 'neutral' },
  Поставка: { icon: PackageCheck, tone: 'neutral' },
}

/** Небольшая плитка итога. */
const Tile = ({ label, children, tone = 'neutral', className }) => (
  <div className={cn('flex min-w-0 flex-col gap-1 rounded-[18px] bg-white px-3.5 py-3', className)}>
    <span className="truncate text-[11px] text-slate-500">{label}</span>
    <span
      className={cn(
        'truncate text-[15px] font-bold tabular-nums',
        tone === 'in' ? 'text-emerald-600' : tone === 'out' ? 'text-red-600' : 'text-slate-900'
      )}
    >
      {children}
    </span>
  </div>
)

const MobileTransactionsPage = observer(() => {
  const t = useTranslations('Operations')
  const tm = useTranslations('Mobile')
  const tf = useTranslations('filters')
  const mounted = useMounted()
  const router = useRouter()

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { requestOperationFilters } = useOperationsFilters(t)
  const { chips: filterChips, count: filterCount } = useOperationFilterChips()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUcodeRequestInfinite({
    method: 'list_operations_by_query',
    data: requestOperationFilters,
    querySetting: { staleTime: 1000 * 60, gcTime: 1000 * 60, placeholderData: keepPreviousData },
  })

  const { data: totalSummary } = useQuery({
    queryKey: ['get_operations_total', requestOperationFilters],
    queryFn: () => apiClient.invokeFunction({ method: 'summary_operations', data: requestOperationFilters }),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
    select: (response) => response?.data?.data,
  })

  const allOperations = useMemo(() => data?.pages?.flatMap((page) => page?.data?.data || []) || [], [data])

  const sections = useMemo(() => {
    const groups = [
      { key: 'future', label: tm('transactions.planned'), rows: operationsDto(allOperations, 'future') },
      { key: 'today', label: t('page.sectionToday'), rows: operationsDto(allOperations, 'today') },
      { key: 'before', label: t('page.sectionBefore'), rows: operationsDto(allOperations, 'before') },
    ]
    return groups.filter((group) => group.rows.length > 0)
  }, [allOperations, t, tm])

  // Подгрузка следующей страницы за экран до конца ленты
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
  const byType = totalSummary?.by_type || {}
  const net = totalSummary?.net_cash_flow ?? 0

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Шапка и поиск */}
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={tm('tabs.transactions')}
          action={
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              aria-label={tf('openFilters')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              {filterCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e73f6] px-1 text-[10px] font-semibold text-white">
                  {filterCount}
                </span>
              )}
            </button>
          }
        />

        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={operationFilterStore.searchQuery || ''}
            onChange={(event) => operationFilterStore.setSearchQuery(event.target.value)}
            placeholder={t('page.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {operationFilterStore.searchQuery && (
            <button type="button" onClick={() => operationFilterStore.setSearchQuery('')} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Быстрые фильтры */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          <FilterPill
            label={t('filters.operationType')}
            value={operationFilterStore.selectedFilters?.length || null}
            active={Boolean(operationFilterStore.selectedFilters?.length)}
            onClick={() => setIsFilterOpen(true)}
          />
          <FilterPill
            label={t('filters.paymentDate')}
            active={Boolean(operationFilterStore.selectedDatePaymentRange?.start)}
            onClick={() => setIsFilterOpen(true)}
          />
          <FilterPill
            label={t('columns.amount')}
            active={Boolean(operationFilterStore.amountRange?.min || operationFilterStore.amountRange?.max)}
            onClick={() => setIsFilterOpen(true)}
          />
        </div>

        {/* Итоги периода */}
        {mounted && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <Tile label={t('footer.receipts')} tone="in">
              <Money value={byType.receipt?.total_summa ?? 0} currency={currency} sign="+" />
            </Tile>
            <Tile label={t('footer.payments')} tone="out">
              <Money value={byType.payment?.total_summa ?? 0} currency={currency} sign="−" />
            </Tile>
            <Tile label={t('footer.transfers')}>
              <Money value={byType.transfer?.total_summa ?? 0} currency={currency} />
            </Tile>
            <Tile label={t('footer.total')} tone={net >= 0 ? 'in' : 'out'}>
              <Money value={net} currency={currency} sign={net > 0 ? '+' : undefined} />
            </Tile>
          </div>
        )}

        {/* Включённые фильтры */}
        {filterChips.length > 0 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {filterChips.map((chip) => (
              <span
                key={chip.key}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                <span className="text-slate-400">{chip.label}:</span>
                <span className="font-semibold">{chip.value}</span>
                {chip.onRemove && (
                  <button type="button" onClick={chip.onRemove} aria-label={tf('clearAll')} className="text-slate-400">
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Лента операций */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-28">
        {isLoading && !sections.length && <MSkeleton className="pt-4" rows={5} />}

        {!isLoading && !sections.length && (
          <MEmpty icon={ArrowLeftRight} title={t('page.noData')} subtitle={tm('transactions.emptyHint')} />
        )}

        {sections.map((section) => (
          <section key={section.key}>
            <div className="px-1 pt-5 pb-2 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
              {section.label}
            </div>
            <MCard list>
              {section.rows.map((operation) => {
                const look = TYPE_LOOK[operation.tip] || TYPE_LOOK['Начисление']
                const isIncome = operation.operationType === 'income'
                const isPayment = operation.operationType === 'payment'
                return (
                  <MRow
                    key={operation.guid}
                    icon={look.icon}
                    tone={look.tone}
                    title={operation.counterparty || operation.tip}
                    subtitle={[operation.chartOfAccounts, operation.my_account_name].filter(Boolean).join(' · ')}
                    onClick={() => router.push(`/m/transactions/${operation.guid}`)}
                    value={
                      <Money
                        value={operation.summa}
                        currency={operation.currency || currency}
                        sign={isIncome ? '+' : isPayment ? '−' : ''}
                        className={cn(isIncome && 'text-emerald-600', isPayment && 'text-red-600')}
                      />
                    }
                    valueSub={operation.operationDate}
                  />
                )
              })}
            </MCard>
          </section>
        ))}

        <div ref={sentinelRef} className="h-10">
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Что сделать с операцией */}
      <OperationFilters open={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

    </div>
  )
})

export default MobileTransactionsPage
