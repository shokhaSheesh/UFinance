'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { sealDeal } from '@/store/saleDeal.store'
import { keepPreviousData } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Package,
  Receipt,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

/**
 * Сделка на телефоне.
 *
 * На большом экране у сделки четыре вкладки с таблицами. Здесь сверху
 * деньги сделки — сумма, поступило, отгружено, прибыль, — а ниже один
 * список, который переключается между товарами, поступлениями и
 * расходами: на 390 точках две таблицы рядом всё равно не показать.
 */

/** Полоска хода сделки. */
const Progress = ({ label, value, total, tone }) => {
  const percent = total ? Math.min((Math.abs(value) / Math.abs(total)) * 100, 100) : 0
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-slate-400">{label}</span>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">{Math.round(percent)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** Строка «подпись — значение». */
const Line = ({ label, value, valueClass }) => {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className={cn('min-w-0 text-right text-[14px] font-medium text-slate-900', valueClass)}>{value}</span>
    </div>
  )
}

const MobileDealPage = observer(() => {
  const t = useTranslations('Deals.detail')
  const tm = useTranslations('Mobile')
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const dealId = params?.id

  const [tab, setTab] = useState('products')

  const { data: deal, isLoading } = useUcodeRequestQuery({
    method: 'get_sales_transaction_by_guid',
    data: { guid: dealId },
    skip: !dealId,
    querySetting: { select: (response) => response?.data?.data, placeholderData: keepPreviousData },
  })

  // Товары сделки
  const { data: products } = useUcodeRequestQuery({
    queryKey: 'products_services_list',
    method: 'list_products_and_services',
    data: { sales_transactions_id: dealId, page: 1, limit: 50 },
    skip: !dealId || tab !== 'products',
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  // Поступления и расходы по сделке — тот же запрос, что в ленте операций
  const { data: incomeOps } = useUcodeRequestQuery({
    method: 'list_operations_by_query',
    data: { sales_transactions_id: dealId, tip: ['Поступление'], page: 1, limit: 50 },
    skip: !dealId || tab !== 'income',
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const { data: expenseOps } = useUcodeRequestQuery({
    method: 'list_operations_by_query',
    data: { sales_transactions_id: dealId, tip: ['Выплата', 'Начисление'], page: 1, limit: 50 },
    skip: !dealId || tab !== 'expense',
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const accounting = sealDeal.accounting
  const method = accounting === 'accrual' ? deal?.accrual_method : deal?.cash_method

  const amount = Number(deal?.total_products_summa) || 0
  const received = Number(deal?.total_receipts_summa) || 0
  const shipped = Number(deal?.total_shipment_summa) || 0
  const profit = Number(method?.profit) || 0
  const profitability = Math.round(Number(method?.profitability)) || 0

  const currency = mounted ? GlobalCurrency?.name : ''

  const tabs = [
    { key: 'products', label: t('tabs.products'), icon: Package },
    { key: 'income', label: t('tabs.receipts'), icon: ArrowDownLeft },
    { key: 'expense', label: t('tabs.expenses'), icon: ArrowUpRight },
  ]

  const operations = useMemo(
    () => operationsDto(tab === 'income' ? incomeOps || [] : expenseOps || []),
    [tab, incomeOps, expenseOps]
  )

  if (isLoading && !deal) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={deal?.name || t('noName')} onBack={() => router.push('/m/deals')} />

      {/* Деньги сделки */}
      <MCard>
        <div className="text-[12px] text-slate-500">{tm('deals.amount')}</div>
        <div className="mt-1 text-[30px] leading-none font-bold tracking-[-0.02em] text-slate-900">
          <Money value={amount} currency={currency} />
        </div>

        <div className="mt-4 flex gap-3">
          <Progress label={tm('deals.received')} value={received} total={amount} tone="bg-emerald-500" />
          <Progress label={tm('deals.shipped')} value={shipped} total={amount} tone="bg-[#0e73f6]" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-[13px] text-slate-500">{tm('deals.profit')}</span>
          <span
            className={cn(
              'text-[17px] font-bold tabular-nums',
              profit >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            <Money value={profit} currency={currency} />
            <span className="ml-1.5 text-[12px] font-semibold text-slate-400">{profitability}%</span>
          </span>
        </div>
      </MCard>

      {/* Подробности сделки */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('detail.details')}</div>
      <MCard list>
        <Line label={tOps('columns.counterparty')} value={deal?.counterparties_name} />
        <Line label={tm('deals.status')} value={deal?.status?.name || deal?.status} />
        <Line
          label={tm('deals.date')}
          value={deal?.sale_date ? moment(deal.sale_date).format('D MMMM YYYY') : null}
        />
        <Line label={tm('deals.clientDebt')} value={<Money value={Number(deal?.client_debt) || 0} currency={currency} />} />
        <Line
          label={tm('deals.remainingShipment')}
          value={<Money value={Number(deal?.remaining_shipment) || 0} currency={currency} />}
        />
        <Line label={tm('detail.purpose')} value={deal?.commentary} />
      </MCard>

      {/* Что внутри сделки */}
      <div className="mt-6 flex rounded-2xl bg-white p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-xl py-2.5 text-[13px] font-semibold',
              tab === item.key ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
            )}
          >
            <item.icon size={15} aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-2.5">
        {tab === 'products' && (
          <MCard list>
            {(products || []).length === 0 && <MEmpty icon={Package} title={tm('deals.noProducts')} />}
            {(products || []).map((product) => (
              <div
                key={product.guid}
                className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Package size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-slate-900">
                    {product?.product_and_service_name || product?.Naimenovanie}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                    {[product?.Kol_vo, product?.unit_name].filter(Boolean).join(' ')}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-slate-900">
                  <Money value={product?.Summa ?? product?.summa} currency={currency} />
                </span>
              </div>
            ))}
          </MCard>
        )}

        {(tab === 'income' || tab === 'expense') && (
          <MCard list>
            {operations.length === 0 && <MEmpty icon={Receipt} title={tm('deals.noOperations')} />}
            {operations.map((operation) => {
              const isIncome = operation.operationType === 'income'
              return (
                <button
                  key={operation.guid}
                  type="button"
                  onClick={() => router.push(`/m/transactions/${operation.guid}`)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    )}
                  >
                    {isIncome ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
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
                      isIncome ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    <Money
                      value={operation.summa}
                      currency={operation.currency || currency}
                      sign={isIncome ? '+' : '−'}
                    />
                  </span>
                </button>
              )
            })}
          </MCard>
        )}
      </div>
    </div>
  )
})

export default MobileDealPage
