'use client'

import { cn } from '@/lib/utils'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, PackageCheck, Scale, Truck } from 'lucide-react'

/**
 * Значок типа операции — один для строк, строк частей и карточек итогов.
 *
 * Раньше у каждой таблицы были свои SVG разных размеров, а у отгрузки и
 * поставки — рисованные иконки в другом стиле. Теперь тип определяется по
 * `tip` в одном месте:
 *   Поступление — зелёная стрелка внутрь
 *   Выплата     — красная стрелка наружу
 *   Перемещение — серые встречные стрелки
 *   Начисление  — весы (дебет = кредит), раньше совпадал с перемещением
 *   Отгрузка    — грузовик
 *   Поставка    — принятая коробка
 */
const TYPES = {
  Поступление: { Icon: ArrowDownLeft, tone: 'bg-green-50 text-green-600' },
  Выплата: { Icon: ArrowUpRight, tone: 'bg-red-50 text-red-600' },
  Перемещение: { Icon: ArrowLeftRight, tone: 'bg-slate-100 text-slate-600' },
  Начисление: { Icon: Scale, tone: 'bg-slate-100 text-slate-600' },
  Отгрузка: { Icon: Truck, tone: 'bg-slate-100 text-slate-600' },
  Поставка: { Icon: PackageCheck, tone: 'bg-slate-100 text-slate-600' },
}

export default function OperationTypeIcon({ tip, size = 'md', className }) {
  const type = TYPES[tip]
  if (!type) return null
  const { Icon, tone } = type
  const box = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
  const icon = size === 'sm' ? 13 : 15

  return (
    <span
      title={tip}
      className={cn('flex shrink-0 items-center justify-center rounded-full', box, tone, className)}
    >
      <Icon size={icon} aria-hidden="true" />
    </span>
  )
}
