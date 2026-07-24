import { makeAutoObservable } from "mobx";

/**
 * Состояние открытия AI-чата (общий тумблер для кнопки в Header и панели).
 * Намеренно НЕ персистится — открытость чата эфемерна.
 */
class AiChatStore {
  isOpen = false;

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
}

export const aiChatStore = new AiChatStore();
