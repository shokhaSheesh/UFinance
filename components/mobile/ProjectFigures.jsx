'use client'

import { MCard, TileIcon } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { cn } from '@/lib/utils'
import { Loader2, Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Доходы, расходы, прибыль и рентабельность проекта — одной карточкой.
 *
 * Четыре цифры связаны между собой (прибыль = доходы − расходы,
 * рентабельность — её доля), поэтому они стоят строками друг под другом,
 * а не карточками, которые надо листать: всё видно сразу, как в блоке
 * «За период» на главной.
 */
export default function ProjectFigures({ income, expenses, profit, profitability, currency, loading = false }) {
  const td = useTranslations('Projects.detail')
  const profitValue = Number(profit) || 0
  const margin = profitability == null ? null : Math.round(Number(profitability) * 10) / 10

  const rows = [
    { key: 'income', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600', label: td('income'), value: <Money value={Number(income) || 0} currency={currency} /> },
    { key: 'expenses', icon: TrendingDown, tone: 'bg-red-50 text-red-600', label: td('expenses'), value: <Money value={Number(expenses) || 0} currency={currency} /> },
    {
      key: 'profit',
      icon: Wallet,
      tone: 'bg-indigo-50 text-indigo-600',
      label: td('profit'),
      value: <Money value={profitValue} currency={currency} />,
      valueClass: profitValue >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    {
      key: 'profitability',
      icon: Percent,
      tone: 'bg-sky-50 text-sky-600',
      label: td('profitability'),
      value: margin == null ? '—' : `${margin}%`,
      valueClass: margin == null ? 'text-slate-400' : margin >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ]

  return (
    <MCard list>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0">
          <TileIcon icon={row.icon} tone={row.tone} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">{row.label}</span>
          <span className={cn('shrink-0 text-[15px] font-bold tabular-nums text-slate-900', row.valueClass)}>
            {loading ? <Loader2 size={16} className="animate-spin text-slate-300" aria-hidden="true" /> : row.value}
          </span>
        </div>
      ))}
    </MCard>
  )
}
