"use client"

import TableCard from '@/components/shared/Table/TableCard'
import FilterButton from '@/components/shared/Filters/FilterButton'
import { usePnLFilterCount } from '@/hooks/useReportFilterCount'
import IconButton from '@/components/shared/Buttons/IconButton'
import OperationCashFlowModal from '@/components/directories/OperationCashFlowModal'
import PnLFilterSidebar from '@/components/reports/profit-and-loss/FilterSidebar'
import { ChoiceControl, ReportControl, ReportSummaryStrip, cellTone } from '@/components/reports/shared/ReportParts'
import { cn } from '@/lib/utils'
import '@/styles/report-filters.css'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, FileBarChart } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { pnlStore } from '../../../../components/reports/profit-and-loss/pnl.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import { ExpendClose, ExpendOpen } from '../../../../constants/icons'
import { apiClient } from '../../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../../lib/utils/notifications'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatPeriod, handleDownload } from '../../../../utils/helpers'

const formatDateLocal = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ProfitAndLossPage = observer(() => {
  const t = useTranslations('Reports')
  const accountingMethodOptions = useMemo(() => [
    { value: 'accrual', label: t('pnl.accounting.accrual') },
    { value: 'cash', label: t('pnl.accounting.cash') }
  ], [t])
  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('pnl.grouping.daily') },
    { value: 'weekly', label: t('pnl.grouping.weekly') },
    { value: 'monthly', label: t('pnl.grouping.monthly') }
  ], [t])

  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterCount = usePnLFilterCount()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    dateRange: null
  })

  const { dateRange, selectedGrouping,
    selectedCurrency,
    ebitda,
    deals,
    ebit,
    selectedAccounts,
    selectedCounterparties,
    selectedLegalEntities,
    selectedProjects,
    ebt, isCalculation }
    = pnlStore


  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: selectedCurrency,
    accounting_method: isCalculation,
    my_accounts_ids: selectedAccounts,
    counterparties_ids: selectedCounterparties,
    legal_entity_ids: selectedLegalEntities,
    project_ids: selectedProjects,
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
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
  })

  const { mutate: exportProfitAndLoss, isPending: isProfitAndLossLoading } = useMutation({
    mutationKey: ['export_profit_and_loss'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_profit_and_loss', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      console.log('uploadData', uploadData)
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'profit_and_loss.xlsx')
      }
    }
  })

  const loading = isLoadingProfitAndLoss || isFetchingProfitAndLoss
  const legend = useMemo(() => profitAndLossDataList?.legend || [], [profitAndLossDataList])


  const rows = useMemo(() => {
    const list = profitAndLossDataList?.rows || []

    // Har bir node ning O'ZINI + barcha descendant id larini yig'adi
    // (parent + child + nabira hammasi)
    const collectAllIds = (node) => {
      const ownId =
        node?.id && String(node.id).match(/\d+/) ? [node.id] : []

      const hasChildren = node?.details && node.details.length > 0
      if (!hasChildren) {
        return ownId
      }

      const childIds = node.details.flatMap(child => collectAllIds(child))
      return [...ownId, ...childIds]
    }

    // tip har doim root (top-level) item asosida hisoblanadi
    const getTip = (rootItem) => {
      const income =
        rootItem?.name === "income" ||
        rootItem?.id === "income" ||
        rootItem?.type === "income"
      const expenses =
        rootItem?.name === "expenses" ||
        rootItem?.id === "expenses" ||
        rootItem?.type === "expenses"

      let tips
      if (expenses) {
        tips = ["Выплата", "Кредит", "Начисление"]
      } else if (income) {
        tips = ["Поступление", "Кредит", "Начисление"]
      } else {
        tips = ["Выплата", "Поступление", "Дебет", "Кредит", "Начисление"]
      }

      // Метод начисления: доходы → Отгрузка, расходы → Поставка
      if (isCalculation === 'accrual') {
        if (income) tips.push("Отгрузка")
        else if (expenses) tips.push("Поставка")
        else tips.push("Отгрузка", "Поставка")
      }
      return tips
    }

    // Har bir node va uning details ichidagi childlarga filterdata qo'shadi
    const enrichNode = (node, rootItem) => {
      const enriched = {
        ...node,
        filterdata: {
          // o'zi + descendant lar, duplikatlarsiz
          ids: [...new Set(collectAllIds(node))],
          tip: getTip(rootItem),
        },
      }

      if (node.details && node.details.length > 0) {
        enriched.details = node.details.map(child => enrichNode(child, rootItem))
      }

      return enriched
    }

    // Top-level: details bo'lmaganlar oldingi (details bor) sibling lardan ids ni meros oladi
    const accumulatedIds = []

    return list.map((item) => {
      const hasChildren = item.details && item.details.length > 0

      if (hasChildren) {
        const enriched = enrichNode(item, item)
        accumulatedIds.push(...enriched.filterdata.ids)
        return enriched
      }

      // details yo'q top-level item — accumulated idlarni oladi
      return {
        ...item,
        filterdata: {
          ids: [...new Set(accumulatedIds)],
          tip: getTip(item),
        },
      }
    })
  }, [profitAndLossDataList, isCalculation])


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

  // Карточки главных строк: итог за период и столбики по периодам
  const summaryItems = useMemo(() => (rows || []).map(item => ({
    key: String(item.id),
    name: item.name,
    total: item.totalValue || 0,
    values: legend.map(period => item.values?.[period.key] || 0),
    percent: item.type === 'percent',
    emphasis: item.type === 'result' || item.type === 'total',
  })), [rows, legend])

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const renderRow = (item, parentExpanded = true, depth = 0) => {
    if (!parentExpanded) return null

    const hasChildren = item.details && item.details.length > 0
    const isExpanded = expandedRows.has(item.id)

    const isPercentRow = item.type === 'percent'
    const isResultRow = item.type === 'result'
    const isTotalRow = item.type === 'total'

    const paddingLeft = `${depth * 1 + 1}rem`

    return (
      <React.Fragment key={item.id}>
        <tr
          className={`border-b box-content border-slate-200 transition-colors ${isResultRow || isTotalRow
            ? 'bg-[#f5f8ff] font-semibold'
            : depth === 0
              ? 'bg-slate-50 font-semibold'
              : 'hover:bg-slate-50'
            }`}
        >
          {/* Name cell — sticky left */}
          <td
            className={`sticky left-0 z-10 p-0! box-border transition-shadow duration-300 ${isResultRow || isTotalRow ? 'bg-[#f5f8ff]' : depth === 0 ? 'bg-slate-50' : 'bg-white'
              } hover:bg-slate-100 transition-colors`}
          >
            <div
              className={`flex items-center cursor-pointer! w-full border-r px-4 py-2 text-xss! gap-2 ${hasChildren ? '' : 'cursor-default'
                }`}
              style={{ paddingLeft }}
              onClick={() => hasChildren && toggleRow(item.id)}
            >
              {hasChildren && (
                <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors w-4 h-4">
                  {isExpanded ? <ExpendClose /> : <ExpendOpen />}
                </button>
              )}
              <span
                className={cn(
                  'cursor-pointer!',
                  depth === 0 || isResultRow || isTotalRow
                    ? 'font-semibold'
                    : 'text-sm'
                )}
              >
                {item.name}
              </span>
            </div>
          </td>

          {/* Period value cells */}
          {legend.map(period => {
            const value = item.values?.[period.key] || 0
            const displayValue =
              value === 0
                ? ''
                : isPercentRow
                  ? `${formatNumber(value)}%`
                  : `${formatNumber(value)}`
            return (
              <td
                key={period.key}
                className={`px-2 text-xs text-end tabular-nums border-r min-w-[150px] max-w-[150px] ${cellTone(value)} ${isPercentRow ? 'cursor-default' : 'cursor-pointer'
                  }`}
              >
                <span
                  className={`${isPercentRow ? 'cursor-default!' : 'cursor-pointer! hover:text-primary'
                    } ${depth === 0 || isResultRow || isTotalRow ? 'font-semibold' : ''
                    } transition-colors`}
                  onClick={
                    isPercentRow
                      ? undefined
                      : () => handleCellClick(item, { key: period.key, label: period.title })
                  }
                >
                  <span className="line-clamp-1 text-end w-full">{displayValue}</span>
                </span>
              </td>
            )
          })}

          {/* Total cell */}
          <td
            className={`px-2 text-right tabular-nums border-l min-w-[150px] max-w-[150px] ${cellTone(item.totalValue)} ${isPercentRow ? 'cursor-default' : 'cursor-pointer'
              }`}
          >
            <span
              className={`text-xs line-clamp-1 ${isPercentRow
                ? 'cursor-default!'
                : 'cursor-pointer! hover:underline hover:text-primary'
                } ${depth === 0 || isResultRow || isTotalRow ? 'font-semibold' : 'text-xs'
                } transition-colors`}
              onClick={isPercentRow ? undefined : () => handleCellClick(item, null)}
            >
              {item.totalValue === 0
                ? ''
                : isPercentRow
                  ? `${formatNumber(item.totalValue)}%`
                  : formatNumber(item.totalValue)}
            </span>
          </td>
        </tr>

        {hasChildren &&
          isExpanded &&
          item.details.map(child => renderRow(child, true, depth + 1))}
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

    const filterData = {
      tip: item.filterdata?.tip,
      limit: 50,
      chart_of_accounts_ids: item.filterdata?.ids,
      currencyCode: selectedCurrency
    }

    if (isCalculation === 'cash') {
      filterData.paymentConfirm = true
      filterData.paymentNotConfirm = false
      filterData.accuralConfirm = true
      filterData.accuralNotConfirm = true
      filterData.paymentDateStart = dateRange.start
      filterData.paymentDateEnd = dateRange.end

    }

    if (isCalculation === 'accrual') {
      filterData.paymentConfirm = true
      filterData.paymentNotConfirm = true
      filterData.accuralConfirm = true
      filterData.accuralNotConfirm = false
      filterData.accrualDateStart = dateRange.start
      filterData.accrualDateEnd = dateRange.end
    }

    const periodLabel = formatPeriod(dateRange.start, dateRange.end)

    setModalConfig({
      filterData,
      dateRange,
      summaryData: {
        periodLabel,
        totalAmount: item.totalValue,
        currencyCode: selectedCurrency
      },
      title: item.name
    })
    setIsModalOpen(true)
  }


  return (
    <div className="fixed left-[var(--sidebar-w)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] flex top-[60px] h-[calc(100%-60px)]">
      {/* P&L-specific Filter Sidebar */}
      <PnLFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {loading && <ScreenLoader />}

      {/* Main Content */}
      <div className={"w-full bg-canvas overflow-auto px-6"}>
        <div className='h-full flex flex-col'>
          {/* Шапка: заголовок и период слева, фильтры и выгрузка справа */}
          <div className="flex h-16 items-center justify-between sticky z-50 top-0 bg-canvas shrink-0">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className='text-xl whitespace-nowrap font-semibold'>{t('pnl.title')}</h1>
              {legend.length > 0 && (
                <span className="truncate text-sm text-slate-500">
                  {legend[0]?.title}{legend.length > 1 ? ` – ${legend[legend.length - 1]?.title}` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FilterButton onClick={() => setIsFilterOpen(true)} count={filterCount} />
              <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportProfitAndLoss} loading={isProfitAndLossLoading} />
            </div>
          </div>

          {/* Параметры отчёта — видимыми переключателями */}
          <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <ReportControl label={t('common.currency')}>
              <ChoiceControl
                ariaLabel={t('common.currency')}
                options={appStore.myCurrencies}
                value={pnlStore.selectedCurrency}
                onChange={(value) => pnlStore.setSelectedCurrency(value)}
                selectWidth="w-28"
              />
            </ReportControl>
            <ReportControl label={t('common.buildingMethod')}>
              <ChoiceControl
                ariaLabel={t('common.buildingMethod')}
                options={groupingOptions}
                value={pnlStore.selectedGrouping}
                onChange={(value) => pnlStore.setSelectedGrouping(value)}
              />
            </ReportControl>
            <ReportControl label={t('common.accountingMethod')}>
              <ChoiceControl
                ariaLabel={t('common.accountingMethod')}
                options={accountingMethodOptions}
                value={pnlStore.isCalculation}
                onChange={(value) => pnlStore.setIsCalculation(value)}
              />
            </ReportControl>
          </div>

          <ReportSummaryStrip
            items={summaryItems}
            currency={selectedCurrency}
            firstLabel={legend[0]?.title}
            lastLabel={legend.length > 1 ? legend[legend.length - 1]?.title : null}
          />

          {!profitAndLossDataList && !loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-20 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileBarChart size={22} aria-hidden="true" />
              </span>
              <p className="text-base text-slate-600">{t('pnl.emptyPeriod')}</p>
              <p className="text-sm text-slate-400">{t('pnl.emptyHint')}</p>
            </div>
          ) : (
            <TableCard className="mb-4 flex-none w-fit max-w-full self-start">
            <div className='flex flex-1 overflow-hidden'>
              <div className='overflow-x-auto' >
                <table className="w-full  mb-10">
                  <thead className={"bg-slate-50 sticky top-0 z-50 "}>
                    <tr>
                      <th
                        className="text-left text-xs font-medium sticky left-0 z-40 bg-slate-50"
                        style={{ minWidth: 420 }}
                      >
                        <p className='px-4 w-full border-r py-2'>{t('pnl.article')}</p>
                      </th>
                      {legend.map(period => (
                        <th key={period.key} className="text-right bg-slate-50 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] text-xs text-xss! font-medium">
                          <span className='line-clamp-1 border-l px-4 py-2'>{period.title}</span>
                        </th>
                      ))}
                      <th className="text-right bg-slate-50 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium">
                        {t('common.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows?.map(row => renderRow(row))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  )
})

export default ProfitAndLossPage


