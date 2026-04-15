import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../constants/globalCurrency'

const currentYear = new Date().getFullYear()

class Student {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  selectedCounterParties = []
  currenyCode = GlobalCurrency.code
  dateRange = { start: new Date(currentYear, 0, 1), end: new Date() }

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "student",
        properties: [
          "accounting",
          "dealsMethod",
          "selectedCounterParties",
          "currenyCode",
          "dateRange",
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
    this.selectedCounterParties = []
    this.currenyCode = GlobalCurrency.code
    this.dateRange = { start: new Date(currentYear, 0, 1), end: new Date() }
  }
}

export const student = new Student()
