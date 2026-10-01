'use client'

import { MOBILE_OPERATION_TYPES } from '@/constants/operationTypes'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { keepPreviousData } from '@tanstack/react-query'
import {
  Landmark,
  Loader2,
  Receipt,
} from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

/**
 * Счёт: остаток, реквизиты и его операции.
 *
 * На телефоне счёт открывают ради двух вещей — сколько на нём сейчас и
 * что по нему проходило. Реквизиты нужны реже, поэтому стоят между ними
 * строками «подпись — значение».
 */

// Значок счёта один для всех типов, фирменный синий — как на главной
// и у кнопки «Создать счёт»; тип подписан под названием
const ACCOUNT_LOOK = { icon: Landmark, tone: 'bg-[#e8f1ff] text-[#0e73f6]' }

// Вид типов на телефоне: цвет только у поступления и выплаты (constants/operationTypes.js)
const OPERATION_LOOK = MOBILE_OPERATION_TYPES

/** Строка «подпись — значение». */
const Line = ({ label, value }) => {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-medium text-slate-900">{value}</span>
    </div>
  )
}

const MobileAccountPage = observer(() => {
  const t = useTranslations('Directories.account')
  const tm = useTranslations('Mobile')
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const guid = params?.id

  // Отдельного «получить счёт» в API нет — берём его из того же списка
  const { data: accountsData, isLoading } = useUcodeRequestQuery({
    method: 'get_my_accounts',
    data: {
      groupBy: 'legal_entities',
      page: 1,
      limit: 100,
      beznalichnye: true,
      elektronnye: true,
      kartaFizlica: true,
      nalichnye: true,
      active: true,
    },
    querySetting: { select: (response) => response?.data, placeholderData: keepPreviousData },
  })

  const account = useMemo(() => {
    const groups = appStore.filterAllowedAccountGroups(accountsData?.data || [])
    return groups.flatMap((group) => group?.children || []).find((item) => item?.guid === guid) || null
  }, [accountsData, guid])

  const { data: operationsData } = useUcodeRequestQuery({
    method: 'list_operations_by_query',
    data: { my_accounts_id: guid, page: 1, limit: 30 },
    skip: !guid,
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const operations = useMemo(() => operationsDto(operationsData || []), [operationsData])

  const type = Array.isArray(account?.tip) ? account.tip[0] : account?.tip
  const look = ACCOUNT_LOOK
  const balance = Number(account?.balans_val) || 0
  const currency = account?.currenies_kod || (mounted ? GlobalCurrency?.name : '')

  if (isLoading && !account) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={account?.nazvanie || t('pageTitle')} onBack={() => router.push('/m/accounts')} />

      {/* Остаток */}
      <MCard className="flex flex-col items-center gap-2 text-center">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-full', look.tone)}>
          <look.icon size={20} aria-hidden="true" />
        </span>
        <div
          className={cn(
            'text-[30px] leading-none font-bold tracking-[-0.02em]',
            balance < 0 ? 'text-red-600' : 'text-slate-900'
          )}
        >
          <Money value={balance} currency={currency} />
        </div>
        <div className="text-[13px] text-slate-500">{type}</div>
      </MCard>

      {/* Реквизиты */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('detail.details')}</div>
      <MCard list>
        <Line label={t('fields.legalEntity')} value={account?.legal_entity_name} />
        <Line label={t('fields.accountNumber')} value={account?.nomer_scheta} />
        <Line label={t('fields.bank')} value={account?.bank_name} />
        <Line label={t('fields.bik')} value={account?.bik} />
        <Line label={t('fields.comment')} value={account?.komentariy} />
      </MCard>

      {/* Операции по счёту */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('accounts.operations')}</div>
      <MCard list>
        {operations.length === 0 && <MEmpty icon={Receipt} title={tOps('page.noData')} />}
        {operations.map((operation) => {
          const mobileOperationLook = OPERATION_LOOK[operation.tip] || OPERATION_LOOK['Начисление']
          const isIncome = operation.operationType === 'income'
          const isPayment = operation.operationType === 'payment'
          return (
            <button
              key={operation.guid}
              type="button"
              onClick={() => router.push(`/m/transactions/${operation.guid}`)}
              className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', mobileOperationLook.tone)}>
                <mobileOperationLook.icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-slate-900">
                  {operation.counterparty || operation.chartOfAccounts}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-slate-500">{operation.operationDate}</span>
              </span>
              <span
                className={cn(
                  'shrink-0 text-[15px] font-semibold tabular-nums',
                  isIncome ? 'text-emerald-600' : isPayment ? 'text-red-600' : 'text-slate-900'
                )}
              >
                <Money
                  value={operation.summa}
                  currency={operation.currency || currency}
                  sign={isIncome ? '+' : isPayment ? '−' : ''}
                />
              </span>
            </button>
          )
        })}
      </MCard>
    </div>
  )
})

export default MobileAccountPage
