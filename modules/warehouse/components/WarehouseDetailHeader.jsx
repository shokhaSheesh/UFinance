'use client'

import BackLink from '@/components/shared/BackLink/BackLink'
import Input from '@/components/shared/Input'
import { Search } from 'lucide-react'

const WarehouseDetailHeader = ({
  t,
  warehouseName,
  searchQuery,
  setSearchQuery,
  onOpenPlanned,
  onOpenInventory,
  onOpenTransfers,
}) => {
  return (
    <div className="shrink-0 bg-white">
      <div className="px-6 pt-4">
        <BackLink href="/warehouse" label={t('pageTitle')} />
      </div>
      <div className="flex items-center justify-between gap-4 px-6 pt-1.5 pb-4">
        <h1 className="text-xl font-bold text-neutral-800 truncate">{warehouseName || t('pageTitle')}</h1>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => onOpenPlanned?.('shipment')}
            className="primary-btn text-sm rounded-sm! cursor-pointer"
          >
            {t('planned.sales')}
          </button>
          <button
            type="button"
            onClick={() => onOpenPlanned?.('supply')}
            className="primary-btn text-sm rounded-sm! cursor-pointer"
          >
            {t('planned.purchases')}
          </button>
          <button
            type="button"
            onClick={() => onOpenInventory?.()}
            className="primary-btn text-sm rounded-sm! cursor-pointer"
          >
            {t('inventory.button')}
          </button>
          <button
            type="button"
            onClick={() => onOpenTransfers?.()}
            className="primary-btn text-sm rounded-sm! cursor-pointer"
          >
            {t('transfer.button')}
          </button>
        </div>
        <div className="w-72 shrink-0">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>
    </div>
  )
}

export default WarehouseDetailHeader
