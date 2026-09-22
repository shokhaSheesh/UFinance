'use client'

import BackLink from '@/components/shared/BackLink/BackLink'
import { ArrowLeftRight, ClipboardCheck, MapPin, PackageOpen, Truck, Warehouse as WarehouseIcon } from 'lucide-react'

/**
 * Шапка карточки склада: ссылка к списку, значок, название с отметкой
 * «Основной» и адрес; справа — действия со складом.
 *
 * Раньше это были четыре одинаковые синие кнопки «Продажа / Закупки /
 * Инвентаризация / Перемещение» — «Продажа» и «Закупки» при этом открывали
 * списки плановых отгрузок и поставок. Теперь подписи говорят, что откроется,
 * у каждой кнопки свой значок, а основная — одна (перемещение).
 * Поиск переехал в панель над таблицей.
 */
const WarehouseDetailHeader = ({
  t,
  warehouseName,
  address,
  isDefault,
  onOpenPlanned,
  onOpenInventory,
  onOpenTransfers,
}) => {
  return (
    <div className="shrink-0 px-6 pt-4">
      <BackLink href="/warehouse" label={t('pageTitle')} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
            <WarehouseIcon size={20} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-slate-900">{warehouseName || t('pageTitle')}</h1>
              {isDefault && (
                <span className="shrink-0 rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-medium text-[#0e73f6]">
                  {t('defaultBadge')}
                </span>
              )}
            </div>
            {address && (
              <span className="flex items-center gap-1 truncate text-sm text-slate-500">
                <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                {address}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onOpenPlanned?.('shipment')} className="secondary-btn h-9 gap-2">
            <Truck size={16} aria-hidden="true" />
            {t('planned.listTitleSales')}
          </button>
          <button type="button" onClick={() => onOpenPlanned?.('supply')} className="secondary-btn h-9 gap-2">
            <PackageOpen size={16} aria-hidden="true" />
            {t('planned.listTitlePurchases')}
          </button>
          <button type="button" onClick={() => onOpenInventory?.()} className="secondary-btn h-9 gap-2">
            <ClipboardCheck size={16} aria-hidden="true" />
            {t('inventory.button')}
          </button>
          <button type="button" onClick={() => onOpenTransfers?.()} className="primary-btn gap-1.5">
            <ArrowLeftRight size={16} aria-hidden="true" />
            {t('transfer.button')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarehouseDetailHeader
