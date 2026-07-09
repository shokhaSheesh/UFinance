'use client'

import { useScrollDetector } from '@/hooks/useScrollDetector'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

import { useUcodeRequestInfinite, useUcodeRequestMutation } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { sealDeal } from '@/store/saleDeal.store'
import { formatAmount, handleDownload, StringtoNumber } from '@/utils/helpers'


import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { toJS } from 'mobx'
import moment from 'moment'
import PurchasesFooter from '../components/PurchasesFooter'
import PurchasesHeader from '../components/PurchasesHeader'
import PurchasesTable from '../components/PurchasesTable'
import { usePurchasesActions } from '../hooks/usePurchasesActions'
import { usePurchasesSelection } from '../hooks/usePurchasesSelection'

export function formatPurchases(rawDeals = [], t) {
  return rawDeals.map(deal => ({
    ...deal,
    guid: deal.guid,
    data_nachala: deal.purchase_date || deal.deal_date,
    nazvanie: deal.name,
    Data_sdelki: deal.purchase_date || deal.deal_date,
    Nazvanie: deal.name,
    partner_name: deal.counterparty_name || '-',
    kontragent: { nazvanie: deal.counterparty_name || '-' },
    status: deal.purchase_status?.[0] || deal.Status?.[0] || t('statusNew'),
    summa_sdelki: deal?.deal_amount || deal?.total_products_summa || 0,
    postupilo: deal?.paid_percent != null ? `${Math.round(deal.paid_percent)}%` : (deal?.receipts_percentage ? `${Math.round(deal.receipts_percentage)}%` : '0%'),
    otgruzheno: deal?.supply_percent != null ? `${Math.round(deal.supply_percent)}%` : (deal?.shipments_percentage ? `${Math.round(deal.shipments_percentage)}%` : '0%'),
    pribyl: deal?.profit,
    comment: deal?.commentary || deal?.Kommentariy,
  }))
}


// ─── Lazy-loaded heavy modals ────────────────────────────────────────────────
const FilterSidebar = lazy(() => import('@/components/deals/FilterSidebar'))
const CreateDealModal = lazy(() => import('@/components/deals/CreateDealModal/CreateDealModal').then(m => ({ default: m.CreateDealModal })))
const CreateStudentModal = lazy(() => import('@/components/deals/CreateStudentModal'))
const DeleteDealModal = lazy(() => import('@/components/deals/DeleteDealModal/DeleteDealModal').then(m => ({ default: m.DeleteDealModal })))

// ─── Modal Fallback ──────────────────────────────────────────────────────────
const ModalFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
    </div>
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────
export default observer(function PurchasesPage() {
  const router = useRouter()
  const t = useTranslations('Deals')
  const tc = useTranslations('Common')
  const mounted = useMounted()
  const queryClient = useQueryClient()

  const [isFilterOpen, setIsFilterOpen] = useState(true)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
  const [dealToDelete, setDealToDelete] = useState(null)
  const [dealToEdit, setDealToEdit] = useState(null)
  const [dealToCopy, setDealToCopy] = useState(null)
  const [canUpdateForms, setCanUpdateForms] = useState(false)

  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000)

  const dealPermission = appStore.permission.deals

  // ── Store state ────────────────────────────────────────────────────────────
  const {
    selectedCounterparties, dealsMethod, dateRange,
    amountFrom, amountTo, profitFrom, profitTo,
    status, search: searchValue, setState,
  } = sealDeal

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleSearch = (value) => {
    setState('search', value || null)
  }

  const dateRanges = toJS(dateRange)
  // ── Filters ────────────────────────────────────────────────────────────────
  const dealsFilters = useMemo(() => ({
    limit: 50,
    search: searchValue,
    from_date: dateRanges?.start ? moment(dateRanges?.start).format('YYYY-MM-DD') : null,
    to_date: dateRanges?.end ? moment(dateRanges?.end).format('YYYY-MM-DD') : null,
    amount_from: StringtoNumber(amountFrom) || null,
    amount_to: StringtoNumber(amountTo) || null,
    profit_from: StringtoNumber(profitFrom) || null,
    profit_to: StringtoNumber(profitTo) || null,
    counterparty_ids: selectedCounterparties?.length > 0 ? selectedCounterparties : null,
    status: status?.length > 0 ? status : null,
    accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
    isCalculation: false,
    branch_id: authStore.branch_id,
  }), [
    searchValue, dateRanges, amountFrom, amountTo,
    profitFrom, profitTo, selectedCounterparties,
    status, dealsMethod, t, authStore.branch_id
  ])

  // Outer debounce: delays actual request (1 second)
  const [requestOperationFilters, setRequestOperationFilters] = useState(dealsFilters)

  useEffect(() => {
    const timer = setTimeout(() => setRequestOperationFilters(dealsFilters), 1000)
    return () => clearTimeout(timer)
  }, [dealsFilters])

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useUcodeRequestInfinite({
    method: 'get_purchase_list',
    data: requestOperationFilters,
    querySetting: { staleTime: 0, cacheTime: 0 },
  })

  const allDeals = useMemo(
    () => infiniteData?.pages?.flatMap(p => p?.data?.data || []) || [],
    [infiniteData]
  )

  const summary = useMemo(
    () => infiniteData?.pages?.[0]?.data?.summary,
    [infiniteData]
  )

  const formattedDeals = useMemo(
    () => formatPurchases(allDeals, t),
    [allDeals, t]
  )

  const totalProfit = dealsMethod === 'accrual_method'
    ? summary?.accrual_profit
    : summary?.cash_profit

  // ── Export ─────────────────────────────────────────────────────────────────
  const { mutate: exportDeals, isPending: isDealsExportLoading } = useMutation({
    mutationKey: ['export_purchases'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_deals', data: dealsFilters }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('fileDownloaded'))
      const link = uploadData?.data?.link
      if (link) handleDownload(`https://cdn.u-code.io/${link}`, 'balance_report.xlsx')
    },
  })

  // ── Delete ─────────────────────────────────────────────────────────────────
  const { mutate: deleteDeal, isPending: isDeletingDeal } = useUcodeRequestMutation()

  const confirmDelete = () => {
    if (!dealToDelete) return
    deleteDeal(
      { method: 'delete_purchase_transaction', data: { guid: dealToDelete.guid, branch_id: authStore.branch_id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['get_purchase_list'] })
          removeSelected(dealToDelete.guid)
          setDealToDelete(null)
        },
      }
    )
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  const { selectedDeals, isAllSelected, handleSelectAll, handleSelectOne, removeSelected } =
    usePurchasesSelection(formattedDeals)

  // ── Row actions ────────────────────────────────────────────────────────────
  const { handleRowClick, handleDeleteClick, handleEditClick, handleCopyClick, handleUpdate } =
    usePurchasesActions({
      router,
      dealPermission,
      setDealToDelete,
      setDealToEdit,
      setDealToCopy,
      setIsCreateModalOpen,
      setShowCreateStudentModal,
      setCanUpdateForms,
    })

  // ── Modal closers ──────────────────────────────────────────────────────────
  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setDealToEdit(null)
    setDealToCopy(null)
  }

  const closeStudentModal = () => {
    setShowCreateStudentModal(false)
  }

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!mounted) return null

  const methodOptions = [
    { value: 'accrual_method', label: t('methods.accrual') },
    { value: 'cash_method', label: t('methods.cash') },
  ]

  return (
    <FixedContent>
      {/* ── Filter Sidebar (lazy) ── */}
      <Suspense fallback={<div className="w-[240px] bg-neutral-50 border-r border-neutral-200 animate-pulse" />}>
        <FilterSidebar onOpenChange={setIsFilterOpen} />
      </Suspense>

      {/* ── Main content ── */}
      <main id="scrollableDiv" ref={scrollRef} onScroll={handleScroll} className="w-full relative overflow-y-auto scroll-smooth bg-white px-2">

        <PurchasesHeader
          t={t}
          dealPermission={dealPermission}
          searchValue={searchValue}
          dealsMethod={dealsMethod}
          methodOptions={methodOptions}
          isDealsExportLoading={isDealsExportLoading}
          onSearch={handleSearch}
          onExport={exportDeals}
          onCreateDeal={() => setIsCreateModalOpen(true)}
          onCreateStudent={() => {
            setShowCreateStudentModal(true)
            setDealToEdit(null)
          }}
          onMethodChange={(v) => setState('dealsMethod', v)}
        />

        <PurchasesTable
          t={t}
          tc={tc}
          formattedDeals={formattedDeals}
          selectedDeals={selectedDeals}
          isAllSelected={isAllSelected}
          dealsMethod={dealsMethod}
          dealPermission={dealPermission}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          fetchNextPage={fetchNextPage}
          onRowClick={handleRowClick}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          onCopyClick={handleCopyClick}
          onUpdate={handleUpdate}
        />
        {/* Loaders */}
        {isLoading && formattedDeals.length === 0 && <ScreenLoader className="left-0!" />}
        {(isFetchingNextPage || isFetching) && !isScrolling && <ScreenLoader className="left-0!" />}
      </main>

      <PurchasesFooter
        t={t}
        summary={summary}
        totalProfit={totalProfit}
        isFilterOpen={isFilterOpen}
      />

      {/* ── Lazy Modals ── */}
      <Suspense fallback={showCreateStudentModal ? <ModalFallback /> : null}>
        <CreateStudentModal
          dealGuid={dealToEdit?.guid || null}
          isOpen={showCreateStudentModal}
          onClose={closeStudentModal}
          canUpdateForms={canUpdateForms}
        />
      </Suspense>

      <Suspense fallback={isCreateModalOpen ? <ModalFallback /> : null}>
        <CreateDealModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          initialData={dealToEdit || dealToCopy}
          isEditing={!!dealToEdit}
          createMethod="create_purchase_transaction"
          updateMethod="update_purchase_transaction"
          invalidateKeys={['get_purchase_list', 'get_purchase_transaction_by_guid']}
          redirectBase="/purchases"
        />
      </Suspense>

      <Suspense fallback={dealToDelete ? <ModalFallback /> : null}>
        <DeleteDealModal
          isOpen={!!dealToDelete}
          onClose={() => setDealToDelete(null)}
          onConfirm={confirmDelete}
          isDeleting={isDeletingDeal}
          deal={dealToDelete ? {
            name: dealToDelete.nazvanie || dealToDelete.guid?.substring(0, 8),
            client: dealToDelete.kontragent?.nazvanie,
            amount: formatAmount(dealToDelete.summa_sdelki),
          } : null}
        />
      </Suspense>
    </FixedContent>
  )
})
