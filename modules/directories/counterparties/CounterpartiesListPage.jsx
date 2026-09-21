"use client"
import { FilterField } from '@/components/shared/Filters/FilterDrawer'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import IconButton from '@/components/shared/Buttons/IconButton'
import FilterButton from '@/components/shared/Filters/FilterButton'
import { CounterpartyMenu } from '@/components/directories/CounterpartyMenu/CounterpartyMenu'
import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import { DeleteCounterpartyConfirmModal } from '@/components/directories/DeleteCounterpartyConfirmModal/DeleteCounterpartyConfirmModal'
import { DeleteGroupConfirmModal } from '@/components/directories/DeleteGroupConfirmModal/DeleteGroupConfirmModal'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import { GroupMenu } from '@/components/directories/GroupMenu/GroupMenu'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { SearchBar } from '@/components/directories/SearchBar/SearchBar'
import MultiSelectStatiya from '@/components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
// OperationCheckbox — Дебиторка/Кредиторка фильтрлари вақтинча яширилгани учун ишлатилмаяпти
// import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import ScreenLoader from '@/components/shared/ScreenLoader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useDeleteCounterparties, useDeleteCounterpartiesGroups, useUcodeRequestInfinite } from '@/hooks/useDashboard'
import { useScrollDetector } from '@/hooks/useScrollDetector'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { formatAmount, formatNumber, handleDownload } from '@/utils/helpers'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Download, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { BsList } from 'react-icons/bs'
import { LuListTree } from 'react-icons/lu'
import InfiniteScroll from 'react-infinite-scroll-component'

const getCalculationOptions = (t) => [
  { value: "Cashflow", label: t('list.calculationOptions.cashflow') },
  { value: "Cash", label: t('list.calculationOptions.cash') },
  { value: "Calculation", label: t('list.calculationOptions.calculation') },
]

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


  return (
    <div className="w-[calc(100%_-_var(--sidebar-w))] flex h-[calc(100%-60px)]  fixed left-[var(--sidebar-w)] top-[60px]">
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

        {/* Дебиторка / Кредиторка фильтры временно скрыты
        <FilterSection title={t('list.filters.receivables')}>
          <div className="space-y-2.5 flex flex-col items-start">
            {[{ label: t('list.filters.cash'), value: 'Cash' }, { label: t('list.filters.nonCash'), value: 'NonCash' }, { label: t('list.filters.without'), value: 'WithoutCash' }].map(item => (
              <OperationCheckbox
                key={`deb-${item.value}`}
                checked={filters.debitPaymentTypes?.includes(item.value)}
                onChange={() => {
                  setFilters(prev => ({
                    ...prev,
                    debitPaymentTypes: prev.debitPaymentTypes?.includes(item.value)
                      ? prev.debitPaymentTypes?.filter(v => v !== item.value)
                      : [...prev.debitPaymentTypes, item.value]
                  }))
                }}
                label={item.label}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t('list.filters.payables')}>
          <div className="space-y-2.5 flex flex-col items-start">
            {[{ label: t('list.filters.cash'), value: 'Cash' }, { label: t('list.filters.nonCash'), value: 'NonCash' }, { label: t('list.filters.without'), value: 'WithoutCash' }].map(item => (
              <OperationCheckbox
                key={`kred-${item.value}`}
                checked={(filters.creditPaymentTypes || [])?.includes(item.value)}
                onChange={() => {
                  setFilters(prev => {
                    const currentArray = prev.creditPaymentTypes || []
                    return {
                      ...prev,
                      creditPaymentTypes: currentArray?.includes(item.value)
                        ? currentArray?.filter(v => v !== item.value)
                        : [...currentArray, item.value]
                    }
                  })
                }}
                label={item.label}
              />
            ))}
          </div>
        </FilterSection>
        */}

      </FilterSidebar>


      <div id="scrollableDiv" ref={scrollRef} onScroll={handleScroll} className={`px-6 pb-40 w-full h-full overflow-auto flex-1 bg-canvas`}>
        <div className="sticky top-0 z-40 bg-canvas flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold shrink-0">{labels.title}</h1>
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

        <TableCard className="mb-2">
          {/* Поиск, метод расчёта, вид списка и фильтры — над таблицей */}
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
            }
            actions={
              <>
                <div className='w-[250px]'>
                  <SingleSelect
                    data={getCalculationOptions(t)}
                    value={filters.calculationMethod}
                    onChange={(selected) => setFilters(prev => ({
                      ...prev,
                      calculationMethod: selected
                    }))}
                    className={'bg-white'}
                    placeholder={tc('placeholders.select')}
                    withSearch={false}
                    isClearable={false}
                  />
                </div>
                <div className="flex items-center">
                  <button
                    className={cn("border-l border-t border-b border-neutral-200 cursor-pointer rounded-l-md py-2 px-2", viewMode === 'list' && 'border-primary border-r')}
                    onClick={() => setViewMode('list')}
                    title={t('list.viewModes.list')}
                  >
                    <BsList size={18} strokeWidth={.5} />
                  </button>
                  <button
                    className={cn(" border-neutral-200 border-r border-t border-b cursor-pointer rounded-r-md py-2 px-2", viewMode === 'nested' && 'border-primary border-l')}
                    onClick={() => setViewMode('nested')}
                    title={t('list.viewModes.nested')}
                  >
                    <LuListTree size={18} />
                  </button>
                </div>
                <FilterButton
                  onClick={() => setIsFilterOpen(true)}
                  count={counterpartiesStore.activeFilterCount}
                />
              </>
            }
          />

        {/* Column Headers */}
        <div className='flex h-12 sticky top-0 z-30 text-sm gap-1 font-medium text-neutral-500 items-center bg-neutral-50 border-b border-neutral-200'>
          <>
            <div className='flex-1 min-w-[200px] flex px-3 items-center justify-start cursor-pointer hover:text-neutral-700'>
              {viewMode === 'nested' ? t('list.tableHeaders.group') : t('list.tableHeaders.counterparty')}
              <ChevronDown className='size-4' />
            </div>
            {viewMode !== 'nested' && (
              <div className='w-40 flex px-2 items-center justify-start'>{t('list.tableHeaders.group')}</div>
            )}
            {filters.calculationMethod !== 'Cashflow' && (
              <div className='w-32 flex px-2 items-center justify-start'>{t('list.tableHeaders.inn')}</div>
            )}
            <div className='w-24 flex px-2 items-center justify-center'>{t('list.tableHeaders.operations')}</div>
            <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>{t('list.tableHeaders.receivables')}, {GlobalCurrency.name}</div>
            <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>{t('list.tableHeaders.payables')}, {GlobalCurrency.name}</div>
            <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
              {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.receipts') : t('list.tableHeaders.income')}
            </div>
            <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
              {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.payments') : t('list.tableHeaders.expense')}
            </div>
            <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
              {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.difference') : t('list.tableHeaders.profit')}
            </div>
            <div className='w-10 flex px-2 items-center justify-center'>&nbsp;</div>
          </>
        </div>

        {allCounterparties.length === 0 && !isLoadingCounterparties && (
          <div className="py-20 text-center text-neutral-500 bg-white">
            {labels.empty}
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
            {(viewMode === 'groups' ? counterpartiesGroups : viewMode === 'nested' ? groupedCounterparties : flatCounterparties).map((item) => {
              if (item.isGroup) {
                const isExpanded = expandedGroups.has(item.guid)
                const styleDifference = item?.difference > 0 ? 'text-emerald-500 font-medium' : item?.difference < 0 ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'
                const styleProfit = item?.profit > 0 ? 'text-emerald-500 font-medium' : item?.profit < 0 ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'

                return (
                  <React.Fragment key={item.id}>
                    <div
                      className="flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm"
                      onClick={() => toggleGroup(item.guid)}
                    >
                      <div className="flex-1 min-w-[200px] flex px-3 items-center gap-2 font-medium">
                        <button
                          className="text-neutral-400 hover:text-neutral-600 outline-none flex items-center justify-center p-1"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(item.guid) }}
                        >
                          {isExpanded ? <ExpendClose /> : <ExpendOpen />}
                        </button>
                        <span className="text-slate-900 truncate">{item?.nazvanie} ({item.items?.length || 0})</span>
                      </div>
                      {filters.calculationMethod !== 'Cashflow' && (
                        <div className="w-32 flex px-2 items-center text-neutral-500">–</div>
                      )}
                      <div className="w-24 flex px-2 items-center justify-center text-neutral-900 font-medium">
                        {item?.operationCount ?? 0}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {item.debitorka > 0 ? formatAmount(item?.debitorka) : '0'}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {item.kreditorka > 0 ? formatAmount(item?.kreditorka) : '0'}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {filters.calculationMethod === 'Cashflow'
                          ? (item?.income > 0 ? formatAmount(item?.income) : '0')
                          : (formatAmount(item?.income) || '0')}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {filters.calculationMethod === 'Cashflow'
                          ? (item?.expenses > 0 ? formatAmount(item?.expenses) : '0')
                          : (formatAmount(item?.expenses) || '0')}
                      </div>
                      <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                        {filters.calculationMethod === 'Cashflow'
                          ? (item?.difference === 0 ? '0' : formatAmount(item.difference))
                          : (item?.profit === 0 ? '0' : formatAmount(item.profit))}
                      </div>
                      <div className="w-10 flex px-2 items-center justify-center group" onClick={(e) => e.stopPropagation()}>
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
                      <div className="bg-neutral-50/50 p-4 text-center text-neutral-400 text-xs font-medium border-b border-neutral-100">
                        {labels.emptyInGroup}
                      </div>
                    )}

                    {isExpanded && item.items?.map((counterparty) => {
                      const styleDifference = counterparty?.difference > 0 ? 'text-emerald-500' : counterparty?.difference < 0 ? 'text-red-500' : 'text-neutral-500'
                      const styleProfit = counterparty?.profit > 0 ? 'text-emerald-500' : counterparty?.profit < 0 ? 'text-red-500' : 'text-neutral-500'

                      return (
                        <div
                          key={counterparty.id}
                          className="flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm"
                          onClick={() => router.push(`${detailBasePath}/${counterparty?.guid}`)}
                        >
                          <div className="flex-1 min-w-[200px] flex flex-col px-3 pl-8 justify-center">
                            <span className="text-slate-900 font-medium truncate">{counterparty?.nazvanie}</span>
                            {counterparty?.komentariy && <span className="text-neutral-400 text-mini truncate">{counterparty?.komentariy}</span>}
                          </div>
                          {filters.calculationMethod !== 'Cashflow' && (
                            <div className="w-32 flex px-2 items-center text-neutral-500 truncate">{counterparty.inn || '–'}</div>
                          )}
                          <div className="w-24 flex px-2 items-center justify-center text-neutral-500">{counterparty?.operationCount ?? 0}</div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty?.debitorka > 0 ? formatAmount(counterparty?.debitorka) : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty?.kreditorka > 0 ? formatAmount(counterparty?.kreditorka) : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty?.income > 0 ? formatAmount(counterparty?.income) : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty?.expenses > 0 ? formatAmount(counterparty?.expenses) : '0'}
                          </div>
                          <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                            {filters.calculationMethod === 'Cashflow'
                              ? (counterparty?.difference === 0 ? '0' : formatAmount(counterparty?.difference))
                              : (counterparty?.profit === 0 ? '0' : formatAmount(counterparty?.profit))}
                          </div>
                          <div className="w-10 flex px-2 items-center justify-center group" onClick={(e) => e.stopPropagation()}>
                            <CounterpartyMenu
                              counterparty={counterparty}
                              onEdit={(cp) => setEditingCounterparty(cp)}
                              onDelete={(cp) => setDeletingCounterparty(cp)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </React.Fragment>
                )
              } else {
                const styleDifference = item?.difference > 0 ? 'text-emerald-500' : item?.difference < 0 ? 'text-red-500' : 'text-neutral-500'
                const styleProfit = item?.profit > 0 ? 'text-emerald-500' : item?.profit < 0 ? 'text-red-500' : 'text-neutral-500'

                return (
                  <div
                    key={item?.id}
                    className="flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm"
                    onClick={() => router.push(`${detailBasePath}/${item.guid}`)}
                  >
                    <div className="flex-1 min-w-[200px] flex flex-col px-2 justify-center">
                      <span className="text-slate-900 font-medium truncate">{item.nazvanie}</span>
                      {item.komentariy && <span className="text-neutral-400 text-mini truncate">{item.komentariy}</span>}
                    </div>
                    {viewMode !== 'nested' && (
                      <div className="w-40 flex px-2 items-center text-neutral-500 truncate">{item.gruppa || '–'}</div>
                    )}
                    {filters.calculationMethod !== 'Cashflow' && (
                      <div className="w-32 flex px-2 items-center text-neutral-500 truncate">{item.inn || '–'}</div>
                    )}
                    <div className="w-24 flex px-2 items-center justify-center text-neutral-500">{item?.operationCount ?? 0}</div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.debitorka > 0 ? formatAmount(item?.debitorka) : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.kreditorka > 0 ? formatAmount(item?.kreditorka) : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.income > 0 ? formatAmount(item?.income) : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.expenses > 0 ? formatAmount(item?.expenses) : '0'}
                    </div>
                    <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                      {filters.calculationMethod === 'Cashflow'
                        ? (item?.difference === 0 ? '0' : formatAmount(item?.difference))
                        : (item?.profit === 0 ? '0' : formatAmount(item?.profit))}
                    </div>
                    <div className="w-10 flex px-2 items-center justify-center group" onClick={(e) => e.stopPropagation()}>
                      <CounterpartyMenu
                        counterparty={item}
                        onEdit={(cp) => setEditingCounterparty(cp)}
                        onDelete={(cp) => setDeletingCounterparty(cp)}
                      />
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </InfiniteScroll>
        </TableCard>

        {/* Footer */}
        <div className={cn(
          'fixed bottom-0 right-0 left-[var(--sidebar-w)] bg-neutral-100 p-2 border-t border-neutral-200 flex items-center gap-8 shrink-0 z-10'
        )}>
          <div className="text-sm text-slate-900">
            <span className="font-semibold text-slate-900 whitespace-nowrap">
              {labels.count(couterpartiesSummary?.count || 0)}
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.receivables')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatNumber(couterpartiesSummary?.debitorka)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.payables')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatNumber(couterpartiesSummary?.kreditorka)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.receipts')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatNumber(couterpartiesSummary?.income)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.payments')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatNumber(couterpartiesSummary?.expense)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.difference')}</span>
            <div className="flex items-center gap-0.5">
              <span className={cn(
                'text-xs font-semibold',
                couterpartiesSummary?.difference > 0 ? 'text-emerald-500' : couterpartiesSummary?.difference < 0 ? 'text-red-500' : 'text-slate-900'
              )}>
                {couterpartiesSummary?.difference === 0 ? '0' : `${couterpartiesSummary?.difference > 0 ? '+' : ''}${formatNumber(couterpartiesSummary?.difference)}`}
              </span>
              <span className={cn(
                'text-xs',
                couterpartiesSummary?.difference > 0 ? 'text-emerald-500' : couterpartiesSummary?.difference < 0 ? 'text-red-500' : 'text-gray-400'
              )}>{GlobalCurrency.name}</span>
            </div>
          </div>
        </div>
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
