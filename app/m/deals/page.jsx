'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { DEAL_KINDS } from '@/components/mobile/deals/dealKinds'
import DealFormSheet from '@/components/mobile/forms/DealFormSheet'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { DealIcon } from '@/constants/icons'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestInfinite, useUcodeRequestMutation } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { formatDeals } from '@/modules/deals/deals-list'
import { formatPurchases } from '@/modules/purchases/purchases-list'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { sealDeal } from '@/store/saleDeal.store'
import { StringtoNumber } from '@/utils/helpers'
import { Check, ChevronDown, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Сделки на телефоне: продажи и закупки.
 *
 * На компьютере это два пункта меню и две таблицы. Здесь один экран с
 * переключателем сверху — вид сделки хранится в адресе (?kind=purchase),
 * поэтому «назад» из закупки возвращает в закупки, а не в продажи.
 * Сделка — карточка списка: монограмма контрагента, название, сумма и
 * ход сделки двумя полосками.
 */

/** Цвет статуса: новые синим, завершённые зелёным, отменённые серым. */
const statusTone = (status = '') => {
  const value = String(status).toLowerCase()
  if (value.includes('заверш') || value.includes('выполн')) return 'bg-emerald-50 text-emerald-700'
  if (value.includes('отмен')) return 'bg-slate-100 text-slate-500'
  if (value.includes('работ')) return 'bg-amber-50 text-amber-700'
  return 'bg-[#e8f1ff] text-[#0e73f6]'
}

/** Полоска хода сделки: сколько получено (выплачено) и отгружено (поставлено). */
const Progress = ({ label, value, tone }) => {
  const percent = Math.min(Number(String(value).replace('%', '')) || 0, 100)
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-slate-400">{label}</span>
        <span className="shrink-0 text-[11px] font-semibold text-slate-500 tabular-nums">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

const MobileDealsPage = observer(() => {
  const t = useTranslations('Deals')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const tNav = useTranslations('Sidebar')
  const tp = useTranslations('Purchases')
  const tErrors = useTranslations('Errors')
  const router = useRouter()
  const searchParams = useSearchParams()
  const mounted = useMounted()

  // ── Вид сделки — только из разрешённых ролью ──────────────────────────────
  const permission = appStore.permission?.deals || {}
  const salesPermission = permission.sales || permission
  const purchasesPermission = permission.purchases || permission
  const kinds = [
    salesPermission?.read !== false && { key: 'sale', label: tNav('nav.dealsSelling') },
    purchasesPermission?.read !== false && { key: 'purchase', label: tNav('nav.dealsPurchase') },
  ].filter(Boolean)
  const requested = searchParams.get('kind') === 'purchase' ? 'purchase' : 'sale'
  const kind = kinds.some((item) => item.key === requested) ? requested : kinds[0]?.key || 'sale'
  const isPurchase = kind === 'purchase'
  const config = DEAL_KINDS[kind]
  const permissions = isPurchase ? purchasesPermission : salesPermission

  const [formFor, setFormFor] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)
  const [methodOpen, setMethodOpen] = useState(false)

  const { mutateAsync: removeDeal, isPending: deleting } = useUcodeRequestMutation()

  const { dealsMethod, search: searchValue, dateRange, amountFrom, amountTo, profitFrom, profitTo,
    selectedCounterparties, selectedProjects, status, setState } = sealDeal

  const dateRanges = useMemo(() => toJS(dateRange), [dateRange])

  // Фильтры те же, что у таблиц на компьютере; у закупки нет проектов,
  // зато нужен филиал
  const filters = useMemo(
    () => ({
      limit: 20,
      search: searchValue,
      from_date: dateRanges?.start ? moment(dateRanges.start).format('YYYY-MM-DD') : null,
      to_date: dateRanges?.end ? moment(dateRanges.end).format('YYYY-MM-DD') : null,
      amount_from: StringtoNumber(amountFrom) || null,
      amount_to: StringtoNumber(amountTo) || null,
      profit_from: StringtoNumber(profitFrom) || null,
      profit_to: StringtoNumber(profitTo) || null,
      counterparty_ids: selectedCounterparties?.length > 0 ? selectedCounterparties : null,
      status: status?.length > 0 ? status : null,
      accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
      isCalculation: false,
      ...(isPurchase
        ? { branch_id: authStore.branch_id }
        : { project_ids: selectedProjects?.length > 0 ? selectedProjects : null }),
    }),
    [searchValue, dateRanges, amountFrom, amountTo, profitFrom, profitTo, selectedCounterparties, selectedProjects, status, dealsMethod, isPurchase, t]
  )

  // Запрос отстаёт от ввода — как на большом экране
  const [requestFilters, setRequestFilters] = useState(filters)
  useEffect(() => {
    const timer = setTimeout(() => setRequestFilters(filters), 700)
    return () => clearTimeout(timer)
  }, [filters])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUcodeRequestInfinite({
    method: config.listMethod,
    data: requestFilters,
    querySetting: { staleTime: 0 },
  })

  const deals = useMemo(() => {
    const raw = data?.pages?.flatMap((page) => page?.data?.data || []) || []
    return isPurchase ? formatPurchases(raw, t) : formatDeals(raw, t)
  }, [data, isPurchase, t])

  const summary = useMemo(() => data?.pages?.[0]?.data?.summary, [data])
  const profit = dealsMethod === 'accrual_method' ? summary?.accrual_profit : summary?.cash_profit
  const totalCount = isPurchase ? summary?.total ?? summary?.count : summary?.total_count
  const totalSum = isPurchase ? summary?.total_deal_amount ?? summary?.total_deals_sum : summary?.total_summa

  const sentinelRef = useRef(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const currency = mounted ? GlobalCurrency?.name : ''

  const switchKind = (next) => router.replace(next === 'purchase' ? '/m/deals?kind=purchase' : '/m/deals')

  const confirmDelete = async () => {
    try {
      const result = await removeDeal({
        method: config.deleteMethod,
        data: { guid: deleteFor.guid, ...(isPurchase ? { branch_id: authStore.branch_id } : {}) },
      })
      if (isObjectInUseError(result)) {
        showErrorNotification(tErrors('cannotDelete.deal'))
        return
      }
      config.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      setDeleteFor(null)
    } catch (error) {
      if (isObjectInUseError(error)) showErrorNotification(tErrors('cannotDelete.deal'))
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={tNav('nav.deals')}
          onBack={() => router.push('/m/profile')}
          action={
            permissions?.add && (
              <button
                type="button"
                onClick={() => setFormFor({})}
                aria-label={isPurchase ? tp('createDealModal.titleNew') : t('createDeal')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            )
          }
        />

        {/* Продажи или закупки */}
        {kinds.length > 1 && (
          <div className="flex rounded-2xl bg-white p-1">
            {kinds.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => switchKind(item.key)}
                aria-pressed={kind === item.key}
                className={cn(
                  'min-w-0 flex-1 truncate rounded-xl py-2.5 text-[14px] font-semibold',
                  kind === item.key ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Поиск */}
        <div className="mt-2.5 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={searchValue || ''}
            onChange={(event) => setState('search', event.target.value || null)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {searchValue && (
            <button type="button" onClick={() => setState('search', null)} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Итоги; метод учёта — подписью у прибыли, он меняет только её */}
        {mounted && summary && (
          <div className="mt-2.5 rounded-[20px] bg-white px-4 py-3">
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="min-w-0 pr-2">
                <div className="truncate text-[11px] text-slate-400">{tm('deals.count')}</div>
                <div className="mt-1 truncate text-[15px] font-bold text-slate-900 tabular-nums">
                  {totalCount ?? deals.length}
                </div>
              </div>
              <div className="min-w-0 px-2">
                <div className="truncate text-[11px] text-slate-400">{tm('deals.amount')}</div>
                <div className="mt-1 truncate text-[15px] font-bold text-slate-900 tabular-nums">
                  <Money value={totalSum ?? 0} currency="" />
                </div>
              </div>
              <div className="min-w-0 pl-2">
                <div className="truncate text-[11px] text-slate-400">{tm('deals.profit')}</div>
                <div
                  className={cn(
                    'mt-1 truncate text-[15px] font-bold tabular-nums',
                    (profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  <Money value={profit ?? 0} currency="" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMethodOpen(true)}
              className="mt-2.5 flex items-center gap-1 rounded-full bg-[#e8f1ff] py-1 pr-2 pl-2.5 text-[12px] font-semibold text-[#0e73f6]"
            >
              {dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash')}
              <ChevronDown size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Список сделок */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !deals.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !deals.length && (
          <MEmpty icon={DealIcon} title={isPurchase ? tm('deals.purchasesEmpty') : tm('deals.empty')} />
        )}

        <div className="flex flex-col gap-2.5">
          {deals.map((deal) => (
            <MCard key={deal.guid} className="p-4">
              <button type="button" className="w-full text-left" onClick={() => router.push(config.detailHref(deal.guid))}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[14px] font-bold text-slate-500">
                    {(deal.kontragent?.nazvanie || '?').trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{deal.nazvanie}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">{deal.kontragent?.nazvanie}</span>
                  </span>
                  <span className="flex shrink-0 items-start gap-1">
                    <span className="text-right">
                      <span className="block text-[15px] font-bold text-slate-900 tabular-nums">
                        <Money value={deal.summa_sdelki} currency={currency} />
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {deal.data_nachala ? moment(deal.data_nachala).format('DD.MM.YYYY') : ''}
                      </span>
                    </span>
                    {(permissions?.edit || permissions?.delete) && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={tc('actions')}
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuFor(deal)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.stopPropagation()
                            setMenuFor(deal)
                          }
                        }}
                        className="-mr-1 flex h-8 w-7 items-center justify-center rounded-lg text-slate-400"
                      >
                        <MoreHorizontal size={17} aria-hidden="true" />
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', statusTone(deal.status))}>
                    {deal.status}
                  </span>
                  <Progress
                    label={isPurchase ? tp('table.received') : tm('deals.received')}
                    value={deal.postupilo}
                    tone="bg-emerald-500"
                  />
                  <Progress
                    label={isPurchase ? tp('table.shipped') : tm('deals.shipped')}
                    value={deal.otgruzheno}
                    tone="bg-[#0e73f6]"
                  />
                </div>
              </button>
            </MCard>
          ))}
        </div>

        <div ref={sentinelRef} className="h-10">
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Метод учёта прибыли */}
      <BottomSheet open={methodOpen} onClose={() => setMethodOpen(false)} title={tm('deals.accountingTitle')}>
        <div className="flex flex-col">
          {[
            { value: 'accrual_method', label: t('methods.accrual') },
            { value: 'cash_method', label: t('methods.cash') },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setState('dealsMethod', item.value)
                setMethodOpen(false)
              }}
              className="flex items-center justify-between gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className={cn('text-[15px]', dealsMethod === item.value ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                {item.label}
              </span>
              {dealsMethod === item.value && <Check size={17} className="text-[#0e73f6]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Что сделать со сделкой */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.nazvanie}>
        <div className="flex flex-col">
          {permissions?.edit && (
            <button
              type="button"
              onClick={() => {
                setFormFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions?.delete && (
            <button
              type="button"
              onClick={() => {
                setDeleteFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <DealFormSheet
        open={Boolean(formFor)}
        kind={kind}
        deal={formFor?.guid ? formFor : null}
        onClose={() => setFormFor(null)}
      />

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteFor(null)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{tm('deals.deleteDealText', { name: deleteFor?.nazvanie || '' })}</p>
      </BottomSheet>
    </div>
  )
})

export default MobileDealsPage
