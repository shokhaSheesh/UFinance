'use client'

import { balanceStore } from '@/components/reports/balance/balance.store'
import BalanceFilterSidebar from '@/components/reports/balance/FilterSidebar'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import BalanceHeader from '../components/BalanceHeader'
import BalanceTableRow from '../components/BalanceTableRow'
import { useBalanceData } from '../hooks/useBalanceData'

const BalanceReportPage = observer(() => {
  const t = useTranslations('Reports')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { data, isLoading, isFetching, error, expandedRows, toggleRow, exportBalanceReport, isExporting } = useBalanceData(t)

  return (
    <FixedContent>
      <BalanceFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {(isLoading || isFetching) && <ScreenLoader />}

      <div className={"w-full relative bg-white overflow-auto pb-10"}>
        <BalanceHeader t={t} onExport={exportBalanceReport} isExporting={isExporting} onOpenFilters={() => setIsFilterOpen(true)} />

        <div className="px-4 text-center mb-4 text-sm font-medium">
          {t('balance.formula')}
        </div>

        <div className='px-4'>
          {error && !isLoading && !isFetching ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 bg-white rounded-lg [&>p]:text-base [&>p]:text-red-600 [&>p]:m-0 [&>p]:text-center">
              <p>{t('balance.errorLoading')} {error?.message}</p>
              <button onClick={() => balanceStore.fetchBalance()} className="px-4 py-2 bg-[#0E73F6] text-white border-0 rounded-md cursor-pointer text-sm transition-colors hover:bg-[#0d5fd6]">
                {t('balance.retry')}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-100 sticky top-16 z-10">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium">{t('balance.accountHeader')}</th>
                  <th className="text-right px-4 py-2 text-xs font-medium">{t('common.total')}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.data?.map(row => (
                  <BalanceTableRow
                    key={row?.id}
                    item={row}
                    expandedRows={expandedRows}
                    onToggle={toggleRow}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </FixedContent>
  )
})

export default BalanceReportPage
