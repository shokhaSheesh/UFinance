"use client"

import { useRouter } from "next/navigation"
import { useMiniApp } from "./MiniAppProvider"

// Шапка мини-аппа: слева возврат, справа закрытие webview телеграмом
export default function MiniAppNav({ title, backLabel, backHref }) {
  const router = useRouter()
  const { close } = useMiniApp()

  return (
    <div className="k-nav">
      <button
        type="button"
        className="k-nav__side k-nav__side--back"
        onClick={() => backHref && router.push(backHref)}
        disabled={!backHref}
      >
        {backHref ? `‹ ${backLabel || "Назад"}` : ""}
      </button>

      <div className="k-nav__title">{title}</div>

      <button type="button" className="k-nav__side k-nav__side--close" onClick={close}>
        Закрыть
      </button>
    </div>
  )
}
