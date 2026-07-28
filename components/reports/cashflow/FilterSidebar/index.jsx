'use client'

import SalesTransactions from '@/components/ReadyComponents/SalesTransactions'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import SelectProjects from '@/components/ReadyComponents/SelectProjects'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { FilterSection } from '../../../directories/FilterSidebar/FilterSidebar'
import { cashFlowStore } from '../cashflow.store'

const CashFlowFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')
  const { periodStartDate, periodEndDate, sellingDealId, contrAgentId, accountId, projectId, defaultDate, dateRangeType } = cashFlowStore

  const handleDateRangeChange = (range) => {
    cashFlowStore.setPeriodDateRange(range)
  }

  const datesEqual = (a, b) =>
    a && b ? new Date(a).toDateString() === new Date(b).toDateString() : a === b

  const clearCount =
    (!datesEqual(periodStartDate, defaultDate.start) ||
      !datesEqual(periodEndDate, defaultDate.end) ? 1 : 0) +
    accountId.length +
    contrAgentId.length +
    (projectId?.length || 0) +
    sellingDealId.length

  const handleClear = () => {
    cashFlowStore.resetFilters()
  }

  return (
    <FilterSidebar
      isOpen={isOpen}
      onClose={onClose}
      clearCount={clearCount}
      onClear={handleClear}
    >

      {/* Date range */}
      <FilterSection title={t('common.period')}>
        <NewDateRangeComponent
          value={{
            start: periodStartDate,
            end: periodEndDate
          }}
          onChange={handleDateRangeChange}
          clearable={false}
          present={dateRangeType}
          onSetPresent={(present) => cashFlowStore.setDateRangeType(present)}
          onClear={() => cashFlowStore.setDateRangeType('')}
          defaultValue={defaultDate}

        />
      </FilterSection>

      {/* Accounts */}
      <div className='space-y-2'>
        <SelectMyAccounts
          value={accountId}
          onChange={(val) => cashFlowStore.setAccounts(val)}
          className="bg-gray-ucode-25"
        />

        {/* Counterparties */}
        <SelectCounterParties
          value={contrAgentId}
          onChange={(val) => cashFlowStore.setCounterparties(val)}
          className="bg-gray-ucode-25"
        />

        {/* Проекты — только если включён модуль проектов */}
        {appStore.projectActive && (
          <SelectProjects
            multi
            value={projectId}
            onChange={(val) => cashFlowStore.setSelectedProjects(val)}
            placeholder={t('common.projects')}
            className="bg-gray-ucode-25"
          />
        )}

        {/* Sales transtions */}
        <SalesTransactions
          value={sellingDealId}
          onChange={(val) => cashFlowStore.setDeals(val)}
          placeholder={t('common.allDeals')}
          dropdownClassName="w-56"
        />
      </div>
    </FilterSidebar>
  )
})

export default CashFlowFilterSidebar
