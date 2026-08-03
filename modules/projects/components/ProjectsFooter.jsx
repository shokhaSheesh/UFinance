import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/utils/helpers'

const Metric = ({ label, value, value2, tone }) => (
  <span className="flex items-center gap-1.5">
    <span className="text-[11px] text-gray-500 font-medium">{label}</span>
    <span
      className={cn(
        'text-xs font-semibold',
        tone === 'pos' && 'text-emerald-600',
        tone === 'neg' && 'text-red-500',
        !tone && 'text-slate-900'
      )}
    >
      {value}
      {value2 ? ` ${value2}` : ''}
    </span>
  </span>
)

// Итоги показываем целыми — как и суммы в строках таблицы
const money = (v) => formatAmount(Math.round(Number(v) || 0))

/**
 * Нижняя сводка по выборке — `summary` из list_projects.
 */
export default function ProjectsFooter({ t, summary, isFilterOpen }) {
  const symbol = GlobalCurrency?.name || '₽'
  const { count = 0, income = 0, expenses = 0, profit = 0, profitability = null } = summary || {}

  return (
    <footer
      className={cn(
        'fixed bottom-0 right-0 bg-neutral-100 p-2 py-3 border-t border-neutral-200',
        'flex items-center gap-6 z-10 transition-[left] duration-300',
        isFilterOpen ? 'left-[320px]' : 'left-[110px]'
      )}
    >
      <span className="text-[11px] text-gray-500 font-medium">
        {t('footer.count', { count })}
      </span>

      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <Metric label={t('footer.income')} value={money(income)} value2={symbol} />

      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <Metric
        label={t('footer.expenses')}
        value={money(expenses)}
        value2={symbol}
        tone={expenses < 0 ? 'neg' : undefined}
      />

      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <Metric
        label={t('footer.profit')}
        value={money(profit)}
        value2={symbol}
        tone={profit > 0 ? 'pos' : profit < 0 ? 'neg' : undefined}
      />

      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <Metric
        label={t('footer.profitability')}
        value={profitability == null ? '–' : `${Number(profitability).toFixed(1)}%`}
        tone={profitability > 0 ? 'pos' : profitability < 0 ? 'neg' : undefined}
      />
    </footer>
  )
}
