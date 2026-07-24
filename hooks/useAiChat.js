"use client";

import createDOMPurify from "dompurify";
import { useCallback, useEffect, useRef, useState } from "react";
import { aiChatHistory, aiChatSendMessage, unwrapAiData } from "@/lib/api/ucode/aiChat";
import { authStore } from "@/store/auth.store";

const CHAT_WS = "wss://chat-service.u-code.io/socket.io/?EIO=4&transport=websocket";
const PROJECT_ID = "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed";
const AI_ROW_ID = "planfact_ai";

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

const normalizeMessage = (m) => ({
  id: uid(),
  role: m?.role === "assistant" ? "assistant" : "user",
  content: readContent(m?.content),
  isHtml: m?.role === "assistant",
});

/**
 * Управляет AI-чатом: история, WebSocket-стрим, отправка, polling-фоллбек.
 * @param {boolean} isOpen — открыта ли панель (инициализация лениво, при первом открытии)
 */
export function useAiChat(isOpen) {
  const [messages, setMessages] = useState([]); // {id, role, content, isHtml}
  const [streamingText, setStreamingText] = useState(null); // string | null — живой стрим
  const [isAwaiting, setIsAwaiting] = useState(false); // ждём первый токен (индикатор «печатает»)
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const wsRef = useRef(null);
  const roomIdRef = useRef("");
  const joinedRef = useRef(false);
  const streamRef = useRef("");
  const awaitingReplyRef = useRef(false);
  const stopTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const reconnectRef = useRef(null);
  const initializedRef = useRef(false);
  const openRef = useRef(isOpen);

  const userId = () =>
    authStore?.userData?.guid || authStore?.userData?.id || "";

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
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: html, isHtml: true },
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
        const res = await aiChatHistory({ page: 1, limit: 50 });
        const d = unwrapAiData(res);
        const msgs = Array.isArray(d.messages) ? d.messages : [];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant" && finalizeReply(readContent(last.content)))
          return;
      } catch {
        /* keep polling */
      }
      pollTimerRef.current = setTimeout(tick, 2500);
    };
    // даём WS фору — стартуем polling чуть позже
    pollTimerRef.current = setTimeout(tick, 4000);
  }, [finalizeReply, stopPolling]);

  // ─── Загрузка истории (при первом открытии) ─────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await aiChatHistory({ page: 1, limit: 50 });
      const d = unwrapAiData(res);
      const room = d.live_chat_room_id || "";
      const msgs = Array.isArray(d.messages) ? d.messages : [];
      if (room) roomIdRef.current = room;
      setMessages(msgs.map(normalizeMessage));
      if (room) connect(room);
    } catch {
      /* пустая история — не критично */
    } finally {
      setHistoryLoading(false);
    }
  }, [connect]);

  // ─── Отправка сообщения ─────────────────────────────────────────────
  const send = useCallback(
    async (text) => {
      const content = String(text || "").trim();
      if (!content) return;

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content, isHtml: false },
      ]);
      setIsAwaiting(true);
      streamRef.current = "";
      setStreamingText(null);
      awaitingReplyRef.current = true;

      try {
        const res = await aiChatSendMessage({ content });
        const d = unwrapAiData(res);
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
    [connect, startPolling]
  );

  // ленивая инициализация при первом открытии
  useEffect(() => {
    openRef.current = isOpen;
    if (isOpen && !initializedRef.current) {
      initializedRef.current = true;
      loadHistory();
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

  return {
    messages,
    streamingText,
    isAwaiting,
    connected,
    historyLoading,
    send,
  };
}
