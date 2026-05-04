'use client'

import { observer } from 'mobx-react-lite'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { useTranslations } from 'next-intl'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import { FilterSection } from '../../../directories/FilterSidebar/FilterSidebar'
import SelectMyAccounts from '../../../ReadyComponents/SelectMyAccounts'
import SelectCounterParties from '../../../ReadyComponents/SelectCounterParties'
import { pnlStore } from '../pnl.store'

const PnLFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')

  const handleDateRangeChange = (range) => {
    pnlStore.setDateRange(range)
    console.log(range)
    // queryClient.invalidateQueries({ queryKey: ['profit_and_loss'] })
  }

  return (
    <FilterSidebar
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 pt-4">
        {/* Date range */}
        <FilterSection title={t('common.period')}>
          <NewDateRangeComponent
            value={pnlStore.dateRange}
            onChange={handleDateRangeChange}
            clearable={false}
            defaultValue={pnlStore.defaultDate}
          />
        </FilterSection>

        {/* Accounts */}
        <div>
          <SelectMyAccounts
            value={pnlStore.selectedAccounts}
            onChange={(val) => pnlStore.setSelectedAccounts(val)}
            placeholder={t('common.legalEntitiesAndAccounts')}
            valueKey="value"
          />
        </div>

        {/* Counterparties */}
        <div>
          <SelectCounterParties
            value={pnlStore.selectedCounterparties}
            onChange={(val) => pnlStore.setSelectedCounterparties(val)}
            placeholder={t('common.allCounterparties')}
            valueKey="value"
          />
        </div>

        {/* Profit types */}
        <FilterSection title={t('pnl.profitTypes')}>
          <div className="space-y-2 flex flex-col gap-2 justify-start items-start">
            <OperationCheckbox
              checked={pnlStore.operational}
              onChange={(value) => pnlStore.setOperational(value.target.checked)}
              label={t('pnl.operational')}
            />
            <OperationCheckbox
              checked={pnlStore.ebitda}
              onChange={(value) => pnlStore.setEbitDa(value.target.checked)}
              label={"EBITDA"}
            />
            <OperationCheckbox
              checked={pnlStore.ebit}
              onChange={(value) => pnlStore.setEbit(value.target.checked)}
              label={"EBIT"}
            />
            <OperationCheckbox
              checked={pnlStore.ebt}
              onChange={(value) => pnlStore.setEbt(value.target.checked)}
              label={"EBT"}
            />
          </div>
        </FilterSection>
      </div>
    </FilterSidebar>
  )
})

export default PnLFilterSidebar
