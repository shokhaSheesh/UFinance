'use client'

import { MOBILE_OPERATION_TYPES } from '@/constants/operationTypes'
import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard, TileIcon } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useDeleteOperation } from '@/hooks/useDashboard'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'

/**
 * Операция целиком — экран выписки.
 *
 * Сверху сумма со знаком и с кем операция: это то, ради чего строку
 * открывают. Под ней два действия, дальше — состояние (оплачено ли,
 * начислено ли) и подробности группами «подпись — значение». Удаление
 * убрано под «…»: рядом с обычными действиями его слишком легко нажать.
 */

// Вид типов на телефоне: цвет только у поступления и выплаты (constants/operationTypes.js)
const TYPE_LOOK = MOBILE_OPERATION_TYPES

/** Строка «подпись — значение». Пустые значения не показываем. */
const Line = ({ label, value, valueClass }) => {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className={cn('min-w-0 text-right text-[14px] font-medium text-slate-900', valueClass)}>{value}</span>
    </div>
  )
}

/** Заголовок группы строк. */
const GroupTitle = ({ children }) => (
  <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{children}</div>
)

/** Действие рядом с суммой: небольшая кнопка-«таблетка». */
const ActionPill = ({ icon: Icon, label, onClick, primary = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold',
      primary ? 'bg-[#0e73f6] text-white active:bg-[#0b5fd4]' : 'bg-white text-slate-700 active:bg-slate-100'
    )}
  >
    <Icon size={16} aria-hidden="true" />
    {label}
  </button>
)

const MobileOperationPage = observer(() => {
  const t = useTranslations('Operations')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const guid = params?.guid

  const [moreOpen, setMoreOpen] = useState(false)
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
      {/* Назад и «ещё» */}
      <div className="flex h-10 items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={tc('back')}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 active:bg-slate-200"
        >
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
        {can('delete') && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label={tm('detail.more')}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 active:bg-slate-200"
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Сумма и с кем операция */}
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <div
            className={cn(
              'text-[32px] leading-none font-bold tracking-[-0.02em]',
              isIncome ? 'text-emerald-600' : isPayment ? 'text-red-600' : 'text-slate-900'
            )}
          >
            <Money value={operation?.summa} currency={currency} sign={isIncome ? '+' : isPayment ? '−' : ''} />
          </div>
          <div className="mt-2 truncate text-[15px] font-semibold text-slate-900">
            {operation?.counterparty || operation?.tip}
          </div>
          <div className="mt-0.5 text-[13px] text-slate-500">
            {[operation?.tip, operation?.operationDate].filter(Boolean).join(' · ')}
          </div>
        </div>
        <TileIcon icon={look.icon} tone={look.tone} className="h-12 w-12" />
      </div>

      {/* Действия */}
      <div className="flex gap-2 pt-4">
        {can('edit') && (
          <ActionPill
            primary
            icon={Pencil}
            label={tc('edit')}
            onClick={() => router.push(`/m/transactions/new?guid=${guid}`)}
          />
        )}
        {can('add') && (
          <ActionPill
            icon={Copy}
            label={tc('copy')}
            onClick={() => router.push(`/m/transactions/new?type=${operation?.operationType}&copy=${guid}`)}
          />
        )}
      </div>

      {/* Состояние */}
      <GroupTitle>{tm('detail.status')}</GroupTitle>
      <MCard list>
        <Line
          label={tm('detail.payment')}
          value={operation?.payment_confirmed ? tm('detail.paid') : tm('detail.notPaid')}
          valueClass={operation?.payment_confirmed ? 'text-emerald-600' : 'text-amber-600'}
        />
        <Line
          label={tm('detail.accrual')}
          value={operation?.payment_accrual ? tm('detail.accrued') : tm('detail.notAccrued')}
          valueClass={operation?.payment_accrual ? 'text-emerald-600' : 'text-amber-600'}
        />
        <Line label={tm('detail.accrualDate')} value={operation?.accrualDate} />
      </MCard>

      {/* Подробности */}
      <GroupTitle>{tm('detail.details')}</GroupTitle>
      <MCard list>
        <Line label={t('columns.account')} value={operation?.my_account_name} />
        <Line label={tm('form.toAccount')} value={operation?.my_account_name2} />
        <Line label={t('columns.statya')} value={operation?.chartOfAccounts} />
        <Line label={tm('form.creditArticle')} value={operation?.chartOfAccounts2} />
        <Line
          label={t('columns.deal')}
          value={
            operation?.sales_transaction_name || operation?.selling_deal_name || operation?.purchase_transaction_name
          }
        />
        <Line label={t('columns.project')} value={operation?.projectName} />
        <Line label={t('columns.paymentType')} value={operation?.paymentType} />
        <Line label={tm('detail.purpose')} value={operation?.opisanie || operation?.comment} />
      </MCard>

      {/* Кто и когда завёл */}
      {(operation?.createdAt || operation?.legal_entity_name) && (
        <>
          <GroupTitle>{tm('detail.service')}</GroupTitle>
          <MCard list>
            <Line label={tm('detail.legalEntity')} value={operation?.legal_entity_name} />
            <Line
              label={tm('detail.created')}
              value={operation?.createdAt ? moment(operation.createdAt).format('D MMMM YYYY, HH:mm') : null}
            />
          </MCard>
        </>
      )}

      {/* «Ещё»: здесь живёт удаление */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={tm('detail.more')}>
        <div className="flex flex-col">
          {can('delete') && (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                setConfirmDelete(true)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <TileIcon icon={Trash2} tone="out" />
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

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
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-[13px] text-slate-500">{t('columns.amount')}</span>
          <Money value={operation?.summa} currency={currency} className="text-[15px] font-bold text-slate-900" />
        </div>
      </BottomSheet>
    </div>
  )
})

export default MobileOperationPage
