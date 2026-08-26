# Attendance API (Davomat)

Davomat (attendance) oqimining to'rtta metodi:

1. **`get_attendance_bot_chat`** — Telegram `chat_id` dan `user_id` / `company_id` / `branch_id` ni olish;
2. **`get_attendance_groups`** — rahbarga biriktirilgan guruhlar + kunlik davomat statistikasi;
3. **`get_group_counterparties`** — tanlangan guruh o'quvchilari + o'sha kundagi holati;
4. **`create_attendance`** — belgilangan davomatni saqlash (upsert).

Handlerlar **functionsV2** da ([attendance.go](../functionsV2/attendance.go),
`get_attendance_groups` uchun [group_leaders.go](../functionsV2/group_leaders.go)),
registratsiya — [handlers.go](../functionsV2/handlers.go).

Bu API'larda **avtorizatsiya yo'q**: `user_id`, `company_id` va `branch_id` so'rov tanasidan
(`request.data`) olinadi. `user_id` yozuvning `plan_fakt_admins_id` ustuniga yoziladi,
`company_id`/`branch_id` esa yozuvga saqlanadi va query'larda scope (filtr) sifatida ishlatiladi.

---

## 1. Umumiy so'rov formati (envelope)

Barcha metodlar bitta HTTP endpointga **POST** qilinadi. Qaysi handler chaqirilishi `data.method`
orqali belgilanadi, parametrlar `data.object_data` ichida yuboriladi.

```jsonc
POST /
{
  "data": {
    "method": "create_attendance",   // handler nomi
    "app_id": "<APP_ID>",            // mutatsiya metodlari uchun tavsiya etiladi
    "object_data": {                 // metod parametrlari
      "counterparties_group_id": "..."
    }
  }
}
```

> `object_data` bo'lmasa, `data` ning o'zi parametr sifatida o'qiladi — lekin har doim
> `object_data` ishlating.

### Javob formati

**Muvaffaqiyat** — handler natijasi `data` ichiga o'raladi:

```jsonc
{
  "status": "success",
  "data": {
    "success": true,
    "data": [ /* ... */ ]
  }
}
```

**Xato**:

```jsonc
{
  "status": "error",
  "data": {
    "message": "counterparties_group_id is required",
    "error": "..."
  }
}
```

> Quyida faqat handlerning ichki natijasi (`status:"success"` ichidagi `data`) ko'rsatiladi.

---

## 2. Method'lar ro'yxati

| Method | Tavsif | Auth |
|---|---|---|
| `create_attendance` | Guruh davomatini bir kunga saqlash (create yoki update) | **yo'q** |
| `get_group_counterparties` | Guruh o'quvchilari ro'yxati + o'sha kundagi davomat holati | **yo'q** |
| `get_attendance_counterparties` | ⤴︎ alias | **yo'q** |
| `get_attendance_bot_chat` | `chat_id` bo'yicha bot foydalanuvchisi: `user_id` + `company_id` + `branch_id` | **yo'q** |
| `get_attendance_user_by_chat_id` | ⤴︎ alias | **yo'q** |
| `get_attendance_groups` | Rahbar guruhlari + kunlik davomat statistikasi | **yo'q** |
| `get_leader_groups`, `get_group_leader_groups` | ⤴︎ alias | **yo'q** |

Odatiy oqim: `get_attendance_bot_chat` → `get_attendance_groups` → `get_group_counterparties` → `create_attendance`.

---

## 3. Obyekt maydonlari

| Maydon | Tur | Izoh |
|---|---|---|
| `guid` | string (uuid) | Yozuv ID. Berilmasa server generatsiya qiladi. |
| `counterparties_id` | string (uuid) | Kontragent (FK → `counterparties.guid`, `ON DELETE SET NULL`). |
| `counterparties_group_id` | string (uuid) | Guruh (FK → `counterparties_group.guid`, `ON DELETE SET NULL`). |
| `status` | string (enum) | Davomat holati — faqat `present` / `absent` / `late`. |
| `description` | string | Izoh / sabab matni. |
| `date` | string (`YYYY-MM-DD`) | Davomat sanasi. |
| `plan_fakt_admins_id` | string (uuid) | Davomatni belgilagan admin (FK → `plan_fakt_admins.guid`). `user_id` dan yoziladi. |
| `company_id` | string (uuid) | Kompaniya. |
| `branch_id` | string (uuid) | Filial. |
| `created_at` / `updated_at` | string | Yaratilgan / yangilangan vaqti. |

`deleted_at` — soft delete ustuni; barcha query'lar `deleted_at IS NULL` bo'yicha filtrlanadi.

### Aliaslar

Frontend qulayligi uchun bir nechta nom qo'llab-quvvatlanadi:

| Kanonik maydon | Qabul qilinadigan aliaslar |
|---|---|
| `counterparties_group_id` | `counterparty_group_id`, `group_id` |
| `counterparties_id` (qator ichida) | `counterparty_id`, `counterparties_guid`, `guid` |
| `description` (qator ichida) | `opisanie`, `komentariy` |
| `status` (qator ichida) | uz/ru variantlari — [Statuslar](#statuslar) bo'limiga qarang |
| `user_id` | `plan_fakt_admins_id`, `admin_id` |
| Ro'yxat kaliti | `attendances`, `attendance`, `items`, `list`, `counterparties`, `data` |

### Statuslar

`status` faqat quyidagi **3 ta** qiymatni qabul qiladi (boshqasi yuborilsa so'rov xato bilan qaytadi):

| Qiymat | Ma'nosi | Qabul qilinadigan variantlar (registrga sezgir emas) |
|---|---|---|
| `present` | Keldi | `present`, `keldi`, `kelgan`, `пришел`, `пришёл`, `присутствовал` |
| `absent` | Kelmadi | `absent`, `kelmadi`, `не пришел`, `не пришёл`, `отсутствовал` |
| `late` | Kechikdi | `late`, `kechikdi`, `kech`, `опоздал` |

Variantlar kanonik ko'rinishga o'girilib saqlanadi — DB da har doim `present` / `absent` / `late`
turadi, ya'ni frontend faqat shu 3 ta qiymatni kutsa bo'ladi.

### Sana formati

`date` bo'sh kelsa — **bugungi sana** (`Asia/Tashkent` bo'yicha). Yuborilsa quyidagi formatlar
tushuniladi va `YYYY-MM-DD` ga keltiriladi:

`2006-01-02` · `2006-01-02T15:04:05Z07:00` (RFC3339) · `2006-01-02T15:04:05.000Z` · `2006-01-02 15:04:05`

---

## 4. `create_attendance` — Davomatni saqlash (upsert)

Bitta so'rovda guruhning bir kunlik davomati saqlanadi. Har bir kontragent uchun:

- o'sha **sanada** yozuv bor bo'lsa → **update** (status, description, guruh, admin qayta yoziladi);
- yo'q bo'lsa → yangi `guid` bilan **create**.

Shuning uchun bitta so'rovni bir necha marta yuborish dublikat yaratmaydi (idempotent).

> Mavjud yozuv `date` + `counterparties_id` (+ berilgan bo'lsa `company_id`/`branch_id`) bo'yicha
> qidiriladi — guruh bo'yicha emas. Ya'ni kontragent boshqa guruhga o'tkazilgan bo'lsa, o'sha kunlik
> yozuvi yangi guruhga ko'chadi, ikkinchi qator yaratilmaydi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Default | Izoh |
|---|---|---|---|---|
| `counterparties_group_id` | string (uuid) | **ha** | — | Guruh ID. |
| `attendances` | array | **ha** | — | Davomat qatorlari (quyida). Bo'sh bo'lsa xato. |
| `date` | string | yo'q | bugun | `Asia/Tashkent` bo'yicha bugungi sana. |
| `user_id` | string (uuid) | yo'q | — | `plan_fakt_admins_id` ga yoziladi. |
| `company_id` | string (uuid) | yo'q | — | Yozuvga saqlanadi va upsert scope'iga qo'shiladi. |
| `branch_id` | string (uuid) | yo'q | — | Yozuvga saqlanadi va upsert scope'iga qo'shiladi. |

#### `attendances[]` element maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `counterparties_id` | string (uuid) | **ha** | Kontragent ID. Bo'sh bo'lsa butun so'rov xato bilan qaytadi. |
| `status` | string (enum) | **ha** | `present` / `absent` / `late` (yoki ularning uz/ru varianti). Bo'sh bo'lsa xato. |
| `description` | string | yo'q | Izoh / sabab (mas., kechikish yoki kelmaslik sababi). |

Bitta `counterparties_id` ro'yxatda bir necha marta kelsa — **oxirgi qiymat** ishlatiladi.

### So'rov

```json
{
  "data": {
    "method": "create_attendance",
    "app_id": "APP_UUID",
    "object_data": {
      "counterparties_group_id": "3f1a9c40-...",
      "date": "2026-08-25",
      "user_id": "admin-uuid",
      "company_id": "company-uuid",
      "branch_id": "branch-uuid",
      "attendances": [
        { "counterparties_id": "c1-uuid", "status": "present", "description": "" },
        { "counterparties_id": "c2-uuid", "status": "absent",  "description": "Kasal" },
        { "counterparties_id": "c3-uuid", "status": "late",    "description": "15 daqiqa" }
      ]
    }
  }
}
```

Hammaga bir xil status qo'yiladigan bo'lsa, faqat guid'lar ro'yxatini ham yuborish mumkin —
`status`/`description` so'rovning yuqori darajasidan olinadi:

```json
{
  "data": {
    "method": "create_attendance",
    "object_data": {
      "counterparties_group_id": "3f1a9c40-...",
      "status": "present",
      "attendances": ["c1-uuid", "c2-uuid", "c3-uuid"]
    }
  }
}
```

### Javob

```json
{
  "success": true,
  "date": "2026-08-25",
  "counterparties_group_id": "3f1a9c40-...",
  "created": 2,
  "updated": 1,
  "message": "Attendance saved: 2 created, 1 updated",
  "data": [
    {
      "guid": "a1b2c3d4-...",
      "counterparties_id": "c1-uuid",
      "counterparties_group_id": "3f1a9c40-...",
      "date": "2026-08-25",
      "status": "present",
      "description": "",
      "plan_fakt_admins_id": "admin-uuid",
      "company_id": "company-uuid",
      "branch_id": "branch-uuid"
    }
  ]
}
```

| Javob maydoni | Izoh |
|---|---|
| `created` | Yangi yaratilgan yozuvlar soni. |
| `updated` | Yangilangan (mavjud) yozuvlar soni. |
| `data` | Saqlangan qatorlar (har birida yakuniy `guid`). |

**Xatolar:** `counterparties_group_id is required`, `attendances list is required`,
`counterparties_id is required for every attendance row`,
`attendance row <id>: status is required (present | absent | late)`,
`attendance row <id>: invalid status "..." (present | absent | late)`, `invalid date "..."`,
`failed to create attendance for counterparty <id>: ...`,
`failed to update attendance for counterparty <id>: ...`

> Ro'yxat o'rtasida xato chiqsa handler shu yerda to'xtaydi — undan oldingi qatorlar allaqachon
> saqlangan bo'ladi. Operatsiya idempotent bo'lgani uchun **o'sha so'rovni qayta yuborish** yetarli.

---

## 5. `get_group_counterparties` — Guruh o'quvchilari + kunlik davomat

Alias: `get_attendance_counterparties`.

Guruhga tegishli kontragentlar ro'yxatini qaytaradi va har biriga o'sha kundagi davomat holatini
qo'shadi. Davomat `LEFT JOIN` bilan biriktiriladi — hali belgilanmagan o'quvchi ham ro'yxatda
qoladi, faqat `status` `null` bo'ladi. Davomat belgilash ekranini bitta so'rov bilan to'ldirish
uchun mo'ljallangan.

- `not_student = true` bo'lgan kontragentlar (o'quvchi emaslar) **ro'yxatga kirmaydi**
  (`COALESCE(cp.not_student, false) = false`).
- `date` kelmasa — bugungi sana.
- Natija kontragent nomi (`nazvanie`) bo'yicha tartiblangan.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Default | Izoh |
|---|---|---|---|---|
| `counterparties_group_id` | string (uuid) | **ha** | — | Guruh ID. Aliaslar: `counterparty_group_id`, `group_id`. |
| `date` | string | yo'q | bugun | Qaysi kun davomati biriktiriladi. |
| `search` | string | yo'q | — | `nazvanie` yoki `polnoe_imya` bo'yicha `ILIKE '%search%'`. |
| `page` | int | yo'q | `1` | Sahifa raqami. |
| `limit` | int | yo'q | `100` | Maksimum `500`. |
| `company_id` | string (uuid) | yo'q | — | Berilsa kontragent va davomat filtriga qo'shiladi. |
| `branch_id` | string (uuid) | yo'q | — | Berilsa kontragent va davomat filtriga qo'shiladi. |

### So'rov

```json
{
  "data": {
    "method": "get_group_counterparties",
    "object_data": {
      "counterparties_group_id": "3f1a9c40-...",
      "company_id": "company-uuid",
      "branch_id": "branch-uuid"
    }
  }
}
```

### Javob

```json
{
  "success": true,
  "date": "2026-08-25",
  "counterparties_group_id": "3f1a9c40-...",
  "data": [
    {
      "counterparties_id": "c1-uuid",
      "nazvanie": "Aliyev Ali",
      "polnoe_imya": "Aliyev Ali Alievich",
      "counterparties_group_id": "3f1a9c40-...",
      "counterparties_group_nazvanie": "1-guruh",
      "is_marked": true,
      "attendance_id": "a1b2c3d4-...",
      "status": "present",
      "description": "",
      "date": "2026-08-25",
      "plan_fakt_admins_id": "admin-uuid"
    },
    {
      "counterparties_id": "c2-uuid",
      "nazvanie": "Valiyev Vali",
      "polnoe_imya": "Valiyev Vali Valievich",
      "counterparties_group_id": "3f1a9c40-...",
      "counterparties_group_nazvanie": "1-guruh",
      "is_marked": false,
      "attendance_id": null,
      "status": null,
      "description": "",
      "date": null,
      "plan_fakt_admins_id": null
    }
  ],
  "pagination": { "limit": 100, "page": 1, "total": 2, "totalPages": 1 }
}
```

| Javob maydoni | Izoh |
|---|---|
| `counterparties_id` | Kontragent (o'quvchi) ID — `create_attendance` ga shu ID yuboriladi. |
| `is_marked` | O'sha kunga davomat belgilanganmi (`attendance_id` mavjudmi). |
| `attendance_id` | Mavjud davomat yozuvi ID; belgilanmagan bo'lsa `null`. |
| `status` | `present` / `absent` / `late`; belgilanmagan bo'lsa `null`. |
| `date` | Davomat sanasi; belgilanmagan bo'lsa `null` (so'ralgan sana javobning yuqorisida `date` da turadi). |

**Xatolar:** `counterparties_group_id is required`, `invalid date "..."`,
`failed to fetch group counterparties: ...`, `failed to count group counterparties: ...`

---

## 6. `get_attendance_bot_chat` — `chat_id` bo'yicha bot foydalanuvchisi

Alias: `get_attendance_user_by_chat_id`.

Telegram bot faqat `chat_id` ni biladi. Bu metod `attendance_bot_chats` jadvalidan o'sha chatga
bog'langan qatorni topib, davomat API'lari uchun kerak bo'ladigan uchta qiymatni qaytaradi:
`plan_fakt_admins_id` → **`user_id`**, `company_id` va `branch_id`. Ya'ni javobdagi maydonlarni
to'g'ridan-to'g'ri `get_attendance_groups` / `get_group_counterparties` / `create_attendance` ning
`object_data` siga qo'yish mumkin.

### `attendance_bot_chats` jadvali

| Maydon | Tur | Izoh |
|---|---|---|
| `guid` | string (uuid) | Yozuv ID. |
| `chat_id` | string | Telegram chat ID (qidiruv kaliti). |
| `email` | string | Bog'langan admin emaili. |
| `plan_fakt_admins_id` | string (uuid) | Admin — javobda `user_id` nomi bilan qaytadi. |
| `company_id` | string (uuid) | Kompaniya. |
| `branch_id` | string (uuid) | Filial. |
| `created_at` / `updated_at` | string | Yaratilgan / yangilangan vaqti. |

`deleted_at IS NULL` bo'yicha filtrlanadi. Bitta `chat_id` ga bir nechta qator bo'lsa — **eng oxirgi**
(`created_at DESC`) qator olinadi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `chat_id` | string | **ha** | Telegram chat ID. Aliaslar: `chatId`, `telegram_chat_id`. |

### So'rov

```json
{
  "data": {
    "method": "get_attendance_bot_chat",
    "object_data": { "chat_id": "123456789" }
  }
}
```

### Javob

```json
{
  "success": true,
  "chat_id": "123456789",
  "user_id": "admin-uuid",
  "company_id": "company-uuid",
  "branch_id": "branch-uuid",
  "data": {
    "guid": "b0c1d2e3-...",
    "chat_id": "123456789",
    "email": "admin@example.com",
    "user_id": "admin-uuid",
    "company_id": "company-uuid",
    "branch_id": "branch-uuid",
    "created_at": "2026-08-20T10:00:00Z",
    "updated_at": "2026-08-20T10:00:00Z"
  }
}
```

`user_id` / `company_id` / `branch_id` yuqori darajada ham, `data` ichida ham qaytadi — qulay
bo'lganini oling. Yozuvda ustun bo'sh bo'lsa qiymat bo'sh satr (`""`) bo'ladi.

**Xatolar:** `chat_id is required`, `attendance bot chat not found for chat_id "..."`,
`failed to fetch attendance bot chat: ...`

---

## 7. `get_attendance_groups` — Rahbar guruhlari + kunlik davomat

Aliaslar: `get_leader_groups`, `get_group_leader_groups`. Handler —
[group_leaders.go](../functionsV2/group_leaders.go); to'liq tavsif:
[group_leaders_api.md](./group_leaders_api.md#5-get_leader_groups--rahbar-guruhlari--kunlik-davomat).

Foydalanuvchiga `group_leaders` orqali biriktirilgan guruhlar ro'yxatini qaytaradi va har bir guruh
uchun o'sha kundagi davomat statistikasini qo'shadi. Davomat belgilash ekranining birinchi qadami:
rahbar o'z guruhlarini ko'radi, keyin bittasini tanlab `get_group_counterparties` ga o'tadi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Default | Izoh |
|---|---|---|---|---|
| `user_id` | string (uuid) | **ha** | — | Rahbar (`plan_fakt_admins.guid`). Aliaslar: `plan_fakt_admins_id`, `admin_id`. |
| `date` | string | yo'q | bugun | Statistika qaysi kun bo'yicha hisoblanadi. |
| `company_id` | string (uuid) | yo'q | — | Berilsa `group_leaders.company_id` bo'yicha filtr. |
| `branch_id` | string (uuid) | yo'q | — | Berilsa `group_leaders.branch_id` bo'yicha filtr. |
| `page` | int | yo'q | `1` | Sahifa raqami. |
| `limit` | int | yo'q | `20` | Maksimum `500`. |

### So'rov

```json
{
  "data": {
    "method": "get_attendance_groups",
    "object_data": {
      "user_id": "admin-uuid",
      "company_id": "company-uuid",
      "branch_id": "branch-uuid"
    }
  }
}
```

### Javob

```jsonc
{
  "success": true,
  "date": "2026-08-25",
  "user_id": "admin-uuid",
  "company_id": "company-uuid",
  "branch_id": "branch-uuid",
  "data": [
    {
      "counterparties_group_id": "c117d17a-...",
      "nazvanie_gruppy": "Dezayn",
      "opisanie_gruppy": "Toshkent, ertalabki smena",
      "counterparties_count": 18,   // not_student = true bo'lmagan o'quvchilar soni
      "present_count": 12,
      "late_count": 3,
      "absent_count": 2,
      "marked_count": 17,           // present + late + absent
      "not_marked_count": 1         // counterparties_count - marked_count (manfiy bo'lmaydi)
    }
  ],
  "totals": {
    "groups_count": 1,
    "counterparties_count": 18,
    "present_count": 12,
    "late_count": 3,
    "absent_count": 2,
    "marked_count": 17,
    "not_marked_count": 1
  },
  "pagination": { "limit": 20, "page": 1, "total": 1, "totalPages": 1 }
}
```

### Hisoblash qoidalari

| Maydon | Qoida |
|---|---|
| Guruhlar ro'yxati | `group_leaders` da `plan_fakt_admins_id = user_id`, `deleted_at IS NULL`; bir guruh bir marta (`DISTINCT`), nomi bo'yicha A→Z. |
| `counterparties_count` | `counterparties` da guruhga tegishli, `deleted_at IS NULL` va `COALESCE(not_student, false) = false` bo'lganlar soni. |
| `present/late/absent_count` | `attendance` da o'sha guruh + `date` bo'yicha statuslar kesimidagi sonlar. |
| `not_marked_count` | `counterparties_count - marked_count` (0 dan kichik bo'lmaydi). |

**Xatolar:** `user_id is required`, `invalid date "..."`,
`failed to fetch leader groups: ...`, `failed to count group counterparties: ...`,
`failed to count group attendance: ...`

---

## 8. Xatolar jadvali

| Xabar | Sabab |
|---|---|
| `counterparties_group_id is required` | Guruh ID yuborilmagan (`create_attendance`, `get_group_counterparties`). |
| `attendances list is required` | Ro'yxat bo'sh yoki tanilmagan kalitda yuborilgan. |
| `counterparties_id is required for every attendance row` | Ro'yxatdagi qatorlardan birida kontragent ID yo'q. |
| `status is required (present \| absent \| late)` | Qatorda `status` yuborilmagan. |
| `invalid status "..." (present \| absent \| late)` | Ruxsat etilmagan status qiymati. |
| `invalid date "..."` | `date` qo'llab-quvvatlanmaydigan formatda. |
| `failed to fetch existing attendance: ...` | Upsert uchun mavjud yozuvlarni o'qishda DB xatosi. |
| `failed to create attendance for counterparty <id>: ...` | Yozuv yaratishda xato (mas., FK topilmadi). |
| `failed to update attendance for counterparty <id>: ...` | Yozuvni yangilashda xato. |
| `failed to fetch group counterparties: ...` / `failed to count group counterparties: ...` | `get_group_counterparties` query'sida DB xatosi. |
| `chat_id is required` | `get_attendance_bot_chat` ga `chat_id` yuborilmagan. |
| `attendance bot chat not found for chat_id "..."` | Shu `chat_id` uchun `attendance_bot_chats` da qator yo'q. |
| `failed to fetch attendance bot chat: ...` | Bot chat query'sida DB xatosi. |
| `user_id is required` | `get_attendance_groups` ga `user_id` yuborilmagan. |
| `failed to fetch leader groups: ...` / `failed to count group attendance: ...` | Rahbar guruhlari query'sida DB xatosi. |
| `ucode sdk is not initialized` | Ichki konfiguratsiya xatosi. |

---

## 9. Eslatmalar

- **Vaqt zonasi**: "bugun" har doim `Asia/Tashkent` bo'yicha hisoblanadi (zona yuklanmasa `UTC+5` ga tushadi).
- **Unique index**: DB da `(counterparties_id, date)` bo'yicha unique cheklov yo'q. Ayni paytda ikkita
  parallel `create_attendance` kelsa nazariy jihatdan dublikat qator paydo bo'lishi mumkin —
  o'qishda eng eski qator ishlatiladi. Kafolat kerak bo'lsa DB tomonida unique index qo'shish tavsiya etiladi.
