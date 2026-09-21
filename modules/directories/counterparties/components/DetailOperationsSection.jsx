import MultiSelectPurchaseZdelka from '@/components/ReadyComponents/MultiPurchaseZdelka'
import MultiSelectStatiya from '@/components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import OperationTableRow from '@/components/operations/TableRow/new'
import { cn } from '@/lib/utils'
import CreateOperationMenu from '@/components/operations/CreateOperationMenu/CreateOperationMenu'
import { ChevronDown, ReceiptText, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

const DetailOperationsSection = ({
  t, tc,
  operationsList, operations, isLoading,
  counterpartyInfo, filters, setFilters,
  onCreateOperation, onEditOperation, onDeleteOperation, onCopyOperation,
  footer
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
    <div className="px-6 pb-6">
      {/* Операции — в карточке с рамкой: заголовок и действия, фильтры, таблица, итоги */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div id='operation_filter_section' className="sticky top-0 z-20 rounded-t-xl bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-slate-900">{t('operationsTitle')}</h2>
              {operations?.length > 0 && <span className="text-sm tabular-nums text-slate-500">{operations.length}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn('secondary-btn h-9 gap-2', (isFiltersOpen || activeCount > 0) && 'border-[#0e73f6] text-[#0e73f6]')}
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                aria-expanded={isFiltersOpen}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                {t('filters')}
                {activeCount > 0 && (
                  <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0e73f6] px-1.5 text-xs text-white'>
                    {activeCount}
                  </span>
                )}
                <ChevronDown className={cn('h-4 w-4 transition-transform', isFiltersOpen && 'rotate-180')} />
              </button>
              {/* Выбор типа операции — как на странице «Операции» */}
              <CreateOperationMenu onCreate={onCreateOperation} label={t('createOperation')} />
            </div>
          </div>

          {isFiltersOpen && (
            <div className='flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-3'>
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
          <div className='flex z-30 text-xs font-medium uppercase tracking-wide text-slate-500 items-center bg-slate-50 border-b border-slate-200'>
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
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ReceiptText size={22} aria-hidden="true" />
            </span>
            <div className="text-base font-medium text-slate-900">{t('empty.title')}</div>
            <div className="text-sm text-slate-500">{t('empty.description')}</div>
          </div>
        ) : (
          <div>
            <div>
              {['future', 'today', 'before'].map(section => (
                operationsList?.[section]?.length > 0 && (
                  <div key={section}>
                    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(`sections.${section}`)}</h3>
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
        {footer}
      </div>
    </div>
  )
}

export default DetailOperationsSection
