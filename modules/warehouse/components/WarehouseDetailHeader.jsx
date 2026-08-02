'use client'

import Input from '@/components/shared/Input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const WarehouseDetailHeader = ({
  t,
  warehouseName,
  searchQuery,
  setSearchQuery,
  onOpenPlanned,
}) => {
  const router = useRouter()

  return (
    <div className="shrink-0 bg-white">
      <div className="px-6 pt-4 text-sm">
        <button
          type="button"
          onClick={() => router.push('/warehouse')}
          className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          {t('pageTitle')}
        </button>
        <span className="text-neutral-300 mx-1.5">/</span>
        <span className="text-neutral-800 font-medium">{warehouseName}</span>
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
