'use client'

import { cn } from '@/lib/utils'
import { Landmark, PiggyBank, TrendingDown, TrendingUp, Wallet } from '@/components/icons'
import * as MobileIcons from '@/components/mobile/icons'

/**
 * Пять разделов плана счетов: доходы, расходы, активы, обязательства, капитал.
 *
 * Значок и цвет у раздела один на всё приложение — как у типов операций
 * (OperationTypeIcon). Раньше разделы были просто подчёркнутыми надписями,
 * одинаковыми на вид, и в списке, и в окне создания приходилось вчитываться.
 */
export const CATEGORY_TYPES = [
  { key: 'income', Icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'expense', Icon: TrendingDown, tone: 'bg-rose-50 text-rose-600' },
  { key: 'assets', Icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
  { key: 'liabilities', Icon: Landmark, tone: 'bg-orange-50 text-orange-600' },
  { key: 'capital', Icon: PiggyBank, tone: 'bg-violet-50 text-violet-600' },
]

export const CATEGORY_TYPE_BY_KEY = Object.fromEntries(CATEGORY_TYPES.map((type) => [type.key, type]))

/**
 * Спокойные цвета телефона: цвет только у денег — доходы зелёные, расходы
 * красные, остальные разделы серые (см. MOBILE_OPERATION_TYPES).
 */
const CALM_TONES = {
  income: 'bg-emerald-50 text-emerald-600',
  expense: 'bg-red-50 text-red-600',
}

const CALM_ICONS = {
  income: MobileIcons.TrendingUp,
  expense: MobileIcons.TrendingDown,
  assets: MobileIcons.Wallet,
  liabilities: MobileIcons.Landmark,
  capital: MobileIcons.PiggyBank,
}

/** Значок раздела в круге его цвета. calm — палитра и значки телефона. */
export function CategoryTypeIcon({ type, size = 'md', className, calm = false }) {
  const config = CATEGORY_TYPE_BY_KEY[type]
  if (!config) return null
  // calm — телефон: значок из набора телефона (Phosphor) и спокойный цвет
  const Icon = calm ? CALM_ICONS[type] || config.Icon : config.Icon
  const tone = calm ? CALM_TONES[type] || 'bg-slate-100 text-slate-500' : config.tone
  const box = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'

  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full', box, tone, className)}>
      <Icon size={size === 'sm' ? 13 : 15} aria-hidden="true" />
    </span>
  )
}

/**
 * Переключатель разделов: значок в цвете раздела и название.
 *
 * @param {(key: string) => string} label — подпись раздела (у списка и окна
 *   создания подписи берутся из разных словарей)
 * @param {boolean} full — растянуть на всю ширину, поделив поровну
 */
export function CategoryTypeTabs({ value, onChange, label, full = false, ariaLabel, className }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1',
        full && 'flex w-full',
        className
      )}
    >
      {CATEGORY_TYPES.map(({ key }) => {
        const active = key === value
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg pr-3 pl-1 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e73f6]',
              full && 'flex-1 justify-center',
              active ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <CategoryTypeIcon type={key} size="sm" className={cn(!active && 'opacity-70')} />
            {label(key)}
          </button>
        )
      })}
    </div>
  )
}
