"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { LOCALES } from "./i18n"
import { useMiniApp } from "./MiniAppProvider"

// Шапка мини-аппа: слева возврат, справа выбор языка и закрытие webview
export default function MiniAppNav({ title, backLabel, backHref }) {
  const router = useRouter()
  const { close, t, locale, setLocale } = useMiniApp()
  const [isLangOpen, setLangOpen] = useState(false)

  const current = LOCALES.find((item) => item.code === locale) || LOCALES[0]

  return (
    <>
      <div className="k-nav">
        <button
          type="button"
          className="k-nav__side k-nav__side--back"
          onClick={() => backHref && router.push(backHref)}
          disabled={!backHref}
        >
          {backHref ? `‹ ${backLabel || t("nav.groups")}` : ""}
        </button>

        <div className="k-nav__title">{title}</div>

        <div className="k-nav__side k-nav__side--right">
          <button
            type="button"
            className="k-nav__lang"
            onClick={() => setLangOpen(true)}
            aria-label={t("nav.language")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
            {current.short}
          </button>

          <button type="button" className="k-nav__close" onClick={close}>
            {t("nav.close")}
          </button>
        </div>
      </div>

      {/* Выбор языка — той же шторкой, что и причина отсутствия */}
      <div
        className={`k-scrim ${isLangOpen ? "k-scrim--on" : ""}`}
        onClick={() => setLangOpen(false)}
      />

      <div className={`k-sheet ${isLangOpen ? "k-sheet--on" : ""}`}>
        <div className="k-sheet__grab" />
        <div className="k-sheet__h">{t("nav.language")}</div>

        {LOCALES.map((item) => (
          <button
            key={item.code}
            type="button"
            className="k-sheet__opt"
            onClick={() => {
              setLocale(item.code)
              setLangOpen(false)
            }}
          >
            <span className="k-sheet__ic k-sheet__ic--code k-pill--wait">{item.short}</span>
            {item.label}
            {item.code === locale && <span className="k-sheet__check">✓</span>}
          </button>
        ))}
      </div>
    </>
  )
}
