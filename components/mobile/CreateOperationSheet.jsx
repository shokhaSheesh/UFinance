'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { TileIcon } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { appStore } from '@/store/app.store'
import { operationLook } from '@/constants/operationTypes'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Выбор типа новой операции.
 *
 * Раньше панель открывалась круглой кнопкой в центре нижней панели; теперь
 * там ассистент, а создание операции живёт в разделе «Транзакции» — рядом
 * с лентой, куда операция и попадёт.
 */

const CREATE_TYPES = [
  { type: 'income', tip: 'Поступление', label: 'modal.tabIncome', permission: 'income' },
  { type: 'payment', tip: 'Выплата', label: 'modal.tabPayment', permission: 'payout' },
  { type: 'transfer', tip: 'Перемещение', label: 'modal.tabTransfer', permission: 'transfer' },
  { type: 'accrual', tip: 'Начисление', label: 'modal.tabAccrual', permission: 'accrual' },
]

/** Типы, которые роль может создавать — по ним решают, показывать ли «+». */
export const allowedCreateTypes = () =>
  CREATE_TYPES.filter(({ permission }) => appStore.permission?.operations?.[permission]?.add)

const CreateOperationSheet = observer(({ open, onClose }) => {
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const types = allowedCreateTypes()

  return (
    <BottomSheet open={open} onClose={onClose} title={tOps('page.create')}>
      <div className="flex flex-col">
        {types.map(({ type, tip, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              onClose()
              router.push(`/m/transactions/new?type=${type}`)
            }}
            className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
          >
            <TileIcon icon={operationLook(tip).icon} tone={operationLook(tip).tone} />
            <span className="text-sm font-semibold text-slate-900">{tOps(label)}</span>
          </button>
        ))}
        {types.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">{tOps('page.noCreatePermission')}</p>
        )}
      </div>
    </BottomSheet>
  )
})

export default CreateOperationSheet
