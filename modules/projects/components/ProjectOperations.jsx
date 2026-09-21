'use client'

import CreateOperationMenu from '@/components/operations/CreateOperationMenu/CreateOperationMenu'
import MultiSelectPurchaseZdelka from '@/components/ReadyComponents/MultiPurchaseZdelka'
import MultiSelectZdelka from '@/components/ReadyComponents/MultiZdelka'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import OperationTableRow from '@/components/operations/TableRow/new'
import { useSentinel } from '@/hooks/useSentinel'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

/**
 * Блок «Операции по проекту» — как на странице контрагента, но с рабочими фильтрами
 * (юрлица/счета, контрагенты, сделки продаж и закупок) и подгрузкой по мере
 * прокрутки. Статьи не выбираются: запрос всегда ограничен разделами
 * «Доходы» и «Расходы» (см. useProjectOperations).
 */
export default function ProjectOperations({
  td,
  to,
  tc,
  operations,
  operationsList,
  isLoading,
  filters,
  setFilters,
  onCreateOperation,
  onEditOperation,
  onDeleteOperation,
  onCopyOperation,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const sentinelRef = useSentinel({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage,
  })

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="flex-1 bg-white px-6 pb-24">
      <div className="mb-3 bg-white">
        <div className="flex py-3 items-center gap-3">
          <h2 className="text-xl font-medium">{td('operationsTitle')}</h2>
          {/* Выбор типа операции — как на странице «Операции» */}
          <CreateOperationMenu onCreate={onCreateOperation} label={td('createOperation')} />
          <button
            className="secondary-btn flex items-center gap-2 text-primary!"
            onClick={() => setIsFiltersOpen((v) => !v)}
          >
            {td('filters')}
            <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isFiltersOpen && (
          <div className="flex items-center flex-wrap gap-3 mb-3 pb-2">
            <div className="w-52">
              <SelectMyAccounts
                value={filters.my_accounts_ids}
                onChange={(v) => setFilter('my_accounts_ids', v)}
                placeholder={tc('placeholders.selectLegalEntity')}
                className="bg-white"
                dropdownClassName="w-64"
                multi
              />
            </div>
            <div className="w-52">
              <SelectCounterParties
                value={filters.counterparties_ids}
                onChange={(v) => setFilter('counterparties_ids', v)}
                placeholder={tc('placeholders.selectCounterparties')}
                className="bg-white"
              />
            </div>
            <div className="w-52">
              <MultiSelectZdelka
                value={filters.deals}
                onChange={(v) => setFilter('deals', v)}
                placeholder={tc('placeholders.selectDeals')}
                className="bg-white w-full"
              />
            </div>
            <div className="w-52">
              <MultiSelectPurchaseZdelka
                value={filters.purchaseDeals}
                onChange={(v) => setFilter('purchaseDeals', v)}
                placeholder={tc('placeholders.selectPurchaseDeals')}
                className="bg-white w-full"
              />
            </div>
          </div>
        )}

        {/* Заголовки колонок */}
        <div className="flex z-10 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200">
          <div className="min-w-36 pl-5 flex p-3 items-center justify-start">{to('date')}</div>
          <div className="min-w-18 max-w-52 flex-1 flex p-3 items-center justify-start">{to('account')}</div>
          <div className="min-w-14 flex p-3 items-center justify-center">{to('type')}</div>
          <div className="min-w-20 flex-1 flex p-3 items-center justify-start">{to('counterparty')}</div>
          <div className="min-w-20 flex-1 text-start p-3 items-center justify-start">{to('article')}</div>
          <div className="min-w-20 flex-1 flex p-3 items-center justify-center">{to('deal')}</div>
          <div className="min-w-36 flex p-3 items-center justify-end">{to('amount')}</div>
          <div className="min-w-5 flex p-3 items-center justify-center">&nbsp;</div>
        </div>
      </div>

      {!isLoading && operations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-2xl font-medium">{td('emptyOps.title')}</div>
          <div className="text-lg text-gray-500">{td('emptyOps.description')}</div>
        </div>
      ) : (
        <div>
          {['future', 'today', 'before'].map(
            (section) =>
              operationsList?.[section]?.length > 0 && (
                <div key={section}>
                  <div className="border-y border-y-gray-100 bg-white py-2 text-sm px-4">
                    <h3 className="font-medium">{td(`sections.${section}`)}</h3>
                  </div>
                  {operationsList[section].map((op) => (
                    <OperationTableRow
                      key={op.guid}
                      op={op}
                      openOperationModal={onEditOperation}
                      handleEditOperation={onEditOperation}
                      handleDeleteOperation={onDeleteOperation}
                      handleCopyOperation={onCopyOperation}
                    />
                  ))}
                </div>
              )
          )}
          {/* Сентинел для подгрузки */}
          <div ref={sentinelRef} className="h-8" />
        </div>
      )}
    </div>
  )
}
