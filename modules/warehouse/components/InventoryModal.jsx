'use client'

import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import SelectProductService from '@/components/ReadyComponents/SelectProductService'
import SinglSelectStatiya from '@/components/ReadyComponents/SingleSelectStatiya'
import FormDatepicker from '@/components/shared/DatePicker/form-datepicker'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { getStockCount } from '@/lib/api/ucode/stock'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { formatAmountInput, formatDecimal, StringtoNumber } from '@/utils/helpers'
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Segmented from '@/components/shared/Segmented/Segmented'
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Инвентаризация склада: излишки (in — товар добавляется) или недостача
 * (out — списывается по средней себестоимости).
 *
 * Форма намеренно проще отгрузки: склад известен со страницы, проекта нет,
 * а цены не вводятся вовсе — считается только количество. Оценку строк
 * делает бэкенд (in — по текущей средней себестоимости, out — всегда по ней).
 */
const emptyRow = (id) => ({
  id,
  name: '', // value пикера (guid позиции каталога)
  productServiceId: '', // реальный product_and_service_id для API и остатков
  naimenovanie: '',
  artikul: '',
  quantity: '',
  unitName: '',
  isService: false, // услуги не влияют на склад — остаток не проверяем
})

const InventoryModal = observer(({ open, onClose, warehouseId, warehouseName, onCreated, t }) => {
  const [type, setType] = useState('out') // 'in' — излишки, 'out' — недостача
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'))
  const [legalEntity, setLegalEntity] = useState('')
  const [currency, setCurrency] = useState('') // валюта юрлица; иначе — валюта компании
  const [chartOfAccounts, setChartOfAccounts] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState([emptyRow(1)])
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const { mutateAsync: createInventory } = useUcodeRequestMutation()

  // product_and_service_id → остаток на складе на выбранную дату
  const [stockByProduct, setStockByProduct] = useState({})
  const stockInFlight = useRef(new Set())

  // сброс формы при каждом открытии
  useEffect(() => {
    if (!open) return
    setType('out')
    setDate(moment().format('YYYY-MM-DD'))
    setLegalEntity('')
    setCurrency('')
    setChartOfAccounts('')
    setDescription('')
    setRows([emptyRow(1)])
    setErrors({})
    setStockByProduct({})
  }, [open])

  // статья зависит от направления — при переключении сбрасываем выбранную
  const handleTypeChange = (next) => {
    if (next === type) return
    setType(next)
    setChartOfAccounts('')
  }

  // Смена склада/даты обесценивает загруженные остатки
  const stockScope = `${warehouseId}|${date}`
  const [prevStockScope, setPrevStockScope] = useState(stockScope)
  if (prevStockScope !== stockScope) {
    setPrevStockScope(stockScope)
    setStockByProduct({})
  }

  // Догружаем остатки всех выбранных товаров (только для недостачи)
  useEffect(() => {
    if (!open || type !== 'out' || !warehouseId) return
    rows.forEach((row) => {
      const pid = row.productServiceId
      if (!pid || row.isService || stockByProduct[pid] != null) return
      const key = `${stockScope}|${pid}`
      if (stockInFlight.current.has(key)) return
      stockInFlight.current.add(key)
      getStockCount({ productId: pid, warehouseId, date })
        .then((count) =>
          setStockByProduct((prev) => ({ ...prev, [pid]: count }))
        )
        .catch((e) => console.error('get_stock_count failed', e))
        .finally(() => stockInFlight.current.delete(key))
    })
  }, [open, type, warehouseId, date, rows, stockByProduct, stockScope])

  // Нехватки в реальном времени: сколько запрошено против остатка
  const shortages = useMemo(() => {
    if (type !== 'out') return []
    const requested = new Map()
    rows.forEach((row) => {
      const pid = row.productServiceId
      if (!pid || row.isService) return
      const q = formatDecimal(StringtoNumber(row.quantity)) || 0
      if (q <= 0) return
      requested.set(pid, {
        name: row.naimenovanie,
        qty: (requested.get(pid)?.qty || 0) + q,
      })
    })
    const out = []
    requested.forEach(({ name, qty }, pid) => {
      const available = stockByProduct[pid]
      if (available == null) return // ещё не загружен
      if (qty > available) out.push({ pid, name, requested: qty, available })
    })
    return out
  }, [type, rows, stockByProduct])

  const shortedIds = useMemo(() => new Set(shortages.map((s) => s.pid)), [shortages])

  const handleSelectProduct = (rowId, value, raw) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row
        return {
          ...row,
          name: value,
          productServiceId: raw?.product_and_service_id || value,
          naimenovanie: raw?.name || '',
          artikul: raw?.article || '',
          unitName: raw?.unit_name || '',
          // всё, что не «товар», склада не касается
          isService: !!raw?.tip && raw.tip !== 'product',
        }
      })
    )
    if (errors.products) setErrors((prev) => ({ ...prev, products: null }))
  }

  const updateQuantity = (rowId, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quantity: value } : row))
    )
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow(Date.now())])

  const removeRow = (rowId) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev))

  const handleCreate = async () => {
    const filled = rows.filter((row) => row.name)
    const newErrors = {}
    if (!date) newErrors.date = t('inventory.dateRequired')
    if (filled.length === 0) newErrors.products = t('inventory.productsRequired')
    if (filled.some((row) => !(formatDecimal(StringtoNumber(row.quantity)) > 0))) {
      newErrors.products = t('inventory.quantityRequired')
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSaving(true)
    try {
      // Недостача: контрольная проверка остатков свежими данными перед записью
      if (type === 'out') {
        const requested = new Map()
        filled.forEach((row) => {
          if (row.isService || !row.productServiceId) return
          const q = formatDecimal(StringtoNumber(row.quantity)) || 0
          requested.set(row.productServiceId, {
            name: row.naimenovanie,
            qty: (requested.get(row.productServiceId)?.qty || 0) + q,
          })
        })
        const fresh = await Promise.all(
          [...requested.entries()].map(async ([pid, { name, qty }]) => ({
            name,
            qty,
            available: await getStockCount({ productId: pid, warehouseId, date }),
          }))
        )
        const lacking = fresh.filter((item) => item.qty > item.available)
        if (lacking.length > 0) {
          showErrorNotification(
            lacking
              .map((s) =>
                t('inventory.stockExceeded', {
                  name: s.name,
                  available: formatAmountInput(s.available) || 0,
                  requested: formatAmountInput(s.qty),
                })
              )
              .join('\n')
          )
          return
        }
      }

      // Тело — как в согласованном curl: конверт обычного invoke_function
      // (branch_id добавит клиент). Склад шлём под обоими именами: основное
      // поле — warehouses_id, алиас warehouse_id в текущей сборке бэка
      // не списывает остаток.
      const res = await createInventory({
        method: 'create_inventory_transaction',
        data: {
          legal_entity_id: legalEntity || null,
          status_nachislenie: ['confirmed'],
          type,
          data_nachislenie: moment.parseZone(date).format('YYYY-MM-DD'),
          currencies_id: currency || GlobalCurrency?.guid || null,
          chart_of_accounts_id: chartOfAccounts || null,
          warehouse_id: warehouseId,
          warehouses_id: warehouseId,
          ...(description.trim() ? { description: description.trim() } : {}),
          product_and_service_data: filled.map((row) => ({
            product_and_service_id: row.productServiceId,
            Naimenovanie: row.naimenovanie,
            Artikul: row.artikul,
            Kol_vo: formatDecimal(StringtoNumber(row.quantity)) || 0,
          })),
        },
      })

      const payload = res?.data ?? {}
      if (payload?.success === false) {
        throw Object.assign(new Error(payload?.message || t('inventory.createFailed')), {
          details: res,
        })
      }

      showSuccessNotification(payload?.message || t('inventory.created'))
      // остатки склада и список операций (создано «Начисление») устарели
      queryClient.invalidateQueries({ queryKey: ['list_stock_balances'] })
      queryClient.invalidateQueries({ queryKey: ['operationsList'] })
      queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
      onCreated?.()
      onClose()
    } catch (error) {
      console.error('create_inventory_transaction', error)
      // ошибка хендлера: { status:'error', data:{ message } }
      showErrorNotification(
        error?.data?.message || error?.message || t('inventory.createFailed')
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[920px] max-w-full">
      <DialogHeader
        icon={ClipboardCheck}
        title={t('inventory.title')}
        subtitle={warehouseName || t('inventory.subtitle')}
        onClose={onClose}
      />

      <DialogBody className="flex flex-col gap-4">
        {/* Излишки или недостача — переключатель, как в других окнах */}
        <FormRow label={t('inventory.type')}>
          <Segmented
            className="self-start"
            ariaLabel={t('inventory.type')}
            value={type}
            onChange={handleTypeChange}
            options={[
              { value: 'in', label: t('inventory.typeIn') },
              { value: 'out', label: t('inventory.typeOut') },
            ]}
          />
        </FormRow>

        <FormRow label={t('inventory.date')} required error={errors.date}>
          <FormDatepicker
            value={date}
            onChange={(value) => {
              setDate(value)
              if (errors.date) setErrors((prev) => ({ ...prev, date: null }))
            }}
            format="YYYY-MM-DD"
            inputClass={'w-44!'}
          />
        </FormRow>

        <FormRow label={t('inventory.legalEntity')}>
          <SelectLegelEntitties
            multi={false}
            value={legalEntity}
            onChange={(value) => {
              setLegalEntity(value)
              if (!value) setCurrency('')
            }}
            placeholder={t('inventory.legalEntityPlaceholder')}
            // валюта юрлица уходит в currencies_id запроса
            childFieldName={'currenies_id'}
            returnFieldValue={(value) => setCurrency(value || '')}
            className="bg-white"
          />
        </FormRow>

        {/* Статья: излишки → доходная, недостача → расходная */}
        <FormRow label={type === 'in' ? t('inventory.incomeArticle') : t('inventory.expenseArticle')}>
          <SinglSelectStatiya
            key={type}
            selectedValue={chartOfAccounts}
            setSelectedValue={setChartOfAccounts}
            type={type === 'in' ? 'Расходы' : 'Доходы'}
            allowedTypes={type === 'in' ? ['Доходы'] : ['Расходы']}
            placeholder={
              type === 'in' ? t('inventory.unallocatedIncome') : t('inventory.unallocatedExpense')
            }
            className="bg-white"
          />
        </FormRow>

        <FormRow label={t('inventory.comment')}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('inventory.commentPlaceholder')}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
          />
        </FormRow>

        {/* Товары: только наименование и количество — без цен */}
        <div className="mt-2 flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-900">{t('inventory.products')}</span>

          {(errors.products || shortages.length > 0) && (
            <div className="flex flex-col gap-0.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {errors.products && <span>{errors.products}</span>}
              {shortages.map((s) => (
                <span key={s.pid}>
                  {t('inventory.stockExceeded', {
                    name: s.name,
                    available: formatAmountInput(s.available) || 0,
                    requested: formatAmountInput(s.requested),
                  })}
                </span>
              ))}
            </div>
          )}

          <div className="overflow-visible rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="h-9 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-3 text-left">{t('inventory.productName')}</th>
                  <th className="w-[110px] border-l border-slate-200 px-2 text-right">{t('inventory.quantity')}</th>
                  <th className="w-[90px] border-l border-slate-200 px-2 text-right">{t('inventory.unit')}</th>
                  {type === 'out' && (
                    <th className="w-[110px] border-l border-slate-200 px-2 text-right">{t('inventory.available')}</th>
                  )}
                  <th className="w-10 border-l border-slate-200" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const available = row.productServiceId ? stockByProduct[row.productServiceId] : null
                  const isShorted = row.productServiceId && shortedIds.has(row.productServiceId)
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-none">
                      <td>
                        <div className="p-1 pr-2">
                          <SelectProductService
                            value={row.name}
                            selectedLabel={row.naimenovanie}
                            onChange={(value, raw) => handleSelectProduct(row.id, value, raw)}
                            // весь каталог товаров — без привязки к сделке
                            type="product"
                            placeholder={t('inventory.selectProduct')}
                            className="bg-white border-none"
                          />
                        </div>
                      </td>
                      <td className="border-l border-slate-200">
                        <input
                          type="text"
                          value={formatAmountInput(row.quantity)}
                          onChange={(e) => updateQuantity(row.id, formatAmountInput(e.target.value))}
                          className={`h-10 w-full pr-2 text-end text-xs tabular-nums outline-none ${isShorted ? 'bg-red-50 text-red-600' : ''}`}
                        />
                      </td>
                      <td className="border-l border-slate-200">
                        <span className="block h-10 truncate pr-2 text-end text-xs leading-10 text-slate-500">
                          {row.unitName || '—'}
                        </span>
                      </td>
                      {type === 'out' && (
                        <td className="border-l border-slate-200">
                          <span
                            className={`block h-10 pr-2 text-end text-xs leading-10 tabular-nums ${isShorted ? 'font-medium text-red-600' : 'text-slate-500'}`}
                          >
                            {row.isService
                              ? '—'
                              : available != null
                                ? formatAmountInput(available) || 0
                                : row.productServiceId
                                  ? '…'
                                  : ''}
                          </span>
                        </td>
                      )}
                      <td className="border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="flex h-10 w-full cursor-pointer items-center justify-center text-slate-300 transition-colors hover:text-red-500 disabled:cursor-default disabled:opacity-30 disabled:hover:text-slate-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-slate-50"
          >
            <Plus size={15} aria-hidden="true" />
            {t('inventory.addRow')}
          </button>
        </div>
      </DialogBody>

      <DialogFooter
        left={
          <span className="text-xs text-slate-400">
            <span className="text-red-500">*</span> {t('inventory.requiredFields')}
          </span>
        }
      >
        <button type="button" className="secondary-btn" onClick={onClose}>
          {t('inventory.cancel')}
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={handleCreate}
          disabled={isSaving || shortages.length > 0}
        >
          {isSaving ? <Loader /> : t('inventory.create')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
})

export default InventoryModal
