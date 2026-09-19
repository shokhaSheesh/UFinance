'use client'

import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import CashFlowFilterSidebar from '@/components/reports/cashflow/FilterSidebar'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import '@/styles/report-filters.css'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import CashFlowHeader from '../components/CashFlowHeader'
import CashFlowTable from '../components/CashFlowTable'
import { useCashFlowData } from '../hooks/useCashFlowData'

const CashFlowReportPage = observer(() => {
  const t = useTranslations('Reports')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('cashflow.grouping.daily') },
    { value: 'monthly', label: t('cashflow.grouping.monthly') },
    { value: 'quarterly', label: t('cashflow.grouping.quarterly') },
    { value: 'yearly', label: t('cashflow.grouping.yearly') }
  ], [t])

  const {
    data, months, legend, expandedMap,
    isLoading, isFetching,
    handleToggle, handleCellClick,
    exportCashFlow, isExporting,
    isModalOpen, setIsModalOpen, modalConfig,
  } = useCashFlowData(t)

  return (
    <FixedContent>
      <CashFlowFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {(isLoading || isFetching) && <ScreenLoader />}

      <div className={"w-full bg-white overflow-auto px-4"}>
        <div className="h-full flex flex-col">
          <CashFlowHeader
            t={t}
            groupingOptions={groupingOptions}
            onExport={exportCashFlow}
            isExporting={isExporting}
            onOpenFilters={() => setIsFilterOpen(true)}
          />
          <CashFlowTable
            t={t}
            data={data}
            months={months}
            legend={legend}
            expandedMap={expandedMap}
            onToggle={handleToggle}
            onCellClick={handleCellClick}
          />
        </div>
      </div>

      <OperationCashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filterData={modalConfig.filterData}
        summaryData={modalConfig.summaryData}
        title={modalConfig.title}
        isTransfer={modalConfig.isTransfer}
      />
    </FixedContent>
  )
})

export default CashFlowReportPage
