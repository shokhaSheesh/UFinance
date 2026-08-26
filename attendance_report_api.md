# Attendance Report API (Davr bo'yicha davomat hisoboti)

`get_attendance_report` — belgilangan davr (`from_date`..`to_date`) uchun o'quvchilar ro'yxatini va
har birining shu oraliqdagi davomat yozuvlarini qaytaradi. Handler **functionsV2** da
([attendance.go](../functionsV2/attendance.go)), registratsiya —
[handlers.go](../functionsV2/handlers.go).

Davomat belgilash metodlari (`create_attendance`, `get_group_counterparties`,
`get_attendance_groups`, `get_attendance_bot_chat`) alohida hujjatda:
[attendance_api.md](./attendance_api.md).

> **Auth**: bu metod — davomat oilasidagi yagona **avtorizatsiya talab qiladigan** metod.
> Kontragentlar va davomat yozuvlari **token'dagi** `company_id` / `branch_id`
> (`request.company_id`, `request.branch_id`) bo'yicha scope qilinadi; bu qiymatlarni so'rov
> tanasidan berib bo'lmaydi.

---

## 1. Umumiy so'rov formati (envelope)

```jsonc
POST /
{
  "data": {
    "method": "get_attendance_report",
    "object_data": {
      "from_date": "2026-08-01",
      "to_date": "2026-08-25"
    }
  }
}
```

Javob `data` ichiga o'raladi:

```jsonc
{
  "status": "success",
  "data": {
    "success": true,
    "data": [ /* ... */ ]
  }
}
```

Xato:

```jsonc
{
  "status": "error",
  "data": { "message": "invalid date \"2026-13-01\"", "error": "..." }
}
```

> Quyida faqat handlerning ichki natijasi (`status:"success"` ichidagi `data`) ko'rsatiladi.

---

## 2. Kim ro'yxatga tushadi

Kontragent (o'quvchi) ro'yxatga faqat quyidagi shartlar bajarilganda kiradi:

| Shart | SQL |
|---|---|
| O'chirilmagan | `cp.deleted_at IS NULL` |
| Guruhga biriktirilgan | `cp.counterparties_group_id IS NOT NULL` |
| O'quvchi (xodim/kontragent emas) | `COALESCE(cp.not_student, false) = false` |
| Auth scope | `cp.company_id = <token>` va `cp.branch_id = <token>` (qiymat bo'lsa) |

Qo'shimcha filtrlar — `counterparties_group_ids` va `search` — shu shartlar ustiga qo'shiladi.

Oraliqda davomat yozuvi **bo'lmagan** o'quvchi ham ro'yxatda qoladi: `attendances` bo'sh massiv
(`[]`), `attendances_count` — `0`.

---

## 3. `object_data` maydonlari

| Maydon | Tur | Majburiy | Default | Izoh |
|---|---|---|---|---|
| `from_date` | string | yo'q | bugun | Oraliq boshi. Aliaslar: `date_from`, `start_date`, `date`. |
| `to_date` | string | yo'q | bugun | Oraliq oxiri (**ichiga oladi**). Aliaslar: `date_to`, `end_date`, `date`. |
| `counterparties_group_ids` | array (uuid) | yo'q | — | Guruhlar filtri. Bitta ID (`counterparties_group_id`), `group_ids`, `group_id` ham qabul qilinadi. |
| `search` | string | yo'q | — | `nazvanie` yoki `polnoe_imya` bo'yicha `ILIKE '%search%'`. Aliaslar: `searchString`, `search_string`. |
| `page` | int | yo'q | `1` | Sahifa raqami. |
| `limit` | int | yo'q | `20` | Maksimum `500`. Paginatsiya **kontragentlar** bo'yicha. |

### Sana formati

`from_date` / `to_date` bo'sh kelsa — **bugungi sana** (`Asia/Tashkent`), ya'ni bir kunlik oraliq.
Yuborilsa quyidagi formatlar tushuniladi va `YYYY-MM-DD` ga keltiriladi:

`2006-01-02` · `2006-01-02T15:04:05Z07:00` (RFC3339) · `2006-01-02T15:04:05.000Z` · `2006-01-02 15:04:05`

`from_date` `to_date` dan katta bo'lsa — so'rov xato bilan qaytadi (avtomatik almashtirilmaydi).

### Statuslar

Davomat `status` maydoni har doim quyidagi 3 ta kanonik qiymatdan biri bo'ladi:

| Qiymat | Ma'nosi |
|---|---|
| `present` | Keldi |
| `absent` | Kelmadi |
| `late` | Kechikdi |

---

## 4. So'rov namunasi

```json
{
  "data": {
    "method": "get_attendance_report",
    "object_data": {
      "from_date": "2026-08-01",
      "to_date": "2026-08-25",
      "counterparties_group_ids": ["c117d17a-9159-4136-958b-aba527338124"],
      "search": "Javohir",
      "page": 1,
      "limit": 20
    }
  }
}
```

Butun davr bo'yicha, filtrsiz (auth scope'dagi barcha o'quvchilar):

```json
{
  "data": {
    "method": "get_attendance_report",
    "object_data": { "from_date": "2026-08-01", "to_date": "2026-08-31" }
  }
}
```

---

## 5. Javob

```json
{
  "success": true,
  "from_date": "2026-08-01",
  "to_date": "2026-08-25",
  "counterparties_group_ids": ["c117d17a-9159-4136-958b-aba527338124"],
  "data": [
    {
      "counterparties_id": "023c75be-f2ab-45d6-b94d-c13eb12a5b4f",
      "nazvanie": "Javohir Komilov",
      "polnoe_imya": "Javohir Komilov",
      "counterparties_group_id": "c117d17a-9159-4136-958b-aba527338124",
      "counterparties_group": {
        "guid": "c117d17a-9159-4136-958b-aba527338124",
        "nazvanie_gruppy": "Dezayn",
        "opisanie_gruppy": "Toshkent, ertalabki smena"
      },
      "attendances_count": 2,
      "attendances": [
        {
          "attendance_id": "a1b2c3d4-...",
          "date": "2026-08-24",
          "status": "present",
          "description": "",
          "plan_fakt_admins_id": "admin-uuid"
        },
        {
          "attendance_id": "e5f6a7b8-...",
          "date": "2026-08-25",
          "status": "late",
          "description": "20 daqiqa kechikdi",
          "plan_fakt_admins_id": "admin-uuid"
        }
      ]
    },
    {
      "counterparties_id": "77274a22-25e6-4c08-88db-586b662c8e53",
      "nazvanie": "Muxlisa Xoliyorova",
      "polnoe_imya": "",
      "counterparties_group_id": "c117d17a-9159-4136-958b-aba527338124",
      "counterparties_group": {
        "guid": "c117d17a-9159-4136-958b-aba527338124",
        "nazvanie_gruppy": "Dezayn",
        "opisanie_gruppy": "Toshkent, ertalabki smena"
      },
      "attendances_count": 0,
      "attendances": []
    }
  ],
  "pagination": { "limit": 20, "page": 1, "total": 2, "totalPages": 1 }
}
```

### Maydonlar

| Maydon | Tur | Izoh |
|---|---|---|
| `from_date` / `to_date` | string | Amalda ishlatilgan (normalizatsiya qilingan) oraliq. |
| `counterparties_group_ids` | array | Amalda qo'llangan guruh filtri (bo'sh — filtr yo'q). |
| `counterparties_id` | string (uuid) | O'quvchi ID. |
| `nazvanie` / `polnoe_imya` | string | O'quvchi nomi / to'liq ismi. |
| `counterparties_group_id` | string (uuid) | Guruh ID. |
| `counterparties_group` | object | Guruh ma'lumoti: `guid`, `nazvanie_gruppy`, `opisanie_gruppy`. |
| `attendances` | array | Oraliqdagi davomat yozuvlari — **sana bo'yicha o'sish tartibida**. |
| `attendances_count` | int | `attendances` uzunligi. |
| `pagination` | object | `limit`, `page`, `total`, `totalPages` — **kontragentlar** bo'yicha. |

#### `attendances[]` elementi

| Maydon | Tur | Izoh |
|---|---|---|
| `attendance_id` | string (uuid) | `attendance.guid`. |
| `date` | string `YYYY-MM-DD` | Davomat sanasi. |
| `status` | string | `present` / `absent` / `late`. |
| `description` | string | Izoh / sabab. |
| `plan_fakt_admins_id` | string (uuid) | Davomatni belgilagan admin. |

### Saralash

Kontragentlar `nazvanie` bo'yicha A→Z (bo'sh nomlar oxirida), ichidagi `attendances` esa sana
bo'yicha eskidan yangiga.

---

## 6. Xatolar

| Xabar | Sabab |
|---|---|
| `invalid date "..."` | `from_date` yoki `to_date` qo'llab-quvvatlanmaydigan formatda. |
| `from_date (...) cannot be after to_date (...)` | Oraliq teskari berilgan. |
| `failed to fetch counterparties: ...` | Kontragentlar query'sida DB xatosi. |
| `failed to count counterparties: ...` | Kontragentlar sanog'ida DB xatosi. |
| `failed to fetch attendance rows: ...` | Davomat query'sida DB xatosi. |
| `ucode sdk is not initialized` | Ichki konfiguratsiya xatosi. |

---

## 7. Eslatmalar

- **Vaqt zonasi**: default sana (`from_date`/`to_date` berilmaganda) `Asia/Tashkent` bo'yicha
  hisoblanadi (zona yuklanmasa `UTC+5`).
- **Ikki query**: avval sahifadagi kontragentlar olinadi, so'ng faqat **o'sha** kontragentlar uchun
  bitta davomat query'si bajariladi. Ya'ni davomat qatorlari soni sahifa hajmiga bog'liq.
- **Himoya chegarasi**: davomat query'si `kunlar × kontragentlar` sonidan oshmaydi va eng ko'pi
  bilan 20 000 qator o'qiydi. Juda uzun oraliqda `limit` ni kichikroq qilib sahifalab oling.
- **Davomat scope'i**: davomat yozuvlari ham `company_id`/`branch_id` bo'yicha filtrlanadi —
  yozuv boshqa filialda yaratilgan bo'lsa hisobotga tushmaydi.
