'use client'

import { cn } from '@/lib/utils'
import { splitAmount } from '@/utils/helpers'
import { observer } from 'mobx-react-lite'

/**
 * Денежная сумма в формате ПланФакта.
 *
 * Когда включена настройка «Отображать копейки» (show_cents), дробная часть
 * вместе с символом валюты печатается более мелким и светлым шрифтом —
 * в вёрстке ПланФакта это `<span class="decimal-part">.90 ₽</span>`
 * (10px, font-weight 300, opacity .6 против 12–13px основной части).
 * Когда настройка выключена, сумма округляется до целого и дробной части нет.
 *
 * @param {number|string} value  — сумма
 * @param {string} [currency]    — символ/код валюты, печатается вместе с копейками
 * @param {string} [sign]        — принудительный знак («+» / «-»), знак самого
 *                                 числа при этом не печатается
 * @param {boolean} [cents]      — перекрывает настройку (для мест с жёстким форматом)
 */
const Money = observer(({ value, currency = '', sign, cents, className, decimalClassName }) => {
  const parts = splitAmount(value, cents === undefined ? undefined : { cents })
  const prefix = sign !== undefined ? sign : parts.sign
  // Копейки — часть числа: тот же цвет, 12px (text-xs) — чуть мельче суммы.
  // Раньше хвост был 0.78em, font-light и opacity-60 — около 11px на 60%
  // непрозрачности, самые плохо читаемые цифры в бухгалтерской программе.
  // Код валюты — не число, он приглушён, чтобы взгляд шёл по цифрам.
  // tabular-nums: у всех цифр одна ширина, суммы в колонке встают разряд
  // под разрядом.
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {prefix}
      {parts.int}
      {parts.dec && (
        <span className={cn('text-xs', decimalClassName)}>.{parts.dec}</span>
      )}
      {currency && (
        <span className="text-xs font-normal text-slate-500"> {currency}</span>
      )}
    </span>
  )
})

export default Money
