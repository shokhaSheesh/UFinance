"use client"

import Money from '@/components/shared/Money'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Hash, Sigma } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { GlobalCurrency } from '../../../constants/globalCurrency'

/**
 * Итоги по операциям — карточками над таблицей.
 *
 * Те же пять цифр, что жили в закреплённой полосе внизу экрана (количество,
 * поступления, выплаты, перемещения, итог). Полоса перекрывала последние
 * строки таблицы и читалась как часть подвала; карточки сверху — первое, что
 * видно на странице, и отвечают на вопрос «сколько пришло и ушло» до того,
 * как пользователь начнёт листать список.
 */
const Card = ({ icon: Icon, tone = 'neutral', label, count, children }) => {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-600',
    in: 'bg-green-50 text-green-600',
    out: 'bg-red-50 text-red-600',
  }[tone]

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', toneClass)}>
          <Icon size={15} aria-hidden="true" />
        </span>
      </div>
      <div className="text-xl font-semibold text-slate-900 tabular-nums">{children}</div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 tabular-nums">{count}</span>
      )}
    </div>
  )
}

export const OperationsSummary = observer(({ totalSummary }) => {
  const t = useTranslations('Operations')
  const mounted = useMounted()
  if (!mounted) return null

  const byType = totalSummary?.by_type || {}
  const net = totalSummary?.net_cash_flow ?? 0
  const currency = GlobalCurrency?.name
  const opsCount = (n) => t('summary.opsCount', { count: n ?? 0 })

  return (
    <div className="flex shrink-0 gap-3 pb-4">
      <Card icon={Hash} label={t('footer.operations')}>
        {totalSummary?.count ?? 0}
      </Card>

      <Card icon={ArrowDownLeft} tone="in" label={t('footer.receipts')} count={opsCount(byType.receipt?.count)}>
        <Money value={byType.receipt?.total_summa ?? 0} currency={currency} />
      </Card>

      <Card icon={ArrowUpRight} tone="out" label={t('footer.payments')} count={opsCount(byType.payment?.count)}>
        <Money value={byType.payment?.total_summa ?? 0} currency={currency} />
      </Card>

      <Card icon={ArrowLeftRight} label={t('footer.transfers')} count={opsCount(byType.transfer?.count)}>
        <Money value={byType.transfer?.total_summa ?? 0} currency={currency} />
      </Card>

      <Card icon={Sigma} tone={net >= 0 ? 'in' : 'out'} label={t('footer.total')}>
        <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
          {net > 0 ? '+' : ''}
          <Money value={net} currency={currency} />
        </span>
      </Card>
    </div>
  )
})
