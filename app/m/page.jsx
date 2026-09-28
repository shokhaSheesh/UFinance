'use client'

import HomeSettingsSheet from '@/components/mobile/HomeSettingsSheet'
import { MCard, MEmpty, MSkeleton, QuickActions, SectionHead } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import operationsDto from '@/lib/dtos/operationsDto'
import { cn } from '@/lib/utils'
import { useCompanyData } from '@/modules/company/hooks/useCompanyData'
import { appStore } from '@/store/app.store'
import { mobileHomeStore } from '@/store/mobileHome.store'
import { authStore } from '@/store/auth.store'
import { keepPreviousData } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Landmark,
  PackageCheck,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'

/**
 * Главная мобильного приложения.
 *
 * Построена как экран счёта в банковском приложении: сверху — кто вошёл и
 * в каком филиале, затем деньги на счетах одним крупным числом с движением
 * за период, под ними четыре круглых действия, а дальше разделы списками —
 * счета, последние операции, доходы с расходами, взаиморасчёты. Цветная
 * карточка-плашка убрана: число и так самое крупное на экране, а цвет
 * нужнее там, где он что-то значит — в знаке суммы.
 */

/** Значок и цвет строки операции — те же, что в ленте транзакций. */
const TYPE_LOOK = {
  Поступление: { icon: ArrowDownLeft, tone: 'bg-emerald-50 text-emerald-600' },
  Выплата: { icon: ArrowUpRight, tone: 'bg-red-50 text-red-600' },
  Перемещение: { icon: ArrowLeftRight, tone: 'bg-slate-100 text-slate-500' },
  Начисление: { icon: Scale, tone: 'bg-slate-100 text-slate-500' },
  Отгрузка: { icon: Truck, tone: 'bg-slate-100 text-slate-500' },
  Поставка: { icon: PackageCheck, tone: 'bg-slate-100 text-slate-500' },
}

/** Строка списка: круглый значок, две строки текста, значение справа. */
const ListRow = ({ icon: Icon, tone, title, subtitle, value, valueSub, valueClass, onClick }) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0',
        onClick && 'active:bg-slate-50'
      )}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone)}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-slate-900">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[12px] text-slate-500">{subtitle}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className={cn('text-[15px] font-semibold tabular-nums text-slate-900', valueClass)}>{value}</span>
        {valueSub && <span className="mt-0.5 text-[11px] text-slate-400">{valueSub}</span>}
      </span>
    </Tag>
  )
}

const MobileHomePage = observer(() => {
  const t = useTranslations('Mobile')
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const mounted = useMounted()
  const data = useCompanyData()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const currency = mounted ? GlobalCurrency?.name : ''
  const userName = authStore.userData?.name || authStore.userData?.login || ''
  const branchName = authStore.selectBranch?.name || ''

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

  // Последние операции: та же выборка, что в ленте, только первые пять
  const { data: recentData } = useUcodeRequestQuery({
    method: 'list_operations_by_query',
    data: { page: 1, limit: 5 },
    querySetting: { select: (response) => response?.data?.data || [], placeholderData: keepPreviousData },
  })

  const accounts = useMemo(() => {
    const groups = appStore.filterAllowedAccountGroups(accountsData?.data || [])
    return groups
      .flatMap((group) => group?.children || [])
      .map((account) => ({
        guid: account?.guid,
        name: account?.nazvanie,
        entity: account?.legal_entity_name || '',
        balance: account?.balans_val,
        currency: account?.currenies_kod,
      }))
  }, [accountsData])

  const recent = useMemo(() => operationsDto(recentData || []).slice(0, 5), [recentData])

  const quickActions = [
    {
      key: 'income',
      label: tOps('modal.tabIncome'),
      icon: ArrowDownLeft,
      onClick: () => router.push('/m/transactions/new?type=income'),
    },
    {
      key: 'payment',
      label: tOps('modal.tabPayment'),
      icon: ArrowUpRight,
      onClick: () => router.push('/m/transactions/new?type=payment'),
    },
    {
      key: 'transfer',
      label: tOps('modal.tabTransfer'),
      icon: ArrowLeftRight,
      onClick: () => router.push('/m/transactions/new?type=transfer'),
    },
    { key: 'reports', label: t('tabs.reports'), icon: BarChart3, onClick: () => router.push('/m/reports') },
  ]

  const netFlow = data.cash.net || 0

  // Состав главной пользователь настраивает сам: порядок и видимость
  // блоков лежат в mobileHomeStore
  const sectionBlocks = {
    accounts: (
      <>
      {/* Счета */}
      <SectionHead title={t('home.accounts')} />
      {isLoadingAccounts && !accounts.length ? (
        <MSkeleton rows={2} />
      ) : accounts.length ? (
        <MCard list>
          {accounts.slice(0, 4).map((account) => (
            <ListRow
              key={account.guid}
              icon={Landmark}
              tone="bg-slate-100 text-slate-500"
              title={account.name}
              subtitle={account.entity}
              value={<Money value={account.balance} currency={account.currency} />}
            />
          ))}
        </MCard>
      ) : (
        <MCard>
          <MEmpty icon={Landmark} title={t('home.noAccounts')} />
        </MCard>
      )}

      </>
    ),
    recent: (
      <>
      {/* Последние операции */}
      {recent.length > 0 && (
        <>
          <SectionHead
            title={t('home.recent')}
            action={t('home.all')}
            onAction={() => router.push('/m/transactions')}
          />
          <MCard list>
            {recent.map((operation) => {
              const look = TYPE_LOOK[operation.tip] || TYPE_LOOK['Начисление']
              const isIncome = operation.operationType === 'income'
              const isPayment = operation.operationType === 'payment'
              return (
                <ListRow
                  key={operation.guid}
                  icon={look.icon}
                  tone={look.tone}
                  title={operation.counterparty || operation.tip}
                  subtitle={[operation.chartOfAccounts, operation.my_account_name].filter(Boolean).join(' · ')}
                  onClick={() => router.push(`/m/transactions/${operation.guid}`)}
                  valueClass={isIncome ? 'text-emerald-600!' : isPayment ? 'text-red-600!' : ''}
                  value={
                    <Money
                      value={operation.summa}
                      currency={operation.currency || currency}
                      sign={isIncome ? '+' : isPayment ? '−' : ''}
                    />
                  }
                  valueSub={operation.operationDate}
                />
              )
            })}
          </MCard>
        </>
      )}

      </>
    ),
    period: (
      <>
      {/* Доходы и расходы за период */}
      <SectionHead title={t('home.period')} action={t('home.reportsLink')} onAction={() => router.push('/m/reports')} />
      <MCard list>
        <ListRow
          icon={TrendingUp}
          tone="bg-emerald-50 text-emerald-600"
          title={t('home.income')}
          value={<Money value={data.pnl.revenueTotal} currency={currency} />}
        />
        <ListRow
          icon={TrendingDown}
          tone="bg-red-50 text-red-600"
          title={t('home.expense')}
          value={<Money value={data.pnl.expensesTotal} currency={currency} />}
        />
        <ListRow
          icon={Scale}
          tone="bg-slate-100 text-slate-500"
          title={t('home.profit')}
          valueClass={data.pnl.profitTotal >= 0 ? 'text-emerald-600!' : 'text-red-600!'}
          value={<Money value={data.pnl.profitTotal} currency={currency} />}
        />
      </MCard>

      </>
    ),
    settlements: (
      <>
      {/* Взаиморасчёты */}
      <SectionHead title={t('home.settlements')} />
      <MCard list>
        <ListRow
          icon={ArrowDownLeft}
          tone="bg-emerald-50 text-emerald-600"
          title={t('home.receivables')}
          subtitle={
            data.receivablesOverdue
              ? t('home.overdue', { amount: Math.round(data.receivablesOverdue).toLocaleString('ru-RU') })
              : undefined
          }
          value={<Money value={data.receivables} currency={currency} />}
        />
        <ListRow
          icon={ArrowUpRight}
          tone="bg-red-50 text-red-600"
          title={t('home.payables')}
          subtitle={
            data.payablesOverdue
              ? t('home.overdue', { amount: Math.round(data.payablesOverdue).toLocaleString('ru-RU') })
              : undefined
          }
          value={<Money value={data.payables} currency={currency} />}
        />
      </MCard>
      </>
    ),
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      {/* Кто вошёл и в каком филиале */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/m/profile')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[15px] font-bold text-white"
        >
          {(mounted && userName ? userName : 'U').slice(0, 1).toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] text-slate-500">
            {mounted && userName ? t('home.greetingName', { name: userName }) : t('home.greeting')}
          </div>
          {mounted && branchName && (
            <div className="truncate text-[15px] font-bold text-slate-900">{branchName}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t('home.customize')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/m/transactions')}
          aria-label={t('tabs.transactions')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
        >
          <Bell size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Деньги на счетах — самое крупное число экрана */}
      <div className="pt-7 pb-1 text-center">
        <div className="text-[12px] font-medium tracking-[0.04em] text-slate-500 uppercase">{t('home.balance')}</div>
        <div className="mt-2 text-[40px] leading-none font-bold tracking-[-0.03em] text-slate-900">
          <Money value={accountsData?.summary?.current_balance ?? 0} currency={currency} />
        </div>
        {netFlow !== 0 && (
          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold',
              netFlow > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            )}
          >
            {netFlow > 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {netFlow > 0 ? '+' : ''}
            {Math.round(netFlow).toLocaleString('ru-RU')}
            <span className="font-medium opacity-70">{t('home.forPeriod')}</span>
          </div>
        )}
      </div>

      <QuickActions actions={quickActions} />

      {/* Блоки в порядке, который выбрал пользователь */}
      {mobileHomeStore.visibleSections.map((key) => (
        <Fragment key={key}>{sectionBlocks[key]}</Fragment>
      ))}

      <HomeSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
})

export default MobileHomePage
