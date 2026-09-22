'use client'

import WarehouseMenu from '@/components/warehouse/WarehouseMenu/WarehouseMenu'
import { cn } from '@/lib/utils'
import { useRouter } from '@/hooks/useAppRouter'
import { ChevronRight, MapPin, Warehouse as WarehouseIcon } from 'lucide-react'

const thBase =
  'sticky top-0 z-10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 px-4 py-2.5 border-b border-slate-200 whitespace-nowrap'
const tdBase = 'px-4 py-3 border-b border-slate-100 whitespace-nowrap text-slate-700'

const DefaultBadge = ({ label }) => (
  <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-medium text-[#0e73f6]">{label}</span>
)

/**
 * Склады — карточками (по умолчанию: складов обычно немного, и адрес с
 * комментарием так читаются целиком) или таблицей с прежними колонками.
 */
const WarehousesTable = ({ t, tc, view = 'cards', warehouses, isLoading, canEdit, canDelete, onEdit, onDelete }) => {
  const router = useRouter()
  const open = (warehouse) => router.push(`/warehouse/${warehouse.guid}`)

  const menu = (warehouse) => (
    <WarehouseMenu warehouse={warehouse} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
  )

  if (isLoading || warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <WarehouseIcon size={22} aria-hidden="true" />
        </span>
        <span className="text-sm text-slate-500">{isLoading ? tc('loading') : t('emptyWarehouses')}</span>
      </div>
    )
  }

  if (view === 'cards') {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 p-4">
        {warehouses.map((warehouse) => (
          <div
            key={warehouse.guid}
            role="button"
            tabIndex={0}
            onClick={() => open(warehouse)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open(warehouse)
              }
            }}
            className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0e73f6]/50 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <WarehouseIcon size={18} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-semibold text-slate-900">{warehouse.name || tc('noName')}</span>
                {warehouse.is_default && <span><DefaultBadge label={t('defaultBadge')} /></span>}
              </div>
              <div onClick={(e) => e.stopPropagation()}>{menu(warehouse)}</div>
            </div>

            <div className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="line-clamp-2">{warehouse.address || '—'}</span>
            </div>
            {warehouse.comment && <p className="line-clamp-2 text-xs text-slate-400">{warehouse.comment}</p>}

            <div className="mt-auto flex items-center justify-end gap-1 border-t border-slate-100 pt-3 text-sm font-medium text-slate-500 transition-colors group-hover:text-[#0e73f6]">
              {t('open')}
              <ChevronRight size={15} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
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
          {warehouses.map((warehouse) => (
            <tr key={warehouse.guid} onClick={() => open(warehouse)} className="cursor-pointer transition-colors hover:bg-[#f5f8ff]">
              <td className={cn(tdBase, 'font-medium text-slate-900')}>
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <WarehouseIcon size={16} aria-hidden="true" />
                  </span>
                  {warehouse.name || tc('noName')}
                </span>
              </td>
              <td className={cn(tdBase, 'text-slate-600')}>{warehouse.address || '—'}</td>
              <td className={cn(tdBase, 'max-w-xs truncate text-slate-400')}>{warehouse.comment || '—'}</td>
              <td className={cn(tdBase, 'text-center')}>{warehouse.is_default && <DefaultBadge label={t('defaultBadge')} />}</td>
              <td className={cn(tdBase, 'text-center')} onClick={(e) => e.stopPropagation()}>{menu(warehouse)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WarehousesTable
