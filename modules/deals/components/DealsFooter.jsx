// components/DealsFooter.jsx
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/utils/helpers'

/**
 * Fixed bottom footer showing deal count, total sum, and total profit.
 */
export default function DealsFooter({ t, summary, totalProfit, isFilterOpen }) {
  return (
    <footer
      className={cn(
        'fixed bottom-0 right-0 bg-neutral-100 p-2 py-3 border-t border-neutral-200',
        'flex items-center gap-6 z-10 transition-[left] duration-300',
        isFilterOpen ? 'left-[320px]' : 'left-[110px]'
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500 font-medium">
          {t('footer.dealsCount', { count: summary?.count || 0 })}
        </span>
        <span className="text-xs font-semibold text-slate-900">
          {formatAmount(summary?.total_deals_sum || 0)}
        </span>
        <span className="text-xs font-semibold text-slate-900">{GlobalCurrency?.name}</span>
      </span>

      <div className="w-px h-5 bg-gray-200 shrink-0" />

      <span className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500 font-medium">
          {t('footer.totalProfit')}
        </span>
        <span
          className={cn(
            'text-xs font-semibold',
            totalProfit > 0 ? 'text-emerald-500' :
              totalProfit < 0 ? 'text-red-500' :
                'text-slate-900'
          )}
        >
          {formatAmount(totalProfit)}
        </span>
        <span className="text-xs font-semibold text-slate-900">{GlobalCurrency?.name}</span>
      </span>
    </footer>
  )
}