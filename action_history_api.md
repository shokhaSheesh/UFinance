# История действий API (frontend uchun)

Kuzatiladigan jadvallardagi har bir o'zgarish uchun **kim**, **qachon** va **nima qilgani**
yozib boriladi. Hodisa matni backend'da tayyor holda, **uch tilda** saqlanadi —
frontend uni faqat ko'rsatadi, yig'ish yoki tarjima qilish kerak emas.

Handler **functionsV2** da.

---

## 1. Umumiy so'rov formati

```jsonc
POST /
{
  "data": {
    "method": "list_action_history",
    "object_data": {
      "page": 1,
      "limit": 20
    }
  }
}
```

`get_action_history` — o'sha metodning aliasi.

---

## 2. `list_action_history` — jurnal ro'yxati

### So'rov maydonlari

Barchasi ixtiyoriy.

| Maydon       | Turi   | Izoh                                                                     |
| ------------ | ------ | ------------------------------------------------------------------------ |
| `page`       | int    | sahifa, default `1`                                                       |
| `limit`      | int    | sahifadagi yozuvlar, default `20`, maksimum `200`                         |
| `lang`       | string | `uz` \| `ru` \| `en` — `event` maydoni shu tilda qaytadi, default `ru`    |
| `user_id`    | string | «Пользователь» filtri — `plan_fakt_admins` guid'i                         |
| `date_from`  | string | «Дата события» boshi, **`YYYY-MM-DD`**                                    |
| `date_to`    | string | «Дата события» oxiri, **`YYYY-MM-DD`** (shu kun ham kiradi)               |
| `date`       | string | bitta kun uchun qisqartma (`date_from` + `date_to` o'rniga)               |
| `search`     | string | «Поиск по событиям» — hodisa matni va foydalanuvchi bo'yicha qidiruv      |
| `table_slug` | string | jadval bo'yicha filtr (quyidagi ro'yxat)                                  |
| `action`     | string | `create` \| `update` \| `delete`                                          |
| `record_id`  | string | bitta yozuvning butun tarixi (masalan bitta operatsiya kartochkasi uchun) |

> `date_from` / `date_to` faqat `YYYY-MM-DD` formatida qabul qilinadi — boshqa format
> e'tiborsiz qoldiriladi (filtr qo'llanmaydi, xato qaytmaydi).

### So'rov namunasi

```jsonc
POST /
{
  "data": {
    "method": "list_action_history",
    "object_data": {
      "page": 1,
      "limit": 20,
      "lang": "ru",
      "user_id": "8f1c…",
      "date_from": "2026-09-01",
      "date_to": "2026-09-03",
      "search": "операция"
    }
  }
}
```

### Javob

```jsonc
{
  "status": "success",
  "data": {
    "success": true,
    "lang": "ru",
    "data": [
      {
        "guid": "…",
        "plan_fakt_admins_id": "8f1c…",
        "user_name": "s.oburjon@udevs.io",
        "table_slug": "operations",
        "record_id": "…",
        "action": "update",
        "event": "Операция — … изменена на операция — …",
        "event_uz": "Operatsiya — … quyidagiga o'zgartirildi: operatsiya — …",
        "event_ru": "Операция — … изменена на операция — …",
        "event_en": "Operation — … changed to: operation — …",
        "event_time": "2026-09-03T13:16:13Z",
        "created_at": "2026-09-03T13:16:13Z"
      }
    ],
    "pagination": { "limit": 20, "page": 1, "total": 137, "totalPages": 7 }
  }
}
```

| Maydon                | Izoh                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `user_name`           | «Пользователь» ustuni — login yoki email                                |
| `event`               | «Событие» ustuni — `lang` bo'yicha tanlangan tayyor matn                |
| `event_uz/ru/en`      | uchala til (tilni frontend'da almashtirish uchun)                       |
| `event_time`          | «Дата и время» ustuni, UTC (RFC3339) — mahalliy vaqtga formatlanadi     |
| `table_slug`, `record_id`, `action` | filtr va yozuv kartochkasiga o'tish uchun                |

Ro'yxat **`event_time` bo'yicha kamayish tartibida** qaytadi va joriy `company_id` /
`branch_id` doirasi bilan cheklanadi. Xato holatida ham `success: true` va bo'sh `data`
qaytadi — sahifa buzilmaydi.

---

## 3. `table_slug` qiymatlari

Filtr uchun ro'yxat (chapda — qiymat, o'ngda — UI'dagi nomi):

| `table_slug`                | Bo'lim                        |
| --------------------------- | ----------------------------- |
| `operations`                | Операции                      |
| `chart_of_accounts`         | Учётные статьи                |
| `counterparties`            | Контрагенты                   |
| `counterparties_group`      | Группы контрагентов           |
| `legal_entity`              | Юрлица                        |
| `my_accounts`               | Мои счета                     |
| `account_groups`            | Группы счетов                 |
| `product_and_service`       | Товары и услуги               |
| `group_product_and_service` | Группы товаров и услуг        |
| `sales_status`              | Статусы сделок                |
| `sales_transactions`        | Сделки по продажам            |
| `purchase_transactions`     | Сделки по закупкам            |
| `warehouse`                 | Склады                        |
| `stock_balances`            | Остатки на складе             |
| `stock_movements`           | Движения по складу            |
| `stock_balance_histories`   | История остатков              |
| `warehouse_transfers`       | Перемещения между складами    |
| `project_groups`            | Группы проектов               |
| `projects`                  | Проекты                       |
| `budgets`                   | Бюджеты                       |
| `budget_plans`              | Планы бюджета                 |

---

## 4. Hodisa matni ko'rinishi

Matn yozuv maydonlaridan yig'iladi: havolalar nomga aylantirilgan, summalar valyuta kodi
bilan, sanalar `kun.oy.yil` ko'rinishida. `update` da eski va yangi holat bitta qatorda
ko'rinadi.

```
create (ru): Добавлена операция — тип: Поступление, дата оплаты: 03.09.2026,
             оплата: подтверждена, счет: asdsd, назначение платежа: -, сумма: 342.00 RUB,
             дата начисления: 03.09.2026, начисление: подтверждено, контрагент: Не выбран,
             статья: Нераспределенный доход, проект: Не выбран

update (ru): Операция — … сумма: 35 434 534.46 RUB … изменена на операция — … сумма: 334.46 RUB …

delete (ru): Удалена операция — тип: Поступление, … сумма: 342.00 RUB, …
```

```
uz: Operatsiya qo'shildi — turi: Поступление, to'lov sanasi: 03.09.2026, …
en: Operation added — type: Поступление, payment date: 03.09.2026, …
```

To'ldirilmagan maydon `-`, tanlanmagan havola `Не выбран` / `Tanlanmagan` / `Not selected`
ko'rinishida chiqadi.
