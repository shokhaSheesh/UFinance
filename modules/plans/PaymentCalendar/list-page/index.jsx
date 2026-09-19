'use client'

import FilterButton from '@/components/shared/Filters/FilterButton'
import ScreenLoader from '@/components/shared/ScreenLoader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { formatNumber, formatPeriod, handleDownload } from '@/utils/helpers'
import { useMutation, useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import PaymentCalendarFilterSidebar from './components/FilterSidebar'
import { paymentCalendarStore } from '../store'

const formatDateLocal = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const PaymentCalendar = observer(() => {
  const t = useTranslations('Reports')
  const tc = useTranslations('Common')

  const accountingMethodOptions = useMemo(() => [
    { value: 'accrual', label: t('pnl.accounting.accrual') },
    { value: 'cash', label: t('pnl.accounting.cash') },
  ], [t])

  const groupingOptions = useMemo(() => [
    { value: 'daily', label: t('pnl.grouping.daily') },
    { value: 'weekly', label: t('pnl.grouping.weekly') },
    { value: 'monthly', label: t('pnl.grouping.monthly') },
  ], [t])

  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    filterData: null,
    summaryData: null,
    title: '',
    dateRange: null,
  })

  const {
    dateRange,
    selectedGrouping,
    selectedCurrency,
    ebitda,
    ebit,
    selectedAccounts,
    selectedCounterparties,
    selectedLegalEntities,
    ebt,
    isCalculation,
  } = paymentCalendarStore

  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: GlobalCurrency?.code,
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

  const { data: profitAndLossDataList, isLoading: isLoadingProfitAndLoss, isFetching: isFetchingProfitAndLoss } = useQuery({
    queryKey: ['payment_calendar_profit_and_loss', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const { mutate: exportProfitAndLoss, isPending: isProfitAndLossLoading } = useMutation({
    mutationKey: ['payment_calendar_export_profit_and_loss'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_profit_and_loss', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'payment_calendar.xlsx')
      }
    },
  })

  const loading = isLoadingProfitAndLoss || isFetchingProfitAndLoss
  const legend = useMemo(() => profitAndLossDataList?.legend || [], [profitAndLossDataList])

  const rows = useMemo(() => {
    const list = profitAndLossDataList?.rows || []

    const collectAllIds = (node) => {
      const ownId = node?.id && String(node.id).match(/\d+/) ? [node.id] : []
      const hasChildren = node?.details && node.details.length > 0
      if (!hasChildren) return ownId
      const childIds = node.details.flatMap(child => collectAllIds(child))
      return [...ownId, ...childIds]
    }

    const getTip = (rootItem) => {
      let tips = []
      const income =
        rootItem?.name === 'income' ||
        rootItem?.id === 'income' ||
        rootItem?.type === 'income'
      const expenses =
        rootItem?.name === 'expenses' ||
        rootItem?.id === 'expenses' ||
        rootItem?.type === 'expenses'

      if (isCalculation === 'accrual') {
        tips.push('Отгрузка')
      }
      if (expenses) {
        tips = ['Выплата', 'Кредит', 'Дебет', 'Начисление']
      }
      if (income) {
        tips = [...tips, 'Поступление', 'Кредит', 'Дебет', 'Начисление']
      }
      if (!income && !expenses) {
        tips = [...tips, 'Выплата', 'Поступление', 'Дебет', 'Кредит', 'Начисление']
      }
      return tips
    }

    const enrichNode = (node, rootItem) => {
      const enriched = {
        ...node,
        filterdata: {
          ids: [...new Set(collectAllIds(node))],
          tip: getTip(rootItem),
        },
      }

      if (node.details && node.details.length > 0) {
        enriched.details = node.details.map(child => enrichNode(child, rootItem))
      }

      return enriched
    }

    const accumulatedIds = []

    return list.map((item) => {
      const hasChildren = item.details && item.details.length > 0

      if (hasChildren) {
        const enriched = enrichNode(item, item)
        accumulatedIds.push(...enriched.filterdata.ids)
        return enriched
      }

      return {
        ...item,
        filterdata: {
          ids: [...new Set(accumulatedIds)],
          tip: getTip(item),
        },
      }
    })
  }, [profitAndLossDataList, isCalculation])

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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCellClick = (item, monthObj) => {
    let range = {
      start: formatDateLocal(paymentCalendarStore.dateRange.start),
      end: formatDateLocal(paymentCalendarStore.dateRange.end),
    }

    if (monthObj?.key) {
      const [year, month] = monthObj.key.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      range = { start: startDate, end: endDate }
    }

    const cellFilter = {
      tip: item.filterdata?.tip,
      limit: 50,
      chart_of_accounts_ids: item.filterdata?.ids,
      currencyCode: selectedCurrency,
    }

    if (isCalculation === 'cash') {
      cellFilter.paymentConfirm = true
      cellFilter.paymentNotConfirm = false
      cellFilter.accuralConfirm = true
      cellFilter.accuralNotConfirm = true
      cellFilter.paymentDateStart = range.start
      cellFilter.paymentDateEnd = range.end
    }

    if (isCalculation === 'accrual') {
      cellFilter.paymentConfirm = true
      cellFilter.paymentNotConfirm = true
      cellFilter.accuralConfirm = true
      cellFilter.accuralNotConfirm = false
      cellFilter.accrualDateStart = range.start
      cellFilter.accrualDateEnd = range.end
    }

    const periodLabel = formatPeriod(range.start, range.end)

    setModalConfig({
      filterData: cellFilter,
      dateRange: range,
      summaryData: {
        periodLabel,
        totalAmount: item.totalValue,
        currencyCode: selectedCurrency,
      },
      title: item.name,
    })
    setIsModalOpen(true)
  }

  const renderRow = (item, parentExpanded = true, depth = 0) => {
    if (!parentExpanded) return null

    const hasChildren = item.details && item.details.length > 0
    const isExpanded = expandedRows.has(item.id)

    const isPercentRow = item.type === 'percent'
    const isResultRow = item.type === 'result'
    const isTotalRow = item.type === 'total'
    const isHeaderRow = depth === 0 || isResultRow || isTotalRow

    const paddingLeft = `${depth * 1 + 1}rem`

    return (
      <React.Fragment key={item.id}>
        <tr
          className={cn(
            'border-b box-content border-neutral-200 transition-colors',
            isHeaderRow ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50/60',
          )}
        >
          <td
            className={cn(
              'sticky left-0 z-10 p-0! box-border transition-shadow duration-300',
              isHeaderRow ? 'bg-slate-50' : 'bg-white',
              'hover:bg-neutral-100 transition-colors',
            )}
          >
            <div
              className={cn(
                'flex items-center w-full border-r px-4 py-2 text-xss! gap-2',
                hasChildren ? 'cursor-pointer!' : 'cursor-default',
              )}
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
                  isHeaderRow ? 'font-semibold' : 'text-sm',
                )}
              >
                {item.name}
              </span>
            </div>
          </td>

          {legend.map((period, idx) => {
            const value = item.values?.[period.key] || 0
            const displayValue =
              value === 0
                ? '–'
                : isPercentRow
                  ? `${formatNumber(value)}%`
                  : `${formatNumber(value)}`
            const altCol = idx % 2 === 0
            return (
              <td
                key={period.key}
                className={cn(
                  'px-2 text-xs text-end border-r min-w-[150px] max-w-[150px]',
                  altCol ? 'bg-blue-50/30' : '',
                  isHeaderRow ? (altCol ? 'bg-blue-100/40' : 'bg-slate-50') : '',
                  isPercentRow ? 'cursor-default' : 'cursor-pointer',
                )}
              >
                <span
                  className={cn(
                    isPercentRow ? 'cursor-default!' : 'cursor-pointer! hover:text-primary',
                    isHeaderRow ? 'font-semibold' : '',
                    'transition-colors',
                  )}
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

          <td
            className={cn(
              'px-2 text-right border-l min-w-[150px] max-w-[150px]',
              isHeaderRow ? 'bg-slate-50' : '',
              isPercentRow ? 'cursor-default' : 'cursor-pointer',
            )}
          >
            <span
              className={cn(
                'text-xs line-clamp-1',
                isPercentRow
                  ? 'cursor-default!'
                  : 'cursor-pointer! hover:underline hover:text-primary',
                isHeaderRow ? 'font-semibold' : 'text-xs',
                'transition-colors',
              )}
              onClick={isPercentRow ? undefined : () => handleCellClick(item, null)}
            >
              {item.totalValue === 0
                ? '–'
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

  return (
    <div className="flex h-full w-full">
      <PaymentCalendarFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {loading && <ScreenLoader />}

      <div className={'w-full bg-white overflow-auto px-4'}>
        <div className="h-full flex flex-col">
          <div className="flex h-16 items-center sticky z-50 top-0 bg-white justify-between shrink-0">
            <div className="flex items-center gap-4">
              <h1 className='text-xl whitespace-nowrap font-semibold'>{t('paymentCalendar.title')}</h1>
              <button
                type='button'
                onClick={() => paymentCalendarStore.resetToToday()}
                className="px-3 py-1.5 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50 transition-colors"
              >
                {tc('forToday')}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <SingleSelect
                data={groupingOptions}
                value={selectedGrouping}
                onChange={(value) => paymentCalendarStore.setSelectedGrouping(value)}
                isClearable={false}
                withSearch={false}
                placeholder={t('common.buildingMethod')}
                className="bg-white w-44"
              />
              <SingleSelect
                data={accountingMethodOptions}
                value={isCalculation}
                onChange={(value) => paymentCalendarStore.setIsCalculation(value)}
                isClearable={false}
                withSearch={false}
                placeholder={t('common.accountingMethod')}
                className="bg-white w-44"
                autoHeight={true}
              />
              <FilterButton onClick={() => setIsFilterOpen(true)} />
              {/* <button onClick={exportProfitAndLoss} type='button' className="primary-btn">
                {t('common.downloadExcel')} {isProfitAndLossLoading && <Loader2 size={16} className="animate-spin" />}
              </button> */}
            </div>
          </div>

          {!profitAndLossDataList && !loading ? (
            <div className="flex mx-auto flex-1 flex-col h-full justify-center items-center py-20 text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: '16px', opacity: 0.3 }}>
                <path d="M8 16C8 11.5817 11.5817 8 16 8H48C52.4183 8 56 11.5817 56 16V48C56 52.4183 52.4183 56 48 56H16C11.5817 56 8 52.4183 8 48V16Z" stroke="currentColor" strokeWidth="2" />
                <path d="M16 24H48M16 32H48M16 40H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: '16px', color: '#667085', marginBottom: '8px' }}>{t('pnl.emptyPeriod')}</p>
              <p style={{ fontSize: '14px', color: '#98A2B3' }}>{t('pnl.emptyHint')}</p>
            </div>
          ) : (
            <div className='flex flex-1 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className="w-full mb-10">
                  <thead className={'bg-neutral-100 sticky top-0 z-50'}>
                    <tr>
                      <th
                        className="text-left text-xs font-medium sticky left-0 z-40 bg-neutral-100"
                        style={{ minWidth: 420 }}
                      >
                        <p className='px-4 w-full border-r py-2'>Доходы и расходы, {GlobalCurrency?.name}</p>
                      </th>
                      {legend.map((period, idx) => (
                        <th
                          key={period.key}
                          className={cn(
                            'text-right border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] text-xs text-xss! font-medium',
                            idx % 2 === 0 ? 'bg-blue-100/40' : 'bg-neutral-100',
                          )}
                        >
                          <span className='line-clamp-1 border-l px-4 py-2'>{period.title}</span>
                        </th>
                      ))}
                      <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium">
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
          )}
        </div>
      </div>

      {/* <OperationCashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filterData={modalConfig.filterData}
        dateRange={modalConfig.dateRange}
        summaryData={modalConfig.summaryData}
        title={modalConfig.title}
      /> */}
    </div>
  )
})

export default PaymentCalendar
