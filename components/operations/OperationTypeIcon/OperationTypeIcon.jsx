'use client'

import { cn } from '@/lib/utils'
import { OPERATION_TYPES } from '@/constants/operationTypes'

/**
 * Значок типа операции — один для строк, строк частей и карточек итогов.
 *
 * Раньше у каждой таблицы были свои SVG разных размеров, а у отгрузки и
 * поставки — рисованные иконки в другом стиле. Теперь тип определяется по
 * `tip` в одном месте:
 *   Поступление — зелёная стрелка внутрь
 *   Выплата     — красная стрелка наружу
 *   Перемещение, начисление, отгрузка, поставка — серые, различаются значком
 *   (встречные стрелки, весы, грузовик, принятая коробка)
 * Цвета и значки — в constants/operationTypes.js, общие с телефоном.
 */
const TYPES = OPERATION_TYPES

export default function OperationTypeIcon({ tip, size = 'md', className }) {
  const type = TYPES[tip]
  if (!type) return null
  const { icon: Icon, tone } = type
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
