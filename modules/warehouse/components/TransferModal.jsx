'use client'

import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import SelectProductService from '@/components/ReadyComponents/SelectProductService'
import SelectProjects from '@/components/ReadyComponents/SelectProjects'
import FormDatepicker from '@/components/shared/DatePicker/form-datepicker'
import Loader from '@/components/shared/Loader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useCreateWarehouseTransfer, useWarehousesList } from '@/hooks/useDashboard'
import { getStockCount } from '@/lib/api/ucode/stock'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useWarehouseStockProducts } from '@/modules/warehouse/hooks/useWarehouseStockProducts'
import { appStore } from '@/store/app.store'
import { formatAmountInput, formatDecimal, StringtoNumber } from '@/utils/helpers'
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Перемещение товара между складами.
 *
 * Цены здесь не вводятся принципиально: строку оценивает бэкенд по средней
 * себестоимости склада-отправителя и с ней же приходует на склад-получатель,
 * поэтому валюту и суммы фронт не отправляет. Перемещаются только товары —
 * услуги остатки не двигают.
 */
const emptyRow = (id) => ({
  id,
  name: '', // value пикера (guid позиции каталога)
  productServiceId: '', // реальный product_and_service_id — для API и остатков
  naimenovanie: '',
  artikul: '',
  quantity: '',
  unitName: '',
})

const TransferModal = observer(({ open, onClose, warehouseId, onCreated, t }) => {
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'))
  const [legalEntity, setLegalEntity] = useState('')
  const [project, setProject] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState([emptyRow(1)])
  const [errors, setErrors] = useState({})

  const { data: warehousesData } = useWarehousesList()
  const { mutateAsync: createTransfer, isPending: isSaving } = useCreateWarehouseTransfer()

  // Пикер показывает только позиции склада-отправителя: перемещать можно
  // лишь то, что на нём лежит
  const { productIds: stockProductIds, isLoading: isLoadingStockProducts } =
    useWarehouseStockProducts(fromWarehouse, { skip: !open })

  // product_and_service_id → остаток на складе-отправителе на выбранную дату
  const [stockByProduct, setStockByProduct] = useState({})
  const stockInFlight = useRef(new Set())

  // сброс формы при каждом открытии: склад страницы — отправитель по умолчанию
  useEffect(() => {
    if (!open) return
    setFromWarehouse(warehouseId || '')
    setToWarehouse('')
    setDate(moment().format('YYYY-MM-DD'))
    setLegalEntity('')
    setProject('')
    setDescription('')
    setRows([emptyRow(1)])
    setErrors({})
    setStockByProduct({})
  }, [open, warehouseId])

  const warehouseOptions = useMemo(
    () => (warehousesData || []).map((w) => ({ value: w.guid, label: w.name })),
    [warehousesData]
  )

  // Склад-получатель обязан отличаться от отправителя — убираем его из списка
  const toWarehouseOptions = useMemo(
    () => warehouseOptions.filter((option) => option.value !== fromWarehouse),
    [warehouseOptions, fromWarehouse]
  )

  // Смена склада-отправителя или даты обесценивает загруженные остатки
  const stockScope = `${fromWarehouse}|${date}`
  const [prevStockScope, setPrevStockScope] = useState(stockScope)
  if (prevStockScope !== stockScope) {
    setPrevStockScope(stockScope)
    setStockByProduct({})
  }

  // Догружаем остатки выбранных товаров на складе-отправителе
  useEffect(() => {
    if (!open || !fromWarehouse) return
    rows.forEach((row) => {
      const pid = row.productServiceId
      if (!pid || stockByProduct[pid] != null) return
      const key = `${stockScope}|${pid}`
      if (stockInFlight.current.has(key)) return
      stockInFlight.current.add(key)
      getStockCount({ productId: pid, warehouseId: fromWarehouse, date })
        .then((count) => setStockByProduct((prev) => ({ ...prev, [pid]: count })))
        .catch((e) => console.error('get_stock_count failed', e))
        .finally(() => stockInFlight.current.delete(key))
    })
  }, [open, fromWarehouse, date, rows, stockByProduct, stockScope])

  // Нехватки в реальном времени: сколько запрошено против остатка
  const shortages = useMemo(() => {
    const requested = new Map()
    rows.forEach((row) => {
      const pid = row.productServiceId
      if (!pid) return
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
  }, [rows, stockByProduct])

  const shortedIds = useMemo(() => new Set(shortages.map((s) => s.pid)), [shortages])

  const handleSelectProduct = (rowId, value, raw) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              name: value,
              productServiceId: raw?.product_and_service_id || value,
              naimenovanie: raw?.name || '',
              artikul: raw?.article || '',
              unitName: raw?.unit_name || '',
            }
          : row
      )
    )
    if (errors.products) setErrors((prev) => ({ ...prev, products: null }))
  }

  const updateQuantity = (rowId, value) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, quantity: value } : row)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow(Date.now())])

  const removeRow = (rowId) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev))

  const handleCreate = async () => {
    const filled = rows.filter((row) => row.name)
    const newErrors = {}
    if (!fromWarehouse) newErrors.fromWarehouse = t('transfer.fromRequired')
    if (!toWarehouse) newErrors.toWarehouse = t('transfer.toRequired')
    if (fromWarehouse && toWarehouse && fromWarehouse === toWarehouse) {
      newErrors.toWarehouse = t('transfer.sameWarehouse')
    }
    if (!date) newErrors.date = t('transfer.dateRequired')
    if (filled.length === 0) newErrors.products = t('transfer.productsRequired')
    else if (filled.some((row) => !(formatDecimal(StringtoNumber(row.quantity)) > 0))) {
      newErrors.products = t('transfer.quantityRequired')
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Контрольная проверка остатков свежими данными: между выбором товара и
      // сохранением остаток мог уйти другим документом
      const requested = new Map()
      filled.forEach((row) => {
        if (!row.productServiceId) return
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
          available: await getStockCount({ productId: pid, warehouseId: fromWarehouse, date }),
        }))
      )
      const lacking = fresh.filter((item) => item.qty > item.available)
      if (lacking.length > 0) {
        showErrorNotification(
          lacking
            .map((s) =>
              t('transfer.stockExceeded', {
                name: s.name,
                available: formatAmountInput(s.available) || 0,
                requested: formatAmountInput(s.qty),
              })
            )
            .join('\n')
        )
        return
      }

      const payload = await createTransfer({
        from_warehouse_id: fromWarehouse,
        to_warehouse_id: toWarehouse,
        transfer_date: moment.parseZone(date).format('YYYY-MM-DD'),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(legalEntity ? { legal_entity_id: legalEntity } : {}),
        ...(project ? { projects_id: project } : {}),
        // Цены не отправляем: строку оценивает бэк по средней себестоимости
        product_and_service_data: filled.map((row) => ({
          product_and_service_id: row.productServiceId,
          Naimenovanie: row.naimenovanie,
          Artikul: row.artikul,
          Kol_vo: formatDecimal(StringtoNumber(row.quantity)) || 0,
        })),
      })

      showSuccessNotification(payload?.message || t('transfer.created'))
      onCreated?.(payload?.data || null)
      onClose()
    } catch (error) {
      console.error('create_warehouse_transfer', error)
      showErrorNotification(
        error?.data?.message || error?.message || t('transfer.createFailed')
      )
    }
  }

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[920px] max-w-full">
      <DialogHeader
        icon={ArrowLeftRight}
        title={t('transfer.createTitle')}
        subtitle={t('transfer.subtitle')}
        onClose={onClose}
      />

      <DialogBody className="flex flex-col gap-4">
        <FormRow label={t('transfer.from')} required error={errors.fromWarehouse}>
          <SingleSelect
            data={warehouseOptions}
            value={fromWarehouse}
            onChange={(value) => {
              setFromWarehouse(value)
              // получатель мог совпасть с новым отправителем
              if (value && value === toWarehouse) setToWarehouse('')
              // на другом складе выбранных товаров может не быть
              setRows([emptyRow(Date.now())])
              setStockByProduct({})
              setErrors((prev) => ({ ...prev, fromWarehouse: null }))
            }}
            placeholder={t('transfer.warehousePlaceholder')}
            className="bg-white"
            hasError={!!errors.fromWarehouse}
          />
        </FormRow>

        <FormRow label={t('transfer.to')} required error={errors.toWarehouse}>
          <SingleSelect
            data={toWarehouseOptions}
            value={toWarehouse}
            onChange={(value) => {
              setToWarehouse(value)
              setErrors((prev) => ({ ...prev, toWarehouse: null }))
            }}
            placeholder={t('transfer.warehousePlaceholder')}
            className="bg-white"
            hasError={!!errors.toWarehouse}
          />
        </FormRow>

        <FormRow label={t('transfer.date')} required error={errors.date}>
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

        <FormRow label={t('transfer.legalEntity')}>
          <SelectLegelEntitties
            multi={false}
            value={legalEntity}
            onChange={setLegalEntity}
            placeholder={t('transfer.legalEntityPlaceholder')}
            className="bg-white"
          />
        </FormRow>

        {/* Проект — только когда модуль проектов включён */}
        {appStore.projectActive && (
          <FormRow label={t('transfer.project')}>
            <SelectProjects
              value={project}
              onChange={setProject}
              placeholder={t('transfer.projectPlaceholder')}
              className="bg-white"
            />
          </FormRow>
        )}

        <FormRow label={t('transfer.comment')}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('transfer.commentPlaceholder')}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
          />
        </FormRow>

        {/* Товары: только наименование и количество — без цен */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">{t('transfer.products')}</span>
            <span className="text-xs text-slate-400">{t('transfer.costHint')}</span>
          </div>

          {(errors.products || shortages.length > 0) && (
            <div className="flex flex-col gap-0.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {errors.products && <span>{errors.products}</span>}
              {shortages.map((s) => (
                <span key={s.pid}>
                  {t('transfer.stockExceeded', {
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
                  <th className="px-3 text-left">{t('transfer.productName')}</th>
                  <th className="w-[110px] border-l border-slate-200 px-2 text-right">{t('transfer.quantity')}</th>
                  <th className="w-[90px] border-l border-slate-200 px-2 text-right">{t('transfer.unit')}</th>
                  <th className="w-[110px] border-l border-slate-200 px-2 text-right">{t('transfer.available')}</th>
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
                            // перемещаются только товары — услуги склада не касаются
                            type="product"
                            // и только те, что есть на складе-отправителе
                            allowedProductIds={fromWarehouse ? stockProductIds : null}
                            disabled={!fromWarehouse || isLoadingStockProducts}
                            placeholder={
                              fromWarehouse ? t('transfer.selectProduct') : t('transfer.selectWarehouseFirst')
                            }
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
                      <td className="border-l border-slate-200">
                        <span
                          className={`block h-10 pr-2 text-end text-xs leading-10 tabular-nums ${isShorted ? 'font-medium text-red-600' : 'text-slate-500'}`}
                        >
                          {available != null ? formatAmountInput(available) || 0 : row.productServiceId ? '…' : ''}
                        </span>
                      </td>
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
            {t('transfer.addRow')}
          </button>
        </div>
      </DialogBody>

      <DialogFooter
        left={
          <span className="text-xs text-slate-400">
            <span className="text-red-500">*</span> {t('transfer.requiredFields')}
          </span>
        }
      >
        <button type="button" className="secondary-btn" onClick={onClose}>
          {t('transfer.cancel')}
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={handleCreate}
          disabled={isSaving || shortages.length > 0}
        >
          {isSaving ? <Loader /> : t('transfer.create')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
})

export default TransferModal
