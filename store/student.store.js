import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import moment from 'moment'

const now = new Date()

export const defaultRangeMonth = {
  start: moment(new Date(now.getFullYear(), now.getMonth(), 1)).format('YYYY-MM-DD'),        // Joriy oyning 1-kuni
  end: moment(new Date(now.getFullYear(), now.getMonth() + 1, 0)).format('YYYY-MM-DD'),    // Joriy oyning oxirgi kuni
}


class Student {
  accounting = 'accrual' // accrual || cash 
  dealsMethod = 'accrual_method'
  selectedCounterParties = []
  selectedCounterPartiesGroups = []
  rangeMonth = defaultRangeMonth
  status = null

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: "student",
        properties: [
          "accounting",
          "dealsMethod",
          "selectedCounterParties",
          "selectedCounterPartiesGroups",
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
    this.selectedCounterPartiesGroups = []
    this.rangeMonth = defaultRangeMonth
  }
  resetMonth = () => {
    this.rangeMonth = defaultRangeMonth
  }
}

export const student = new Student()
