'use client'

import OperationTypeIcon from '@/components/operations/OperationTypeIcon/OperationTypeIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appStore } from '@/store/app.store'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

// Тип формы → tip для значка и право на создание
export const CREATE_OPERATION_TYPES = [
  { id: 'income', tip: 'Поступление', label: 'modal.tabIncome', perm: 'income' },
  { id: 'payment', tip: 'Выплата', label: 'modal.tabPayment', perm: 'payout' },
  { id: 'transfer', tip: 'Перемещение', label: 'modal.tabTransfer', perm: 'transfer' },
  { id: 'accrual', tip: 'Начисление', label: 'modal.tabAccrual', perm: 'accrual' },
]

/**
 * Кнопка «Создать» операции: сначала выбор типа (со значком), потом форма.
 * Одна и та же на всех страницах, где создаются операции, — раньше в карточке
 * контрагента и проекта кнопка сразу открывала форму поступления.
 * Типы, которые роль не может создавать, в меню не показываются.
 *
 * @param {(type: 'income'|'payment'|'transfer'|'accrual') => void} onCreate
 * @param {string[]} [types]  какие типы показывать (по умолчанию все четыре)
 * @param children  дополнительные пункты под разделителем (например, импорт)
 */
function CreateOperationMenu({ onCreate, label, types, loading = false, disabled = false, children }) {
  const t = useTranslations('Operations')
  const perms = appStore.permission?.operations || {}
  const visibleTypes = CREATE_OPERATION_TYPES.filter(
    (type) => perms?.[type.perm]?.add && (!types || types.includes(type.id))
  )

  if (!visibleTypes.length && !children) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="primary-btn gap-1.5" disabled={disabled || loading}>
          <Plus size={16} />
          {label || t('page.create')}
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-xl p-1.5" align="end" sideOffset={6}>
        {visibleTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            onClick={() => onCreate(type.id)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
          >
            <OperationTypeIcon tip={type.tip} />
            <span className="text-sm font-medium text-slate-900">{t(type.label)}</span>
          </DropdownMenuItem>
        ))}

        {children && (
          <>
            {visibleTypes.length > 0 && <DropdownMenuSeparator className="my-1.5" />}
            {children}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default observer(CreateOperationMenu)
