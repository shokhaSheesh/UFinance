import { appStore } from '@/store/app.store'
import { apiClient } from './base'

/**
 * ============================================
 * Projects & Project Groups API
 * ============================================
 * У этих методов тело отличается от обычного invoke_function: на уровне `data`
 * передаётся `app_id` (для мутаций), а не branch_id внутри object_data.
 *   { data: { auth, method, app_id, object_data } }
 * Эндпоинт — тот же invoke_function (functionsV2).
 */

// app_id === projectId (см. lib/config/api.js)
const APP_ID = '3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed'

// Статусы: ключ UI ↔ строка API
export const STATUS_RU = {
  planned: 'Плановый',
  in_progress: 'В работе',
  completed: 'Завершен',
}
export const STATUS_KEY = {
  Плановый: 'planned',
  'В работе': 'in_progress',
  Завершен: 'completed',
}
export const statusToKey = (ru) => STATUS_KEY[ru] || 'planned'
export const statusToRu = (key) => STATUS_RU[key] || 'Плановый'

// Цвета статусов для бейджей
export const STATUS_COLORS = {
  planned: '#2f6bff',
  in_progress: '#f59e0b',
  completed: '#10b981',
}

const getInvokeUrl = () =>
  appStore?.localApiUrl ||
  `${apiClient.baseURL}${apiClient.invokeFunctionEndpoint}?project-id=${APP_ID}`

/**
 * Базовый запрос к projects-хендлерам.
 * @returns {Promise<{success:boolean,data:any,pagination?:object,message?:string}>}
 */
async function projectsRequest(method, objectData = {}) {
  const url = getInvokeUrl()
  const body = {
    data: {
      auth: { data: {}, type: 'apikey' },
      method,
      app_id: APP_ID,
      object_data: objectData,
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

// ─── Project Groups ─────────────────────────────────────────────────────────
export const listProjectGroups = ({ page = 1, limit = 100 } = {}) =>
  projectsRequest('list_project_groups', { page, limit })

export const getProjectGroup = (guid) => projectsRequest('get_project_group', { guid })

export const createProjectGroup = ({ name, description }) =>
  projectsRequest('create_project_group', { name, description: description || undefined })

export const updateProjectGroup = ({ guid, name, description }) =>
  projectsRequest('update_project_group', { guid, name, description })

export const deleteProjectGroup = (guid) => projectsRequest('delete_project_group', { guid })

// ─── Projects ───────────────────────────────────────────────────────────────
export const listProjects = (params = {}) => projectsRequest('list_projects', params)

export const getProject = (guid) => projectsRequest('get_project', { guid })

export const createProject = ({ name, project_groups_id, description }) =>
  projectsRequest('create_project', {
    name,
    project_groups_id: project_groups_id || undefined,
    description: description || undefined,
  })

// project_groups_id === '' → снять привязку (NULL)
export const updateProject = ({ guid, name, project_groups_id, description }) =>
  projectsRequest('update_project', { guid, name, project_groups_id, description })

export const deleteProject = (guid) => projectsRequest('delete_project', { guid })

/**
 * status не передан → toggle на бэке.
 * Передан — принимаем и ключ UI (`completed`), и строку API («Завершен»).
 */
export const updateProjectStatus = ({ guid, status }) =>
  projectsRequest('update_project_status', {
    guid,
    status: status ? STATUS_RU[status] || status : undefined,
  })

/**
 * Нормализация проекта из API → форма UI.
 */
export const normalizeProject = (p = {}) => ({
  id: p.guid,
  name: p.name,
  comment: p.description || '',
  groupId: p.project_groups_id || '',
  groupName: p.project_group_name || '',
  status: statusToKey(p.status),
  startDate: p.start_date || null,
  endDate: p.end_date || null,
  // финансовые показатели приходят вместе с проектом (list_projects / get_project)
  income: p.income ?? null,
  expenses: p.expense ?? null,
  profit: p.profit ?? null,
  profitability: p.profitability ?? null,
})

/**
 * `summary` из list_projects → сводка для футера списка.
 * Считается на бэке по всем страницам выборки, поэтому берётся как есть.
 */
export const normalizeProjectsSummary = (s = {}, fallbackCount = 0) => ({
  count: s?.count ?? fallbackCount,
  income: s?.total_income ?? 0,
  expenses: s?.total_expense ?? 0,
  profit: s?.total_profit ?? 0,
  profitability: s?.total_profitability ?? null,
})
