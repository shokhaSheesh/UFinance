'use client'

import { FilterField, FilterSection as FilterGroup } from '@/components/shared/Filters/FilterDrawer'
import { useCashFlowFilterCount } from '@/hooks/useReportFilterCount'
import SalesTransactions from '@/components/ReadyComponents/SalesTransactions'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import SelectProjects from '@/components/ReadyComponents/SelectProjects'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { cashFlowStore } from '../cashflow.store'

const CashFlowFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')
  const tf = useTranslations('filters')
  const { periodStartDate, periodEndDate, sellingDealId, contrAgentId, accountId, projectId, defaultDate, dateRangeType } = cashFlowStore

  const handleDateRangeChange = (range) => {
    cashFlowStore.setPeriodDateRange(range)
  }


  const clearCount = useCashFlowFilterCount()

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
      <FilterGroup title={t('common.period')}>
        <FilterField full>
          <NewDateRangeComponent
            value={{ start: periodStartDate, end: periodEndDate }}
            onChange={handleDateRangeChange}
            clearable={false}
            present={dateRangeType}
            onSetPresent={(present) => cashFlowStore.setDateRangeType(present)}
            onClear={() => cashFlowStore.setDateRangeType('')}
            defaultValue={defaultDate}
          />
        </FilterField>
      </FilterGroup>
      <FilterGroup title={tf('parameters')}>
        <FilterField label={tf('legalEntities')}>
          <SelectMyAccounts value={accountId} onChange={(val) => cashFlowStore.setAccounts(val)} placeholder={tf('all')} />
        </FilterField>
        <FilterField label={tf('counterparties')}>
          <SelectCounterParties value={contrAgentId} onChange={(val) => cashFlowStore.setCounterparties(val)} placeholder={tf('all')} />
        </FilterField>
        {appStore.projectActive && (
          <FilterField label={t('common.projects')}>
            <SelectProjects multi value={projectId} onChange={(val) => cashFlowStore.setSelectedProjects(val)} placeholder={tf('all')} />
          </FilterField>
        )}
        <FilterField label={t('common.deals')}>
          <SalesTransactions value={sellingDealId} onChange={(val) => cashFlowStore.setDeals(val)} placeholder={t('common.allDeals')} dropdownClassName="w-56" />
        </FilterField>
      </FilterGroup>
    </FilterSidebar>
  )
})

export default CashFlowFilterSidebar
