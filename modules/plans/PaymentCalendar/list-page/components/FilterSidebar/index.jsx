'use client'

import { FilterField } from '@/components/shared/Filters/FilterDrawer'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccoutGroup from '@/components/ReadyComponents/SelectMyAccoutGroup'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { paymentCalendarStore } from '@/modules/plans/PaymentCalendar/store'

const PaymentCalendarFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')

  const tf = useTranslations('filters')
  const handleDateRangeChange = (range) => {
    paymentCalendarStore.setDateRange(range)
  }

  return (
    <FilterSidebar isOpen={isOpen} onClose={onClose}>
      <FilterSection title={t('common.period')}>
        <FilterField full>
          <NewDateRangeComponent
            value={paymentCalendarStore.dateRange}
            onChange={handleDateRangeChange}
            clearable={false}
            defaultValue={paymentCalendarStore.defaultDate}
          />
        </FilterField>
      </FilterSection>
      <FilterSection title={tf('parameters')}>
        <FilterField label={tf('legalEntities')}>
          <SelectMyAccoutGroup
            value={paymentCalendarStore.selectedAccounts}
            onChange={(val) => paymentCalendarStore.setSelectedAccounts(val)}
            returnParentId={true}
            onReturnParentId={(parentIds) => paymentCalendarStore.setSelectedLegalEntities(parentIds)}
          />
        </FilterField>
        <FilterField label={tf('counterparties')}>
          <SelectCounterParties
            value={paymentCalendarStore.selectedCounterparties}
            onChange={(val) => paymentCalendarStore.setSelectedCounterparties(val)}
            placeholder={tf('all')}
          />
        </FilterField>
        <FilterField label={t('common.deals')}>
          <MultiSelectZdelka
            value={paymentCalendarStore.deals}
            onChange={(val) => paymentCalendarStore.setDeals(val)}
            placeholder={tf('all')}
          />
        </FilterField>
      </FilterSection>
    </FilterSidebar>
  )
})

export default PaymentCalendarFilterSidebar
