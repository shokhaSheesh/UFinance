import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useMyCurrencies } from '@/hooks/useMyCurrencies'
import { Loader2 } from 'lucide-react'

const CashFlowHeader = ({ t, groupingOptions, onExport, isExporting }) => {
  // валюты филиала — только те, что есть на счетах
  const { options: currencyOptions } = useMyCurrencies()

  return (
  <div className="flex h-16 items-center sticky z-50 top-0 bg-white justify-between shrink-0">
    <div className="flex items-center gap-4">
      <h1 className='text-xl whitespace-nowrap font-semibold'>{t('cashflow.title')}</h1>
      <SingleSelect
        data={currencyOptions}
        value={cashFlowStore.currencyCode}
        onChange={(value) => cashFlowStore.setCurrencyCode(value)}
        isClearable={false}
        withSearch={false}
        className={'bg-white w-28'}
        dropdownClassName={'w-28'}
      />
    </div>
    <div className="flex items-center gap-3">
      <SingleSelect
        data={groupingOptions}
        value={cashFlowStore.periodType}
        onChange={(value) => cashFlowStore.setPeriodType(value)}
        placeholder={t('common.buildingMethod')}
        withSearch={false}
        isClearable={false}
        className="bg-white w-44"
        dropdownClassName="bg-white"
      />
      <button onClick={onExport} type='button' className="primary-btn">
        {t('common.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    </div>
  </div>
  )
}

export default CashFlowHeader
