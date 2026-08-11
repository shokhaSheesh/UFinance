# `get_my_currencies` API

Joriy **filialning hisoblarida (Мои счета) haqiqatan ishlatilayotgan** valyutalarни qaytaradi — barcha valyutalar ro'yxatini emas, faqat kamida bitta hisobга biriktirilganларини (distinct).

> Farqi: `get_currencies` — tizimдаги **barcha** valyutalar (kurslari bilan). `get_my_currencies` — faqat filialда **ishlatiladigan** valyutalar. Valyuta selektorларини faqat mavjud valyutalar bilan to'ldirish uchun qulay.

## So'rov

```
POST https://<gateway-host>/
Content-Type: application/json
environment-id: <ENVIRONMENT_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

```json
{
  "data": {
    "method": "get_my_currencies",
    "object_data": {}
  }
}
```

### Kirish maydonlari

**Yo'q.** `branch_id` va `company_id` avtomatik joriy kontekstдан (token/tanlangan filial) olinadi.

## Muvaffaqiyatli javob (200)

```json
{
  "status": "success",
  "data": {
    "success": true,
    "data": [
      { "guid": "cur-guid-uzs", "kod": "UZS", "nazvanie": "O'zbek so'mi" },
      { "guid": "cur-guid-usd", "kod": "USD", "nazvanie": "Dollar SShA" }
    ]
  }
}
```

| Maydon | Turi | Izoh |
|---|---|---|
| `guid` | string | Valyuta ID — boshqa API'ларда `currenies_id` / `currencyCode` uchun ishlatiladi |
| `kod` | string | Valyuta kodi (`UZS`, `USD`, ...) |
| `nazvanie` | string | Valyuta nomi |

> Ro'yxat filial hisoblarида ishlatilган valyutалар bo'yicha **distinct** (takrorланмайди). Hisob yo'q bo'lsa — bo'sh massiv.

## Xatoliklar

| Xabar | Sabab |
|---|---|
| `branch_id is required` | Filial konteksti aniqлanmади (token/filial tanланмаган) |
| `failed to fetch currencies: ...` | O'qishda xatolik |

## Ishlatilishi

- **Hisobot valyutasi selektори** (`cash_flow`, `profit_and_loss`, `balance_report`, `get_counterparties`) — foydalanuvchiga faqat o'zида mavjud valyutаларни ko'rsatish.
- **Operatsiya/bitim valyutаси** tanlashда filial doirасидаги valyutаларни filtrlash.

> `get_currencies` bilan farqi: bu yerда **kurs (`rate`) qaytmaydi** — faqat identifikator, kod va nom. Kurs kerak bo'lsa `get_currencies` ishlating.
