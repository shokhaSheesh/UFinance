'use client'
import RowActions from '@/components/shared/RowActions/RowActions'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { applyCopyDates } from '@/utils/operationCopy'
import { useDeleteOperation } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import operationDto from '@/lib/dtos/operationDto'
import operationsDto from '@/lib/dtos/operationsDto'
import { formatAmount } from '@/utils/helpers'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import CustomDialog from '@/components/shared/CustomDialog'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useChartOfAccountsIds } from '@/hooks/useChartOfAccountsIds'
import { appStore } from '@/store/app.store'
import { areDatesAllowed } from '@/utils/dataEditingRestriction'
import { observer } from 'mobx-react-lite'
import EmptyState from '../EmptyState'

// Затраты по сделке: показываем только статьи расходов
const EXPENSE_ROOTS = ['Расходы']

/* ─── Main table component ────────────────────────────────── */
const ExpenseOperationsTable = observer(({ sellingDealId, onAdd, canAdd, canEdit, canDelete, dealIdField = 'sellingDealId', invalidateKeys = ['get_sales_transaction_by_guid'], tipTypes = ["Дебет", "Кредит", "Начисление", "Выплата"], isPurchase = false }) => {
  const t = useTranslations('Directories.details.expenseOperationsTable')

  const tc = useTranslations('Common')
  const [showModal, setShowModal] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [modalType, setModalType] = useState('income')
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [isModalOpening, setIsModalOpening] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [operationToDelete, setOperationToDelete] = useState(null)
  const deleteOperationMutation = useDeleteOperation()
  const { mutateAsync: getOperation, isPending: isPendingGetOperation } = useMutation({
    mutationKey: ['get_operation'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_operation', data })
  })
  const queryClient = useQueryClient()
  const scrollContainerRef = useRef(null)
  const LIMIT = 50

  // Статьи расходов приходят из плана счетов — бэк раздел не разворачивает
  const { ids: expenseAccountIds, isLoading: isChartLoading } = useChartOfAccountsIds(EXPENSE_ROOTS)

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['list_operations_by_query', sellingDealId, 'expense', expenseAccountIds],
    enabled: !isChartLoading,
    queryFn: ({ pageParam = 1 }) => apiClient.invokeFunction({
      method: "list_operations_by_query",
      data: {
        [dealIdField]: [sellingDealId],
        tip: tipTypes,
        chart_of_accounts_ids: expenseAccountIds,
        accrualConfirmed: true,
        accrualNotConfirmed: true,
        paymentConfirmed: true,
        paymentNotConfirmed: true,
        page: pageParam,
        limit: LIMIT
      }
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination
      if (!pagination) return undefined
      const { page, totalPages } = pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    // список и итог обновляем одинаково, иначе таблица и «Итого» разойдутся
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData
  })


  const { data: operationsTotal } = useQuery({
    queryKey: ['get_operations_total_expense', sellingDealId, expenseAccountIds],
    enabled: !isChartLoading,
    queryFn: () => apiClient.invokeFunction({
      method: "summary_operations",
      data: {
        [dealIdField]: [sellingDealId],
        tip: tipTypes,
        chart_of_accounts_ids: expenseAccountIds,
        accrualConfirmed: true,
        accrualNotConfirmed: true,
        paymentConfirmed: true,
        paymentNotConfirmed: true
      }
    }),
    // Глобальный staleTime — 5 минут, из-за него при возврате на вкладку итог
    // брался из кэша и запрос не уходил. Итог должен быть свежим всегда.
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
    select: (response) => response?.data?.data
  })

  // «Итого» по сделке — net_sales_payment из summary_operations
  const netTotal = useMemo(
    () => Math.round(Number(operationsTotal?.net_sales_payment) || 0),
    [operationsTotal]
  )

  const dealOperations = useMemo(() => {
    const allData = infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
    return operationsDto(allData)
  }, [infiniteData])


  // Infinite scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !hasNextPage || isFetchingNextPage) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100) {
        fetchNextPage()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])


  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }

  if (dealOperations?.length === 0) {
    return (
      <EmptyState
        title={t('emptyTitle')}
        subtitle={t('emptySubtitle')}
        onAdd={onAdd}
        canAdd={canAdd}
      />
    )
  }

  const handleEditOperation = async (operation) => {
    const fullOperationData = await getOperation({ guid: operation?.guid })
    const operationFullData = operationDto(fullOperationData?.data?.data)
    setSelectedOperation(operationFullData || operation)
    setModalType('payment')
    setShowModal(true)
    setIsModalClosing(false)
    setIsModalOpening(true)
    setTimeout(() => setIsModalOpening(false), 50)
  }

  const handleCopyOperation = async (operation) => {
    const fullOperationData = await getOperation({ guid: operation?.guid })
    const operationFullData = operationDto(fullOperationData?.data?.data)
    const copy = applyCopyDates({ ...operationFullData })

    setSelectedOperation({ ...copy, id: 'new', isNew: true, isCopy: true })
    setModalType('payment')
    setShowModal(true)
    setIsModalClosing(false)
    setIsModalOpening(true)
    setTimeout(() => setIsModalOpening(false), 50)
  }

  const handleDeleteOperation = (operation) => {
    setOperationToDelete(operation)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return
    const guid = operationToDelete.rawData?.guid || operationToDelete.guid
    if (!guid) return

    try {
      await deleteOperationMutation.mutateAsync([guid])
      setIsDeleteModalOpen(false)
      setOperationToDelete(null)
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))
      queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['get_operations_total_income'] })
      queryClient.invalidateQueries({ queryKey: ['get_operations_total_expense'] })
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }

  return (
    <>
      {isPendingGetOperation && <ScreenLoader />}
      {dealOperations?.length > 0 && <>
        <div ref={scrollContainerRef} className="max-h-[1000px] overflow-y-auto">
          <table className="w-full">
            <thead className='sticky top-0 z-10'>
              <tr className='bg-neutral-100 text-neutral-600 font-normal text-xs w-full border-b border-gray-200'>
                <th className='px-3 py-2 text-left w-[150px]'>{t('date')}</th>
                <th className='px-3 py-2 text-left w-[150px]'>{t('account')}</th>
                <th className='px-3 py-2 text-left w-[150px]'>{t('counterparty')}</th>
                <th className='px-3 py-2 text-left w-[150px]'>{t('article')}</th>
                <th className='px-3 py-2 text-right w-[150px]'>{t('amount')}</th>
              </tr>
            </thead>
            <tbody className='w-full'>
              {dealOperations?.map((item) => {
                const isActive = !item?.payment_confirmed && !item?.payment_accrual
                // Начисление показываем как на странице «Операции»: юрлицо вместо
                // счёта, две статьи (по дебету / по кредиту) и две суммы
                const isAccrual = item?.tip === 'Начисление'
                // Закрытый период роли: операцию вне разрешённого периода
                // нельзя ни менять, ни удалять. См. utils/dataEditingRestriction.js
                const isDateAllowed = areDatesAllowed(
                  [item?.data_operatsii, item?.data_nachisleniya],
                  appStore.dataEditingRestriction,
                )
                const rowCanEdit = canEdit && isDateAllowed
                const rowCanDelete = canDelete && isDateAllowed
                return (
                  <tr key={item?.guid} className="bg-white hover:bg-gray-50 text-xs font-normal group text-neutral-900 cursor-pointer border-b group border-gray-200">
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.operationDate}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>
                      {isAccrual
                        ? <span className='text-neutral-500'>{item.legal_entity_name ? `[${item.legal_entity_name}]` : ''}</span>
                        : item.my_account_name}
                    </td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{isAccrual ? (item.counterparty || t('accrual')) : item.counterparty}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>
                      {isAccrual ? (
                        <div className='flex flex-col'>
                          <span className='line-clamp-1'>{item.chartOfAccounts} {t('byDebit')}</span>
                          <span className='line-clamp-1'>{item.chartOfAccounts2} {t('byCredit')}</span>
                        </div>
                      ) : item.chartOfAccounts}
                    </td>
                    <td className={`p-3 text-right w-40`}>
                      <div className="flex items-center justify-end gap-2 min-h-6">
                        {isAccrual ? (
                          <div className='flex flex-col text-neutral-500'>
                            <span className='whitespace-nowrap'>{item.debit ?? '+'}{formatAmount(item.summa)} {item.currency}</span>
                            <span className='whitespace-nowrap'>{item.kredit ?? '-'}{formatAmount(item.summa)} {item.currency}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className={`font-base text-red-600`}>
                              {'-'}{formatAmount(item.summa)} {item.currency}
                            </p>
                          </div>
                        )}
                        <div className='flex items-center' onClick={(e) => e.stopPropagation()}>
                          {canEdit || rowCanDelete || rowCanEdit && (
                            <RowActions
                              actions={[
                                { key: 'edit', icon: Pencil, label: tc('edit'), onClick: (e) => { e.stopPropagation(); handleEditOperation(item); }, hidden: !(rowCanEdit) },
                                { key: 'copy', icon: Copy, label: tc('copy'), onClick: (e) => { e.stopPropagation(); handleCopyOperation(item); }, hidden: !(canEdit) },
                                { key: 'delete', icon: Trash2, label: tc('delete'), onClick: (e) => { e.stopPropagation(); handleDeleteOperation(item); }, hidden: !(rowCanDelete), danger: true },
                              ]}
                            />
                          )}
                        </div></div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className='animate-spin text-primary' size={20} />
            </div>
          )}
        </div>
        <div className='flex justify-end'>
          <div className="p-4 text-right text-neutral-700 font-semibold">{t('total')}</div>
          <div className={cn('p-4 text-right font-semibold', netTotal > 0 ? 'text-emerald-600' : 'text-red-600')}>
            {formatAmount(netTotal)} {GlobalCurrency?.name}
          </div>
        </div>
      </>}

      {showModal && (
        <OperationModal
          operation={selectedOperation}
          isClosing={isModalClosing}
          isOpening={isModalOpening}
          defaultDealGuid={isPurchase ? undefined : sellingDealId}
          defaultPurchaseDealGuid={isPurchase ? sellingDealId : undefined}
          onClose={() => {
            setIsModalClosing(true)
            setTimeout(() => {
              setShowModal(false)
              setIsModalClosing(false)
            }, 300)
          }}
          onSuccess={() => {
            invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))
            queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
            queryClient.invalidateQueries({ queryKey: ['get_operations_total_income'] })
            queryClient.invalidateQueries({ queryKey: ['get_operations_total_expense'] })
            setShowModal(false)
          }}
          initialTab={modalType}
        />
      )}


      <CustomDialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className='p-6 flex flex-col'>
          <div className='flex justify-between items-center border-b border-gray-100 pb-4'>
            <h2 className='text-xl font-bold text-neutral-800'>{t('deleteOperationTitle')}</h2>
          </div>

          <div className='py-6 text-base text-neutral-700'>
            {t('deleteOperationConfirm')}
          </div>

          <div className='flex justify-end gap-4'>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className='px-4 py-2 text-sm text-primary hover:bg-gray-50 rounded-md font-semibold'
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteOperationMutation.isPending}
              className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md flex items-center justify-center min-w-[100px]'
            >
              {deleteOperationMutation.isPending ? <Loader2 className='animate-spin h-4 w-4' /> : t('delete')}
            </button>
          </div>
        </div>
      </CustomDialog>

    </>
  )
})

export default ExpenseOperationsTable
