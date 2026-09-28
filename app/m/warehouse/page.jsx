'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { useWarehousesList } from '@/hooks/useDashboard'
import { ChevronRight, Loader2, Search, Warehouse, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Мой склад: список складов.
 *
 * Склад на телефоне открывают, чтобы проверить остаток по товару, поэтому
 * список короткий — название, адрес и пометка основного склада, — а всё
 * интересное лежит на экране склада.
 */
const MobileWarehousePage = observer(() => {
  const t = useTranslations('Warehouse')
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: warehouses = [], isLoading } = useWarehousesList()

  // У `list_warehouses` нет поиска на сервере — фильтруем на месте
  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    const sorted = [...warehouses].sort((a, b) => (a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1))
    if (!query) return sorted
    return sorted.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(query) || (item.address || '').toLowerCase().includes(query)
    )
  }, [warehouses, search])

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('pageTitle')} onBack={() => router.push('/m/profile')} />

        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchWarehousesPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !items.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !items.length && <MEmpty icon={Warehouse} title={t('emptyWarehouses')} />}

        {items.length > 0 && (
          <MCard list>
            {items.map((item) => (
              <button
                key={item.guid}
                type="button"
                onClick={() => router.push(`/m/warehouse/${item.guid}`)}
                className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Warehouse size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-[15px] font-semibold text-slate-900">{item.name}</span>
                    {item.is_default && (
                      <span className="shrink-0 rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#0e73f6]">
                        {t('defaultBadge')}
                      </span>
                    )}
                  </span>
                  {item.address && (
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">{item.address}</span>
                  )}
                </span>
                <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden="true" />
              </button>
            ))}
          </MCard>
        )}
      </div>
    </div>
  )
})

export default MobileWarehousePage
