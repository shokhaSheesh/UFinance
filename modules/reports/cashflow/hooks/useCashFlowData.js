import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { handleDownload } from '@/utils/helpers'
import { useMutation, useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { aggregateOverallCashFlow, transformRow } from '../utils/cashflowUtils'

export function useCashFlowData(t) {
  const [expandedMap, setExpandedMap] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    isTransfer: false
  })
  const didAutoExpand = useRef(false)

  const { periodStartDate, periodEndDate, periodType, currencyCode, sellingDealId, contrAgentId, accountId, dealId } = cashFlowStore

  const filterData = {
    periodStartDate: periodStartDate ? moment(periodStartDate).format('YYYY-MM-DD') : null,
    periodEndDate: periodEndDate ? moment(periodEndDate).format('YYYY-MM-DD') : null,
    periodType,
    currencyCode,
    sellingDealId,
    contrAgentId,
    accountId,
    dealId,
  }

  const { data: cashFlowDataList, isLoading, isFetching } = useQuery({
    queryKey: ["cash_flow", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "cash_flow", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const { mutate: exportCashFlow, isPending: isExporting } = useMutation({
    mutationKey: ['export_cash_flow'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_cash_flow', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) handleDownload(`https://cdn.u-code.io/${fileLink}`, 'cash_flow.xlsx')
    }
  })

  const legend = useMemo(() => cashFlowDataList?.legend || [], [cashFlowDataList])
  const months = useMemo(() => legend.map(l => l?.key), [legend])

  const data = useMemo(() => {
    if (!cashFlowDataList?.rows) return []
    const transformed = cashFlowDataList.rows.map(row => transformRow(row, months, 0))
    return aggregateOverallCashFlow(transformed)
  }, [cashFlowDataList, months])

  useEffect(() => {
    if (didAutoExpand.current || !Array.isArray(data) || data.length === 0) return
    const initial = {}
    data.forEach(row => { if (row?.subRows?.length > 0) initial[row.uniquePath] = true })
    if (Object.keys(initial).length > 0) {
      setExpandedMap(initial)
      didAutoExpand.current = true
    }
  }, [data])

  const handleToggle = (uniquePath) => {
    setExpandedMap(prev => ({ ...prev, [uniquePath]: !prev[uniquePath] }))
  }

  const handleCellClick = (row, monthObj) => {
    const requestData = {
      tip: row?.filterdata?.tip,
      limit: 10,
      chart_of_accounts_ids: row?.filterdata?.ids,
      paymentConfirm: true,
      paymentNotConfirm: false,
      accrualConfirm: true,
      accrualNotConfirm: true,
      currencyCode
    }

    if (monthObj?.key) {
      const [year, month] = monthObj.key.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      requestData.paymentDateStart = startDate
      requestData.paymentDateEnd = endDate
    } else {
      requestData.paymentDateStart = moment(periodStartDate).format('YYYY-MM-DD')
      requestData.paymentDateEnd = moment(periodEndDate).format('YYYY-MM-DD')
    }

    const periodLabel = moment(monthObj + '01').format("MMM, 'YY")
    const isTransfer = ['Зачисления', 'Списания', 'Перемещения'].includes(row?.name)

    setModalConfig({
      filterData: requestData,
      title: row?.name,
      summaryData: { periodLabel, totalAmount: row?.total, currencyCode },
      isTransfer
    })
    setIsModalOpen(true)
  }

  return {
    data,
    months,
    legend,
    expandedMap,
    isLoading,
    isFetching,
    handleToggle,
    handleCellClick,
    exportCashFlow,
    isExporting,
    isModalOpen,
    setIsModalOpen,
    modalConfig,
  }
}
