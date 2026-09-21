'use client'

import { cn } from '@/lib/utils'

/**
 * Шапка страницы-списка с единой раскладкой:
 *
 *   [ Заголовок · Поиск · Фильтры ] ................ [ Создать · Ещё ]
 *
 * Слева — то, чем пользователь сужает набор данных, справа — то, чем он его
 * меняет. До этого по проекту было наоборот и вразнобой: кнопка создания
 * стояла слева у заголовка, а поиск уезжал вправо, и на каждой странице
 * порядок был свой. Разделение «искать слева, действовать справа» держит
 * кнопку создания на одном месте во всех разделах.
 *
 * @param {ReactNode} title    заголовок страницы
 * @param {ReactNode} search   поле поиска
 * @param {ReactNode} filters  кнопка фильтров и подобные переключатели
 * @param {ReactNode} actions  создание, импорт/экспорт, меню «ещё»
 */
export default function PageHeader({ title, search, filters, actions, className, children }) {
  return (
    <div
      className={cn(
        'flex h-16 shrink-0 items-center justify-between gap-4 bg-transparent px-4',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {title && (
          <h1 className="shrink-0 text-xl font-semibold text-slate-900">{title}</h1>
        )}
        {search}
        {filters}
        {children}
      </div>

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  )
}
