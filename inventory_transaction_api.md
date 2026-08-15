# Inventory Transaction API (Инвентаризация)

Skladdagi **faktik sanoqni** (инвентаризация) buxgalteriya bilan moslashtiruvchi operatsiya. So'rovdagi `type` yo'nalishni belgilaydi:

| `type` | Ma'nosi | Sklad | Buxgalteriya |
|---|---|---|---|
| `"in"` | **Излишки** (ortiqcha chiqdi) | tovar **qo'shiladi** | sklad statyasi debet, so'rovdagi statya kredit |
| `"out"` | **Недостача** (kam chiqdi) | tovar **ayriladi** | so'rovdagi statya debet, sklad statyasi kredit |

**Отгрузка**/**Поставка**dan farqi: bu yerda alohida hujjat operatsiyasi yaratilmaydi — yaratilgan operatsiyaning o'zi `tip = "Начисление"` bo'lgan **начисление**dir (`createShipmentCOGSAccrual` dagi себестоимость начислениеsi kabi). Sanalgan qatorlar shu operatsiyaga `product_and_service` sifatida (`operations_id` orqali) bog'lanadi, har bir qator esa `stock_movements` ledgerida iz qoldiradi.

Statyalar (double-entry) aynan quyidagicha joylashadi:

```
type = "in"   →  chart_of_accounts_id   = sklad chart_of_accounts_id
                 chart_of_accounts_id_2 = so'rovdagi chart_of_accounts_id

type = "out"  →  chart_of_accounts_id   = so'rovdagi chart_of_accounts_id
                 chart_of_accounts_id_2 = sklad chart_of_accounts_id
```

---

## Umumiy so'rov formati (envelope)

```json
{
  "data": {
    "method": "create_inventory_transaction",
    "app_id": "APP_UUID",
    "object_data": {
      // ... biznes maydonlari (quyida)
    }
  }
}
```

- **`method`** — `create_inventory_transaction` (alias: `create_inventarization`).
- **`app_id`** — majburiy (Ucode app id).
- **`object_data`** — biznes maydonlari. (Flat yuborsangiz ham qo'llab-quvvatlanadi.)
- **`company_id`, `branch_id`, `user_id`** — avtorizatsiya kontekstidan (JWT/token) olinadi, avtomatik yoziladi. Tanada yubormang.

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

## `create_inventory_transaction` — Inventarizatsiya yaratish

### `object_data` maydonlari

| Maydon | Tur | Majburiy | Izoh |
|---|---|---|---|
| `type` | string | **ha** | `"in"` yoki `"out"`. Qabul qilinadigan variantlar: `in`, `kirim`, `приход`, `излишки`, `surplus` → **in**; `out`, `chiqim`, `расход`, `недостача`, `shortage`, `writeoff`, `write_off` → **out**. Registr va bo'shliqlar ahamiyatsiz; massiv (`["in"]`) ham bo'ladi. |
| `warehouses_id` | string (uuid) | **ha** | Sklad. Alias: `warehouse_id`. Skladda `chart_of_accounts_id` bo'lishi shart. |
| `product_and_service_data` | array | **ha** | Sanalgan qatorlar (quyida). Kamida 1 ta. |
| `chart_of_accounts_id` | string (uuid) | yo'q | Qarshi tomon statyasi. Berilmasa: `in` → **Нераспределенный доход**, `out` → **Нераспределенный расход**. Aliaslar: `chartOfAccountsId`, `categoryId`, `category_id`, `statiya_id`. |
| `currenies_id` | string (uuid) | yo'q | Valyuta. Aliaslar: `currencies_id`, `currency_id`. Yoki `currency_code` (masalan `"UZS"`). Berilmasa **UZS**. |
| `legal_entity_id` | string (uuid) | yo'q | Yuridik shaxs. Aliaslar: `legalEntityId`, `legalEntityID`. |
| `data_nachislenie` | string `YYYY-MM-DD` | yo'q | Sanoq sanasi. Berilmasa **bugungi** sana. Aliaslar: `date`, `operationDate`, `shipment_date`, `data_otgruzki`. Zaxira: `data_oplaty`. |
| `description` | string | yo'q | Izoh (`opisanie`). Aliaslar: `comment`, `opisanie`. |
| `projects_id` | string (uuid) | yo'q | Loyiha. Aliaslar: `project_id`, `projectId`. Loyiha **"Завершен"** bo'lsa — xato. |

### Sanalgan qator (`product_and_service_data[i]`)

| Maydon | Tur | Izoh |
|---|---|---|
| `product_and_service_id` | string (uuid) | **Katalogdagi mahsulot id'si** — sklad qoldig'i shu bo'yicha hisoblanadi. Bo'lmasa qator yoziladi, lekin qoldiqqa **ta'sir qilmaydi**. Aliaslar: `productId`, `id`, `key`. |
| `Kol_vo` | number | Miqdor (musbat bo'lishi shart). Alias: `quantity`. |
| `TSena_za_ed` | number | Birlik narxi. Alias: `price_per_unit`. `out` uchun **e'tiborga olinmaydi** (o'rtacha tannarx ishlatiladi). |
| `Summa` | number | Qator summasi. Berilmasa `Kol_vo * TSena_za_ed - Skidka` hisoblanadi. Alias: `amount`. |
| `Skidka` | number | Chegirma. Alias: `discount`. |
| `NDS` | number | QQS. Alias: `nds`. |
| `Naimenovanie` | string | Nomi. Katalogdan avtomatik to'ldiriladi. Aliaslar: `name`, `naimenovanie`. |
| `Artikul` | string | Artikul. Katalogdan avtomatik to'ldiriladi. Alias: `article`. |
| `unit_of_measurement_id` | string (uuid) | O'lchov birligi. Katalogdan avtomatik to'ldiriladi. |

---

### Namuna 1 — `in` (излишки: skladga qo'shish)

```json
{
  "data": {
    "method": "create_inventory_transaction",
    "app_id": "APP_UUID",
    "object_data": {
      "type": "in",
      "warehouses_id": "wh-1111-2222-3333",
      "chart_of_accounts_id": "coa-income-4444",
      "currenies_id": "uzs-currency-uuid",
      "legal_entity_id": "d597e800-2643-4446-8d69-5b35bd6b208b",
      "data_nachislenie": "2026-08-15",
      "description": "Avgust inventarizatsiyasi — ortiqcha",
      "product_and_service_data": [
        {
          "product_and_service_id": "ps-1111",
          "Naimenovanie": "Sement M400",
          "Kol_vo": 10,
          "TSena_za_ed": 50000
        }
      ]
    }
  }
}
```

Natijada yaratiladi:
- `operations` — `tip: ["Начисление"]`, `chart_of_accounts_id` = **sklad** statyasi, `chart_of_accounts_id_2` = `coa-income-4444`, `summa: 500000`, `amount_uzs: 500000`;
- `product_and_service` — 1 qator (`operations_id` = shu operatsiya);
- `stock_movements` — `type: "in"`, 10 dona, birlik tannarxi 50000 → skladning o'rtacha tannarxi qayta tortiladi.

### Namuna 2 — `out` (недостача: skladdan ayirish)

```json
{
  "data": {
    "method": "create_inventory_transaction",
    "app_id": "APP_UUID",
    "object_data": {
      "type": "out",
      "warehouses_id": "wh-1111-2222-3333",
      "chart_of_accounts_id": "coa-expense-5555",
      "currency_code": "UZS",
      "data_nachislenie": "2026-08-15",
      "product_and_service_data": [
        { "product_and_service_id": "ps-1111", "Kol_vo": 3 }
      ]
    }
  }
}
```

Bu yerda narx yuborilmagan — hisoblash skladning **o'rtacha tannarxi** bo'yicha ketadi (masalan 48 000 so'm → `amount_uzs: 144000`). Statyalar teskari: `chart_of_accounts_id` = `coa-expense-5555`, `chart_of_accounts_id_2` = **sklad** statyasi.

### Javob namunasi

```json
{
  "status": "success",
  "data": {
    "success": true,
    "message": "Inventory transaction created successfully",
    "transaction_guid": "9f0a1b2c-3d4e-5f60-7a8b-9c0d1e2f3a4b",
    "type": "out",
    "products_linked": 1,
    "summa": 144000,
    "amount_uzs": 144000
  }
}
```

| Javob maydoni | Izoh |
|---|---|
| `transaction_guid` | Yaratilgan **Начисление** operatsiyasining guid'i. |
| `type` | Normallashtirilgan yo'nalish: `"in"` yoki `"out"`. |
| `products_linked` | Bog'langan mahsulot qatorlari soni. |
| `amount_uzs` | Skladda **haqiqatda ko'chgan** qiymat, UZS'da. |
| `summa` | O'sha qiymat so'rov valyutasida (`amount_uzs / kurs`). |

> **Diqqat:** `summa` so'rovdagi narxlar yig'indisidan farq qilishi mumkin — `out` doim o'rtacha tannarx bo'yicha baholanadi, shuningdek sklad hisobiga tushmaydigan qatorlar (xizmatlar, katalog id'siz qatorlar) summaga qo'shilmaydi.

---

## Yaratilgan operatsiya maydonlari

Frontend `operations` ro'yxatida bu yozuvni quyidagicha ko'radi:

| Maydon | Qiymat |
|---|---|
| `tip` | `["Начисление"]` |
| `chart_of_accounts_id` / `chart_of_accounts_id_2` | Yuqoridagi jadval bo'yicha (yo'nalishga qarab) |
| `warehouse_id` | So'rovdagi sklad |
| `data_operatsii`, `data_nachisleniya` | Sanoq sanasi |
| `summa`, `amount_uzs`, `exchange_rate`, `exchange_rate_date` | Ko'chgan qiymat va kurs snapshot'i |
| `payment_accrual` | `true` |
| `accrual_status` | `["confirmed"]` |
| `payment_status` | `["pending"]` |
| `oplata_podtverzhdena`, `payment_confirmed` | `false` (bu начисление, to'lov emas) |
| `plan_fakt_admins_id` | So'rovni yuborgan user |

---

## Xatoliklar

| Holat | `data.message` |
|---|---|
| `app_id` yo'q | `app_id is required` |
| `type` yo'q yoki noto'g'ri | `type is required and must be either "in" or "out"` |
| Qatorlar yo'q | `product_and_service_data is required` |
| Sklad yo'q | `warehouses_id is required` |
| Skladda statya yo'q | `warehouse [<guid>] has no chart_of_accounts_id` |
| Statya yo'q va default ham topilmadi | `chart_of_accounts_id is required` |
| `out`da qoldiq yetarli emas | `not enough stock in warehouse [<guid>] to write off the counted quantity` |
| Loyiha yopilgan | `project is completed (Завершен), operation is not allowed` |
| Operatsiya yaratilmadi | `failed to create inventory accrual via SDK: ...` |

Xato formati:
```json
{ "status": "error", "data": { "message": "warehouses_id is required", "error": "..." } }
```

> Xato qaytganda **hech narsa yaratilmaydi** — validatsiya va qoldiq tekshiruvi operatsiya yozilishidan oldin bajariladi.

---

## Muhim eslatmalar (frontend uchun)

1. **Baholash qoidasi.**
   - `in` — qator narxi bo'yicha (`Summa` yoki `Kol_vo * TSena_za_ed - Skidka`); narx berilmasa (0) skladning **joriy o'rtacha tannarxi** ishlatiladi. Manfiy narx yuborilsa moduli olinadi — yo'nalishni faqat `type` belgilaydi.
   - `out` — **doim** o'rtacha tannarx (средневзвешенная); yozib chiqarish o'rtacha tannarxni o'zgartirmaydi.
2. **Qoldiq tekshiruvi (`out`).** Sanoq sanasidagi qoldiq **va o'sha sanadan keyingi barcha qoldiqlar** manfiyga tushmasligi tekshiriladi (orqaga sanali kiritish uchun). Yetmasa — operatsiya ham, sklad harakati ham yaratilmaydi.
3. **Faqat tovarlar.** Katalogda statusi **"товар"** bo'lgan pozitsiyalargina qoldiqqa ta'sir qiladi. Xizmatlar qator sifatida bog'lanadi, lekin sklad va summaga kirmaydi.
4. **`branch_id` shart.** Qoldiq `(mahsulot × sklad)` kesimida yuritiladi va filialsiz kontekstda sklad harakati yozilmaydi (qator baribir bog'lanadi). Token filialga bog'langan bo'lsin.
5. **Orqaga sana (backdate).** `data_nachislenie` o'tgan sana bo'lsa, harakat o'sha sanaga qo'yiladi va undan keyingi barcha harakatlar/qoldiqlar qayta hisoblanadi (replay) — o'rtacha tannarx vaqt bo'ylab to'g'ri qoladi.
6. **Valyuta.** `currency_code` yoki `currenies_id` yuborish mumkin; kurs snapshot'i (`exchange_rate`, `amount_uzs`) avtomatik hisoblanadi. Sklad qiymatlari doim **UZS**da saqlanadi.
7. **Hisobotlar.** Operatsiya `Начисление` bo'lgani uchun **cash flow'ga tushmaydi** (pul harakati yo'q) va P&L'ning **kassa (cash)** metodida ham hisobga olinmaydi; P&L'ning **начисление (accrual)** metodida `data_nachisleniya` sanasi bo'yicha hisobga olinadi.
8. **Update/Delete hozircha yo'q.** Xato kiritilgan inventarizatsiyani `delete_operation` bilan o'chirish operatsiyani olib tashlaydi, lekin **sklad harakatini qaytarmaydi** — tuzatish uchun teskari yo'nalishda (`in` ↔ `out`) yangi inventarizatsiya yarating.
9. **company_id / branch_id / user_id** avtorizatsiyadan olinadi — tanada yubormang.
