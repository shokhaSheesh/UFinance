"use client"

import LocaleSwitcher from "@/components/shared/LocaleSwitcher/LocaleSwitcher"
import { AuthLogo } from "@/constants/icons"
import { useTranslations } from "next-intl"

// Почта поддержки для запросов на разблокировку аккаунта
const SUPPORT_EMAIL = "udevs4help@gmail.com"

const BlockedOverlay = () => {
  const t = useTranslations("AccountBlocked")

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
        </div>
      </div>
    </div>
  )
}

export default BlockedOverlay
