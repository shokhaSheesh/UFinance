'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard, MEmpty, MRow, MSkeleton, TileIcon } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useDeleteOperation, useUcodeRequestInfinite } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { useOperationsFilters } from '@/modules/operations/hooks/useOperationsFilters'
import { useShipmentActions } from '@/modules/operations/hooks/useShipmentActions'
import { useOperationFilterChips } from '@/modules/operations/list-page/useOperationFilterChips'
import { appStore } from '@/store/app.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Copy,
  Loader2,
  PackageCheck,
  Pencil,
  Scale,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'

const OperationModal = lazy(() => import('@/components/operations/OperationModal/OperationModal'))
const OperationsFiltersSidebar = lazy(() =>
  import('@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar')
)

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
  const tc = useTranslations('Common')
  const tf = useTranslations('filters')
  const mounted = useMounted()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [actionsFor, setActionsFor] = useState(null)
  const [openModal, setOpenModal] = useState(null)
  const [modalType, setModalType] = useState(null)

  const permissions = appStore.permission.operations
  const { requestOperationFilters } = useOperationsFilters(t)
  const { chips: filterChips, count: filterCount } = useOperationFilterChips()

  // Создание из кнопки «плюс»: тип приходит адресом (?new=income)
  useEffect(() => {
    const type = searchParams.get('new')
    if (!type) return
    setModalType(type)
    setOpenModal({ isNew: true })
    window.history.replaceState(null, '', '/m/transactions')
  }, [searchParams])

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

  const { handleEditShipment } = useShipmentActions({
    setOperationToDelete: () => {},
    setIsShipmentDeleting: () => {},
    setIsDeleteModalOpen: () => {},
  })

  const { mutateAsync: getOperation, isPending: isLoadingOperation } = useMutation({
    mutationKey: ['get_operation'],
    mutationFn: (payload) => apiClient.invokeFunction({ method: 'get_operation', data: payload }),
  })

  const deleteOperation = useDeleteOperation()
  const typeToModal = { income: 'income', payment: 'payment', transfer: 'transfer', accrual: 'accrual' }

  const openForEdit = async (operation) => {
    setActionsFor(null)
    const response = await getOperation({ guid: operation?.guid })
    const full = operationDto(response?.data?.data)
    if (full.tip === 'Отгрузка' || full.tip === 'Поставка') {
      handleEditShipment(full)
      return
    }
    setModalType(typeToModal[full.operationType] || 'income')
    setOpenModal({ ...full, isNew: false })
  }

  const openForCopy = async (operation) => {
    setActionsFor(null)
    const response = await getOperation({ guid: operation?.guid })
    const full = operationDto(response?.data?.data)
    setModalType(typeToModal[full.operationType] || 'income')
    setOpenModal({ ...full, guid: undefined, isNew: true })
  }

  const removeOperation = async (operation) => {
    setActionsFor(null)
    await deleteOperation.mutateAsync({ guid: operation.guid })
    queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
    queryClient.invalidateQueries({ queryKey: ['get_operations_total'] })
  }

  const permissionFor = (operation, action) => {
    const key = {
      Поступление: 'income',
      Выплата: 'payout',
      Перемещение: 'transfer',
      Начисление: 'accrual',
      Отгрузка: 'shipment',
      Поставка: 'shipment',
    }[operation?.tip]
    return Boolean(permissions?.[key]?.[action])
  }

  const currency = mounted ? GlobalCurrency?.name : ''
  const byType = totalSummary?.by_type || {}
  const net = totalSummary?.net_cash_flow ?? 0

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Шапка и поиск */}
      <div className="shrink-0 px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-2">
          <h1 className="truncate text-[21px] font-bold text-slate-900">{tm('tabs.transactions')}</h1>
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
        </div>

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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
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
                    onClick={() => setActionsFor(operation)}
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
      <BottomSheet
        open={Boolean(actionsFor)}
        onClose={() => setActionsFor(null)}
        title={actionsFor?.counterparty || actionsFor?.tip}
        subtitle={[actionsFor?.chartOfAccounts, actionsFor?.operationDate].filter(Boolean).join(' · ')}
      >
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3.5">
          <span className="text-sm text-slate-500">{t('columns.amount')}</span>
          <Money
            value={actionsFor?.summa}
            currency={actionsFor?.currency || currency}
            className="text-[17px] font-bold text-slate-900"
          />
        </div>

        <div className="flex flex-col">
          {permissionFor(actionsFor, 'edit') && (
            <button
              type="button"
              onClick={() => openForEdit(actionsFor)}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <TileIcon icon={Pencil} />
              <span className="text-sm font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissionFor(actionsFor, 'add') && (
            <button
              type="button"
              onClick={() => openForCopy(actionsFor)}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <TileIcon icon={Copy} />
              <span className="text-sm font-semibold text-slate-900">{tc('copy')}</span>
            </button>
          )}
          {permissionFor(actionsFor, 'delete') && (
            <button
              type="button"
              onClick={() => removeOperation(actionsFor)}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <TileIcon icon={Trash2} tone="out" />
              <span className="text-sm font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {isLoadingOperation && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/20">
          <Loader2 size={26} className="animate-spin text-white" aria-hidden="true" />
        </div>
      )}

      <Suspense fallback={null}>
        {isFilterOpen && <OperationsFiltersSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />}
        {openModal && (
          <OperationModal
            operation={openModal}
            initialTab={modalType}
            currentPage={1}
            onClose={() => {
              setOpenModal(null)
              setModalType(null)
            }}
          />
        )}
      </Suspense>
    </div>
  )
})

export default MobileTransactionsPage
