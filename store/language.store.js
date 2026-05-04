import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

class LanguageStore {
  currentLanguage = 'ru'

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: 'plan_fact_language',
        properties: ['currentLanguage'],
        storage: window.localStorage,
      })
    }
  }

  setLanguage(lang) {
    this.currentLanguage = lang
  }

  toggle() {
    this.currentLanguage = this.currentLanguage === 'ru' ? 'uz' : 'ru'
  }
}

export const languageStore = new LanguageStore()
