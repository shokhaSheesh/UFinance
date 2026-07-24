"use client";

import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";

const AiChatButton = observer(() => {
  const t = useTranslations("AiChat");
  const active = aiChatStore.isOpen;

  // Показываем кнопку только если AI-ассистент включён в настройках (get_general_settings)
  if (!appStore.isAiActive) return null;

  return (
    <button
      type="button"
      onClick={() => aiChatStore.toggle()}
      aria-pressed={active}
      title={t("buttonLabel")}
      className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold cursor-pointer shrink-0 transition-all ${
        active
          ? "bg-white text-[#2f6bff]"
          : "text-white bg-linear-to-br from-[#2f6bff] to-[#7a5cff] shadow-[0_2px_10px_rgba(47,107,255,0.35)] hover:brightness-110"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
      <span className="hidden sm:inline">{t("buttonLabel")}</span>
    </button>
  );
});

export default AiChatButton;
