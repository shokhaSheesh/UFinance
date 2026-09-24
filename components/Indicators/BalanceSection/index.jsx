'use client'

import HintQuestion from '@/components/shared/HintQuestion'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { Block, ProjectsRoi, RankedList, RatioBar, TurnoverDays } from '@/modules/company/components/CompanyBlocks'
import { useCompanyData } from '@/modules/company/hooks/useCompanyData'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Раздел «Баланс» на «Показателях»: оборачиваемость долгов, крупнейшие
 * должники и кредиторы, рентабельность проектов и соотношения за период.
 *
 * Те же блоки, что на странице «Моя компания» — и тот же хук данных, поэтому
 * запросы общие, а не удвоенные. Внутри раздела панели без рамок (flat):
 * рамка уже есть у карточки самого раздела.
 */
const BalanceSection = () => {
  const t = useTranslations('Indicators')
  const tc = useTranslations('Company')
  const mounted = useMounted()
  const data = useCompanyData()
  const currency = mounted ? GlobalCurrency?.name : ''

  const { pnl, cash, turnover } = data
  const expenseShare = pnl.revenueTotal > 0 ? (pnl.expensesTotal / pnl.revenueTotal) * 100 : null
  const collected = pnl.revenueTotal > 0 ? (cash.receiptsTotal / pnl.revenueTotal) * 100 : null

  const overdue = (value) => (
    <strong className="font-semibold text-red-600">
      {Math.round(Number(value) || 0).toLocaleString('ru-RU')} {currency}
    </strong>
  )

  return (
    <div className="relative w-full bg-white p-6">
      {data.isLoading && (
        <div className="absolute inset-0 z-100 flex items-center justify-center rounded-xl bg-white/80">
          <Loader />
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('balanceSection.title')}
          {currency ? `, ${currency}` : ''}
        </h2>
        <span className="flex size-5 cursor-help items-center justify-center rounded-full bg-slate-100" title={t('balanceSection.hint')}>
          <HintQuestion className="size-3 text-slate-400" />
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Оборачиваемость и кто кому должен */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Block flat title={tc('turnover.title')} subtitle={tc('turnover.subtitle')} hint={tc('turnover.hint')}>
            <TurnoverDays turnover={turnover} />
          </Block>

          <Block
            flat
            title={tc('debtors.title')}
            subtitle={tc('debtors.subtitle')}
            footer={<span>{tc('debtors.overdue')} {overdue(data.receivablesOverdue)}</span>}
          >
            <RankedList items={data.topDebtors} color="#3b82f6" empty={tc('noData')} />
          </Block>

          <Block
            flat
            title={tc('vendors.title')}
            subtitle={tc('vendors.subtitle')}
            footer={<span>{tc('vendors.overdue')} {overdue(data.payablesOverdue)}</span>}
          >
            <RankedList items={data.topVendors} color="#94a3b8" empty={tc('noData')} />
          </Block>
        </div>

        {/* Проекты и соотношения периода */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Block flat title={tc('projects.title')} subtitle={tc('projects.subtitle')}>
            <ProjectsRoi projects={data.projects} empty={tc('projects.empty')} />
          </Block>

          <Block flat title={tc('ratios.title')} subtitle={tc('ratios.subtitle')}>
            <div className="flex flex-col gap-5">
              <RatioBar label={tc('ratios.margin')} value={pnl.margin} barClass="bg-emerald-500" />
              <RatioBar label={tc('ratios.expenseShare')} value={expenseShare} barClass="bg-red-400" />
              <RatioBar label={tc('ratios.collected')} value={collected} hint={tc('ratios.collectedHint')} />
            </div>
          </Block>
        </div>
      </div>
    </div>
  )
}

export default observer(BalanceSection)
