"use client"
import TableCard from '@/components/shared/Table/TableCard'
import FilterButton from '@/components/shared/Filters/FilterButton'
import { useCashFlowFilterCount } from '@/hooks/useReportFilterCount'
import IconButton from '@/components/shared/Buttons/IconButton'
import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import CashFlowFilterSidebar from '@/components/reports/cashflow/FilterSidebar'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import '@/styles/report-filters.css'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
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

  // Оформление то же, что в балансовом отчёте: корневые разделы заливкой и
  // синей полосой слева, вложенные — светлее, статьи на белом
  const rowBg = isBold ? 'bg-slate-100' : depth === 1 ? 'bg-slate-50' : 'bg-white'
  const textTone = isBold
    ? 'text-slate-900 font-semibold'
    : depth === 1
      ? 'text-slate-800 font-medium'
      : 'text-slate-600'
  const totalValue = row.total || totalMonthSum

  return (
    <>
      <tr className={cn('group border-b', isBold ? 'border-slate-300' : 'border-slate-100')}>
        {/* Name cell */}
        <td
          className={cn(
            'sticky left-0 z-10 box-border p-0! transition-colors',
            rowBg,
            'group-hover:bg-sky-50',
            isBold && 'shadow-[inset_3px_0_0_#0e73f6]'
          )}
        >
          <div
            className={cn(
              'flex w-full items-center gap-1.5 border-r border-slate-200 py-2 pr-3 text-xs',
              textTone,
              hasChildren ? 'cursor-pointer!' : 'cursor-default'
            )}
            style={{ paddingLeft: `${depth * 1.25 + 0.875}rem` }}
            onClick={hasChildren ? () => onToggle(row.uniquePath) : undefined}
          >
            {hasChildren ? (
              <button className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 transition-colors hover:text-slate-600">
                {isExpanded ? <ExpendClose color={isBold ? '#334155' : '#94a3b8'} /> : <ExpendOpen color={isBold ? '#334155' : '#94a3b8'} />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span>{row.name}</span>
          </div>
        </td>

        {/* Month value cells */}
        {months.map(month => {
          const val = row.months?.[month] ?? 0
          const legendItem = legend.find(l => l.key === month)
          return (
            <td
              key={month}
              className={cn(
                'min-w-[150px] max-w-[150px] border-r border-slate-200 px-3 py-2 text-end text-xs tabular-nums transition-colors',
                rowBg,
                textTone,
                'group-hover:bg-sky-50',
                val < 0 && 'text-red-600!'
              )}
            >
              <span
                className={cn('line-clamp-1', row?.isClickable && 'cursor-pointer transition-colors hover:text-primary')}
                onClick={() => {
                  if (!row?.isClickable) return
                  onCellClick(row, { key: month, label: legendItem?.title || month })
                }}
              >
                {formatNumber(formatTotalSumma(val))}
              </span>
            </td>
          )
        })}

        {/* Total cell */}
        <td
          className={cn(
            'min-w-[150px] max-w-[150px] border-l border-slate-200 px-3 py-2 text-right text-xs font-semibold tabular-nums transition-colors',
            rowBg,
            textTone,
            'group-hover:bg-sky-50',
            totalValue < 0 && 'text-red-600!'
          )}
        >
          <span
            className={cn('line-clamp-1', row?.isClickable && 'cursor-pointer transition-colors hover:text-primary')}
            onClick={() => {
              if (!row?.isClickable) return
              onCellClick(row, null)
            }}
          >
            {formatNumber(formatTotalSumma(totalValue))}
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
  const [expandedMap, setExpandedMap] = useState({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterCount = useCashFlowFilterCount()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    isTransfer: false
  })
  const didAutoExpand = useRef(false)

  // Extract legend (month columns)
  const { periodStartDate, periodEndDate, periodType, currencyCode, sellingDealId, contrAgentId, accountId, dealId, projectId } = cashFlowStore


  const filterData = {
    periodStartDate: periodStartDate ? moment(periodStartDate).format('YYYY-MM-DD') : null,
    periodEndDate: periodEndDate ? moment(periodEndDate).format('YYYY-MM-DD') : null,
    periodType: periodType,
    currencyCode: currencyCode, // Defaulting to RUB as seen in page
    sellingDealId: sellingDealId, // these are same values
    contrAgentId: contrAgentId,
    accountId: accountId,
    dealId: dealId, // these are same values
    project_ids: projectId,
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
    <div className="fixed left-[var(--sidebar-w)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))]  flex top-[60px] h-[calc(100%-60px)]">
      <CashFlowFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {(isLoadingCashFlow || isFetchingCashFlow) && <ScreenLoader />}

      <div className={"w-full bg-canvas overflow-auto px-6"}>
        <div className="h-full flex flex-col">
          <div className="flex h-16 items-center justify-between sticky z-50 top-0 bg-canvas shrink-0">
            <h1 className='text-xl whitespace-nowrap font-semibold'>{t('cashflow.title')}</h1>
            <div className="flex items-center gap-3">
            <SingleSelect
              data={appStore.myCurrencies}
              value={currencyCode}
              onChange={(value) => {
                cashFlowStore.setCurrencyCode(value)
              }}
              isClearable={false}
              withSearch={false}
              className={'bg-white w-28'} wrapperClassName="w-28 shrink-0"
              dropdownClassName={'w-28'}
            />
            <FilterButton onClick={() => setIsFilterOpen(true)} count={filterCount} />
            <IconButton icon={Download} label={t('common.downloadExcel')} onClick={handleExportCashFlow} loading={isCashFlowLoading} />
            </div>
          </div>

          <TableCard className="mb-4 flex-none w-fit max-w-full self-start">
            <div className='flex flex-1 overflow-hidden'>
            <div className="overflow-x-auto">
              <table className="w-full  mb-10">
                <thead className="sticky top-0 z-50 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th
                      className="sticky left-0 z-40 bg-slate-50 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                      style={{ minWidth: 420 }}
                    >
                      <p className="w-full border-r border-slate-200 px-4 py-2.5">{t('cashflow.articleHeader')}</p>
                    </th>
                    {legend.map(col => (
                      <th key={col.key} className="min-w-[80px] max-w-[80px] border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase">
                        <span className="line-clamp-1">{col.title}</span>
                      </th>
                    ))}
                    <th className="min-w-[80px] max-w-[80px] shrink-0 border-l border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase">
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
            </TableCard>
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
