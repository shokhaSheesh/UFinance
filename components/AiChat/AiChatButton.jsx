"use client";

import { cn } from "@/lib/utils";
import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { uiStore } from "@/store/ui.store";
import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const HINT_DISMISSED_KEY = "aiChatHintDismissed";

/**
 * Плавающая кнопка ИИ-ассистента в правом нижнем углу.
 *
 * Поднята над нижней панелью итогов (OperationsFooter, ~56px) — иначе
 * перекрывала бы суммы на странице операций. Когда панель чата открыта,
 * кнопка прячется: у панели есть собственная кнопка закрытия, а сама
 * кнопка осталась бы висеть поверх затемнения.
 *
 * Рядом показывается подсказка: иконка сама по себе не объясняет, что за
 * ней. Насовсем её убирает только крестик (флаг в localStorage) — открытие
 * чата подсказку лишь прячет. Иначе первый же клик по кнопке, ещё до того
 * как подсказку прочитали, убирал бы её навсегда.
 */
const AiChatButton = observer(() => {
  const t = useTranslations("AiChat");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_DISMISSED_KEY)) return;
    } catch {
      // приватный режим / запрещённое хранилище — подсказку просто не показываем
      return;
    }
    // Небольшая задержка: подсказка не должна выпрыгивать одновременно
    // с загрузкой страницы
    const timer = setTimeout(() => setShowHint(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Крестик — «больше не показывать»
  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      // не критично: подсказка просто появится в следующий раз
    }
  };

  // Открытие чата подсказку только убирает с экрана
  const handleOpen = () => {
    setShowHint(false);
    aiChatStore.open();
  };

  // Показываем кнопку только если AI-ассистент включён в настройках (get_general_settings)
  if (!appStore.isAiActive) return null;
  if (aiChatStore.isOpen) return null;
  // Пока открыта модалка или выезжающая панель, кнопка перекрывала бы форму
  if (uiStore.isModalOpen) return null;

  return (
    <div className="fixed bottom-[72px] right-6 z-50 flex items-center gap-2">
      {showHint && (
        <div
          role="status"
          className="flex max-w-[260px] items-start gap-2 rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <p className="text-xs leading-snug text-slate-700">{t("hint")}</p>
          <button
            type="button"
            onClick={dismissHint}
            aria-label={t("hintDismiss")}
            className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 cursor-pointer transition-colors hover:bg-gray-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2f6bff]"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("buttonLabel")}
        title={t("buttonLabel")}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          "bg-[#2f6bff] text-white cursor-pointer shadow-[0_4px_14px_rgba(47,107,255,0.4)]",
          "transition-all hover:brightness-110 hover:-translate-y-px",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]"
        )}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
        </svg>
      </button>
    </div>
  );
});

export default AiChatButton;
