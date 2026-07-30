import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { apiClient } from './base'

/**
 * ============================================
 * Budgets API (БДР / БДДС)
 * ============================================
 * Конверт тот же, что у projects: на уровне `data` передаётся `app_id`,
 * а не branch_id внутри object_data.
 *   { data: { auth, method, app_id, object_data } }
 * Эндпоинт — invoke_function (functionsV2).
 * Описание методов: BUDGETS_API.md
 */

// app_id === projectId (см. lib/config/api.js)
const APP_ID = '3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed'

/** Тип бюджета: БДР ↔ pnl, БДДС ↔ cashflow. */
export const BUDGET_TYPE = {
  pnl: 'pnl',
  cashflow: 'cashflow',
}

const getInvokeUrl = () =>
  appStore?.localApiUrl ||
  `${apiClient.baseURL}${apiClient.invokeFunctionEndpoint}?project-id=${APP_ID}`

/**
 * Базовый запрос к budgets-хендлерам.
 * @returns {Promise<{success:boolean,data:any,pagination?:object,message?:string}>}
 */
async function budgetsRequest(method, objectData = {}) {
  const url = getInvokeUrl()
  const body = {
    data: {
      auth: { data: {}, type: 'apikey' },
      method,
      app_id: APP_ID,
      // branch_id обязателен во всех методах — как в buildInvokeFunctionBody
      object_data: {
        ...objectData,
        ...(authStore?.branch_id ? { branch_id: authStore.branch_id } : {}),
      },
    },
  }

  const doFetch = (token) =>
    fetch(url, {
      method: 'POST',
      headers: apiClient.buildHeaders(token),
      body: JSON.stringify(body),
    })

  let token = apiClient.getAuthToken()
  let response = await doFetch(token)

  // 401 → обновляем токен и повторяем один раз
  if (response.status === 401) {
    try {
      token = await apiClient.refreshAccessToken()
      response = await doFetch(token)
    } catch {
      /* отдадим ошибку ниже */
    }
  }

  const text = await response.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = {}
  }

  const inner = json?.data ?? {}
  const isError =
    json?.status === 'error' ||
    json?.status === 'ERROR' ||
    inner?.success === false ||
    (!response.ok && !inner?.success)
  if (isError) {
    const message =
      inner?.message || json?.description || json?.data?.error || 'Ошибка запроса'
    throw new Error(message)
  }

  return inner // { success, data, pagination?, message? }
}

// ─── Бюджеты ────────────────────────────────────────────────────────────────

export const listBudgets = (params = {}) => budgetsRequest('list_budgets', params)

export const createBudget = (payload) => budgetsRequest('create_budget', payload)

export const updateBudget = (payload) => budgetsRequest('update_budget', payload)

export const deleteBudget = (guid) => budgetsRequest('delete_budget', { guid })

// ─── План / факт ────────────────────────────────────────────────────────────

/**
 * Дерево статей бюджета с планом и фактом.
 * Период, юрлицо, валюта и проект берутся из самого бюджета. Для БДР со
 * страницы приходят метод учёта и показатели прибыли — имена параметров те же,
 * что у отчёта profit_and_loss (`accounting_method`, `isEbitda`/`isEbit`/`isEbt`).
 */
export const getBudgetPlan = (budgetsId, { accounting_method, profitIndicators } = {}) => {
  const objectData = { budgets_id: budgetsId }

  if (accounting_method) objectData.accounting_method = accounting_method

  if (profitIndicators) {
    objectData.isEbitda = profitIndicators.includes('ebitda')
    objectData.isEbit = profitIndicators.includes('ebit')
    objectData.isEbt = profitIndicators.includes('ebt')
  }

  return budgetsRequest('get_budget_plan', objectData)
}

/** Upsert плановой суммы: (budgets_id, id, месяц) → amount. */
export const createBudgetPlan = ({ budgets_id, id, date, amount }) =>
  budgetsRequest('create_budget_plan', { budgets_id, id, date, amount })

// ─── Нормализация ───────────────────────────────────────────────────────────

/** '2026-01-01T00:00:00Z' → '2026-01' (без парсинга даты — чтобы не поймать TZ-сдвиг). */
export const toMonthKey = (value) => (value ? String(value).slice(0, 7) : null)

/** '2026-01' → '2026-01-01' */
export const monthStartDate = (monthKey) => `${monthKey}-01`

/** '2026-01' → '2026-01-31' */
export const monthEndDate = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthKey}-${String(lastDay).padStart(2, '0')}`
}

/** '2026-05-04T...' → '04.05.2026' */
const toRuDate = (value) => {
  const key = value ? String(value).slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return ''
  const [y, m, d] = key.split('-')
  return `${d}.${m}.${y}`
}

/**
 * Бюджет из API → строка таблицы/форма UI.
 * Проект и группа проектов — взаимоисключающие поля, в UI это один селект,
 * поэтому склеиваем их в `projectValue` с префиксом источника.
 */
export const normalizeBudget = (b = {}) => {
  const projectId = b.projects_id || ''
  const groupId = b.project_groups_id || ''

  return {
    id: b.guid,
    name: b.name || '',
    comment: b.description || '',
    type: Array.isArray(b.type) ? b.type[0] : b.type || '',
    currency: b.currency_code || '',
    currencyId: b.currenies_id || null,
    legalEntity: b.legal_entity_name || null,
    legalEntityKey: b.legal_entity_id || null,
    project: b.project_name || b.project_group_name || null,
    projectKey: projectId || null,
    projectGroupKey: groupId || null,
    projectValue: projectId ? `p:${projectId}` : groupId ? `g:${groupId}` : null,
    periodValue: {
      start: toMonthKey(b.start_date),
      end: toMonthKey(b.end_date),
    },
    modifiedDate: toRuDate(b.updated_at || b.created_at),
    modifiedBy: b.updated_by || b.created_by || '',
  }
}

export const budgetsAPI = {
  list: listBudgets,
  create: createBudget,
  update: updateBudget,
  remove: deleteBudget,
  getPlan: getBudgetPlan,
  savePlan: createBudgetPlan,
}

export default budgetsAPI
