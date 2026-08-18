"use client";

import useMounted from "@/hooks/useMounted";
import {
  useAiChat,
  useAiChatList,
  decorateAiHtml,
  sanitizeAiHtml,
} from "@/hooks/useAiChat";
import {
  AI_CHAT_MAX_FILES,
  AI_CHAT_MAX_FILE_SIZE,
  uploadAiChatFile,
} from "@/lib/api/ucode/aiChat";
import { showErrorNotification } from "@/lib/utils/notifications";
import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import styles from "./aiChat.module.scss";

// ─── Иконки (из макета uf_ai_chat_13.html) ──────────────────────────────
const StarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ClipIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21 11.5l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a1.5 1.5 0 01-2-2l8-8" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const NewChatIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 12a8 8 0 01-11.5 7.2L4 20.5l1.3-4.4A8 8 0 1120 12z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ─── Группировка чатов по давности (как в макете) ───────────────────────
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const chatGroupKey = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || Number.isNaN(d.getTime())) return "earlier";
  const days = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days <= 0) return "today";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  return "earlier";
};

const GROUP_ORDER = ["today", "week", "month", "earlier"];

const groupChats = (chats) => {
  const buckets = new Map(GROUP_ORDER.map((k) => [k, []]));
  chats.forEach((c) => buckets.get(chatGroupKey(c.date)).push(c));
  return GROUP_ORDER.filter((k) => buckets.get(k).length).map((k) => ({
    key: k,
    items: buckets.get(k),
  }));
};

// ─── Файлы ──────────────────────────────────────────────────────────────
const EXT_CLASS = {
  xls: "xls",
  xlsx: "xls",
  pdf: "pdf",
  csv: "csv",
  doc: "doc",
  docx: "doc",
  png: "img",
  jpg: "img",
  jpeg: "img",
  webp: "img",
  gif: "img",
};

const fileExt = (name) => {
  const clean = String(name || "").split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot > -1 ? clean.slice(dot + 1).toLowerCase() : "";
};

// Карточка файла — как в макете: цветная иконка типа, имя, кнопка скачивания
const FileCard = ({ file, note, downloadLabel }) => {
  const ext = fileExt(file.name || file.url);
  const kind = EXT_CLASS[ext] || "";
  return (
    <div className={styles.fileCard}>
      <div className={`${styles.fileIc} ${kind ? styles[kind] : ""}`}>
        {(ext || "file").slice(0, 4).toUpperCase()}
      </div>
      <div className={styles.fileMeta}>
        <div className={styles.fileName} title={file.name}>
          {file.name}
        </div>
        {note && <div className={styles.fileSub}>{note}</div>}
      </div>
      <a
        className={`${styles.fileDl} ${styles.tip}`}
        data-tip={downloadLabel}
        href={file.url}
        target="_blank"
        rel="noreferrer"
        aria-label={downloadLabel}
      >
        <DownloadIcon />
      </a>
    </div>
  );
};

// ссылка на файл внутри текста сообщения
const InlineFile = ({ file }) => (
  <a
    href={file.url}
    target="_blank"
    rel="noreferrer"
    className={styles.inlineFile}
    title={file.name}
    onClick={(e) => e.stopPropagation()}
  >
    <ClipIcon />
    <span>{file.name}</span>
  </a>
);

// Markdown-ссылка [label](http-url) — так хранятся файлы в истории.
// Разрешаем только http/https, чтобы не отрендерить опасный href.
const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const mdLinkRe = () => new RegExp(MD_LINK.source, "g");

// Все ссылки текста + текст без них (если пусто — сообщение состоит только из файлов)
const extractLinks = (text) => {
  const s = String(text || "");
  const links = [];
  let m;
  const re = mdLinkRe();
  while ((m = re.exec(s)) !== null) links.push({ name: m[1], url: m[2] });
  return { links, stripped: s.replace(mdLinkRe(), "").trim() };
};

// Рендерит текст, превращая markdown-ссылки на файлы в кликабельные ссылки.
const renderTextWithLinks = (text, keyBase) => {
  const s = String(text || "");
  const nodes = [];
  const re = mdLinkRe();
  let last = 0;
  let k = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last)
      nodes.push(<span key={`${keyBase}-t${k}`}>{s.slice(last, m.index)}</span>);
    nodes.push(
      <InlineFile key={`${keyBase}-l${k}`} file={{ name: m[1], url: m[2] }} />
    );
    last = m.index + m[0].length;
    k += 1;
  }
  if (last < s.length)
    nodes.push(<span key={`${keyBase}-t${k}`}>{s.slice(last)}</span>);
  return nodes;
};

// Текст сообщения пользователя. Файлы теперь уходят отдельным полем, но в
// старых сообщениях ссылки лежат прямо в тексте — их оставляем кликабельными.
const UserText = ({ content }) => <>{renderTextWithLinks(content, "u")}</>;

// ─── Кнопки под сообщением (копировать / изменить) ───────────────────────
const MsgActions = ({ getText, onEdit, t }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className={styles.acts}>
      {onEdit && (
        <button
          type="button"
          className={`${styles.act} ${styles.tip}`}
          data-tip={t("edit")}
          onClick={onEdit}
          aria-label={t("edit")}
        >
          <EditIcon />
        </button>
      )}
      <button
        type="button"
        className={`${styles.act} ${styles.tip} ${copied ? styles.done : ""}`}
        data-tip={copied ? t("copied") : t("copy")}
        onClick={copy}
        aria-label={t("copy")}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
};

// html ответа AI → безопасная разметка с оформлением таблиц и чисел
const renderAiHtml = (html) => decorateAiHtml(sanitizeAiHtml(html));

// html ответа AI → простой текст (для копирования)
const htmlToText = (html) => {
  if (typeof window === "undefined") return String(html || "");
  const doc = new DOMParser().parseFromString(sanitizeAiHtml(html), "text/html");
  return (doc.body.textContent || "").trim();
};

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
  const queryClient = useQueryClient();
  const isOpen = aiChatStore.isOpen;

  const {
    messages,
    streamingText,
    isAwaiting,
    connected,
    historyLoading,
    hasMore,
    loadingMore,
    loadMore,
    send,
    edit,
    suggestions,
    activeChatId,
    switchingChat,
    selectChat,
    newChat,
    resetChat,
  } = useAiChat(isOpen);

  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    chats,
    total: chatsTotal,
    loading: chatsLoading,
    hasMore: chatsHasMore,
    loadMore: loadMoreChats,
    remove: removeChat,
  } = useAiChatList(isOpen && historyOpen);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [draft, setDraft] = useState(""); // текст в поле ввода
  const [attachments, setAttachments] = useState([]); // вложения текущего сообщения
  const [editing, setEditing] = useState(null); // { messageId } — правка отправленного сообщения
  const [panelWidth, setPanelWidth] = useState(DEFAULT_W);
  const [resizing, setResizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);
  const editorRef = useRef(null); // textarea композера
  const widthRef = useRef(DEFAULT_W);
  const fileInputRef = useRef(null);
  const prependingRef = useRef(false); // идёт подгрузка старых — сохраняем позицию скролла
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false); // панель была открыта — чтобы поймать момент закрытия

  // Закрыли чат после того, как им пользовались → AI мог изменить данные,
  // поэтому перезапрашиваем все активные запросы текущей страницы.
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    setHistoryOpen(false);
    if (!aiChatStore.consumeUsed()) return;
    queryClient.invalidateQueries();
  }, [isOpen, queryClient]);

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

  // автоскролл вниз при новых сообщениях / стриме;
  // при подгрузке старых (prepend) — держим текущую позицию, а не прыгаем вниз
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (prependingRef.current) {
      el.scrollTop =
        prevScrollTopRef.current + (el.scrollHeight - prevScrollHeightRef.current);
      prependingRef.current = false;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, isAwaiting, isOpen]);

  // скролл вверх → подгрузка старых сообщений
  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop <= 48) {
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
      prependingRef.current = true;
      loadMore();
    }
  };

  // фокус на поле при открытии
  useEffect(() => {
    if (isOpen && mounted) {
      const id = setTimeout(() => editorRef.current?.focus(), 320);
      return () => clearTimeout(id);
    }
  }, [isOpen, mounted]);

  // ─── Композер ───────────────────────────────────────────────────────

  // textarea растёт под текст до максимума из стилей
  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const onDraftChange = (e) => {
    setDraft(e.target.value);
    autoGrow(e.target);
  };

  const clearComposer = () => {
    setDraft("");
    setAttachments([]);
    setEditing(null);
    if (editorRef.current) editorRef.current.style.height = "auto";
  };

  const submit = () => {
    const content = draft.trim();
    if (!content && attachments.length === 0) return;
    // правка отправленного сообщения → ai_chat_edit_message, иначе обычная отправка
    if (editing?.messageId) edit(editing.messageId, content, attachments);
    else send(content, attachments);
    clearComposer();
  };

  // «Изменить» под своим сообщением: текст и файлы возвращаются в композер.
  // Если у сообщения есть guid из истории — уходит правка, иначе отправим заново.
  const startEdit = (m) => {
    setDraft(m.content || "");
    setAttachments(Array.isArray(m.files) ? m.files : []);
    setEditing(m.messageId ? { messageId: m.messageId } : null);
    setTimeout(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      autoGrow(el);
    }, 0);
  };

  const removeAttachment = (url) =>
    setAttachments((prev) => prev.filter((f) => f.url !== url));

  // загрузка файлов → ссылки на CDN, вложения уходят отдельным полем files
  const handleFilesSelected = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // чтобы можно было выбрать тот же файл повторно
    if (!picked.length) return;

    const slots = AI_CHAT_MAX_FILES - attachments.length;
    if (slots <= 0) {
      showErrorNotification(t("filesMax", { max: AI_CHAT_MAX_FILES }));
      return;
    }
    if (picked.some((f) => f.size > AI_CHAT_MAX_FILE_SIZE)) {
      showErrorNotification(t("fileTooBig"));
    }
    const valid = picked
      .filter((f) => f.size <= AI_CHAT_MAX_FILE_SIZE)
      .slice(0, slots);
    if (!valid.length) return;

    setUploading(true);
    try {
      const done = [];
      for (const f of valid) {
        try {
          done.push(await uploadAiChatFile(f));
        } catch {
          showErrorNotification(t("fileUploadError"));
        }
      }
      if (done.length) setAttachments((prev) => [...prev, ...done]);
    } finally {
      setUploading(false);
    }
  };

  const focusEditor = () => setTimeout(() => editorRef.current?.focus(), 60);

  const handleNewChat = async () => {
    setHistoryOpen(false);
    clearComposer();
    await newChat();
    focusEditor();
  };

  const handleSelectChat = async (chatId) => {
    setHistoryOpen(false);
    clearComposer();
    await selectChat(chatId);
    focusEditor();
  };

  const handleDeleteChat = async (chatId) => {
    setConfirmDeleteId(null);
    const ok = await removeChat(chatId);
    // удалили открытый чат — переписку сбрасываем, новый заведётся при отправке
    if (ok && chatId === activeChatId) resetChat();
  };

  // подгрузка следующей страницы списка чатов при скролле вниз
  const onHistoryScroll = (e) => {
    if (!chatsHasMore || chatsLoading) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMoreChats();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && editing) {
      e.preventDefault();
      clearComposer();
    }
  };

  // клики по кнопкам data-prompt внутри ответа AI → новый вопрос
  const onBodyClick = (e) => {
    const btn = e.target.closest?.("button[data-prompt]");
    const prompt = btn?.dataset?.prompt;
    if (prompt) send(prompt);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      if (historyOpen) {
        setHistoryOpen(false);
        return;
      }
      // Esc в режиме правки отменяет её — этим занимается сам композер
      if (editing) return;
      aiChatStore.close();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, historyOpen, editing]);

  const showGreeting =
    !historyLoading &&
    !switchingChat &&
    messages.length === 0 &&
    !streamingText &&
    !isAwaiting;

  // Быстрые ответы — только то, что прислал AI с последним сообщением
  const quickReplies = suggestions;
  const quickVisible =
    quickReplies.length > 0 && !isAwaiting && streamingText === null;

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
          <div className={styles.brand}>
            <StarIcon />
          </div>
          <div className={styles.headText}>
            <div className={styles.title}>
              {t("titleFirst")}{" "}
              <span className={styles.titleAccent}>{t("titleSecond")}</span>
            </div>
            <div className={styles.sub}>
              <span className={`${styles.dot} ${connected ? "" : styles.off}`} />
              {t("subtitle")}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.hicon} ${styles.tip}`}
            data-tip={t("close")}
            onClick={() => aiChatStore.close()}
            aria-label={t("close")}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Список чатов — оверлей поверх переписки */}
        <div className={`${styles.history} ${historyOpen ? styles.open : ""}`}>
          <div className={styles.histHead}>
            <h3>
              {t("historyTitle")}
              {chatsTotal > 0 && (
                <span className={styles.histCount}>({chatsTotal})</span>
              )}
            </h3>
            <button
              type="button"
              className={`${styles.hicon} ${styles.tip} ${styles.histClose}`}
              data-tip={t("close")}
              onClick={() => setHistoryOpen(false)}
              aria-label={t("close")}
            >
              <CloseIcon />
            </button>
          </div>

          <button
            type="button"
            className={styles.histNewBtn}
            onClick={handleNewChat}
            disabled={switchingChat}
          >
            <PlusIcon />
            {t("newChat")}
          </button>

          <div className={styles.histList} onScroll={onHistoryScroll}>
            {groupChats(chats).map((group) => (
              <div key={group.key}>
                <div className={styles.histGroup}>{t(`group_${group.key}`)}</div>
                {group.items.map((chat) => (
                  <div
                    key={chat.id}
                    className={`${styles.histRow} ${chat.id === activeChatId ? styles.active : ""}`}
                  >
                    {confirmDeleteId === chat.id ? (
                      <div className={styles.histConfirm}>
                        <span className={styles.histConfirmText}>
                          {t("deleteChatConfirm")}
                        </span>
                        <button
                          type="button"
                          className={styles.histConfirmBtn}
                          onClick={() => handleDeleteChat(chat.id)}
                        >
                          {t("delete")}
                        </button>
                        <button
                          type="button"
                          className={`${styles.histConfirmBtn} ${styles.cancel}`}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.histItem}
                          onClick={() => handleSelectChat(chat.id)}
                        >
                          <div className={styles.histTitle}>
                            {chat.title || t("newChat")}
                          </div>
                          {chat.preview && (
                            <div className={styles.histPreview}>
                              {chat.preview}
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          className={styles.histDel}
                          onClick={() => setConfirmDeleteId(chat.id)}
                          title={t("deleteChat")}
                          aria-label={t("deleteChat")}
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {chatsLoading && (
              <div className={styles.histLoading}>
                <span className={styles.spin} />
              </div>
            )}
            {!chatsLoading && chats.length === 0 && (
              <div className={styles.histEmpty}>{t("chatsEmpty")}</div>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          className={styles.body}
          ref={bodyRef}
          onClick={onBodyClick}
          onScroll={onBodyScroll}
        >
          {/* подгрузка старых сообщений при скролле вверх */}
          {loadingMore && (
            <div className={styles.loadMore}>
              <span className={styles.spin} />
            </div>
          )}

          <div className={styles.daySep}>{t("today")}</div>

          {(switchingChat || historyLoading) && messages.length === 0 && (
            <div className={styles.histLoading}>
              <span className={styles.spin} />
            </div>
          )}

          {showGreeting && (
            <div className={styles.aMsg}>
              <div className={styles.mono}>
                <StarIcon />
              </div>
              <div className={styles.aText}>{t("greeting")}</div>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === "user") {
              // Файл всегда показываем карточкой, отдельно от текста: ссылки
              // из текста вырезаем и объединяем с полем files (дубли по url).
              const { links, stripped } = extractLinks(m.content);
              const seen = new Set();
              const files = [...(m.files || []), ...links].filter((f) => {
                if (!f?.url || seen.has(f.url)) return false;
                seen.add(f.url);
                return true;
              });
              const text = stripped;
              return (
                <div className={styles.uMsg} key={m.id}>
                  {files.length > 0 && (
                    <div className={styles.msgFiles}>
                      {files.map((file, i) => (
                        <FileCard
                          key={file.url || i}
                          file={file}
                          note={
                            <>
                              <span className={styles.fileOk}>✓</span>
                              {t("fileSent")}
                            </>
                          }
                          downloadLabel={t("download")}
                        />
                      ))}
                    </div>
                  )}
                  {text && (
                    <div className={styles.bubble}>
                      <UserText content={text} />
                    </div>
                  )}
                  <MsgActions
                    t={t}
                    getText={() => m.content}
                    onEdit={() => startEdit(m)}
                  />
                </div>
              );
            }

            return (
              <div className={styles.aMsg} key={m.id}>
                <div className={styles.mono}>
                  <StarIcon />
                </div>
                <div className={styles.aText}>
                  {m.isHtml ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderAiHtml(m.content) }}
                    />
                  ) : (
                    m.content
                  )}
                  {m.files?.length > 0 && (
                    <div className={styles.msgFiles}>
                      {m.files.map((file, i) => (
                        <FileCard
                          key={file.url || i}
                          file={file}
                          downloadLabel={t("download")}
                        />
                      ))}
                    </div>
                  )}
                  <MsgActions
                    t={t}
                    getText={() =>
                      m.isHtml ? htmlToText(m.content) : m.content
                    }
                  />
                </div>
              </div>
            );
          })}

          {/* живой стрим — рендерим как HTML (DOMPurify корректно закрывает незавершённые теги) */}
          {streamingText !== null && (
            <div className={styles.aMsg}>
              <div className={styles.mono}>
                <StarIcon />
              </div>
              <div className={styles.aText}>
                <span
                  dangerouslySetInnerHTML={{ __html: renderAiHtml(streamingText) }}
                />
                <span className={styles.cursor} />
              </div>
            </div>
          )}

          {/* ждём первый токен */}
          {isAwaiting && streamingText === null && (
            <div className={styles.aMsg}>
              <div className={styles.mono}>
                <StarIcon />
              </div>
              <div className={styles.aText}>
                <div className={styles.typing}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Быстрые ответы — нумерованные варианты над полем ввода */}
        <div className={`${styles.suggests} ${quickVisible ? "" : styles.hidden}`}>
          <div className={styles.sgTitle}>
            <StarIcon />
            {t("quickTitle")}
          </div>
          {quickReplies.map((s, i) => (
            <button
              key={`${s.prompt}-${i}`}
              type="button"
              className={styles.opt}
              onClick={() => send(s.prompt)}
              tabIndex={quickVisible ? 0 : -1}
            >
              <span className={styles.optNum}>{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className={styles.composer}>
          {editing && (
            <div className={styles.editBar}>
              <EditIcon />
              {t("editingHint")}
              <button
                type="button"
                className={styles.editCancel}
                onClick={clearComposer}
              >
                {t("cancel")}
              </button>
            </div>
          )}

          <div className={styles.cbar}>
            <span className={styles.modelChip}>
              <StarIcon />
              {t("modelName")}
            </span>
            <button
              type="button"
              className={`${styles.tool} ${styles.tip} ${styles.tipUp}`}
              data-tip={t("attach")}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label={t("attach")}
            >
              {uploading ? <span className={styles.spin} /> : <ClipIcon />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <div className={styles.cbarRight}>
              <button
                type="button"
                className={`${styles.tool} ${styles.tip} ${styles.tipUp}`}
                data-tip={t("historyBtn")}
                onClick={() => setHistoryOpen(true)}
                aria-label={t("historyBtn")}
              >
                <HistoryIcon />
              </button>
              <button
                type="button"
                className={`${styles.newChatBtn} ${styles.tip} ${styles.tipUp}`}
                data-tip={t("newChat")}
                onClick={handleNewChat}
                disabled={switchingChat}
                aria-label={t("newChat")}
              >
                <NewChatIcon />
              </button>
            </div>
          </div>

          <div className={styles.inp}>
            {/* прикреплённые файлы — отдельно от текста, уходят полем files */}
            {attachments.length > 0 && (
              <div className={styles.attachRow}>
                {attachments.map((file) => (
                  <span className={styles.attachChip} key={file.url}>
                    <ClipIcon />
                    <span className={styles.attachName} title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      className={styles.attachRemove}
                      onClick={() => removeAttachment(file.url)}
                      aria-label={t("close")}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              ref={editorRef}
              className={styles.editor}
              rows={1}
              value={draft}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              onChange={onDraftChange}
              onKeyDown={onKeyDown}
            />
            <div className={styles.inpRow}>
              <button
                className={styles.send}
                onClick={submit}
                disabled={(!draft.trim() && attachments.length === 0) || uploading}
                aria-label={t("send")}
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <div className={styles.footNote}>{t("footNote")}</div>
        </div>
      </aside>
    </>
  );
});

export default AiChatPanel;
