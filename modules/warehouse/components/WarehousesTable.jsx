'use client'

import WarehouseMenu from '@/components/warehouse/WarehouseMenu/WarehouseMenu'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const thBase =
  'sticky top-0 z-10 bg-white text-left font-medium text-neutral-400 text-xs px-3.5 py-3 border-b border-gray-200 whitespace-nowrap'
const tdBase = 'px-3.5 py-3 border-b border-gray-100 whitespace-nowrap text-neutral-700'

const WarehousesTable = ({ t, tc, warehouses, isLoading, onEdit, onDelete }) => {
  const router = useRouter()

  return (
    <div className="flex-1 min-h-0 overflow-auto px-3">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th className={thBase}>{t('table.name')}</th>
            <th className={thBase}>{t('table.address')}</th>
            <th className={thBase}>{t('table.comment')}</th>
            <th className={cn(thBase, 'text-center')}>{t('table.default')}</th>
            <th className={cn(thBase, 'w-14')} aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="py-16 text-center text-neutral-400">
                {tc('loading')}
              </td>
            </tr>
          ) : warehouses.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center text-neutral-400">
                {t('emptyWarehouses')}
              </td>
            </tr>
          ) : (
            warehouses.map((warehouse) => (
              <tr
                key={warehouse.guid}
                onClick={() => router.push(`/warehouse/${warehouse.guid}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className={cn(tdBase, 'font-medium')}>{warehouse.name || tc('noName')}</td>
                <td className={cn(tdBase, 'text-neutral-400')}>{warehouse.address || '—'}</td>
                <td className={cn(tdBase, 'text-neutral-400 max-w-xs truncate')}>{warehouse.comment || '—'}</td>
                <td className={cn(tdBase, 'text-center')}>
                  {warehouse.is_default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {t('defaultBadge')}
                    </span>
                  )}
                </td>
                <td className={cn(tdBase, 'text-center')} onClick={(e) => e.stopPropagation()}>
                  <WarehouseMenu warehouse={warehouse} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default WarehousesTable
