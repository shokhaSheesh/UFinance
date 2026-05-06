'use client'

import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { observer } from 'mobx-react-lite'
import { FilterSection } from '../../../directories/FilterSidebar/FilterSidebar'
import SelectCounterParties from '../../../ReadyComponents/SelectCounterParties'
import SelectMyAccoutGroup from '../../../ReadyComponents/SelectMyAccoutGroup'
import { pnlStore } from '../pnl.store'

const PnLFilterSidebar = observer(({ isOpen, onClose }) => {


  const handleDateRangeChange = (range) => {
    pnlStore.setDateRange(range)
  }

  return (
    <FilterSidebar
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 pt-4">
        {/* Date range */}
        <FilterSection title="Период">
          <NewDateRangeComponent
            value={pnlStore.dateRange}
            onChange={handleDateRangeChange}
            clearable={false}
            defaultValue={pnlStore.defaultDate}
          />
        </FilterSection>

        {/* Accounts */}
        <div>
          <SelectMyAccoutGroup
            value={pnlStore.selectedAccounts}
            onChange={(val) => pnlStore.setSelectedAccounts(val)}
            placeholder="Счета"
            returnParentId={true}
            onReturnParentId={(parentIds) => pnlStore.setSelectedLegalEntities(parentIds)}
          />
        </div>

        {/* Counterparties */}
        <div>
          <SelectCounterParties
            value={pnlStore.selectedCounterparties}
            onChange={(val) => pnlStore.setSelectedCounterparties(val)}
            placeholder="Все контрагенты"
          />
        </div>

        {/* Profit types */}
        <FilterSection title="Виды прибыли">
          <div className="space-y-2 flex flex-col gap-2 justify-start items-start">
            <OperationCheckbox
              checked={pnlStore.operational}
              onChange={(value) => pnlStore.setOperational(value.target.checked)}
              label={"Операционная"}
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
