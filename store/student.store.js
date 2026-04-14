import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../constants/globalCurrency'

class Student {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  selectedLegelEntities = []
  currenyCode = GlobalCurrency.code
  dateRange = { start: null, end: null }

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "student",
        properties: [
          "accounting",
          "dealsMethod",
          "selectedLegelEntities",
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
    this.selectedLegelEntities = []
    this.currenyCode = GlobalCurrency.code
    this.dateRange = { start: null, end: null }
  }
}

export const student = new Student()
