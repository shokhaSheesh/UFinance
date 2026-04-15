import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'


class Student {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  selectedCounterParties = []
  rangeMonth = [{ year: new Date().getFullYear(), month: 1 }, { year: new Date().getFullYear(), month: new Date().getMonth() }]

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "student",
        properties: [
          "accounting",
          "dealsMethod",
          "selectedCounterParties",
          "rangeMonth",
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
    this.rangeMonth = [{ year: new Date().getFullYear(), month: 1 }, { year: new Date().getFullYear(), month: new Date().getMonth() }]
  }
}

export const student = new Student()
