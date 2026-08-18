import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";
import { apiClient } from "./base";

/**
 * ============================================
 * AI Chat API (PlanFact AI ассистент)
 * ============================================
 * У этих методов тело отличается от обычного invoke_function:
 *   { data: { method, user_id, object_data } }  (без auth-блока, с user_id).
 * Отправляются на тот же invoke_function endpoint. Живой ответ приходит
 * по WebSocket (см. hooks/useAiChat.js).
 */

const PROJECT_ID = "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed";

// ─── Загрузка файлов (тот же endpoint, что и у комментариев операций) ───
const UPLOAD_URL =
  "https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png";
const CDN_BASE = "https://cdn.u-code.io";
export const AI_CHAT_MAX_FILES = 10;
export const AI_CHAT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Загружает файл и возвращает { name, url } с прямой ссылкой на CDN.
 */
export const uploadAiChatFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${authStore.authToken}` },
    body: formData,
  });
  if (!res.ok) throw new Error("File upload failed");
  const json = await res.json();
  return { name: file.name, url: `${CDN_BASE}/${json.data.link}` };
};

// ─── Плейсхолдер ссылки на файл в тексте ────────────────────────────────
// Пользователь может указать {filename} в сообщении — туда подставится ссылка
// на файл (по порядку прикрепления). Регистр и пробелы внутри допускаются.
export const AI_FILE_TOKEN = "{filename}";
// Фабрика: свежий global-regex на каждый вызов (без общего lastIndex).
const fileTokenRe = () => /\{\s*filename\s*\}/gi;

/**
 * Собирает content для AI: подставляет ссылки `[name](url)` вместо каждого
 * {filename} по порядку, а неиспользованные файлы добавляет в конец.
 * @param {string} text — текст пользователя (может содержать {filename})
 * @param {Array<{name:string,url:string}>} files — прикреплённые файлы по порядку
 * @returns {string} готовый content
 */
export const buildAiChatContent = (text, files = []) => {
  const atts = Array.isArray(files) ? files : [];
  let i = 0;
  let out = String(text || "").replace(fileTokenRe(), () => {
    if (i < atts.length) {
      const f = atts[i];
      i += 1;
      return `[${f.name}](${f.url})`;
    }
    return AI_FILE_TOKEN; // нет файла под этот плейсхолдер — оставляем как есть
  });
  const rest = atts.slice(i);
  if (rest.length) {
    const tail = rest.map((f) => `[${f.name}](${f.url})`).join("\n");
    out = out.trim() ? `${out}\n\n${tail}` : tail;
  }
  return out.trim();
};

/**
 * Разбивает текст по плейсхолдерам {filename} — для инлайн-рендера ссылок.
 * Кол-во токенов = parts.length - 1 (файлы подставляются между частями по порядку).
 */
export const splitAiFileTokens = (text) => String(text || "").split(fileTokenRe());

/**
 * Подставляет ссылки по РЕАЛЬНЫМ именам файлов: каждое вхождение имени файла
 * в тексте заменяется на `[имя](url)` (имя вставляется в композер при загрузке).
 * Имя удалено из текста → файл не отправляется (что видишь — то и уходит).
 * Поиск через indexOf (без regex) — спецсимволы в именах безопасны.
 * @returns {{content: string, used: Array}} текст со ссылками + отправляемые файлы
 */
export const buildContentWithFileLinks = (text, files = []) => {
  let out = String(text || "");
  const used = [];
  for (const f of Array.isArray(files) ? files : []) {
    if (!f?.name) continue;
    // ищем вхождение имени, ещё не обёрнутое в ссылку (для одинаковых имён — следующее)
    let idx = -1;
    let from = 0;
    for (;;) {
      idx = out.indexOf(f.name, from);
      if (idx === -1) break;
      const inLink =
        out[idx - 1] === "[" && out[idx + f.name.length] === "]";
      if (!inLink) break;
      from = idx + f.name.length;
    }
    if (idx === -1) continue; // имя удалили — пропускаем файл
    out =
      out.slice(0, idx) +
      `[${f.name}](${f.url})` +
      out.slice(idx + f.name.length);
    used.push(f);
  }
  return { content: out.trim(), used };
};

// user_id = guid пользователя (plan_fakt_admins)
export const getAiChatUserId = () =>
  authStore?.userData?.guid || authStore?.userData?.id || "";

const getInvokeUrl = () =>
  appStore?.localApiUrl ||
  `${apiClient.baseURL}${apiClient.invokeFunctionEndpoint}?project-id=${PROJECT_ID}`;

// Распаковываем возможную двойную вложенность ответа (invoke_function оборачивает)
export const unwrapAiData = (res) => res?.data?.data ?? res?.data ?? {};

async function aiChatRequest(method, objectData = {}) {
  const url = getInvokeUrl();
  // Тело AI-чата: user_id на уровне data. auth-блок добавляем для совместимости
  // с invoke_function endpoint (ai_chat читает user_id/object_data, auth игнорирует).
  const body = {
    data: {
      auth: { data: {}, type: "apikey" },
      method,
      user_id: getAiChatUserId(),
      object_data: objectData,
    },
  };

  const doFetch = (token) =>
    fetch(url, {
      method: "POST",
      headers: apiClient.buildHeaders(token),
      body: JSON.stringify(body),
    });

  let token = apiClient.getAuthToken();
  let response = await doFetch(token);

  // 401 → обновляем токен и повторяем один раз
  if (response.status === 401) {
    try {
      token = await apiClient.refreshAccessToken();
      response = await doFetch(token);
    } catch {
      // отдаём как есть — обработается выше
    }
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/**
 * Отправить сообщение AI. Возвращает СРАЗУ (status: "processing"),
 * ответ придёт по WebSocket. В ответе есть live_chat_room_id для JOIN.
 */
export const aiChatSendMessage = ({ content, branchId, chatId } = {}) =>
  aiChatRequest("ai_chat_send_message", {
    content,
    branch_id: branchId || authStore?.branch_id,
    // chat_id из ai_chat_history — продолжаем существующий чат
    ...(chatId ? { chat_id: chatId } : {}),
  });

/**
 * История чата + live_chat_room_id (для восстановления при открытии).
 * chatId — конкретный чат из ai_chat_list; без него бэк отдаёт текущий.
 */
export const aiChatHistory = ({ page = 1, limit = 50, branchId, chatId } = {}) =>
  aiChatRequest("ai_chat_history", {
    branch_id: branchId || authStore?.branch_id,
    page,
    limit,
    ...(chatId ? { chat_id: chatId } : {}),
  });

/**
 * Список чатов пользователя (для панели «История чата»).
 */
export const aiChatList = ({ page = 1, limit = 20, branchId } = {}) =>
  aiChatRequest("ai_chat_list", {
    branch_id: branchId || authStore?.branch_id,
    page,
    limit,
  });

/**
 * Создать новый чат. В ответе приходит его chat_id — дальше он уходит
 * в ai_chat_send_message.
 */
export const aiChatNew = ({ branchId } = {}) =>
  aiChatRequest("ai_chat_new", {
    branch_id: branchId || authStore?.branch_id,
  });

/**
 * Изменить ранее отправленное сообщение. Бэк перегенерирует ответ AI —
 * он придёт по тому же WebSocket, что и при обычной отправке.
 * @param {string} id — guid сообщения из истории (ai_chat_history)
 */
export const aiChatEditMessage = ({ id, content, files = [], branchId } = {}) =>
  aiChatRequest("ai_chat_edit_message", {
    id,
    content,
    files,
    branch_id: branchId || authStore?.branch_id,
  });
