"use client"
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
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import ScreenLoader from '@/components/shared/ScreenLoader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useDeleteCounterparties, useDeleteCounterpartiesGroups, useUcodeRequestInfinite } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Loader2 } from 'lucide-react'
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

const CounterpartiesPage = observer(() => {
  const t = useTranslations('Directories.counterparty')
  const tc = useTranslations('Common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [viewMode, setViewMode] = useState('list') // 'list' | 'nested' | 'groups'
  const [editingCounterparty, setEditingCounterparty] = useState(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [preselectedGroupId, setPreselectedGroupId] = useState(null)

  const directoryPermissions = appStore.permission.directories
  const canAdd = directoryPermissions.counterparties.add

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
      limit: 35,
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
    }
  }, [filters, debouncedSearchQuery, viewMode])

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

  const totalCountData = useMemo(() => {
    return infiniteData?.pages?.[0]?.data?.pagination?.total || allCounterparties.length
  }, [infiniteData, allCounterparties])



  const SummaryTotal = useMemo(() => {
    return infiniteData?.pages?.[0]?.data?.summary || {}
  }, [infiniteData])

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
  }, [queryClient])

  const [expandedGroups, setExpandedGroups] = useState(new Set())


  const toggleRowSelection = (id) => {
    setSelectedRows(prev => {
      if (prev?.includes(id)) {
        return prev.filter(rowId => rowId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const isRowSelected = (id) => {
    return selectedRows?.includes(id)
  }

  const allSelected = () => {
    return flatCounterparties.length > 0 && selectedRows.length === flatCounterparties.length
  }

  const toggleSelectAll = () => {
    if (allSelected()) {
      setSelectedRows([])
    } else {
      setSelectedRows(flatCounterparties.map(item => item.id))
    }
  }

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
      primenyatь_statьi_po_umolchaniyu: item.primenyatь_statьi_po_umolchaniyu || false,
      difference: item?.difference,
      kreditorka: item.kreditorka || 0,
      profit: item.profit || 0,
      income: item?.income,
      expenses: item?.expense,
      rawData: item
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
    <div className="w-[calc(100%-80px)] flex h-[calc(100%-60px)]  fixed left-[80px] top-[60px]">
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(prev => !prev)}
        clearCount={counterpartiesStore.activeFilterCount}
        onClear={counterpartiesStore.resetFilters}
      >
        <FilterSection title={t('list.filters.parameters')}>
          <div className="space-y-2.5">
            <SelectCounterParties
              value={filters.selectedCounterparties}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedCounterparties: values }))}
              dropdownClassName="w-56"
            />
            <MultiSelectStatiya
              value={filters.selectedChartOfAccounts}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedChartOfAccounts: values }))}
              placeholder={t('list.filters.selectChartOfAccounts')}
              dropdownClassName="w-64"
            />
            <MultiSelectZdelka
              value={filters.deals}
              onChange={(values) => setFilters(prev => ({ ...prev, deals: values }))}
              dropdownClassName="w-64"
            />
            <SelectLegelEntitties
              value={filters.selectedLegalEntities}
              onChange={(values) => setFilters(prev => ({ ...prev, selectedLegalEntities: values }))}
              placeholder={t('list.filters.selectLegalEntities')}
              multi={true}
            />
          </div>
        </FilterSection>

        <FilterSection title={t('list.filters.period')}>
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
        </FilterSection>

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

      </FilterSidebar>


      <div id="scrollableDiv" className={` px-3 pb-40 w-full h-full overflow-auto flex-1 bg-white `}>
        <div className="sticky top-0 z-40 bg-white flex items-center justify-between h-16">
          <div className='flex items-center gap-4 '>
            <h1 className="text-xl font-semibold">{t('list.title')}</h1>
            {canAdd && <button
              onClick={() => setIsCreateModalOpen(true)}
              className="primary-btn"
            >
              {t('list.createButton')}
            </button>}
          </div>
          <div className=" flex items-center justify-self-center gap-2">
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
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <button onClick={exportCounterparties} type='button' className="primary-btn">{t('list.downloadExcel')} {isCounterpartiesExportLoading && <Loader2 size={16} className="animate-spin" />}</button>
          </div>
        </div>

        {/* Column Headers */}
        <div className='flex h-12 sticky top-16 z-30 text-sm gap-1 font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
          <div className='w-12 flex items-center justify-center'>
            <OperationCheckbox checked={allSelected()} onChange={toggleSelectAll} />
          </div>
          {selectedRows.length > 0 && <>
            <div className='flex-1 px-3 items-center justify-center'>
              {tc('selected', { count: selectedRows.length })}
            </div>
          </>}
          {selectedRows.length === 0 && <>
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
          </>}
        </div>

        {allCounterparties.length === 0 && !isLoadingCounterparties && (
          <div className="py-20 text-center text-neutral-500 bg-white">
            {t('list.empty')}
          </div>
        )}

        <InfiniteScroll
          dataLength={allCounterparties.length}
          next={fetchNextPage}
          hasMore={hasNextPage}
          scrollableTarget="scrollableDiv"
        >
          <div className="flex flex-col">
            {(viewMode === 'groups' ? counterpartiesGroups : viewMode === 'nested' ? groupedCounterparties : flatCounterparties).map((item) => {
              if (item.isGroup) {
                const isExpanded = expandedGroups.has(item.guid)
                const styleDifference = item.difference > 0 ? 'text-emerald-500 font-medium' : item.difference < 0 ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'
                const styleProfit = item.profit > 0 ? 'text-emerald-500 font-medium' : item.profit < 0 ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'

                return (
                  <React.Fragment key={item.id}>
                    <div
                      className="flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm"
                      onClick={() => toggleGroup(item.guid)}
                    >
                      <div className="w-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <OperationCheckbox checked={isRowSelected(item.id)} onChange={() => toggleRowSelection(item.id)} />
                      </div>
                      <div className="flex-1 min-w-[200px] flex px-3 items-center gap-2 font-medium">
                        <button
                          className="text-neutral-400 hover:text-neutral-600 outline-none flex items-center justify-center p-1"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(item.guid) }}
                        >
                          {isExpanded ? <ExpendClose /> : <ExpendOpen />}
                        </button>
                        <span className="text-slate-900 truncate">{item.nazvanie} ({item.items?.length || 0})</span>
                      </div>
                      {filters.calculationMethod !== 'Cashflow' && (
                        <div className="w-32 flex px-2 items-center text-neutral-500">–</div>
                      )}
                      <div className="w-24 flex px-2 items-center justify-center text-neutral-900 font-medium">
                        {item.operationsCount > 0 ? item.operationsCount.toLocaleString('ru-RU') : '0'}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {item.debitorka > 0 ? item.debitorka.toLocaleString('ru-RU') : '0'}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {item.kreditorka > 0 ? item.kreditorka.toLocaleString('ru-RU') : '0'}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {filters.calculationMethod === 'Cashflow'
                          ? (item?.income > 0 ? item?.income.toLocaleString('ru-RU') : '0')
                          : (item?.income?.toLocaleString('ru-RU') || '0')}
                      </div>
                      <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
                        {filters.calculationMethod === 'Cashflow'
                          ? (item.expenses > 0 ? item.expenses.toLocaleString('ru-RU') : '0')
                          : (item?.expenses?.toLocaleString('ru-RU') || '0')}
                      </div>
                      <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                        {filters.calculationMethod === 'Cashflow'
                          ? (item.difference === 0 ? '0' : item.difference.toLocaleString('ru-RU'))
                          : (item.profit === 0 ? '0' : item.profit.toLocaleString('ru-RU'))}
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
                        Нет контрагентов
                      </div>
                    )}

                    {isExpanded && item.items?.map((counterparty) => {
                      const styleDifference = counterparty.difference > 0 ? 'text-emerald-500' : counterparty.difference < 0 ? 'text-red-500' : 'text-neutral-500'
                      const styleProfit = counterparty.profit > 0 ? 'text-emerald-500' : counterparty.profit < 0 ? 'text-red-500' : 'text-neutral-500'

                      return (
                        <div
                          key={counterparty.id}
                          className={cn(
                            "flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm",
                            isRowSelected(counterparty.id) && "bg-blue-50/50"
                          )}
                          onClick={() => router.push(`/directories/counterparties/${counterparty.guid}`)}
                        >
                          <div className="w-10 flex items-center justify-center pl-4" onClick={(e) => e.stopPropagation()}>
                            <OperationCheckbox checked={isRowSelected(counterparty.id)} onChange={() => toggleRowSelection(counterparty.id)} />
                          </div>
                          <div className="flex-1 min-w-[200px] flex flex-col px-3 pl-8 justify-center">
                            <span className="text-slate-900 font-medium truncate">{counterparty.nazvanie}</span>
                            {counterparty.komentariy && <span className="text-neutral-400 text-mini truncate">{counterparty.komentariy}</span>}
                          </div>
                          {filters.calculationMethod !== 'Cashflow' && (
                            <div className="w-32 flex px-2 items-center text-neutral-500 truncate">{counterparty.inn || '–'}</div>
                          )}
                          <div className="w-24 flex px-2 items-center justify-center text-neutral-500">0</div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty.debitorka > 0 ? counterparty.debitorka.toLocaleString('ru-RU') : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty.kreditorka > 0 ? counterparty.kreditorka.toLocaleString('ru-RU') : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty.income > 0 ? counterparty.income.toLocaleString('ru-RU') : '0'}
                          </div>
                          <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                            {counterparty.expenses > 0 ? counterparty.expenses.toLocaleString('ru-RU') : '0'}
                          </div>
                          <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                            {filters.calculationMethod === 'Cashflow'
                              ? (counterparty.difference === 0 ? '0' : counterparty.difference.toLocaleString('ru-RU'))
                              : (counterparty.profit === 0 ? '0' : counterparty.profit.toLocaleString('ru-RU'))}
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
                const styleDifference = item.difference > 0 ? 'text-emerald-500' : item.difference < 0 ? 'text-red-500' : 'text-neutral-500'
                const styleProfit = item.profit > 0 ? 'text-emerald-500' : item.profit < 0 ? 'text-red-500' : 'text-neutral-500'

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm",
                      isRowSelected(item.id) && "bg-blue-50/50"
                    )}
                    onClick={() => router.push(`/directories/counterparties/${item.guid}`)}
                  >
                    <div className="w-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <OperationCheckbox checked={isRowSelected(item.id)} onChange={() => toggleRowSelection(item.id)} />
                    </div>
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
                    <div className="w-24 flex px-2 items-center justify-center text-neutral-500">0</div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.debitorka > 0 ? item.debitorka.toLocaleString('ru-RU') : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.kreditorka > 0 ? item.kreditorka.toLocaleString('ru-RU') : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.income > 0 ? item.income.toLocaleString('ru-RU') : '0'}
                    </div>
                    <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
                      {item.expenses > 0 ? item.expenses.toLocaleString('ru-RU') : '0'}
                    </div>
                    <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
                      {filters.calculationMethod === 'Cashflow'
                        ? (item.difference === 0 ? '0' : item.difference.toLocaleString('ru-RU'))
                        : (item.profit === 0 ? '0' : item.profit.toLocaleString('ru-RU'))}
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

        {/* Footer */}
        <div className={cn(
          'fixed bottom-0 right-0 bg-neutral-100 p-2 border-t border-neutral-200   flex items-center gap-8 shrink-0 z-10  transition-[left] duration-300',
          isFilterOpen ? 'left-[320px]' : 'left-[110px]'
        )}>
          <div className="text-sm text-slate-900">
            <span className="font-semibold text-slate-900 whitespace-nowrap">
              {totalCountData === 1 ? t('list.counterpartyCount', { count: totalCountData }) : totalCountData < 5 ? t('list.counterpartyCountPlural', { count: totalCountData }) : t('list.counterpartyCountPluralMany', { count: totalCountData })}
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.receivables')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatAmount(SummaryTotal?.receivables)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.payables')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatAmount(SummaryTotal?.payables)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.receipts')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatAmount(SummaryTotal?.income)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.payments')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-900">{formatAmount(SummaryTotal?.expense)}</span>
              <span className="text-xs text-gray-400">{GlobalCurrency.name}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 font-medium">{t('list.summary.difference')}</span>
            <div className="flex items-center gap-0.5">
              <span className={cn(
                'text-xs font-semibold',
                SummaryTotal?.difference > 0 ? 'text-emerald-500' : SummaryTotal?.difference < 0 ? 'text-red-500' : 'text-slate-900'
              )}>
                {SummaryTotal?.difference === 0 ? '0' : `${SummaryTotal?.difference > 0 ? '+' : ''}${formatAmount(SummaryTotal?.difference)}`}
              </span>
              <span className={cn(
                'text-xs',
                SummaryTotal?.difference > 0 ? 'text-emerald-500' : SummaryTotal?.difference < 0 ? 'text-red-500' : 'text-gray-400'
              )}>{GlobalCurrency.name}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoadingCounterparties && allCounterparties.length === 0 && <ScreenLoader className={'left-[250px]'} />}
      {(isFetchingNextPage || isFetching) && <ScreenLoader className={'left-[250px]'} />}

      {/* Unified Create/Edit Modal */}
      <CreateCounterpartyModal
        isOpen={isCreateModalOpen || !!editingCounterparty}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingCounterparty(null)
          setPreselectedGroupId(null)
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
        }}
        preselectedGroupId={preselectedGroupId}
        counterpartyData={editingCounterparty}
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

export default CounterpartiesPage
