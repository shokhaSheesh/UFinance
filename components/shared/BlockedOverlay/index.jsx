"use client"

import LocaleSwitcher from "@/components/shared/LocaleSwitcher/LocaleSwitcher"
import { AuthLogo } from "@/constants/icons"
import { authStore } from "@/store/auth.store"
import { clearAllSiteData, clearWebStorageSync } from "@/utils/clearSiteData"
import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"

// Почта поддержки для запросов на разблокировку аккаунта
const SUPPORT_EMAIL = "udevs4help@gmail.com"

const BlockedOverlay = () => {
  const t = useTranslations("AccountBlocked")
  const tProfile = useTranslations("Header.profile")

  const handleLogout = () => {
    // Тот же паттерн, что в Header/profile: синхронный сброс стора и
    // storage, чтобы кнопка сработала сразу, остальная очистка — в фоне
    authStore.logout()
    clearWebStorageSync()

    let left = false
    const leave = () => {
      if (left) return
      left = true
      window.location.replace("/auth")
    }
    const guard = setTimeout(leave, 700)
    clearAllSiteData()
      .catch(() => {})
      .finally(() => {
        clearTimeout(guard)
        leave()
      })
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col w-full h-full bg-linear-to-br from-[#456fad] to-[#022565] items-center justify-center">
      <div className="absolute top-10 left-10">
        <AuthLogo color="#ffffff" width="114" height="27" />
      </div>
      <div className="absolute top-10 right-10">
        <LocaleSwitcher />
      </div>

      <div className="w-[500px] max-w-[calc(100vw-2rem)] p-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-center">
            <AuthLogo color="#000000" width="150" height="36" />
          </div>

          <h1 className="text-2xl font-bold text-black mb-3">{t("title")}</h1>

          <p className="text-[15px] leading-relaxed text-neutral-600">
            {t("description")}
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 flex items-center justify-center rounded-xl border border-gray-ucode-200 bg-gray-ucode-25 px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-gray-100"
          >
            {SUPPORT_EMAIL}
          </a>

          <p className="mt-4 text-[13px] leading-relaxed text-neutral-400">
            {t("note")}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-transparent px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 cursor-pointer"
          >
            <LogOut size={18} className="shrink-0" />
            <span>{tProfile("logout")}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlockedOverlay
