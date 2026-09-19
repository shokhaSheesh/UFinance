'use client'

import { uiStore } from '@/store/ui.store'
import { useEffect } from 'react'

/**
 * Регистрирует открытое модальное окно или выезжающую панель в uiStore.
 *
 * Пока хоть одно окно открыто, плавающая кнопка ИИ убирается с экрана —
 * иначе она перекрывает правый нижний угол формы.
 *
 * @param {boolean} isOpen — открыто ли окно прямо сейчас
 */
export default function useModalPresence(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return
    uiStore.openModal()
    return () => uiStore.closeModal()
  }, [isOpen])
}
