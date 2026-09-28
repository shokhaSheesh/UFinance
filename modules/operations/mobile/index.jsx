'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import OperationTypeIcon from '@/components/operations/OperationTypeIcon/OperationTypeIcon'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useDeleteOperation, useUcodeRequestInfinite } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Pencil, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'

import { useOperationsFilters } from '../hooks/useOperationsFilters'
import { useShipmentActions } from '../hooks/useShipmentActions'
import { useOperationFilterChips } from '../list-page/useOperationFilterChips'

const OperationModal = lazy(() => import('@/components/operations/OperationModal/OperationModal'))
const OperationsFiltersSidebar = lazy(() =>
  import('@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar')
)

/**
 * Операции на телефоне.
 *
 * Настольная страница — таблица из тринадцати колонок с итогами карточками,
 * панелью фильтров сбоку и меню действий в каждой строке. На экране шириной
 * 390 точек ничего из этого не помещается, поэтому здесь:
 *   — строка операции вместо табличного ряда: значок типа, контрагент, статья
 *     и счёт мелким шрифтом, сумма справа;
 *   — итоги периода полосой карточек, которая листается вбок;
 *   — фильтры и действия над операцией — в панелях, выезжающих снизу.
 *
 * Данные те же, что у настольной страницы: тот же запрос, тот же стор
 * фильтров и тот же DTO — списки не разъедутся между устройствами.
 */

/** Заголовок раздела списка: «Сегодня», «Ранее». */
const SectionHeader = ({ children }) => (
  <div className="sticky top-0 z-10 bg-canvas px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
    {children}
  </div>
)

/** Одна операция в списке. */
const OperationRow = ({ operation, onOpen }) => {
  const currency = operation.currency || GlobalCurrency?.name
  const isIncome = operation.operationType === 'income'
  const isPayment = operation.operationType === 'payment'

  return (
    <button
      type="button"
      onClick={() => onOpen(operation)}
      className="flex w-full items-start gap-3 border-b border-slate-100 bg-white px-4 py-3 text-left last:border-b-0 active:bg-slate-50"
    >
      <OperationTypeIcon tip={operation.tip} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900">
          {operation.counterparty || operation.tip}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">
          {[operation.chartOfAccounts, operation.my_account_name].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <Money
          value={operation.summa}
          currency={currency}
          sign={isIncome ? '+' : isPayment ? '−' : ''}
          className={cn(
            'text-sm font-semibold',
            isIncome ? 'text-green-600' : isPayment ? 'text-red-600' : 'text-slate-900'
          )}
        />
        <span className="text-[11px] text-slate-400">{operation.operationDate}</span>
      </div>
    </button>
  )
}

/** Итог периода — карточка в полосе, которая листается вбок. */
const SummaryCard = ({ label, value, count, tone }) => (
  <div className="flex w-[46%] shrink-0 snap-start flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
    <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</span>
    <span
      className={cn(
        'text-base font-semibold tabular-nums',
        tone === 'in' ? 'text-green-600' : tone === 'out' ? 'text-red-600' : 'text-slate-900'
      )}
    >
      {value}
    </span>
    {count !== undefined && <span className="text-[11px] text-slate-400 tabular-nums">{count}</span>}
  </div>
)

const OperationsMobilePage = observer(() => {
  const t = useTranslations('Operations')
  const tc = useTranslations('Common')
  const tf = useTranslations('filters')
  const mounted = useMounted()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [actionsFor, setActionsFor] = useState(null)
  const [openModal, setOpenModal] = useState(null)
  const [modalType, setModalType] = useState(null)

  const permissions = appStore.permission.operations
  const { requestOperationFilters } = useOperationsFilters(t)
  const { chips: filterChips, count: filterCount } = useOperationFilterChips()

  // Создание из кнопки в нижней панели: тип приходит адресом (?new=income)
  useEffect(() => {
    const type = searchParams.get('new')
    if (!type) return
    setModalType(type)
    setOpenModal({ isNew: true })
    window.history.replaceState(null, '', '/operations')
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

  const allOperations = useMemo(
    () => data?.pages?.flatMap((page) => page?.data?.data || []) || [],
    [data]
  )

  const sections = useMemo(() => {
    const future = operationsDto(allOperations, 'future')
    const today = operationsDto(allOperations, 'today')
    const before = operationsDto(allOperations, 'before')
    return [
      { key: 'future', label: null, rows: future },
      { key: 'today', label: t('page.sectionToday'), rows: today },
      { key: 'before', label: t('page.sectionBefore'), rows: before },
    ].filter((section) => section.rows.length > 0)
  }, [allOperations, t])

  // Подгрузка следующей страницы, когда до конца списка остаётся экран
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

  // ── Действия над операцией ────────────────────────────────────────────────
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
    const byTip = {
      Поступление: 'income',
      Выплата: 'payout',
      Перемещение: 'transfer',
      Начисление: 'accrual',
      Отгрузка: 'shipment',
      Поставка: 'shipment',
    }[operation?.tip]
    return Boolean(permissions?.[byTip]?.[action])
  }

  const currency = GlobalCurrency?.name
  const byType = totalSummary?.by_type || {}
  const net = totalSummary?.net_cash_flow ?? 0
  const opsCount = (value) => t('summary.opsCount', { count: value ?? 0 })

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden bg-canvas">
      {/* Шапка: название, поиск и фильтры со счётчиком */}
      <div className="w-full min-w-0 shrink-0 bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <h1 className="truncate text-lg font-semibold text-slate-900">{t('page.title')}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label={tc('search')}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:bg-slate-100"
            >
              <Search size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              aria-label={tf('openFilters')}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:bg-slate-100"
            >
              <SlidersHorizontal size={19} aria-hidden="true" />
              {filterCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e73f6] px-1 text-[10px] font-semibold text-white">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="px-4 pb-3">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                autoFocus
                value={operationFilterStore.searchQuery || ''}
                onChange={(event) => operationFilterStore.setSearchQuery(event.target.value)}
                placeholder={t('page.searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              {operationFilterStore.searchQuery && (
                <button
                  type="button"
                  onClick={() => operationFilterStore.setSearchQuery('')}
                  aria-label={tf('clearAll')}
                  className="shrink-0 text-slate-400"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Итоги периода — полоса карточек */}
        {mounted && (
          <div className="flex w-full min-w-0 snap-x gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            <SummaryCard
              label={t('footer.receipts')}
              tone="in"
              count={opsCount(byType.receipt?.count)}
              value={<Money value={byType.receipt?.total_summa ?? 0} currency={currency} />}
            />
            <SummaryCard
              label={t('footer.payments')}
              tone="out"
              count={opsCount(byType.payment?.count)}
              value={<Money value={byType.payment?.total_summa ?? 0} currency={currency} />}
            />
            <SummaryCard
              label={t('footer.transfers')}
              count={opsCount(byType.transfer?.count)}
              value={<Money value={byType.transfer?.total_summa ?? 0} currency={currency} />}
            />
            <SummaryCard
              label={t('footer.total')}
              tone={net >= 0 ? 'in' : 'out'}
              value={<Money value={net} currency={currency} sign={net > 0 ? '+' : undefined} />}
            />
          </div>
        )}

        {/* Включённые фильтры */}
        {filterChips.length > 0 && (
          <div className="flex w-full min-w-0 gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 [scrollbar-width:none]">
            {filterChips.map((chip) => (
              <span
                key={chip.key}
                className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                <span className="text-slate-500">{chip.label}:</span>
                <span className="font-medium">{chip.value}</span>
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

      {/* Список */}
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading && (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )}

        {!isLoading && sections.length === 0 && (
          <p className="px-6 py-16 text-center text-sm text-slate-500">{t('page.noData')}</p>
        )}

        {sections.map((section) => (
          <section key={section.key}>
            {section.label && <SectionHeader>{section.label}</SectionHeader>}
            <div className="bg-white">
              {section.rows.map((operation) => (
                <OperationRow key={operation.guid} operation={operation} onOpen={setActionsFor} />
              ))}
            </div>
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
        <div className="flex flex-col gap-1">
          <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
            <span className="text-sm text-slate-500">{t('columns.amount')}</span>
            <Money
              value={actionsFor?.summa}
              currency={actionsFor?.currency || currency}
              className="text-base font-semibold text-slate-900"
            />
          </div>

          {permissionFor(actionsFor, 'edit') && (
            <button
              type="button"
              onClick={() => openForEdit(actionsFor)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-medium text-slate-900 active:bg-slate-50"
            >
              <Pencil size={17} className="text-slate-500" aria-hidden="true" />
              {tc('edit')}
            </button>
          )}
          {permissionFor(actionsFor, 'add') && (
            <button
              type="button"
              onClick={() => openForCopy(actionsFor)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-medium text-slate-900 active:bg-slate-50"
            >
              <Copy size={17} className="text-slate-500" aria-hidden="true" />
              {tc('copy')}
            </button>
          )}
          {permissionFor(actionsFor, 'delete') && (
            <button
              type="button"
              onClick={() => removeOperation(actionsFor)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-medium text-red-600 active:bg-red-50"
            >
              <Trash2 size={17} aria-hidden="true" />
              {tc('delete')}
            </button>
          )}
        </div>
      </BottomSheet>

      {isLoadingOperation && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/20">
          <Loader2 size={26} className="animate-spin text-white" aria-hidden="true" />
        </div>
      )}

      {/* Фильтры и окно операции — те же, что на большом экране */}
      <Suspense fallback={null}>
        {isFilterOpen && (
          <OperationsFiltersSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
        )}
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

export default OperationsMobilePage
