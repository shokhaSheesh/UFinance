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
  const tail = [parts.dec ? `.${parts.dec}` : '', currency ? ` ${currency}` : '']
    .join('')

  return (
    <span className={cn('whitespace-nowrap', className)}>
      {prefix}
      {parts.int}
      {tail && (
        <span className={cn('text-[0.78em] font-light opacity-60', decimalClassName)}>{tail}</span>
      )}
    </span>
  )
})

export default Money
