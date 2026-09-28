'use client'

import { useEffect, useState } from 'react'

/** Ширина, ниже которой показываем мобильные экраны вместо настольных. */
export const MOBILE_BREAKPOINT = 768

/**
 * Телефон это или нет.
 *
 * Возвращает `null`, пока страница не смонтировалась: на сервере ширины окна
 * нет, и если угадать её неверно, React перерисует весь экран после гидрации.
 * Оболочка страниц ждёт `null` и рисует пустой холст — это одна перерисовка
 * вместо мигания настольной вёрсткой на телефоне.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(null)

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isMobile
}
