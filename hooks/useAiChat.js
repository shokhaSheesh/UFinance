"use client";

import createDOMPurify from "dompurify";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  aiChatDelete,
  aiChatEditMessage,
  aiChatHistory,
  aiChatList,
  aiChatNew,
  aiChatSendMessage,
  buildAiChatContent,
  unwrapAiData,
} from "@/lib/api/ucode/aiChat";
import { aiChatStore } from "@/store/aiChat.store";
import { authStore } from "@/store/auth.store";

const CHAT_WS = "wss://chat-service.u-code.io/socket.io/?EIO=4&transport=websocket";
const PROJECT_ID = "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed";
const AI_ROW_ID = "planfact_ai";
const HISTORY_LIMIT = 20; // размер страницы истории (подгрузка старых при скролле вверх)

const SANITIZE_OPTS = {
  ALLOWED_TAGS: [
    "p", "ul", "ol", "li", "strong", "em", "b", "i", "u", "s", "code", "pre",
    "br", "hr", "span", "div", "a", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "table", "thead", "tbody", "tr", "th", "td", "button",
  ],
  ALLOWED_ATTR: ["data-prompt", "class", "href", "target", "rel"],
};

// В браузере default export dompurify уже готов (.sanitize); на всякий случай
// поддерживаем и вариант «фабрика(window)».
let _purify = null;
const getPurify = () => {
  if (typeof window === "undefined") return null;
  if (_purify) return _purify;
  if (createDOMPurify && typeof createDOMPurify.sanitize === "function") {
    _purify = createDOMPurify;
  } else if (typeof createDOMPurify === "function") {
    _purify = createDOMPurify(window);
  }
  return _purify;
};

// Санитизация HTML ответа AI (источник недоверенный) — обязательна перед innerHTML
export const sanitizeAiHtml = (html) => {
  const purify = getPurify();
  if (!purify) return "";
  try {
    return purify.sanitize(String(html || ""), SANITIZE_OPTS);
  } catch {
    return "";
  }
};

let _idc = 0;
const uid = () => `m_${_idc++}_${Math.round(performance.now())}`;

const readContent = (c) =>
  typeof c === "string" ? c : c?.text || c?.content || "";

// guid сообщения из истории — нужен для ai_chat_edit_message
const readMessageId = (m) => m?.id || m?.guid || m?.message_id || "";

const fileNameFromUrl = (url) => {
  const clean = String(url || "").split("?")[0];
  return decodeURIComponent(clean.slice(clean.lastIndexOf("/") + 1)) || "file";
};

// files из истории: массив строк-ссылок либо объектов
const readFiles = (m) => {
  const raw = Array.isArray(m?.files) ? m.files : [];
  return raw
    .map((f) =>
      typeof f === "string"
        ? { name: fileNameFromUrl(f), url: f }
        : {
            name: f?.name || f?.file_name || fileNameFromUrl(f?.url || f?.link),
            url: f?.url || f?.link || "",
          }
    )
    .filter((f) => f.url);
};

// ─── Быстрые ответы (подсказки), приходящие вместе с ответом AI ──────
// Бэк может отдать их двумя способами: полем в сообщении истории
// (suggestions / quick_replies / …) или кнопками <button data-prompt> в HTML.
const SUGGEST_KEYS = [
  "suggestions",
  "quick_replies",
  "quickReplies",
  "quick_answers",
  "quickAnswers",
  "follow_ups",
  "followUps",
  "options",
  "buttons",
  "actions",
];

const toSuggestion = (s) => {
  if (typeof s === "string") {
    const label = s.trim();
    return label ? { label, prompt: label } : null;
  }
  const label = s?.label || s?.text || s?.title || s?.name || s?.content || s?.prompt;
  const prompt = s?.prompt || s?.value || s?.query || s?.text || label;
  return label ? { label: String(label), prompt: String(prompt) } : null;
};

const readSuggestList = (m) => {
  const sources = [m, m?.content, m?.metadata, m?.meta, m?.data, m?.extra];
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of SUGGEST_KEYS) {
      const v = src[key];
      if (Array.isArray(v) && v.length) {
        const list = v.map(toSuggestion).filter(Boolean);
        if (list.length) return list;
      }
    }
  }
  return [];
};

/**
 * Достаёт из HTML-ответа AI кнопки-подсказки и убирает их из текста —
 * показываем их отдельным блоком «Быстрые ответы» над полем ввода.
 * Парсим через DOMParser: скрипты не выполняются, ресурсы не грузятся.
 */
const splitAssistantContent = (html) => {
  const src = String(html || "");
  if (typeof window === "undefined" || !src.includes("data-prompt")) {
    return { html: src, suggestions: [] };
  }
  try {
    const doc = new DOMParser().parseFromString(sanitizeAiHtml(src), "text/html");
    const nodes = Array.from(doc.querySelectorAll("button[data-prompt]"));
    if (!nodes.length) return { html: src, suggestions: [] };
    const suggestions = nodes
      .map((b) => {
        const label = (b.textContent || "").trim();
        const prompt = b.getAttribute("data-prompt") || label;
        return label ? { label, prompt } : null;
      })
      .filter(Boolean);
    nodes.forEach((b) => b.remove());
    return { html: doc.body.innerHTML, suggestions };
  } catch {
    return { html: src, suggestions: [] };
  }
};

const normalizeMessage = (m) => {
  const role = m?.role === "assistant" ? "assistant" : "user";
  const raw = readContent(m?.content);
  const messageId = readMessageId(m);
  if (role !== "assistant") {
    return {
      id: uid(),
      messageId,
      role,
      content: raw,
      files: readFiles(m),
      isHtml: false,
    };
  }
  const { html, suggestions } = splitAssistantContent(raw);
  const fromFields = readSuggestList(m);
  return {
    id: uid(),
    messageId,
    role,
    content: html,
    isHtml: true,
    suggestions: fromFields.length ? fromFields : suggestions,
  };
};

// chat_id текущего чата из ответа ai_chat_history / ai_chat_send_message
const readChatId = (d) =>
  d?.chat_id || d?.chatId || d?.chat?.id || d?.chat?.guid || d?.ai_chat_id || "";

const CHAT_LIST_LIMIT = 20;

// Строка списка чатов рисуется одной строкой с многоточием, поэтому контент
// приводим к плоскому тексту: markdown-ссылку заменяем её названием, HTML
// ответа AI разбираем в текст, переносы схлопываем в пробел.
const CHAT_PREVIEW_MAX = 300;
const MD_LINK_TEXT = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

const toPlainPreview = (raw) => {
  let text = readContent(raw);
  if (!text) return "";
  text = text.replace(MD_LINK_TEXT, "$1");
  if (typeof window !== "undefined" && /<[a-z][\s\S]*>/i.test(text)) {
    try {
      const doc = new DOMParser().parseFromString(
        sanitizeAiHtml(text),
        "text/html"
      );
      text = doc.body.textContent || "";
    } catch {
      /* оставляем как есть */
    }
  }
  return text.replace(/\s+/g, " ").trim().slice(0, CHAT_PREVIEW_MAX);
};

// Элемент ai_chat_list → карточка в списке чатов:
// заголовок — первый вопрос пользователя, описание — первый ответ AI
const normalizeChat = (c) => ({
  id: c?.chat_id || c?.id || c?.guid || "",
  title:
    toPlainPreview(c?.first_user_message?.content ?? c?.first_user_message) ||
    c?.title ||
    c?.name ||
    "",
  preview:
    toPlainPreview(c?.first_ai_message?.content ?? c?.first_ai_message) ||
    toPlainPreview(c?.last_message) ||
    "",
  roomId: c?.live_chat_room_id || "",
  date:
    c?.updated_at ||
    c?.last_message_at ||
    c?.created_at ||
    c?.date ||
    "",
});

/**
 * Список чатов пользователя (ai_chat_list) с постраничной подгрузкой.
 * @param {boolean} enabled — грузим только когда панель истории открыта
 */
export function useAiChatList(enabled) {
  const [chats, setChats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const busyRef = useRef(false);

  const fetchPage = useCallback(async (page) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const res = await aiChatList({ page, limit: CHAT_LIST_LIMIT });
      const d = unwrapAiData(res);
      const raw = Array.isArray(d.chats)
        ? d.chats
        : Array.isArray(d.data)
          ? d.data
          : Array.isArray(d.items)
            ? d.items
            : Array.isArray(d.list)
              ? d.list
              : [];
      const list = raw.map(normalizeChat).filter((c) => c.id);
      const count = Number(d.pagination?.total) || 0;
      pageRef.current = page;
      setTotal((prev) => count || (page === 1 ? list.length : prev));
      setChats((prev) => (page === 1 ? list : [...prev, ...list]));
      setHasMore(
        count ? page * CHAT_LIST_LIMIT < count : list.length >= CHAT_LIST_LIMIT
      );
    } catch {
      if (page === 1) setChats([]);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => fetchPage(1), [fetchPage]);

  // Удаление чата: строку убираем сразу, при ошибке возвращаем список с сервера
  const remove = useCallback(
    async (chatId) => {
      if (!chatId) return false;
      const prev = chats;
      setChats((list) => list.filter((c) => c.id !== chatId));
      setTotal((n) => (n > 0 ? n - 1 : 0));
      try {
        await aiChatDelete({ chatId });
        return true;
      } catch {
        setChats(prev);
        setTotal((n) => n + 1);
        return false;
      }
    },
    [chats]
  );
  const loadMore = useCallback(() => {
    if (!hasMore || busyRef.current) return;
    fetchPage(pageRef.current + 1);
  }, [fetchPage, hasMore]);

  useEffect(() => {
    if (enabled) fetchPage(1);
  }, [enabled, fetchPage]);

  return { chats, total, loading, hasMore, loadMore, reload, remove };
}

/**
 * Управляет AI-чатом: история, WebSocket-стрим, отправка, polling-фоллбек.
 * @param {boolean} isOpen — открыта ли панель (инициализация лениво, при первом открытии)
 */
export function useAiChat(isOpen) {
  const [messages, setMessages] = useState([]); // {id, role, content, isHtml} — старые→новые (сверху вниз)
  const [streamingText, setStreamingText] = useState(null); // string | null — живой стрим
  const [isAwaiting, setIsAwaiting] = useState(false); // ждём первый токен (индикатор «печатает»)
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false); // есть ли ещё старые страницы истории
  const [loadingMore, setLoadingMore] = useState(false); // идёт подгрузка старых сообщений
  const [activeChatId, setActiveChatId] = useState(""); // выбранный чат из ai_chat_list
  const [switchingChat, setSwitchingChat] = useState(false); // переключение / создание чата

  const wsRef = useRef(null);
  const roomIdRef = useRef("");
  const chatIdRef = useRef(""); // chat_id из ai_chat_history — уходит в send
  const joinedRef = useRef(false);
  const streamRef = useRef("");
  const awaitingReplyRef = useRef(false);
  const stopTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const reconnectRef = useRef(null);
  const openRef = useRef(isOpen);
  const everOpenedRef = useRef(false); // панель открывали хотя бы раз (не дёргаем API на старте)
  const pageRef = useRef(1); // текущая загруженная страница истории
  const totalRef = useRef(0); // всего сообщений (из pagination.total)
  const hasMoreRef = useRef(false); // зеркало hasMore для обработчика скролла
  const loadingMoreRef = useRef(false); // защита от параллельных подгрузок

  const userId = () =>
    authStore?.userData?.guid || authStore?.userData?.id || "";

  // chat_id держим и в ref (для мгновенного чтения в запросах), и в состоянии
  // (для подсветки активного чата в списке)
  const applyChatId = useCallback((id) => {
    if (!id || id === chatIdRef.current) return;
    chatIdRef.current = id;
    setActiveChatId(id);
  }, []);

  const emit = (ws, event, payload) => {
    if (ws && ws.readyState === 1) {
      ws.send("42" + JSON.stringify([event, payload]));
    }
  };

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Финализируем ответ AI (кто первым — WS-финал, typing:stop или polling — тот и добавляет)
  const finalizeReply = useCallback(
    (content) => {
      if (!awaitingReplyRef.current) return false;
      const html = String(content || "").trim();
      if (!html) return false; // пустой контент не коммитим — ждём реальный
      awaitingReplyRef.current = false;
      streamRef.current = "";
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setStreamingText(null);
      setIsAwaiting(false);
      stopPolling();
      const { html: body, suggestions } = splitAssistantContent(html);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: body,
          isHtml: true,
          suggestions,
        },
      ]);
      return true;
    },
    [stopPolling]
  );

  // ─── Входящие WS-события ────────────────────────────────────────────
  const handleEvent = useCallback(
    (event, p) => {
      const isAI =
        p?.role === "assistant" ||
        p?.from === "PlanFact AI" ||
        p?.author_row_id === AI_ROW_ID;

      if (event === "typing:start" && p?.stream_event === "start") {
        streamRef.current = "";
        setIsAwaiting(false);
        setStreamingText("");
      } else if (event === "typing:start" && p?.stream_event === "delta") {
        streamRef.current += p?.delta || "";
        setIsAwaiting(false);
        setStreamingText(streamRef.current);
      } else if (event === "typing:stop") {
        // Предпочитаем финальный «chat message» (чистый HTML). Но если он не придёт —
        // коммитим накопленный стрим, чтобы ответ не пропал (иначе висит «сырым»).
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
          if (awaitingReplyRef.current && streamRef.current) {
            finalizeReply(streamRef.current);
          }
        }, 1200);
      } else if (event === "chat message" && isAI) {
        finalizeReply(readContent(p?.content) || streamRef.current);
      }
      // «chat message» с role:user игнорируем — мы уже показали его оптимистично
    },
    [finalizeReply]
  );

  // ─── WebSocket-подключение ──────────────────────────────────────────
  const connect = useCallback(
    (room) => {
      const roomId = room || roomIdRef.current;
      if (!roomId || typeof window === "undefined") return;
      roomIdRef.current = roomId;

      const existing = wsRef.current;
      if (existing && (existing.readyState === 0 || existing.readyState === 1)) return;

      let ws;
      try {
        ws = new WebSocket(CHAT_WS);
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        const d = ev.data;
        if (typeof d !== "string") return;
        if (d === "2") return ws.send("3"); // ping → pong
        if (d.startsWith("40")) {
          // namespace connected → join room
          const uidv = userId();
          emit(ws, "connected", { row_id: uidv, project_id: PROJECT_ID });
          emit(ws, "join room", {
            room_id: roomIdRef.current,
            row_id: uidv,
            project_id: PROJECT_ID,
          });
          joinedRef.current = true;
          setConnected(true);
          return;
        }
        if (d.startsWith("0")) return ws.send("40"); // open → connect namespace
        if (d.startsWith("42")) {
          try {
            const [event, p] = JSON.parse(d.slice(2));
            if (p?.room_id && p.room_id !== roomIdRef.current) return;
            handleEvent(event, p);
          } catch {
            /* ignore malformed frame */
          }
        }
      };

      ws.onclose = () => {
        joinedRef.current = false;
        setConnected(false);
        if (wsRef.current === ws) wsRef.current = null;
        // reconnect, пока панель открыта и есть комната
        if (openRef.current && roomIdRef.current) {
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
          reconnectRef.current = setTimeout(
            () => connect(roomIdRef.current),
            2500
          );
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };
    },
    [handleEvent]
  );

  // ─── Polling-фоллбек (если WS не доставил ответ) ────────────────────
  const startPolling = useCallback(() => {
    stopPolling();
    let attempts = 0;
    const tick = async () => {
      if (!awaitingReplyRef.current) return;
      attempts += 1;
      if (attempts > 60) return stopPolling(); // ~2.5 мин
      try {
        const res = await aiChatHistory({ page: 1, limit: HISTORY_LIMIT });
        const d = unwrapAiData(res);
        const msgs = Array.isArray(d.messages) ? d.messages : [];
        const newest = msgs[0]; // история приходит DESC (новые первыми)
        if (
          newest?.role === "assistant" &&
          finalizeReply(readContent(newest.content))
        )
          return;
      } catch {
        /* keep polling */
      }
      pollTimerRef.current = setTimeout(tick, 2500);
    };
    // даём WS фору — стартуем polling чуть позже
    pollTimerRef.current = setTimeout(tick, 4000);
  }, [finalizeReply, stopPolling]);

  // ─── Загрузка истории (первая страница — при каждом открытии) ────────
  const loadHistory = useCallback(async (chatId) => {
    setHistoryLoading(true);
    pageRef.current = 1;
    try {
      const res = await aiChatHistory({
        page: 1,
        limit: HISTORY_LIMIT,
        chatId: chatId || chatIdRef.current,
      });
      const d = unwrapAiData(res);
      const room = d.live_chat_room_id || "";
      applyChatId(readChatId(d) || chatId || "");
      const raw = Array.isArray(d.messages) ? d.messages : [];
      // API отдаёт новые→старые (DESC); разворачиваем в старые→новые (сверху вниз)
      const ordered = raw.map(normalizeMessage).reverse();
      const total = Number(d.pagination?.total) || 0;
      totalRef.current = total;
      const more = total ? HISTORY_LIMIT < total : raw.length >= HISTORY_LIMIT;
      hasMoreRef.current = more;
      setHasMore(more);
      if (room) roomIdRef.current = room;
      setMessages(ordered);
      if (room) connect(room);
    } catch {
      /* пустая история — не критично */
    } finally {
      setHistoryLoading(false);
    }
  }, [connect, applyChatId]);

  // ─── Подгрузка старых сообщений (скролл вверх) ───────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await aiChatHistory({
        page: nextPage,
        limit: HISTORY_LIMIT,
        chatId: chatIdRef.current,
      });
      const d = unwrapAiData(res);
      const raw = Array.isArray(d.messages) ? d.messages : [];
      // страница тоже DESC → разворачиваем; вся страница старше текущих — добавляем сверху
      const older = raw.map(normalizeMessage).reverse();
      pageRef.current = nextPage;
      const total = Number(d.pagination?.total) || totalRef.current;
      totalRef.current = total;
      const loaded = nextPage * HISTORY_LIMIT;
      const more = total ? loaded < total : raw.length >= HISTORY_LIMIT;
      hasMoreRef.current = more;
      setHasMore(more);
      if (older.length) setMessages((prev) => [...older, ...prev]);
    } catch {
      /* игнор — можно повторить при следующем скролле */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // ─── Отправка сообщения (с опциональными файлами) ───────────────────
  const send = useCallback(
    async (text, files = []) => {
      const content = String(text || "").trim();
      const atts = Array.isArray(files) ? files : [];
      if (!content && atts.length === 0) return;

      // чат использовали → при закрытии панели обновим данные текущей страницы
      aiChatStore.markUsed();

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content, files: atts, isHtml: false },
      ]);
      setIsAwaiting(true);
      streamRef.current = "";
      setStreamingText(null);
      awaitingReplyRef.current = true;

      // AI получает текст со ссылками: {filename} → [name](url), остальные — в конец
      const apiContent = buildAiChatContent(content, atts);

      try {
        const res = await aiChatSendMessage({
          content: apiContent,
          chatId: chatIdRef.current,
        });
        const d = unwrapAiData(res);
        applyChatId(readChatId(d));
        const room = d.live_chat_room_id || roomIdRef.current;
        if (room) {
          roomIdRef.current = room;
          if (!joinedRef.current) connect(room);
        }
        startPolling(); // страховка на случай, если WS не доставит
      } catch {
        awaitingReplyRef.current = false;
        setIsAwaiting(false);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "<p>Не удалось отправить сообщение. Попробуйте ещё раз.</p>",
            isHtml: true,
          },
        ]);
      }
    },
    [connect, startPolling, applyChatId]
  );

  // ─── Редактирование отправленного сообщения ─────────────────────────
  // Бэк принимает ai_chat_edit_message и перегенерирует ответ AI —
  // он приходит по тому же WS/polling, что и обычная отправка.
  const edit = useCallback(
    async (messageId, text) => {
      const content = String(text || "").trim();
      if (!messageId || !content) return false;

      aiChatStore.markUsed();

      // правим сообщение на месте и убираем ответ AI, который к нему относился
      setMessages((prev) => {
        const i = prev.findIndex((m) => m.messageId === messageId);
        if (i === -1) return prev;
        const next = prev.slice(0, i + 1);
        next[i] = { ...next[i], content };
        return next;
      });

      setIsAwaiting(true);
      streamRef.current = "";
      setStreamingText(null);
      awaitingReplyRef.current = true;

      try {
        const res = await aiChatEditMessage({ id: messageId, content });
        const d = unwrapAiData(res);
        applyChatId(readChatId(d));
        const room = d.live_chat_room_id || roomIdRef.current;
        if (room) {
          roomIdRef.current = room;
          if (!joinedRef.current) connect(room);
        }
        startPolling();
        return true;
      } catch {
        awaitingReplyRef.current = false;
        setIsAwaiting(false);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "<p>Не удалось изменить сообщение. Попробуйте ещё раз.</p>",
            isHtml: true,
          },
        ]);
        return false;
      }
    },
    [connect, startPolling, applyChatId]
  );

  // ─── Переключение и создание чатов ──────────────────────────────────
  // Комната WS привязана к чату: при переходе отпускаем старую, новую даёт
  // ответ ai_chat_history. Сбрасываем roomId до close(), иначе onclose
  // попытается переподключиться к покинутому чату.
  const leaveRoom = useCallback(() => {
    stopPolling();
    awaitingReplyRef.current = false;
    streamRef.current = "";
    setStreamingText(null);
    setIsAwaiting(false);
    roomIdRef.current = "";
    joinedRef.current = false;
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    try {
      wsRef.current?.close();
    } catch {
      /* noop */
    }
    wsRef.current = null;
    setConnected(false);
  }, [stopPolling]);

  // Сброс до пустого чата — например, когда удалили активный.
  // chat_id не создаём: его вернёт первый ai_chat_send_message.
  const resetChat = useCallback(() => {
    leaveRoom();
    setMessages([]);
    setHasMore(false);
    hasMoreRef.current = false;
    pageRef.current = 1;
    chatIdRef.current = "";
    setActiveChatId("");
  }, [leaveRoom]);

  // Открыть чат из списка
  const selectChat = useCallback(
    async (chatId) => {
      if (!chatId || chatId === chatIdRef.current) return;
      setSwitchingChat(true);
      leaveRoom();
      setMessages([]);
      setHasMore(false);
      hasMoreRef.current = false;
      pageRef.current = 1;
      applyChatId(chatId);
      try {
        await loadHistory(chatId);
      } finally {
        setSwitchingChat(false);
      }
    },
    [applyChatId, leaveRoom, loadHistory]
  );

  // Новый чат: ai_chat_new отдаёт chat_id, дальше он уходит в send
  const newChat = useCallback(async () => {
    setSwitchingChat(true);
    leaveRoom();
    setMessages([]);
    setHasMore(false);
    hasMoreRef.current = false;
    pageRef.current = 1;
    chatIdRef.current = "";
    setActiveChatId("");
    try {
      const res = await aiChatNew();
      const d = unwrapAiData(res);
      applyChatId(readChatId(d));
      const room = d.live_chat_room_id || "";
      if (room) {
        roomIdRef.current = room;
        connect(room);
      }
      return true;
    } catch {
      return false;
    } finally {
      setSwitchingChat(false);
    }
  }, [applyChatId, connect, leaveRoom]);

  // перезагружаем историю при каждом открытии; при закрытии тоже дёргаем history
  useEffect(() => {
    openRef.current = isOpen;
    if (isOpen) {
      everOpenedRef.current = true;
      loadHistory();
    } else if (everOpenedRef.current) {
      // закрытие после открытия — сбрасываем пагинацию и обновляем историю
      pageRef.current = 1;
      aiChatHistory({ page: 1, limit: HISTORY_LIMIT }).catch(() => {});
    }
  }, [isOpen, loadHistory]);

  // очистка при размонтировании
  useEffect(
    () => () => {
      stopPolling();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
    },
    [stopPolling]
  );

  // быстрые ответы показываем, только пока последнее слово за AI
  const last = messages[messages.length - 1];
  const suggestions =
    last?.role === "assistant" && Array.isArray(last.suggestions)
      ? last.suggestions
      : [];

  return {
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
  };
}
