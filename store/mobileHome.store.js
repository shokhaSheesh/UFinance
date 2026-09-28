import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

/**
 * Состав главной мобильного приложения.
 *
 * Что нужно на главной, зависит от роли: собственнику важны долги и прибыль,
 * бухгалтеру — счета и последние операции. Поэтому набор блоков и их порядок
 * пользователь настраивает сам, а выбор хранится на устройстве.
 */

/** Порядок по умолчанию: деньги → что происходит → итоги периода → долги. */
export const HOME_SECTIONS = ['accounts', 'recent', 'period', 'settlements']

class MobileHomeStore {
  /** Ключи блоков в том порядке, в каком они показаны. */
  order = [...HOME_SECTIONS]
  /** Скрытые блоки: по умолчанию показываем все. */
  hidden = []

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: 'plan_fact_mobile_home',
        properties: ['order', 'hidden'],
        storage: window.localStorage,
      })
    }
  }

  /** Блоки в нужном порядке; новые блоки приложения добавляются в конец. */
  get sections() {
    const known = this.order.filter((key) => HOME_SECTIONS.includes(key))
    const added = HOME_SECTIONS.filter((key) => !known.includes(key))
    return [...known, ...added]
  }

  isVisible(key) {
    return !this.hidden.includes(key)
  }

  get visibleSections() {
    return this.sections.filter((key) => this.isVisible(key))
  }

  toggle(key) {
    this.hidden = this.isVisible(key) ? [...this.hidden, key] : this.hidden.filter((item) => item !== key)
  }

  /** Сдвинуть блок на одну позицию вверх или вниз. */
  move(key, direction) {
    const list = [...this.sections]
    const index = list.indexOf(key)
    const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return
    list.splice(index, 1)
    list.splice(target, 0, key)
    this.order = list
  }

  reset() {
    this.order = [...HOME_SECTIONS]
    this.hidden = []
  }
}

export const mobileHomeStore = new MobileHomeStore()
