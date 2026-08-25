"use client"

import { kindergartenStore } from "@/store/kindergarten.store"
import { useParams } from "next/navigation"
import Script from "next/script"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

const MiniAppContext = createContext(null)

export const useMiniApp = () => useContext(MiniAppContext) || {}

const getWebApp = () =>
  typeof window !== "undefined" ? window.Telegram?.WebApp || null : null

const getTheme = () => (getWebApp()?.colorScheme === "dark" ? "dark" : "light")
// Вне телеграма и на сервере остаёмся в светлой теме
const getServerTheme = () => "light"

// Оборачивает весь раздел детского сада: подключает telegram-web-app.js,
// подхватывает тему бота и даёт общий toast. Вне телеграма всё работает
// так же, просто со светлой темой.
export default function MiniAppProvider({ children }) {
  // Скрипт телеграма грузится асинхронно — по его onLoad переподписываемся
  const [scriptTick, setScriptTick] = useState(0)
  const [toast, setToast] = useState("")
  const toastTimer = useRef(null)

  // chatId приходит из адреса (/:chatId/attendance) — бот подставляет его сам.
  // Держим его в каждой ссылке, чтобы перезагрузка webview не теряла контекст
  const params = useParams()
  const chatId = params?.chatId ? String(params.chatId) : null

  useEffect(() => {
    kindergartenStore.setChatId(chatId)
  }, [chatId])

  const link = useCallback(
    (path = "") => `/${chatId}/attendance${path}`,
    [chatId]
  )

  const subscribeTheme = useCallback(
    (onChange) => {
      const app = getWebApp()
      app?.onEvent?.("themeChanged", onChange)
      return () => app?.offEvent?.("themeChanged", onChange)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scriptTick]
  )

  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme)

  // Разворачиваем webview на всю высоту — телеграм открывает его наполовину
  useEffect(() => {
    const app = getWebApp()
    app?.ready?.()
    app?.expand?.()
  }, [scriptTick])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 2400)
  }, [])

  const close = useCallback(() => {
    const app = getWebApp()
    if (app?.close) app.close()
    else showToast("Закрыть можно из телеграма")
  }, [showToast])

  const haptic = useCallback(
    (type = "light") => getWebApp()?.HapticFeedback?.impactOccurred?.(type),
    []
  )

  const value = useMemo(
    () => ({ theme, showToast, close, haptic, chatId, link }),
    [theme, showToast, close, haptic, chatId, link]
  )

  return (
    <MiniAppContext.Provider value={value}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => setScriptTick((tick) => tick + 1)}
      />
      <div className="k-app" data-theme={theme}>
        <div className="k-frame">{children}</div>
        <div className={`k-toast ${toast ? "k-toast--on" : ""}`}>{toast}</div>
      </div>
    </MiniAppContext.Provider>
  )
}
