'use client'

import { cn } from '@/lib/utils'

/**
 * Столбики по периодам отчёта — и они же выбор периода.
 *
 * На телефоне график и переключатель периодов обычно живут отдельно: сверху
 * полоса чипов, ниже картинка. Здесь это одно и то же: высота столбика
 * показывает размер, а нажатие выбирает период, цифры которого разбираются
 * ниже. Рисуем прямоугольниками, без библиотеки графиков: на ленте из
 * двенадцати столбиков она стоила бы дороже, чем даёт.
 *
 * @param {{key: string, title: string, up: number, down: number}[]} periods
 */
export default function PeriodBars({ periods = [], value, onChange, height = 96 }) {
  if (periods.length === 0) return null

  const max = Math.max(...periods.map((item) => Math.max(Math.abs(item.up || 0), Math.abs(item.down || 0))), 1)
  const share = (amount) => Math.max((Math.abs(amount || 0) / max) * 100, amount ? 3 : 0)

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
      {periods.map((period) => {
        const active = period.key === value
        return (
          <button
            key={period.key}
            type="button"
            onClick={() => onChange(period.key)}
            className={cn(
              'flex w-[56px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 pt-2 pb-1.5 transition-colors',
              active ? 'bg-white' : 'active:bg-white/60'
            )}
          >
            <span className="flex w-full items-end justify-center gap-1" style={{ height }}>
              <span
                className={cn('w-2.5 rounded-full transition-colors', active ? 'bg-emerald-500' : 'bg-emerald-200')}
                style={{ height: `${share(period.up)}%` }}
              />
              <span
                className={cn('w-2.5 rounded-full transition-colors', active ? 'bg-red-500' : 'bg-red-200')}
                style={{ height: `${share(period.down)}%` }}
              />
            </span>
            <span
              className={cn(
                'w-full truncate text-center text-[11px] font-semibold',
                active ? 'text-slate-900' : 'text-slate-400'
              )}
            >
              {period.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
