"use client";

import useMounted from "@/hooks/useMounted";
import { useAiChat, sanitizeAiHtml } from "@/hooks/useAiChat";
import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import styles from "./aiChat.module.scss";

const SparkIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 17l-8.5-8.5-5 5L2 7" />
    <path d="M16 17h6v-6" />
  </svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-2" />
    <path d="M18 12a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
);
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

const SUGGESTIONS = [
  { key: "suggest1", Icon: TrendDownIcon },
  { key: "suggest2", Icon: WalletIcon },
  { key: "suggest3", Icon: TrendUpIcon },
];

// Изменение ширины панели перетаскиванием
const MIN_W = 340;
const MAX_W = 860;
const DEFAULT_W = 424;
const WIDTH_KEY = "aiChatWidth";
const clampWidth = (w) => {
  if (typeof window === "undefined") return w;
  return Math.max(
    Math.min(MIN_W, window.innerWidth),
    Math.min(w, Math.min(MAX_W, window.innerWidth))
  );
};

const AiChatPanel = observer(() => {
  const t = useTranslations("AiChat");
  const mounted = useMounted();
  const isOpen = aiChatStore.isOpen;

  const { messages, streamingText, isAwaiting, connected, historyLoading, send } =
    useAiChat(isOpen);

  const [draft, setDraft] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_W);
  const [resizing, setResizing] = useState(false);
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);
  const widthRef = useRef(DEFAULT_W);

  // восстанавливаем сохранённую ширину
  useEffect(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved) {
      const w = clampWidth(saved);
      widthRef.current = w;
      setPanelWidth(w);
    }
  }, []);

  // перетаскивание левого края → изменение ширины (панель прижата вправо)
  const startResize = (e) => {
    e.preventDefault();
    setResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    const onMove = (ev) => {
      const w = clampWidth(window.innerWidth - ev.clientX);
      widthRef.current = w;
      setPanelWidth(w);
    };
    const onUp = () => {
      setResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        localStorage.setItem(WIDTH_KEY, String(Math.round(widthRef.current)));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // автоскролл вниз при новых сообщениях / стриме
  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, streamingText, isAwaiting, isOpen]);

  // фокус на поле при открытии
  useEffect(() => {
    if (isOpen && mounted) {
      const id = setTimeout(() => textareaRef.current?.focus(), 320);
      return () => clearTimeout(id);
    }
  }, [isOpen, mounted]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
    setShowSuggestions(false);
  };

  const pickSuggestion = (text) => {
    send(text);
    setShowSuggestions(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // клики по кнопкам data-prompt внутри ответа AI → новый вопрос
  const onBodyClick = (e) => {
    if (showSuggestions) setShowSuggestions(false);
    const btn = e.target.closest?.("button[data-prompt]");
    const prompt = btn?.dataset?.prompt;
    if (prompt) send(prompt);
  };

  const showGreeting = !historyLoading && messages.length === 0 && !streamingText && !isAwaiting;

  // AI-ассистент включается флагом ia_active из get_general_settings
  if (!appStore.isAiActive) return null;

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
        onClick={() => aiChatStore.close()}
      />
      <aside
        className={`${styles.panel} ${isOpen ? "" : styles.closed} ${resizing ? styles.resizing : ""}`}
        style={{ width: panelWidth }}
        aria-hidden={!isOpen}
      >
        {/* Ручка изменения ширины (левый край, по центру) */}
        <div
          className={styles.resizeHandle}
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-label={t("resizeHint")}
        />

        {/* Header */}
        <div className={styles.head}>
          <div className={styles.avatar}>
            <SparkIcon />
          </div>
          <div>
            <div className={styles.title}>
              {t("title")}
              <span className={`${styles.dot} ${connected ? "" : styles.off}`} />
            </div>
            <div className={styles.sub}>{t("subtitle")}</div>
          </div>
          <button
            className={styles.close}
            onClick={() => aiChatStore.close()}
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body} ref={bodyRef} onClick={onBodyClick}>
          <div className={styles.daySep}>{t("today")}</div>

          {showGreeting && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble}>{t("greeting")}</div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div className={`${styles.msg} ${styles.me}`} key={m.id}>
                <div className={styles.bubble}>{m.content}</div>
              </div>
            ) : (
              <div className={styles.msg} key={m.id}>
                <div className={styles.ava}>
                  <SparkIcon />
                </div>
                {m.isHtml ? (
                  <div
                    className={styles.bubble}
                    dangerouslySetInnerHTML={{ __html: sanitizeAiHtml(m.content) }}
                  />
                ) : (
                  <div className={styles.bubble}>{m.content}</div>
                )}
              </div>
            )
          )}

          {/* живой стрим — рендерим как HTML (DOMPurify корректно закрывает незавершённые теги) */}
          {streamingText !== null && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble}>
                <span
                  dangerouslySetInnerHTML={{ __html: sanitizeAiHtml(streamingText) }}
                />
                <span className={styles.cursor} />
              </div>
            </div>
          )}

          {/* ждём первый токен */}
          {isAwaiting && streamingText === null && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble} style={{ padding: "4px 6px" }}>
                <div className={styles.typing}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className={styles.composer}>
          {/* всплывающие подсказки — по кнопке «+» */}
          {showSuggestions && (
            <div className={styles.suggestPop}>
              <div className={styles.suggestHead}>{t("suggestTitle")}</div>
              {SUGGESTIONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={styles.suggestItem}
                  onClick={() => pickSuggestion(t(key))}
                >
                  <span className={styles.suggestIco}>
                    <Icon />
                  </span>
                  {t(key)}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inp}>
            <button
              type="button"
              className={`${styles.plus} ${showSuggestions ? styles.plusOn : ""}`}
              onClick={() => setShowSuggestions((v) => !v)}
              aria-label={t("suggestTitle")}
              aria-expanded={showSuggestions}
            >
              <PlusIcon />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={t("placeholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => showSuggestions && setShowSuggestions(false)}
            />
            <button
              className={styles.send}
              onClick={submit}
              disabled={!draft.trim()}
              aria-label={t("send")}
            >
              <SendIcon />
            </button>
          </div>
          <div className={styles.footNote}>{t("footNote")}</div>
        </div>
      </aside>
    </>
  );
});

export default AiChatPanel;
