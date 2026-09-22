'use client'

import HintQuestion from '@/components/shared/HintQuestion'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { indicators } from '@/store/indicatos.store'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { CASH_FLOW_STREAMS, useIndicatorBalances, useIndicatorCashFlow } from '../shared/indicatorQueries'
import StatTiles from '../shared/StatTiles'

// Шкала запаса — до года; дальше полоса просто заполнена
const SCALE_MONTHS = 12
const ZONES = [
  { key: 'danger', from: 0, to: 1, color: '#fecaca' },
  { key: 'warning', from: 1, to: 3, color: '#fde68a' },
  { key: 'ok', from: 3, to: SCALE_MONTHS, color: '#bbf7d0' },
]

const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'
const oneDecimal = (value) => (Math.round(value * 10) / 10).toLocaleString('ru-RU')

/**
 * «Запас денег» — на сколько месяцев хватит денег на счетах, если
 * поступления остановятся: остаток на сегодня делится на средние выплаты
 * в месяц за прошедшую часть выбранного периода.
 *
 * Самый частый вопрос владельца к финансам, а на странице его не было:
 * остатки и потоки показывались отдельно, считать приходилось в уме.
 * Данные — те же, что у блоков «Денежный поток» и «Остатки на счетах»
 * (общий кэш запросов).
 */
const CashRunway = () => {
  const t = useTranslations('Indicators')
  const mounted = useMounted()
  const { data: cashFlow, isFetching: cashFlowLoading } = useIndicatorCashFlow()
  const { data: balances, isFetching: balancesLoading } = useIndicatorBalances()

  const result = useMemo(() => {
    const today = moment().startOf('day')

    // Остаток на сегодня: сумма по счетам за сегодня (или за последний день периода до сегодня)
    let balance = null
    if (balances?.length) {
      const days = balances[0].totalValuesByDays || []
      let index = days.findIndex((d) => moment(d.date).isSame(today, 'day'))
      if (index === -1) {
        index = days.reduce((last, d, i) => (moment(d.date).isSameOrBefore(today, 'day') ? i : last), -1)
      }
      if (index !== -1) {
        balance = balances.reduce((sum, account) => sum + (account.totalValuesByDays?.[index]?.totalInUserCurrency ?? 0), 0)
      }
    }

    // Поступления и выплаты за прошедшие периоды
    const legend = cashFlow?.legend || []
    const rows = cashFlow?.rows || []
    const streams = rows.filter((row) => CASH_FLOW_STREAMS.includes(row.name))
    const pastKeys = legend
      .filter((item) => !item.startDate || moment(item.startDate).isSameOrBefore(today, 'day'))
      .map((item) => item.key)
    const sumPart = (partName) =>
      streams
        .flatMap((stream) => stream.details?.filter((detail) => detail.name === partName) || [])
        .reduce((sum, part) => sum + pastKeys.reduce((acc, key) => acc + Math.abs(part.values?.[key] ?? 0), 0), 0)
    const receipts = sumPart('Поступления')
    const payments = sumPart('Выплаты')

    // Сколько месяцев прошло с начала периода (не меньше одного)
    const start = moment(indicators.rangeMonth?.start)
    const end = moment.min(moment(indicators.rangeMonth?.end), moment())
    const months = Math.max(1, end.diff(start, 'days') / 30.44)

    const avgReceipts = receipts / months
    const avgPayments = payments / months
    const avgNet = avgReceipts - avgPayments
    const cover = balance != null && avgPayments > 0 ? Math.max(balance, 0) / avgPayments : null
    const runway = balance != null && avgNet < 0 ? Math.max(balance, 0) / -avgNet : null

    return { balance, avgReceipts, avgPayments, avgNet, cover, runway, hasData: balance != null && payments + receipts > 0 }
  }, [cashFlow, balances])

  const currency = mounted ? GlobalCurrency?.name : ''
  const loading = cashFlowLoading || balancesLoading
  const { cover } = result
  const zone = cover == null ? null : cover < 1 ? 'danger' : cover < 3 ? 'warning' : 'ok'
  const markerLeft = cover == null ? 0 : Math.min(cover / SCALE_MONTHS, 1) * 100

  const tiles = [
    { label: t('cashRunway.balance'), value: money(result.balance), symbol: currency },
    { label: t('cashRunway.receipts'), value: money(result.avgReceipts), symbol: currency },
    { label: t('cashRunway.payments'), value: money(result.avgPayments), symbol: currency, tone: result.avgPayments ? 'text-red-600' : undefined },
    {
      label: t('cashRunway.net'),
      value: `${result.avgNet > 0 ? '+' : ''}${money(result.avgNet)}`,
      symbol: currency,
      tone: result.avgNet > 0 ? 'text-emerald-700' : result.avgNet < 0 ? 'text-red-600' : undefined,
    },
  ]

  return (
    <div className="relative w-full bg-white p-6">
      {loading && (
        <div className="absolute inset-0 z-100 flex items-center justify-center rounded-xl bg-white/80">
          <Loader />
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('cashRunway.title')}
          {currency ? `, ${currency}` : ''}
        </h2>
        <span className="flex size-5 cursor-help items-center justify-center rounded-full bg-slate-100" title={t('cashRunway.hint')}>
          <HintQuestion className="size-3 text-slate-400" />
        </span>
      </div>

      {!result.hasData && !loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">{t('cashRunway.noData')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
          {/* Главная цифра и шкала */}
          <div className="flex flex-col justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-5">
            <div>
              <div className="text-sm text-slate-500">{t('cashRunway.coverTitle')}</div>
              <div
                className={cn(
                  'text-4xl font-semibold tabular-nums',
                  zone === 'danger' ? 'text-red-600' : zone === 'warning' ? 'text-amber-600' : 'text-emerald-700'
                )}
              >
                {cover == null ? '—' : t('cashRunway.cover', { months: cover >= 100 ? '100+' : oneDecimal(cover) })}
              </div>
              <div className="text-sm text-slate-500">{t('cashRunway.coverCaption')}</div>
            </div>

            {/* Шкала 0–12 месяцев с зонами */}
            <div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full">
                <div className="absolute inset-0 flex">
                  {ZONES.map((z) => (
                    <div key={z.key} style={{ width: `${((z.to - z.from) / SCALE_MONTHS) * 100}%`, background: z.color }} />
                  ))}
                </div>
              </div>
              <div className="relative h-3">
                {cover != null && (
                  <span
                    className="absolute -top-4 h-4 w-1 -translate-x-1/2 rounded-full bg-slate-900 transition-[left] duration-500"
                    style={{ left: `${markerLeft}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[11px] tabular-nums text-slate-400">
                <span>0</span>
                <span>1</span>
                <span>3</span>
                <span>6</span>
                <span>{SCALE_MONTHS}+</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                {ZONES.map((z) => (
                  <span key={z.key} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: z.color }} />
                    {t(`cashRunway.zones.${z.key}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Из чего складывается */}
          <div className="flex flex-col gap-3">
            <StatTiles items={tiles} />
            <p className="text-xs text-slate-400">{t('cashRunway.avgHint')}</p>
            <p
              className={cn(
                'rounded-lg px-4 py-3 text-sm',
                result.runway != null ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
              )}
            >
              {result.runway != null
                ? t('cashRunway.burn', { months: result.runway >= 100 ? '100+' : oneDecimal(result.runway) })
                : t('cashRunway.growing', { amount: `${money(result.avgNet)} ${currency || ''}`.trim() })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default observer(CashRunway)
