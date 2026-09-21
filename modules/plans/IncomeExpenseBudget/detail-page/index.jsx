'use client'

import BudgetDetailHeader from '@/modules/plans/components/BudgetDetail/BudgetDetailHeader'
import BudgetFormModal from '@/modules/plans/components/BudgetDetail/BudgetFormModal'
import BudgetPivotTable from '@/modules/plans/components/BudgetDetail/BudgetPivotTable'
import BudgetPlanFactCards from '@/modules/plans/components/BudgetDetail/BudgetPlanFactCards'
import BudgetToolbar from '@/modules/plans/components/BudgetDetail/BudgetToolbar'
import { useBudgetDictionaries } from '@/modules/plans/hooks/useBudgetDictionaries'
import { formatPeriodLabel } from '@/modules/plans/hooks/useBudgetList'
import {
  useBudget,
  useBudgetPlan,
  useDeleteBudget,
  useSaveBudgetPlan,
  useUpdateBudget
} from '@/modules/plans/hooks/useBudgets'
import { buildBudgetPeriod, buildBudgetRows, hiddenRowIdsFor } from '@/modules/plans/utils/budgetTree'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const BUDGET_TYPE = 'pnl'
const LIST_HREF = '/income_expense_budget'

/** Показатели прибыли, которыми управляет фильтр (валовая показывается всегда). */
const PROFIT_OPTIONS = ['operating', 'ebitda', 'ebit', 'ebt']

/**
 * Детальная страница БДР — «Бюджет доходов и расходов».
 * Дерево статей, план и факт приходят из `get_budget_plan`,
 * правка плановой ячейки уходит в `create_budget_plan`.
 */
const IncomeExpenseBudgetSingle = () => {
  const t = useTranslations('Plans.IncomeExpenseBudgetSingle')
  const tl = useTranslations('Plans.incomeExpenseBudget')
  const td = useTranslations('Plans.budgetDetail')
  const router = useRouter()
  const { id } = useParams()

  const [grouping, setGrouping] = useState('years')
  const [method, setMethod] = useState('accrual')
  // по умолчанию показатели прибыли выключены — строки EBITDA/EBIT/EBT
  // и операционная прибыль появляются только по выбору пользователя
  const [profitIndicators, setProfitIndicators] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  // Права раздела «Планы» → нужный бюджет
  const permissions = appStore.permission.plans?.pnl || {}
  const [visibleCols, setVisibleCols] = useState({
    fact: true,
    planExec: true,
    deviation: true,
    deviationPct: true
  })

  const { budget } = useBudget(id, BUDGET_TYPE)
  const { data, isLoading } = useBudgetPlan(id, {
    accountingMethod: method,
    profitIndicators
  })
  const savePlan = useSaveBudgetPlan(id)
  const updateBudget = useUpdateBudget(BUDGET_TYPE)
  const deleteBudget = useDeleteBudget(BUDGET_TYPE)
  const { legalEntities, projects, currencies } = useBudgetDictionaries({ groupLabel: t('form.projectGroup') })

  const monthLabels = useMemo(
    () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, t(`monthsShort.${i + 1}`)])),
    [t]
  )

  const rows = useMemo(() => buildBudgetRows(data?.rows, data?.legend), [data])
  const period = useMemo(
    () => buildBudgetPeriod(data?.period, data?.legend) || budget?.periodValue || null,
    [data, budget]
  )

  const hiddenRowIds = useMemo(
    () => hiddenRowIdsFor(rows, profitIndicators, PROFIT_OPTIONS),
    [rows, profitIndicators]
  )

  const extraSelects = useMemo(
    () => [
      {
        id: 'method',
        type: 'single',
        value: method,
        onChange: setMethod,
        placeholder: t('method.accrual'),
        label: td('method'),
        options: [
          { value: 'accrual', label: t('method.accrual') },
          { value: 'cash', label: t('method.cash') }
        ]
      },
      {
        id: 'profit',
        type: 'multi',
        value: profitIndicators,
        onChange: setProfitIndicators,
        placeholder: t('indicators.profit'),
        label: td('profit'),
        options: PROFIT_OPTIONS.map((key) => ({ value: key, label: t(`profitIndicators.${key}`) }))
      }
    ],
    [method, profitIndicators, t, td]
  )

  const toggleCol = (key) => {
    setVisibleCols((prev) => {
      if (key === 'fact' && prev.fact) {
        return { fact: false, planExec: false, deviation: false, deviationPct: false }
      }
      return { ...prev, [key]: !prev[key] }
    })
  }

  const pills = [t('typeLabel'), period ? formatPeriodLabel(period, monthLabels) : null, data?.currency_code || budget?.currency]
    .filter(Boolean)

  const handleDelete = async () => {
    await deleteBudget.mutateAsync(id)
    router.push(LIST_HREF)
  }

  const editingBudget = budget
    ? {
        id: budget.id,
        name: budget.name,
        period: budget.periodValue,
        legalEntity: budget.legalEntityKey || null,
        project: budget.projectValue || null,
        currency: budget.currencyId || null,
        comment: budget.comment || ''
      }
    : null

  return (
    <div className='flex h-full flex-col bg-canvas'>
      <BudgetDetailHeader
        t={t}
        title={budget?.name || ''}
        pills={pills}
        backHref={LIST_HREF}
        backLabel={tl('title')}
        period={period}
        onEdit={permissions.edit ? () => setModalOpen(true) : undefined}
        onDelete={permissions.delete ? handleDelete : undefined}
      />

      <BudgetPlanFactCards
        rows={rows}
        hiddenRowIds={hiddenRowIds}
        currency={data?.currency_code || budget?.currency}
      />

      <BudgetToolbar
        t={t}
        grouping={grouping}
        onGroupingChange={setGrouping}
        visibleCols={visibleCols}
        onToggleCol={toggleCol}
        extraSelects={extraSelects}
      />

      {/* Таблица плана — в карточке с рамкой */}
      <div className='mx-6 mb-6 flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white'>
      <BudgetPivotTable
        t={t}
        rows={rows}
        entityTitle={budget?.legalEntity || t('allLegalEntities')}
        entitySubtitle={budget?.project || ''}
        start={period?.start}
        end={period?.end}
        grouping={grouping}
        visibleCols={visibleCols}
        hiddenRowIds={hiddenRowIds}
        loading={isLoading || !period}
        emptyLabel={t('empty')}
        editable={!!permissions.edit}
        // план на весь период правится только при plan_total_active в настройках
        totalEditable={!!permissions.edit && appStore.planTotalActive}
        onPlanChange={savePlan.mutate}
      />
      </div>

      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(form) => updateBudget.mutateAsync({ guid: id, ...form })}
        budget={editingBudget}
        t={t}
        monthLabels={monthLabels}
        legalEntities={legalEntities}
        projects={projects}
        currencies={currencies}
        isSaving={updateBudget.isPending}
      />
    </div>
  )
}

// observer: доступные действия зависят от прав в appStore
export default observer(IncomeExpenseBudgetSingle)
