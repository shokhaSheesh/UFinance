'use client'

import { DeltaChip, HeroCard, MCard, MEmpty, MRow, MSkeleton, QuickActions, SectionHead, StatTile } from '@/components/mobile/ui'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { useCompanyData } from '@/modules/company/hooks/useCompanyData'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { keepPreviousData } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, Landmark, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

/**
 * Главная мобильного приложения.
 *
 * Отвечает на три вопроса, ради которых программу открывают с телефона:
 * сколько денег на счетах, сколько заработали и потратили за период, кто
 * кому должен. Ниже — то, что чаще всего смотрят следом: счета и должники.
 * Всё остальное живёт в своих разделах, а не на главной.
 */
const MobileHomePage = observer(() => {
  const t = useTranslations('Mobile')
  const tOps = useTranslations('Operations')
  const locale = useLocale()
  const router = useRouter()
  const mounted = useMounted()
  const data = useCompanyData()

  const currency = mounted ? GlobalCurrency?.name : ''
  const userName = authStore.userData?.name || authStore.userData?.login || ''

  // Остаток на счетах — тот же запрос, что в шапке большого экрана
  const { data: accountsData, isLoading: isLoadingAccounts } = useUcodeRequestQuery({
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

  const accounts = useMemo(() => {
    const groups = appStore.filterAllowedAccountGroups(accountsData?.data || [])
    return groups
      .flatMap((group) => group?.children || [])
      .map((account) => ({
        guid: account?.guid,
        name: account?.nazvanie,
        entity: account?.legal_entity_name || account?.tip?.[0] || '',
        balance: account?.balans_val,
        currency: account?.currenies_kod,
      }))
  }, [accountsData])

  const today = useMemo(
    () => new Date().toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  )

  const quickActions = [
    { key: 'income', label: tOps('modal.tabIncome'), icon: ArrowDownLeft, onClick: () => router.push('/m/transactions/new?type=income') },
    { key: 'payment', label: tOps('modal.tabPayment'), icon: ArrowUpRight, onClick: () => router.push('/m/transactions/new?type=payment') },
    { key: 'transfer', label: tOps('modal.tabTransfer'), icon: ArrowLeftRight, onClick: () => router.push('/m/transactions/new?type=transfer') },
    { key: 'reports', label: t('tabs.reports'), icon: BarChart3, onClick: () => router.push('/m/reports') },
  ]

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      {/* Шапка: марка, валюта, вход в профиль */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0e73f6] text-[13px] font-extrabold text-white">
          UF
        </span>
        <div className="flex items-center gap-2">
          <span className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-slate-700">
            <Wallet size={15} className="text-slate-400" aria-hidden="true" />
            {currency}
          </span>
          <button
            type="button"
            onClick={() => router.push('/m/profile')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[13px] font-bold text-white"
          >
            {(userName || 'U').slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Приветствие */}
      <div className="pt-5 pb-4">
        <h1 className="text-[21px] leading-tight font-bold text-slate-900">
          {userName ? t('home.greetingName', { name: userName }) : t('home.greeting')}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">{today}</p>
      </div>

      {/* Остаток на счетах */}
      <HeroCard
        label={t('home.balance')}
        amount={accountsData?.summary?.current_balance ?? 0}
        currency={currency}
        note={accounts.length ? t('home.accountsCount', { count: accounts.length }) : null}
        badge={
          // чистый поток за выбранный период: сколько пришло минус сколько ушло
          data.cash.net ? (
            <DeltaChip positive={data.cash.net >= 0}>
              {data.cash.net >= 0 ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
              {data.cash.net > 0 ? '+' : ''}
              {Math.round(data.cash.net).toLocaleString('ru-RU')}
            </DeltaChip>
          ) : null
        }
      />

      <QuickActions actions={quickActions} />

      {/* Счета */}
      <SectionHead title={t('home.accounts')} />
      {isLoadingAccounts && !accounts.length ? (
        <MSkeleton rows={3} />
      ) : accounts.length ? (
        <MCard list>
          {accounts.slice(0, 4).map((account) => (
            <MRow
              key={account.guid}
              icon={Landmark}
              title={account.name}
              subtitle={account.entity}
              value={<span>{Math.round(Number(account.balance) || 0).toLocaleString('ru-RU')}</span>}
              valueSub={account.currency}
            />
          ))}
        </MCard>
      ) : (
        <MCard>
          <MEmpty icon={Landmark} title={t('home.noAccounts')} />
        </MCard>
      )}

      {/* Доходы и расходы за период */}
      <SectionHead title={t('home.period')} action={t('home.reportsLink')} onAction={() => router.push('/m/reports')} />
      <div className="flex gap-2.5">
        <StatTile label={t('home.income')} value={data.pnl.revenueTotal} currency={currency} tone="in" />
        <StatTile label={t('home.expense')} value={data.pnl.expensesTotal} currency={currency} tone="out" />
      </div>
      <div className="mt-2.5">
        <MCard className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">{t('home.profit')}</span>
          <span
            className={`text-[17px] font-bold tabular-nums ${data.pnl.profitTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {Math.round(data.pnl.profitTotal || 0).toLocaleString('ru-RU')}{' '}
            <span className="text-xs font-normal text-slate-400">{currency}</span>
          </span>
        </MCard>
      </div>

      {/* Взаиморасчёты */}
      <SectionHead title={t('home.settlements')} />
      <div className="flex gap-2.5">
        <StatTile
          label={t('home.receivables')}
          value={data.receivables}
          currency={currency}
          tone="in"
          note={data.receivablesOverdue ? t('home.overdue', { amount: Math.round(data.receivablesOverdue).toLocaleString('ru-RU') }) : null}
        />
        <StatTile
          label={t('home.payables')}
          value={data.payables}
          currency={currency}
          tone="out"
          note={data.payablesOverdue ? t('home.overdue', { amount: Math.round(data.payablesOverdue).toLocaleString('ru-RU') }) : null}
        />
      </div>

      {/* Кто больше должен */}
      {data.topDebtors.length > 0 && (
        <>
          <SectionHead title={t('home.debtors')} />
          <MCard list>
            {data.topDebtors.slice(0, 4).map((debtor) => (
              <MRow
                key={debtor.guid || debtor.name}
                icon={Users}
                title={debtor.name}
                value={<span>{Math.round(Number(debtor.total) || 0).toLocaleString('ru-RU')}</span>}
                valueSub={currency}
              />
            ))}
          </MCard>
        </>
      )}
    </div>
  )
})

export default MobileHomePage
