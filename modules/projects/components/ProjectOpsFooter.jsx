import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/utils/helpers'

// Русские склонения: 1 → ед., 2–4 → мн., иначе → род.
const plural = (n, td, base) =>
  n === 1 ? td(`opFooter.${base}`) : n < 5 ? td(`opFooter.${base}Plural`) : td(`opFooter.${base}PluralMany`)

/**
 * Нижняя сводка по операциям проекта (как на странице контрагента).
 */
export default function ProjectOpsFooter({ td, summary, stats }) {
  const symbol = GlobalCurrency?.name || '₽'
  const total = summary?.total || 0

  return (
    <div className="fixed bottom-0 left-[80px] right-0 h-10 bg-neutral-100 border-t border-gray-200 flex items-center px-6 z-10">
      <div className="flex items-center gap-4 text-xs">
        <span className="text-gray-600">
          <span className="font-semibold text-slate-900">{total}</span> {plural(total, td, 'operations')}
        </span>

        {stats?.receiptsCount > 0 && (
          <span className="text-gray-600">
            {stats.receiptsCount} {plural(stats.receiptsCount, td, 'receipts')}:{' '}
            <span className="font-semibold text-slate-900">
              {formatAmount(summary?.incoming)} {symbol}
            </span>
          </span>
        )}

        {stats?.paymentsCount > 0 && (
          <span className="text-gray-600">
            {stats.paymentsCount} {plural(stats.paymentsCount, td, 'payments')}:{' '}
            <span className="font-semibold text-slate-900">
              {formatAmount(summary?.outgoing)} {symbol}
            </span>
          </span>
        )}

        <span className="text-gray-600">
          {td('opFooter.total')}:{' '}
          <span className={cn('font-semibold', (summary?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {(summary?.profit || 0) >= 0 ? '+' : ''}
            {formatAmount(summary?.profit || 0)} {symbol}
          </span>
        </span>
      </div>
    </div>
  )
}
