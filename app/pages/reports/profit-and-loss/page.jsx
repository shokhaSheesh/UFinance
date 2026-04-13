"use client"

import { cn } from '@/app/lib/utils'
import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import PnLFilterSidebar from '@/components/reports/profit-and-loss/FilterSidebar'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import '@/styles/report-filters.css'
import { useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import { pnlStore } from '../../../../components/reports/profit-and-loss/pnl.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import { ExpendClose, ExpendOpen } from '../../../../constants/icons'
import { apiClient } from '../../../../lib/api/ucode/base'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatPeriod } from '../../../../utils/helpers'

const formatDateLocal = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const accountingMethodOptions = [
  { value: 'accrual', label: 'Метод начисления' },
  { value: 'cash', label: 'Кассовый метод' }
]

const groupingOptions = [
  { value: 'daily', label: 'День' },
  { value: 'weekly', label: 'Неделя' },
  { value: 'monthly', label: 'Месяц' }
]

const ProfitAndLossPage = observer(() => {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: ''
  })

  const { dateRange, selectedGrouping,
    selectedCurrency,
    ebitda,
    ebit,
    ebt, isCalculation } = pnlStore


  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: selectedCurrency,
    accounting_method: isCalculation,
    isEbitda: ebitda,
    isEbit: ebit,
    isEbt: ebt,
    limit: 100,
    page: 1,
  }

  const { data: profitAndLossDataList, isLoading: isLoadingProfitAndLoss, isFetching: isFetchingProfitAndLoss } = useQuery({
    queryKey: ["profit_and_loss", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "profit_and_loss", data: filterData }),
    select: (res) => res?.data?.data,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const loading = isLoadingProfitAndLoss || isFetchingProfitAndLoss


  const legend = useMemo(() => profitAndLossDataList?.legend || [], [profitAndLossDataList])
  const rows = useMemo(() => profitAndLossDataList?.rows || [], [profitAndLossDataList])

  // Auto-expand first level on initial load
  useEffect(() => {
    if (!isInitialLoad || !profitAndLossDataList) return

    const firstLevelIds = new Set()
    rows.forEach(row => {
      if (row.level === 0 && row.details?.length > 0) {
        firstLevelIds.add(row.id)
      }
    })

    if (firstLevelIds.size > 0) {
      setExpandedRows(firstLevelIds)
      setIsInitialLoad(false)
    }
  }, [profitAndLossDataList, isInitialLoad, rows])

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const renderRow = (item, parentExpanded = true) => {
    if (!parentExpanded) return null

    const hasChildren = item.details && item.details.length > 0
    const isExpanded = expandedRows.has(item.id)
    const indent = item.level * 24

    const isPercentRow = item.type === 'percent'
    const isResultRow = item.type === 'result'
    const isTotalRow = item.type === 'total'

    return (
      <React.Fragment key={item.id}>
        <tr className={`border-b box-content border-neutral-200 transition-colors ${item.level === 0 || isResultRow || isTotalRow ? 'bg-neutral-50 font-semibold' : 'hover:bg-neutral-50'}`}>
          {/* Name cell — sticky left */}
          <td
            className={`sticky left-0 z-10 p-0! box-border transition-shadow duration-300 ${item.level === 0 || isResultRow || isTotalRow ? 'bg-neutral-50' : 'bg-white'} hover:bg-neutral-100 transition-colors`}
          >
            <div
              className={`flex items-center cursor-pointer! w-full border-r px-4 py-2 text-xss! gap-2 ${hasChildren ? '' : 'cursor-default'}`}
              style={{ paddingLeft: `${item.level * 1 + 1}rem` }}
              onClick={() => hasChildren && toggleRow(item.id)}
            >
              {hasChildren && (
                <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors w-4 h-4">
                  {isExpanded ? <ExpendClose /> : <ExpendOpen />}
                </button>
              )}
              <span className={cn('cursor-pointer!', item.level === 0 || isResultRow || isTotalRow ? 'font-semibold' : 'text-sm')}>
                {item.name}
              </span>
            </div>
          </td>
          {/* Period value cells */}
          {legend.map(period => {
            const value = item.values?.[period.key] || 0
            const displayValue = value === 0 ? '' : isPercentRow ? `${formatNumber(value)}%` : `${formatNumber(value)}`
            return (
              <td key={period.key} className="px-2 text-xs cursor-pointer text-end border-r min-w-[150px] max-w-[150px]">
                <span
                  className={`cursor-pointer! ${item.level === 0 || isResultRow || isTotalRow ? 'font-semibold' : ''} hover:text-primary transition-colors`}
                  onClick={() => handleCellClick(item, { key: period.key, label: period.title })}
                >
                  <span className='line-clamp-1 text-end w-full '>{displayValue}</span>
                </span>
              </td>
            )
          })}
          {/* Total cell */}
          <td className="px-2 cursor-pointer text-right border-l min-w-[150px] max-w-[150px]">
            <span
              className={`text-xs cursor-pointer! line-clamp-1 ${item.level === 0 || isResultRow || isTotalRow ? 'font-semibold' : 'text-xs'}  hover:underline hover:text-primary transition-colors`}
              onClick={() => handleCellClick(item, null)}
            >
              {item.totalValue === 0 ? '' : isPercentRow ? `${formatNumber(item.totalValue)}%` : formatNumber(item.totalValue)}
            </span>
          </td>
        </tr>
        {hasChildren && isExpanded && item.details.map(child => renderRow(child, true))}
      </React.Fragment>
    )
  }

  const handleCellClick = (item, monthObj) => {
    let dateRange = {
      start: formatDateLocal(pnlStore.dateRange.start),
      end: formatDateLocal(pnlStore.dateRange.end)
    }

    if (monthObj?.key) {
      const [year, month] = monthObj.key.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      dateRange = { start: startDate, end: endDate }
    }

    console.log('item', item)
    console.log('monthObj', monthObj)

    const collectIds = (node) => {
      let ids = []
      if (typeof node.id === 'string' && /\d/.test(node.id)) {
        ids.push(node.id)
      }
      if (node.details && Array.isArray(node.details)) {
        node.details.forEach(child => {
          ids.push(...collectIds(child))
        })
      }
      return ids
    }

    const chartOfAccountIds = collectIds(item)

    const filterData = {
      tip: ["Списание", "Зачисление", "Перемещение", "Выплата", "Поступление", "Отгрузка", "Дебет", "Кредит", "Начисление"],
      paymentAccural: true,
      paymentNotAccural: false,
      paymentDateStart: dateRange.start,
      paymentDateEnd: dateRange.end,
      limit: 10,
      chartOfAccounts: [item.id, ...chartOfAccountIds]
    }

    const periodLabel = formatPeriod(dateRange.start, dateRange.end)

    setModalConfig({
      filterData,
      summaryData: {
        periodLabel,
        totalAmount: item.totalValue,
        currencyCode: pnlStore.selectedCurrency
      },
      title: item.name
    })
    setIsModalOpen(true)
  }


  return (
    <div className="fixed left-[80px] w-[calc(100%-80px)] flex top-[60px] h-[calc(100%-60px)]">
      {/* P&L-specific Filter Sidebar */}
      <PnLFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(!isFilterOpen)}
      />

      {loading && <ScreenLoader />}

      {/* Main Content */}
      <div className={"w-full bg-white overflow-auto px-4"}>
        <div className='h-full flex flex-col'>
          <div className="flex  h-16 items-center sticky z-50 top-0 bg-white justify-between shrink-0">
            <div className="flex items-center gap-4" >
              <h1 className='text-xl whitespace-nowrap font-semibold'>Отчет о прибылях и убытках (P&L)</h1>
              <SingleSelect
                data={appStore.myCurrencies}
                value={pnlStore.selectedCurrency}
                onChange={(value) => pnlStore.setSelectedCurrency(value)}
                isClearable={false}
                withSearch={false}
                className={'bg-white w-28'}
                dropdownClassName={'w-28'}
              />
            </div>
            <div className="flex items-center gap-3">
              <SingleSelect
                data={groupingOptions}
                value={pnlStore.selectedGrouping}
                onChange={(value) => {
                  pnlStore.setSelectedGrouping(value)
                }}
                isClearable={false}
                withSearch={false}
                placeholder="Способ построения"
                className="bg-white w-44"
              />
              <SingleSelect
                data={accountingMethodOptions}
                value={pnlStore.isCalculation}
                onChange={(value) => {
                  pnlStore.setIsCalculation(value)
                }}
                isClearable={false}
                withSearch={false}
                placeholder="Метод учета"
                className="bg-white w-44"
                autoHeight={true}
              />
              <button className="flex items-center justify-center p-2 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="3" r="1" fill="currentColor" />
                  <circle cx="8" cy="8" r="1" fill="currentColor" />
                  <circle cx="8" cy="13" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
          <div className='flex flex-1 overflow-hidden'>
            <div div className='overflow-x-auto' >
              {!profitAndLossDataList && !loading ? (
                <div className="flex mx-auto flex-col items-center justify-center py-20 text-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: '16px', opacity: 0.3 }}>
                    <path d="M8 16C8 11.5817 11.5817 8 16 8H48C52.4183 8 56 11.5817 56 16V48C56 52.4183 52.4183 56 48 56H16C11.5817 56 8 52.4183 8 48V16Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 24H48M16 32H48M16 40H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: '16px', color: '#667085', marginBottom: '8px' }}>Выберите период для отображения отчета</p>
                  <p style={{ fontSize: '14px', color: '#98A2B3' }}>Используйте фильтры слева для настройки параметров отчета</p>
                </div>
              ) : (
                <table className="w-full  mb-10">
                  <thead className={"bg-neutral-100 sticky top-0 z-50 "}>
                    <tr>
                      <th
                        className="text-left text-xs font-medium sticky left-0 z-40 bg-neutral-100"
                        style={{ minWidth: 420 }}
                      >
                        <p className='px-4 w-full border-r py-2'>Статья</p>
                      </th>
                      {legend.map(period => (
                        <th key={period.key} className="text-right bg-neutral-100 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] text-xs text-xss! font-medium">
                          <span className='line-clamp-1 border-l px-4 py-2'>{period.title}</span>
                        </th>
                      ))}
                      <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium">
                        Итого
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows?.map(row => renderRow(row))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <OperationCashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filterData={modalConfig.filterData}
        summaryData={modalConfig.summaryData}
        title={modalConfig.title}
      />
    </div>
  )
})

export default ProfitAndLossPage


