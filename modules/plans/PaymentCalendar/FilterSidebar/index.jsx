'use client'

import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccoutGroup from '@/components/ReadyComponents/SelectMyAccoutGroup'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { paymentCalendarStore } from '../store'

const PaymentCalendarFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')

  const handleDateRangeChange = (range) => {
    paymentCalendarStore.setDateRange(range)
  }

  return (
    <FilterSidebar isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4 pt-4">
        <FilterSection title={t('common.period')}>
          <NewDateRangeComponent
            value={paymentCalendarStore.dateRange}
            onChange={handleDateRangeChange}
            clearable={false}
            defaultValue={paymentCalendarStore.defaultDate}
          />
        </FilterSection>

        <div>
          <SelectMyAccoutGroup
            value={paymentCalendarStore.selectedAccounts}
            onChange={(val) => paymentCalendarStore.setSelectedAccounts(val)}
            placeholder="Счета"
            returnParentId={true}
            onReturnParentId={(parentIds) => paymentCalendarStore.setSelectedLegalEntities(parentIds)}
          />
        </div>

        <div>
          <SelectCounterParties
            value={paymentCalendarStore.selectedCounterparties}
            onChange={(val) => paymentCalendarStore.setSelectedCounterparties(val)}
            placeholder="Все контрагенты"
          />
        </div>

        <div>
          <MultiSelectZdelka
            value={paymentCalendarStore.deals}
            onChange={(val) => paymentCalendarStore.setDeals(val)}
            placeholder={t('common.deals')}
          />
        </div>

      </div>
    </FilterSidebar>
  )
})

export default PaymentCalendarFilterSidebar
