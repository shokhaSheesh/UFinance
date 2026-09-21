'use client'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { applyCopyDates } from '@/utils/operationCopy'
import { useDeleteOperation } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import operationsDto from '@/lib/dtos/operationsDto'
import { formatAmount } from '@/utils/helpers'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'


import CustomDialog from '@/components/shared/CustomDialog'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { appStore } from '@/store/app.store'
import { areDatesAllowed } from '@/utils/dataEditingRestriction'
import { observer } from 'mobx-react-lite'
import EmptyState from '../EmptyState'

/* ─── Main table component ────────────────────────────────── */
const IncomeOperationsTable = observer(({ sellingDealId, onAdd, canAdd, canEdit, canDelete }) => {
  const t = useTranslations('Directories.details.incomeOperationsTable')

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
  const LIMIT = 10

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['list_operations_by_query', sellingDealId, 'income'],
    queryFn: ({ pageParam = 1 }) => apiClient.invokeFunction({
      method: "list_operations_by_query",
      data: {
        selling_deal_ids: [sellingDealId],
        tip: ['Поступление'],
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
    placeholderData: keepPreviousData
  })

  const { data: operationsTotal } = useQuery({
    queryKey: ['get_operations_total_income', sellingDealId],
    queryFn: () => apiClient.invokeFunction({
      method: "summary_operations", data: {
        selling_deal_ids: [sellingDealId],
        tip: ['Поступление'],
        accrualConfirmed: true,
        accrualNotConfirmed: true,
        paymentConfirmed: true,
        paymentNotConfirmed: true
      },
    }),
    // staleTime: 1000 * 60,
    // gcTime: 1000 * 60,
    // placeholderData: keepPreviousData,
    select: (response) => response?.data?.data
  })

  const totalSummary = useMemo(
    () => operationsTotal?.by_type?.receipt,
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
    setModalType('income')
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
    setModalType('income')
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
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['get_operations_total_income'] })
      queryClient.invalidateQueries({ queryKey: ['get_operations_total_expense'] })
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }


  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }

  return (
    <>
      {isPendingGetOperation && <ScreenLoader />}
      {dealOperations?.length > 0 && <>
        <div ref={scrollContainerRef} className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className='sticky top-0 z-10'>
              <tr className='bg-neutral-100 text-neutral-600 font-normal text-sm w-full border-b border-gray-200'>
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
                const isDifferentDate = item?.accrualDate !== item?.operationDate
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
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>
                      <div className='flex flex-col items-start leading-tight'>
                        <span className='text-xs'>{item?.operationDate}</span>
                        {isDifferentDate && <span className="text-xs text-neutral-400">{item?.accrualDate}</span>}
                      </div>
                    </td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.my_account_name}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.counterparty}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>
                      <div className="flex flex-col items-start">
                        <p>{item.chartOfAccounts}</p>
                        <p className="text-gray-400 text-mini">{item.opisanie}</p>
                      </div>
                    </td>
                    <td className={`p-3 text-right ${isActive ? 'active-row' : ''}`}>
                      <div className="flex items-center justify-end gap-4 h-6">
                        <p className={`font-base text-green-600`}>
                          {'+'}{formatAmount(item.summa)} {item.currency}
                        </p>
                        <div className='flex items-center' onClick={(e) => e.stopPropagation()}>
                          {canEdit || rowCanDelete || rowCanEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <RowActionsTrigger />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-44 p-1.5" align="end">
              {rowCanEdit && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleEditOperation(item); }}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <MdOutlineModeEdit size={15} /> <span>{tc('edit')}</span>
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleCopyOperation(item); }}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <IoCopyOutline size={15} /> <span>{tc('copy')}</span>
                </DropdownMenuItem>
              )}
              {rowCanDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleDeleteOperation(item); }}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none text-red-600"
                >
                  <Trash2 size={15} /> <span>{tc('delete')}</span>
                </DropdownMenuItem>
              )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
          <div className={`p-4 text-right font-semibold text-green-600`}>{'+'}{formatAmount(Math.round(Number(totalSummary?.total_summa) || 0))} {GlobalCurrency?.name}</div>
        </div>
      </>}

      {showModal && (
        <OperationModal
          operation={selectedOperation}
          isClosing={isModalClosing}
          isOpening={isModalOpening}
          defaultDealGuid={sellingDealId}
          onClose={() => {
            setIsModalClosing(true)
            setTimeout(() => {
              setShowModal(false)
              setIsModalClosing(false)
            }, 300)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
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

          <div className='py-6 text-base text-neutral-700' >
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

export default IncomeOperationsTable
