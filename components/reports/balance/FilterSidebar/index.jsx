'use client'

import { useBalanceFilterCount } from '@/hooks/useReportFilterCount'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import '@/styles/report-filters.css'
import { FilterField, FilterSection as FilterGroup } from '@/components/shared/Filters/FilterDrawer'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { queryClient } from '../../../../lib/queryClient'
import { balanceStore } from '../balance.store'

const BalanceFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')
  const tf = useTranslations('filters')
  const { dateRange, selectedCounterparties, selectedAccount, defaultDate, dateRangeType } = balanceStore

  const handleDateRangeChange = (range) => {
    balanceStore.setDateRange(range)
    queryClient.invalidateQueries({ queryKey: ['balance_report'] })
  }


  const clearCount = useBalanceFilterCount()

  const handleClear = () => {
    balanceStore.resetFilters()
    queryClient.invalidateQueries({ queryKey: ['balance_report'] })
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
            value={dateRange}
            onChange={handleDateRangeChange}
            singleDate={false}
            clearable={false}
            present={dateRangeType}
            onSetPresent={(present) => balanceStore.setDateRangeType(present)}
            onClear={() => balanceStore.setDateRangeType('')}
            defaultValue={defaultDate}
          />
        </FilterField>
      </FilterGroup>
      <FilterGroup title={tf('parameters')}>
        <FilterField label={tf('legalEntities')}>
          <SelectMyAccounts value={selectedAccount} onChange={(val) => balanceStore.setSelectedAccount(val)} placeholder={tf('all')} />
        </FilterField>
        <FilterField label={tf('counterparties')}>
          <SelectCounterParties value={selectedCounterparties} onChange={(val) => balanceStore.setSelectedCounterparties(val)} placeholder={tf('all')} />
        </FilterField>
      </FilterGroup>
    </FilterSidebar>
  )
})

export default BalanceFilterSidebar