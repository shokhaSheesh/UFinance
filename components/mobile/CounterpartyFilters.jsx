'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MDateField, MMultiSelectField } from '@/components/mobile/fields'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { authStore } from '@/store/auth.store'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Фильтры карточки контрагента на телефоне.
 *
 * Те же, что над операциями контрагента на компьютере: период, юрлица,
 * статьи, сделки продаж и сделки закупок. Они уходят в тот же запрос
 * get_counterparty_by_id, поэтому меняют и долг, и обороты, и ленту.
 * Период — готовыми вариантами и своими датами: «этот месяц» на телефоне
 * выбирают чаще, чем две даты в календаре.
 */

export const EMPTY_COUNTERPARTY_FILTERS = {
  start: '',
  end: '',
  legalEntities: [],
  chartOfAccounts: [],
  deals: [],
  purchaseDeals: [],
}

/** Сколько фильтров включено — для значка на кнопке. */
export const countCounterpartyFilters = (filters) =>
  (filters.start || filters.end ? 1 : 0) +
  (filters.legalEntities.length ? 1 : 0) +
  (filters.chartOfAccounts.length ? 1 : 0) +
  (filters.deals.length ? 1 : 0) +
  (filters.purchaseDeals.length ? 1 : 0)

const PRESETS = [
  { key: 'allTime', range: () => ({ start: '', end: '' }) },
  {
    key: 'thisMonth',
    range: () => ({ start: moment().startOf('month').format('YYYY-MM-DD'), end: moment().endOf('month').format('YYYY-MM-DD') }),
  },
  {
    key: 'lastMonth',
    range: () => ({
      start: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      end: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
    }),
  },
  {
    key: 'thisYear',
    range: () => ({ start: moment().startOf('year').format('YYYY-MM-DD'), end: moment().endOf('year').format('YYYY-MM-DD') }),
  },
]

/** Статьи плана счетов плоским списком с путём в подписи. */
const flattenArticles = (nodes = [], path = []) =>
  nodes.flatMap((node) => {
    const children = node?.children || []
    const here = node?.guid ? [{ value: node.guid, label: node.nazvanie, sub: path.join(' · ') }] : []
    return [...here, ...flattenArticles(children, [...path, node?.nazvanie])]
  })

export default function CounterpartyFilters({ open, ...props }) {
  if (!open) return null
  return <FiltersSheet {...props} />
}

function FiltersSheet({ onClose, filters, onApply }) {
  const tf = useTranslations('filters')
  const tm = useTranslations('Mobile')
  const [draft, setDraft] = useState(filters)

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }))

  const { data: entities = [], isLoading: loadingEntities } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: chart = [], isLoading: loadingChart } = useUcodeRequestQuery({
    method: 'get_chart_of_accounts',
    data: { page: 1, limit: 100, search: '' },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 30 },
  })
  const { data: sales = [], isLoading: loadingSales } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: purchases = [], isLoading: loadingPurchases } = useUcodeRequestQuery({
    method: 'get_purchase_list',
    data: { page: 1, limit: 100, branch_id: authStore.branch_id },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const entityOptions = useMemo(() => entities.map((item) => ({ value: item.guid, label: item.nazvanie })), [entities])
  const articleOptions = useMemo(() => flattenArticles(chart), [chart])
  const saleOptions = useMemo(
    () => sales.map((item) => ({ value: item.guid, label: item.name || item.nazvanie, sub: item.counterparty_name })),
    [sales]
  )
  const purchaseOptions = useMemo(
    () => purchases.map((item) => ({ value: item.guid, label: item.name, sub: item.counterparty_name })),
    [purchases]
  )

  const activePreset = PRESETS.find((preset) => {
    const range = preset.range()
    return range.start === draft.start && range.end === draft.end
  })?.key

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={tf('openFilters')}
      className="h-[88vh]"
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_COUNTERPARTY_FILTERS)}
            className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700 active:bg-slate-200"
          >
            {tf('reset')}
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
            className="h-12 flex-1 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4]"
          >
            {tm('filters.apply')}
          </button>
        </div>
      }
    >
      <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{tf('period')}</div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, ...preset.range() }))}
            className={cn(
              'rounded-full px-3.5 py-2 text-[13px] font-semibold',
              activePreset === preset.key ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {tm(`counterparties.${preset.key}`)}
          </button>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 [&>button]:bg-slate-50">
        <MDateField label={tm('counterparties.dateFrom')} value={draft.start} onChange={(value) => set('start', value)} />
        <MDateField label={tm('counterparties.dateTo')} value={draft.end} onChange={(value) => set('end', value)} />
      </div>

      <div className="pt-6 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{tf('parameters')}</div>
      <div className="mt-2.5 flex flex-col gap-2 [&>button]:bg-slate-50">
        <MMultiSelectField
          label={tf('legalEntities')}
          value={draft.legalEntities}
          options={entityOptions}
          loading={loadingEntities}
          onChange={(value) => set('legalEntities', value)}
        />
        <MMultiSelectField
          label={tf('chartOfAccounts')}
          value={draft.chartOfAccounts}
          options={articleOptions}
          loading={loadingChart}
          onChange={(value) => set('chartOfAccounts', value)}
        />
        <MMultiSelectField
          label={tf('deals')}
          value={draft.deals}
          options={saleOptions}
          loading={loadingSales}
          onChange={(value) => set('deals', value)}
        />
        <MMultiSelectField
          label={tf('purchaseDeals')}
          value={draft.purchaseDeals}
          options={purchaseOptions}
          loading={loadingPurchases}
          onChange={(value) => set('purchaseDeals', value)}
        />
      </div>
    </BottomSheet>
  )
}
