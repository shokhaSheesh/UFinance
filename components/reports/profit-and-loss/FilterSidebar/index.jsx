'use client'

import { FilterField, FilterSection as FilterGroup } from '@/components/shared/Filters/FilterDrawer'
import ToggleChip from '@/components/shared/Filters/ToggleChip'
import { usePnLFilterCount } from '@/hooks/useReportFilterCount'
import { FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import SelectCounterParties from '../../../ReadyComponents/SelectCounterParties'
import SelectMyAccoutGroup from '../../../ReadyComponents/SelectMyAccoutGroup'
import SelectProjects from '../../../ReadyComponents/SelectProjects'
import { appStore } from '../../../../store/app.store'
import { pnlStore } from '../pnl.store'

const PnLFilterSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations('Reports')

  const tf = useTranslations('filters')
  const handleDateRangeChange = (range) => {
    pnlStore.setDateRange(range)
  }

  const { dateRangeType } = pnlStore

  // Разбивка на колонки — рядом с периодом, а не в шапке страницы
  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('pnl.grouping.daily') },
    { value: 'weekly', label: t('pnl.grouping.weekly') },
    { value: 'monthly', label: t('pnl.grouping.monthly') },
  ], [t])


  const clearCount = usePnLFilterCount()

  const handleClear = () => {
    pnlStore.resetFilters()
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
            value={pnlStore.dateRange}
            onChange={handleDateRangeChange}
            clearable={false}
            present={dateRangeType}
            onSetPresent={(present) => pnlStore.setDateRangeType(present)}
            onClear={() => pnlStore.setDateRangeType('')}
            defaultValue={pnlStore.defaultDate}
          />
        </FilterField>
        <FilterField full label={t('common.grouping')}>
          <SingleSelect
            data={groupingOptions}
            value={pnlStore.selectedGrouping}
            onChange={(value) => pnlStore.setSelectedGrouping(value)}
            placeholder={t('common.buildingMethod')}
            isClearable={false}
            withSearch={false}
            className="bg-white"
          />
        </FilterField>
      </FilterGroup>
      <FilterGroup title={tf('parameters')}>
        <FilterField label={tf('legalEntities')}>
          <SelectMyAccoutGroup
            value={pnlStore.selectedAccounts}
            onChange={(val) => pnlStore.setSelectedAccounts(val)}
            returnParentId={true}
            onReturnParentId={(parentIds) => pnlStore.setSelectedLegalEntities(parentIds)}
          />
        </FilterField>
        <FilterField label={tf('counterparties')}>
          <SelectCounterParties value={pnlStore.selectedCounterparties} onChange={(val) => pnlStore.setSelectedCounterparties(val)} placeholder={tf('all')} />
        </FilterField>
        {appStore.projectActive && (
          <FilterField label={t('common.projects')}>
            <SelectProjects multi value={pnlStore.selectedProjects} onChange={(val) => pnlStore.setSelectedProjects(val)} placeholder={tf('all')} />
          </FilterField>
        )}
        <FilterField label={t('common.deals')}>
          <MultiSelectZdelka value={pnlStore.deals} onChange={(val) => pnlStore.setDeals(val)} placeholder={tf('all')} />
        </FilterField>
      </FilterGroup>
      <FilterGroup title={t('pnl.profitTypes')}>
        <FilterField full>
          <div className="flex flex-wrap gap-2">
            <ToggleChip checked={pnlStore.operational} onChange={(v) => pnlStore.setOperational(v)}>{t('pnl.operational')}</ToggleChip>
            <ToggleChip checked={pnlStore.ebitda} onChange={(v) => pnlStore.setEbitDa(v)}>EBITDA</ToggleChip>
            <ToggleChip checked={pnlStore.ebit} onChange={(v) => pnlStore.setEbit(v)}>EBIT</ToggleChip>
            <ToggleChip checked={pnlStore.ebt} onChange={(v) => pnlStore.setEbt(v)}>EBT</ToggleChip>
          </div>
        </FilterField>
      </FilterGroup>
    </FilterSidebar>
  )
})

export default PnLFilterSidebar
