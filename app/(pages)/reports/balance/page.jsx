'use client'

import TableCard from '@/components/shared/Table/TableCard'
import FilterButton from '@/components/shared/Filters/FilterButton'
import { useBalanceFilterCount } from '@/hooks/useReportFilterCount'
import IconButton from '@/components/shared/Buttons/IconButton'
import BalanceFilterSidebar from '@/components/reports/balance/FilterSidebar'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, Download, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { balanceStore } from '../../../../components/reports/balance/balance.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import { BalanceStructureCard, ChoiceControl, ReportControl, cellTone } from '@/components/reports/shared/ReportParts'
import { apiClient } from '../../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../../lib/utils/notifications'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatTotalSumma, handleDownload } from '../../../../utils/helpers'

export default observer(function BalancePage() {
  const t = useTranslations('Reports')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filterCount = useBalanceFilterCount()
  const { dateRange, selectedEntity, selectedCurrency, selectedCounterparties, selectedAccount } = balanceStore

  const filterData = {
    as_of: dateRange ? moment(dateRange.end).format('YYYY-MM-DD') : '',
    account_ids: selectedAccount ? selectedAccount : [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
  }

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["balance_report", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "balance_report", data: filterData }),
    select: (res) => res?.data,
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
    staleTime: 0,
    cacheTime: 0
  })

  const { mutate: exportBalanceReport, isPending: isExportBalanceReportLoading } = useMutation({
    mutationKey: ['export_balance_report'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_balance_report', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'balance_report.xlsx')
      }
    }
  })

  useEffect(() => {
    if (!isInitialLoad || !data) return
    const hasData =
      (data.assets && data.assets.length > 0) ||
      (data.liabilities && data.liabilities.length > 0) ||
      (data.equity && data.equity.length > 0)

    if (!hasData) return

    const firstLevelIds = new Set()
    const addFirstLevel = (items) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          firstLevelIds.add(item.id)
          item.children.forEach(child => {
            if (child.children && child.children.length > 0) {
              firstLevelIds.add(child.id)
            }
          })
        }
      })
    }

    addFirstLevel(data.data || [])

    setExpandedRows(firstLevelIds)
    setIsInitialLoad(false)
  }, [data, isInitialLoad])

  // Разделы баланса (активы, пассивы) и их состав — для карточек над таблицей
  const sections = useMemo(() => (data?.data || []).map((item, index) => ({
    key: String(item.id ?? index),
    name: item.name,
    total: item.value || 0,
    parts: (item.children || item.details || []).map((child, childIndex) => ({
      key: String(child.id ?? childIndex),
      name: child.name,
      value: child.value || 0,
    })),
  })), [data])

  // Сходится ли баланс: активы против пассивов
  const difference = sections.length === 2 ? (Number(sections[0].total) || 0) - (Number(sections[1].total) || 0) : null
  const isBalanced = difference != null && Math.abs(difference) < 0.01

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const renderRow = (item, level = 0, parentExpanded = true) => {
    if (!parentExpanded) return null

    const children = item.children || item.details
    const hasChildren = children && children.length > 0
    const isExpanded = item.name === 'active' || item.name === 'passive' || expandedRows.has(item.id)
    const indent = level * 24
    const isTotalRow = level === 0
    const isActiveOrPassive = item?.id === 'active' || item?.id === 'passive'

    return (
      <React.Fragment key={item.id}>
        <tr className={`border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50 ${isTotalRow ? 'font-semibold' : ''}`}>
          <td
            className={`sticky left-0 z-1 min-w-[260px] w-[260px] px-2 py-2 text-xs text-slate-900 border-b border-r border-slate-200 whitespace-normal wrap-break-word ${isActiveOrPassive ? 'font-semibold text-sm' : ''}`}
            style={{ paddingLeft: `${indent + 16}px`, backgroundColor: isActiveOrPassive ? '#f5f8ff' : '#fff' }}
          >
            <div
              className={`flex  items-center gap-2 ${hasChildren ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
              onClick={() => hasChildren && toggleRow(item.id)}
            >
              {hasChildren && (
                <button className="bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center text-gray-ucode-500 rounded transition-colors duration-200 hover:bg-gray-100 [&_svg]:w-5 [&_svg]:h-5">
                  {isExpanded ? <ExpendClose color="#667085" /> : <ExpendOpen color="#667085" />}
                </button>
              )}
              <span className={isTotalRow ? 'font-semibold' : ''}>{item.name}</span>
            </div>
          </td>
          <td className={`px-4 py-2 text-xs text-slate-900 border-b border-slate-200 text-right tabular-nums whitespace-nowrap ${isTotalRow ? 'font-semibold' : ''} ${isActiveOrPassive ? 'bg-[#f5f8ff] text-sm' : ''} ${cellTone(item.value)}`}>
            <span className={isTotalRow ? 'text-xs font-semibold' : ''}>
              {(item.value === 0 || item.value == null)
                ? '–'
                : formatNumber(formatTotalSumma(item.value))}
            </span>
          </td>
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
      <div className={"w-full relative bg-canvas overflow-auto pb-10"}>
        {/* Шапка: заголовок и дата слева, фильтры и выгрузка справа */}
        <div className="flex px-6 h-16 items-center justify-between sticky top-0 z-20 bg-canvas">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className='text-xl whitespace-nowrap font-semibold'>{t('balance.title')}</h1>
            {dateRange?.end && (
              <span className="truncate text-sm text-slate-500">{moment(dateRange.end).format('DD.MM.YYYY')}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FilterButton onClick={() => setIsFilterOpen(true)} count={filterCount} />
            <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportBalanceReport} loading={isExportBalanceReportLoading} />
          </div>
        </div>

        <div className="px-6">
          {/* Валюта и проверка формулы баланса */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <ReportControl label={t('common.currency')}>
              <ChoiceControl
                ariaLabel={t('common.currency')}
                options={appStore.myCurrencies}
                value={balanceStore.selectedCurrency}
                onChange={(value) => {
                  balanceStore.setSelectedCurrency(value)
                  balanceStore.fetchBalance()
                }}
                selectWidth="w-28"
              />
            </ReportControl>
            <div
              className={
                'flex items-center gap-2 rounded-full px-3 py-1 text-sm ' +
                (difference == null ? 'bg-slate-100 text-slate-600' : isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')
              }
            >
              {difference != null && (isBalanced ? <CheckCircle2 size={15} aria-hidden="true" /> : <TriangleAlert size={15} aria-hidden="true" />)}
              <span>{t('balance.formula')}</span>
              {difference != null && (
                <span className="font-medium">
                  · {isBalanced ? t('balance.balanced') : `${t('balance.difference')}: ${formatNumber(formatTotalSumma(difference))}`}
                </span>
              )}
            </div>
          </div>

          {/* Структура активов и пассивов */}
          {sections.length > 0 && (
            <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-3">
              {sections.map((section, index) => (
                <BalanceStructureCard
                  key={section.key}
                  title={section.name}
                  total={section.total}
                  parts={section.parts}
                  currency={balanceStore.selectedCurrency}
                  accent={index === 0 ? '#0e73f6' : '#475569'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Table with loading overlay */}
        <div className='px-6 pb-4'>
          <TableCard className="flex-none w-fit max-w-full self-start">
          {/* Spinner overlay on filter change (data already present) */}

          {error && !isLoading && !isFetching ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 bg-white rounded-lg [&>p]:text-base [&>p]:text-red-600 [&>p]:m-0 [&>p]:text-center">
              <p>{t('balance.errorLoading')} {error.message}</p>
              <button onClick={() => balanceStore.fetchBalance()} className="px-4 py-2 bg-[#0E73F6] text-white border-0 rounded-md cursor-pointer text-sm transition-colors hover:bg-[#0d5fd6]">
                {t('balance.retry')}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-16 z-10">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 min-w-[260px] w-[260px]">{t('balance.accountHeader')}</th>
                  <th className="text-right px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 min-w-[180px]">{t('common.total')}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.data?.map(row => renderRow(row))}
                {/* {data?.liabilities?.map(row => renderRow(row))}
                  {data?.equity?.map(row => renderRow(row))} */}
              </tbody>
            </table>
          )}
          </TableCard>
        </div>
      </div>
    </div>
  )
})
