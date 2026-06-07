import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

class SealDeal {
  // single deal Методом начисления || Кассовым методом
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method' // accrual_method || cash_method
  // deals page filters
  selectedCounterparties = []
  search = ''
  dateRange = { start: null, end: null }
  operationDateStart = ''
  operationDateEnd = ''
  amountFrom = ''
  amountTo = ''
  profitFrom = ''
  profitTo = ''
  status = []
  isCalculation = false

  dateRangeType = ''

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "sale_deal",
        properties: [
          "accounting",
          "dealsMethod",
          "selectedCounterparties",
          "search",
          "dateRange",
          "operationDateStart",
          "operationDateEnd",
          "amountFrom",
          "amountTo",
          "profitFrom",
          "profitTo",
          "status",
          "isCalculation",
          'dateRangeType'
        ],
        storage: window.localStorage,
        debugMode: true,
      })
    }
  }

  setState = (fieldName, value) => {
    this[fieldName] = value
  }

  resetFilters = () => {
    this.accounting = 'accrual'
    this.dealsMethod = 'accrual_method'
    this.selectedCounterparties = []
    this.search = ''
    this.dateRange = { start: null, end: null }
    this.operationDateStart = ''
    this.operationDateEnd = ''
    this.amountFrom = ''
    this.amountTo = ''
    this.profitFrom = ''
    this.profitTo = ''
    this.status = []
    this.isCalculation = false
    this.dateRangeType = ''

  }
}

export const sealDeal = new SealDeal()
