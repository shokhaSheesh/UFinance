'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Loader2, TrendingUp } from 'lucide-react'
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

const num = (value) => Number(value) || 0

/** Сумма значений узла по всем периодам — для колонки «Итого». */
const totalOf = (node, keys) => keys.reduce((sum, key) => sum + num(node?.values?.[key]), 0)

/** Значение узла за выбранный период (или за всё время). */
const valueOf = (node, key, keys) => (key === '__total__' ? totalOf(node, keys) : num(node?.values?.[key]))

/** Первый узел дерева с подходящим именем — итоги берём по названию раздела. */
const findRow = (rows = [], test) => {
  for (const row of rows) {
    if (test(row)) return row
    const found = findRow(row?.details || [], test)
    if (found) return found
  }
  return null
}

/** Все узлы с таким именем: «Поступления» встречаются в каждом потоке. */
const collectRows = (rows = [], name, acc = []) => {
  rows.forEach((row) => {
    if (row?.name === name) acc.push(row)
    collectRows(row?.details || [], name, acc)
  })
  return acc
}

/** Строка дерева: название, сумма, раскрытие вложенных статей. */
const TreeRow = ({ row, periodKey, keys, currency, depth = 0 }) => {
  const [open, setOpen] = useState(depth === 0)
  const children = row?.details || []
  const value = valueOf(row, periodKey, keys)
  const hasChildren = children.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-2 border-b border-slate-100 py-3 text-left last:border-b-0',
          !hasChildren && 'cursor-default'
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        {hasChildren ? (
          <ChevronRight
            size={16}
            aria-hidden="true"
            className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-90')}
          />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            depth === 0 ? 'text-[15px] font-semibold text-slate-900' : 'text-[14px] text-slate-600'
          )}
        >
          {row.name}
        </span>
        <span
          className={cn(
            'shrink-0 text-[14px] tabular-nums',
            depth === 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700',
            value < 0 && 'text-red-600'
          )}
        >
          <Money value={value} currency={currency} />
        </span>
      </button>

      {open &&
        children.map((child) => (
          <TreeRow
            key={child.id || child.name}
            row={child}
            periodKey={periodKey}
            keys={keys}
            currency={currency}
            depth={depth + 1}
          />
        ))}
    </>
  )
}

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
  const activeKey = periodKey || keys[keys.length - 1] || '__total__'

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
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {legend.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriodKey(item.key)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap',
                  activeKey === item.key ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
                )}
              >
                {item.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPeriodKey('__total__')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap',
                activeKey === '__total__' ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
              )}
            >
              {t('common.total')}
            </button>
          </div>

          {/* Итоги выбранного периода */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
              <div key={tile.key} className="flex min-w-0 flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
                <span className="truncate text-[11px] text-slate-500">{tile.label}</span>
                <span
                  className={cn(
                    'truncate text-[16px] font-bold tabular-nums',
                    tile.tone === 'in' ? 'text-emerald-600' : tile.tone === 'out' ? 'text-red-600' : 'text-slate-900'
                  )}
                >
                  <Money value={tile.value} currency={currency} />
                </span>
              </div>
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
