'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import {
  useDeleteOperation,
  useUcodeRequestInfinite,
  useUcodeRequestMutation,
} from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import operationsDto from '@/lib/dtos/operationsDto'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { handleDownload } from '@/utils/helpers'

// Eager (critical for initial render)
import ScreenLoader from '@/components/shared/ScreenLoader'

// Sub-components (split out for clarity)
import operationDto from '@/lib/dtos/operationDto'
import ImportErrorModal from '../components/ImportErrorModal'
import OperationsHeader from '../components/OperationsHeader'
import OperationsTableHeader from '../components/OperationsTableHeader'
import { useImportOperations } from '../hooks/useImportOperations'
import { useOperationsFilters } from '../hooks/useOperationsFilters'
import { useShipmentActions } from '../hooks/useShipmentActions'
import { buildFlatItems } from '../utils/operationsUtils'

// ── Lazy modals / heavy components ──────────────────────────────────────────
const CreateShipment = lazy(() => import('@/components/deals/details/CreatingShipment').then(m => ({ default: m.default || m.CreateShipment || m })))
const OperationModal = lazy(() => import('@/components/operations/OperationModal/OperationModal').then(m => ({ default: m.default || m.OperationModal || m })))
const OperationsFiltersSidebar = lazy(() => import('@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar').then(m => ({ default: m.default || m.OperationsFiltersSidebar || m })))
const DeleteConfirmModal = lazy(() => import('@/components/operations/OperationsTable/DeleteConfirmModal').then(m => ({ default: m.default || m.DeleteConfirmModal || m })))
const OperationTableRow = lazy(() => import('@/components/operations/TableRow/new').then(m => ({ default: m.default || m })))
const CustomDialog = lazy(() => import('@/components/shared/CustomDialog').then(m => ({ default: m.default || m.CustomDialog || m })))
const OperationsFooter = lazy(() => import('@/components/operations/OperationsFooter/OperationsFooter').then(m => ({ default: m.default || m.OperationsFooter || m })))

const MAX_PAGES = 500

// ── Main page ────────────────────────────────────────────────────────────────
const OperationsListPage = observer(() => {
  const t = useTranslations('Operations')
  const isMounted = useMounted()
  const queryClient = useQueryClient()

  // ── Body scroll lock never delete this section ───────────────────────────────────────────────────────
  // useEffect(() => {
  //   document.body.style.overflow = 'hidden'
  //   document.body.style.height = '100vh'
  //   return () => {
  //     document.body.style.overflow = ''
  //     document.body.style.height = ''
  //   }
  // }, [])

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [selectedOperations, setSelectedOperations] = useState([])
  const [openModal, setOpenModal] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [isModalOpening, setIsModalOpening] = useState(false)

  // ── Delete state ───────────────────────────────────────────────────────────
  const [operationToDelete, setOperationToDelete] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isShipmentDeleting, setIsShipmentDeleting] = useState(false)

  // ── Shipment state ─────────────────────────────────────────────────────────
  const {
    showShipmentModal, selectedShipment,
    isShipmentEditing, isShipmentCopying,
    handleEditShipment, handleCopyShipment,
    closeShipmentModal,
    handleDeleteShipment: _handleDeleteShipment,
  } = useShipmentActions({
    setOperationToDelete,
    setIsShipmentDeleting,
    setIsDeleteModalOpen,
  })

  // ── Permissions ────────────────────────────────────────────────────────────
  const operationPermissions = appStore.permission.operations
  const canAdd = (
    operationPermissions.income.add ||
    operationPermissions.payout.add ||
    operationPermissions.transfer.add ||
    operationPermissions.accrual.add ||
    operationPermissions.shipment.add
  )

  // ── Filters & debounced request filters ───────────────────────────────────
  const { requestOperationFilters } = useOperationsFilters(t)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingOperations,
    isLoading: isLoadingOperations,
  } = useUcodeRequestInfinite({
    method: 'list_operations_by_query',
    data: requestOperationFilters,
    querySetting: { staleTime: 1000 * 60, gcTime: 1000 * 60 },
  })


  const { data: operationsTotal } = useQuery({
    queryKey: ['get_operations_total', requestOperationFilters],
    queryFn: () => apiClient.invokeFunction({ method: "summary_operations", data: requestOperationFilters, }),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60,
    placeholderData: keepPreviousData,
    select: (response) => response?.data?.data
  })


  const allOperations = useMemo(
    () => infiniteData?.pages?.flatMap(p => p?.data?.data || []) || [],
    [infiniteData]
  )

  const totalSummary = useMemo(
    () => operationsTotal,
    [operationsTotal]
  )

  const currentPage = useMemo(
    () => infiniteData?.pageParams?.length,
    [infiniteData]
  )

  // --- Get single operation --------------------------------------------------

  const { mutateAsync: getOperation, isPending: isPendingGetOperation } = useMutation({
    mutationKey: ['get_operation'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_operation', data })
  })


  const { mutateAsync: getShipment, isPending: isPendingGetShipment } = useMutation({
    mutationKey: ['get_shipment_transaction'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_shipment_transaction', data })
  })


  // ── Safe pagination ────────────────────────────────────────────────────────
  const pageCount = infiniteData?.pages?.length || 0

  const safeFetchNextPage = useMemo(() => {
    if (pageCount >= MAX_PAGES) return () => Promise.resolve()
    return fetchNextPage
  }, [pageCount, fetchNextPage])

  const effectiveHasNextPage = hasNextPage && pageCount < MAX_PAGES

  // ── Export ─────────────────────────────────────────────────────────────────
  const { mutate: exportOperations, isPending: isExporting } = useMutation({
    mutationKey: ['export_operations'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_operations', data: requestOperationFilters }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('page.fileDownloaded'))
      const link = uploadData?.data?.link
      if (link) handleDownload(`https://cdn.u-code.io/${link}`, 'operations.xlsx')
    },
  })

  // ── Import ─────────────────────────────────────────────────────────────────
  const {
    isImporting,
    importErrorModalOpen, setImportErrorModalOpen,
    importErrorData,
    handleImportOperations,
  } = useImportOperations({ t, queryClient })

  // ── Selection ──────────────────────────────────────────────────────────────
  const isAllSelected = allOperations.length > 0 && selectedOperations.length === allOperations.length

  const toggleSelectAll = () =>
    isAllSelected
      ? setSelectedOperations([])
      : setSelectedOperations(allOperations.map(op => op.id))

  const toggleOperation = (id) =>
    setSelectedOperations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openWithAnimation = (cb) => {
    setIsModalClosing(false)
    setIsModalOpening(true)
    cb()
    setTimeout(() => setIsModalOpening(false), 50)
  }

  const closeOperationModal = () => {
    setIsModalClosing(true)
    document.body.style.overflow = 'auto'
    setTimeout(() => {
      setOpenModal(null)
      setIsModalClosing(false)
    }, 300)
  }

  const resolveModalType = (typeCategory) => {
    if (typeCategory === 'transfer') return 'transfer'
    if (typeCategory === 'payment') return 'payment'
    if (typeCategory === 'income') return 'income'
    return 'accrual'
  }

  // ── Operation actions ──────────────────────────────────────────────────────
  const openOperationModal = (operation) => {
    const { tip, operationType } = operation
    const canEdit =
      (operationPermissions.income.edit && tip === 'Поступление') ||
      (operationPermissions.payout.edit && tip === 'Выплата') ||
      (operationPermissions.transfer.edit && tip === 'Перемещение') ||
      (operationPermissions.accrual.edit && tip === 'Начисление') ||
      (operationPermissions.shipment.edit && tip === 'Отгрузка')

    if (!canEdit) return
    if (tip === 'Отгрузка') { handleEditShipment(operation); return }

    openWithAnimation(() => {
      setModalType(resolveModalType(operationType))
      setOpenModal(operation)
    })
  }

  const handleEditOperation = async (operation) => {
    const fullOpertionData = await getOperation({ guid: operation?.guid })
    const operatoinFullData = operationDto(fullOpertionData?.data?.data)


    if (operatoinFullData.tip === 'Отгрузка') { handleEditShipment(operatoinFullData); return }
    const typeMap = { transfer: 'transfer', pyment: 'payment', income: 'income', accrual: 'accrual' }
    setModalType(typeMap[operatoinFullData.operationType] || 'income')
    openOperationModal(operatoinFullData)
    setOpenModal({ ...operatoinFullData, isNew: false })
  }

  const handleDeleteOperation = (operation) => {
    if (operation.tip === 'Отгрузка') { _handleDeleteShipment(operation); return }
    setOperationToDelete(operation)
    setIsDeleteModalOpen(true)
  }

  const handleCopyOperation = async (operation) => {
    if (operation.tip === 'Отгрузка') { handleCopyShipment(operation); return }

    const fullOpertionData = await getOperation({ guid: operation?.guid })
    const operatoinFullData = operationDto(fullOpertionData?.data?.data)
    // Open modal as "new" but with the copied operation's data

    const { operationType } = operatoinFullData
    const copy = { ...operatoinFullData, }

    openWithAnimation(() => {
      setModalType(resolveModalType(operationType))
      setOpenModal({ ...copy, id: 'new', isNew: true, isCopy: true })
    })
  }

  const handleCreate = () => {
    // document.body.style.overflow = 'hidden'
    openWithAnimation(() => {
      setOpenModal({ id: 'new', isNew: true })
      setModalType('income')
    })
  }

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const deleteOperationMutation = useDeleteOperation()
  const { mutateAsync: deleteShipmentMutation, isPending: isDeletingShipment } = useUcodeRequestMutation()

  const invalidateAfterDelete = () => {
    const keys = [
      'dashboard', 'operationsList', 'find_operations',
      'get_counterparty_by_id', 'list_sales_operations',
      'get_sales_transaction', 'myAccountsBoard',
      'legalEntitiesPlanFact', 'get_my_accounts',
    ]
    keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))
  }

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return
    const guid = operationToDelete.rawData?.guid || operationToDelete.guid
    if (!guid) return

    try {
      if (isShipmentDeleting) {
        await deleteShipmentMutation({ method: 'delete_shipment_transaction', data: { guid } })
      } else {
        await deleteOperationMutation.mutateAsync([guid])
      }
      setIsDeleteModalOpen(false)
      setOperationToDelete(null)
      setIsShipmentDeleting(false)
      invalidateAfterDelete()
      queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
      queryClient.invalidateQueries({ queryKey: ['find_operations'] })
    } catch (err) {
      console.error('Error deleting operation:', err)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setOperationToDelete(null)
    setIsShipmentDeleting(false)
  }

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const operationsList = useMemo(() => ({
    future: operationsDto(allOperations, 'future'),
    today: operationsDto(allOperations, 'today'),
    before: operationsDto(allOperations, 'before'),
  }), [allOperations])

  const flatItems = useMemo(
    () => buildFlatItems(operationsList, t),
    [operationsList, t]
  )

  const scrollRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (flatItems[i]?.type === 'header' ? 36 : 56),
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed left-[80px] top-[60px] w-[calc(100%-80px)] flex h-[calc(100%-60px)]">

      {isPendingGetOperation && <ScreenLoader />}
      {/* Sidebar */}
      <Suspense fallback={<div className="w-80 bg-white border-r border-neutral-200" />}>
        <OperationsFiltersSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(v => !v)}
        />
      </Suspense>

      {/* Main */}
      <div className="w-full flex flex-col pb-3">

        <OperationsHeader
          t={t}
          isMounted={isMounted}
          canAdd={canAdd}
          isImporting={isImporting}
          isExporting={isExporting}
          searchQuery={operationFilterStore.searchQuery}
          onSearch={(e) => operationFilterStore.setSearchQuery(e.target.value)}
          onCreate={handleCreate}
          onImport={handleImportOperations}
          onExport={() => exportOperations()}
        />

        <div
          id="scrollableDiv"
          ref={scrollRef}
          className="overflow-auto h-full w-full px-2 bg-white pb-10"
        >
          <OperationsTableHeader
            t={t}
            isAllSelected={isAllSelected}
            selectedCount={selectedOperations.length}
            onSelectAll={toggleSelectAll}
          />

          {allOperations.length === 0 && !isLoadingOperations && (
            <div className="py-20 text-center text-neutral-500 bg-white">
              {t('page.noData')}
            </div>
          )}

          {/* Infinite + Virtual scroll */}
          <InfiniteScroll
            dataLength={allOperations.length}
            hasMore={effectiveHasNextPage}
            next={safeFetchNextPage}
            scrollableTarget="scrollableDiv"
          >
            <div style={{ height: totalSize, position: 'relative', paddingBottom: 10 }}>
              {virtualItems.map((virtualRow) => {
                const item = flatItems[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {item.type === 'header' ? (
                      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {item.label}
                        </h3>
                      </div>
                    ) : (
                      <Suspense fallback={<div className="h-14 bg-white border-b border-neutral-200 animate-pulse" />}>
                        <OperationTableRow
                          op={item.op}
                          selectedOperations={selectedOperations}
                          toggleOperation={toggleOperation}
                          openOperationModal={openOperationModal}
                          handleEditOperation={handleEditOperation}
                          handleDeleteOperation={handleDeleteOperation}
                          handleCopyOperation={handleCopyOperation}
                        />
                      </Suspense>
                    )}
                  </div>
                )
              })}
            </div>
          </InfiniteScroll>

          <Suspense fallback={null}>
            <OperationsFooter totalSummary={totalSummary} isFilterOpen={isFilterOpen} />
          </Suspense>
        </div>
      </div>

      {/* Loaders */}
      {isLoadingOperations && allOperations.length === 0 && <ScreenLoader className="left-0!" />}
      {(isFetchingNextPage || isFetchingOperations) && <ScreenLoader className="left-0!" />}

      {/* Operation modal */}
      {openModal && (
        <Suspense fallback={<ScreenLoader />}>
          <OperationModal
            operation={openModal}
            currentPage={currentPage}
            initialTab={modalType}
            isClosing={isModalClosing}
            isOpening={isModalOpening}
            onClose={closeOperationModal}
          />
        </Suspense>
      )}

      {/* Delete modal */}
      <Suspense fallback={null}>
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          operation={operationToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isShipmentDeleting ? isDeletingShipment : deleteOperationMutation.isPending}
        />
      </Suspense>

      {/* Shipment modal */}
      {showShipmentModal && (
        <Suspense fallback={<ScreenLoader />}>
          <CreateShipment
            open={showShipmentModal}
            onClose={closeShipmentModal}
            initialData={selectedShipment}
            isEditing={!!selectedShipment}
            shipmentId={selectedShipment?.guid}
            onSuccess={() => {
              closeShipmentModal()
              queryClient.invalidateQueries({ queryKey: ['find_operations'] })
            }}
          />
        </Suspense>
      )}

      {/* Import error modal */}
      <Suspense fallback={null}>
        <ImportErrorModal
          t={t}
          isOpen={importErrorModalOpen}
          data={importErrorData}
          onClose={() => setImportErrorModalOpen(false)}
          CustomDialog={CustomDialog}
        />
      </Suspense>
    </div>
  )
})

export default OperationsListPage