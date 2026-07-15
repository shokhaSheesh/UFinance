# Warehouse API (Склады)

Ombor (**sklad**) справочниги. Har bir sklad bitta **branch**ga tegishli — bitta branch bir nechta sklad tutishi mumkin. Sklad qoldiqlari (`stock_balances`) va harakatlar (`stock_movements`) `warehouse_id` bo'yicha kalitlanadi.

Skladlar `warehouse` jadvalida saqlanadi.

---

## Umumiy so'rov formati (envelope)

Barcha metodlar bitta HTTP endpointga **POST** qilinadi. Tanadagi `method` qaysi handlerni chaqirishni belgilaydi:

```json
{
  "data": {
    "method": "create_warehouse",
    "app_id": "APP_UUID",
    "object_data": {
      // ... biznes maydonlari (har bir metod uchun quyida)
    }
  }
}
```

- **`method`** — endpoint nomi (`create_warehouse`, `get_warehouse` / `get_warehouse_by_id`, `update_warehouse`, `delete_warehouse`, `list_warehouses`).
- **`app_id`** — majburiy (Ucode app id).
- **`object_data`** — biznes maydonlari. (Flat yuborsangiz ham qo'llab-quvvatlanadi, lekin `object_data` ichida yuborish tavsiya etiladi.)
- **`company_id`, `branch_id`, `user_id`** — avtorizatsiya kontekstidan (JWT/token) olinadi, avtomatik yoziladi. Ularni tanada yuborish shart emas (lekin `branch_id`ни tanada override qilsangiz bo'ladi).

### Javob formati

Muvaffaqiyat:
```json
{ "status": "success", "data": { /* handler natijasi */ } }
```

Xato:
```json
{ "status": "error", "data": { "message": "human-readable", "error": "details" } }
```

> Quyidagi namunalarda `data` ichidagi handler natijasi ko'rsatilgan.

---

## Sklad obyekti (maydonlar)

| Maydon | Tur | Izoh |
|---|---|---|
| `guid` | string (uuid) | Sklad ID. |
| `name` | string | Sklad nomi. |
| `address` | string | Manzil. |
| `comment` | string | Izoh. |
| `is_default` | bool | Branchning asosiy skladi. Poostavka `warehouse_id`siz kelsa, shu ishlatiladi. |
| `branch_id` | string (uuid) | Qaysi branchga tegishli. |
| `company_id` | string (uuid) | Kompaniya. |
| `created_at` | string | Yaratilgan vaqti. |

---

## 1. `create_warehouse` — Yaratish

Joriy branch uchun yangi sklad yaratadi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `name` | string | **ha** | Sklad nomi. Alias: `nazvanie`. |
| `address` | string | yo'q | Manzil. |
| `comment` | string | yo'q | Izoh. Aliaslar: `commentary`, `description`. |
| `is_default` | bool | yo'q | `true` bo'lsa branchning asosiy skladi. |
| `branch_id` | string (uuid) | yo'q | Kelmasa token'dagi branch ishlatiladi. |
| `guid` | string (uuid) | yo'q | Ixtiyoriy — o'zingiz bermsangiz avtomatik generatsiya qilinadi. |

### So'rov namunasi

```json
{
  "data": {
    "method": "create_warehouse",
    "app_id": "APP_UUID",
    "object_data": {
      "name": "Основной склад",
      "address": "Тошкент ш., Чилонзор 5",
      "comment": "Bosh ombor",
      "is_default": true
    }
  }
}
```

### Javob namunasi

```json
{
  "status": "success",
  "data": {
    "success": true,
    "data": {
      "guid": "wh-uuid",
      "name": "Основной склад",
      "address": "Тошкент ш., Чилонзор 5",
      "comment": "Bosh ombor",
      "is_default": true,
      "branch_id": "branch-uuid",
      "company_id": "company-uuid",
      "created_at": "2026-07-14T09:00:00Z"
    }
  }
}
```

> Yaratilgandan so'ng to'liq sklad obyekti `get_warehouse` orqali qaytariladi.

---

## 2. `get_warehouse` / `get_warehouse_by_id` — Bittasini olish

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `guid` | string (uuid) | **ha** | Sklad ID. Aliaslar: `id`, `warehouse_id`. |

### So'rov namunasi

```json
{
  "data": {
    "method": "get_warehouse_by_id",
    "app_id": "APP_UUID",
    "object_data": { "guid": "wh-uuid" }
  }
}
```

### Javob namunasi

```json
{
  "status": "success",
  "data": {
    "success": true,
    "data": {
      "guid": "wh-uuid",
      "name": "Основной склад",
      "address": "Тошкент ш., Чилонзор 5",
      "comment": "Bosh ombor",
      "is_default": true,
      "branch_id": "branch-uuid"
    }
  }
}
```

---

## 3. `update_warehouse` — Yangilash

Faqat **yuborilgan** maydonlar o'zgaradi; qolganlari saqlanadi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `guid` | string (uuid) | **ha** | Sklad ID. Aliaslar: `id`, `warehouse_id`. |
| `name` | string | yo'q | Yangi nom. Alias: `nazvanie`. |
| `address` | string | yo'q | Yangi manzil. |
| `comment` | string | yo'q | Yangi izoh. Aliaslar: `commentary`, `description`. |
| `is_default` | bool | yo'q | Asosiy sklad flagi. |
| `branch_id` | string (uuid) | yo'q | Branchni o'zgartirish. |

### So'rov namunasi

```json
{
  "data": {
    "method": "update_warehouse",
    "app_id": "APP_UUID",
    "object_data": {
      "guid": "wh-uuid",
      "name": "Ombor №2",
      "is_default": false
    }
  }
}
```

### Javob namunasi

`get_warehouse` bilan bir xil — yangilangan to'liq sklad obyektini qaytaradi.

---

## 4. `delete_warehouse` — O'chirish

Skladni o'chiradi. **Cheklov:** sklad hali qoldiq yoki harakatga ega bo'lsa (`stock_balances` yoki `stock_movements`da ishlatilgan bo'lsa) o'chirib bo'lmaydi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `guid` | string (uuid) | **ha** | Sklad ID. Aliaslar: `id`, `warehouse_id`. |

### So'rov namunasi

```json
{
  "data": {
    "method": "delete_warehouse",
    "app_id": "APP_UUID",
    "object_data": { "guid": "wh-uuid" }
  }
}
```

### Javob namunasi (muvaffaqiyat)

```json
{
  "status": "success",
  "data": { "success": true, "guid": "wh-uuid" }
}
```

### Javob namunasi (ishlatilayotgan bo'lsa)

```json
{
  "status": "error",
  "data": {
    "message": "this object is used and you can't delete it",
    "error": "this object is used and you can't delete it"
  }
}
```

---

## 5. `list_warehouses` — Ro'yxat

Joriy branchning skladlari. Asosiy sklad (`is_default`) birinchi, so'ng yaratilgan sana bo'yicha (`created_at ASC`) tartiblanadi.

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `branch_id` | string (uuid) | yo'q | Kelmasa token'dagi branch ishlatiladi. |

### So'rov namunasi

```json
{
  "data": {
    "method": "list_warehouses",
    "app_id": "APP_UUID",
    "object_data": {}
  }
}
```

### Javob namunasi

```json
{
  "status": "success",
  "data": {
    "success": true,
    "data": [
      {
        "guid": "wh-uuid-1",
        "name": "Основной склад",
        "address": "Тошкент ш., Чилонзор 5",
        "comment": "Bosh ombor",
        "is_default": true,
        "branch_id": "branch-uuid",
        "created_at": "2026-07-14T09:00:00Z"
      },
      {
        "guid": "wh-uuid-2",
        "name": "Ombor №2",
        "address": "",
        "comment": "",
        "is_default": false,
        "branch_id": "branch-uuid",
        "created_at": "2026-07-14T10:30:00Z"
      }
    ]
  }
}
```

## Метод → handler xaritasi

| `method` | Handler | Tavsif |
|---|---|---|
| `create_warehouse` | `CreateWarehouse` | Yangi sklad |
| `get_warehouse` | `GetWarehouseByID` | Bittasini olish |
| `get_warehouse_by_id` | `GetWarehouseByID` | Bittasini olish (alias) |
| `update_warehouse` | `UpdateWarehouse` | Yangilash |
| `delete_warehouse` | `DeleteWarehouse` | O'chirish (ishlatilmasa) |
| `list_warehouses` | `ListWarehouses` | Branch skladlari ro'yxati |
