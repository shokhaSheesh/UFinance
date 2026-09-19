'use client'

import { useBalanceFilterCount } from '@/hooks/useReportFilterCount'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import '@/styles/report-filters.css'
import { observer } from 'mobx-react-lite'
import { queryClient } from '../../../../lib/queryClient'
import { balanceStore } from '../balance.store'

const BalanceFilterSidebar = observer(({ isOpen, onClose }) => {
  const { dateRange, selectedCounterparties, selectedAccount, defaultDate, dateRangeType } = balanceStore

  const handleDateRangeChange = (range) => {
    balanceStore.setDateRange(range)
    queryClient.invalidateQueries({ queryKey: ['balance_report'] })
  }

  const datesEqual = (a, b) =>
    a && b ? new Date(a).toDateString() === new Date(b).toDateString() : a === b

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
      <div className="flex flex-col gap-4 pt-4">
        {/* Date */}
        <div>
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
        </div>

        {/* Accounts */}
        <div>
          <SelectMyAccounts
            value={selectedAccount}
            onChange={(val) => balanceStore.setSelectedAccount(val)}
            className="bg-gray-ucode-25"
          />
        </div>

        {/* Counterparties */}
        <div>
          <SelectCounterParties
            value={selectedCounterparties}
            onChange={(val) => balanceStore.setSelectedCounterparties(val)}
            className="bg-gray-ucode-25"
          />
        </div>
      </div>
    </FilterSidebar>
  )
})

export default BalanceFilterSidebar