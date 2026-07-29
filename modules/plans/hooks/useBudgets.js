'use client'

import {
  createBudget,
  createBudgetPlan,
  deleteBudget,
  getBudgetPlan,
  listBudgets,
  monthEndDate,
  monthStartDate,
  normalizeBudget,
  updateBudget,
} from '@/lib/api/ucode/budgets'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

const LIST_LIMIT = 100

/**
 * Форма модалки → object_data для create_budget / update_budget.
 * Проект и группа проектов взаимоисключающие: в UI это один селект,
 * значения которого помечены префиксом `p:` (проект) и `g:` (группа).
 */
export const buildBudgetPayload = (form, type) => {
  const payload = {
    name: form.name,
    description: form.comment || '',
    legal_entity_id: form.legalEntity || '',
    currenies_id: form.currency || '',
    start_date: form.period?.start ? monthStartDate(form.period.start) : '',
    end_date: form.period?.end ? monthEndDate(form.period.end) : '',
  }

  if (type) payload.type = [type]

  const project = form.project || ''
  if (project.startsWith('g:')) payload.project_groups_id = project.slice(2)
  else if (project.startsWith('p:')) payload.projects_id = project.slice(2)

  return payload
}

const budgetsKey = (type, filters) =>
  filters ? ['list_budgets', type, filters] : ['list_budgets', type]

/**
 * Список бюджетов одного типа (`pnl` — БДР, `cashflow` — БДДС).
 * @param {string} type
 * @param {{legalEntityId?: string}} filters
 */
export function useBudgets(type, filters = {}) {
  const { legalEntityId } = filters
  const query = useQuery({
    queryKey: budgetsKey(type, legalEntityId ? { legalEntityId } : null),
    queryFn: () =>
      listBudgets({
        page: 1,
        limit: LIST_LIMIT,
        types: [type],
        ...(legalEntityId ? { legal_entity_ids: [legalEntityId] } : {}),
      }),
    staleTime: 0,
  })

  const budgets = useMemo(
    () => (query.data?.data || []).map(normalizeBudget),
    [query.data]
  )

  return { ...query, budgets }
}

/**
 * Один бюджет для детальной страницы. Отдельного `get_budget` в API нет,
 * поэтому берём его из списка — он же переиспользует кэш страницы-списка.
 */
export function useBudget(guid, type) {
  const { budgets, isLoading, isFetching } = useBudgets(type)
  const budget = useMemo(() => budgets.find((b) => b.id === guid) || null, [budgets, guid])
  return { budget, isLoading, isFetching }
}

function useBudgetsInvalidate(type) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: budgetsKey(type) })
}

export function useCreateBudget(type) {
  const invalidate = useBudgetsInvalidate(type)
  return useMutation({
    mutationFn: (form) => createBudget(buildBudgetPayload(form, type)),
    onSuccess: (res) => {
      invalidate()
      showSuccessNotification(res?.message || 'Бюджет создан')
    },
    onError: (e) => showErrorNotification(e?.message),
  })
}

export function useUpdateBudget(type) {
  const invalidate = useBudgetsInvalidate(type)
  return useMutation({
    // type при обновлении не меняется — бэк его игнорирует
    mutationFn: ({ guid, ...form }) => updateBudget({ guid, ...buildBudgetPayload(form) }),
    onSuccess: (res) => {
      invalidate()
      showSuccessNotification(res?.message || 'Бюджет обновлён')
    },
    onError: (e) => showErrorNotification(e?.message),
  })
}

export function useDeleteBudget(type) {
  const invalidate = useBudgetsInvalidate(type)
  return useMutation({
    mutationFn: (guid) => deleteBudget(guid),
    onSuccess: (res) => {
      invalidate()
      showSuccessNotification(res?.message || 'Бюджет удалён')
    },
    onError: (e) => showErrorNotification(e?.message),
  })
}

/**
 * Дерево статей бюджета с планом и фактом.
 * @param {string} budgetsId
 * @param {{accountingMethod?: 'accrual'|'cash'}} params
 */
export function useBudgetPlan(budgetsId, { accountingMethod } = {}) {
  return useQuery({
    queryKey: ['get_budget_plan', budgetsId, accountingMethod || null],
    queryFn: () => getBudgetPlan(budgetsId, { accounting_method: accountingMethod }),
    enabled: !!budgetsId,
    select: (res) => res?.data || null,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Запись плановой суммы (upsert). После успеха перезапрашиваем дерево —
 * бэк пересчитывает roll-up по родителям и производные строки.
 */
export function useSaveBudgetPlan(budgetsId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, month, amount }) =>
      createBudgetPlan({
        budgets_id: budgetsId,
        id: rowId,
        date: monthStartDate(month),
        amount,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['get_budget_plan', budgetsId] }),
    onError: (e) => showErrorNotification(e?.message),
  })
}
