"use client"

import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import MultiSelectStatiya from '@/components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { appStore } from '@/store/app.store'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import { DeleteCounterpartyConfirmModal } from '@/components/directories/DeleteCounterpartyConfirmModal/DeleteCounterpartyConfirmModal'
import { DeleteGroupConfirmModal } from '@/components/directories/DeleteGroupConfirmModal/DeleteGroupConfirmModal'
import { useScrollDetector } from '@/hooks/useScrollDetector'

import CounterpartiesFooter from '../components/CounterpartiesFooter'
import CounterpartiesHeader from '../components/CounterpartiesHeader'
import CounterpartiesTableHeader from '../components/CounterpartiesTableHeader'
import CounterpartyRow from '../components/CounterpartyRow'
import GroupRow from '../components/GroupRow'
import { useCounterpartiesData } from '../hooks/useCounterpartiesData'
import { useCounterpartiesFilters } from '../hooks/useCounterpartiesFilters'
import { useCounterpartiesModals } from '../hooks/useCounterpartiesModals'

const CounterpartiesListPage = observer(() => {
  const t = useTranslations('Directories.counterparty')
  const tc = useTranslations('Common')
  const router = useRouter()
  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  const {
    requestFilterData, searchQuery, setSearchQuery,
    debouncedSearchQuery, setDebouncedSearchQuery,
    viewMode, setViewMode, filters, setFilters
  } = useCounterpartiesFilters()

  const {
    allCounterparties, groupedCounterparties, flatCounterparties,
    counterpartiesGroups, summary, fetchNextPage, hasNextPage,
    isLoading, isFetching, exportCounterparties, isExporting
  } = useCounterpartiesData(requestFilterData, viewMode)

  const modals = useCounterpartiesModals({ setSearchQuery, setDebouncedSearchQuery })

  const directoryPermissions = appStore.permission.directories
  const canAdd = directoryPermissions.counterparties.add

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(groupId) ? next.delete(groupId) : next.add(groupId)
      return next
    })
  }

  const displayItems = viewMode === 'groups' ? counterpartiesGroups : viewMode === 'nested' ? groupedCounterparties : flatCounterparties

  return (
    <FixedContent>
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(prev => !prev)}
        clearCount={counterpartiesStore.activeFilterCount}
        onClear={counterpartiesStore.resetFilters}
      >
        <FilterSection title={t('list.filters.parameters')}>
          <div className="space-y-2.5">
            <SelectCounterParties value={filters.selectedCounterparties} onChange={(values) => setFilters(prev => ({ ...prev, selectedCounterparties: values }))} dropdownClassName="w-56" />
            <MultiSelectStatiya value={filters.selectedChartOfAccounts} onChange={(values) => setFilters(prev => ({ ...prev, selectedChartOfAccounts: values }))} placeholder={t('list.filters.selectChartOfAccounts')} dropdownClassName="w-64" />
            <MultiSelectZdelka value={filters.deals} onChange={(values) => setFilters(prev => ({ ...prev, deals: values }))} dropdownClassName="w-64" />
            <SelectLegelEntitties value={filters.selectedLegalEntities} onChange={(values) => setFilters(prev => ({ ...prev, selectedLegalEntities: values }))} placeholder={t('list.filters.selectLegalEntities')} multi={true} />
          </div>
        </FilterSection>

        <FilterSection title={t('list.filters.period')}>
          <NewDateRangeComponent
            value={filters.dateRange}
            onChange={(range) => {
              const startDate = range?.start ? formatDate(new Date(range.start)) : ''
              const endDate = range?.end ? formatDate(new Date(range.end)) : ''
              setFilters(prev => ({ ...prev, dateRange: range, operationDateStart: startDate, operationDateEnd: endDate }))
            }}
            onClear={() => counterpartiesStore.setState('dateRangType', '')}
            present={counterpartiesStore.dateRangType}
            onSetPresent={(present) => counterpartiesStore.setState('dateRangType', present)}
          />
        </FilterSection>

        <FilterSection title={t('list.filters.receivables')}>
          <div className="space-y-2.5 flex flex-col items-start">
            {[{ label: t('list.filters.cash'), value: 'Cash' }, { label: t('list.filters.nonCash'), value: 'NonCash' }, { label: t('list.filters.without'), value: 'WithoutCash' }].map(item => (
              <OperationCheckbox
                key={`deb-${item.value}`}
                checked={filters.debitPaymentTypes?.includes(item.value)}
                onChange={() => setFilters(prev => ({ ...prev, debitPaymentTypes: prev.debitPaymentTypes?.includes(item.value) ? prev.debitPaymentTypes?.filter(v => v !== item.value) : [...prev.debitPaymentTypes, item.value] }))}
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
                onChange={() => setFilters(prev => { const arr = prev.creditPaymentTypes || []; return { ...prev, creditPaymentTypes: arr.includes(item.value) ? arr.filter(v => v !== item.value) : [...arr, item.value] } })}
                label={item.label}
              />
            ))}
          </div>
        </FilterSection>
      </FilterSidebar>

      <div id="scrollableDiv" ref={scrollRef} onScroll={handleScroll} className="px-3 pb-40 w-full h-full overflow-auto flex-1 bg-white">
        <CounterpartiesHeader
          t={t} tc={tc} canAdd={canAdd} onCreateClick={() => modals.openCreate()}
          filters={filters} setFilters={setFilters}
          viewMode={viewMode} setViewMode={setViewMode}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          exportCounterparties={exportCounterparties} isExporting={isExporting}
          onOpenFilters={() => setIsFilterOpen(true)}
          filterCount={counterpartiesStore.activeFilterCount}
        />

        <CounterpartiesTableHeader
          t={viewMode === 'nested' ? t : t} tc={tc}
          viewMode={viewMode} filters={filters}
        />

        {allCounterparties.length === 0 && !isLoading && (
          <div className="py-20 text-center text-neutral-500 bg-white">{t('list.empty')}</div>
        )}

        <InfiniteScroll dataLength={allCounterparties.length} next={fetchNextPage} hasMore={hasNextPage} scrollThreshold={0.5} scrollableTarget="scrollableDiv">
          <div className="flex flex-col">
            {displayItems.map((item) =>
              item.isGroup ? (
                <GroupRow
                  key={item.id}
                  group={item}
                  isExpanded={expandedGroups.has(item.guid)}
                  filters={filters}
                  onToggleGroup={toggleGroup}
                  onNavigate={(guid) => router.push(`/directories/counterparties/${guid}`)}
                  onGroupEdit={modals.setEditingGroup}
                  onGroupDelete={modals.setDeletingGroup}
                  onGroupCreateCounterparty={(group) => modals.openCreate(group.guid)}
                  onCounterpartyEdit={modals.setEditingCounterparty}
                  onCounterpartyDelete={modals.setDeletingCounterparty}
                />
              ) : (
                <CounterpartyRow
                  key={item.id}
                  item={item}
                  onNavigate={(guid) => router.push(`/directories/counterparties/${guid}`)}
                  filters={filters}
                  onEdit={modals.setEditingCounterparty}
                  onDelete={modals.setDeletingCounterparty}
                />
              )
            )}
          </div>
        </InfiniteScroll>

        <CounterpartiesFooter t={t} summary={summary} isFilterOpen={isFilterOpen} />
      </div>

      {isLoading && allCounterparties.length === 0 && <ScreenLoader className='left-0!' />}
      {isFetching && !isScrolling && <ScreenLoader className='left-0!' />}

      <CreateCounterpartyModal
        isOpen={modals.isCreateOpen || !!modals.editingCounterparty}
        onClose={modals.closeCreate}
        preselectedGroupId={modals.preselectedGroupId}
        counterpartyData={modals.editingCounterparty}
      />
      <DeleteGroupConfirmModal
        isOpen={!!modals.deletingGroup}
        group={modals.deletingGroup}
        onConfirm={modals.handleGroupDeleteConfirm}
        onCancel={() => modals.setDeletingGroup(null)}
        isDeleting={modals.isGroupDeleting}
      />
      <DeleteCounterpartyConfirmModal
        isOpen={!!modals.deletingCounterparty}
        counterparty={modals.deletingCounterparty}
        errorMessage={modals.deleteError}
        onConfirm={modals.handleDeleteConfirm}
        onCancel={() => modals.setDeletingCounterparty(null)}
        isDeleting={modals.isDeleting}
      />
    </FixedContent>
  )
})

export default CounterpartiesListPage
