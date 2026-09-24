'use client'

import TableCard from '@/components/shared/Table/TableCard'
import BalanceCharts from '@/components/reports/balance/BalanceCharts'
import FilterButton from '@/components/shared/Filters/FilterButton'
import Segmented from '@/components/shared/Segmented/Segmented'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { useBalanceFilterCount } from '@/hooks/useReportFilterCount'
import IconButton from '@/components/shared/Buttons/IconButton'
import BalanceFilterSidebar from '@/components/reports/balance/FilterSidebar'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { balanceStore } from '../../../../components/reports/balance/balance.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import SingleSelect from '../../../../components/shared/Selects/SingleSelect'
import { apiClient } from '../../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../../lib/utils/notifications'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatTotalSumma, handleDownload } from '../../../../utils/helpers'
import { buildColumns, buildPeriodPayload, collectInitialExpanded, mergePeriodRows } from '@/utils/balancePeriods'

export default observer(function BalancePage() {
  const t = useTranslations('Reports')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  // Два вида одного отчёта: привычная таблица и разбор диаграммами
  const [view, setView] = useState('table')

  const filterCount = useBalanceFilterCount()
  const { dateRange, selectedEntity, selectedCurrency, selectedCounterparties, selectedAccount, periodType } = balanceStore

  const periodOptions = useMemo(() => [
    { value: 'daily', label: t('balance.grouping.daily') },
    { value: 'monthly', label: t('balance.grouping.monthly') },
    { value: 'quarterly', label: t('balance.grouping.quarterly') },
    { value: 'yearly', label: t('balance.grouping.yearly') },
    { value: 'total', label: t('balance.grouping.total') },
  ], [t])

  const baseFilterData = {
    account_ids: selectedAccount ? selectedAccount : [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
  }

  // Колонки строятся по разбивке: день / месяц / квартал / год или один срез
  // на конец периода. Даты для среза собирает buildPeriodPayload.
  const filterData = {
    ...baseFilterData,
    ...buildPeriodPayload(dateRange, periodType),
  }

  // Выгрузка по-прежнему одной датой — на конец периода
  const exportFilterData = {
    ...baseFilterData,
    as_of: dateRange?.end ? moment(dateRange.end).format('YYYY-MM-DD') : '',
  }

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["balance_report", "multi", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "balance_report_multi", data: filterData }),
    // ответ приходит как { data: { periods, ... } }, но поддерживаем и вложенный вариант
    select: (res) => (res?.data?.periods ? res.data : res?.data?.data ?? res?.data),
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
    staleTime: 0,
    cacheTime: 0
  })

  const { mutate: exportBalanceReport, isPending: isExportBalanceReportLoading } = useMutation({
    mutationKey: ['export_balance_report'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_balance_report', data: exportFilterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'balance_report.xlsx')
      }
    }
  })

  const periods = useMemo(() => data?.periods || [], [data])
  const columns = useMemo(() => {
    const built = buildColumns(periods)
    // один срез «на конец периода» подписываем «Итого», а не датой
    return periodType === 'total' && built.length === 1
      ? [{ ...built[0], title: t('common.total') }]
      : built
  }, [periods, periodType, t])
  const rows = useMemo(() => mergePeriodRows(periods), [periods])

  useEffect(() => {
    if (!isInitialLoad || rows.length === 0) return
    setExpandedRows(collectInitialExpanded(rows))
    setIsInitialLoad(false)
  }, [rows, isInitialLoad])

  const toggleRow = (key) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const renderRow = (item, level = 0, parentExpanded = true) => {
    if (!parentExpanded) return null

    const children = item.children || item.details
    const hasChildren = children && children.length > 0
    const isExpanded = item.name === 'active' || item.name === 'passive' || expandedRows.has(item.uniquePath ?? item.id)
    const indent = level * 24
    const isTotalRow = level === 0
    const isActiveOrPassive = item?.id === 'active' || item?.id === 'passive'

    return (
      <React.Fragment key={item.uniquePath ?? item.id}>
        <tr className={`border-b  border-gray-100 transition-colors duration-200 hover:bg-[#f0f4f8] ${isTotalRow ? 'font-semibold' : ''} `}>
          <td
            className={`sticky left-0 z-10 min-w-[260px] w-[260px] px-2 py-1.5 text-[11px] text-slate-900 border-b border-r border-gray-200 whitespace-normal wrap-break-word  ${isActiveOrPassive && 'bg-primary! text-white!'}`}
            style={{ paddingLeft: `${indent + 16}px`, backgroundColor: isActiveOrPassive ? '#007bff' : '#fff' }}
          >
            <div
              className={`flex  items-center gap-2 ${hasChildren ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
              onClick={() => hasChildren && toggleRow(item.uniquePath ?? item.id)}
            >
              {hasChildren && (
                <button className="bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center text-gray-ucode-500 rounded transition-colors duration-200 hover:bg-gray-100 [&_svg]:w-5 [&_svg]:h-5">
                  {isExpanded ? <ExpendClose color={isActiveOrPassive ? '#fff' : '#667085'} /> : <ExpendOpen color={isActiveOrPassive ? '#fff' : '#667085'} />}
                </button>
              )}
              <span className={isTotalRow ? 'font-semibold' : ''}>{item.name}</span>
            </div>
          </td>
          {columns.map((column) => {
            const value = item.values?.[column.key]
            return (
              <td
                key={column.key}
                className={`px-2 py-1.5 min-w-[120px] text-xs text-slate-900 border-b border-gray-200 text-right font-semibold whitespace-nowrap tabular-nums ${isActiveOrPassive && 'bg-primary! text-white!'}`}
              >
                <span className={isTotalRow ? 'text-xs font-semibold' : ''}>
                  {(value === 0 || value == null) ? '–' : formatNumber(formatTotalSumma(value))}
                </span>
              </td>
            )
          })}
        </tr>
        {hasChildren && isExpanded && children.map(child => renderRow(child, level + 1, true))}
      </React.Fragment>
    )
  }

  return (
    <div className="fixed left-[var(--sidebar-w)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] flex top-[60px] h-[calc(100%-60px)]">
      {/* Balance-specific Filter Sidebar */}
      <BalanceFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {(isLoading || isFetching) && <ScreenLoader />}
      {/* Main Content */}
      <div className={"flex w-full min-w-0 flex-col bg-canvas"}>
        <div className="flex shrink-0 px-6 h-16 items-center justify-between bg-canvas">
          <h1 className='text-xl whitespace-nowrap font-semibold'>{t('balance.title')}</h1>
            <div className="flex items-center gap-3">
          <SingleSelect
            data={appStore.myCurrencies}
            value={balanceStore.selectedCurrency}
            onChange={(value) => {
              balanceStore.setSelectedCurrency(value)
              balanceStore.fetchBalance()
            }}
            isClearable={false}
            withSearch={false}
            className={'bg-white w-28'} wrapperClassName="w-28 shrink-0"
            dropdownClassName={'w-28'}
          />
          <SingleSelect
            data={periodOptions}
            value={periodType}
            onChange={(value) => balanceStore.setPeriodType(value)}
            placeholder={t('balance.display')}
            isClearable={false}
            withSearch={false}
            className={'bg-white w-44'} wrapperClassName="w-44 shrink-0"
            dropdownClassName={'w-44'}
          />
          <Segmented
            ariaLabel={t('balance.charts.view.table')}
            value={view}
            onChange={setView}
            options={[
              { value: 'table', label: t('balance.charts.view.table'), icon: Rows3 },
              { value: 'charts', label: t('balance.charts.view.charts'), icon: LayoutGrid },
            ]}
          />
          <FilterButton onClick={() => setIsFilterOpen(true)} count={filterCount} />
          <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportBalanceReport} loading={isExportBalanceReportLoading} />
            </div>
        </div>

        {/* В виде диаграмм формула показана карточкой «Равенство баланса» */}
        {view === 'table' && (
          <div className="px-6 shrink-0 text-center mb-4 text-sm font-medium ">
            {t('balance.formula')}
          </div>
        )}

        {/* Таблица — единственная область прокрутки: колонки периодов уходят
            вправо, а колонка статей и шапка остаются на месте. Раньше карточка
            обрезала лишние колонки, и прокрутить вбок было нельзя. */}
        {view === 'charts' ? (
          <div className='min-h-0 flex-1 overflow-auto px-6 pb-6'>
            <BalanceCharts periods={periods} currency={selectedCurrency} />
          </div>
        ) : (
        <div className='flex min-h-0 flex-1 px-6 pb-6'>
          <TableCard className="min-h-0 flex-1 overflow-auto">
          {/* Spinner overlay on filter change (data already present) */}

          {error && !isLoading && !isFetching ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 bg-white rounded-lg [&>p]:text-base [&>p]:text-red-600 [&>p]:m-0 [&>p]:text-center">
              <p>{t('balance.errorLoading')} {error.message}</p>
              <button onClick={() => balanceStore.fetchBalance()} className="px-4 py-2 bg-[#0E73F6] text-white border-0 rounded-md cursor-pointer text-sm transition-colors hover:bg-[#0d5fd6]">
                {t('balance.retry')}
              </button>
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-slate-50 sticky top-0 z-30">
                <tr>
                  <th className="text-left px-4 py-2 text-[11px] font-medium sticky left-0 z-20 bg-slate-50 min-w-[260px] w-[260px]">{t('balance.accountHeader')}</th>
                  {columns.map((column) => (
                    <th key={column.key} className="text-right px-4 py-2 text-xs font-medium whitespace-nowrap min-w-[120px]">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.map(row => renderRow(row))}
                {/* {data?.liabilities?.map(row => renderRow(row))}
                  {data?.equity?.map(row => renderRow(row))} */}
              </tbody>
            </table>
          )}
          </TableCard>
        </div>
        )}
      </div>
    </div>
  )
})
