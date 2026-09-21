'use client'

import useModalPresence from '@/hooks/useModalPresence'
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
import { Trash2, X } from 'lucide-react'
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
  useModalPresence()

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

  if (!open) return null

  return (
    <div className="fixed top-[60px] left-[var(--sidebar-w)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] h-[calc(100%-60px)] right-[var(--ai-w,0px)] bottom-0 flex justify-end bg-black/50 z-1000 transition-opacity duration-300">
      <div className="h-full bg-white flex flex-col w-[860px] max-w-full shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 relative">
          <h2 className="text-lg font-semibold">{t('transfer.createTitle')}</h2>
          <button
            className="p-2 absolute right-4 top-2 hover:bg-gray-100 rounded-full cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-auto">
          {/* Откуда */}
          <div className="flex items-center gap-2 pb-3">
            <label className="w-40 shrink-0 text-xss!">
              {t('transfer.from')} <span className="text-red-500">*</span>
            </label>
            <div>
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
                className="w-80! bg-white"
                hasError={!!errors.fromWarehouse}
              />
              {errors.fromWarehouse && (
                <div className="text-[11px] text-red-500 mt-1">{errors.fromWarehouse}</div>
              )}
            </div>
          </div>

          {/* Куда */}
          <div className="flex items-center gap-2 pb-3">
            <label className="w-40 shrink-0 text-xss!">
              {t('transfer.to')} <span className="text-red-500">*</span>
            </label>
            <div>
              <SingleSelect
                data={toWarehouseOptions}
                value={toWarehouse}
                onChange={(value) => {
                  setToWarehouse(value)
                  setErrors((prev) => ({ ...prev, toWarehouse: null }))
                }}
                placeholder={t('transfer.warehousePlaceholder')}
                className="w-80! bg-white"
                hasError={!!errors.toWarehouse}
              />
              {errors.toWarehouse && (
                <div className="text-[11px] text-red-500 mt-1">{errors.toWarehouse}</div>
              )}
            </div>
          </div>

          {/* Дата */}
          <div className="flex items-center gap-2 pb-3">
            <label className="w-40 shrink-0 text-xss!">
              {t('transfer.date')} <span className="text-red-500">*</span>
            </label>
            <div>
              <FormDatepicker
                value={date}
                onChange={(value) => {
                  setDate(value)
                  if (errors.date) setErrors((prev) => ({ ...prev, date: null }))
                }}
                format="YYYY-MM-DD"
                inputClass={'w-44!'}
              />
              {errors.date && <div className="text-[11px] text-red-500 mt-1">{errors.date}</div>}
            </div>
          </div>

          {/* Юрлицо */}
          <div className="flex items-center gap-2 pb-3">
            <label className="w-40 shrink-0 text-xss!">{t('transfer.legalEntity')}</label>
            <SelectLegelEntitties
              multi={false}
              value={legalEntity}
              onChange={setLegalEntity}
              placeholder={t('transfer.legalEntityPlaceholder')}
              className="w-80! bg-white"
            />
          </div>

          {/* Проект — только когда модуль проектов включён */}
          {appStore.projectActive && (
            <div className="flex items-center gap-2 pb-3">
              <label className="w-40 shrink-0 text-xss!">{t('transfer.project')}</label>
              <SelectProjects
                value={project}
                onChange={setProject}
                placeholder={t('transfer.projectPlaceholder')}
                className="w-80! bg-white"
              />
            </div>
          )}

          {/* Комментарий */}
          <div className="flex items-center gap-2 pb-3">
            <label className="w-40 shrink-0 text-xss!">{t('transfer.comment')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transfer.commentPlaceholder')}
              className="w-80 h-10 px-3 text-sm border border-gray-200 rounded-md outline-none bg-white focus:border-primary"
            />
          </div>

          {/* Товары: только наименование и количество — без цен */}
          <div className="mt-2">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-sm font-medium text-neutral-800">
                {t('transfer.products')}
              </span>
              <span className="text-[11px] text-neutral-400">{t('transfer.costHint')}</span>
              {errors.products && (
                <span className="text-[10px] text-red-500 font-medium">{errors.products}</span>
              )}
              {shortages.map((s) => (
                <span key={s.pid} className="text-[10px] text-red-500 font-medium">
                  {t('transfer.stockExceeded', {
                    name: s.name,
                    available: formatAmountInput(s.available) || 0,
                    requested: formatAmountInput(s.requested),
                  })}
                </span>
              ))}
            </div>

            <div className="border border-gray-200 rounded-md overflow-visible">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 font-light h-8 text-mini border-b border-gray-200">
                    <th className="text-left px-3">{t('transfer.productName')}</th>
                    <th className="w-[110px] border-l border-gray-200 text-right px-2">
                      {t('transfer.quantity')}
                    </th>
                    <th className="w-[90px] border-l border-gray-200 text-right px-2">
                      {t('transfer.unit')}
                    </th>
                    <th className="w-[110px] border-l border-gray-200 text-right px-2">
                      {t('transfer.available')}
                    </th>
                    <th className="w-10 border-l border-gray-200" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const available = row.productServiceId
                      ? stockByProduct[row.productServiceId]
                      : null
                    const isShorted =
                      row.productServiceId && shortedIds.has(row.productServiceId)
                    return (
                      <tr key={row.id} className="border-b border-gray-100 last:border-none">
                        <td>
                          <div className="pr-2 pt-1 pb-1 pl-1">
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
                                fromWarehouse
                                  ? t('transfer.selectProduct')
                                  : t('transfer.selectWarehouseFirst')
                              }
                              className="bg-white border-none"
                            />
                          </div>
                        </td>
                        <td className="border-l border-gray-200">
                          <input
                            type="text"
                            value={formatAmountInput(row.quantity)}
                            onChange={(e) =>
                              updateQuantity(row.id, formatAmountInput(e.target.value))
                            }
                            className={`w-full h-10 text-end text-xs outline-none pr-2 ${
                              isShorted ? 'bg-red-50 text-red-600' : ''
                            }`}
                          />
                        </td>
                        <td className="border-l border-gray-200">
                          <span className="block h-10 truncate pr-2 text-end text-xs leading-10 text-neutral-500">
                            {row.unitName || '—'}
                          </span>
                        </td>
                        <td className="border-l border-gray-200">
                          <span
                            className={`block h-10 pr-2 text-end text-xs leading-10 ${
                              isShorted ? 'text-red-600 font-medium' : 'text-neutral-500'
                            }`}
                          >
                            {available != null
                              ? formatAmountInput(available) || 0
                              : row.productServiceId
                                ? '…'
                                : ''}
                          </span>
                        </td>
                        <td className="border-l border-gray-200">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            className="flex items-center justify-center w-full h-10 text-neutral-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-neutral-300 cursor-pointer disabled:cursor-default"
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
              className="mt-2 text-sm text-primary cursor-pointer hover:underline"
            >
              {t('transfer.addRow')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <span className="text-xs text-neutral-400">
            <span className="text-red-500">*</span> {t('transfer.requiredFields')}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 h-10 text-sm text-primary cursor-pointer hover:bg-gray-50 rounded-md font-medium"
              onClick={onClose}
            >
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
          </div>
        </div>
      </div>
    </div>
  )
})

export default TransferModal
