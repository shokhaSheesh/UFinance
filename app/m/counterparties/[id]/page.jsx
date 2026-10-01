'use client'

import { MOBILE_OPERATION_TYPES } from '@/constants/operationTypes'
import CounterpartyFilters, {
  countCounterpartyFilters,
  EMPTY_COUNTERPARTY_FILTERS,
} from '@/components/mobile/CounterpartyFilters'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Receipt,
  SlidersHorizontal,
  X,
} from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import moment from 'moment'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

/**
 * Контрагент на телефоне.
 *
 * Сверху — сколько он должен нам или мы ему, с дебиторкой и кредиторкой
 * отдельно, ниже обороты по выбранному методу учёта (те же три, что на
 * компьютере), реквизиты и лента операций. Фильтры — те же, что на
 * компьютере (период, юрлица, статьи, сделки), панелью снизу.
 */

/** Методы расчёта — те же значения, что у переключателя на компьютере. */
const METHODS = [
  { value: 'Cashflow', label: 'calculationShort.cashflow' },
  { value: 'Cash', label: 'calculationShort.cash' },
  { value: 'Calculation', label: 'calculationShort.calculation' },
]

// Вид типов на телефоне: цвет только у поступления и выплаты (constants/operationTypes.js)
const TYPE_LOOK = MOBILE_OPERATION_TYPES

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
  const tl = useTranslations('Directories.counterparty.list')
  const tm = useTranslations('Mobile')
  const tf = useTranslations('filters')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const guid = params?.id
  const [method, setMethod] = useState('Cashflow')
  const isCashflow = method === 'Cashflow'
  const [filters, setFilters] = useState(EMPTY_COUNTERPARTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = countCounterpartyFilters(filters)

  // Тот же запрос, что у страницы контрагента на компьютере — цифры совпадут
  const { data, isLoading } = useUcodeRequestQuery({
    method: 'get_counterparty_by_id',
    data: {
      guid,
      operationDateStart: filters.start,
      operationDateEnd: filters.end,
      calculationMethod: method,
      legal_entity_ids: filters.legalEntities,
      chartOfAccountsIds: filters.chartOfAccounts,
      sellingDealId: filters.deals,
      purchaseDealId: filters.purchaseDeals,
      page: 1,
    },
    skip: !guid,
    querySetting: {
      select: (response) => response?.data?.data,
      refetchOnWindowFocus: false,
      placeholderData: (previous) => previous,
    },
  })

  const counterparty = data?.counterparty || null
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
        action={
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={tf('openFilters')}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full',
              activeFilters ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
            )}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {activeFilters > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#f4f5f7] bg-red-500 px-1 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        }
      />

      {/* Включённые фильтры — видно сразу, за какой период и по чему цифры */}
      {activeFilters > 0 && (
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          {(filters.start || filters.end) && (
            <span className="rounded-full bg-[#e8f1ff] px-3 py-1.5 text-[12px] font-semibold text-[#0e73f6]">
              {[filters.start, filters.end].map((date) => (date ? moment(date).format('DD.MM.YY') : '…')).join(' — ')}
            </span>
          )}
          {[
            ['legalEntities', tf('legalEntities')],
            ['chartOfAccounts', tf('chartOfAccounts')],
            ['deals', tf('deals')],
            ['purchaseDeals', tf('purchaseDeals')],
          ]
            .filter(([key]) => filters[key].length)
            .map(([key, label]) => (
              <span key={key} className="rounded-full bg-[#e8f1ff] px-3 py-1.5 text-[12px] font-semibold text-[#0e73f6]">
                {label} · {filters[key].length}
              </span>
            ))}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_COUNTERPARTY_FILTERS)}
            aria-label={tf('clearAll')}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

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
            <div className="truncate text-[12px] font-semibold text-slate-700">{t('detail.stats.receivables')}</div>
            <div className="mt-1 truncate text-[16px] font-bold tabular-nums text-emerald-600">
              <Money value={receivable} currency="" />
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">
              {receivable ? tl('kpi.receivablesHint') : t('detail.stats.noDebt')}
            </div>
          </div>
          <div className="min-w-0 pl-3">
            <div className="truncate text-[12px] font-semibold text-slate-700">{t('detail.stats.payables')}</div>
            <div className="mt-1 truncate text-[16px] font-bold tabular-nums text-red-600">
              <Money value={payable} currency="" />
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">
              {payable ? tl('kpi.payablesHint') : t('detail.stats.noDebt')}
            </div>
          </div>
        </div>
      </MCard>

      {/* Обороты по методу учёта — как пять карточек на компьютере */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tl('methodLabel')}</div>
      <div className="flex rounded-2xl bg-white p-1">
        {METHODS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMethod(item.value)}
            aria-pressed={method === item.value}
            className={cn(
              'min-w-0 flex-1 truncate rounded-xl px-1 py-2.5 text-[12px] font-semibold',
              method === item.value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
            )}
          >
            {tl(item.label)}
          </button>
        ))}
      </div>
      <MCard list className="mt-2.5">
        <Line
          label={isCashflow ? t('detail.stats.receipts') : t('detail.stats.income')}
          value={<Money value={Number(counterparty?.income) || 0} currency={currency} />}
        />
        <Line
          label={isCashflow ? t('detail.stats.payments') : t('detail.stats.expenses')}
          value={<Money value={Number(counterparty?.expense) || 0} currency={currency} />}
        />
        <Line
          label={isCashflow ? t('detail.stats.difference') : t('detail.stats.profit')}
          value={
            <span className={cn(Number(counterparty?.difference) < 0 ? 'text-red-600' : 'text-slate-900')}>
              <Money value={Number(counterparty?.difference) || 0} currency={currency} />
            </span>
          }
        />
      </MCard>

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

      <CounterpartyFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
})

export default MobileCounterpartyPage
