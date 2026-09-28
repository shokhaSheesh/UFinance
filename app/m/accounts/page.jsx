'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { useDeleteMyAccounts, useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { keepPreviousData } from '@tanstack/react-query'
import { Banknote, CreditCard, Landmark, Loader2, MoreHorizontal, Pencil, Search, Smartphone, Trash2, Wallet, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Мои счета: где лежат деньги.
 *
 * Счета сгруппированы по юрлицам — так их видит и большой экран, — а
 * сверху стоит общий остаток. У каждого счёта свой значок по типу:
 * наличные, банковский, карта, электронный кошелёк.
 */

const TYPE_LOOK = {
  Наличный: { icon: Banknote, tone: 'bg-emerald-50 text-emerald-600' },
  Безналичный: { icon: Landmark, tone: 'bg-[#e8f1ff] text-[#0e73f6]' },
  'Карта физлица': { icon: CreditCard, tone: 'bg-violet-50 text-violet-600' },
  Электронный: { icon: Smartphone, tone: 'bg-amber-50 text-amber-600' },
}

const MobileAccountsPage = observer(() => {
  const t = useTranslations('Directories.account')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()

  const [search, setSearch] = useState('')
  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)

  const permissions = appStore.permission?.directories?.accounts || {}
  const deleteMutation = useDeleteMyAccounts()

  const { data, isLoading } = useUcodeRequestQuery({
    method: 'get_my_accounts',
    data: {
      groupBy: 'legal_entities',
      page: 1,
      limit: 100,
      beznalichnye: true,
      elektronnye: true,
      kartaFizlica: true,
      nalichnye: true,
      active: true,
    },
    querySetting: { select: (response) => response?.data, placeholderData: keepPreviousData },
  })

  // Группы юрлиц со счетами внутри — фильтруем по названию на месте
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    return appStore
      .filterAllowedAccountGroups(data?.data || [])
      .map((group) => ({
        guid: group?.guid || group?.legal_entity_id || group?.nazvanie,
        name: group?.nazvanie || group?.legal_entity_name || '',
        accounts: (group?.children || [])
          .filter((account) => !query || (account?.nazvanie || '').toLowerCase().includes(query))
          .map((account) => ({
            guid: account?.guid,
            name: account?.nazvanie,
            type: Array.isArray(account?.tip) ? account.tip[0] : account?.tip,
            balance: Number(account?.balans_val) || 0,
            currency: account?.currenies_kod,
            raw: account,
          })),
      }))
      .filter((group) => group.accounts.length > 0)
  }, [data, search])

  const total = data?.summary?.current_balance ?? 0
  const currency = mounted ? appStore.currency?.code || appStore.currency?.name : ''

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('pageTitle')} onBack={() => router.push('/m/profile')} />

        {/* Сколько всего на счетах */}
        <div className="rounded-[24px] bg-white px-4 py-4 text-center">
          <div className="text-[12px] text-slate-500">{tm('home.balance')}</div>
          <div className="mt-1.5 text-[28px] leading-none font-bold tracking-[-0.02em] text-slate-900">
            <Money value={total} currency={currency} />
          </div>
        </div>

        <div className="mt-2.5 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tc('search')}
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
        {isLoading && !groups.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !groups.length && <MEmpty icon={Wallet} title={tm('accounts.empty')} />}

        {groups.map((group) => (
          <section key={group.guid}>
            <div className="px-1 pt-4 pb-2 text-[13px] font-semibold text-slate-500">{group.name}</div>
            <MCard list>
              {group.accounts.map((account) => {
                const look = TYPE_LOOK[account.type] || TYPE_LOOK['Безналичный']
                return (
                  <div key={account.guid} className="flex items-center border-b border-slate-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/m/accounts/${account.guid}`)}
                      className="flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left active:bg-slate-50"
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', look.tone)}>
                        <look.icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-slate-900">{account.name}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-slate-500">{account.type}</span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-[15px] font-semibold tabular-nums',
                          account.balance < 0 ? 'text-red-600' : 'text-slate-900'
                        )}
                      >
                        <Money value={account.balance} currency={account.currency} />
                      </span>
                    </button>

                    {(permissions?.edit || permissions?.delete) && (
                      <button
                        type="button"
                        onClick={() => setMenuFor(account)}
                        aria-label={tc('edit')}
                        className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100"
                      >
                        <MoreHorizontal size={18} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )
              })}
            </MCard>
          </section>
        ))}
      </div>

      {/* Что сделать со счётом */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        <div className="flex flex-col">
          {permissions?.edit && (
            <button
              type="button"
              onClick={() => {
                setMenuFor(null)
                router.push(`/m/accounts/${menuFor.guid}?edit=1`)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions?.delete && (
            <button
              type="button"
              onClick={() => {
                setDeleteFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteFor(null)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteMutation.mutateAsync({ ids: [deleteFor.guid] })
                setDeleteFor(null)
              }}
              disabled={deleteMutation.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{t('deleteConfirmMessage', { name: deleteFor?.name || '' })}</p>
      </BottomSheet>
    </div>
  )
})

export default MobileAccountsPage
