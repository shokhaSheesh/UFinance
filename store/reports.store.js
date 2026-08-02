import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

class ReportsStore {
  selectedPeriod = 'all'
  selectedEntity = 'all'
  selectedAccounts = [] 
  selectedCounterparties = [] 
  dateRange = null
  selectedGrouping = 'monthly'
  isCalculation = true
  profitTypes = {
    operational: true,
    ebitda: true,
    ebit: true,
    ebt: true
  }

  constructor() {
    makeAutoObservable(this)

    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 6)
    this.dateRange = { start, end }

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "reports_pnl",
        properties: [
          "selectedPeriod", 
          "selectedEntity", 
          "selectedAccounts", 
          "selectedCounterparties", 
          "selectedGrouping", 
          "isCalculation", 
          "profitTypes"
        ],
        storage: window.localStorage,
        debugMode: false,
      })
    }
  }

  setFilter = (fieldName, value) => {
    this[fieldName] = value
  }

  toggleProfitType = (type) => {
    this.profitTypes[type] = !this.profitTypes[type]
  }

  resetFilters = () => {
    this.selectedPeriod = 'all'
    this.selectedEntity = 'all'
    this.selectedAccounts = [] 
    this.selectedCounterparties = [] 
    
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 6)
    this.dateRange = { start, end }
    
    this.selectedGrouping = 'monthly'
    this.isCalculation = true
  }
}

export const reportsStore = new ReportsStore()
