'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MDateField, MSelectField, MSwitch } from '@/components/mobile/fields'
import { DEAL_KINDS } from '@/components/mobile/deals/dealKinds'
import Money from '@/components/shared/Money'
import { useUcodeRequestMutation, useUcodeRequestQuery, useWarehousesList } from '@/hooks/useDashboard'
import { useDataEditingRestriction } from '@/hooks/useDataEditingRestriction'
import { apiClient } from '@/lib/api/ucode/base'
import { listProjects } from '@/lib/api/ucode/projects'
import { readStockCount } from '@/lib/api/ucode/stock'
import { productServiceDto } from '@/lib/dtos/productServiceDto'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { formatDecimal } from '@/utils/helpers'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Check, Loader2, Package, Undo2 } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Отгрузка (в продаже) и поставка (в закупке) на телефоне.
 *
 * На большом экране это таблица строк, где каждую позицию выбирают из
 * списка. Здесь позиции сделки уже лежат списком: отмечаешь нужные и
 * правишь количество — на телефоне так быстрее, чем собирать таблицу.
 * Отправляется то же, что шлёт окно на компьютере, с теми же проверками:
 * остаток на складе, закрытый период, плановая отметка.
 */

// В режиме школы (isDonoSchool) отгрузки идут в фиксированной валюте — как в окне на компьютере
const DONO_SCHOOL_CURRENCY = '31b10867-8169-464e-8d3f-e3bec976fdbb'

const toNumber = (value) => Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0

const calcRowSum = ({ quantity, price, discount, nds }) =>
  toNumber(quantity) * toNumber(price) * (1 - toNumber(discount) / 100) * (1 + toNumber(nds) / 100)

/** Статьи плана счетов из разрешённых разделов, плоским списком. */
const flattenArticles = (nodes = [], roots = [], path = []) => {
  const result = []
  nodes.forEach((node) => {
    const name = node?.nazvanie
    if (!path.length && roots.length && !roots.includes(name)) return
    const children = node?.children || []
    if (children.length) result.push(...flattenArticles(children, roots, [...path, name]))
    else if (node?.guid) result.push({ value: node.guid, label: name, sub: path.join(' · ') })
  })
  return result
}

export default function ShipmentFormSheet({ open, ...props }) {
  if (!open) return null
  return <ShipmentForm {...props} />
}

const ShipmentForm = observer(function ShipmentForm({
  onClose,
  kind = 'sale',
  dealGuid,
  counterpartyId,
  dealProjectId,
  shipmentGuid,
  isReturn = false,
}) {
  const t = useTranslations('Deals.createShipment')
  const tp = useTranslations('Purchases.createSupply')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')

  const config = DEAL_KINDS[kind]
  const shipment = config.shipment
  const isPurchase = kind === 'purchase'
  const isEditing = Boolean(shipmentGuid)

  const L = {
    title: isReturn
      ? isEditing ? t('titleEditReturn') : t('titleNewReturn')
      : isPurchase
        ? isEditing ? tp('titleEdit') : tp('titleNew')
        : isEditing ? t('titleEdit') : t('titleNew'),
    date: isPurchase ? tp('supplyDate') : t('shipmentDate'),
    planned: isPurchase ? tp('plannedSupply') : t('plannedShipment'),
    client: isPurchase ? tp('supplier') : t('client'),
    clientRequired: isPurchase ? tp('supplierRequired') : t('clientRequired'),
    article: isPurchase ? tp('expenseArticle') : t('incomeArticle'),
    noArticle: isPurchase ? tp('undistributedExpense') : t('undistributedIncome'),
    products: isPurchase ? tp('products') : t('products'),
    sum: isPurchase ? tp('supplySum') : t('shipmentSum'),
  }

  // Возврат — те же поля и методы, но все суммы со знаком минус
  const signPrice = (value) => {
    const number = Number(value) || 0
    return isReturn ? -Math.abs(number) : number
  }

  const { ensureAllowed } = useDataEditingRestriction()
  const warehouseModuleOn = Boolean(appStore.warehouseActive)

  const [date, setDate] = useState(moment().format('YYYY-MM-DD'))
  const [planned, setPlanned] = useState(true)
  const [legalEntity, setLegalEntity] = useState('')
  const [client, setClient] = useState(counterpartyId || '')
  const [project, setProject] = useState(dealProjectId || '')
  const [article, setArticle] = useState('')
  const [warehouse, setWarehouse] = useState('')
  // Поставка идёт либо на склад (товары), либо сразу на статью (услуги)
  const [isServiceSupply, setIsServiceSupply] = useState(false)
  const [rows, setRows] = useState(null)
  const [errors, setErrors] = useState({})
  const [checkingStock, setCheckingStock] = useState(false)

  // ── Списки ────────────────────────────────────────────────────────────────
  const { data: dealProducts, isLoading: loadingProducts } = useUcodeRequestQuery({
    method: 'list_products_and_services',
    data: { [config.productsField]: dealGuid, page: 1, limit: 1000 },
    skip: !dealGuid,
    querySetting: {
      select: (response) => productServiceDto(response?.data?.data || []),
      staleTime: 0,
      refetchOnMount: 'always',
    },
  })

  const { data: existing, isLoading: loadingExisting } = useUcodeRequestQuery({
    method: shipment.getMethod,
    data: { guid: shipmentGuid },
    skip: !shipmentGuid,
    querySetting: { select: (response) => response?.data },
  })

  const { data: legalEntities = [], isLoading: loadingEntities } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const { data: counterparties = [], isLoading: loadingCounterparties } = useUcodeRequestQuery({
    method: 'get_counterparties',
    data: { page: 1, limit: 200 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const { data: chart = [], isLoading: loadingArticles } = useUcodeRequestQuery({
    method: 'get_chart_of_accounts',
    data: { page: 1, limit: 100, search: '' },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 30 },
  })

  const { data: warehouses = [] } = useWarehousesList()

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['select_projects', ''],
    queryFn: () => listProjects({ page: 1, limit: 100 }),
    select: (response) => response?.data || [],
    enabled: Boolean(appStore.projectActive),
    staleTime: 1000 * 60 * 5,
  })

  // ── Начальные строки: позиции сделки, а при правке — сохранённые ─────────
  const ready = Boolean(dealProducts) && (!isEditing || Boolean(existing))
  if (ready && rows === null) {
    const saved = isEditing ? existing?.product_and_service_data || [] : []
    const savedById = new Map(saved.map((row) => [row.product_and_service_id, row]))

    const fromDeal = (dealProducts || []).map((product) => {
      const savedRow = savedById.get(product.product_and_service_id)
      if (savedRow) savedById.delete(product.product_and_service_id)
      const source = savedRow
        ? {
            quantity: savedRow.Kol_vo ?? 0,
            price: savedRow.TSena_za_ed ?? 0,
            discount: savedRow.Skidka ?? 0,
            nds: savedRow.NDS ?? 0,
          }
        : {
            quantity: product.kolvo ?? 0,
            price: signPrice(product.tsena_za_ed ?? 0),
            discount: product.discount ?? 0,
            nds: product.nds ?? 0,
          }
      return {
        key: product.guid,
        selected: Boolean(savedRow),
        rowGuid: savedRow?.guid,
        productServiceId: product.product_and_service_id || product.guid,
        name: product.name || savedRow?.Naimenovanie || '',
        article: product.article || savedRow?.Artikul || '',
        unitName: product.unit_name || savedRow?.unit_name || '',
        unitId: product.unit_of_measurement_id,
        tip: product.tip || savedRow?.Tip || '',
        ...Object.fromEntries(Object.entries(source).map(([key, value]) => [key, String(value)])),
      }
    })

    // Позиции документа, которых уже нет в сделке, всё равно показываем
    const orphans = [...savedById.values()].map((row) => ({
      key: row.guid || row.product_and_service_id,
      selected: true,
      rowGuid: row.guid,
      productServiceId: row.product_and_service_id,
      name: row.Naimenovanie || '',
      article: row.Artikul || '',
      unitName: row.unit_name || '',
      tip: row.Tip || '',
      quantity: String(row.Kol_vo ?? 0),
      price: String(row.TSena_za_ed ?? 0),
      discount: String(row.Skidka ?? 0),
      nds: String(row.NDS ?? 0),
    }))

    setRows([...fromDeal, ...orphans])

    if (existing) {
      setDate(moment.parseZone(existing.data_nachislenie).format('YYYY-MM-DD'))
      setPlanned(Boolean(existing[shipment.plannedField]))
      setLegalEntity(existing.legal_entity_id || '')
      setClient(existing.partners_id || counterpartyId || '')
      setProject(existing.projects_id || '')
      setArticle(existing.chart_of_accounts_id || '')
      setWarehouse(existing.warehouse_id || '')
      setIsServiceSupply(isPurchase && Boolean(existing.chart_of_accounts_id) && !existing.warehouse_id)
    }
  }

  const list = rows || []
  const selectedRows = list.filter((row) => row.selected)

  // ── Правила полей — те же, что в окне на компьютере ───────────────────────
  const today = moment().startOf('day')
  const isFutureDate = moment(date).startOf('day').isAfter(today)
  const canMoveWarehouseStock = Boolean(appStore.permission?.warehouse?.add)
  const isPlannedReadOnly = warehouseModuleOn && !canMoveWarehouseStock
  const isPlannedForced = isFutureDate || (isPlannedReadOnly && !isEditing)
  const isPlannedLocked = isPlannedForced || isPlannedReadOnly
  const effectivePlanned = isPlannedForced ? true : planned

  // Отгрузка и возврат поставки забирают товар со склада — их сверяем с остатком
  const isOutflow = (isPurchase && isReturn) || (!isPurchase && !isReturn)
  const hasSelectedProduct = selectedRows.some((row) => row.tip !== 'service')
  const showWarehouse = warehouseModuleOn && hasSelectedProduct
  const effectiveWarehouse = showWarehouse || isEditing ? warehouse : ''
  const isWarehouseSupply = isPurchase && warehouseModuleOn && !isServiceSupply && Boolean(effectiveWarehouse)
  const showProject = Boolean(appStore.projectActive) && !isWarehouseSupply
  const stockDate = moment(date).format('YYYY-MM-DD')

  // Закрытый (неплановый) документ со складом уже сдвинул остатки — править нельзя
  const saveBlocked =
    isEditing && warehouseModuleOn && Boolean(existing) && !existing[shipment.plannedField] && Boolean(existing.warehouse_id)

  // ── Остатки по отмеченным товарам ─────────────────────────────────────────
  const stockTargets = useMemo(
    () =>
      warehouseModuleOn && isOutflow && effectiveWarehouse
        ? selectedRows.filter((row) => row.tip === 'product')
        : [],
    [warehouseModuleOn, isOutflow, effectiveWarehouse, selectedRows]
  )

  const stockResults = useQueries({
    queries: stockTargets.map((row) => ({
      queryKey: ['get_stock_count', row.productServiceId, effectiveWarehouse, stockDate],
      queryFn: () =>
        apiClient.invokeFunction({
          method: 'get_stock_count',
          data: { product_and_service_id: row.productServiceId, warehouse_id: effectiveWarehouse, date: stockDate },
        }),
      select: readStockCount,
      staleTime: 0,
    })),
  })

  const stockByKey = useMemo(() => {
    const map = {}
    stockTargets.forEach((row, index) => {
      const value = stockResults[index]?.data
      if (value != null) map[row.key] = value
    })
    return map
  }, [stockTargets, stockResults])

  const isShort = (row) =>
    !effectivePlanned && stockByKey[row.key] != null && toNumber(row.quantity) > stockByKey[row.key]

  // ── Справочники для выбора ────────────────────────────────────────────────
  const entityOptions = useMemo(
    () => legalEntities.map((item) => ({ value: item.guid, label: item.nazvanie })),
    [legalEntities]
  )
  const counterpartyOptions = useMemo(
    () => counterparties.map((item) => ({ value: item.guid, label: item.nazvanie || item.name })),
    [counterparties]
  )
  const articleOptions = useMemo(() => flattenArticles(chart, shipment.articleTypes), [chart, shipment.articleTypes])
  const warehouseOptions = useMemo(
    () => warehouses.map((item) => ({ value: item.guid, label: item.name })),
    [warehouses]
  )
  const projectOptions = useMemo(
    () => projects.map((item) => ({ value: item.guid, label: item.name || tc('noName') })),
    [projects, tc]
  )

  // ── Изменения ─────────────────────────────────────────────────────────────
  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: '' }))

  const toggleRow = (key) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, selected: !row.selected } : row)))
    clearError('products')
  }

  const updateRow = (key, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row
        const next = { ...row, [field]: value }
        if (field === 'price' && isReturn) next.price = String(signPrice(toNumber(value)))
        return next
      })
    )
  }

  // Поставка: склад и статья связаны. Склад подставляет свою статью,
  // а выбранная вручную статья значит «услуги без склада».
  const changeWarehouse = (value) => {
    setWarehouse(value)
    clearError('warehouse')
    if (!isPurchase) return
    setIsServiceSupply(false)
    setArticle(warehouses.find((item) => item.guid === value)?.chart_of_accounts_id || '')
    if (warehouseModuleOn && value) setProject('')
  }

  const changeArticle = (value) => {
    setArticle(value)
    if (!isPurchase) return
    setIsServiceSupply(Boolean(value))
    if (value) setWarehouse('')
  }

  const totalSum = selectedRows.reduce((acc, row) => acc + signPrice(calcRowSum(row)), 0)

  // ── Сохранение ────────────────────────────────────────────────────────────
  const { mutateAsync: save, isPending } = useUcodeRequestMutation()

  const submit = async () => {
    if (date && !ensureAllowed(date)) return

    const next = {}
    if (!date) next.date = t('shipmentDateRequired')
    if (!legalEntity) next.legalEntity = t('legalEntityRequired')
    if (!client) next.client = L.clientRequired
    if (selectedRows.length === 0) next.products = t('productsRequired')
    setErrors(next)
    if (Object.keys(next).length) return

    // Исполненный (неплановый) расход товара не должен превышать остаток.
    // Перед сохранением остатки берём заново, а не из подсказок в форме.
    if (warehouseModuleOn && effectiveWarehouse && !effectivePlanned && isOutflow) {
      const requested = new Map()
      stockTargets.forEach((row) => {
        requested.set(row.productServiceId, (requested.get(row.productServiceId) || 0) + toNumber(row.quantity))
      })

      setCheckingStock(true)
      try {
        const shortages = []
        await Promise.all(
          [...requested.entries()].map(async ([productId, quantity]) => {
            const response = await apiClient.invokeFunction({
              method: 'get_stock_count',
              data: { product_and_service_id: productId, warehouse_id: effectiveWarehouse, date: stockDate },
            })
            const available = readStockCount(response)
            if (quantity > available) {
              const name = list.find((row) => row.productServiceId === productId)?.name || ''
              shortages.push(t('stockExceeded', { name, available, requested: quantity }))
            }
          })
        )
        if (shortages.length) {
          showErrorNotification(shortages.join('\n'))
          setErrors({ products: t('stockError') })
          return
        }
      } catch {
        showErrorNotification(t('stockCheckFailed'))
        return
      } finally {
        setCheckingStock(false)
      }
    }

    const currency = appStore.isDonoSchool
      ? DONO_SCHOOL_CURRENCY
      : existing?.currencies_id || appStore.currency?.guid

    const payload = {
      legal_entity_id: legalEntity,
      [shipment.dealField]: dealGuid,
      partners_id: client,
      ...(showProject ? { projects_id: project || null } : {}),
      [shipment.plannedField]: effectivePlanned,
      status_nachislenie: ['confirmed'],
      type: shipment.operationType,
      summa: formatDecimal(totalSum),
      data_nachislenie: stockDate,
      data_oplaty: stockDate,
      currencies_id: currency,
      description: isPurchase ? 'Supply' : 'Shipment',
      chart_of_accounts_id: article || null,
      warehouse_id: effectiveWarehouse || null,
      product_and_service_data: selectedRows.map((row) => ({
        product_and_service_id: row.productServiceId,
        Naimenovanie: row.name,
        Artikul: row.article || '',
        Kol_vo: formatDecimal(toNumber(row.quantity)) || 0,
        TSena_za_ed: signPrice(formatDecimal(toNumber(row.price)) || 0),
        Summa: signPrice(formatDecimal(calcRowSum(row)) || 0),
        Skidka: toNumber(row.discount),
        NDS: toNumber(row.nds),
        unit_of_measurement_id: row.unitId || undefined,
        ...(row.rowGuid ? { guid: row.rowGuid } : {}),
      })),
      ...(isEditing ? { transaction_guid: shipmentGuid } : {}),
    }

    try {
      await save({ method: isEditing ? shipment.updateMethod : shipment.createMethod, data: payload })
      config.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      queryClient.invalidateQueries({ queryKey: [shipment.listMethod] })
      showSuccessNotification(isPurchase ? tm('deals.supplySaved') : tm('deals.shipmentSaved'))
      onClose()
    } catch (error) {
      showErrorNotification(error?.message || tm('form.saveFailed'))
    }
  }

  const busy = isPending || checkingStock
  const loading = loadingProducts || (isEditing && loadingExisting)

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={L.title}
      className="h-[92vh]"
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-500">{L.sum}</div>
            <div className={cn('truncate text-[17px] font-bold tabular-nums', isReturn ? 'text-red-600' : 'text-slate-900')}>
              <Money value={totalSum} currency={appStore.currency?.code || ''} />
            </div>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={busy || saveBlocked}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0e73f6] px-7 text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isEditing ? tc('save') : tc('create')}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isReturn && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              <Undo2 size={16} className="shrink-0" aria-hidden="true" />
              {tm('deals.returnHint')}
            </div>
          )}
          {saveBlocked && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{t('saveBlockedClosedWarehouse')}</div>
          )}

          {/* Позиции сделки */}
          <div className="px-1 pt-1 pb-1">
            <div className="text-[15px] font-bold text-slate-900">{L.products}</div>
            <div className={cn('mt-0.5 text-[12px]', errors.products ? 'text-red-600' : 'text-slate-500')}>
              {errors.products || tm('deals.pickProducts')}
            </div>
          </div>

          {list.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-6 py-8 text-center">
              <Package size={22} className="text-slate-400" aria-hidden="true" />
              <span className="text-[13px] text-slate-500">{tm('deals.noDealProducts')}</span>
            </div>
          )}

          {list.map((row) => {
            const short = row.selected && isShort(row)
            return (
              <div
                key={row.key}
                className={cn(
                  'rounded-2xl border px-3.5 py-3 transition-colors',
                  row.selected ? 'border-[#0e73f6]/40 bg-[#f5f9ff]' : 'border-slate-200 bg-white',
                  short && 'border-red-300 bg-red-50/40'
                )}
              >
                <button type="button" onClick={() => toggleRow(row.key)} className="flex w-full items-center gap-3 text-left">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                      row.selected ? 'border-[#0e73f6] bg-[#0e73f6] text-white' : 'border-slate-300'
                    )}
                  >
                    {row.selected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{row.name || tc('noName')}</span>
                    {!row.selected && (
                      <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                        {[row.quantity, row.unitName].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </span>
                  {row.selected && (
                    <span className="shrink-0 text-[15px] font-semibold tabular-nums text-slate-900">
                      <Money value={signPrice(calcRowSum(row))} currency="" />
                    </span>
                  )}
                </button>

                {row.selected && (
                  <div className="mt-3 grid grid-cols-2 gap-2 pl-9">
                    <label className="flex flex-col gap-0.5 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                      <span className="text-[11px] text-slate-500">
                        {t('quantity')}
                        {row.unitName ? `, ${row.unitName}` : ''}
                      </span>
                      <input
                        inputMode="decimal"
                        value={row.quantity}
                        onChange={(event) => updateRow(row.key, 'quantity', event.target.value)}
                        className="w-full bg-transparent text-[16px] font-semibold tabular-nums text-slate-900 outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-0.5 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                      <span className="text-[11px] text-slate-500">{t('price')}</span>
                      <input
                        inputMode="decimal"
                        value={row.price}
                        onChange={(event) => updateRow(row.key, 'price', event.target.value)}
                        className="w-full bg-transparent text-[16px] font-semibold tabular-nums text-slate-900 outline-none"
                      />
                    </label>
                    {stockByKey[row.key] != null && (
                      <span className={cn('col-span-2 text-[12px]', short ? 'font-semibold text-red-600' : 'text-slate-500')}>
                        {tm('deals.inStock', { count: stockByKey[row.key] })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Реквизиты документа */}
          <div className="px-1 pt-4 pb-1 text-[15px] font-bold text-slate-900">{tm('detail.details')}</div>

          <MDateField
            label={L.date}
            required
            value={date}
            onChange={(value) => {
              setDate(value)
              clearError('date')
            }}
            error={errors.date}
          />
          <MSelectField
            label={t('legalEntity')}
            required
            placeholder={tm('form.choose')}
            value={legalEntity}
            onChange={(value) => {
              setLegalEntity(value)
              clearError('legalEntity')
            }}
            options={entityOptions}
            loading={loadingEntities}
            error={errors.legalEntity}
          />
          <MSelectField
            label={L.client}
            required
            placeholder={tm('form.choose')}
            value={client}
            onChange={(value) => {
              setClient(value)
              clearError('client')
            }}
            options={counterpartyOptions}
            loading={loadingCounterparties}
            error={errors.client}
            avatars
          />
          {showWarehouse && (
            <MSelectField
              label={t('warehouse')}
              placeholder={t('warehousePlaceholder')}
              value={warehouse}
              onChange={changeWarehouse}
              options={warehouseOptions}
              error={errors.warehouse}
            />
          )}
          <MSelectField
            label={L.article}
            placeholder={L.noArticle}
            value={article}
            onChange={changeArticle}
            options={articleOptions}
            loading={loadingArticles}
          />
          {showProject && (
            <MSelectField
              label={t('project')}
              placeholder={t('projectPlaceholder')}
              value={project}
              onChange={setProject}
              options={projectOptions}
              loading={loadingProjects}
            />
          )}

          <div className={cn(isPlannedLocked && 'pointer-events-none opacity-60')}>
            <MSwitch
              label={L.planned}
              hint={
                isFutureDate
                  ? tm('deals.plannedFuture')
                  : isPlannedReadOnly
                    ? tm('deals.plannedNoRight')
                    : warehouseModuleOn
                      ? tm('deals.plannedHint')
                      : undefined
              }
              checked={effectivePlanned}
              onChange={setPlanned}
            />
          </div>
        </div>
      )}
    </BottomSheet>
  )
})
