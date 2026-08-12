import { makeAutoObservable } from "mobx";

/**
 * Состояние открытия AI-чата (общий тумблер для кнопки в Header и панели).
 * Намеренно НЕ персистится — открытость чата эфемерна.
 */
class AiChatStore {
  isOpen = false;
  // Пользователь что-то отправил в чат → AI мог изменить данные.
  // Флаг снимается при закрытии панели (после обновления данных страницы).
  hasUsed = false;

  constructor() {
    makeAutoObservable(this);
  }

  toggle = () => {
    this.isOpen = !this.isOpen;
  };

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };

  markUsed = () => {
    this.hasUsed = true;
  };

  // Забирает флаг «чат использовали» и сразу сбрасывает его
  consumeUsed = () => {
    const used = this.hasUsed;
    this.hasUsed = false;
    return used;
  };
}

export const aiChatStore = new AiChatStore();
