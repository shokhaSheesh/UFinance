'use client'

import { useBalanceFilterCount } from '@/hooks/useReportFilterCount'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import '@/styles/report-filters.css'
import { FilterField, FilterSection as FilterGroup } from '@/components/shared/Filters/FilterDrawer'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { queryClient } from '../../../../lib/queryClient'
import { balanceStore } from '../balance.store'

const BalanceFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')
  const tf = useTranslations('filters')
  const { dateRange, selectedCounterparties, selectedAccount, defaultDate, dateRangeType, periodType } = balanceStore

  // Разбивка на колонки — здесь же, рядом с периодом: в шапке страницы
  // выпадающих списков было столько, что заголовок терялся между ними
  const periodOptions = useMemo(() => [
    { value: 'daily', label: t('balance.grouping.daily') },
    { value: 'monthly', label: t('balance.grouping.monthly') },
    { value: 'quarterly', label: t('balance.grouping.quarterly') },
    { value: 'yearly', label: t('balance.grouping.yearly') },
    { value: 'total', label: t('balance.grouping.total') },
  ], [t])

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
        <FilterField full label={t('common.grouping')}>
          <SingleSelect
            data={periodOptions}
            value={periodType}
            onChange={(value) => balanceStore.setPeriodType(value)}
            placeholder={t('balance.display')}
            isClearable={false}
            withSearch={false}
            className="bg-white"
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