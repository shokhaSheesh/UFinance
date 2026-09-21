'use client'

import { cn } from '@/lib/utils'

/**
 * Действия строки таблицы — отдельными кнопками прямо в строке.
 *
 * Раньше действия прятались за «три точки»: чтобы отредактировать или
 * удалить строку, нужно было сначала открыть меню. Теперь каждое действие —
 * своя кнопка-иконка с подсказкой; удаление подсвечивается красным при
 * наведении, чтобы его не нажимали вместо соседней кнопки.
 *
 * Клик по кнопке не всплывает до строки: у многих строк свой обработчик
 * клика (открыть карточку, раскрыть группу).
 *
 * @param {{key: string, icon: Component, label: string, onClick: Function,
 *          danger?: boolean, hidden?: boolean, disabled?: boolean}[]} actions
 */
export default function RowActions({ actions = [], className }) {
  const visible = actions.filter((action) => action && !action.hidden)
  if (!visible.length) return null

  return (
    <div
      className={cn('flex shrink-0 items-center gap-0.5', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map(({ key, icon: Icon, label, onClick, danger, disabled }) => (
        <button
          key={key}
          type="button"
          title={label}
          aria-label={label}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e)
          }}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-slate-400 cursor-pointer transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e73f6]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Icon size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
