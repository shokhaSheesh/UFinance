'use client'

import FigureCard from '@/components/mobile/FigureCard'
import Money from '@/components/shared/Money'
import { Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
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

  return <FigureCard rows={rows} loading={loading} />
}
