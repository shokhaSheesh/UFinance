'use client'

import TableCard from '@/components/shared/Table/TableCard'
import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import PnLFilterSidebar from '@/components/reports/profit-and-loss/FilterSidebar'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import '@/styles/report-filters.css'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import PnLEmptyState from '../components/PnLEmptyState'
import PnLHeader from '../components/PnLHeader'
import PnLTable from '../components/PnLTable'
import { usePnLData } from '../hooks/usePnLData'

const ProfitAndLossPage = observer(() => {
  const t = useTranslations('Reports')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const accountingMethodOptions = useMemo(() => [
    { value: 'accrual', label: t('pnl.accounting.accrual') },
    { value: 'cash', label: t('pnl.accounting.cash') }
  ], [t])
  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('pnl.grouping.daily') },
    { value: 'weekly', label: t('pnl.grouping.weekly') },
    { value: 'monthly', label: t('pnl.grouping.monthly') }
  ], [t])

  const {
    profitAndLossDataList, loading, rows, legend, expandedRows,
    toggleRow, handleCellClick,
    isModalOpen, setIsModalOpen, modalConfig,
    exportProfitAndLoss, isExporting,
    safeIsCalculation, safeSelectedGrouping, safeSelectedCurrency,
  } = usePnLData(t)

  return (
    <FixedContent>
      <PnLFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {loading && <ScreenLoader />}

      <div className={"w-full bg-white overflow-auto px-4"}>
        <div className='h-full flex flex-col'>
          <PnLHeader
            t={t}
            accountingMethodOptions={accountingMethodOptions}
            groupingOptions={groupingOptions}
            safeSelectedCurrency={safeSelectedCurrency}
            safeSelectedGrouping={safeSelectedGrouping}
            safeIsCalculation={safeIsCalculation}
            onExport={exportProfitAndLoss}
            isExporting={isExporting}
            onOpenFilters={() => setIsFilterOpen(true)}
          />

          {!profitAndLossDataList && !loading ? (
            <PnLEmptyState />
          ) : (
            <TableCard>
            <PnLTable
              t={t}
              rows={rows}
              legend={legend}
              expandedRows={expandedRows}
              onToggle={toggleRow}
              onCellClick={handleCellClick}
            />
            </TableCard>
          )}
        </div>
      </div>

      <OperationCashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filterData={modalConfig.filterData}
        dateRange={modalConfig.dateRange}
        summaryData={modalConfig.summaryData}
        title={modalConfig.title}
      />
    </FixedContent>
  )
})

export default ProfitAndLossPage
