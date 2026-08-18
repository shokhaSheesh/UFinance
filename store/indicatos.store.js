import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../constants/globalCurrency'

const defaultDateRange = {
  start: new Date(new Date().getFullYear(), 0, 1),
  end: new Date(new Date().getFullYear(), 11, 31),
}

class Indicators {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  periodType = 'monthly'
  deals = []
  accounts = []
  projects = []
  rangeMonth = defaultDateRange
  currencyCode = GlobalCurrency?.code

  // Profit filters
  method = 'cash' // 'accrual'

  // profitable clients
  profitableclientsMethod = 'accrual'
  paymentStructureMethod = 'income_expenses' // receipts_payments | income_expenses

  // Долги (дебиторка/кредиторка с поставщиками)
  debtsSort = 'total' // total | expired
  debtsLegalEntities = []
  debtsShowValues = true // подписи сумм на графиках
  debtsRounding = 'none' // 'none' | '3' | '6' | '9' — на сколько знаков округлять

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "indicators",
        properties: [
          "accounting",
          "dealsMethod",
          "periodType",
          "deals",
          'accounts',
          "projects",
          "rangeMonth",
          "paymentStructureMethod",
          "profitableclientsMethod",
          // debtsSort намеренно не персистим: у тех, кто уже пользовался блоком,
          // в localStorage лежит прежний дефолт 'expired' и «Общая» бы не включилась
          "debtsLegalEntities",
          "debtsShowValues",
          "debtsRounding"
        ],
        storage: window.localStorage,
        debugMode: false,
      })
    }
  }

  setState = (fieldName, value) => {
    this[fieldName] = value
  }

  resetFilters = () => {
    this.accounting = 'accrual'
    this.dealsMethod = 'accrual_method'
    this.periodType = 'monthly'
    this.deals = []
    this.accounts = []
    this.projects = []
    this.rangeMonth = defaultDateRange
    this.debtsLegalEntities = []
    this.debtsSort = 'total'
  }
  resetMonth = () => {
    this.rangeMonth = defaultDateRange
  }
}

export const indicators = new Indicators()
