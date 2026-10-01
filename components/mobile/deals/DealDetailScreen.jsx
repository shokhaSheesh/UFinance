'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import DealComments from '@/components/mobile/deals/DealComments'
import { DEAL_KINDS, readDealFigures } from '@/components/mobile/deals/dealKinds'
import DealFormSheet from '@/components/mobile/forms/DealFormSheet'
import ShipmentFormSheet from '@/components/mobile/forms/ShipmentFormSheet'
import SwipeCards from '@/components/mobile/SwipeCards'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useActOfReconciliation } from '@/hooks/useActOfReconciliation'
import { useRouter } from '@/hooks/useAppRouter'
import { useChartOfAccountsIds } from '@/hooks/useChartOfAccountsIds'
import { useUcodeDefaultApiQuery, useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import operationsDto from '@/lib/dtos/operationsDto'
import { productServiceDto } from '@/lib/dtos/productServiceDto'
import { shipmentsDto } from '@/lib/dtos/shipmentsDto'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { sealDeal } from '@/store/saleDeal.store'
import { areDatesAllowed } from '@/utils/dataEditingRestriction'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  FileDown,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Truck,
  Undo2,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

/**
 * Сделка на телефоне — продажа или закупка.
 *
 * Всё, что есть у сделки на компьютере, есть и здесь, но сложено в одну
 * колонку: сначала сумма и статус, затем деньги (поступления, отгрузки,
 * прибыль) с кнопкой «+» на каждой карточке, ниже — содержимое сделки по
 * вкладкам и в конце файлы с комментариями. Четыре карточки в ряд на 390
 * точках не поместить, а пролистать их сверху вниз — одно движение пальцем.
 */

const LIST_FLAGS = { accrualConfirmed: true, accrualNotConfirmed: true, paymentConfirmed: true, paymentNotConfirmed: true }
const EXPENSE_TIPS = ['Дебет', 'Кредит', 'Начисление', 'Выплата']
const EXPENSE_ROOTS = ['Расходы']

/** Круглая кнопка «+» в углу карточки. */
const PlusButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#0e73f6] active:bg-[#d6e7ff]"
  >
    <Plus size={18} aria-hidden="true" />
  </button>
)

/** Полоса хода: сколько из суммы сделки уже прошло. */
const Bar = ({ percent, tone = 'bg-emerald-500' }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
    <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
  </div>
)

/** Карточка денег сделки: поступления или отгрузки. */
const FlowCard = ({ title, icon: Icon, value, total, percent, percentLabel, footLabel, footValue, currency, onAdd, addLabel, t }) => (
  <MCard className="flex h-full flex-col">
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-[15px] font-bold text-slate-900">{title}</span>
      {onAdd && <PlusButton onClick={onAdd} label={addLabel} />}
    </div>

    <div className="mt-3 flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[20px] leading-tight font-bold text-slate-900">
          <Money value={value} currency={currency} />
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-slate-500">
          {t('cards.from')} <Money value={total} currency={currency} />
        </span>
      </span>
    </div>

    <div className="mt-auto pt-4">
      <Bar percent={percent} />
    </div>
    {/* Процент и долг — отдельными строками: в узкой карточке в одну
        строку долг обрезался многоточием */}
    <div className="mt-2.5 flex flex-col gap-1 text-[12px]">
      <span className="text-slate-500">
        {percentLabel}: <span className="font-semibold text-slate-700">{percent}%</span>
      </span>
      {footLabel && (
        <span className="text-slate-500">
          {footLabel} <span className="font-semibold text-slate-800"><Money value={footValue} currency={currency} /></span>
        </span>
      )}
    </div>
  </MCard>
)

/** Строка из «…» и других панелей действий. */
const ActionRow = ({ icon: Icon, label, onClick, danger, disabled, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 disabled:opacity-50',
      danger ? 'active:bg-red-50' : 'active:bg-slate-50'
    )}
  >
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
      )}
    >
      {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
    </span>
    <span className={cn('text-[15px] font-semibold', danger ? 'text-red-600' : 'text-slate-900')}>{label}</span>
  </button>
)

/** Подтверждение удаления панелью снизу. */
const ConfirmDelete = ({ open, onClose, title, message, onConfirm, busy, tc }) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    title={title}
    footer={
      <div className="flex gap-2.5">
        <button type="button" onClick={onClose} className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">
          {tc('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {tc('delete')}
        </button>
      </div>
    }
  >
    <p className="text-sm text-slate-600">{message}</p>
  </BottomSheet>
)

const DealDetailScreen = observer(({ kind = 'sale', dealId }) => {
  const t = useTranslations('Deals.detail')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const tp = useTranslations('Purchases')
  const ts = useTranslations('Deals.createShipment')
  const tShip = useTranslations('Directories.details.shipmentTable')
  const tStatus = useTranslations('Directories.details.status')
  const tErrors = useTranslations('Errors')
  const router = useRouter()
  const pathname = usePathname()
  const mounted = useMounted()

  const config = DEAL_KINDS[kind]
  const isPurchase = kind === 'purchase'
  const accounting = sealDeal.accounting

  const [tab, setTab] = useState('products')
  const [sheet, setSheet] = useState(null) // actions | status | accounting | shipmentChoice
  const [shipmentForm, setShipmentForm] = useState(null) // { guid?, isReturn }
  const [shipmentMenu, setShipmentMenu] = useState(null)
  const [shipmentToDelete, setShipmentToDelete] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // ── Права — те же флаги, что у страницы сделки на компьютере ─────────────
  const operations = appStore.permission?.operations || {}
  const dealPermission = (isPurchase ? appStore.permission?.deals?.purchases : appStore.permission?.deals?.sales) ||
    appStore.permission?.deals || {}
  const documentPermission = operations?.[config.shipment.permission] || {}
  const canAddIncome = Boolean(operations?.income?.add)
  const canAddPayment = Boolean(operations?.payout?.add)
  const canAddShipment = Boolean(isPurchase ? documentPermission?.add || operations?.shipment?.add : operations?.shipment?.add)
  const canEditDeal = Boolean(dealPermission?.edit || operations?.shipment?.edit)
  const canDeleteDeal = Boolean(dealPermission?.delete || operations?.shipment?.delete)

  // ── Сделка ────────────────────────────────────────────────────────────────
  const { data: deal, isLoading } = useUcodeRequestQuery({
    method: config.getMethod,
    data: { guid: dealId },
    skip: !dealId,
    querySetting: { select: (response) => response?.data?.data, placeholderData: keepPreviousData },
  })

  const figures = readDealFigures(kind, deal, accounting)
  const currency = mounted ? GlobalCurrency?.name : ''

  // Статусы — тот же справочник, что у выбора статуса на компьютере
  const { data: statuses = [] } = useUcodeDefaultApiQuery({
    queryKey: 'sales_status',
    urlMethod: 'GET',
    urlParams: '/items/sales_status?from-ofs=true',
    data: {},
    querySetting: { select: (response) => response?.data?.data?.response || [] },
  })
  const activeStatus = statuses.find((item) => item.name === figures?.status)
  const statusColor = activeStatus?.color || '#F79009'
  const statusName = activeStatus?.name || figures?.status || tStatus('defaultStatus')

  const { mutateAsync: request, isPending: requesting } = useUcodeRequestMutation()

  const changeStatus = async (status) => {
    setSheet(null)
    await request({
      method: config.statusMethod,
      data: {
        guid: dealId,
        name: deal?.name,
        sales_status_id: status?.guid,
        ...(isPurchase ? { branch_id: authStore.branch_id } : {}),
      },
    })
    queryClient.invalidateQueries({ queryKey: [config.getMethod] })
  }

  // ── Акт сверки PDF ────────────────────────────────────────────────────────
  const act = useActOfReconciliation({
    id: dealId,
    idField: config.actField,
    counterpartyId: deal?.counterparties_id,
    name: deal?.name,
  })

  // ── Содержимое вкладок ────────────────────────────────────────────────────
  const { data: products = [], isLoading: loadingProducts } = useUcodeRequestQuery({
    queryKey: 'products_services_list',
    method: 'list_products_and_services',
    data: { [config.productsField]: dealId, page: 1, limit: 100 },
    skip: !dealId,
    querySetting: { select: (response) => productServiceDto(response?.data?.data || []) },
  })

  const { ids: expenseIds, isLoading: loadingChart } = useChartOfAccountsIds(EXPENSE_ROOTS)

  // Поступления: тот же фильтр, что у таблицы на компьютере
  const { data: incomeOps = [], isLoading: loadingIncome } = useQuery({
    queryKey: ['list_operations_by_query', dealId, 'income', 'mobile'],
    queryFn: () =>
      apiClient.invokeFunction({
        method: 'list_operations_by_query',
        data: { selling_deal_ids: [dealId], tip: ['Поступление'], ...LIST_FLAGS, page: 1, limit: 50 },
      }),
    enabled: Boolean(dealId) && !isPurchase && tab === 'receipts',
    select: (response) => operationsDto(response?.data?.data || []),
  })

  // Расходы продажи и выплаты закупки — расходные статьи по сделке
  const { data: expenseOps = [], isLoading: loadingExpense } = useQuery({
    queryKey: ['list_operations_by_query', dealId, 'expense', expenseIds, 'mobile'],
    queryFn: () =>
      apiClient.invokeFunction({
        method: 'list_operations_by_query',
        data: {
          [isPurchase ? 'purchase_transactions_id' : 'sellingDealId']: [dealId],
          tip: EXPENSE_TIPS,
          chart_of_accounts_ids: expenseIds,
          ...LIST_FLAGS,
          page: 1,
          limit: 50,
        },
      }),
    enabled: Boolean(dealId) && !loadingChart && tab === 'expenses',
    select: (response) => operationsDto(response?.data?.data || []),
  })

  const { data: shipments = [], isLoading: loadingShipments } = useQuery({
    queryKey: [config.shipment.listMethod, dealId, 'shipment'],
    queryFn: () =>
      apiClient.invokeFunction({
        method: config.shipment.listMethod,
        data: {
          object_data: {
            [config.shipment.listField]: dealId,
            ...(config.shipment.listTab ? { tab: config.shipment.listTab } : {}),
            search: '',
            page: 1,
            limit: 50,
          },
        },
      }),
    enabled: Boolean(dealId) && tab === 'shipments',
    select: (response) => {
      const data = response?.data?.data
      return shipmentsDto(Array.isArray(data) ? data : data?.items || [])
    },
  })

  // ── Действия ──────────────────────────────────────────────────────────────
  const back = encodeURIComponent(pathname)
  const counterpartyParam = deal?.counterparties_id ? `&counterparty=${deal.counterparties_id}` : ''

  const addIncome = () => router.push(`/m/transactions/new?type=income&deal=${dealId}${counterpartyParam}&back=${back}`)
  const addPayment = () =>
    router.push(
      isPurchase
        ? `/m/transactions/new?type=payment&purchase=${dealId}&purchaseName=${encodeURIComponent(deal?.name || '')}${counterpartyParam}&back=${back}`
        : `/m/transactions/new?type=payment&deal=${dealId}${counterpartyParam}&back=${back}`
    )
  // Возврат доступен, когда включены и склад, и возвраты — как на компьютере
  const returnsOn = Boolean(appStore.warehouseActive && appStore.returnActive)
  const addShipment = () => (returnsOn ? setSheet('shipmentChoice') : setShipmentForm({ isReturn: false }))

  const deleteDeal = async () => {
    try {
      const result = await request({
        method: config.deleteMethod,
        data: { guid: dealId, ...(isPurchase ? { branch_id: authStore.branch_id } : {}) },
      })
      // Бэк может ответить 200 с телом-ошибкой «объект используется»
      if (isObjectInUseError(result)) {
        showErrorNotification(tErrors('cannotDelete.deal'))
        return
      }
      config.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      setDeleteOpen(false)
      router.push(config.listHref)
    } catch (error) {
      if (isObjectInUseError(error)) showErrorNotification(tErrors('cannotDelete.deal'))
    }
  }

  const deleteShipment = async () => {
    await request({ method: config.shipment.deleteMethod, data: { guid: shipmentToDelete.guid } })
    config.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    queryClient.invalidateQueries({ queryKey: [config.shipment.listMethod] })
    setShipmentToDelete(null)
  }

  if (isLoading && !deal) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  // ── Подписи, которые у продажи и закупки свои ─────────────────────────────
  const L = isPurchase
    ? {
        flowTitle: tm('deals.supplierPayments'),
        flowPercent: tm('deals.paid'),
        flowFoot: t('cards.weOwe'),
        moveTitle: tm('deals.supplies'),
        movePercent: tm('deals.supplied'),
        moveFoot: figures?.movedPercent < 100 ? t('cards.supplierOwes') : null,
        counterparty: t('cards.supplier'),
        type: t('cards.purchase'),
      }
    : {
        flowTitle: t('cards.receipts'),
        flowPercent: t('cards.received'),
        flowFoot: t('cards.clientDebt'),
        moveTitle: t('cards.shipments'),
        movePercent: t('cards.shipped'),
        moveFoot: t('cards.weOwe'),
        counterparty: t('cards.client'),
        type: t('cards.sale'),
      }

  const counts = figures?.counts || {}
  const withCount = (label, count) => (count != null ? `${label} · ${count}` : label)
  const tabs = isPurchase
    ? [
        { key: 'products', label: t('tabs.products'), icon: Package },
        { key: 'expenses', label: tm('deals.payments'), icon: ArrowUpRight },
        { key: 'shipments', label: tm('deals.supplies'), icon: Truck },
      ]
    : [
        { key: 'products', label: withCount(t('tabs.products'), counts.products), icon: Package },
        { key: 'receipts', label: withCount(t('tabs.receipts'), counts.receipts), icon: ArrowDownLeft },
        { key: 'expenses', label: withCount(t('tabs.expenses'), counts.expenses), icon: ArrowUpRight },
        { key: 'shipments', label: withCount(t('tabs.shipments'), counts.shipments), icon: Truck },
      ]

  // Добавить в открытой вкладке — то же, что «+» на карточках
  const tabAdd =
    tab === 'receipts' && canAddIncome
      ? addIncome
      : tab === 'expenses' && canAddPayment
        ? addPayment
        : tab === 'shipments' && canAddShipment && products.length > 0
          ? addShipment
          : null

  const operationsList = tab === 'receipts' ? incomeOps : expenseOps
  const operationsLoading = tab === 'receipts' ? loadingIncome : loadingExpense || loadingChart

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={deal?.name || t('noName')}
        onBack={() => router.push(config.listHref)}
        action={
          <button
            type="button"
            onClick={() => setSheet('actions')}
            aria-label={tc('actions')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
          >
            <MoreHorizontal size={19} aria-hidden="true" />
          </button>
        }
      />

      {/* Деньги сделки — листаются пальцем, соседние карточки видны по краям */}
      <SwipeCards>
        {/* Сумма, статус и паспорт сделки */}
        <MCard className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 truncate text-[24px] leading-tight font-bold tracking-[-0.02em] text-slate-900">
              <Money value={figures?.amount || 0} currency={currency} />
            </div>
            <button
              type="button"
              onClick={() => setSheet('status')}
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full py-1.5 pr-2.5 pl-3 text-[13px] font-semibold"
              style={{ backgroundColor: `${statusColor}1f`, color: statusColor }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="max-w-[110px] truncate">{statusName}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-1">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[13px] text-slate-500">{t('cards.type')}</span>
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-800">
                <Database size={13} className="text-slate-400" aria-hidden="true" />
                {L.type}
              </span>
            </div>
            {[
              { label: L.counterparty, value: figures?.counterpartyName },
              { label: t('cards.created'), value: figures?.date ? moment(figures.date).format('D MMMM YYYY') : null },
            ].map((row) => (
              <button
                key={row.label}
                type="button"
                disabled={!canEditDeal}
                onClick={() => setEditOpen(true)}
                className="flex w-full items-center justify-between gap-4 py-2.5 text-left active:opacity-70 disabled:active:opacity-100"
              >
                <span className="shrink-0 text-[13px] text-slate-500">{row.label}</span>
                <span className="flex min-w-0 items-center gap-1">
                  <span className="truncate text-[14px] font-medium text-slate-900">{row.value || '—'}</span>
                  {canEditDeal && <ChevronRight size={16} className="shrink-0 text-slate-300" aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </MCard>
        <FlowCard
          t={t}
          title={L.flowTitle}
          icon={isPurchase ? ArrowUpRight : Database}
          value={figures?.paid || 0}
          total={figures?.amount || 0}
          percent={figures?.paidPercent || 0}
          percentLabel={L.flowPercent}
          footLabel={L.flowFoot}
          footValue={figures?.debt || 0}
          currency={currency}
          onAdd={(isPurchase ? canAddPayment : canAddIncome) ? (isPurchase ? addPayment : addIncome) : null}
          addLabel={L.flowTitle}
        />
        <FlowCard
          t={t}
          title={L.moveTitle}
          icon={isPurchase ? Truck : Package}
          value={figures?.moved || 0}
          total={figures?.amount || 0}
          percent={figures?.movedPercent || 0}
          percentLabel={L.movePercent}
          footLabel={L.moveFoot}
          footValue={figures?.remaining || 0}
          currency={currency}
          onAdd={canAddShipment ? addShipment : null}
          addLabel={L.moveTitle}
        />

        {/* Прибыль — только у продажи, как на компьютере */}
        {!isPurchase && (
          <MCard className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[15px] font-bold text-slate-900">{t('cards.profit')}</span>
              <button
                type="button"
                onClick={() => setSheet('accounting')}
                className="flex shrink-0 items-center gap-1 rounded-full bg-[#e8f1ff] py-1.5 pr-2 pl-3 text-[12px] font-semibold text-[#0e73f6]"
              >
                {accounting === 'accrual' ? t('accountingMethods.accrual') : t('accountingMethods.cash')}
                <ChevronDown size={13} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <TrendingUp size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-[20px] leading-tight font-bold',
                    (figures?.profit || 0) < 0 ? 'text-red-600' : 'text-slate-900'
                  )}
                >
                  <Money value={figures?.profit || 0} currency={currency} />
                </span>
                <span className="mt-0.5 block text-[12px] text-slate-500">
                  {t('cards.profitability')} {figures?.profitability || 0}%
                </span>
              </span>
            </div>

            {(() => {
              const scale = Math.max(figures?.income || 0, figures?.expenses || 0) || 1
              return (
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                  {[
                    { label: t('cards.income'), value: figures?.income || 0, sign: '+', tone: 'bg-emerald-500' },
                    { label: t('cards.expenses'), value: figures?.expenses || 0, sign: '−', tone: 'bg-amber-400' },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0">
                      <Bar percent={(item.value / scale) * 100} tone={item.tone} />
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500">
                        <span className={cn('h-1.5 w-1.5 rounded-full', item.tone)} />
                        {item.label}
                      </div>
                      <div className="truncate text-[14px] font-semibold text-slate-900">
                        <Money value={item.value} currency={currency} sign={item.sign} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </MCard>
        )}
      </SwipeCards>

      {/* Что внутри сделки */}
      <div className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap',
                tab === item.key ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
              )}
            >
              <item.icon size={15} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5">
        {tabAdd && (
          <button
            type="button"
            onClick={tabAdd}
            className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0e73f6]/40 bg-white py-3 text-[14px] font-semibold text-[#0e73f6] active:bg-[#f5f9ff]"
          >
            <Plus size={17} aria-hidden="true" />
            {t('addButton')}
          </button>
        )}

        {tab === 'products' && (
          <MCard list>
            {loadingProducts && !products.length && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
              </div>
            )}
            {!loadingProducts && products.length === 0 && <MEmpty icon={Package} title={tm('deals.noProducts')} />}
            {products.map((product) => (
              <div key={product.guid} className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Package size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-slate-900">{product.name}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                    {[product.kolvo, product.unit_name].filter(Boolean).join(' ')}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold text-slate-900">
                  <Money value={product.summa} currency={currency} />
                </span>
              </div>
            ))}
          </MCard>
        )}

        {(tab === 'receipts' || tab === 'expenses') && (
          <MCard list>
            {operationsLoading && !operationsList.length && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
              </div>
            )}
            {!operationsLoading && operationsList.length === 0 && <MEmpty icon={Receipt} title={tm('deals.noOperations')} />}
            {operationsList.map((operation) => {
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
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {[operation.operationDate, operation.chartOfAccounts].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className={cn('shrink-0 text-[15px] font-semibold', isIncome ? 'text-emerald-600' : 'text-red-600')}>
                    <Money value={operation.summa} currency={operation.currency || currency} sign={isIncome ? '+' : '−'} />
                  </span>
                </button>
              )
            })}
          </MCard>
        )}

        {tab === 'shipments' && (
          <MCard list>
            {loadingShipments && !shipments.length && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
              </div>
            )}
            {!loadingShipments && shipments.length === 0 && (
              <MEmpty
                icon={Truck}
                title={
                  products.length === 0
                    ? isPurchase ? tp('supplyTable.emptyProductsTitle') : tShip('emptyProductsTitle')
                    : isPurchase ? tp('supplyTable.emptyTitle') : tShip('emptyTitle')
                }
                subtitle={
                  products.length === 0
                    ? isPurchase ? tp('supplyTable.emptyProductsSubtitle') : tShip('emptyProductsSubtitle')
                    : null
                }
              />
            )}
            {shipments.map((item) => {
              const isPlanned = Boolean(item[config.shipment.plannedField])
              const isReturn = Number(item.summa) < 0
              const count = item.product_and_service_data?.length || 0
              return (
                <button
                  key={item.guid}
                  type="button"
                  onClick={() => setShipmentMenu(item)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      isReturn ? 'bg-amber-50 text-amber-600' : 'bg-[#e8f1ff] text-[#0e73f6]'
                    )}
                  >
                    {isReturn ? <Undo2 size={18} aria-hidden="true" /> : <Truck size={18} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold text-slate-900">
                        {count} {tShip('position', { count })}
                      </span>
                      {isPlanned && (
                        <span className="shrink-0 rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#0e73f6]">
                          {tm('deals.planned')}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {[item.operationDate, item.legal_entity_name, item.chartOfAccounts].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold text-slate-900">
                    <Money value={item.summa} currency={item.currency || currency} />
                  </span>
                </button>
              )
            })}
          </MCard>
        )}
      </div>

      <DealComments dealGuid={dealId} variant={config.commentsVariant} />

      {/* «…» сделки */}
      <BottomSheet open={sheet === 'actions'} onClose={() => setSheet(null)} title={deal?.name || t('noName')}>
        <div className="flex flex-col">
          <ActionRow
            icon={FileDown}
            label={t('actions.downloadPdf')}
            disabled={!deal?.counterparties_id || act.isPending}
            busy={act.isPending}
            onClick={() => act.downloadPdf()}
          />
          {canEditDeal && (
            <ActionRow
              icon={Pencil}
              label={t('actions.edit')}
              onClick={() => {
                setSheet(null)
                setEditOpen(true)
              }}
            />
          )}
          {canDeleteDeal && (
            <ActionRow
              icon={Trash2}
              label={t('actions.delete')}
              danger
              onClick={() => {
                setSheet(null)
                setDeleteOpen(true)
              }}
            />
          )}
        </div>
      </BottomSheet>

      {/* Статус сделки */}
      <BottomSheet open={sheet === 'status'} onClose={() => setSheet(null)} title={tm('deals.statusTitle')}>
        <div className="flex flex-col">
          {statuses.map((status) => {
            const active = status.name === statusName
            return (
              <button
                key={status.guid}
                type="button"
                onClick={() => changeStatus(status)}
                className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color || '#F79009' }} />
                <span className={cn('min-w-0 flex-1 truncate text-[15px]', active ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                  {status.name}
                </span>
                {active && <Check size={17} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />}
              </button>
            )
          })}
          {statuses.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{tc('noData')}</p>}
        </div>
      </BottomSheet>

      {/* Метод учёта для прибыли */}
      <BottomSheet open={sheet === 'accounting'} onClose={() => setSheet(null)} title={tm('deals.accountingTitle')}>
        <div className="flex flex-col">
          {['accrual', 'cash'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                sealDeal.setState('accounting', method)
                setSheet(null)
              }}
              className="flex items-center justify-between gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className={cn('text-[15px]', accounting === method ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                {t(`accountingMethods.${method}`)}
              </span>
              {accounting === method && <Check size={17} className="text-[#0e73f6]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Отгрузка или возврат */}
      <BottomSheet open={sheet === 'shipmentChoice'} onClose={() => setSheet(null)} title={tm('deals.shipmentChoice')}>
        <div className="flex flex-col">
          <ActionRow
            icon={isPurchase ? Truck : Package}
            label={isPurchase ? tp('createSupply.titleNew') : ts('titleNew')}
            onClick={() => {
              setSheet(null)
              setShipmentForm({ isReturn: false })
            }}
          />
          <ActionRow
            icon={Undo2}
            label={t('newReturnButton')}
            onClick={() => {
              setSheet(null)
              setShipmentForm({ isReturn: true })
            }}
          />
        </div>
      </BottomSheet>

      {/* Строка отгрузки: правка и удаление */}
      {(() => {
        const item = shipmentMenu
        const rowPlanned = Boolean(item?.[config.shipment.plannedField])
        const deleteBlocked = Boolean(appStore.warehouseActive) && !rowPlanned && Boolean(item?.warehouse_id)
        const dateAllowed = areDatesAllowed([item?.data_operatsii, item?.data_nachisleniya])
        const canEditRow = Boolean(documentPermission?.edit) && dateAllowed
        const canDeleteRow = Boolean(documentPermission?.delete) && dateAllowed && !deleteBlocked
        return (
          <BottomSheet
            open={Boolean(item)}
            onClose={() => setShipmentMenu(null)}
            title={item ? `${item.operationDate} · ${item.product_and_service_data?.length || 0} ${tShip('position', { count: item.product_and_service_data?.length || 0 })}` : ''}
          >
            <div className="flex flex-col">
              {(item?.product_and_service_data || []).map((product, index) => (
                <div key={product.guid || index} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-slate-900">{product.Naimenovanie}</span>
                    <span className="block text-[12px] text-slate-500">
                      {[product.Kol_vo, product.unit_name].filter(Boolean).join(' ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[14px] font-semibold text-slate-900">
                    <Money value={product.Summa} currency={item?.currency || currency} />
                  </span>
                </div>
              ))}
              {deleteBlocked && documentPermission?.delete && (
                <p className="pt-3 text-[12px] text-slate-500">{tShip('deleteBlockedClosedWarehouse')}</p>
              )}
              <div className="pt-2">
                {canEditRow && (
                  <ActionRow
                    icon={Pencil}
                    label={tc('edit')}
                    onClick={() => {
                      setShipmentForm({ guid: item.guid, isReturn: Number(item.summa) < 0 })
                      setShipmentMenu(null)
                    }}
                  />
                )}
                {canDeleteRow && (
                  <ActionRow
                    icon={Trash2}
                    label={tc('delete')}
                    danger
                    onClick={() => {
                      setShipmentToDelete(item)
                      setShipmentMenu(null)
                    }}
                  />
                )}
              </div>
            </div>
          </BottomSheet>
        )
      })()}

      <ShipmentFormSheet
        open={Boolean(shipmentForm)}
        onClose={() => setShipmentForm(null)}
        kind={kind}
        dealGuid={dealId}
        counterpartyId={deal?.counterparties_id}
        dealProjectId={deal?.projects_id}
        shipmentGuid={shipmentForm?.guid}
        isReturn={shipmentForm?.isReturn}
      />

      <DealFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        kind={kind}
        deal={deal ? { ...deal, guid: dealId, name: deal.name, sale_date: figures?.date } : null}
      />

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('actions.delete')}
        message={tm('deals.deleteDealText', { name: deal?.name || t('noName') })}
        onConfirm={deleteDeal}
        busy={requesting}
        tc={tc}
      />

      <ConfirmDelete
        open={Boolean(shipmentToDelete)}
        onClose={() => setShipmentToDelete(null)}
        title={isPurchase ? tp('supplyTable.deleteSupplyTitle') : tShip('deleteShipmentTitle')}
        message={isPurchase ? tm('deals.deleteSupplyText') : tShip('deleteShipmentConfirm')}
        onConfirm={deleteShipment}
        busy={requesting}
        tc={tc}
      />
    </div>
  )
})

export default DealDetailScreen
