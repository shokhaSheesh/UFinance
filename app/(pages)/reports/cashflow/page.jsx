"use client"
import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import CashFlowFilterSidebar from '@/components/reports/cashflow/FilterSidebar'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import '@/styles/report-filters.css'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cashFlowStore } from '../../../../components/reports/cashflow/cashflow.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import { ExpendClose, ExpendOpen } from '../../../../constants/icons'
import { apiClient } from '../../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../../lib/utils/notifications'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatTotalSumma, handleDownload, isUUID } from '../../../../utils/helpers'


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
                className={`  ${isBold ? "font-semibold" : ""} ${row?.isClickable ? ' hover:text-primary transition-colors' : ''}`}
                onClick={() => {
                  if (!row?.isClickable) return
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
            className={`text-xs line-clamp-1 ${isBold ? "font-semibold" : "text-xs"} ${!row?.isClickable ? ' hover:underline hover:text-primary transition-colors' : ''}`}
            onClick={() => {
              if (!row?.isClickable) return
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
  const t = useTranslations('Reports')
  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('cashflow.grouping.daily') },
    { value: 'monthly', label: t('cashflow.grouping.monthly') },
    { value: 'quarterly', label: t('cashflow.grouping.quarterly') },
    { value: 'yearly', label: t('cashflow.grouping.yearly') }
  ], [t])

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

  const { mutate: exportCashFlow, isPending: isCashFlowLoading } = useMutation({
    mutationKey: ['export_cash_flow'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_cash_flow', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      console.log('uploadData', uploadData)
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'cash_flow.xlsx')
      }
    }
  })


  const legend = useMemo(() => cashFlowDataList?.legend || [], [cashFlowDataList])
  const months = useMemo(() => legend.map(l => l.key), [legend])

  const data = useMemo(() => {
    if (!cashFlowDataList?.rows) return []

    // Recursive — node ning O'ZINI + barcha descendantlarini yig'adi
    // (faqat leaf emas, intermediate parentlar ham)
    const collectAllIds = (node) => {
      const ownId = node?.id ? [node.id?.slice(0, 36)] : []
      const hasChildren = node?.details && node.details.length > 0

      if (!hasChildren) {
        return ownId
      }

      const childIds = node.details.flatMap(child => collectAllIds(child))
      return [...ownId, ...childIds]
    }

    const getRootTip = (rootName) => {
      if (
        rootName === 'Операционный поток' ||
        rootName === 'Инвестиционный поток' ||
        rootName === 'Финансовый поток'
      ) {
        return ['Поступление', 'Выплата']
      }
      if (rootName === 'Перемещения') {
        return ['Списание', 'Зачисление', 'Перемещение']
      }
      if (rootName === 'Общий денежный поток' || rootName === 'Остатки на конец периода') {
        return ['Списание', 'Зачисление', 'Перемещение', 'Поступление', 'Выплата']
      }
      return []
    }

    const getSubtreeTip = (name) => {
      if (name === 'Поступления') return ['Поступление']
      if (name === 'Выплаты') return ['Выплата']
      if (name === 'Списания') return ['Списание']
      if (name === 'Зачисления') return ['Зачисление']
      return null
    }

    const transformRow = (
      row,
      depth = 0,
      sectionName = null,
      parentPath = '',
      inheritedSubtreeTip = null,
      rootName = null,
      inheritedClickable = true
    ) => {
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
      const currentRootName = depth === 0 ? row.name : rootName

      let currentSubtreeTip = inheritedSubtreeTip
      const subtreeTipFromName = getSubtreeTip(row.name)
      if (depth >= 1 && subtreeTipFromName) {
        currentSubtreeTip = subtreeTipFromName
      }

      let tip
      if (depth === 0) {
        tip = getRootTip(row.name)
      } else if (currentSubtreeTip) {
        tip = currentSubtreeTip
      } else {
        tip = getRootTip(currentRootName)
      }

      let isClickable = inheritedClickable
      if (depth === 0) {
        isClickable = row.name !== 'Остатки на конец периода' && row.id !== 'ending-balance'
      }

      // Barcha descendant + o'zining id si — duplikatlarsiz
      const ids = [
        ...new Set(
          collectAllIds(row)
            ?.map(id => id?.replace(/':+/g, ''))
            ?.filter(id => isUUID(id))
        ),
      ]

      const node = {
        id: row.id,
        uniquePath: rowUniquePath,
        name: row.name,
        total: row.totalValue || 0,
        months: monthData,
        level: depth,
        section: currentSection,
        isClickable,
        filterdata: {
          ids,
          tip,
        },
        subRows: [],
      }

      if (row.details && Array.isArray(row.details) && row.details.length > 0) {
        node.subRows = row.details.map(detail =>
          transformRow(
            detail,
            depth + 1,
            currentSection,
            rowUniquePath,
            currentSubtreeTip,
            currentRootName,
            isClickable
          )
        )
      }

      return node
    }

    const transformed = cashFlowDataList.rows.map(row => transformRow(row, 0))

    // "Общий денежный поток" — leaf, qo'lda aggregate (barcha oldingi rootlar dan)
    const overallIndex = transformed.findIndex(
      r => r.name === 'Общий денежный поток' || r.id === 'overall-cash-flow'
    )
    if (overallIndex !== -1) {
      const aggregatedIds = []
      for (let i = 0; i < overallIndex; i++) {
        aggregatedIds.push(...transformed[i].filterdata.ids)
      }
      transformed[overallIndex].filterdata.ids = [...new Set(aggregatedIds)]
    }

    return transformed
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

  const handleExportCashFlow = () => {
    exportCashFlow()
  }

  const handleCellClick = (row, monthObj) => {

    const requestData = {
      tip: row.filterdata?.tip,
      limit: 50,
      chart_of_accounts_ids: row.filterdata?.ids,
      paymentConfirm: true,
      paymentNotConfirm: false,
      accrualConfirm: true,
      accrualNotConfirm: true,
      currencyCode: currencyCode
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
              <h1 className='text-xl whitespace-nowrap font-semibold'>{t('cashflow.title')}</h1>
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
                placeholder={t('common.buildingMethod')}
                withSearch={false}
                isClearable={false}
                className="bg-white w-44"
                dropdownClassName="bg-white"
              />
              <button onClick={handleExportCashFlow} type='button' className="primary-btn">{t('common.downloadExcel')} {isCashFlowLoading && <Loader2 size={16} className="animate-spin" />}</button>
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
                      <p className='px-4 w-full border-r py-2'>{t('cashflow.articleHeader')}</p>
                    </th>
                    {legend.map(col => (
                      <th key={col.key} className="text-right bg-neutral-100 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px]  text-xs border-r border-neutral-200  text-xss! font-medium" >
                        <span className='line-clamp-1 border-l  px-4 py-2 '>{col.title}</span>
                      </th>
                    ))}
                    <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium" >
                      {t('common.total')}
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
