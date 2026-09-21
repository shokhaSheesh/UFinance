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
import { buildBudgetPeriod, buildBudgetRows } from '@/modules/plans/utils/budgetTree'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter } from '@/hooks/useAppRouter'
import { useMemo, useState } from 'react'

const BUDGET_TYPE = 'cashflow'
const LIST_HREF = '/cash_flow_budget'

/**
 * Детальная страница БДДС — «Бюджет движения денежных средств».
 * Дерево статей, план и факт приходят из `get_budget_plan`,
 * правка плановой ячейки уходит в `create_budget_plan`.
 */
const CashFlowBudgetSingle = () => {
  const t = useTranslations('Plans.CashFlowBudgetSingle')
  const tl = useTranslations('Plans.cashFlowBudget')
  const router = useRouter()
  const { id } = useParams()

  const [grouping, setGrouping] = useState('years')
  const [modalOpen, setModalOpen] = useState(false)

  // Права раздела «Планы» → нужный бюджет
  const permissions = appStore.permission.plans?.cashflow || {}
  const [visibleCols, setVisibleCols] = useState({
    fact: true,
    planExec: true,
    deviation: true,
    deviationPct: true
  })

  const { budget } = useBudget(id, BUDGET_TYPE)
  const { data, isLoading } = useBudgetPlan(id)
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

  const toggleCol = (key) => {
    setVisibleCols((prev) => {
      // Выключая «Факт», гасим и зависимые колонки — как в ПланФакт
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
        currency={data?.currency_code || budget?.currency}
      />

      <BudgetToolbar
        t={t}
        grouping={grouping}
        onGroupingChange={setGrouping}
        visibleCols={visibleCols}
        onToggleCol={toggleCol}
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
export default observer(CashFlowBudgetSingle)
