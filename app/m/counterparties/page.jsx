'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestInfinite } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import counterpartiesStore from '@/store/counterparties.store'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, Users, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Контрагенты на телефоне.
 *
 * На большом экране это таблица с восемью колонками сумм. Здесь строка
 * отвечает на единственный вопрос, ради которого справочник открывают в
 * дороге: сколько мы должны этому контрагенту или сколько должен он.
 * Долг показан одним числом со знаком, остальное — на экране контрагента.
 */
const MobileCounterpartiesPage = observer(() => {
  const t = useTranslations('Directories.counterparty')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const mounted = useMounted()

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const filters = useMemo(
    () => ({
      limit: 30,
      searchString: debounced,
      calculationMethod: counterpartiesStore.filters?.calculationMethod,
    }),
    [debounced]
  )

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUcodeRequestInfinite({
    method: 'get_counterparties',
    data: filters,
    querySetting: { staleTime: 0 },
  })

  const { data: summary } = useQuery({
    queryKey: ['get_counterparties_summary', filters],
    queryFn: () => apiClient.invokeFunction({ method: 'get_counterparties_summary', data: filters }),
    select: (response) => response?.data?.data,
  })

  const counterparties = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data?.data || []) || []).map((item) => ({
        guid: item.guid,
        name: item.nazvanie || tm('counterparties.noName'),
        group: item.group_name,
        receivable: Number(item.debitorka) || 0,
        payable: Number(item.kreditorka) || 0,
        operations: item.operations_count ?? 0,
      })),
    [data, tm]
  )

  const sentinelRef = useRef(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const currency = mounted ? GlobalCurrency?.name : ''

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('list.title')} onBack={() => router.push('/m/profile')} />

        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('list.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Кто кому должен в целом */}
        {mounted && summary && (
          <div className="mt-2.5 grid grid-cols-2 divide-x divide-slate-100 rounded-[20px] bg-white px-4 py-3">
            <div className="min-w-0 pr-3">
              <div className="truncate text-[11px] text-slate-400">{tm('home.receivables')}</div>
              <div className="mt-1 truncate text-[15px] font-bold tabular-nums text-emerald-600">
                <Money value={summary?.debitorka ?? 0} currency={currency} />
              </div>
            </div>
            <div className="min-w-0 pl-3">
              <div className="truncate text-[11px] text-slate-400">{tm('home.payables')}</div>
              <div className="mt-1 truncate text-[15px] font-bold tabular-nums text-red-600">
                <Money value={summary?.kreditorka ?? 0} currency={currency} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Список */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !counterparties.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !counterparties.length && <MEmpty icon={Users} title={tm('counterparties.empty')} />}

        {counterparties.length > 0 && (
          <MCard list>
            {counterparties.map((item) => {
              // Итоговый долг: плюс — должны нам, минус — должны мы
              const balance = item.receivable - item.payable
              return (
                <button
                  key={item.guid}
                  type="button"
                  onClick={() => router.push(`/m/counterparties/${item.guid}`)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[14px] font-bold text-slate-500">
                    {(item.name || '?').trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {[item.group, tm('counterparties.operations', { count: item.operations })]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        'block text-[15px] font-semibold tabular-nums',
                        balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-400'
                      )}
                    >
                      <Money value={balance} currency={currency} sign={balance > 0 ? '+' : undefined} />
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {balance > 0
                        ? tm('counterparties.owesUs')
                        : balance < 0
                          ? tm('counterparties.weOwe')
                          : tm('counterparties.settled')}
                    </span>
                  </span>
                </button>
              )
            })}
          </MCard>
        )}

        <div ref={sentinelRef} className="h-10">
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default MobileCounterpartiesPage
