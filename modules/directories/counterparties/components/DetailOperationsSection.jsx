import MultiSelectPurchaseZdelka from '@/components/ReadyComponents/MultiPurchaseZdelka'
import MultiSelectStatiya from '@/components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import OperationTableRow from '@/components/operations/TableRow/new'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const DetailOperationsSection = ({
  t, tc,
  operationsList, operations, isLoading,
  counterpartyInfo, filters, setFilters,
  onCreateOperation, onEditOperation, onDeleteOperation, onCopyOperation
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Все фильтры живут в состоянии страницы: они уходят в get_counterparty_by_id
  const setFilter = (key) => (values) => setFilters((prev) => ({ ...prev, [key]: values }))

  const activeCount =
    (filters.legalEntities?.length ? 1 : 0) +
    (filters.chartOfAccounts?.length ? 1 : 0) +
    (filters.deals?.length ? 1 : 0) +
    (filters.purchaseDeals?.length ? 1 : 0)

  const clearFilters = () =>
    setFilters((prev) => ({ ...prev, legalEntities: [], chartOfAccounts: [], deals: [], purchaseDeals: [] }))

  return (
    <div className="flex-1 bg-white">
      <div className="p-4">
        <div id='operation_filter_section' className="mb-3 sticky min-h-14 max-h-28 top-10 z-20 bg-white">
          <div className="flex py-3 items-center gap-3">
            <h2 className="text-xl font-medium">{t('operationsTitle')}</h2>
            <button className="primary-btn" onClick={onCreateOperation}>{t('createOperation')}</button>
            <button className="secondary-btn flex items-center gap-2 text-primary!" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
              {t('filters')}
              {activeCount > 0 && (
                <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-white'>
                  {activeCount}
                </span>
              )}
              <ChevronDown className='w-4 h-4' />
            </button>
          </div>

          {isFiltersOpen && (
            <div className='flex flex-wrap items-center gap-3 mb-3 pb-2'>
              <div className="w-48">
                <SelectLegelEntitties
                  multi
                  value={filters.legalEntities}
                  onChange={setFilter('legalEntities')}
                  placeholder={tc('placeholders.selectLegalEntity')}
                  className={'bg-white'}
                  dropdownClassName={'w-64'}
                />
              </div>
              <div className="w-48 flex items-center">
                <MultiSelectStatiya
                  value={filters.chartOfAccounts}
                  onChange={setFilter('chartOfAccounts')}
                  placeholder={tc('placeholders.selectStatii')}
                  className={'bg-white'}
                  dropdownClassName={'w-64'}
                />
              </div>
              <div className="w-48 flex items-center">
                <MultiSelectZdelka
                  value={filters.deals}
                  onChange={setFilter('deals')}
                  placeholder={tc('placeholders.selectDeals')}
                  className={'bg-white'}
                />
              </div>
              <div className="w-48 flex items-center">
                <MultiSelectPurchaseZdelka
                  value={filters.purchaseDeals}
                  onChange={setFilter('purchaseDeals')}
                  placeholder={tc('placeholders.selectPurchaseDeals')}
                  className={'bg-white'}
                />
              </div>
              {activeCount > 0 && (
                <button className='text-sm text-primary hover:underline cursor-pointer' onClick={clearFilters}>
                  {tc('clear')}
                </button>
              )}
            </div>
          )}

          {/* Table header */}
          <div className='flex z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
            <div className='min-w-36 pl-5 flex p-3 items-center justify-start'>{t('table.date')}</div>
            <div className='min-w-18 max-w-52 flex-1 flex p-3 items-center justify-start'>{t('table.account')}</div>
            <div className='min-w-14 flex p-3 items-center justify-center'>{t('table.type')}</div>
            <div className='min-w-20 flex-1 flex p-3 items-center justify-start'>{t('table.counterparty')}</div>
            <div className='min-w-20 flex-1 text-start p-3 items-center justify-start'>{t('table.article')}</div>
            <div className='min-w-20 flex-1 flex p-3 items-center justify-center'>{t('table.deal')}</div>
            <div className='min-w-36 flex p-3 items-center justify-end'>{t('table.amount')}</div>
            <div className='min-w-5 flex p-3 items-center justify-center'>&nbsp;</div>
          </div>
        </div>

        {!isLoading && operations.length === 0 ? (
          <div className="text-center">
            <div className="text-2xl font-medium">{t('empty.title')}</div>
            <div className="text-lg text-gray-500">{t('empty.description')}</div>
          </div>
        ) : (
          <div className="pb-56">
            <div className="pb-4">
              {['future', 'today', 'before'].map(section => (
                operationsList?.[section]?.length > 0 && (
                  <div key={section}>
                    <div className="border-y border-y-gray-100 bg-white py-2 text-sm px-4">
                      <h3 className="font-medium">{t(`sections.${section}`)}</h3>
                    </div>
                    {operationsList[section].map((op) => (
                      <OperationTableRow
                        key={op.guid}
                        op={op}
                        openOperationModal={onEditOperation}
                        counterpartyGuid={counterpartyInfo?.guid}
                        handleEditOperation={onEditOperation}
                        handleDeleteOperation={onDeleteOperation}
                        handleCopyOperation={onCopyOperation}
                      />
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailOperationsSection
