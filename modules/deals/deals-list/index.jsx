'use client'

import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import Segmented from '@/components/shared/Segmented/Segmented'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { Banknote, FileText, Percent, Search, TrendingUp } from 'lucide-react'
import { useScrollDetector } from '@/hooks/useScrollDetector'
import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

import { useUcodeDefaultApiQuery, useUcodeRequestInfinite, useUcodeRequestMutation } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { sealDeal } from '@/store/saleDeal.store'
import { formatAmount, handleDownload, StringtoNumber } from '@/utils/helpers'


import ScreenLoader from '@/components/shared/ScreenLoader'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import { showErrorNotification } from '@/lib/utils/notifications'
import FixedContent from '@/layouts/FixedContent'
import { toJS } from 'mobx'
import moment from 'moment'
import DealsHeader from '../components/DealsHeader'
import DealsTable from '../components/DealsTable'
import { useDealsActions } from '../hooks/useDealsActions'

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
  const tErrors = useTranslations('Errors')
  const mounted = useMounted()
  const queryClient = useQueryClient()

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
  const [dealToDelete, setDealToDelete] = useState(null)
  const [dealToEdit, setDealToEdit] = useState(null)
  const [dealToCopy, setDealToCopy] = useState(null)
  const [canUpdateForms, setCanUpdateForms] = useState(false)

  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000)

  const dealPermission = appStore.permission.deals.sales || appStore.permission.deals

  // ── Store state ────────────────────────────────────────────────────────────
  const {
    selectedCounterparties, selectedProjects, dealsMethod, dateRange,
    amountFrom, amountTo, profitFrom, profitTo,
    status, schoolYear, search: searchValue, setState,
  } = sealDeal

  // ── Debounced search ───────────────────────────────────────────────────────
  // const [search, setSearch] = useState('')

  const handleSearch = (value) => {
    setState('search', value || null)
  }

  const dateRanges = useMemo(() => toJS(dateRange), [dateRange])
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
    project_ids: selectedProjects?.length > 0 ? selectedProjects : null,
    status: status?.length > 0 ? status : null,
    school_year: appStore.isDonoSchool ? schoolYear || null : null,
    accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
    isCalculation: false,
  }), [
    searchValue, dateRanges, amountFrom, amountTo,
    profitFrom, profitTo, selectedCounterparties, selectedProjects,
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

  // Статусы — тот же запрос, что в окне фильтров (общий кэш)
  const { data: statusList } = useUcodeDefaultApiQuery({
    queryKey: 'sales_status',
    urlMethod: 'GET',
    urlParams: '/items/sales_status?from-ofs=true',
    data: {},
    querySetting: {
      select: response => response?.data?.data?.response,
      staleTime: 1000 * 60 * 60,
      placeholder: keepPreviousData,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  })

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
        // Бэк отвечает 200 с телом-ошибкой, поэтому проверяем и успешный ответ
        onSuccess: (result) => {
          if (isObjectInUseError(result)) {
            showErrorNotification(tErrors('cannotDelete.deal'))
            return
          }
          queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
          setDealToDelete(null)
        },
        onError: (error) => {
          if (isObjectInUseError(error)) showErrorNotification(tErrors('cannotDelete.deal'))
        },
      }
    )
  }

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

  // Итоги — те же, что были в полосе внизу, плюс рентабельность (прибыль / сумма сделок)
  const totalSum = Number(summary?.total_deals_sum) || 0
  const profitValue = Number(totalProfit) || 0
  const margin = totalSum ? Math.round((profitValue / totalSum) * 1000) / 10 : 0
  const kpis = [
    { key: 'count', label: t('kpi.count'), value: summary?.count || 0, hint: t('kpi.countHint'), icon: FileText },
    { key: 'sum', label: t('kpi.sum'), value: totalSum, currency: GlobalCurrency?.name, hint: t('kpi.sumHint'), icon: Banknote },
    {
      key: 'profit',
      label: t('kpi.profit'),
      value: profitValue,
      currency: GlobalCurrency?.name,
      hint: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
      icon: TrendingUp,
      tone: 'signed',
    },
    { key: 'margin', label: t('kpi.margin'), value: margin, currency: '%', hint: t('kpi.marginHint'), icon: Percent, tone: 'signed' },
  ]

  // Быстрый фильтр по статусу — вкладками над таблицей; в окне фильтров остаётся множественный выбор
  const activeStatus = status?.length === 1 ? status[0] : status?.length ? null : 'all'
  const statusTabs = [
    { value: 'all', label: t('statusAll') },
    ...(statusList || []).map(item => ({ value: item.guid, label: item.name, color: item.color })),
  ]

  return (
    <FixedContent>
      {/* ── Filter Sidebar (lazy) ── */}
      <Suspense fallback={<div className="w-[240px] bg-neutral-50 border-r border-neutral-200 animate-pulse" />}>
        <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </Suspense>

      {/* ── Main content ── */}
      <main id="scrollableDiv" ref={scrollRef} onScroll={handleScroll} className="w-full relative overflow-auto scroll-smooth bg-canvas px-6 pb-10">

        <DealsHeader
          t={t}
          dealPermission={dealPermission}
          isDealsExportLoading={isDealsExportLoading}
          onExport={exportDeals}
          onCreateDeal={() => setIsCreateModalOpen(true)}
          onCreateStudent={() => {
            setShowCreateStudentModal(true)
            setDealToEdit(null)
          }}
          count={summary?.count ?? null}
        />

        {/* Метод учёта — от него зависят прибыль в карточках и в таблице */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('methodLabel')}</span>
          <Segmented
            ariaLabel={t('methodLabel')}
            options={methodOptions}
            value={dealsMethod}
            onChange={(v) => setState('dealsMethod', v)}
          />
        </div>

        {/* Итоги по сделкам — наверху и крупно, а не мелкой строкой внизу */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {kpis.map(({ key, ...kpi }) => (
            <KpiCard key={key} {...kpi} />
          ))}
        </div>

        <TableCard className="min-w-fit overflow-visible">
          {/* Поиск, метод учёта и фильтры — в панели над таблицей */}
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            }
            actions={<FilterButton onClick={() => setIsFilterOpen(true)} />}
            className="rounded-t-xl"
          />

          {/* Вкладки статусов */}
          {statusTabs.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist">
              {statusTabs.map(tab => {
                const active = activeStatus === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setState('status', tab.value === 'all' ? [] : [tab.value])}
                    className={cn(
                      '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium cursor-pointer transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0e73f6]',
                      active ? 'border-[#0e73f6] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                    )}
                  >
                    {tab.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

        <DealsTable
          t={t}
          formattedDeals={formattedDeals}
          dealsMethod={dealsMethod}
          dealPermission={dealPermission}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          fetchNextPage={fetchNextPage}
          onRowClick={handleRowClick}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          onCopyClick={handleCopyClick}
          onUpdate={handleUpdate}
        />
        </TableCard>
        {/* Loaders */}
        {isLoading && formattedDeals.length === 0 && <ScreenLoader className="left-0!" />}
        {(isFetchingNextPage || isFetching) && !isScrolling && <ScreenLoader className="left-0!" />}
      </main>

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