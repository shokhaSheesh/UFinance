'use client'

import { MCard, MRow, MScreenHeader, TileIcon } from '@/components/mobile/ui'
import BottomSheet from '@/components/mobile/BottomSheet'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useDeleteOperation } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Copy,
  Loader2,
  PackageCheck,
  Pencil,
  Scale,
  Trash2,
  Truck,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'

/**
 * Операция целиком — отдельный экран.
 *
 * В списке у строки помещаются три вещи: тип, контрагент и сумма. Всё
 * остальное — счёт, статья, сделка, даты, подтверждения, назначение —
 * живёт здесь, строками «подпись слева, значение справа», как в выписке
 * банковского приложения. Действия внизу, а не в меню из трёх точек.
 */

const TYPE_LOOK = {
  Поступление: { icon: ArrowDownLeft, tone: 'in' },
  Выплата: { icon: ArrowUpRight, tone: 'out' },
  Перемещение: { icon: ArrowLeftRight, tone: 'neutral' },
  Начисление: { icon: Scale, tone: 'neutral' },
  Отгрузка: { icon: Truck, tone: 'neutral' },
  Поставка: { icon: PackageCheck, tone: 'neutral' },
}

/** Строка «подпись — значение». Пустые значения не показываем. */
const Line = ({ label, value }) => {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-medium text-slate-900">{value}</span>
    </div>
  )
}

/** Подтверждено или нет — словами и цветом, а не одной галочкой. */
const StatusChip = ({ ok, labelOn, labelOff }) => (
  <span
    className={cn(
      'rounded-full px-2.5 py-1 text-[12px] font-semibold',
      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    )}
  >
    {ok ? labelOn : labelOff}
  </span>
)

const MobileOperationPage = observer(() => {
  const t = useTranslations('Operations')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const guid = params?.guid
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: operation, isLoading } = useQuery({
    queryKey: ['get_operation', guid],
    queryFn: () => apiClient.invokeFunction({ method: 'get_operation', data: { guid } }),
    select: (response) => operationDto(response?.data?.data),
    enabled: Boolean(guid),
  })

  const deleteOperation = useDeleteOperation()
  const permissions = appStore.permission?.operations || {}
  const permissionKey = {
    Поступление: 'income',
    Выплата: 'payout',
    Перемещение: 'transfer',
    Начисление: 'accrual',
    Отгрузка: 'shipment',
    Поставка: 'shipment',
  }[operation?.tip]
  const can = (action) => Boolean(permissions?.[permissionKey]?.[action])

  const remove = async () => {
    await deleteOperation.mutateAsync({ guid })
    queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
    queryClient.invalidateQueries({ queryKey: ['get_operations_total'] })
    router.push('/m/transactions')
  }

  const look = TYPE_LOOK[operation?.tip] || TYPE_LOOK['Начисление']
  const isIncome = operation?.operationType === 'income'
  const isPayment = operation?.operationType === 'payment'
  const currency = operation?.currency || GlobalCurrency?.name

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={operation?.tip || tm('tabs.transactions')} onBack={() => router.back()} />

      {/* Сумма и стороны операции */}
      <MCard className="flex flex-col items-center gap-2 text-center">
        <TileIcon icon={look.icon} tone={look.tone} className="h-12 w-12" />
        <div
          className={cn(
            'text-[30px] leading-none font-bold tracking-[-0.02em]',
            isIncome ? 'text-emerald-600' : isPayment ? 'text-red-600' : 'text-slate-900'
          )}
        >
          <Money value={operation?.summa} currency={currency} sign={isIncome ? '+' : isPayment ? '−' : ''} />
        </div>
        <div className="text-[13px] text-slate-500">{operation?.operationDate}</div>
        {operation?.counterparty && (
          <div className="text-[15px] font-semibold text-slate-900">{operation.counterparty}</div>
        )}
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <StatusChip
            ok={operation?.payment_confirmed}
            labelOn={tm('detail.paid')}
            labelOff={tm('detail.notPaid')}
          />
          <StatusChip
            ok={operation?.payment_accrual}
            labelOn={tm('detail.accrued')}
            labelOff={tm('detail.notAccrued')}
          />
        </div>
      </MCard>

      {/* Подробности */}
      <MCard list className="mt-2.5">
        <Line label={t('columns.account')} value={operation?.my_account_name} />
        <Line label={tm('form.toAccount')} value={operation?.my_account_name2} />
        <Line label={t('columns.statya')} value={operation?.chartOfAccounts} />
        <Line label={tm('form.creditArticle')} value={operation?.chartOfAccounts2} />
        <Line
          label={t('columns.deal')}
          value={operation?.sales_transaction_name || operation?.selling_deal_name || operation?.purchase_transaction_name}
        />
        <Line label={t('columns.project')} value={operation?.projectName} />
        <Line label={tm('detail.accrualDate')} value={operation?.accrualDate} />
        <Line label={t('columns.paymentType')} value={operation?.paymentType} />
        <Line label={tm('detail.purpose')} value={operation?.opisanie || operation?.comment} />
      </MCard>

      {/* Действия */}
      <MCard list className="mt-2.5">
        {can('edit') && (
          <MRow
            icon={Pencil}
            title={tc('edit')}
            onClick={() => router.push(`/m/transactions/new?guid=${guid}`)}
          />
        )}
        {can('add') && (
          <MRow
            icon={Copy}
            title={tc('copy')}
            onClick={() => router.push(`/m/transactions/new?type=${operation?.operationType}&copy=${guid}`)}
          />
        )}
        {can('delete') && (
          <MRow icon={Trash2} tone="out" title={tc('delete')} onClick={() => setConfirmDelete(true)} />
        )}
      </MCard>

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('deleteModal.title')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={deleteOperation.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteOperation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{t('deleteModal.confirmation')}</p>
      </BottomSheet>
    </div>
  )
})

export default MobileOperationPage
