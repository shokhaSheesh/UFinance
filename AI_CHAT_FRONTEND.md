# PlanFact AI Chat — Frontend integratsiya (WebSocket / realtime)

Bu hujjat frontend uchun: AI chat qanday ulanadi, xabar qanday yuboriladi va
javob **realtime** qanday keladi.

---

## 0. Asosiy tushuncha — 2 kanal

AI javobi bir necha soniya/daqiqa olishi mumkin. Shuning uchun `ai_chat_send_message`
javobni **KUTMAYDI** — HTTP darrov `status: "processing"` qaytaradi. Javob esa
**ucode chat-service** (WebSocket) orqali **token-token** keladi.

```
┌──────────┐   1) POST /v2 (ai_chat_send_message)         ┌─────────────┐
│ Frontend │ ───────────────────────────────────────────►│   Gateway   │
│          │ ◄─── {status:"processing", chat_id,          │  (backend)  │
│          │        live_chat_room_id}  (DARROV)          └──────┬──────┘
│          │                                                     │ fonda AI ishlaydi
│          │   2) WebSocket (chat-service room)                  ▼
│          │ ◄════ typing:start(delta) × N ══════════════  chat-service
│          │ ◄════ chat message (yakuniy javob) ═════════
└──────────┘
```

- **HTTP kanal:** xabar yuborish + darrov `chat_id`/`room_id` olish.
- **WebSocket kanal:** live javob (deltalar + yakuniy xabar).

> Bitta foydalanuvchining bitta filialda **BITTA chati** bo'ladi. Chat
> `(user_id, branch_id)` bo'yicha yagona — alohida "chat yaratish" yo'q.

---

## 1. HTTP API

**Endpoint:** `POST https://<gateway-host>/v2` (prod) yoki `/v1` (test)
**Header:** `Content-Type: application/json` (+ `Authorization: Bearer <token>` — auth yoqilganda)

### 1.1 Xabar yuborish — `ai_chat_send_message`

**So'rov:**
```json
{
  "data": {
    "method": "ai_chat_send_message",
    "user_id": "<plan_fakt_admins guid>",
    "object_data": {
      "content": "Shu oy sof foyda qancha?",
      "branch_id": "<branch guid>"
    }
  }
}
```

**Javob (DARROV, javobni kutmaydi):**
```json
{
  "status": "success",
  "data": {
    "status": "processing",
    "chat_id": "931a20cc-...",
    "live_chat_room_id": "b2301d56-...",   ← WebSocket JOIN uchun shu kerak
    "user_message": { "id": "...", "role": "user", "content": { "text": "..." } }
  }
}
```

> AI javobi bu javobda **YO'Q**. U WebSocket orqali keladi (yoki keyin `ai_chat_history` dan).

### 1.2 Tarix — `ai_chat_history`

Chat ochilganda oldingi xabarlarni yuklash + `live_chat_room_id` olish uchun:

**So'rov:**
```json
{ "data": { "method": "ai_chat_history",
            "user_id": "<user guid>",
            "object_data": { "branch_id": "<branch guid>", "page": 1, "limit": 50 } } }
```

**Javob:**
```json
{ "status": "success",
  "data": {
    "chat_id": "...",
    "live_chat_room_id": "b2301d56-...",
    "messages": [ { "role": "user", "content": "..." },
                  { "role": "assistant", "content": "<p>...</p>" } ],
    "pagination": { "total": 12, "page": 1, "limit": 50 }
  } }
```

---

## 2. WebSocket (ucode chat-service) — ulanish

**Base:** `https://chat-service.u-code.io`
**WS URL:** `wss://chat-service.u-code.io/socket.io/?EIO=4&transport=websocket`

Bu **Socket.IO v4** (Engine.IO 4). Rasmiy `socket.io-client` kutubxonasi bilan ham,
raw WebSocket bilan ham ishlash mumkin. Quyida **raw** variant (bog'liqliksiz).

### 2.1 Handshake ketma-ketligi

```
1. WS ochiladi
2. Server "0{...}" (open frame) yuboradi        → e'tiborsiz qoldiring
3. Siz "40" yuborasiz                            → namespace connect
4. Server "40{"sid":"..."}" yuboradi            → ulandi
5. Server vaqti-vaqti "2" (ping) yuboradi        → siz "3" (pong) qaytaring
6. Event: "42[\"event\",{...}]"                  → JSON.parse(frame.slice(2))
```

### 2.2 Room'ga qo'shilish

Handshake tugagach (`40` kelgach) 2 ta event yuboring:

```js
emit("connected", { row_id: userId, project_id: projectId });
emit("join room", { room_id: liveRoomId, row_id: userId, project_id: projectId });
```

- `row_id` = foydalanuvchi `user_id`
- `room_id` = send/history javobidagi `live_chat_room_id`
- `project_id` = `3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed`

---

## 3. Event protokoli (siz nimani QABUL qilasiz)

Gateway room'ga quyidagi eventlarni yuboradi (siz o'qiysiz):

| Event | stream_event | Nima |
|---|---|---|
| `chat message` | — | Foydalanuvchi xabari (`role:"user"`) — boshqa qurilma uchun |
| `typing:start` | `start` | AI yoza boshladi — bo'sh bubble ochish |
| `typing:start` | `delta` | Bitta token bo'lagi (`delta` maydonida) — qo'shib boring |
| `typing:stop` | `done` | Generatsiya tugadi |
| `chat message` | — | Yakuniy AI javobi (`role:"assistant"`, to'liq `content`) |

**Muhim nozikliklar:**
- Delta'lar `typing:start` ustida keladi (chat-service'da alohida "stream" event yo'q).
  Ya'ni `typing:start` bu yerda "AI yozmoqda" emas, "stream bo'lagi" degani.
- AI xabarini `role: "assistant"` (yoki `author_row_id: "planfact_ai"`) bo'yicha ajrating.
- Har payload'da `room_id` bor — o'z room'ingizga mos kelmasa, tashlab yuboring.

**Payload namunasi (delta):**
```json
["typing:start", {
  "room_id": "b2301d56-...", "project_id": "...",
  "row_id": "planfact_ai", "from": "PlanFact AI", "role": "assistant",
  "stream_event": "delta", "delta": "10 010 000 "
}]
```

**Payload namunasi (yakuniy):**
```json
["chat message", {
  "room_id": "b2301d56-...", "from": "PlanFact AI",
  "author_row_id": "planfact_ai", "role": "assistant",
  "content": "<p><strong>Sof foyda:</strong> ...</p>", "type": "text"
}]
```

---

## 4. To'liq JS misol (raw WebSocket)

```js
const CHAT_BASE  = "wss://chat-service.u-code.io/socket.io/?EIO=4&transport=websocket";
const PROJECT_ID = "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed";
const API_URL    = "https://<gateway-host>/v2"; // test uchun /v1

let ws, joined = false, aiText = "", roomId = "";

// ─── WebSocket ulanish ───────────────────────────────────────────────
function connectRealtime(userId, roomIdArg) {
  roomId = roomIdArg;
  ws = new WebSocket(CHAT_BASE);

  ws.onmessage = (ev) => {
    const d = ev.data;
    if (d === "2") return ws.send("3");                    // ping → pong
    if (d.startsWith("0")) return ws.send("40");           // open → connect
    if (d.startsWith("40")) {                              // connected → join
      emit("connected", { row_id: userId, project_id: PROJECT_ID });
      emit("join room", { room_id: roomId, row_id: userId, project_id: PROJECT_ID });
      joined = true;
      return;
    }
    if (d.startsWith("42")) {
      const [event, p] = JSON.parse(d.slice(2));
      if (p.room_id && p.room_id !== roomId) return;       // boshqa room
      handleEvent(event, p);
    }
  };
  ws.onclose = () => { joined = false; /* reconnect logikasi */ };
}
function emit(event, payload) {
  if (ws && ws.readyState === 1) ws.send("42" + JSON.stringify([event, payload]));
}

// ─── Kelayotgan eventlar ─────────────────────────────────────────────
function handleEvent(event, p) {
  const isAI = p.role === "assistant" || p.from === "PlanFact AI";
  if (event === "typing:start" && p.stream_event === "start") {
    aiText = "";
    openAIBubble();                        // bo'sh "yozmoqda…" bubble
  } else if (event === "typing:start" && p.stream_event === "delta") {
    aiText += (p.delta || "");
    updateAIBubble(aiText);                // deltalarni qo'shib borish (xom matn)
  } else if (event === "typing:stop") {
    // "saqlanmoqda…" ko'rsatish mumkin
  } else if (event === "chat message" && isAI) {
    finalizeAIBubble(p.content);          // YAKUNIY javob (HTML) — sanitize + render
  }
}

// ─── Xabar yuborish (HTTP) ───────────────────────────────────────────
async function sendMessage(userId, branchId, content) {
  showUserBubble(content);               // optimistik
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: { method: "ai_chat_send_message", user_id: userId,
              object_data: { content, branch_id: branchId } }
    }),
  });
  const json = await res.json();
  const rid = json?.data?.live_chat_room_id;
  if (rid && !joined) connectRealtime(userId, rid); // birinchi marta ulanmagan bo'lsa
  // Javob WebSocket orqali keladi (yoki fallback: ai_chat_history polling)
}
```

**Chat ochilishi tartibi:**
1. `ai_chat_history` → oldingi xabarlar + `live_chat_room_id`.
2. `connectRealtime(userId, live_chat_room_id)` → room'ga join.
3. `sendMessage(...)` → javob live oqadi.

> Agar birinchi xabar chatni yaratsa (`live_chat_room_id` hali yo'q edi), send
> javobidagi `room_id` bilan ulaning; keyingi xabarlar live oqadi.

---

## 5. Render — HTML + XSS himoyasi (MAJBURIY)

AI javobi **HTML** (`<p>`, `<ul>`, `<table>`, `<strong>`, `<button data-prompt>`).
Model chiqishi **ishonchsiz manba** — `innerHTML` dan oldin **DOMPurify** bilan tozalang:

```js
import DOMPurify from "dompurify";

function finalizeAIBubble(html) {
  bubbleEl.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p","ul","ol","li","strong","em","code","pre","br",
                   "table","thead","tbody","tr","th","td","button"],
    ALLOWED_ATTR: ["data-prompt"],
  });
}
```

`data-prompt` tugmalari uchun (keyingi savol):
```js
chatEl.addEventListener("click", (e) => {
  const p = e.target.closest("button[data-prompt]")?.dataset.prompt;
  if (p) sendMessage(userId, branchId, p);
});
```

> Delta bosqichida (stream) xom matn ko'rsatish yaxshi (HTML hali to'liq emas);
> `chat message` (yakuniy) kelganda DOMPurify bilan HTML render qiling.

---

## 6. Fallback — WebSocket ishlamasa

Agar chat-service ulanmasa (gateway/proxy bloklasa), javob baribir **DB'ga
saqlanadi**. Frontend `ai_chat_history` ni **polling** qilib javobni oladi:

```js
async function pollAnswer(userId, branchId) {
  for (let i = 0; i < 90; i++) {                 // ~3 daqiqa
    await new Promise(r => setTimeout(r, 2000));
    const h = await fetchHistory(userId, branchId);
    const last = h.messages.at(-1);
    if (last?.role === "assistant") { finalizeAIBubble(last.content); return; }
  }
}
```

Amaliyot: WebSocket'ni asosiy qiling, polling'ni **zaxira** sifatida (WS ulanmasa).

---

## 7. Muhim eslatmalar

| # | Narsa | Izoh |
|---|---|---|
| 1 | `ping (2) → pong (3)` | Javob bermasangiz chat-service ulanishni uzadi |
| 2 | Delta `typing:start` ustida | Alohida "stream" event yo'q — `stream_event` maydoniga qarang |
| 3 | AI = `role:"assistant"` | User va AI'ni shu bo'yicha ajrating (`author_row_id:"planfact_ai"`) |
| 4 | Room = chat bo'yicha | `live_chat_room_id` har chat uchun bitta; qayta ulanishda saqlang |
| 5 | Reconnect | `onclose` da qayta ulaning + qayta `join room` |
| 6 | Birinchi xabar oqimi | Chat yangi bo'lsa, join'dan oldin oqim boshlanishi mumkin — polling zaxira |
| 7 | `test` vs `prod` | `/v1` = test env, `/v2` = prod env (alohida DB) |
| 8 | XSS | `innerHTML` dan oldin DOMPurify — MAJBURIY |

---

## 8. Qisqacha checklist (frontend)

- [ ] `ai_chat_history` bilan oldingi xabarlar + `live_chat_room_id` yuklash
- [ ] chat-service WS: handshake (`0`→`40`→`40{sid}`) + `ping/pong`
- [ ] `connected` + `join room` emit
- [ ] `typing:start(start)` → bubble, `delta` → qo'shish, `chat message` → yakuniy
- [ ] Yakuniy HTML'ni DOMPurify bilan render
- [ ] `data-prompt` tugmalari → yangi `sendMessage`
- [ ] Fallback: `ai_chat_history` polling
- [ ] Reconnect (`onclose` → qayta join)
```
