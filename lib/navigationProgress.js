/**
 * Состояние «идёт переход на другую страницу» — общее для всего приложения.
 *
 * App Router не сообщает о начале навигации, поэтому старт отмечаем сами:
 * обёртка над router.push (hooks/useAppRouter) и перехват кликов по ссылкам.
 * Конец — когда поменялся адрес (NavigationProgress следит за pathname).
 */
const listeners = new Set()
let active = false

const emit = () => listeners.forEach((listener) => listener(active))

export const navigationProgress = {
  start() {
    if (active) return
    active = true
    emit()
  },
  done() {
    if (!active) return
    active = false
    emit()
  },
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  isActive: () => active,
}

/** Ведёт ли href на другую страницу (не на текущую и не наружу). */
export const isNavigationTarget = (href) => {
  if (typeof window === 'undefined' || href == null) return false
  try {
    const url = new URL(String(href), window.location.href)
    if (url.origin !== window.location.origin) return false
    return url.pathname !== window.location.pathname || url.search !== window.location.search
  } catch {
    return false
  }
}
