# Projects & Project Groups API (frontend uchun)

`projects` (Проекты) va `project_groups` (Группы проектов) CRUD. Barcha handlerlar **functionsV2** (test/prod V2) da.

---

## 1. Umumiy so'rov formati

Barcha chaqiruvlar bitta endpoint'ga **POST** qilinadi. Method `data.method` orqali tanlanadi, maydonlar `data.object_data` ichida yuboriladi.

```jsonc
POST /
{
  "data": {
    "method": "create_project",     // handler nomi (quyidagi jadvalda)
    "app_id": "<APP_ID>",           // majburiy (mutatsiya qiluvchi metodlar uchun)
    "object_data": {                 // metod parametrlari shu yerda
      "name": "..."
    }
  }
}
```

> `object_data` bo'lmasa, `data` ning o'zi parametr sifatida o'qiladi — lekin har doim `object_data` ishlating.

### Javob formati

**Muvaffaqiyat** — handler natijasi `data` ichiga o'raladi:

```jsonc
{
  "status": "success",
  "data": {
    "success": true,
    "data": { /* ... */ }
  }
}
```

**Xato**:

```jsonc
{
  "status": "error",
  "data": {
    "message": "project is completed (Завершен), operation is not allowed",
    "error": "..."
  }
}
```

> Quyida faqat handlerning ichki natijasi (`status:"success"` ichidagi `data`) ko'rsatiladi.

---

## 2. Statuslar (projects)

| Status | Ma'nosi | Qachon o'rnatiladi |
|---|---|---|
| `Плановый` | Rejalashtirilgan | Create paytida (default); yoki operatsiya qolmaganda avtomatik |
| `В работе` | Ishda | Birinchi operatsiya bog'langanda avtomatik; yoki status toggle |
| `Завершен` | Yakunlangan | Faqat `update_project_status` orqali qo'lda |

`start_date` / `end_date` — proyektga bog'langan operatsiyalarning eng erta / eng kech `data_operatsii` sanasi bo'yicha **avtomatik** boshqariladi (pastdagi "Operatsiya bilan bog'liqlik" bo'limiga qarang).

---

## 3. Method'lar ro'yxati

| Method | Tavsif |
|---|---|
| `create_project_group` | Guruh yaratish |
| `update_project_group` | Guruhni yangilash |
| `delete_project_group` | Guruhni o'chirish |
| `get_project_group` | Guruhni ID bo'yicha olish |
| `list_project_groups` | Guruhlar ro'yxati |
| `create_project` | Proyekt yaratish |
| `update_project` | Proyektni yangilash |
| `delete_project` | Proyektni o'chirish |
| `update_project_status` | Proyekt statusini o'zgartirish |
| `get_project` | Proyektni ID bo'yicha olish |
| `list_projects` | Proyektlar ro'yxati (filter + pagination) |

---

## 4. Project Groups

### 4.1 `create_project_group`

**object_data:**

| Maydon | Tip | Majburiy | Izoh |
|---|---|---|---|
| `name` | string | ✅ | Guruh nomi |
| `description` | string | ❌ | Izoh |

```jsonc
{ "method": "create_project_group", "app_id": "...", "object_data": {
  "name": "Marketing", "description": "Marketing bo'limi proyektlari"
}}
```

**Javob:**
```jsonc
{ "success": true, "message": "Project group created successfully",
  "data": { "guid": "b1a2..." } }
```

### 4.2 `update_project_group`

Partial update — faqat yuborilgan maydonlar yangilanadi.

| Maydon | Tip | Majburiy |
|---|---|---|
| `guid` | string | ✅ |
| `name` | string | ❌ (yuborilsa bo'sh bo'lmasligi kerak) |
| `description` | string | ❌ |

```jsonc
{ "method": "update_project_group", "app_id": "...", "object_data": {
  "guid": "b1a2...", "name": "Marketing 2026"
}}
```

**Javob:** `{ "success": true, "message": "Project group updated successfully" }`

### 4.3 `delete_project_group`

| Maydon | Tip | Majburiy |
|---|---|---|
| `guid` | string | ✅ |

> Guruh o'chirilsa, unga bog'langan proyektlarning `project_groups_id` si `NULL` bo'ladi (FK `ON DELETE SET NULL`).

**Javob:** `{ "success": true, "message": "Project group deleted successfully" }`

### 4.4 `get_project_group`

| Maydon | Tip | Majburiy |
|---|---|---|
| `guid` | string | ✅ |

**Javob:**
```jsonc
{ "success": true, "data": {
  "guid": "b1a2...", "name": "Marketing", "description": "...",
  "created_at": "2026-07-27T10:00:00Z", "updated_at": "2026-07-27T10:00:00Z"
}}
```

### 4.5 `list_project_groups`

| Maydon | Tip | Default | Izoh |
|---|---|---|---|
| `page` | int | 1 | Sahifa |
| `limit` | int | 20 | Har sahifada |

**Javob:**
```jsonc
{ "success": true,
  "data": [ { "guid": "...", "name": "...", "description": "...", "created_at": "...", "updated_at": "..." } ],
  "pagination": { "limit": 20, "page": 1, "total": 5, "totalPages": 1 }
}
```

---

## 5. Projects

### 5.1 `create_project`

**object_data:**

| Maydon | Tip | Majburiy | Izoh |
|---|---|---|---|
| `name` | string | ✅ | Proyekt nomi |
| `project_groups_id` | uuid | ❌ | Guruh (FK) |
| `description` | string | ❌ | Izoh |

> `status` avtomatik `"Плановый"` bo'ladi. `start_date` / `end_date` — `NULL`. Bularni create paytida yuborish shart emas (e'tiborga olinmaydi).

```jsonc
{ "method": "create_project", "app_id": "...", "object_data": {
  "name": "Landing sayt", "project_groups_id": "b1a2...", "description": "Yangi landing"
}}
```

**Javob:**
```jsonc
{ "success": true, "message": "Project created successfully",
  "data": { "guid": "c3d4...", "status": "Плановый" } }
```

### 5.2 `update_project`

Partial update — nom, guruh, izoh. **Status bu yerda o'zgarmaydi** (buning uchun `update_project_status`).

| Maydon | Tip | Majburiy | Izoh |
|---|---|---|---|
| `guid` | string | ✅ | |
| `name` | string | ❌ | yuborilsa bo'sh bo'lmasligi kerak |
| `project_groups_id` | uuid \| "" | ❌ | `""` yuborilsa bog'lanish uziladi (NULL) |
| `description` | string | ❌ | |

```jsonc
{ "method": "update_project", "app_id": "...", "object_data": {
  "guid": "c3d4...", "name": "Landing sayt v2", "project_groups_id": ""
}}
```

**Javob:** `{ "success": true, "message": "Project updated successfully" }`

### 5.3 `delete_project`

| Maydon | Tip | Majburiy |
|---|---|---|
| `guid` | string | ✅ |

> Proyekt o'chirilsa, unga bog'langan operatsiyalarning `projects_id` si `NULL` bo'ladi (FK `ON DELETE SET NULL`).

**Javob:** `{ "success": true, "message": "Project deleted successfully" }`

### 5.4 `update_project_status`

Proyekt statusini o'zgartiradi. Ikki rejim:

1. **Explicit** — `status` yuborilsa, o'sha qiymatga o'rnatiladi (validatsiya: `Плановый` / `В работе` / `Завершен`).
2. **Toggle** — `status` yuborilmasa, joriy statusga qarab almashtiriladi:
   - `В работе` → `Завершен`
   - `Завершен` → `В работе`
   - `Плановый` → `В работе`

| Maydon | Tip | Majburiy | Izoh |
|---|---|---|---|
| `guid` | string | ✅ | |
| `status` | string | ❌ | `Плановый` \| `В работе` \| `Завершен` |

```jsonc
// Toggle
{ "method": "update_project_status", "app_id": "...", "object_data": { "guid": "c3d4..." } }

// Explicit (yakunlash)
{ "method": "update_project_status", "app_id": "...", "object_data": { "guid": "c3d4...", "status": "Завершен" } }
```

**Javob:**
```jsonc
{ "success": true, "message": "Project status updated successfully",
  "data": { "guid": "c3d4...", "status": "Завершен" } }
```

### 5.5 `get_project`

Aggregation query — guruh nomi (`project_group_name`) bilan birga qaytadi.

| Maydon | Tip | Majburiy |
|---|---|---|
| `guid` | string | ✅ |

**Javob:**
```jsonc
{ "success": true, "data": {
  "guid": "c3d4...",
  "name": "Landing sayt",
  "description": "Yangi landing",
  "status": "В работе",
  "project_groups_id": "b1a2...",
  "project_group_name": "Marketing",
  "start_date": "2026-07-10",
  "end_date": "2026-07-27",
  "created_at": "2026-07-01T09:00:00Z",
  "updated_at": "2026-07-27T12:00:00Z"
}}
```

### 5.6 `list_projects`

Aggregation query (list + count alohida). Barcha filterlar **ixtiyoriy**.

| Maydon | Tip | Default | Izoh |
|---|---|---|---|
| `page` | int | 1 | Sahifa |
| `limit` | int | 20 | Har sahifada |
| `project_groups_id` | uuid | — | Guruh bo'yicha |
| `project_ids` | uuid[] | — | Bir nechta proyekt GUID (`p.guid IN (...)`) |
| `status` | string | — | `Плановый` / `В работе` / `Завершен` |
| `search` | string | — | `name` bo'yicha ILIKE (qism-so'z) |
| `start_from_date` | date | — | `start_date >= ` (YYYY-MM-DD) |
| `start_to_date` | date | — | `start_date <= ` |
| `end_from_date` | date | — | `end_date >= ` |
| `end_to_date` | date | — | `end_date <= ` |

```jsonc
{ "method": "list_projects", "app_id": "...", "object_data": {
  "page": 1, "limit": 20,
  "status": "В работе",
  "project_ids": ["c3d4...", "e5f6..."],
  "search": "landing",
  "start_from_date": "2026-01-01", "start_to_date": "2026-12-31"
}}
```

**Javob:**
```jsonc
{ "success": true,
  "data": [
    {
      "guid": "c3d4...", "name": "Landing sayt", "description": "...",
      "status": "В работе", "project_groups_id": "b1a2...", "project_group_name": "Marketing",
      "start_date": "2026-07-10", "end_date": "2026-07-27",
      "created_at": "...", "updated_at": "..."
    }
  ],
  "pagination": { "limit": 20, "page": 1, "total": 42, "totalPages": 3 }
}
```
