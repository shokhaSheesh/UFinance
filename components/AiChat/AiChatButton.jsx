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
      className={`flex items-center gap-2 h-9 px-[15px] rounded-[10px] text-[13px] font-semibold cursor-pointer shrink-0 transition-all ${
        active
          ? "bg-white text-[#2f6bff]"
          : "text-white bg-[#2f6bff] shadow-[0_2px_10px_rgba(47,107,255,0.32)] hover:brightness-105 hover:-translate-y-px"
      }`}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      </svg>
      <span className="hidden sm:inline">{t("buttonLabel")}</span>
    </button>
  );
});

export default AiChatButton;
