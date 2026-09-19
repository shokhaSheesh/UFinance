import { makeAutoObservable } from 'mobx'

/**
 * Сколько модальных окон и выезжающих панелей сейчас открыто.
 *
 * Нужен, чтобы плавающая кнопка ИИ пряталась, пока пользователь заполняет
 * форму: она висит в правом нижнем углу и перекрывает панель создания
 * операции. Полагаться на z-index тут нельзя — панели живут в разных местах
 * дерева, и порядок наложения у них свой.
 *
 * Намеренно НЕ персистится: открытость окна живёт ровно одну сессию.
 */
class UiStore {
  modalCount = 0

  constructor() {
    makeAutoObservable(this)
  }

  get isModalOpen() {
    return this.modalCount > 0
  }

  openModal = () => {
    this.modalCount += 1
  }

  closeModal = () => {
    this.modalCount = Math.max(0, this.modalCount - 1)
  }
}

export const uiStore = new UiStore()
