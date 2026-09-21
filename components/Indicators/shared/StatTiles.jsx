'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

/**
 * Итоги графика плитками над ним. Раньше итоги стояли узкой колонкой слева
 * от графика и отнимали у него треть ширины; теперь график во всю ширину.
 * Плитка с onClick открывает операции (стрелка в углу подсказывает это).
 *
 * items: [{ label, value, symbol?, onClick?, tone? }]
 */
export default function StatTiles({ items = [], className }) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3', className)}>
      {items.map((item, index) => {
        const Tag = item.onClick ? 'button' : 'div'
        return (
          <Tag
            key={index}
            {...(item.onClick && { type: 'button', onClick: item.onClick })}
            className={cn(
              'group relative flex min-w-0 flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-left',
              item.onClick &&
                'cursor-pointer transition-colors hover:border-[#0e73f6]/50 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]'
            )}
          >
            <span className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</span>
            <span className={cn('truncate text-xl font-semibold tabular-nums', item.tone || 'text-slate-900')} suppressHydrationWarning>
              {item.value}
              {item.symbol && <span className="ml-1 text-sm font-normal text-slate-400">{item.symbol}</span>}
            </span>
            {item.onClick && (
              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="absolute right-3 top-3 text-slate-300 transition-colors group-hover:text-[#0e73f6]"
              />
            )}
          </Tag>
        )
      })}
    </div>
  )
}
