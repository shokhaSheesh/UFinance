import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'

const Stat = ({ label, value, colorValue }) => (
  <>
    <div className="w-px h-6 bg-gray-200 shrink-0" />
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-0.5">
        <span className={cn('text-xs font-semibold', colorValue ? (colorValue > 0 ? 'text-emerald-500' : colorValue < 0 ? 'text-red-500' : 'text-slate-900') : 'text-slate-900')}>
          {colorValue !== undefined
            ? (colorValue === 0 ? '0' : `${colorValue > 0 ? '+' : ''}${formatNumber(colorValue)}`)
            : formatNumber(value)}
        </span>
        <span className={cn('text-xs', colorValue ? (colorValue > 0 ? 'text-emerald-500' : colorValue < 0 ? 'text-red-500' : 'text-gray-400') : 'text-gray-400')}>
          {GlobalCurrency?.name}
        </span>
      </div>
    </div>
  </>
)

const CounterpartiesFooter = ({ t, summary, isFilterOpen }) => (
  <div className={cn(
    'fixed bottom-0 right-0 bg-neutral-100 p-2 border-t border-neutral-200 flex items-center gap-8 shrink-0 z-10 transition-[left] duration-300',
    isFilterOpen ? 'left-[320px]' : 'left-[110px]'
  )}>
    <div className="text-sm text-slate-900">
      <span className="font-semibold text-slate-900 whitespace-nowrap">
        {summary?.count === 1
          ? t('list.counterpartyCount', { count: summary?.count })
          : summary?.count < 5
            ? t('list.counterpartyCountPlural', { count: summary?.count })
            : t('list.counterpartyCountPluralMany', { count: summary?.count })}
      </span>
    </div>

    <Stat label={t('list.summary.receivables')} value={summary?.debitorka} />
    <Stat label={t('list.summary.payables')} value={summary?.kreditorka} />
    <Stat label={t('list.summary.receipts')} value={summary?.income} />
    <Stat label={t('list.summary.payments')} value={summary?.expense} />
    <Stat label={t('list.summary.difference')} colorValue={summary?.difference} />
  </div>
)

export default CounterpartiesFooter
