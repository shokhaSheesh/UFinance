import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

class Student {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  selectedLegelEntities = []
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
    this.dateRange = { start: null, end: null }
  }
}

export const student = new Student()
