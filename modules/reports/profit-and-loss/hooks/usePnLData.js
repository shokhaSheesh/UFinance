import { pnlStore } from '@/components/reports/profit-and-loss/pnl.store'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { formatPeriod, handleDownload } from '@/utils/helpers'
import { useMutation, useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { buildEnrichedRows, formatDateLocal } from '../utils/pnlUtils'

export function usePnLData(t) {
  const mounted = useMounted()
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    dateRange: null
  })

  const {
    dateRange, selectedGrouping, selectedCurrency,
    ebitda, deals, ebit, selectedAccounts,
    selectedCounterparties, selectedLegalEntities, ebt, isCalculation
  } = pnlStore

  // Hydration-safe values
  const safeIsCalculation = mounted ? isCalculation : 'cash'
  const safeSelectedGrouping = mounted ? selectedGrouping : 'monthly'
  const safeSelectedCurrency = mounted ? selectedCurrency : null

  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: selectedCurrency,
    accounting_method: isCalculation,
    my_accounts_ids: selectedAccounts,
    counterparties_ids: selectedCounterparties,
    legal_entity_ids: selectedLegalEntities,
    isEbitda: ebitda,
    isEbit: ebit,
    isEbt: ebt,
    limit: 100,
    page: 1,
  }

  const { data: profitAndLossDataList, isLoading, isFetching } = useQuery({
    queryKey: ["profit_and_loss", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "profit_and_loss", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const { mutate: exportProfitAndLoss, isPending: isExporting } = useMutation({
    mutationKey: ['export_profit_and_loss'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_profit_and_loss', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) handleDownload(`https://cdn.u-code.io/${fileLink}`, 'profit_and_loss.xlsx')
    }
  })

  const loading = isLoading || isFetching
  const legend = useMemo(() => profitAndLossDataList?.legend || [], [profitAndLossDataList])

  const rows = useMemo(() => {
    return buildEnrichedRows(profitAndLossDataList?.rows, isCalculation)
  }, [profitAndLossDataList, isCalculation])

  useEffect(() => {
    if (!isInitialLoad || !profitAndLossDataList) return
    const firstLevelIds = new Set()
    rows.forEach(row => {
      if (row?.level === 0 && row?.details?.length > 0) firstLevelIds.add(row?.id)
    })
    if (firstLevelIds.size > 0) {
      setExpandedRows(firstLevelIds)
      setIsInitialLoad(false)
    }
  }, [profitAndLossDataList, isInitialLoad, rows])

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCellClick = (item, monthObj) => {
    let dateRange = {
      start: formatDateLocal(pnlStore.dateRange?.start),
      end: formatDateLocal(pnlStore.dateRange?.end)
    }
    if (monthObj?.key) {
      const [year, month] = monthObj.key.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      dateRange = { start: startDate, end: endDate }
    }

    const filterData = {
      tip: item?.filterdata?.tip,
      limit: 50,
      chart_of_accounts_ids: item?.filterdata?.ids,
      currencyCode: selectedCurrency
    }

    if (isCalculation === 'cash') {
      filterData.paymentConfirm = true
      filterData.paymentNotConfirm = false
      filterData.accrualConfirm = true
      filterData.accrualNotConfirm = true
      filterData.paymentDateStart = dateRange.start
      filterData.paymentDateEnd = dateRange.end
    }
    if (isCalculation === 'accrual') {
      filterData.paymentConfirm = true
      filterData.paymentNotConfirm = true
      filterData.accrualConfirm = true
      filterData.accrualNotConfirm = false
      filterData.accrualDateStart = dateRange.start
      filterData.accrualDateEnd = dateRange.end
    }

    const periodLabel = formatPeriod(dateRange.start, dateRange.end)

    setModalConfig({
      filterData,
      dateRange,
      summaryData: {
        periodLabel,
        totalAmount: item?.totalValue,
        currencyCode: selectedCurrency
      },
      title: item?.name
    })
    setIsModalOpen(true)
  }

  return {
    profitAndLossDataList,
    loading,
    rows,
    legend,
    expandedRows,
    toggleRow,
    handleCellClick,
    isModalOpen,
    setIsModalOpen,
    modalConfig,
    exportProfitAndLoss,
    isExporting,
    mounted,
    safeIsCalculation,
    safeSelectedGrouping,
    safeSelectedCurrency,
  }
}
