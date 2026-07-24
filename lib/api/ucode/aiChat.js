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
export const aiChatSendMessage = ({ content, branchId } = {}) =>
  aiChatRequest("ai_chat_send_message", {
    content,
    branch_id: branchId || authStore?.branch_id,
  });

/**
 * История чата + live_chat_room_id (для восстановления при открытии).
 */
export const aiChatHistory = ({ page = 1, limit = 50, branchId } = {}) =>
  aiChatRequest("ai_chat_history", {
    branch_id: branchId || authStore?.branch_id,
    page,
    limit,
  });
