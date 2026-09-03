import { formatAmount as formatMoney } from '@/utils/helpers'
import {
  OPERATION_TYPES,
  OPERATION_TYPE_CATEGORIES,
  OPERATION_TYPE_LABELS,
  DATE_SECTIONS,
  MONTH_NAMES_SHORT
} from '../constants/operations'

/**
 * Утилиты для работы с операциями
 * Оптимизированная версия с кешированием и улучшенной производительностью
 */

// Кеш для дат (оптимизация производительности)
const dateCache = new Map()
const DATE_CACHE_SIZE = 100

/**
 * Очистить кеш дат если он слишком большой
 */
const clearDateCacheIfNeeded = () => {
  if (dateCache.size > DATE_CACHE_SIZE) {
    dateCache.clear()
  }
}

/**
 * Форматировать дату в читаемый формат (с кешированием)
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} Отформатированная дата (например, "15 янв 2026")
 */
export const formatDate = (date) => {
  if (!date) return ''
  
  // Проверяем кеш
  const cacheKey = typeof date === 'string' ? date : date.toISOString()
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)
  }
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const formatted = `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`
    
    // Сохраняем в кеш
    clearDateCacheIfNeeded()
    dateCache.set(cacheKey, formatted)
    
    return formatted
  } catch {
    return ''
  }
}

/**
 * Форматировать сумму с разделителями тысяч
 * @param {number} amount - Сумма
 * @param {boolean} showSign - Показывать знак + для положительных чисел
 * @returns {string} Отформатированная сумма
 */
export const formatAmount = (amount, showSign = false) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0'

  // Копейки зависят от настройки show_cents — формат один на всё приложение
  const formatted = formatMoney(amount)
  return showSign && amount > 0 ? `+${formatted}` : formatted
}

/**
 * Парсить отформатированную сумму обратно в число
 * @param {string} value - Отформатированная сумма
 * @returns {string} Строка с числом без пробелов
 */
export const parseAmount = (value) => {
  if (!value) return ''
  return value.toString().replace(/\s/g, '')
}

/**
 * Подсчитать общую сумму операций
 * @param {Array} operations - Массив операций с полем summa
 * @returns {number} Общая сумма
 */
export const calculateTotal = (operations) => {
  if (!Array.isArray(operations) || operations.length === 0) return 0
  
  return operations.reduce((sum, op) => {
    const amount = op.summa || 0
    return sum + amount
  }, 0)
}

/**
 * Проверить валидность операции
 * @param {Object} operation - Операция для проверки
 * @returns {boolean} true если операция валидна
 */
export const isValidOperation = (operation) => {
  if (!operation || typeof operation !== 'object') return false
  
  // Обязательные поля
  if (!operation.guid) return false
  if (operation.summa === undefined || operation.summa === null) return false
  
  return true
}

/**
 * Определить тип операции из массива tip
 * @param {string[]} tip - Массив типов операции
 * @returns {Object} Объект с типом, категорией и лейблом
 */
export const getOperationType = (tip) => {
  // Дефолтные значения
  const defaultType = OPERATION_TYPES.PAYMENT
  const defaultResult = {
    type: defaultType,
    category: OPERATION_TYPE_CATEGORIES[defaultType],
    label: OPERATION_TYPE_LABELS[defaultType]
  }
  
  if (!tip || !Array.isArray(tip) || tip.length === 0) {
    return defaultResult
  }

  const firstType = tip[0]
  
  return {
    type: firstType,
    category: OPERATION_TYPE_CATEGORIES[firstType] || 'out',
    label: OPERATION_TYPE_LABELS[firstType] || firstType
  }
}

// Кеш для сегодняшней даты (обновляется раз в минуту)
let todayCache = null
let todayCacheTime = 0
const TODAY_CACHE_TTL = 60000 // 1 минута

/**
 * Получить сегодняшнюю дату (с кешированием)
 * @returns {Date} Сегодняшняя дата с обнуленным временем
 */
const getToday = () => {
  const now = Date.now()
  if (!todayCache || now - todayCacheTime > TODAY_CACHE_TTL) {
    todayCache = new Date()
    todayCache.setHours(0, 0, 0, 0)
    todayCacheTime = now
  }
  return todayCache
}

/**
 * Определить секцию даты (сегодня, вчера, ранее)
 * @param {string|Date} operationDate - Дата операции
 * @returns {string} Секция даты
 */
export const getDateSection = (operationDate) => {
  if (!operationDate) return DATE_SECTIONS.YESTERDAY

  const today = getToday()
  const opDate = new Date(operationDate)
  opDate.setHours(0, 0, 0, 0)

  const diffTime = today - opDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return DATE_SECTIONS.TODAY
  if (diffDays === 1) return DATE_SECTIONS.YESTERDAY
  return DATE_SECTIONS.YESTERDAY // Группируем все старые как "вчера и ранее"
}

/**
 * Безопасное извлечение значения из объекта
 * @param {Object} obj - Объект
 * @param {string} path - Путь к значению (например, 'data.name')
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} Значение или defaultValue
 */
const safeGet = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue
  
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return defaultValue
    }
  }
  
  return result ?? defaultValue
}

/**
 * Трансформировать операцию из API формата в UI формат
 * @param {Object} item - Операция из API
 * @param {number} index - Индекс операции
 * @returns {Object} Трансформированная операция
 */
export const transformOperation = (item, index = 0) => {
  if (!item) return null
  
  const operationDate = item.data_operatsii ? new Date(item.data_operatsii) : null
  const accrualDate = item.data_nachisleniya ? new Date(item.data_nachisleniya) : null

  const { type, category, label } = getOperationType(item.tip)
  const section = getDateSection(operationDate)

  const amount = item.summa || 0
  const amountFormatted = formatAmount(amount)

  return {
    id: item.guid || index,
    guid: item.guid,
    type: label,
    typeCategory: category,
    typeLabel: label,
    accrualDate: formatDate(accrualDate),
    operationDate: formatDate(operationDate),
    paymentConfirmed: item.oplata_podtverzhdena,
    payment_confirmed: item.payment_confirmed,
    payment_accrual: item.payment_accrual,
    amount: amountFormatted,
    amountRaw: amount,
    currency: item.currenies_kod || safeGet(item, 'currenies_id_data.nazvanie', ''),
    currencyId: item.currenies_id || null,
    description: item.opisanie || '',
    chartOfAccounts: safeGet(item, 'chart_of_accounts_id_data.nazvanie', item.chart_of_accounts_name || ''),
    chartOfAccountsId: item.chart_of_accounts_id || null,
    bankAccount: item.my_accounts_name || '',
    bankAccountId: item.my_accounts_id || null,
    counterparty: item.counterparties_name || '',
    counterpartyId: item.counterparties_id || null,
    createdAt: formatDate(item.data_sozdaniya),
    createdAtRaw: item.data_sozdaniya,
    updatedAt: formatDate(item.data_obnovleniya),
    updatedAtRaw: item.data_obnovleniya,
    section: section,
    rawData: item
  }
}

/**
 * Трансформировать массив операций
 * @param {Array} operations - Массив операций из API
 * @returns {Array} Массив трансформированных операций
 */
export const transformOperations = (operations) => {
  if (!Array.isArray(operations) || operations.length === 0) return []
  
  // Используем map с фильтрацией null значений
  return operations
    .map((op, index) => transformOperation(op, index))
    .filter(Boolean)
}

/**
 * Фильтровать операции по диапазону дат
 * @param {Array} operations - Массив операций
 * @param {Object} dateRange - Диапазон дат
 * @param {string} dateRange.start - Начальная дата
 * @param {string} dateRange.end - Конечная дата
 * @param {string} dateField - Поле даты для фильтрации ('data_operatsii' или 'data_nachisleniya')
 * @returns {Array} Отфильтрованные операции
 */
export const filterOperationsByDateRange = (operations, dateRange, dateField = 'data_operatsii') => {
  if (!operations || operations.length === 0) return []
  if (!dateRange || (!dateRange.start && !dateRange.end)) return operations

  // Предварительно парсим даты для оптимизации
  const startDate = dateRange.start ? new Date(dateRange.start) : null
  const endDate = dateRange.end ? new Date(dateRange.end) : null

  return operations.filter(item => {
    const itemDate = item[dateField] ? new Date(item[dateField]) : null
    if (!itemDate) return false

    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false

    return true
  })
}

/**
 * Группировать операции по секциям дат
 * @param {Array} operations - Массив операций
 * @returns {Object} Объект с группами операций
 */
export const groupOperationsByDateSection = (operations) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    return {
      [DATE_SECTIONS.TODAY]: [],
      [DATE_SECTIONS.YESTERDAY]: []
    }
  }

  const groups = {
    [DATE_SECTIONS.TODAY]: [],
    [DATE_SECTIONS.YESTERDAY]: []
  }

  // Оптимизированный цикл
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const section = op.section
    
    if (groups[section]) {
      groups[section].push(op)
    }
  }

  return groups
}

/**
 * Подсчитать общую сумму выбранных операций
 * @param {Array} operations - Все операции
 * @param {Array} selectedIds - ID выбранных операций
 * @returns {number} Общая сумма
 */
export const calculateSelectedTotal = (operations, selectedIds) => {
  if (!operations || !selectedIds || selectedIds.length === 0) return 0

  // Создаем Set для быстрого поиска
  const selectedSet = new Set(selectedIds)
  
  let total = 0
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    if (selectedSet.has(op.id)) {
      total += safeGet(op, 'rawData.summa', 0)
    }
  }

  return total
}

/**
 * Построить объект фильтров для API запроса
 * @param {Object} filters - Фильтры из UI
 * @returns {Object} Объект фильтров для API
 */
export const buildAPIFilters = (filters) => {
  if (!filters || typeof filters !== 'object') return {}
  
  const apiFilters = {}

  // Фильтр по типам операций
  if (filters.types && typeof filters.types === 'object') {
    const selectedTypes = Object.entries(filters.types)
      .filter(([_, isSelected]) => isSelected)
      .map(([type]) => type)

    // Только добавляем фильтр если не все типы выбраны
    const totalTypes = Object.keys(OPERATION_TYPES).length
    if (selectedTypes.length > 0 && selectedTypes.length < totalTypes) {
      apiFilters.tip = selectedTypes
    }
  }

  // Фильтр по подтверждению оплаты
  if (filters.paymentConfirmation) {
    const { confirmed, notConfirmed } = filters.paymentConfirmation
    
    if (confirmed && !notConfirmed) {
      apiFilters.oplata_podtverzhdena = true
    } else if (!confirmed && notConfirmed) {
      apiFilters.oplata_podtverzhdena = false
    }
    // Если оба или ни одного - не добавляем фильтр
  }

  // Фильтр по контрагентам
  if (Array.isArray(filters.counterparties) && filters.counterparties.length > 0) {
    apiFilters.counterparties_id = filters.counterparties
  }

  // Фильтр по статьям учета
  if (Array.isArray(filters.chartOfAccounts) && filters.chartOfAccounts.length > 0) {
    apiFilters.chart_of_accounts_id = filters.chartOfAccounts
  }

  // Фильтр по счетам
  if (Array.isArray(filters.accounts) && filters.accounts.length > 0) {
    apiFilters.my_accounts_id = filters.accounts
  }

  return apiFilters
}

/**
 * Очистить все кеши (полезно при смене данных)
 */
export const clearAllCaches = () => {
  dateCache.clear()
  todayCache = null
  todayCacheTime = 0
}

/**
 * Получить статистику по операциям
 * @param {Array} operations - Массив операций
 * @returns {Object} Статистика
 */
export const getOperationsStats = (operations) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    return {
      total: 0,
      income: 0,
      expense: 0,
      balance: 0,
      byType: {}
    }
  }

  let income = 0
  let expense = 0
  const byType = {}

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const amount = safeGet(op, 'rawData.summa', 0)
    const category = op.typeCategory

    // Подсчет по категориям
    if (category === 'in') {
      income += amount
    } else if (category === 'out') {
      expense += amount
    }

    // Подсчет по типам
    const type = op.type
    byType[type] = (byType[type] || 0) + amount
  }

  return {
    total: operations.length,
    income,
    expense,
    balance: income - expense,
    byType
  }
}
