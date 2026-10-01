'use client'

import { OPERATION_TYPES } from '@/constants/operationTypes'
import CreateOperationSheet, { allowedCreateTypes } from '@/components/mobile/CreateOperationSheet'
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
  ArrowLeftRight,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
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
// Вид типов — общий с компьютером: constants/operationTypes.js
const TYPE_LOOK = OPERATION_TYPES

const MobileTransactionsPage = observer(() => {
  const t = useTranslations('Operations')
  const tm = useTranslations('Mobile')
  const tf = useTranslations('filters')
  const mounted = useMounted()
  const router = useRouter()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

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
    const rows = operationsDto(allOperations)
    const byDay = new Map()

    rows.forEach((operation) => {
      const day = moment(operation.data_operatsii).format('YYYY-MM-DD')
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day).push(operation)
    })

    const today = moment().startOf('day')
    const label = (day) => {
      const date = moment(day)
      if (date.isSame(today, 'day')) return t('page.sectionToday')
      if (date.isSame(today.clone().subtract(1, 'day'), 'day')) return tm('transactions.yesterday')
      if (date.isAfter(today, 'day')) return `${tm('transactions.planned')} · ${date.format('D MMMM')}`
      return date.format('D MMMM YYYY')
    }

    // итог дня: поступления минус выплаты — сразу видно, чем день закрылся
    const dayTotal = (list) =>
      list.reduce((sum, operation) => {
        const value = Number(operation.summa) || 0
        if (operation.operationType === 'income') return sum + value
        if (operation.operationType === 'payment') return sum - value
        return sum
      }, 0)

    return Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([day, list]) => ({ key: day, label: label(day), rows: list, total: dayTotal(list) }))
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
            mounted &&
            allowedCreateTypes().length > 0 && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label={t('page.create')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white shadow-[0_4px_12px_rgba(14,115,246,0.35)] active:bg-[#0b5fd4]"
              >
                <Plus size={20} aria-hidden="true" />
              </button>
            )
          }
        />

        {/* Поиск и фильтры — одной строкой над лентой */}
        <div className="flex items-center gap-2">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-3.5">
            <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
            <input
              value={operationFilterStore.searchQuery || ''}
              onChange={(event) => operationFilterStore.setSearchQuery(event.target.value)}
              placeholder={t('page.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {operationFilterStore.searchQuery && (
              <button
                type="button"
                onClick={() => operationFilterStore.setSearchQuery('')}
                className="shrink-0 text-slate-400"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label={tf('openFilters')}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 active:bg-slate-100"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0e73f6] px-1 text-[10px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </button>
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

        {/* Итоги периода: сначала результат, под ним из чего он сложился */}
        {mounted && (
          <div className="mt-2.5 rounded-[20px] bg-white px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-slate-500">{t('footer.total')}</span>
              <span
                className={cn(
                  'text-[20px] font-bold tabular-nums',
                  net >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                <Money value={net} currency={currency} sign={net > 0 ? '+' : undefined} />
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3">
              {[
                { key: 'receipts', label: tm('reports.receipts'), value: byType.receipt?.total_summa ?? 0, count: byType.receipt?.count, tone: 'text-emerald-600' },
                { key: 'payments', label: tm('reports.payments'), value: byType.payment?.total_summa ?? 0, count: byType.payment?.count, tone: 'text-red-600' },
                { key: 'transfers', label: t('footer.transfers'), value: byType.transfer?.total_summa ?? 0, count: byType.transfer?.count, tone: 'text-slate-900' },
              ].map((item, index) => (
                <div key={item.key} className={cn('min-w-0 px-2', index === 0 && 'pl-0', index === 2 && 'pr-0')}>
                  <div className="truncate text-[11px] text-slate-400">{item.label}</div>
                  <div className={cn('mt-1 truncate text-[14px] font-bold tabular-nums', item.tone)}>
                    <Money value={item.value} currency="" />
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400 tabular-nums">
                    {t('summary.opsCount', { count: item.count ?? 0 })}
                  </div>
                </div>
              ))}
            </div>
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
            <div className="flex items-baseline justify-between gap-3 px-1 pt-5 pb-2">
              <span className="text-[13px] font-semibold text-slate-500">{section.label}</span>
              {section.total !== 0 && (
                <span
                  className={cn(
                    'text-[13px] font-semibold tabular-nums',
                    section.total > 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  <Money value={section.total} currency={currency} sign={section.total > 0 ? '+' : '−'} />
                </span>
              )}
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
                    subtitle={
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate">
                          {[operation.chartOfAccounts, operation.my_account_name].filter(Boolean).join(' · ')}
                        </span>
                        {/* Неподтверждённая оплата — самая частая причина расхождений */}
                        {!operation.payment_confirmed && (isIncome || isPayment) && (
                          <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            {tm('detail.notPaid')}
                          </span>
                        )}
                      </span>
                    }
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

      <CreateOperationSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
})

export default MobileTransactionsPage
