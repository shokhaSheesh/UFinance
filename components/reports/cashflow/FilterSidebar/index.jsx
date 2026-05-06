'use client'

import SalesTransactions from '@/components/ReadyComponents/SalesTransactions'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { FilterSection } from '../../../directories/FilterSidebar/FilterSidebar'
import { cashFlowStore } from '../cashflow.store'

const CashFlowFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')
  const { periodStartDate, periodEndDate, sellingDealId, contrAgentId, accountId, defaultDate } = cashFlowStore

  const handleDateRangeChange = (range) => {
    cashFlowStore.setPeriodDateRange(range)
  }

  return (
    <FilterSidebar
      isOpen={isOpen}
      onClose={onClose}
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
