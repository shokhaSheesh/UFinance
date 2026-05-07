import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'

const currentYear = new Date().getFullYear()

const getDefaultDateRange = () => {
  return { start: new Date(currentYear, 0, 1), end: new Date() }
}

class PaymentCalendarStore {
  dateRange = getDefaultDateRange()
  selectedGrouping = 'monthly'
  isCalculation = 'cash'
  ebitda = false
  ebit = false
  ebt = false
  operational = false
  deals = []
  selectedAccounts = []
  selectedLegalEntities = []
  selectedCounterparties = []
  defaultDate = { start: new Date(currentYear, 0, 1), end: new Date() }
  selectedCurrency = GlobalCurrency.code || 'UZS'

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: 'payment_calendar_store_v1',
        properties: [
          'dateRange',
          'selectedGrouping',
          'isCalculation',
          'ebitda',
          'ebit',
          'ebt',
          'operational',
          'deals',
          'selectedAccounts',
          'selectedLegalEntities',
          'selectedCounterparties',
          'selectedCurrency',
        ],
        storage: window.localStorage,
        debugMode: true,
      })
    }
  }

  setDateRange(val) {
    if (!val?.start || !val?.end) {
      this.dateRange = { start: new Date(currentYear, 0, 1), end: new Date() }
    } else {
      this.dateRange = { start: val.start, end: val.end }
    }
  }

  setSelectedGrouping(val) {
    this.selectedGrouping = val
  }

  setIsCalculation(val) {
    this.isCalculation = val
  }

  setSelectedCurrency(val) {
    this.selectedCurrency = val
  }

  setSelectedAccounts(val) {
    this.selectedAccounts = val
  }

  setSelectedLegalEntities(val) {
    this.selectedLegalEntities = val
  }

  setSelectedCounterparties(val) {
    this.selectedCounterparties = val
  }

  setDeals(val) {
    this.deals = val
  }

  setOperational(val) {
    this.operational = val
  }

  setEbitDa(val) {
    this.ebitda = val
  }

  setEbit(val) {
    this.ebit = val
  }

  setEbt(val) {
    this.ebt = val
  }

  resetToToday() {
    this.dateRange = getDefaultDateRange()
  }
}

export const paymentCalendarStore = new PaymentCalendarStore()
