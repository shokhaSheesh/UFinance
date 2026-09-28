'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { Loader2, Package, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

/**
 * Остатки одного склада.
 *
 * Настольная таблица показывает двенадцать колонок на позицию. На телефоне
 * из них важны три: сколько есть, сколько ждём и на какую сумму. Остальное
 * — себестоимость, цена продажи, дни на складе — открывается по нажатию на
 * строку, чтобы список оставался читаемым.
 */
const MobileWarehouseStockPage = observer(() => {
  const t = useTranslations('Warehouse')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const warehouseId = params?.id

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [openRow, setOpenRow] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const { data: warehouse } = useUcodeRequestQuery({
    method: 'get_warehouse_by_id',
    data: { guid: warehouseId },
    skip: !warehouseId,
    querySetting: { select: (response) => response?.data?.data },
  })

  const { data, isLoading } = useUcodeRequestQuery({
    queryKey: 'list_stock_balances',
    method: 'list_stock_balances',
    data: { warehouse_id: warehouseId, page: 1, limit: 100, search: debounced },
    skip: !warehouseId,
    querySetting: { select: (response) => response?.data, placeholderData: (prev) => prev },
  })

  const items = useMemo(
    () =>
      (data?.data || []).map((item) => ({
        guid: item?.guid,
        name: item?.product_name || '—',
        artikul: item?.artikul || '',
        waiting: Number(item?.waiting_quantity) || 0,
        available: Number(item?.quantity) || 0,
        unit: item?.unit_short_name || '',
        daysInStock: Number(item?.days_since_update) || 0,
        averageCost: Number(item?.average_cost) || 0,
        totalCost: Number(item?.total_cost) || 0,
        salePrice: Number(item?.sale_price) || 0,
        saleTotal: Number(item?.total_sale_price) || 0,
      })),
    [data]
  )

  const totals = useMemo(
    () =>
      items.reduce(
        (sum, item) => ({
          cost: sum.cost + item.totalCost,
          sale: sum.sale + item.saleTotal,
          positions: sum.positions + 1,
        }),
        { cost: 0, sale: 0, positions: 0 }
      ),
    [items]
  )

  const currency = mounted ? GlobalCurrency?.name : ''

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={warehouse?.name || t('pageTitle')}
          subtitle={warehouse?.address}
          onBack={() => router.push('/m/warehouse')}
        />

        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Что лежит на складе в целом */}
        {items.length > 0 && (
          <div className="mt-2.5 grid grid-cols-3 divide-x divide-slate-100 rounded-[20px] bg-white px-4 py-3">
            <div className="min-w-0 pr-2">
              <div className="truncate text-[11px] text-slate-400">{tm('warehouse.positions')}</div>
              <div className="mt-1 truncate text-[15px] font-bold tabular-nums text-slate-900">{totals.positions}</div>
            </div>
            <div className="min-w-0 px-2">
              <div className="truncate text-[11px] text-slate-400">{t('columns.totalCost')}</div>
              <div className="mt-1 truncate text-[15px] font-bold tabular-nums text-slate-900">
                <Money value={totals.cost} currency="" />
              </div>
            </div>
            <div className="min-w-0 pl-2">
              <div className="truncate text-[11px] text-slate-400">{t('columns.saleTotal')}</div>
              <div className="mt-1 truncate text-[15px] font-bold tabular-nums text-emerald-600">
                <Money value={totals.sale} currency="" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Позиции */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !items.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !items.length && <MEmpty icon={Package} title={t('empty')} />}

        {items.length > 0 && (
          <MCard list>
            {items.map((item) => {
              const open = openRow === item.guid
              return (
                <div key={item.guid} className="border-b border-slate-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : item.guid)}
                    className="flex w-full items-center gap-3 py-3.5 text-left active:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Package size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-slate-900">{item.name}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                        {[item.artikul, item.waiting ? tm('warehouse.waiting', { count: item.waiting }) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className={cn(
                          'block text-[15px] font-bold tabular-nums',
                          item.available > 0 ? 'text-slate-900' : 'text-red-600'
                        )}
                      >
                        {item.available.toLocaleString('ru-RU')}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{item.unit}</span>
                    </span>
                  </button>

                  {/* Подробности позиции — по нажатию, чтобы список не разбухал */}
                  {open && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-3.5 pl-[52px]">
                      {[
                        { label: t('columns.cost'), value: <Money value={item.averageCost} currency={currency} /> },
                        { label: t('columns.totalCost'), value: <Money value={item.totalCost} currency={currency} /> },
                        { label: t('columns.salePrice'), value: <Money value={item.salePrice} currency={currency} /> },
                        { label: t('columns.saleTotal'), value: <Money value={item.saleTotal} currency={currency} /> },
                        { label: t('columns.daysInStock'), value: item.daysInStock },
                      ].map((line) => (
                        <div key={line.label} className="min-w-0">
                          <div className="truncate text-[11px] text-slate-400">{line.label}</div>
                          <div className="truncate text-[13px] font-semibold tabular-nums text-slate-900">
                            {line.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </MCard>
        )}
      </div>
    </div>
  )
})

export default MobileWarehouseStockPage
