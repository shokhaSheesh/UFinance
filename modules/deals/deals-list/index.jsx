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
import { sealDeal } from '@/store/saleDeal.store'
import { formatAmount, handleDownload, StringtoNumber } from '@/utils/helpers'


import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { toJS } from 'mobx'
import moment from 'moment'
import DealsFooter from '../components/DealsFooter'
import DealsHeader from '../components/DealsHeader'
import DealsTable from '../components/DealsTable'
import { useDealsActions } from '../hooks/useDealsActions'
import { useDealsSelection } from '../hooks/useDealsSelection'

export function formatDeals(rawDeals = [], t) {
  return rawDeals.map(deal => ({
    ...deal,
    guid: deal.guid,
    data_nachala: deal.Data_sdelki,
    nazvanie: deal.Nazvanie,
    kontragent: { nazvanie: deal.partner_name || '-' },
    status: deal.Status?.[0] || t('statusNew'),
    summa_sdelki: deal?.total_products_summa || 0,
    postupilo: deal?.receipts_percentage ? `${Math.round(deal.receipts_percentage)}%` : '0%',
    otgruzheno: deal?.shipments_percentage ? `${Math.round(deal.shipments_percentage)}%` : '0%',
    pribyl: deal?.profit,
    comment: deal?.Kommentariy,
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
export default observer(function DealsPage() {
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
    status, schoolYear, search: searchValue, setState,
  } = sealDeal

  // ── Debounced search ───────────────────────────────────────────────────────
  // const [search, setSearch] = useState('')

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
    school_year: appStore.isDonoSchool ? schoolYear || null : null,
    accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
    isCalculation: false,
  }), [
    searchValue, dateRanges, amountFrom, amountTo,
    profitFrom, profitTo, selectedCounterparties,
    status, dealsMethod, schoolYear, t
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
    method: 'get_sales_list_simple',
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
    () => formatDeals(allDeals, t),
    [allDeals, t]
  )

  const totalProfit = dealsMethod === 'accrual_method'
    ? summary?.accrual_profit
    : summary?.cash_profit

  // ── Export ─────────────────────────────────────────────────────────────────
  const { mutate: exportDeals, isPending: isDealsExportLoading } = useMutation({
    mutationKey: ['export_deals'],
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
      { method: 'delete_sales_transaction', data: { guid: dealToDelete.guid } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
          removeSelected(dealToDelete.guid)
          setDealToDelete(null)
        },
      }
    )
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  const { selectedDeals, isAllSelected, handleSelectAll, handleSelectOne, removeSelected } =
    useDealsSelection(formattedDeals)

  // ── Row actions ────────────────────────────────────────────────────────────
  const { handleRowClick, handleDeleteClick, handleEditClick, handleCopyClick, handleUpdate } =
    useDealsActions({
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

        <DealsHeader
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

        <DealsTable
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

      <DealsFooter
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