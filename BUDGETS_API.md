# Budgets API (frontend)

Barcha so'rovlar bitta gateway endpointга **POST** qilinadi. Metod `data.method` orqali tanlanadi.

## Umumiy so'rov konverti

```json
{
  "data": {
    "method": "<method_name>",
    "app_id": "<APP_ID>",
    "object_data": { /* metodga xos maydonlar */ }
  }
}
```

## Umumiy javob konverti

Muvaffaqiyat:
```json
{ "status": "success", "data": { /* handler qaytargan obyekt (quyida "Javob") */ } }
```

Xato:
```json
{ "status": "error", "data": { "message": "...", "error": "..." } }
```

> Quyida har metod uchun **"Javob"** deb ko'rsatilgani — `status:success` ичидаги `data` obyekti.

---

## 1. `create_budget` — byudjet yaratish

**object_data:**

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `name` | string | ✅ | |
| `legal_entity_id` | uuid | ✅ | |
| `type` | string \| string[] | ✅ | `"pnl"` yoki `"cashflow"` (yaratilgach o'zgармайди) |
| `description` | string | — | |
| `currenies_id` | uuid | — | Byudjet valyutasi (hisobot shu valyutada) |
| `start_date` | date `YYYY-MM-DD` | — | |
| `end_date` | date `YYYY-MM-DD` | — | |
| `projects_id` | uuid | ⚠️ | `projects_id` **yoki** `project_groups_id` — **aynan bittasi** |
| `project_groups_id` | uuid | ⚠️ | ikkinchisi avtomatik `null` bo'ladi |

**So'rov:**
```json
{ "data": { "method": "create_budget", "app_id": "...", "object_data": {
  "name": "Q1 byudjet",
  "legal_entity_id": "1f0b...",
  "type": ["pnl"],
  "currenies_id": "8a2c...",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "projects_id": "3d54..."
}}}
```

**Javob:**
```json
{ "success": true, "message": "Budget created successfully", "data": { "guid": "b1..." } }
```

---

## 2. `update_budget` — byudjetni yangilash (partial)

Faqat yuborilgan maydonlar yangilanadi.

**object_data:**

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `guid` | uuid | ✅ | Byudjet id'si |
| `name` | string | — | bo'sh bo'lsa xato |
| `description` | string | — | |
| `legal_entity_id` | uuid | — | bo'sh bo'lsa xato |
| `currenies_id` | uuid | — | bo'sh `""` → `null` |
| `start_date` | date | — | bo'sh `""` → `null` |
| `end_date` | date | — | bo'sh `""` → `null` |
| `projects_id` / `project_groups_id` | uuid | — | biror biri yuborilsa — aynan bittasi, ikkinchisi `null` |
| `type` | — | — | **e'tiborsiz** (o'zgармайди) |

**So'rov:**
```json
{ "data": { "method": "update_budget", "app_id": "...", "object_data": {
  "guid": "b1...",
  "name": "Q1 byudjet (yangilangan)",
  "project_groups_id": "9f77..."
}}}
```

**Javob:**
```json
{ "success": true, "message": "Budget updated successfully" }
```

---

## 3. `delete_budget` — byudjetni o'chirish

**object_data:** `{ "guid": "<uuid>" }` (majburiy)

**Javob:**
```json
{ "success": true, "message": "Budget deleted successfully" }
```

---

## 4. `list_budgets` — byudjetlar ro'yxati

**object_data (barchasi ixtiyoriy):**

| Maydon | Tur | Izoh |
|---|---|---|
| `page` | int | default `1` |
| `limit` | int | default `20` |
| `search` | string | `name` bo'yicha ILIKE |
| `types` / `type` | string[] \| string | `pnl` / `cashflow` |
| `legal_entity_ids` | uuid[] | |
| `projects_ids` | uuid[] | |
| `project_groups_ids` | uuid[] | |

**So'rov:**
```json
{ "data": { "method": "list_budgets", "app_id": "...", "object_data": {
  "page": 1, "limit": 20,
  "search": "Q1",
  "types": ["pnl"],
  "legal_entity_ids": ["1f0b..."]
}}}
```

**Javob:**
```json
{
  "success": true,
  "data": [
    {
      "guid": "b1...",
      "name": "Q1 byudjet",
      "description": "",
      "type": ["pnl"],
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-03-31T00:00:00Z",
      "legal_entity_id": "1f0b...",
      "legal_entity_name": "ООО Тест",
      "currenies_id": "8a2c...",
      "currency_code": "UZS",
      "projects_id": "3d54...",
      "project_name": "Loyiha A",
      "project_groups_id": "",
      "project_group_name": "",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

## 5. `create_budget_plan` — reja yozish (upsert)

Bitta tugunning bitta oyi uchun plan summasini yozadi.
**(budgets_id, oy, id)** uchligi bor bo'lsa — `amount` yangilanadi, aks holda yangi qator.

**object_data:**

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `budgets_id` | uuid | ✅ | |
| `id` | string | ✅ | Hisobot tugun `id`'si — `chart_of_accounts` guid **yoki** sintetik id (masalan `"revenue"`, `"main-expenses"`, `"net-profit"` ...). `get_budget_plan` javobidagi `rows[].id` va `details[].id` dan olinadi |
| `date` | date `YYYY-MM-DD` | ✅ | Ichki avtomatik oyning **1-sanasiga** normalizatsiya qilinadi (bir oyga bitta qator) |
| `amount` | number | ✅ | Plan summasi |

**So'rov:**
```json
{ "data": { "method": "create_budget_plan", "app_id": "...", "object_data": {
  "budgets_id": "b1...",
  "id": "revenue",
  "date": "2026-02-01",
  "amount": 150000
}}}
```

**Javob:**
```json
{ "success": true, "message": "Budget plan created successfully", "data": { "guid": "p1...", "updated": false } }
```
> Mavjud bo'lsa: `"message": "Budget plan updated successfully"`, `"updated": true`.

---

## 6. `get_budget_plan` — reja/fakt hisoboti

Byudjet `type`'iga qarab **ProfitAndLoss** (`pnl`) yoki **CashFlow** (`cashflow`) ko'rinishidagi to'liq daraxt.
Farqi: hisobotlardan farqli o'laroq **barcha statya** (operatsiyasiz bo'lsa ham) ko'rinadi va har tugunga `plan` qo'shiladi.

Filtrlar byudjetdan olinadi: davr = `start_date..end_date`, `legal_entity_id`, `currenies_id`, va `projects_id` (bo'lsa) yoki `project_groups_id` (bo'lsa — guruhdagi barcha loyihalar).

**object_data:** `{ "budgets_id": "<uuid>" }` (majburiy)

**So'rov:**
```json
{ "data": { "method": "get_budget_plan", "app_id": "...", "object_data": { "budgets_id": "b1..." } } }
```

**Javob (struktura):**
```json
{
  "success": true,
  "data": {
    "budgets_id": "b1...",
    "type": "pnl",
    "currency_code": "UZS",
    "period": { "start_date": "2026-01-01", "end_date": "2026-07-01" },
    "legend": [
      { "key": "2026-01", "title": "Январь 2026", "startDate": "2026-01-01", "endDate": "2026-01-31" }
    ],
    "rows": [ /* daraxt — quyida */ ]
  },
  "user_id": "..."
}
```

### `rows[]` tugun (rekursiv)

| Maydon | Tur | Izoh |
|---|---|---|
| `id` | string | Tugun id'si (chart_of_accounts guid yoki sintetik). **`create_budget_plan.id` shu yerdan** |
| `name` | string | |
| `type` | string | `account` / `category` / `income` / `expense` / `result` / `percent` ... |
| `level` | int | Ierarxiya darajasi |
| `values` | map | `{ "2026-01": 47000.19, ... }` — **fakt** (oylik) |
| `months` | map | `values` bilan bir xil (legacy) |
| `totalValue` | number | fakt jami |
| `total` | number | `totalValue` bilan bir xil |
| `plan` | object | reja + reja/fakt ko'rsatkichlari (quyida) |
| `details` | array | bola tugunlar (agar bo'lsa) |

### `plan` obyekti

Umumiy (davr) qiymatlar + har oy uchun (`legend` kalitlari bo'yicha, 0 bo'lsa ham) bir xil to'plam:

| Maydon | Formula |
|---|---|
| `by` | shu tugun `id`'siga o'sha oyга yozilgan reja (`budget_plans.amount`) |
| `total` | `by` + bolalarning `total` (daraxt roll-up) |
| `profit` | `total(plan) − fakt` |
| `profit_percentage` | `plan / fakt × 100` |
| `distinction_percentage` | `plan / (plan − fakt) × 100` |

> `fakt` = tugunning ProfitAndLoss/CashFlow qiymati: umumiyда `totalValue`, oylikда `values[oy]`. Bo'luvchi 0 bo'lsa foizlar `0`.
> Umumiy `by`/`total` = oylar bo'yicha yig'indi.

**Namuna tugun:**
```json
{
  "id": "8eee2782-d60e-414c-bbfc-ff3cb22e2173",
  "name": "Прочие доходы",
  "type": "account",
  "level": 1,
  "values": { "2026-01": 0, "2026-02": 0, "2026-04": 47000.19 },
  "months": { "2026-01": 0, "2026-02": 0, "2026-04": 47000.19 },
  "totalValue": 47000.19,
  "total": 47000.19,
  "plan": {
    "by": 50,
    "total": 150,
    "profit": 102.81,
    "profit_percentage": 0.32,
    "distinction_percentage": -1.46,
    "2026-02": { "by": 50, "total": 150, "profit": 150, "profit_percentage": 0, "distinction_percentage": 100 },
    "2026-04": { "by": 0, "total": 0, "profit": -47000.19, "profit_percentage": 0, "distinction_percentage": 0 }
  },
  "details": [
    {
      "id": "98d7df3b-4f86-478c-b0e1-b2cbd9d374dc",
      "name": "Курсовая разница (+)",
      "type": "account",
      "level": 2,
      "values": { "2026-04": 47000.19 },
      "totalValue": 47000.19,
      "total": 47000.19,
      "plan": { "by": 100, "total": 100, "profit": ..., "2026-02": { ... } }
    }
  ]
}
```

---

## Frontend oqimi (reja qo'yish)

1. `get_budget_plan` — daraxtni oladi (har tugunda `values`=fakt, `plan`=reja).
2. Foydalanuvchi biror tugun (`rows[].id` / `details[].id`) va oy uchun reja summasini kiritadi.
3. `create_budget_plan` — `{ budgets_id, id: <tugun id>, date: <oy 1-sana>, amount }` yuboradi (upsert).
4. `get_budget_plan` ni qayta chaqirib yangilangan `plan`ni ko'rsatadi.
