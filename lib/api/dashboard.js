/**
 * Dashboard API
 * Централизованный модуль для работы с различными API
 * 
 * @deprecated Большинство методов устарели. Используйте прямые импорты из lib/api/ucode/*
 * Этот файл сохранен для обратной совместимости
 */

// Импортируем новые API модули
import { bankAccountsAPI } from './ucode/bankAccounts'
import { apiClient } from './ucode/base'
import { chartOfAccountsAPI } from './ucode/chartOfAccounts'
import { counterpartiesAPI } from './ucode/counterparties'
import { legalEntitiesAPI } from './ucode/legalEntities'
import { operationsAPI } from './ucode/operations'

/**
 * Dashboard API endpoints
 * 
 * ВАЖНО: Этот модуль устарел!
 * Используйте прямые импорты:
 * - import { operationsAPI } from '@/lib/api/ucode/operations'
 * - import { counterpartiesAPI } from '@/lib/api/ucode/counterparties'
 * - import { legalEntitiesAPI } from '@/lib/api/ucode/legalEntities'
 * - import { bankAccountsAPI } from '@/lib/api/ucode/bankAccounts'
 * - import { chartOfAccountsAPI } from '@/lib/api/ucode/chartOfAccounts'
 */
export const dashboardAPI = {
  // ============================================
  // ОПЕРАЦИИ (Operations)
  // ============================================

  /**
   * @deprecated Используйте operationsAPI.getList()
   */
  getOperations: async (params) => {
    return operationsAPI.getList(params)
  },

  /**
   * @deprecated Используйте operationsAPI.getList()
   */
  getOperationsList: async (params) => {
    return operationsAPI.getList(params)
  },

  /**
   * @deprecated Используйте operationsAPI.create()
   */
  createOperation: async (data) => {
    return operationsAPI.create(data)
  },

  /**
   * @deprecated Используйте operationsAPI.update()
   */
  updateOperation: async (id, data) => {
    return operationsAPI.update({ guid: id, ...data })
  },

  /**
   * @deprecated Используйте operationsAPI.delete()
   */
  deleteOperation: async (ids) => {
    const guidArray = Array.isArray(ids) ? ids : [ids]
    return operationsAPI.delete(guidArray)
  },

  // ============================================
  // ПЛАН СЧЕТОВ (Chart of Accounts)
  // ============================================

  /**
   * @deprecated Используйте chartOfAccountsAPI.getList()
   */
  getChartOfAccountsV2: async (params = {}) => {
    return chartOfAccountsAPI.getChartOfAccountsInvokeFunction({
      page: 1,
      limit: 100,
      ...params
    })
  },

  /**
   * @deprecated Используйте chartOfAccountsAPI.create()
   */
  createChartOfAccounts: async (data) => {
    return chartOfAccountsAPI.createChartOfAccount(data)
  },

  /**
   * @deprecated Используйте chartOfAccountsAPI.update()
   */
  updateChartOfAccounts: async (data) => {
    return chartOfAccountsAPI.updateChartOfAccount(data)
  },

  /**
   * @deprecated Используйте chartOfAccountsAPI.delete()
   */
  deleteChartOfAccounts: async (params) => {
    return chartOfAccountsAPI.deleteChartOfAccount(params)
  },

  // ============================================
  // БАНКОВСКИЕ СЧЕТА (Bank Accounts / My Accounts)
  // ============================================

  /**
   * @deprecated Используйте bankAccountsAPI.getList()
   */
  getBankAccounts: async (params) => {
    return bankAccountsAPI.getList(params)
  },

  getMyAccountsBoard: async (params) => {
    return bankAccountsAPI.getMyAccountsBoard(params)
  },

  /**
   * @deprecated Используйте bankAccountsAPI.getBankAccountsInvokeFunction()
   */
  getMyAccountsV2: async (params = {}) => {
    return bankAccountsAPI.getBankAccountsInvokeFunction(params)
  },

  /**
   * @deprecated Используйте bankAccountsAPI.create()
   */
  createMyAccount: async (data) => {
    return bankAccountsAPI.create(data)
  },

  /**
   * @deprecated Используйте bankAccountsAPI.update()
   */
  updateMyAccount: async (data) => {
    return bankAccountsAPI.update(data)
  },

  /**
   * @deprecated Используйте bankAccountsAPI.delete()
   */
  deleteMyAccounts: async (ids) => {
    const guidArray = Array.isArray(ids) ? ids : [ids]
    return bankAccountsAPI.delete(guidArray)
  },

  // ============================================
  // КОНТРАГЕНТЫ (Counterparties)
  // ============================================

  /**
   * @deprecated Используйте counterpartiesAPI.getList()
   */
  getCounterparties: async (params) => {
    return counterpartiesAPI.getList(params)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.getCounterpartiesInvokeFunction()
   */
  getCounterpartiesV2: async (params = {}) => {
    return counterpartiesAPI.getCounterpartiesInvokeFunction(params)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.create()
   */
  createCounterparty: async (data) => {
    return counterpartiesAPI.create(data)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.update()
   */
  updateCounterparty: async (data) => {
    return counterpartiesAPI.update(data)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.delete()
   */
  deleteCounterparties: async (ids) => {
    const guidArray = Array.isArray(ids) ? ids : [ids]
    return counterpartiesAPI.delete(guidArray)
  },

  // ============================================
  // ГРУППЫ КОНТРАГЕНТОВ (Counterparty Groups)
  // ============================================

  /**
   * @deprecated Используйте counterpartiesAPI.getCounterpartiesGroupInvokeFunction()
   */
  getCounterpartiesGroupsV2: async (params = {}) => {
    return counterpartiesAPI.getCounterpartiesGroupInvokeFunction(params)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.createCounterpartyGroup()
   */
  createCounterpartiesGroup: async (data) => {
    return counterpartiesAPI.createCounterpartyGroup(data)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.updateCounterpartyGroup()
   */
  updateCounterpartiesGroup: async (data) => {
    return counterpartiesAPI.updateCounterpartyGroup(data)
  },

  /**
   * @deprecated Используйте counterpartiesAPI.deleteCounterpartyGroup()
   */
  deleteCounterpartiesGroups: async (ids) => {
    const guidArray = Array.isArray(ids) ? ids : [ids]
    const deletePromises = guidArray.map(guid => counterpartiesAPI.deleteCounterpartyGroup(guid))
    return Promise.all(deletePromises)
  },

  // ============================================
  // ЮРИДИЧЕСКИЕ ЛИЦА (Legal Entities)
  // ============================================

  /**
   * @deprecated Используйте legalEntitiesAPI.getLegalEntitiesInvokeFunction()
   */
  getLegalEntitiesV2: async (params = {}) => {
    return legalEntitiesAPI.getLegalEntitiesInvokeFunction(params)
  },

  /**
   * @deprecated Используйте legalEntitiesAPI.create()
   */
  createLegalEntity: async (data) => {
    return legalEntitiesAPI.create(data)
  },

  /**
   * @deprecated Используйте legalEntitiesAPI.update()
   */
  updateLegalEntity: async (data) => {
    return legalEntitiesAPI.update(data)
  },

  /**
   * @deprecated Используйте legalEntitiesAPI.delete()
   */
  deleteLegalEntities: async (ids) => {
    const guidArray = Array.isArray(ids) ? ids : [ids]
    return legalEntitiesAPI.delete(guidArray)
  },

  // ============================================
  // УСТАРЕВШИЕ МЕТОДЫ (для удаления в будущем)
  // ============================================

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getDashboardData: async (params) => {
    console.warn('dashboardAPI.getDashboardData is deprecated')
    return { data: [] }
  },

  getDashboardBalance: async (params) => {
    console.warn('dashboardAPI.getDashboardBalance is deprecated')
    return { data: [] }
  },

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getProducts: async (params) => {
    console.warn('dashboardAPI.getProducts is deprecated')
    return { data: [] }
  },

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getAccounts: async (params) => {
    console.warn('dashboardAPI.getAccounts is deprecated')
    return { data: [] }
  },

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getTransactionCategories: async (params) => {
    console.warn('dashboardAPI.getTransactionCategories is deprecated')
    return { data: [] }
  },

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getAccountsGroupsV2: async (params = {}) => {
    console.warn('dashboardAPI.getAccountsGroupsV2 is deprecated')
    return { data: [] }
  },

  /**
   * @deprecated Метод устарел, используйте прямые API модули
   */
  getFinanceSummary: async (params = {}) => {
    console.warn('dashboardAPI.getFinanceSummary is deprecated')
    return { data: [] }
  }
}

export const getPayment = async (id) => {
  try {
    const res = await apiClient.getSinglePageBody(id)
    return res
  } catch (error) {
    console.log('getPayment error', error?.message)
  }
}

