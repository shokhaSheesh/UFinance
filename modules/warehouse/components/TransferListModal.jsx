'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Loader from '@/components/shared/Loader'
import { useWarehouseTransfers } from '@/hooks/useDashboard'
import { FormatDateRu, formatNumber } from '@/utils/helpers'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const LIMIT = 20

/**
 * История перемещений. На странице склада фильтруем по нему (`warehouse_id`
 * ловит документ с любой из двух сторон); без `warehouseId` — все перемещения
 * филиала.
 */
const TransferListModal = ({ open, onClose, warehouseId, canAdd, onCreate, onSelect, t }) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // каждое открытие начинается с чистого списка: модалка не размонтируется
  // при закрытии, поэтому сбрасываем состояние на смене `open`
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setPage(1)
      setSearch('')
      setDebouncedSearch('')
    }
  }

  // без warehouseId (страница списка складов) показываем перемещения филиала целиком
  const { data, isFetching } = useWarehouseTransfers(
    {
      ...(warehouseId ? { warehouse_id: warehouseId } : {}),
      page,
      limit: LIMIT,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    },
    { skip: !open }
  )

  const rows = data?.rows || []
  const total = Number(data?.pagination?.total ?? rows.length) || 0
  const totalPages = Math.max(1, Number(data?.pagination?.totalPages ?? 1) || 1)

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      contentClass="w-[980px] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-neutral-800">{t('transfer.listTitle')}</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('transfer.searchPlaceholder')}
              className="h-9 w-60 rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={onCreate}
              className="primary-btn flex items-center gap-1.5 text-sm"
            >
              <Plus size={16} />
              {t('transfer.createButton')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto px-3 py-3">
        {isFetching && rows.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">{t('transfer.listEmpty')}</p>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="px-3 pb-2.5 font-medium">{t('transfer.colDate')}</th>
                <th className="px-3 pb-2.5 font-medium">{t('transfer.colFrom')}</th>
                <th className="px-3 pb-2.5 font-medium">{t('transfer.colTo')}</th>
                <th className="px-3 pb-2.5 text-right font-medium">{t('transfer.colPositions')}</th>
                <th className="px-3 pb-2.5 text-right font-medium">{t('transfer.colQuantity')}</th>
                <th className="px-3 pb-2.5 text-right font-medium">{t('transfer.colAmount')}</th>
                <th className="px-3 pb-2.5 font-medium">{t('transfer.colComment')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={item?.guid || index}
                  onClick={() => onSelect?.(item)}
                  className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    {FormatDateRu(item?.transfer_date) || '—'}
                  </td>
                  <td className="px-3 py-3">{item?.from_warehouse_name || '—'}</td>
                  <td className="px-3 py-3">{item?.to_warehouse_name || '—'}</td>
                  <td className="px-3 py-3 text-right">{item?.items_count ?? '—'}</td>
                  <td className="px-3 py-3 text-right">
                    {formatNumber(Number(item?.total_quantity) || 0)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatNumber(Number(item?.total_amount) || 0)}
                  </td>
                  <td className="px-3 py-3 text-neutral-500">{item?.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-3 text-sm text-neutral-500">
          <span>{t('transfer.pageInfo', { page, totalPages, total })}</span>
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center justify-center rounded border border-gray-200 px-1.5 py-0.5 text-neutral-400 transition-colors enabled:cursor-pointer enabled:hover:text-neutral-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center justify-center rounded border border-gray-200 px-1.5 py-0.5 text-neutral-400 transition-colors enabled:cursor-pointer enabled:hover:text-neutral-700 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </CustomDialog>
  )
}

export default TransferListModal
