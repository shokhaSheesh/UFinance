import FilterButton from '@/components/shared/Filters/FilterButton'
import { pnlStore } from '@/components/reports/profit-and-loss/pnl.store'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useMyCurrencies } from '@/hooks/useMyCurrencies'
import { Loader2 } from 'lucide-react'

const PnLHeader = ({
  t, accountingMethodOptions, groupingOptions,
  safeSelectedCurrency, safeSelectedGrouping, safeIsCalculation,
  onExport, isExporting, onOpenFilters, filterCount = 0
}) => {
  // валюты филиала — только те, что есть на счетах
  const { options: currencyOptions } = useMyCurrencies()

  return (
  <div className="flex h-16 items-center sticky z-50 top-0 bg-white justify-between shrink-0">
    <div className="flex items-center gap-4">
      <h1 className='text-xl whitespace-nowrap font-semibold'>{t('pnl.title')}</h1>
      <SingleSelect
        data={currencyOptions}
        value={safeSelectedCurrency}
        onChange={(value) => pnlStore.setSelectedCurrency(value)}
        isClearable={false}
        withSearch={false}
        className={'bg-white w-28'}
        dropdownClassName={'w-28'}
      />
      <FilterButton onClick={onOpenFilters} count={filterCount} />
    </div>
    <div className="flex items-center gap-3">
      <SingleSelect
        data={groupingOptions}
        value={safeSelectedGrouping}
        onChange={(value) => pnlStore.setSelectedGrouping(value)}
        isClearable={false}
        withSearch={false}
        placeholder={t('common.buildingMethod')}
        className="bg-white w-44"
      />
      <SingleSelect
        data={accountingMethodOptions}
        value={safeIsCalculation}
        onChange={(value) => pnlStore.setIsCalculation(value)}
        isClearable={false}
        withSearch={false}
        placeholder={t('common.accountingMethod')}
        className="bg-white w-44"
        autoHeight={true}
      />
      <button onClick={onExport} type='button' className="primary-btn">
        {t('common.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    </div>
  </div>
  )
}

export default PnLHeader
