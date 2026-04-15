"use client"

import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import CashFlowFilterSidebar from '@/components/reports/cashflow/FilterSidebar'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import '@/styles/report-filters.css'
import { useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cashFlowStore } from '../../../../components/reports/cashflow/cashflow.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import { ExpendClose, ExpendOpen } from '../../../../constants/icons'
import { apiClient } from '../../../../lib/api/ucode/base'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatTotalSumma } from '../../../../utils/helpers'

const groupingOptions = [
  { value: 'monthly', label: 'По месяцам' },
  { value: 'quarterly', label: 'По кварталам' },
  { value: 'yearly', label: 'По годам' }
]

// Format number: empty string for zero, otherwise locale-formatte

// Recursive row renderer
function TableRow({ row, months, legend, depth = 0, expandedMap, onToggle, onCellClick }) {
  const hasChildren = row.subRows && row.subRows.length > 0
  const isExpanded = !!expandedMap[row.uniquePath]
  const isEndingBalance = row.id === 'ending-balance'
  const isTotal = row.id === 'overall-cash-flow' || row.id === 'ending-balance'
  const isBold = depth === 0 || isTotal

  const totalMonthSum = months.reduce((acc, m) => acc + (row.months?.[m] || 0), 0)

  return (
    <>
      <tr className={`border-b box-content border-neutral-200 transition-colors ${depth === 0 ? 'bg-neutral-50 font-semibold' : 'hover:bg-neutral-50'}`}>
        {/* Name cell */}

        <td
          className={cn(
            " sticky left-0 z-10 p-0! box-border transition-shadow duration-300",
            depth === 0 ? "bg-neutral-50" : "bg-white",
            "hover:bg-neutral-100 transition-colors",
          )}
        >
          <div
            className={`flex items-center w-full border-r py-2 text-xss! gap-2 ${hasChildren ? "cursor-pointer!" : "cursor-default"}`}
            style={{ paddingLeft: `${depth * 1 + 1}rem` }}
            onClick={hasChildren ? () => onToggle(row.uniquePath) : undefined}
          >
            {hasChildren && (
              <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors w-4 h-4">
                {isExpanded ? <ExpendClose /> : <ExpendOpen />}
              </button>
            )}
            <span className={isBold ? "font-semibold" : "text-sm"}>{row.name}</span>
          </div>
        </td>

        {/* Month value cells */}
        {months.map(month => {
          const val = row.months?.[month] ?? 0
          const legendItem = legend.find(l => l.key === month)
          return (
            <td key={month} className="px-2 cursor-pointer! text-xs text-end border-r min-w-[150px] max-w-[150px]">
              <span
                className={`  ${isBold ? "font-semibold" : ""} ${!isEndingBalance ? ' hover:text-primary transition-colors' : ''}`}
                onClick={() => {
                  if (isEndingBalance) return
                  onCellClick(row, { key: month, label: legendItem?.title || month })
                }}
              >
                {/* <CustomTooltip> */}
                <span className='line-clamp-1 text-end w-full cursor-pointer'>{formatNumber(formatTotalSumma(val))}</span>
                {/* </CustomTooltip> */}
              </span>
            </td>
          )
        })}

        {/* Total cell */}
        <td className="px-2 text-right border-l min-w-[150px] max-w-[150px] cursor-pointer!">
          <span
            className={`text-xs line-clamp-1 ${isBold ? "font-semibold" : "text-xs"} ${!isEndingBalance ? ' hover:underline hover:text-primary transition-colors' : ''}`}
            onClick={() => {
              if (isEndingBalance) return
              onCellClick(row, null)
            }}
          >
            {formatNumber(formatTotalSumma(row.total || totalMonthSum))}
          </span>
        </td>
      </tr>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && row.subRows.map(child => (
        <TableRow
          key={child.uniquePath}
          row={child}
          months={months}
          legend={legend}
          depth={depth + 1}
          expandedMap={expandedMap}
          onToggle={onToggle}
          onCellClick={onCellClick}
        />
      ))}
    </>
  )
}

const nameMap = {
  "Поступления": ["Поступление"],
  "Выплаты": ["Выплата"],
  "Списания": ["Списание", "Перемещение"],
  "Зачисления": ["Зачисление", "Перемещение"],
  "Перемещения": ["Списание", "Зачисление", "Перемещение"],
  "Операционный поток": ["Поступление", "Выплата"],
  "Инвестиционный поток": ["Поступление", "Выплата"],
  "Финансовый поток": ["Поступление", "Выплата"],
}


export default observer(function CashFlowReportPage() {
  const [expandedMap, setExpandedMap] = useState({})
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    isTransfer: false
  })
  const didAutoExpand = useRef(false)

  // Extract legend (month columns)
  const { periodStartDate, periodEndDate, periodType, currencyCode, sellingDealId, contrAgentId, accountId, dealId } = cashFlowStore


  // const filterData = useMemo(() => {
  //   return {
  // }, [periodStartDate, periodEndDate, periodType, currencyCode, sellingDealId, contrAgentId, accountId, dealId])

  const filterData = {
    periodStartDate: periodStartDate ? moment(periodStartDate).format('YYYY-MM-DD') : null,
    periodEndDate: periodEndDate ? moment(periodEndDate).format('YYYY-MM-DD') : null,
    periodType: periodType,
    currencyCode: currencyCode, // Defaulting to RUB as seen in page
    sellingDealId: sellingDealId, // these are same values
    contrAgentId: contrAgentId,
    accountId: accountId,
    dealId: dealId, // these are same values
  }


  const { data: cashFlowDataList, isLoading: isLoadingCashFlow, isFetching: isFetchingCashFlow } = useQuery({
    queryKey: ["cash_flow", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "cash_flow", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
  })

  const legend = useMemo(() => cashFlowDataList?.legend || [], [cashFlowDataList])
  const months = useMemo(() => legend.map(l => l.key), [legend])

  // Transform rows into tree structure with section context
  const data = useMemo(() => {
    if (!cashFlowDataList?.rows) return []

    const transformRow = (row, depth = 0, sectionName = null, parentPath = '') => {
      const monthData = {}
      months.forEach(monthKey => {
        monthData[monthKey] = row.values?.[monthKey] || 0
      })

      let currentSection = sectionName
      if (depth === 1) {
        if (row.name === 'Поступления') currentSection = 'Поступления'
        if (row.name === 'Выплаты') currentSection = 'Выплаты'
        if (row.name === 'Списания') currentSection = 'Списания'
        if (row.name === 'Зачисления') currentSection = 'Зачисления'
      }

      const rowUniquePath = parentPath ? `${parentPath}-${row.id}` : String(row.id)

      const node = {
        id: row.id,
        uniquePath: rowUniquePath,
        name: row.name,
        total: row.totalValue || 0,
        months: monthData,
        level: depth,
        section: currentSection,
        subRows: []
      }

      if (row.details && Array.isArray(row.details) && row.details.length > 0) {
        node.subRows = row.details.map(detail => transformRow(detail, depth + 1, currentSection, rowUniquePath))
      }

      return node
    }

    return cashFlowDataList.rows.map(row => transformRow(row, 0, null, ''))
  }, [cashFlowDataList, months])

  // Auto-expand top-level rows on first load
  useEffect(() => {
    if (didAutoExpand.current || !Array.isArray(data) || data.length === 0) return
    const initial = {}
    data.forEach(row => {
      if (row.subRows?.length > 0) initial[row.uniquePath] = true
    })
    if (Object.keys(initial).length > 0) {
      setExpandedMap(initial)
      didAutoExpand.current = true
    }
  }, [data])

  const handleToggle = (uniquePath) => {
    setExpandedMap(prev => ({ ...prev, [uniquePath]: !prev[uniquePath] }))
  }

  const handleCellClick = (row, monthObj) => {
    const requestData = {}

    if (monthObj?.key) {
      const [year, month] = monthObj.key.split('-').map(Number)
      const startDate = `01-${String(month).padStart(2, '0')}-${year}`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${String(lastDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
      requestData.paymentDateStart = startDate
      requestData.paymentDateEnd = endDate
    } else {
      requestData.paymentDateStart = moment(periodStartDate).format('YYYY-MM-DD')
      requestData.paymentDateEnd = moment(periodEndDate).format('YYYY-MM-DD')
    }
    requestData.tip = nameMap[row.name] || nameMap[row.section]

    console.log('row', row)
    console.log('monthObj', monthObj)

    if (['Перемещения', 'Списания', 'Зачисления'].includes(row.name)) {
      requestData.paymentConfirmed = true
      requestData.paymentNotConfirmed = true
      requestData.accrualConfirmed = true
      requestData.accrualNotConfirmed = true
    }
    if ("Операционный поток" === row?.name ||
      "Инвестиционный поток" === row?.name ||
      "Финансовый поток" === row?.name) {
      requestData.paymentConfirmed = true
      requestData.paymentNotConfirmed = false
    }

    if (row?.subRows) {
      requestData.chartOfAccounts = [row.id]
    }



    // const filters = cashFlowStore.filters
    // let dateRange = { start: filters.periodStartDate, end: filters.periodEndDate }

    // if (monthObj?.key) {
    //   const [year, month] = monthObj.key.split('-').map(Number)
    //   const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    //   const lastDay = new Date(year, month, 0).getDate()
    //   const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    //   dateRange = { start: startDate, end: endDate }
    // }

    // const tips = (() => {
    //   if (['Операционный поток', 'Инвестиционный поток', 'Финансовый поток'].includes(row.name)) {
    //     return { tip: ['Поступление', 'Выплата'] }
    //   }
    //   if (row.section === 'Поступления') return { tip: ['Поступление'] }
    //   if (row.section === 'Выплаты') return { tip: ['Выплата'] }
    //   if (row.section === 'Списания') return { tip: ['Списание', 'Перемещение'] }
    //   if (row.section === 'Зачисления') return { tip: ['Зачисление', 'Перемещение'] }


    //   return nameMap[row.name] ? { tip: nameMap[row.name] } : {}
    // })()

    // const filterData = {
    //   ...tips,
    //   paymentConfirmed: true,
    //   paymentNotConfirmed: false,
    //   paymentDateStart: dateRange.start,
    //   paymentDateEnd: dateRange.end,
    // }

    const periodLabel = moment(monthObj + '01').format("MMM, 'YY")
    const isTransfer = ['Зачисления', 'Списания', 'Перемещения'].includes(row.name)

    requestData.limit = 10

    setModalConfig({
      filterData: requestData,
      title: row.name,
      summaryData: {
        periodLabel,
        totalAmount: row.total,
        currencyCode
      },
      isTransfer
    })
    setIsModalOpen(true)

  }

  return (
    <div className="fixed left-[80px] w-[calc(100%-80px)]  flex top-[60px] h-[calc(100%-60px)]">
      <CashFlowFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(!isFilterOpen)} />

      {(isLoadingCashFlow || isFetchingCashFlow) && <ScreenLoader />}

      <div className={"w-full bg-white overflow-auto px-4"}>
        <div className="h-full flex flex-col">
          <div className="flex  h-16 items-center sticky z-50 top-0 bg-white justify-between shrink-0">
            <div className="flex items-center gap-4">
              <h1 className='text-xl whitespace-nowrap font-semibold'>Отчет о движении денежных средств</h1>
              <SingleSelect
                data={appStore.myCurrencies}
                value={currencyCode}
                onChange={(value) => {
                  cashFlowStore.setCurrencyCode(value)
                }}
                isClearable={false}
                withSearch={false}
                className={'bg-white w-28'}
                dropdownClassName={'w-28'}
              />
            </div>
            <div className="flex items-center gap-3">
              <SingleSelect
                data={groupingOptions}
                value={periodType}
                onChange={(value) => {
                  cashFlowStore.setPeriodType(value)
                }}
                placeholder="Способ построения"
                withSearch={false}
                isClearable={false}
                className="bg-white w-44"
                dropdownClassName="bg-white"
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
            <div className="overflow-x-auto">
              <table className="w-full  mb-10">
                <thead className=" bg-neutral-100 sticky top-0 z-50">
                  <tr>
                    <th
                      className={cn(
                        "text-left  text-xs font-medium sticky left-0 z-40 bg-neutral-100 transition-shadow duration-300",
                      )}
                      style={{ minWidth: 420 }}
                    >
                      <p className='px-4 w-full border-r py-2'> По статьям учета</p>
                    </th>
                    {legend.map(col => (
                      <th key={col.key} className="text-right bg-neutral-100 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px]  text-xs border-r border-neutral-200  text-xss! font-medium" >
                        <span className='line-clamp-1 border-l  px-4 py-2 '>{col.title}</span>
                      </th>
                    ))}
                    <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium" >
                      Итого
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <TableRow
                      key={row.uniquePath}
                      row={row}
                      months={months}
                      legend={legend}
                      depth={0}
                      expandedMap={expandedMap}
                      onToggle={handleToggle}
                      onCellClick={handleCellClick}
                    />
                  ))}
                </tbody>
              </table>
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
        isTransfer={modalConfig.isTransfer}
      />
    </div>
  )
})
