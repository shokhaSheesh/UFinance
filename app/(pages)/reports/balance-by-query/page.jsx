'use client'

import FilterButton from '@/components/shared/Filters/FilterButton'
import IconButton from '@/components/shared/Buttons/IconButton'
import BalanceFilterSidebar from '@/components/reports/balance/FilterSidebar'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { balanceStore } from '../../../../components/reports/balance/balance.store'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import SingleSelect from '../../../../components/shared/Selects/SingleSelect'
import { apiClient } from '../../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../../lib/utils/notifications'
import { appStore } from '../../../../store/app.store'
import { formatNumber, formatTotalSumma, handleDownload } from '../../../../utils/helpers'

export default observer(function BalanceByQueryPage() {
  const t = useTranslations('Reports')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { dateRange, selectedEntity, selectedCurrency, selectedCounterparties, selectedAccount } = balanceStore

  const filterData = {
    as_of: dateRange ? moment(dateRange.end).format('YYYY-MM-DD') : '',
    account_ids: selectedAccount ? selectedAccount : [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
  }

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["balance_report_by_query", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "balance_report_by_query", data: filterData }),
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
        <tr className={`border-b  border-gray-100 transition-colors duration-200 hover:bg-[#f0f4f8] ${isTotalRow ? 'font-semibold' : ''} `}>
          <td
            className={`sticky left-0  z-1 min-w-[250px] px-2 py-1.5 text-xs text-slate-900 border-b border-r border-gray-200 whitespace-normal wrap-break-word  ${isActiveOrPassive && 'bg-primary! text-white!'}`}
            style={{ paddingLeft: `${indent + 16}px`, backgroundColor: isActiveOrPassive ? '#007bff' : '#fff' }}
          >
            <div
              className={`flex  items-center gap-2 ${hasChildren ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
              onClick={() => hasChildren && toggleRow(item.id)}
            >
              {hasChildren && (
                <button className="bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center text-gray-ucode-500 rounded transition-colors duration-200 hover:bg-gray-100 [&_svg]:w-5 [&_svg]:h-5">
                  {isExpanded ? <ExpendClose color={isActiveOrPassive ? '#fff' : '#667085'} /> : <ExpendOpen color={isActiveOrPassive ? '#fff' : '#667085'} />}
                </button>
              )}
              <span className={isTotalRow ? 'font-semibold' : ''}>{item.name}</span>
            </div>
          </td>
          <td className={`px-2 py-1.5  text-xs text-slate-900 border-b border-gray-200 text-right font-semibold whitespace-nowrap ${isActiveOrPassive && 'bg-primary! text-white!'}`}>
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
    <div className="fixed left-[80px] w-[calc(100%-80px)] flex top-[60px] h-[calc(100%-60px)]">
      {/* Balance-specific Filter Sidebar */}
      <BalanceFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {(isLoading || isFetching) && <ScreenLoader />}
      {/* Main Content */}
      <div className={"w-full relative bg-white overflow-auto pb-10"}>
        <div className="flex px-4 h-16 items-center sticky top-0 z-20 bg-white justify-between">
          <div className="flex items-center gap-4">
            <h1 className='text-xl whitespace-nowrap font-semibold'>{t('balance.title')}</h1>
            <SingleSelect
              data={appStore.myCurrencies}
              value={balanceStore.selectedCurrency}
              onChange={(value) => {
                balanceStore.setSelectedCurrency(value)
                balanceStore.fetchBalance()
              }}
              isClearable={false}
              withSearch={false}
              className={'bg-white w-28'}
              dropdownClassName={'w-28'}
            />
            <FilterButton onClick={() => setIsFilterOpen(true)} />
          </div>
          <div>
            <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportBalanceReport} loading={isExportBalanceReportLoading} />
          </div>
        </div>

        <div className="px-4 text-center mb-4 text-sm font-medium ">
          {t('balance.formula')}
        </div>

        {/* Table with loading overlay */}
        <div className='px-4'>
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
              <thead className=" bg-neutral-100 sticky top-16 z-10">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium">{t('balance.accountHeader')}</th>
                  <th className="text-right px-4 py-2 text-xs font-medium">{t('common.total')}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.data?.map(row => renderRow(row))}
                {/* {data?.liabilities?.map(row => renderRow(row))}
                  {data?.equity?.map(row => renderRow(row))} */}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
})
