'use client'

import BudgetDetailHeader from '@/modules/plans/components/BudgetDetail/BudgetDetailHeader'
import BudgetFormModal from '@/modules/plans/components/BudgetDetail/BudgetFormModal'
import BudgetPivotTable from '@/modules/plans/components/BudgetDetail/BudgetPivotTable'
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
  const router = useRouter()
  const { id } = useParams()

  const [grouping, setGrouping] = useState('years')
  const [method, setMethod] = useState('accrual')
  const [profitIndicators, setProfitIndicators] = useState(PROFIT_OPTIONS)
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState({
    fact: true,
    planExec: true,
    deviation: true,
    deviationPct: true
  })

  const { budget } = useBudget(id, BUDGET_TYPE)
  const { data, isLoading } = useBudgetPlan(id, { accountingMethod: method })
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
        options: PROFIT_OPTIONS.map((key) => ({ value: key, label: t(`profitIndicators.${key}`) }))
      }
    ],
    [method, profitIndicators, t]
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
    <div className='flex h-full flex-col bg-white'>
      <BudgetDetailHeader
        t={t}
        title={budget?.name || ''}
        pills={pills}
        backHref={LIST_HREF}
        onEdit={() => setModalOpen(true)}
        onDelete={handleDelete}
      />

      <BudgetToolbar
        t={t}
        grouping={grouping}
        onGroupingChange={setGrouping}
        visibleCols={visibleCols}
        onToggleCol={toggleCol}
        extraSelects={extraSelects}
      />

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
        onPlanChange={savePlan.mutate}
      />

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

export default IncomeExpenseBudgetSingle
