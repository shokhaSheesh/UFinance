import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ChevronDown } from 'lucide-react'

const CounterpartiesTableHeader = ({
  t, viewMode, filters,
  allSelected, toggleSelectAll,
  selectedRows
}) => (
  <div className='flex h-12 sticky top-16 z-30 text-sm gap-1 font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
    <div className='w-12 flex items-center justify-center'>
      <OperationCheckbox checked={allSelected} onChange={toggleSelectAll} />
    </div>
    {selectedRows.length > 0 && (
      <div className='flex-1 px-3 items-center justify-center'>
        {t('selected', { count: selectedRows.length })}
      </div>
    )}
    {selectedRows.length === 0 && <>
      <div className='flex-1 min-w-[200px] flex px-3 items-center justify-start cursor-pointer hover:text-neutral-700'>
        {viewMode === 'nested' ? t('list.tableHeaders.group') : t('list.tableHeaders.counterparty')}
        <ChevronDown className='size-4' />
      </div>
      {viewMode !== 'nested' && (
        <div className='w-40 flex px-2 items-center justify-start'>{t('list.tableHeaders.group')}</div>
      )}
      {filters.calculationMethod !== 'Cashflow' && (
        <div className='w-32 flex px-2 items-center justify-start'>{t('list.tableHeaders.inn')}</div>
      )}
      <div className='w-24 flex px-2 items-center justify-center'>{t('list.tableHeaders.operations')}</div>
      <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>{t('list.tableHeaders.receivables')}, {GlobalCurrency?.name}</div>
      <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>{t('list.tableHeaders.payables')}, {GlobalCurrency?.name}</div>
      <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
        {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.receipts') : t('list.tableHeaders.income')}
      </div>
      <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
        {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.payments') : t('list.tableHeaders.expense')}
      </div>
      <div className='w-32 flex px-2 items-center justify-end whitespace-nowrap'>
        {filters.calculationMethod === 'Cashflow' ? t('list.tableHeaders.difference') : t('list.tableHeaders.profit')}
      </div>
      <div className='w-10 flex px-2 items-center justify-center'>&nbsp;</div>
    </>}
  </div>
)

export default CounterpartiesTableHeader
