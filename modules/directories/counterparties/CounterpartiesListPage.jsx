"use client"
import { FilterField } from '@/components/shared/Filters/FilterDrawer'
import TableCard from '@/components/shared/Table/TableCard'
import TableOnlyToggle, { Collapsible, useTableOnly } from '@/components/shared/Table/TableOnlyToggle'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import IconButton from '@/components/shared/Buttons/IconButton'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import Segmented from '@/components/shared/Segmented/Segmented'
import FilterButton from '@/components/shared/Filters/FilterButton'
import { CounterpartyMenu } from '@/components/directories/CounterpartyMenu/CounterpartyMenu'
import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import { DeleteCounterpartyConfirmModal } from '@/components/directories/DeleteCounterpartyConfirmModal/DeleteCounterpartyConfirmModal'
import EditCounterpartyGroupModal from '@/components/directories/EditCounterpartyGroupModal/EditCounterpartyGroupModal'
import { DeleteGroupConfirmModal } from '@/components/directories/DeleteGroupConfirmModal/DeleteGroupConfirmModal'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import { GroupMenu } from '@/components/directories/GroupMenu/GroupMenu'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { SearchBar } from '@/components/directories/SearchBar/SearchBar'
import MultiSelectStatiya from '@/components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useDeleteCounterparties, useDeleteCounterpartiesGroups, useUcodeRequestInfinite } from '@/hooks/useDashboard'
import { useScrollDetector } from '@/hooks/useScrollDetector'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Download, Folder, FolderOpen, FolderTree, List, Plus, Scale, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

// Ширины колонок — общие для шапки и строк, чтобы колонки не расходились
const COL = {
  group: 'w-40 shrink-0',
  inn: 'w-32 shrink-0',
  ops: 'w-24 shrink-0',
  amount: 'w-32 shrink-0',
  menu: 'w-10 shrink-0',
}

/**
 * Сумма в строке таблицы. Нули бледные — строки с оборотами видны сразу.
 * signed — знак цветом (разница, прибыль); иначе отрицательные показываются
 * нулём, как и раньше, если не allowNegative.
 */
function AmountCell({ value, signed = false, allowNegative = false, strong = false }) {
  const n = Number(value) || 0
  const shown = signed || allowNegative ? n : Math.max(n, 0)
  return (
    <div
      className={cn(
        COL.amount,
        'px-3 text-right tabular-nums',
        strong && 'font-semibold',
        shown === 0
          ? 'text-slate-300'
          : signed
            ? shown > 0 ? 'text-emerald-700' : 'text-red-600'
            : 'text-slate-900'
      )}
    >
      {shown === 0 ? '0' : formatAmount(shown)}
    </div>
  )
}

/** Инициалы контрагента в кружке — глазу проще зацепиться за строку в длинном списке. */
function Monogram({ name }) {
  const letters = (name || '')
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
      {letters || '—'}
    </span>
  )
}

function CounterpartyRow({ item, nested = false, showGroup, isCashflow, onOpen, onEdit, onDelete }) {
  return (
    <div
      className="flex min-h-[52px] cursor-pointer items-center border-b border-slate-100 bg-white text-sm transition-colors hover:bg-[#f5f8ff]"
      onClick={onOpen}
    >
      <div className={cn('flex min-w-[220px] flex-1 items-center gap-3 px-4', nested && 'pl-[76px]')}>
        <Monogram name={item.nazvanie} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-slate-900">{item.nazvanie}</span>
          {item.komentariy && <span className="truncate text-xs text-slate-400">{item.komentariy}</span>}
        </div>
      </div>
      {showGroup && (
        <div className={cn(COL.group, 'px-3')}>
          {item.gruppa ? (
            <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {item.gruppa}
            </span>
          ) : (
            <span className="text-slate-300">–</span>
          )}
        </div>
      )}
      {!isCashflow && <div className={cn(COL.inn, 'truncate px-3 tabular-nums text-slate-600')}>{item.inn || '–'}</div>}
      <div className={cn(COL.ops, 'px-3 text-right tabular-nums text-slate-600')}>{item?.operationCount ?? 0}</div>
      <AmountCell value={item.debitorka} />
      <AmountCell value={item.kreditorka} />
      <AmountCell value={item.income} />
      <AmountCell value={item.expenses} />
      <AmountCell value={isCashflow ? item.difference : item.profit} signed />
      <div className={cn(COL.menu, 'flex items-center justify-center group')} onClick={(e) => e.stopPropagation()}>
        <CounterpartyMenu counterparty={item} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

/**
 * Список контрагентов. Тот же экран обслуживает справочник «Студенты»:
 * студенты — это контрагенты с `is_student`, поэтому отличаются только фильтр
 * запроса, маршрут карточки и несколько подписей.
 */
const CounterpartiesListPage = observer(({ isStudent = false }) => {
  const t = useTranslations('Directories.counterparty')
  const tf = useTranslations('filters')
  const ts = useTranslations('Directories.student')
  const tc = useTranslations('Common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'nested' | 'groups'
  const [editingCounterparty, setEditingCounterparty] = useState(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [preselectedGroupId, setPreselectedGroupId] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  // Шапка, метод учёта и итоги закреплены сверху при прокрутке (просьба PO:
  // цифры всегда перед глазами). После начала прокрутки карточки ужимаются,
  // чтобы закреплённый блок не съедал экран. Высоту блока меряем — под ней
  // прилипает шапка колонок таблицы.
  const stickyRef = useRef(null)
  const [stickyHeight, setStickyHeight] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [tableOnly, toggleTableOnly] = useTableOnly(isStudent ? 'students' : 'counterparties')
  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    const update = () => setStickyHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const directoryPermissions = appStore.permission.directories
  const canAdd = isMounted && directoryPermissions?.counterparties?.add

  // Карточка у обоих справочников общая — меняется только базовый маршрут
  const detailBasePath = isStudent ? '/directories/students' : '/directories/counterparties'

  const pluralCount = (count, one, few, many) =>
    count === 1 ? one({ count }) : count < 5 ? few({ count }) : many({ count })

  const labels = isStudent
    ? {
      title: ts('title'),
      empty: ts('empty'),
      emptyInGroup: ts('emptyInGroup'),
      count: (count) =>
        pluralCount(
          count,
          (v) => ts('count', v),
          (v) => ts('countPlural', v),
          (v) => ts('countPluralMany', v)
        ),
    }
    : {
      title: t('list.title'),
      empty: t('list.empty'),
      emptyInGroup: 'Нет контрагентов',
      count: (count) =>
        pluralCount(
          count,
          (v) => t('list.counterpartyCount', v),
          (v) => t('list.counterpartyCountPlural', v),
          (v) => t('list.counterpartyCountPluralMany', v)
        ),
    }

  const filters = counterpartiesStore.filters
  const setFilters = (updater) => {
    if (typeof updater === 'function') {
      counterpartiesStore.setFilters(updater(counterpartiesStore.filters))
    } else {
      counterpartiesStore.setFilters(updater)
    }
  }

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build filters object immediately (for debouncing)
  const immediateFilterData = useMemo(() => {
    return {
      limit: viewMode === 'list' ? 50 : 1000,
      debitPaymentTypes: filters.debitPaymentTypes,
      creditPaymentTypes: filters.creditPaymentTypes,
      operationDateStart: filters.operationDateStart,
      operationDateEnd: filters.operationDateEnd,
      calculationMethod: filters.calculationMethod,
      contrAgentId: filters.selectedCounterparties,
      operationCategoryId: filters.selectedChartOfAccounts,
      sellingDealId: filters.deals,
      legalEntitiesId: filters.selectedLegalEntities,
      searchString: viewMode === 'list' ? debouncedSearchQuery : '',
      // справочник «Студенты» — те же контрагенты, отфильтрованные бэком
      ...(isStudent && { is_student: true }),
    }
  }, [filters, debouncedSearchQuery, viewMode, isStudent])

  // State for debounced filters (1 second delay)
  const [requestFilterData, setRequestFilterData] = useState(immediateFilterData)

  // Debounce all filter changes with 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setRequestFilterData(immediateFilterData)
    }, 1000)

    return () => clearTimeout(timer)
  }, [immediateFilterData])

  // Fetch counterparties using infinite scroll API
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
    isLoading: isLoadingCounterparties
  } = useUcodeRequestInfinite({
    method: 'get_counterparties',
    data: requestFilterData,
    querySetting: {
      select: response => response,
      staleTime: 0,
      cacheTime: 0,
    },
  })

  const { data } = useQuery({
    queryKey: ['get_counterpaties_total', isStudent, requestFilterData],
    queryFn: () => apiClient.invokeFunction({ method: 'get_counterparties_summary', data: requestFilterData }),
    placeholderData: keepPreviousData,
    select: data => data?.data?.data
  })

  const couterpartiesSummary = useMemo(() => {
    return {
      count: data?.counterparties_count || 0,
      income: data?.income || 0,
      debitorka: data?.debitorka,
      expense: data?.expense,
      kreditorka: data?.kreditorka,
      profit: data?.profit,
      difference: data?.difference
    }
  }, [data])

  const { mutate: exportCounterparties, isPending: isCounterpartiesExportLoading } = useMutation({
    mutationKey: ['export_counterparties'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_counterparties', data: requestFilterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(tc('fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'balance_report.xlsx')
      }
    }
  })

  const allCounterparties = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
  }, [infiniteData])


  const [expandedGroups, setExpandedGroups] = useState(new Set())



  // Convert counterparties API data to component format with grouping
  const { groupedCounterparties, flatCounterparties } = useMemo(() => {
    const items = allCounterparties.map((item, index) => ({
      id: item.guid || `counterparty-${index}`,
      guid: item.guid,
      nazvanie: item.nazvanie || 'Без названия',
      polnoe_imya: item.polnoe_imya || null,
      gruppa: item.group_name || null,
      inn: item.inn || null,
      kpp: item.kpp || null,
      nomer_scheta: item.account_number || null,
      counterparties_group_id: item.counterparties_group_id || null,
      counterparties_group: item.group_name || null,
      komentariy: item.komentariy || null,
      data_sozdaniya: item.data_sozdaniya ? new Date(item.data_sozdaniya)?.toLocaleDateString('ru-RU') : null,
      receivables: item.receivables || 0,
      payables: item.payables || 0,
      debitorka: item.debitorka || 0,
      chart_of_accounts_id: item.chart_of_accounts_id || null,
      chart_of_accounts_id_2: item.chart_of_accounts_id_2 || null,
      primenyatь_statьi_po_umolchaniyu: item.primenyatь_statьi_po_umolchaniyu,
      difference: item?.difference,
      kreditorka: item.kreditorka || 0,
      profit: item.profit || 0,
      income: item?.income,
      expenses: item?.expense,
      rawData: item,
      operationCount: item?.operations_count
    }))

    const groupsMap = {}
    items.forEach(item => {
      const groupId = item.counterparties_group_id || 'no-group'
      const groupName = item.counterparties_group || 'Без группы'

      if (!groupsMap[groupId]) {
        groupsMap[groupId] = {
          id: `group-${groupId}`,
          guid: groupId === 'no-group' ? null : groupId,
          nazvanie: groupName,
          items: [],
          operationsCount: 0,
          receivables: 0,
          payables: 0,
          debitorka: 0,
          kreditorka: 0,
          profit: 0,
          income: 0,
          expenses: 0,
          difference: 0
        }
      }

      groupsMap[groupId].items.push(item)
      groupsMap[groupId].receivables += (item.receivables || 0)
      groupsMap[groupId].payables += (item.payables || 0)
      groupsMap[groupId].debitorka += (item.debitorka || 0)
      groupsMap[groupId].kreditorka += (item.kreditorka || 0)
      groupsMap[groupId].profit += (item.profit || 0)
      groupsMap[groupId].income += (item.income || 0)
      groupsMap[groupId].expenses += (item.expenses || 0)
      groupsMap[groupId].difference += (item.difference || 0)
      groupsMap[groupId].operationsCount += (item.operationCount || 0)
    })

    const groupedData = Object.values(groupsMap).map(group => ({
      ...group,
      isGroup: true
    }))

    return {
      groupedCounterparties: groupedData,
      flatCounterparties: items
    }
  }, [allCounterparties])


  // Create array of only groups for 'groups' view mode
  const counterpartiesGroups = useMemo(() => {
    return groupedCounterparties.map((group) => ({
      id: group.id,
      guid: group.guid,
      nazvanie: group.nazvanie,
      opisanie_gruppy: null,
      data_sozdaniya: null,
      isGroup: true,
      items: []
    }))
  }, [groupedCounterparties])
  const deleteMutation = useDeleteCounterparties()
  const deleteGroupMutation = useDeleteCounterpartiesGroups()

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }


  const isCashflow = filters.calculationMethod === 'Cashflow'
  const rows = viewMode === 'groups' ? counterpartiesGroups : viewMode === 'nested' ? groupedCounterparties : flatCounterparties

  // Итоги — те же, что были в полосе внизу; подписи меняются вместе с методом учёта, как в шапке таблицы
  const kpis = [
    { key: 'receivables', label: t('list.summary.receivables'), value: couterpartiesSummary?.debitorka, hint: t('list.kpi.receivablesHint'), icon: ArrowDownLeft },
    { key: 'payables', label: t('list.summary.payables'), value: couterpartiesSummary?.kreditorka, hint: t('list.kpi.payablesHint'), icon: ArrowUpRight },
    {
      key: 'income',
      label: isCashflow ? t('list.summary.receipts') : t('list.tableHeaders.income'),
      value: couterpartiesSummary?.income,
      hint: isCashflow ? t('list.kpi.receiptsHint') : t('list.kpi.incomeHint'),
      icon: TrendingUp,
    },
    {
      key: 'expense',
      label: isCashflow ? t('list.summary.payments') : t('list.tableHeaders.expense'),
      value: couterpartiesSummary?.expense,
      hint: isCashflow ? t('list.kpi.paymentsHint') : t('list.kpi.expenseHint'),
      icon: TrendingDown,
    },
    {
      key: 'result',
      label: isCashflow ? t('list.summary.difference') : t('list.tableHeaders.profit'),
      value: isCashflow ? couterpartiesSummary?.difference : (couterpartiesSummary?.profit ?? couterpartiesSummary?.difference),
      hint: isCashflow ? t('list.kpi.differenceHint') : t('list.kpi.profitHint'),
      icon: Scale,
      tone: 'signed',
    },
  ]

  return (
    <div className="w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] flex h-[calc(100%-60px)]  fixed left-[var(--sidebar-w)] top-[60px]">
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        clearCount={counterpartiesStore.activeFilterCount}
        onClear={counterpartiesStore.resetFilters}
      >
        <FilterSection title={t('list.filters.period')}>
          <FilterField full>
            <NewDateRangeComponent
              value={filters.dateRange}
              onChange={(range) => {
                const startDate = range?.start ? formatDate(new Date(range.start)) : ''
                const endDate = range?.end ? formatDate(new Date(range.end)) : ''
                setFilters(prev => ({
                  ...prev,
                  dateRange: range,
                  operationDateStart: startDate,
                  operationDateEnd: endDate,
                }))
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title={t('list.filters.parameters')}>
          <FilterField label={tf('counterparties')}>
            <SelectCounterParties
              value={filters.selectedCounterparties}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedCounterparties: values }))}
              placeholder={tf('all')}
              dropdownClassName="w-56"
            />
          </FilterField>
          <FilterField label={t('list.filters.selectChartOfAccounts')}>
            <MultiSelectStatiya
              value={filters.selectedChartOfAccounts}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedChartOfAccounts: values }))}
              placeholder={tf('all')}
              dropdownClassName="w-64"
            />
          </FilterField>
          <FilterField label={tf('deals')}>
            <MultiSelectZdelka
              value={filters.deals}
              onChange={(values) => setFilters(prev => ({ ...prev, deals: values }))}
              placeholder={tf('all')}
              dropdownClassName="w-64"
            />
          </FilterField>
          <FilterField label={t('list.filters.selectLegalEntities')}>
            <SelectLegelEntitties
              value={filters.selectedLegalEntities}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedLegalEntities: values }))}
              placeholder={tf('all')}
              multi={true}
            />
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      <div
        id="scrollableDiv"
        ref={scrollRef}
        onScroll={(e) => {
          handleScroll(e)
          setIsScrolled(e.currentTarget.scrollTop > 8)
        }}
        className="w-full h-full flex-1 overflow-auto bg-canvas px-6 pb-10"
      >
        {/* Закреплённый блок: шапка, метод учёта и итоги */}
        <div ref={stickyRef} className={cn('sticky top-0 z-40 bg-canvas', isScrolled && !tableOnly && 'shadow-[0_1px_0_#e2e8f0]', tableOnly && 'pt-4')}>
        {/* «Только таблица» сворачивает шапку, метод учёта и итоги */}
        <Collapsible collapsed={tableOnly}>
        {/* Шапка: заголовок с количеством слева, выгрузка и создание справа */}
        <div className="flex h-16 items-center justify-between">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="shrink-0 text-xl font-semibold text-slate-900">{labels.title}</h1>
            <span className="truncate text-sm text-slate-500 tabular-nums">{labels.count(couterpartiesSummary?.count || 0)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IconButton icon={Download} label={t('list.downloadExcel')} onClick={exportCounterparties} loading={isCounterpartiesExportLoading} />
            {isMounted && canAdd && (
              <button onClick={() => setIsCreateModalOpen(true)} className="primary-btn gap-1.5">
                <Plus size={16} />
                {t('list.createButton')}
              </button>
            )}
          </div>
        </div>

        {/* Метод учёта — раньше прятался в выпадающем списке, хотя от него зависят все суммы на странице */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('list.methodLabel')}</span>
          <Segmented
            ariaLabel={t('list.methodLabel')}
            value={filters.calculationMethod}
            onChange={(selected) => setFilters(prev => ({ ...prev, calculationMethod: selected }))}
            options={[
              { value: 'Cashflow', label: t('list.calculationShort.cashflow') },
              { value: 'Cash', label: t('list.calculationShort.cash') },
              { value: 'Calculation', label: t('list.calculationShort.calculation') },
            ]}
          />
        </div>

        {/* Итоги по контрагентам — наверху и крупно, а не мелкой строкой внизу экрана */}
        <div className="grid grid-cols-5 gap-3 pb-4">
          {kpis.map(({ key, ...kpi }) => (
            <KpiCard key={key} currency={GlobalCurrency.name} compact={isScrolled} {...kpi} />
          ))}
        </div>
        </Collapsible>
        </div>

        <TableCard className="min-w-fit overflow-visible">
          <TableToolbar
            className="rounded-t-xl"
            search={
              <div className="w-full max-w-[420px]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
            }
            actions={
              <>
                <Segmented
                  ariaLabel={t('list.viewModes.list')}
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: 'list', label: t('list.viewModes.list'), icon: List },
                    { value: 'nested', label: t('list.viewModes.grouped'), icon: FolderTree },
                  ]}
                />
                <FilterButton
                  onClick={() => setIsFilterOpen(true)}
                  count={counterpartiesStore.activeFilterCount}
                />
                <TableOnlyToggle tableOnly={tableOnly} onToggle={toggleTableOnly} />
              </>
            }
          />

          {/* Шапка колонок — прилипает под шапкой страницы */}
          <div
            className="sticky z-30 flex h-10 items-center border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"
            style={{ top: stickyHeight }}
          >
            <div className="flex min-w-[220px] flex-1 items-center px-4">
              {viewMode === 'nested' ? t('list.tableHeaders.group') : t('list.tableHeaders.counterparty')}
            </div>
            {viewMode !== 'nested' && <div className={cn(COL.group, 'px-3')}>{t('list.tableHeaders.group')}</div>}
            {!isCashflow && <div className={cn(COL.inn, 'px-3')}>{t('list.tableHeaders.inn')}</div>}
            <div className={cn(COL.ops, 'px-3 text-right')}>{t('list.tableHeaders.operations')}</div>
            <div className={cn(COL.amount, 'px-3 text-right')}>{t('list.tableHeaders.receivables')}, {GlobalCurrency.name}</div>
            <div className={cn(COL.amount, 'px-3 text-right')}>{t('list.tableHeaders.payables')}, {GlobalCurrency.name}</div>
            <div className={cn(COL.amount, 'px-3 text-right')}>
              {isCashflow ? t('list.tableHeaders.receipts') : t('list.tableHeaders.income')}
            </div>
            <div className={cn(COL.amount, 'px-3 text-right')}>
              {isCashflow ? t('list.tableHeaders.payments') : t('list.tableHeaders.expense')}
            </div>
            <div className={cn(COL.amount, 'px-3 text-right')}>
              {isCashflow ? t('list.tableHeaders.difference') : t('list.tableHeaders.profit')}
            </div>
            <div className={COL.menu} />
          </div>

          {allCounterparties.length === 0 && !isLoadingCounterparties && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Users size={22} aria-hidden="true" />
              </span>
              <span className="text-sm text-slate-500">{labels.empty}</span>
            </div>
          )}

          <InfiniteScroll
            dataLength={allCounterparties.length}
            next={fetchNextPage}
            hasMore={hasNextPage}
            scrollThreshold={0.5}
            scrollableTarget="scrollableDiv"
          >
            <div className="flex flex-col">
              {rows.map((item) => {
                if (item.isGroup) {
                  const isExpanded = expandedGroups.has(item.guid)
                  return (
                    <React.Fragment key={item.id}>
                      <div
                        className="flex min-h-[52px] cursor-pointer items-center border-b border-slate-200 bg-slate-50/70 text-sm hover:bg-slate-100/70"
                        onClick={() => toggleGroup(item.guid)}
                      >
                        <div className="flex min-w-[220px] flex-1 items-center gap-3 px-4">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 cursor-pointer hover:bg-slate-200 hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); toggleGroup(item.guid) }}
                          >
                            <ChevronRight size={16} className={cn('transition-transform', isExpanded && 'rotate-90')} />
                          </button>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                            {isExpanded ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
                          </span>
                          <span className="truncate font-semibold text-slate-900">{item?.nazvanie}</span>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 tabular-nums">
                            {item.items?.length || 0}
                          </span>
                        </div>
                        {!isCashflow && <div className={cn(COL.inn, 'px-3 text-slate-400')}>–</div>}
                        <div className={cn(COL.ops, 'px-3 text-right font-semibold tabular-nums text-slate-900')}>{item?.operationCount ?? 0}</div>
                        <AmountCell value={item.debitorka} strong />
                        <AmountCell value={item.kreditorka} strong />
                        <AmountCell value={item.income} strong allowNegative={!isCashflow} />
                        <AmountCell value={item.expenses} strong allowNegative={!isCashflow} />
                        <AmountCell value={isCashflow ? item.difference : item.profit} strong signed />
                        <div className={cn(COL.menu, 'flex items-center justify-center group')} onClick={(e) => e.stopPropagation()}>
                          <GroupMenu
                            group={item}
                            onEdit={(group) => setEditingGroup(group)}
                            onDelete={(group) => setDeletingGroup(group)}
                            onCreateCounterparty={(group) => {
                              setPreselectedGroupId(group.guid)
                              setIsCreateModalOpen(true)
                            }}
                          />
                        </div>
                      </div>

                      {isExpanded && item.items?.length === 0 && (
                        <div className="border-b border-slate-100 bg-white p-4 text-center text-xs font-medium text-slate-400">
                          {labels.emptyInGroup}
                        </div>
                      )}

                      {isExpanded && item.items?.map((counterparty) => (
                        <CounterpartyRow
                          key={counterparty.id}
                          item={counterparty}
                          nested
                          showGroup={false}
                          isCashflow={isCashflow}
                          onOpen={() => router.push(`${detailBasePath}/${counterparty?.guid}`)}
                          onEdit={(cp) => setEditingCounterparty(cp)}
                          onDelete={(cp) => setDeletingCounterparty(cp)}
                        />
                      ))}
                    </React.Fragment>
                  )
                }

                return (
                  <CounterpartyRow
                    key={item?.id}
                    item={item}
                    showGroup={viewMode !== 'nested'}
                    isCashflow={isCashflow}
                    onOpen={() => router.push(`${detailBasePath}/${item.guid}`)}
                    onEdit={(cp) => setEditingCounterparty(cp)}
                    onDelete={(cp) => setDeletingCounterparty(cp)}
                  />
                )
              })}
            </div>
          </InfiniteScroll>
        </TableCard>
      </div>

      {isLoadingCounterparties && allCounterparties.length === 0 && <ScreenLoader className='left-0!' />}
      {isFetching && !isScrolling && <ScreenLoader className='left-0!' />}

      {/* Unified Create/Edit Modal */}
      <CreateCounterpartyModal
        isOpen={isCreateModalOpen || !!editingCounterparty}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingCounterparty(null)
          setPreselectedGroupId(null)
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
          queryClient.invalidateQueries({ queryKey: ['get_counterpaties_total'] })
        }}
        preselectedGroupId={preselectedGroupId}
        counterpartyData={editingCounterparty}
        isStudent={isStudent}
      />
      {/* «Редактировать группу» в меню группы раньше ничего не открывало */}
      <EditCounterpartyGroupModal
        isOpen={!!editingGroup}
        group={editingGroup}
        onClose={() => {
          setEditingGroup(null)
          queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
        }}
      />
      <DeleteGroupConfirmModal
        isOpen={!!deletingGroup}
        group={deletingGroup}
        onConfirm={async () => {
          if (deletingGroup?.guid) {
            try {
              await deleteGroupMutation.mutateAsync([deletingGroup.guid])
              setDeletingGroup(null)
              // Reset search to show all groups after deletion
              setSearchQuery('')
              setDebouncedSearchQuery('')
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
            } catch (error) {
              console.error('Error deleting group:', error)
            }
          }
        }}
        onCancel={() => setDeletingGroup(null)}
        isDeleting={deleteGroupMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCounterpartyConfirmModal
        isOpen={!!deletingCounterparty}
        counterparty={deletingCounterparty}
        onConfirm={async () => {
          if (deletingCounterparty?.guid) {
            try {
              await deleteMutation.mutateAsync([deletingCounterparty.guid])
              setDeletingCounterparty(null)
              // Reset search to show all counterparties after deletion
              setSearchQuery('')
              setDebouncedSearchQuery('')
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
            } catch (error) {
              console.error('Error deleting counterparty:', error)
            }
          }
        }}
        onCancel={() => setDeletingCounterparty(null)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
})

export default CounterpartiesListPage
