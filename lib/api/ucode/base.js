import { NextResponse } from 'next/server'
import { appStore } from '../../../store/app.store'
import { authStore } from '../../../store/auth.store'
import { formatDate } from '../../../utils/formatDate'
import { apiConfig } from '../../config/api'

/**
 * ============================================
 * УНИВЕРСАЛЬНЫЙ API КЛИЕНТ ДЛЯ U-CODE
 * ============================================
 * Единая точка входа для всех API запросов
 */

/**
 * Базовый класс для работы с U-code API
 */
class UcodeAPIClient {
  constructor() {
    this.baseURL = 'https://api.admin.u-code.io'
    this.refreshURL = 'https://api.auth.u-code.io/v2/refresh'
    this.invokeFunctionEndpoint = '/v2/invoke_function/planfact-plan-fact/v2'
    this.invokeFunctionGetWayEndpoint = '/v2/invoke_function/planfact-function-getawey/v2'
    this.projectId = '3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed'
    this.environmentId = 'fc258dff-47c0-4ab1-9beb-91a045b4847c'
    this.branch_id = authStore?.branch_id
    this._isRefreshing = false
    this._refreshPromise = null
  }

  /**
   * Обновить access token используя refresh token
   * @returns {Promise<string>} Новый access token
   */
  async refreshAccessToken() {
    // Если уже идет обновление — ждём его результат
    if (this._isRefreshing && this._refreshPromise) {
      return this._refreshPromise
    }

    this._isRefreshing = true
    this._refreshPromise = (async () => {
      try {
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken')
          : authStore.refreshToken

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await fetch(this.refreshURL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `*/*`,
          },
          body: JSON.stringify({
            "client_type_id": authStore?.userData?.client_type_id,
            "env_id": this.projectId,
            "project_id": this.environmentId,
            "refresh_token": refreshToken
          })
        })

        if (!response.ok) {
          throw new Error(`Refresh failed with status ${response.status}`)
        }

        const result = await response.json()
        const newAccessToken = result?.data?.token?.access_token
        const newRefreshToken = result?.data?.token?.refresh_token

        if (!newAccessToken) {
          throw new Error('No access_token in refresh response')
        }

        // Обновляем токены в authStore и localStorage
        authStore.authToken = newAccessToken
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', newAccessToken)
        }

        if (newRefreshToken) {
          authStore.refreshToken = newRefreshToken
          if (typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', newRefreshToken)
          }
        }

        console.log('Access token refreshed successfully')
        return newAccessToken
      } catch (error) {
        console.error('Token refresh failed:', error)
        // Если refresh не удался — разлогиниваем
        authStore.logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/pages/auth'
        }
        throw error
      } finally {
        this._isRefreshing = false
        this._refreshPromise = null
      }
    })()

    return this._refreshPromise
  }

  /**
   * Получить токен авторизации
   * @param {string} providedToken - Переданный токен
   * @returns {string|null} Токен авторизации
   */

  getAuthToken(providedToken = null) {
    if (providedToken) return providedToken

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        console.log('Using auth token from localStorage')
        return token
      }
    }

    // Не показываем предупреждение - токен может отсутствовать для auth методов
    return null
  }

  /**
   * Построить заголовки запроса
   * @param {string} authToken - Токен авторизации
   * @param {Object} additionalHeaders - Дополнительные заголовки
   * @returns {Object} Заголовки
   */
  buildHeaders(authToken = null, additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...additionalHeaders
    }

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    return headers
  }

  /**
   * Построить тело запроса для invoke_function
   * @param {string} method - Название метода API
   * @param {Object} data - Данные для object_data
   * @returns {Object} Тело запроса
   */
  buildInvokeFunctionBody(method, data = {}) {
    // Для auth методов не добавляем auth блок
    if (method.startsWith('auth_')) {
      return {
        data: {
          method,
          object_data: data
        }
      }
    }

    const requestData = {
      ...data,
    }

    if (authStore?.branch_id) {
      requestData.branch_id = authStore.branch_id
    }

    return {
      data: {
        auth: {
          data: {},
          type: 'apikey'
        },
        method,
        object_data: requestData
      }
    }
  }

  /**
   * Обработать ответ от API
   * @param {Response} response - Fetch response
   * @param {string} method - Название метода для логирования
   * @returns {Promise<Object>} Распарсенные данные
   */
  async handleResponse(response, method) {
    const responseText = await response.text()
    let responseData

    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
      const error = new Error('Failed to parse response')
      error.status = 500
      error.details = responseText
      error.parseError = parseError.message
      throw error
    }

    if (responseData.status === 'ERROR' || responseData.status === 'INVALID_ARGUMENT' || responseData.status === 'BAD_REQUEST') {

      const errorMessage = typeof responseData.data === 'string'
        ? responseData.data
        : (responseData.description || responseData.custom_message || 'API Error')

      const error = new Error(errorMessage)
      error.status = response.status
      error.statusText = response.statusText
      error.details = responseData
      error.url = response.url
      throw error
    }

    if (!response.ok) {

      console.log('response not ok', responseData)

      const error = responseData?.data?.error || new Error(responseData?.description || response.statusText || responseData?.data?.error || 'API Error')
      error.status = response.status
      error.statusText = response.statusText
      error.details = responseData
      error.url = response.url
      throw error
    }

    return responseData
  }

  /**
   * Выполнить запрос к invoke_function API
   * @param {Object} params - Параметры запроса
   * @param {string} params.method - Название метода API
   * @param {Object} params.data - Данные для object_data
   * @param {string} params.authToken - Токен авторизации (опционально)
   * @param {Object} params.headers - Дополнительные заголовки (опционально)
   * @returns {Promise<Object>} Ответ от API
   */
  async invokeFunction({ method, data = {}, authToken: providedToken = null, headers: additionalHeaders = {}, type = "" }) {
    // Для auth методов и type='role' не используем токен
    const isAuthMethod = method.startsWith('auth_') || type === 'role'
    const authToken = this.getAuthToken(providedToken)


    const baseUrl = appStore.localApiUrl || `${this.baseURL}${type === "role" ? this.invokeFunctionGetWayEndpoint : this.invokeFunctionEndpoint}?project-id=3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed`
    const url = baseUrl

    const headers = this.buildHeaders(authToken, additionalHeaders)

    // Для auth методов добавляем environment-id в заголовки
    if (isAuthMethod) {
      headers['environment-id'] = this.environmentId
    }

    const body = this.buildInvokeFunctionBody(method, data)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })


      // Если 401 — обновляем токен и повторяем запрос
      if (response.status === 401 && !isAuthMethod) {
        const newToken = await this.refreshAccessToken()
        const retryHeaders = this.buildHeaders(newToken, additionalHeaders)
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify(body)
        })
        return await this.handleResponse(retryResponse, method)
      }

      return await this.handleResponse(response, method)
    } catch (error) {
      // Если ошибка уже обработана, пробрасываем дальше
      if (error.status) {
        throw error
      }


      // Обрабатываем сетевые ошибки 
      const networkError = new Error('Network Error')
      networkError.status = 500
      networkError.statusText = 'Network Error'
      networkError.details = error.message || 'Failed to connect to server'
      networkError.url = url
      networkError.isNetworkError = true
      throw error
    }
  }

  async defaultUcodeFunction({ urlMethod = '', urlParams = '', data = {} }) {
    //  /items/sales_transactions?from-ofs=true 
    let authToken = null

    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('authToken')
    }

    const url = `${this.baseURL}/v2${urlParams}` + (urlMethod === 'GET' ? `&data=${encodeURIComponent(JSON.stringify({ branch_id: authStore.branch_id }))}` : '')

    const headers = this.buildHeaders(authToken)

    const newData = {
      ...data,
      company_id: authStore.userData?.company_id,
    }

    if (!authStore.userData?.can_view_all_branches) {
      newData.branch_id = authStore.userData?.branch_id
    }
    if (authStore?.branch_id) {
      newData.branch_id = authStore.branch_id
    }

    try {
      const fetchOptions = {
        method: urlMethod,
        headers,
      }

      if (urlMethod !== 'HEAD' && urlMethod !== 'GET') {
        fetchOptions.body = JSON.stringify({
          data: newData,
          disable_faas: false
        })
      }

      const response = await fetch(url, fetchOptions)

      // Если 401 — обновляем токен и повторяем запрос
      if (response.status === 401) {
        const newToken = await this.refreshAccessToken()
        const retryHeaders = this.buildHeaders(newToken)
        const retryOptions = {
          method: urlMethod,
          headers: retryHeaders,
        }
        if (urlMethod !== 'HEAD' && urlMethod !== 'GET') {
          retryOptions.body = fetchOptions.body
        }
        const retryResponse = await fetch(url, retryOptions)
        return await this.handleResponse(retryResponse, urlMethod)
      }



      return await this.handleResponse(response, urlMethod)
    } catch (error) {
      // Если ошибка уже обработана, пробрасываем дальше
      if (error.status) {
        throw error
      }

    }
  }
}

// Создаем единственный экземпляр клиента
const apiClient = new UcodeAPIClient()

/**
 * ============================================
 * ПУБЛИЧНЫЕ ФУНКЦИИ ДЛЯ ИСПОЛЬЗОВАНИЯ
 * ============================================
 */

/**
 * Очистить данные перед отправкой в API
 * Заменяет пустые массивы, пустые объекты и пустые строки на null
 * @param {Object} data - Данные для очистки
 * @returns {Object} Очищенные данные
 */
function cleanDataForAPI(data) {
  if (!data || typeof data !== 'object') return data

  const cleaned = {}

  for (const [key, value] of Object.entries(data)) {
    // Пропускаем undefined
    if (value === undefined) continue

    // Пустые строки -> null
    if (value === '') {
      cleaned[key] = null
      continue
    }

    // Пустые массивы -> null
    if (Array.isArray(value) && value.length === 0) {
      cleaned[key] = null
      continue
    }

    // Пустые объекты -> null (кроме специальных полей)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value)
      // Если объект пустой и это не специальное поле (auth, data)
      if (keys.length === 0 && key !== 'auth' && key !== 'data') {
        cleaned[key] = null
        continue
      }
    }

    // Остальные значения оставляем как есть
    cleaned[key] = value
  }

  return cleaned
}

/**
 * Универсальная функция для запросов к invoke_function API
 * @param {Object} params - Параметры запроса
 * @param {string} params.method - Название метода API
 * @param {Object} params.data - Данные для object_data
 * @param {string} params.authToken - Токен авторизации (опционально)
 * @returns {Promise<Object>} Ответ от API
 */
export async function ucodeRequest({ method, data = {}, authToken = null }) {
  // Для auth методов НЕ очищаем данные, так как auth.data должен быть пустым объектом
  const shouldCleanData = !method.startsWith('auth_')
  const cleanedData = shouldCleanData ? cleanDataForAPI(data) : data

  return apiClient.invokeFunction({ method, data: cleanedData, authToken })
}

export async function defaultUcodeApiRequest({ urlMethod, urlParams, data }) {
  return await apiClient.defaultUcodeFunction({ urlMethod, urlParams, data })
}

/**
 * Создать CRUD методы для ресурса
 * @param {string} resourceName - Название ресурса (например, 'operation', 'counterparty')
 * @returns {Object} Объект с CRUD методами
 */
export function createCRUDMethods(resourceName) {
  const capitalizedName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)

  return {
    /**
     * Получить список ресурсов
     * @param {Object} params - Параметры запроса (page, limit, filters)
     * @returns {Promise<Object>} Список ресурсов
     */
    getList: async (params = {}) => {
      const { page = 1, limit = 50, ...filters } = params
      return ucodeRequest({
        method: `get_${resourceName}s`,
        data: { page, limit, ...filters }
      })
    },

    /**
     * Получить ресурс по GUID
     * @param {string} guid - GUID ресурса
     * @returns {Promise<Object>} Данные ресурса
     */
    getByGuid: async (guid) => {
      if (!guid) throw new Error(`${capitalizedName} GUID is required`)
      return ucodeRequest({
        method: `get_${resourceName}`,
        data: { guid }
      })
    },

    /**
     * Создать ресурс
     * @param {Object} data - Данные ресурса
     * @returns {Promise<Object>} Созданный ресурс
     */
    create: async (data) => {
      const now = formatDate(new Date())
      return ucodeRequest({
        method: `create_${resourceName}`,
        data: {
          ...data,
        }
      })
    },

    /**
     * Обновить ресурс
     * @param {Object} data - Данные ресурса (должен содержать guid)
     * @returns {Promise<Object>} Обновленный ресурс
     */
    update: async (data) => {
      if (!data.guid) throw new Error(`${capitalizedName} GUID is required for update`)
      const now = new Date().toISOString()
      return ucodeRequest({
        method: `update_${resourceName}`,
        data: {
          ...data,
          data_obnovleniya: now
        }
      })
    },

    /**
     * Удалить ресурсы
     * @param {string|string[]} guids - GUID или массив GUID для удаления
     * @returns {Promise<Object>} Результат удаления
     */
    delete: async (guids) => {
      const guidArray = Array.isArray(guids) ? guids : [guids]
      if (guidArray.length === 0) throw new Error(`At least one ${capitalizedName} GUID is required`)

      // Для одного элемента используем единственное число, для нескольких - множественное
      // Но для операций API использует единственное число даже для множественного удаления
      const method = guidArray.length === 1
        ? `delete_${resourceName}`
        : `delete_${resourceName}s`

      return ucodeRequest({
        method: `delete_${resourceName}`, // Всегда используем единственное число
        data: { guid: guidArray[0] } // API принимает только один guid за раз
      })
    }
  }
}

/**
 * Экспортируем клиент для расширенного использования
 */
export { apiClient }

/**
 * Make a request to u-code views API
 * @param {Object} params - Request parameters
 * @param {string} params.menuId - Menu ID
 * @param {string} params.viewId - View ID
 * @param {string} params.tableSlug - Table slug (e.g., 'chart_of_accounts', 'bank_accounts')
 * @param {string} params.projectId - Project ID (optional, uses default from config)
 * @param {Object} params.bodyData - Data to send in request body
 * @param {Object} params.headers - Additional headers (optional)
 * @returns {Promise<Response>} Fetch response
 */
export async function makeUcodeViewsRequest({
  menuId,
  viewId,
  tableSlug,
  projectId,
  bodyData = {},
  headers: additionalHeaders = {},
  authToken: providedToken = null
}) {
  const baseURL = apiConfig.ucode.baseURL
  // Use provided token, or try to get from localStorage (client-side), or fallback to config
  const authToken = providedToken || (
    typeof window !== 'undefined'
      ? (localStorage.getItem('authToken') || apiConfig.ucode.authToken)
      : apiConfig.ucode.authToken
  )
  const finalProjectId = projectId || apiConfig.ucode.projectId

  // Build URL
  const url = `${baseURL}/v3/menus/${menuId}/views/${viewId}/tables/${tableSlug}/items/list?project-id=${finalProjectId}`

  // Prepare base headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Authorization': `Bearer ${authToken}`,
    'origin': 'https://app.u-code.io',
    'referer': 'https://app.u-code.io/',
    ...additionalHeaders
  }

  // Override Authorization if provided in additionalHeaders
  if (additionalHeaders.Authorization) {
    headers.Authorization = additionalHeaders.Authorization
  }

  // Prepare body - matching u-code API structure
  const requestBody = {
    data: {
      row_view_id: viewId,
      offset: bodyData.offset || 0,
      order: bodyData.order || {},
      view_fields: bodyData.view_fields || [],
      limit: bodyData.limit || 20,
      search: bodyData.search || '',
      ...(bodyData.tip && { tip: bodyData.tip }),
      ...bodyData.extraFields // Allow additional fields
    }
  }

  console.log('U-code API request:', {
    url,
    headers: { ...headers, Authorization: 'Bearer ***' },
    body: requestBody
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    return response
  } catch (networkError) {
    console.error('U-code API network error:', networkError)
    // Re-throw as a structured error that will be caught by API route
    throw {
      status: 500,
      statusText: 'Network Error',
      details: {
        status: 'ERROR',
        description: 'Network error occurred',
        data: networkError.message || 'Failed to connect to server'
      },
      url,
      isNetworkError: true
    }
  }
}

/**
 * Handle u-code API response
 * @param {Response} response - Fetch response
 * @param {string} endpointName - Name of endpoint for logging
 * @returns {Promise<Object>} Parsed response data
 */
export async function handleUcodeResponse(response, endpointName = 'U-code API') {
  // Check if response is ok
  if (!response.ok) {
    let errorText = ''
    try {
      errorText = await response.text()
    } catch (e) {
      errorText = `Failed to read error response: ${e.message}`
    }


    // Try to parse error as JSON
    let errorDetails = errorText || 'Empty response body'
    try {
      if (errorText) {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson
      }
    } catch (e) {
      errorDetails = errorText || `Failed to parse error: ${e.message}`
    }

    throw {
      status: response.status,
      statusText: response.statusText,
      details: errorDetails,
      url: response.url
    }
  }

  // Parse JSON response
  const responseText = await response.text()
  let data
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch (parseError) {
    console.error(`Failed to parse ${endpointName} JSON response:`, parseError)
    console.error('Response text:', responseText)
    throw {
      status: 500,
      details: responseText,
      parseError: parseError.message
    }
  }

  console.log('data:', data?.data?.data?.response)

  console.log(`${endpointName} response status:`, response.status)
  return data
}

/**
 * Get CORS headers for responses
 */
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * Create OPTIONS handler response
 * @returns {NextResponse} OPTIONS response
 */
export function createOptionsResponse() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

/**
 * Make a POST request to u-code API for table structure
 * @param {Object} params - Request parameters
 * @param {string} params.menuId - Menu ID
 * @param {string} params.viewId - View ID
 * @param {string} params.tableSlug - Table slug
 * @param {string} params.projectId - Project ID (optional, uses default from config)
 * @param {Object} params.headers - Additional headers (optional)
 * @returns {Promise<Response>} Fetch response
 */
export async function makeUcodeGetRequest({
  menuId,
  viewId,
  tableSlug,
  projectId,
  headers: additionalHeaders = {},
  authToken: providedToken = null
}) {
  const baseURL = apiConfig.ucode.baseURL
  // Use provided token, or try to get from localStorage (client-side), or fallback to config
  const authToken = providedToken || (
    typeof window !== 'undefined'
      ? (localStorage.getItem('authToken') || apiConfig.ucode.authToken)
      : apiConfig.ucode.authToken
  )
  const finalProjectId = projectId || apiConfig.ucode.projectId

  // Build URL - POST to items/list endpoint for table structure
  const url = `${baseURL}/v3/menus/${menuId}/views/${viewId}/tables/${tableSlug}/items/list?project-id=${finalProjectId}`

  // Prepare base headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Authorization': `Bearer ${authToken}`,
    'origin': 'https://app.u-code.io',
    'referer': 'https://app.u-code.io/',
    ...additionalHeaders
  }

  // Override Authorization if provided in additionalHeaders
  if (additionalHeaders.Authorization) {
    headers.Authorization = additionalHeaders.Authorization
  }

  // Prepare body with empty data object
  const requestBody = {
    data: {}
  }

  console.log('U-code POST API request (table structure):', {
    url,
    headers: { ...headers, Authorization: 'Bearer ***' },
    body: requestBody
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    return response
  } catch (networkError) {
    console.error('U-code POST API network error (table structure):', networkError)
    // Re-throw as a structured error that will be caught by API route
    throw {
      status: 500,
      statusText: 'Network Error',
      details: {
        status: 'ERROR',
        description: 'Network error occurred',
        data: networkError.message || 'Failed to connect to server'
      },
      url,
      isNetworkError: true
    }
  }
}
