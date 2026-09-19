"use client";

import { cn } from "@/lib/utils";
import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";

/**
 * Плавающая кнопка ИИ-ассистента в правом нижнем углу.
 *
 * Поднята над нижней панелью итогов (OperationsFooter, ~56px) — иначе
 * перекрывала бы суммы на странице операций. Когда панель чата открыта,
 * кнопка прячется: у панели есть собственная кнопка закрытия, а сама
 * кнопка осталась бы висеть поверх затемнения.
 */
const AiChatButton = observer(() => {
  const t = useTranslations("AiChat");

  // Показываем кнопку только если AI-ассистент включён в настройках (get_general_settings)
  if (!appStore.isAiActive) return null;
  if (aiChatStore.isOpen) return null;

  return (
    <button
      type="button"
      onClick={() => aiChatStore.open()}
      aria-label={t("buttonLabel")}
      title={t("buttonLabel")}
      className={cn(
        "fixed bottom-[72px] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full",
        "bg-[#2f6bff] text-white cursor-pointer shadow-[0_4px_14px_rgba(47,107,255,0.4)]",
        "transition-all hover:brightness-110 hover:-translate-y-px",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]"
      )}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      </svg>
    </button>
  );
});

export default AiChatButton;
