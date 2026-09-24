'use client'

import IndicatorsNavbar from '@/components/Indicators/Header'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Percent,
  PiggyBank,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { Block, ProjectsRoi, RankedList, RatioBar, TurnoverDays } from './components/CompanyBlocks'
import { ProfitVsCashChart, ProfitWaterfall } from './components/CompanyCharts'
import { useCompanyData } from './hooks/useCompanyData'

const money = (value) => Math.round(Number(value) || 0)

/**
 * «Моя компания» — финансовое состояние на одной странице: деньги, прибыль,
 * долги и проекты. Отдельная страница от «Показателей»: там разбор каждого
 * показателя графиками, здесь — короткий ответ на вопрос «как дела у бизнеса».
 *
 * Фильтры общие с «Показателями» (период, счета, проекты, сделки), и запросы
 * тоже общие — открытая рядом страница показателей не удваивает нагрузку.
 */
const CompanyPage = () => {
  const t = useTranslations('Company')
  const mounted = useMounted()
  const data = useCompanyData()
  const currency = mounted ? GlobalCurrency?.name : ''

  const { pnl, cash, turnover } = data
  const expenseShare = pnl.revenueTotal > 0 ? (pnl.expensesTotal / pnl.revenueTotal) * 100 : null
  const collected = pnl.revenueTotal > 0 ? (cash.receiptsTotal / pnl.revenueTotal) * 100 : null

  const kpis = [
    { key: 'revenue', label: t('kpi.revenue'), value: money(pnl.revenueTotal), currency, hint: t('kpi.revenueHint'), icon: TrendingUp },
    { key: 'expenses', label: t('kpi.expenses'), value: money(pnl.expensesTotal), currency, hint: t('kpi.expensesHint'), icon: TrendingDown },
    { key: 'profit', label: t('kpi.profit'), value: money(pnl.profitTotal), currency, hint: t('kpi.profitHint'), icon: Scale, tone: 'signed' },
    {
      key: 'margin',
      label: t('kpi.margin'),
      value: pnl.margin == null ? 0 : Math.round(pnl.margin * 10) / 10,
      currency: '%',
      hint: t('kpi.marginHint'),
      icon: Percent,
      tone: 'signed',
    },
    { key: 'balance', label: t('kpi.balance'), value: money(data.balance), currency, hint: t('kpi.balanceHint'), icon: PiggyBank },
    { key: 'receivables', label: t('kpi.receivables'), value: money(data.receivables), currency, hint: t('kpi.receivablesHint'), icon: ArrowDownLeft },
    { key: 'payables', label: t('kpi.payables'), value: money(data.payables), currency, hint: t('kpi.payablesHint'), icon: ArrowUpRight },
    {
      key: 'roi',
      label: t('kpi.roi'),
      value: data.averageRoi == null ? 0 : Math.round(data.averageRoi * 10) / 10,
      currency: '%',
      hint: t('kpi.roiHint'),
      icon: Banknote,
      tone: 'signed',
    },
  ]

  return (
    <div className="fixed left-[var(--sidebar-w)] top-[60px] h-[calc(100%-60px)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] overflow-y-auto bg-canvas">
      {data.isLoading && <ScreenLoader className="left-0!" />}

      {/* Фильтры — те же, что на «Показателях» */}
      <IndicatorsNavbar title={t('pageTitle')} subtitle={t('subtitle')} />

      <div className="flex flex-col gap-4 p-6">
        {/* Восемь показателей: деньги, прибыль, долги, проекты */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.map(({ key, ...kpi }) => (
            <KpiCard key={key} {...kpi} />
          ))}
        </div>

        {/* Итог периода водопадом и сравнение прибыли с деньгами —
            намеренно не те же графики, что на «Показателях» */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ProfitWaterfall pnl={pnl} />
          <ProfitVsCashChart pnl={pnl} cash={cash} />
        </div>

        {/* Оборачиваемость, должники, кредиторы */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Block title={t('turnover.title')} subtitle={t('turnover.subtitle')} hint={t('turnover.hint')}>
            <TurnoverDays turnover={turnover} />
          </Block>

          <Block
            title={t('debtors.title')}
            subtitle={t('debtors.subtitle')}
            footer={
              <span>
                {t('debtors.overdue')}{' '}
                <strong className="font-semibold text-red-600">
                  {Math.round(data.receivablesOverdue).toLocaleString('ru-RU')} {currency}
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
                <strong className="font-semibold text-red-600">
                  {Math.round(data.payablesOverdue).toLocaleString('ru-RU')} {currency}
                </strong>
              </span>
            }
          >
            <RankedList items={data.topVendors} color="#94a3b8" empty={t('noData')} />
          </Block>
        </div>

        {/* Проекты и соотношения */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </div>
  )
}

export default observer(CompanyPage)
