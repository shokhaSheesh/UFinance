'use client'

import { collectRows, findRow, PeriodChips, ReportTile, TOTAL_KEY, TreeRow, valueOf } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Движение денег на телефоне.
 *
 * Настольный отчёт — таблица со статьями слева и колонкой на каждый месяц.
 * На телефоне колонок нет: сверху выбирается один период, под ним четыре
 * итога за этот период, ниже — статьи этого же периода деревом, которое
 * раскрывается по нажатию. Переключение периода меняет всё разом, поэтому
 * цифры всегда относятся к одному и тому же отрезку времени.
 */

const MobileCashflowPage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const [periodKey, setPeriodKey] = useState(null)

  const { periodStartDate, periodEndDate, periodType, currencyCode, sellingDealId, contrAgentId, accountId, dealId, projectId } =
    cashFlowStore

  const filterData = {
    periodStartDate: periodStartDate ? moment(periodStartDate).format('YYYY-MM-DD') : null,
    periodEndDate: periodEndDate ? moment(periodEndDate).format('YYYY-MM-DD') : null,
    periodType,
    currencyCode,
    sellingDealId,
    contrAgentId,
    accountId,
    dealId,
    project_ids: projectId,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['cash_flow', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'cash_flow', data: filterData }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  const legend = useMemo(() => data?.legend || [], [data])
  const keys = useMemo(() => legend.map((item) => item.key), [legend])
  const rows = useMemo(() => data?.rows || [], [data])

  // По умолчанию открыт последний период: он же самый свежий
  const activeKey = periodKey || keys[keys.length - 1] || TOTAL_KEY

  const summary = useMemo(() => {
    const sumByName = (name) =>
      collectRows(rows, name).reduce((sum, row) => sum + valueOf(row, activeKey, keys), 0)
    const net = findRow(rows, (row) => row?.id === 'overall-cash-flow' || row?.name === 'Общий денежный поток')
    const ending = findRow(rows, (row) => row?.id === 'ending-balance' || row?.name === 'Остатки на конец периода')
    return {
      receipts: sumByName('Поступления'),
      payments: sumByName('Выплаты'),
      net: net ? valueOf(net, activeKey, keys) : 0,
      ending: ending ? valueOf(ending, activeKey, keys) : 0,
    }
  }, [rows, activeKey, keys])

  const currency = currencyCode

  const tiles = [
    { key: 'receipts', label: tm('reports.receipts'), value: summary.receipts, tone: 'in' },
    { key: 'payments', label: tm('reports.payments'), value: summary.payments, tone: 'out' },
    { key: 'net', label: tm('reports.netFlow'), value: summary.net, tone: summary.net >= 0 ? 'in' : 'out' },
    { key: 'ending', label: tm('reports.endingBalance'), value: summary.ending, tone: 'neutral' },
  ]

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={t('cashflow.title')}
        subtitle={[periodStartDate, periodEndDate]
          .filter(Boolean)
          .map((date) => moment(date).format('DD.MM.YYYY'))
          .join(' — ')}
        onBack={() => router.push('/m/reports')}
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && rows.length === 0 && <MEmpty icon={TrendingUp} title={tm('reports.noData')} />}

      {!isLoading && rows.length > 0 && (
        <>
          {/* Один период за раз — вместо колонок таблицы */}
          <PeriodChips legend={legend} value={activeKey} onChange={setPeriodKey} totalLabel={t('common.total')} />

          {/* Итоги выбранного периода */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
              <ReportTile key={tile.key} label={tile.label} value={tile.value} currency={currency} tone={tile.tone} />
            ))}
          </div>

          {/* Статьи этого периода */}
          <MCard list className="mt-2.5">
            {rows.map((row) => (
              <TreeRow key={row.id || row.name} row={row} periodKey={activeKey} keys={keys} currency={currency} />
            ))}
          </MCard>

          <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('reports.tableHint')}</p>
        </>
      )}
    </div>
  )
})

export default MobileCashflowPage
