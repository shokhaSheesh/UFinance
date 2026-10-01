'use client'

import AnalyticsFilters from '@/components/mobile/analytics/AnalyticsFilters'
import FigureCard from '@/components/mobile/FigureCard'
import { MCard, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { ProjectsRoi, RankedList, RatioBar, TurnoverDays } from '@/modules/company/components/CompanyBlocks'
import { IncomeExpenseByPeriod, ProfitVsCashChart } from '@/modules/company/components/CompanyCharts'
import { useCompanyData } from '@/modules/company/hooks/useCompanyData'
import { ArrowDownLeft, ArrowUpRight, Banknote, Loader2, Percent, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * «Моя компания» на телефоне — короткий ответ на вопрос «как дела у
 * бизнеса».
 *
 * Те же данные и фильтры, что на странице на компьютере (useCompanyData и
 * хранилище «Показателей»), сложенные в одну колонку: сначала главные цифры
 * двумя карточками — прибыль и деньги с долгами, — затем графики, долги,
 * проекты и соотношения. Восемь показателей стоят строками, а не плитками:
 * на телефоне так читается быстрее и ничего не надо листать вбок.
 */

/** Карточка блока: заголовок и подпись, под ними содержимое. */
const Block = ({ title, subtitle, footer, children }) => (
  <MCard>
    <div className="mb-4">
      <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
    </div>
    {children}
    {footer && <div className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">{footer}</div>}
  </MCard>
)

const signedClass = (value) => (value == null ? 'text-slate-400' : value >= 0 ? 'text-emerald-600' : 'text-red-600')
const percentText = (value) => (value == null ? '—' : `${Math.round(value * 10) / 10}%`)

const MobileCompanyPage = observer(() => {
  const t = useTranslations('Company')
  const router = useRouter()
  const mounted = useMounted()
  const data = useCompanyData()
  const currency = mounted ? GlobalCurrency?.name : ''

  const { pnl, cash, turnover } = data
  const expenseShare = pnl.revenueTotal > 0 ? (pnl.expensesTotal / pnl.revenueTotal) * 100 : null
  const collected = pnl.revenueTotal > 0 ? (cash.receiptsTotal / pnl.revenueTotal) * 100 : null

  const profitRows = [
    { key: 'revenue', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600', label: t('kpi.revenue'), hint: t('kpi.revenueHint'), value: <Money value={pnl.revenueTotal} currency={currency} /> },
    { key: 'expenses', icon: TrendingDown, tone: 'bg-red-50 text-red-600', label: t('kpi.expenses'), hint: t('kpi.expensesHint'), value: <Money value={pnl.expensesTotal} currency={currency} /> },
    {
      key: 'profit',
      icon: Wallet,
      tone: 'bg-slate-100 text-slate-500',
      label: t('kpi.profit'),
      hint: t('kpi.profitHint'),
      value: <Money value={pnl.profitTotal} currency={currency} />,
      valueClass: signedClass(pnl.profitTotal),
    },
    { key: 'margin', icon: Percent, tone: 'bg-slate-100 text-slate-500', label: t('kpi.margin'), hint: t('kpi.marginHint'), value: percentText(pnl.margin), valueClass: signedClass(pnl.margin) },
  ]

  const moneyRows = [
    { key: 'balance', icon: PiggyBank, tone: 'bg-slate-100 text-slate-500', label: t('kpi.balance'), hint: t('kpi.balanceHint'), value: <Money value={data.balance ?? 0} currency={currency} /> },
    { key: 'receivables', icon: ArrowDownLeft, tone: 'bg-emerald-50 text-emerald-600', label: t('kpi.receivables'), hint: t('kpi.receivablesHint'), value: <Money value={data.receivables} currency={currency} /> },
    { key: 'payables', icon: ArrowUpRight, tone: 'bg-red-50 text-red-600', label: t('kpi.payables'), hint: t('kpi.payablesHint'), value: <Money value={data.payables} currency={currency} /> },
    { key: 'roi', icon: Banknote, tone: 'bg-slate-100 text-slate-500', label: t('kpi.roi'), hint: t('kpi.roiHint'), value: percentText(data.averageRoi), valueClass: signedClass(data.averageRoi) },
  ]

  // Карточки графиков с компьютера — в мобильном виде: без рамки, крупное скругление
  const chartCard = 'rounded-[24px] border-0 p-4'

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={t('pageTitle')}
        subtitle={t('subtitle')}
        onBack={() => router.push('/m/reports')}
        action={
          data.isLoading && (
            <span className="flex h-10 w-10 items-center justify-center">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </span>
          )
        }
      />

      <AnalyticsFilters />

      {/* Главные цифры: прибыль, затем деньги и долги */}
      <FigureCard className="mt-2.5" rows={profitRows} />
      <FigureCard className="mt-2.5" rows={moneyRows} />

      <div className="mt-2.5 flex flex-col gap-2.5">
        {mounted && (
          <>
            <IncomeExpenseByPeriod pnl={pnl} className={chartCard} height={260} />
            <ProfitVsCashChart pnl={pnl} cash={cash} className={chartCard} />
          </>
        )}

        <Block title={t('turnover.title')} subtitle={t('turnover.subtitle')} footer={t('turnover.hint')}>
          <TurnoverDays turnover={turnover} />
        </Block>

        <Block
          title={t('debtors.title')}
          subtitle={t('debtors.subtitle')}
          footer={
            <span>
              {t('debtors.overdue')}{' '}
              <strong className={cn('font-semibold', data.receivablesOverdue ? 'text-red-600' : 'text-slate-700')}>
                <Money value={data.receivablesOverdue} currency={currency} />
              </strong>
            </span>
          }
        >
          <RankedList items={data.topDebtors} color="#3b82f6" empty={t('noData')} />
        </Block>

        <Block
          title={t('vendors.title')}
          subtitle={t('vendors.subtitle')}
          footer={
            <span>
              {t('vendors.overdue')}{' '}
              <strong className={cn('font-semibold', data.payablesOverdue ? 'text-red-600' : 'text-slate-700')}>
                <Money value={data.payablesOverdue} currency={currency} />
              </strong>
            </span>
          }
        >
          <RankedList items={data.topVendors} color="#94a3b8" empty={t('noData')} />
        </Block>

        <Block title={t('projects.title')} subtitle={t('projects.subtitle')}>
          <ProjectsRoi projects={data.projects} empty={t('projects.empty')} />
        </Block>

        <Block title={t('ratios.title')} subtitle={t('ratios.subtitle')}>
          <div className="flex flex-col gap-5">
            <RatioBar label={t('ratios.margin')} value={pnl.margin} barClass="bg-emerald-500" />
            <RatioBar label={t('ratios.expenseShare')} value={expenseShare} barClass="bg-red-400" />
            <RatioBar label={t('ratios.collected')} value={collected} hint={t('ratios.collectedHint')} />
          </div>
        </Block>
      </div>
    </div>
  )
})

export default MobileCompanyPage
