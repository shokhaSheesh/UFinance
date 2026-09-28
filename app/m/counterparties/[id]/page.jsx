'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Loader2,
  PackageCheck,
  Receipt,
  Scale,
  Truck,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

/**
 * Контрагент на телефоне.
 *
 * Сверху — сколько он должен нам или мы ему, ниже реквизиты и лента его
 * операций. Фильтры по периоду и статьям остаются на большом экране: в
 * дороге открывают карточку, чтобы позвонить и свериться по долгу.
 */

const TYPE_LOOK = {
  Поступление: { icon: ArrowDownLeft, tone: 'bg-emerald-50 text-emerald-600' },
  Выплата: { icon: ArrowUpRight, tone: 'bg-red-50 text-red-600' },
  Перемещение: { icon: ArrowLeftRight, tone: 'bg-slate-100 text-slate-500' },
  Начисление: { icon: Scale, tone: 'bg-slate-100 text-slate-500' },
  Отгрузка: { icon: Truck, tone: 'bg-slate-100 text-slate-500' },
  Поставка: { icon: PackageCheck, tone: 'bg-slate-100 text-slate-500' },
}

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

const MobileCounterpartyPage = observer(() => {
  const t = useTranslations('Directories.counterparty')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const guid = params?.id

  const { data, isLoading } = useUcodeRequestQuery({
    method: 'get_counterparty_by_id',
    data: { counterparty_id: guid, guid, page: 1 },
    skip: !guid,
    querySetting: { select: (response) => response?.data?.data, refetchOnWindowFocus: false },
  })

  const counterparty = data?.counterparty || null
  const summary = data?.summary || null
  const operations = useMemo(() => operationsDto(data?.operations || []), [data])

  const receivable = Number(counterparty?.debitorka) || 0
  const payable = Number(counterparty?.kreditorka) || 0
  const balance = receivable - payable
  const currency = mounted ? GlobalCurrency?.name : ''

  if (isLoading && !counterparty) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={counterparty?.nazvanie || tm('counterparties.noName')}
        onBack={() => router.push('/m/counterparties')}
      />

      {/* Долг: кто кому и сколько */}
      <MCard>
        <div className="text-[12px] text-slate-500">
          {balance > 0
            ? tm('counterparties.owesUs')
            : balance < 0
              ? tm('counterparties.weOwe')
              : tm('counterparties.settled')}
        </div>
        <div
          className={cn(
            'mt-1 text-[30px] leading-none font-bold tracking-[-0.02em]',
            balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-900'
          )}
        >
          <Money value={Math.abs(balance)} currency={currency} />
        </div>

        <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-3">
          <div className="min-w-0 pr-3">
            <div className="truncate text-[11px] text-slate-400">{tm('home.receivables')}</div>
            <div className="mt-1 truncate text-[14px] font-bold tabular-nums text-emerald-600">
              <Money value={receivable} currency="" />
            </div>
          </div>
          <div className="min-w-0 pl-3">
            <div className="truncate text-[11px] text-slate-400">{tm('home.payables')}</div>
            <div className="mt-1 truncate text-[14px] font-bold tabular-nums text-red-600">
              <Money value={payable} currency="" />
            </div>
          </div>
        </div>
      </MCard>

      {/* Обороты за период */}
      {summary && (
        <>
          <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('home.period')}</div>
          <MCard list>
            <Line label={tm('reports.receipts')} value={<Money value={summary?.incoming ?? 0} currency={currency} />} />
            <Line label={tm('reports.payments')} value={<Money value={summary?.outgoing ?? 0} currency={currency} />} />
            <Line
              label={tm('home.profit')}
              value={<Money value={summary?.profit ?? 0} currency={currency} sign={summary?.profit > 0 ? '+' : undefined} />}
            />
          </MCard>
        </>
      )}

      {/* Реквизиты */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('detail.details')}</div>
      <MCard list>
        <Line label={t('fields.fullName')} value={counterparty?.polnoe_imya} />
        <Line label={t('fields.group')} value={counterparty?.group_name} />
        <Line label={t('fields.inn')} value={counterparty?.inn} />
        <Line label={tm('profile.phone')} value={counterparty?.telefon || counterparty?.phone} />
        <Line label={t('fields.address')} value={counterparty?.address} />
        <Line label={t('fields.bank')} value={counterparty?.bank} />
        <Line label={t('fields.accountNumber')} value={counterparty?.nomer_scheta || counterparty?.account_number} />
        <Line label={t('fields.comment')} value={counterparty?.komentariy} />
      </MCard>

      {/* Операции контрагента */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('home.recent')}</div>
      <MCard list>
        {operations.length === 0 && <MEmpty icon={Receipt} title={tm('deals.noOperations')} />}
        {operations.slice(0, 30).map((operation) => {
          const look = TYPE_LOOK[operation.tip] || TYPE_LOOK['Начисление']
          const isIncome = operation.operationType === 'income'
          const isPayment = operation.operationType === 'payment'
          return (
            <button
              key={operation.guid}
              type="button"
              onClick={() => router.push(`/m/transactions/${operation.guid}`)}
              className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', look.tone)}>
                <look.icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-slate-900">
                  {operation.chartOfAccounts || operation.tip}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                  {[operation.my_account_name, operation.operationDate].filter(Boolean).join(' · ')}
                </span>
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

export default MobileCounterpartyPage
