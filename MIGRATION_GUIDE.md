# Руководство по миграции на новую API архитектуру

## 🎯 Что изменилось

Мы перешли с использования Next.js API routes (прокси) на прямые вызовы U-code API через универсальный клиент.

### ❌ Старый подход (удален)
```
app/api/
├── operations/
│   ├── create/route.js      ❌ Удалено
│   ├── update/route.js      ❌ Удалено
│   ├── delete/route.js      ❌ Удалено
│   └── list/route.js        ❌ Удалено
├── counterparties/
│   ├── create/route.js      ❌ Удалено
│   └── update/route.js      ❌ Удалено
└── ...
```

### ✅ Новый подход
```
lib/api/ucode/
├── base.js                  ✅ Универсальный клиент
├── operations.js            ✅ API операций
├── counterparties.js        ✅ API контрагентов
└── ...
```

## 📝 Как мигрировать код

### 1. Импорты

#### Было:
```javascript
import { dashboardAPI } from '@/lib/api/dashboard'

// Использование
const data = await dashboardAPI.getOperations(params)
```

#### Стало:
```javascript
import { operationsAPI } from '@/lib/api/ucode/operations'

// Использование
const data = await operationsAPI.getList(params)
```

### 2. Хуки

#### Было:
```javascript
import { useOperations } from '@/hooks/useDashboard'

const { data } = useOperations(params)
```

#### Стало:
```javascript
import { useOperationsListNew } from '@/hooks/useDashboard'

const { data } = useOperationsListNew(params)
```

### 3. Мутации

#### Было:
```javascript
import { useCreateOperation } from '@/hooks/useDashboard'

const createMutation = useCreateOperation()
await createMutation.mutateAsync(data)
```

#### Стало:
```javascript
import { useCreateOperationNew } from '@/hooks/useDashboard'

const createMutation = useCreateOperationNew()
await createMutation.mutateAsync(data)
```

## 🔄 Таблица соответствия

### Операции (Operations)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getOperations()` | `operationsAPI.getList()` |
| `dashboardAPI.getOperationsList()` | `operationsAPI.getList()` |
| `dashboardAPI.createOperation()` | `operationsAPI.create()` |
| `dashboardAPI.updateOperation()` | `operationsAPI.update()` |
| `dashboardAPI.deleteOperation()` | `operationsAPI.delete()` |

### Контрагенты (Counterparties)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getCounterparties()` | `counterpartiesAPI.getList()` |
| `dashboardAPI.getCounterpartiesV2()` | `counterpartiesAPI.getCounterpartiesInvokeFunction()` |
| `dashboardAPI.createCounterparty()` | `counterpartiesAPI.create()` |
| `dashboardAPI.updateCounterparty()` | `counterpartiesAPI.update()` |
| `dashboardAPI.deleteCounterparties()` | `counterpartiesAPI.delete()` |

### Группы контрагентов (Counterparty Groups)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getCounterpartiesGroupsV2()` | `counterpartiesAPI.getCounterpartiesGroupInvokeFunction()` |
| `dashboardAPI.createCounterpartiesGroup()` | `counterpartiesAPI.createCounterpartyGroup()` |
| `dashboardAPI.updateCounterpartiesGroup()` | `counterpartiesAPI.updateCounterpartyGroup()` |
| `dashboardAPI.deleteCounterpartiesGroups()` | `counterpartiesAPI.deleteCounterpartyGroup()` |

### Банковские счета (Bank Accounts)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getBankAccounts()` | `bankAccountsAPI.getList()` |
| `dashboardAPI.getMyAccountsV2()` | `bankAccountsAPI.getBankAccountsInvokeFunction()` |
| `dashboardAPI.createMyAccount()` | `bankAccountsAPI.create()` |
| `dashboardAPI.updateMyAccount()` | `bankAccountsAPI.update()` |
| `dashboardAPI.deleteMyAccounts()` | `bankAccountsAPI.delete()` |

### Юридические лица (Legal Entities)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getLegalEntitiesV2()` | `legalEntitiesAPI.getLegalEntitiesInvokeFunction()` |
| `dashboardAPI.createLegalEntity()` | `legalEntitiesAPI.create()` |
| `dashboardAPI.updateLegalEntity()` | `legalEntitiesAPI.update()` |
| `dashboardAPI.deleteLegalEntities()` | `legalEntitiesAPI.delete()` |

### План счетов (Chart of Accounts)

| Старый метод | Новый метод |
|-------------|-------------|
| `dashboardAPI.getChartOfAccountsV2()` | `chartOfAccountsAPI.getChartOfAccountsInvokeFunction()` |
| `dashboardAPI.createChartOfAccounts()` | `chartOfAccountsAPI.createChartOfAccount()` |
| `dashboardAPI.updateChartOfAccounts()` | `chartOfAccountsAPI.updateChartOfAccount()` |
| `dashboardAPI.deleteChartOfAccounts()` | `chartOfAccountsAPI.deleteChartOfAccount()` |

## 🔍 Примеры миграции

### Пример 1: Получение списка операций

#### Было:
```javascript
// В компоненте
import { useOperationsList } from '@/hooks/useDashboard'

function OperationsPage() {
  const { data, isLoading } = useOperationsList({
    date_range: {
      start_date: '2026-01-01',
      end_date: '2026-12-31'
    },
    page: 1,
    limit: 20
  })
  
  const operations = data?.data?.data?.data || []
  // ...
}
```

#### Стало:
```javascript
// В компоненте
import { useOperationsListNew } from '@/hooks/useDashboard'
import { transformOperations } from '@/lib/utils/operations'

function OperationsPage() {
  const { data, isLoading } = useOperationsListNew({
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    },
    page: 1,
    limit: 20
  })
  
  const rawOperations = data?.data?.data?.data || []
  const operations = transformOperations(rawOperations)
  // ...
}
```

### Пример 2: Создание операции

#### Было:
```javascript
import { useCreateOperation } from '@/hooks/useDashboard'

function CreateOperationModal() {
  const createMutation = useCreateOperation()
  
  const handleSubmit = async (formData) => {
    await createMutation.mutateAsync({
      tip: ['Поступление'],
      summa: 1000,
      // ...
    })
  }
}
```

#### Стало:
```javascript
import { useCreateOperationNew } from '@/hooks/useDashboard'

function CreateOperationModal() {
  const createMutation = useCreateOperationNew()
  
  const handleSubmit = async (formData) => {
    await createMutation.mutateAsync({
      tip: ['Поступление'],
      summa: 1000,
      // ...
    })
  }
}
```

### Пример 3: Удаление записей

#### Было:
```javascript
import { useDeleteOperation } from '@/hooks/useDashboard'

const deleteMutation = useDeleteOperation()
await deleteMutation.mutateAsync([guid1, guid2])
```

#### Стало:
```javascript
import { useDeleteOperationsNew } from '@/hooks/useDashboard'

const deleteMutation = useDeleteOperationsNew()
await deleteMutation.mutateAsync([guid1, guid2])
```

## ⚠️ Важные изменения

### 1. Структура параметров

Некоторые параметры изменили названия для консистентности:

```javascript
// Было
{
  date_range: {
    start_date: '2026-01-01',
    end_date: '2026-12-31'
  }
}

// Стало
{
  dateRange: {
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  }
}
```

### 2. Структура ответа

Ответы теперь приходят напрямую от U-code API без дополнительных оберток:

```javascript
// Было
const operations = data?.data?.data?.data || []

// Стало
const operations = data?.data?.data?.data || []
// (структура осталась та же, но без промежуточного прокси)
```

### 3. Обработка ошибок

Ошибки теперь имеют единую структуру:

```javascript
try {
  await operationsAPI.create(data)
} catch (error) {
  console.error('Status:', error.status)
  console.error('Message:', error.message)
  console.error('Details:', error.details)
}
```

## 📋 Чеклист миграции

- [ ] Обновить импорты с `dashboardAPI` на прямые API модули
- [ ] Обновить хуки с старых на новые (`useOperations` → `useOperationsListNew`)
- [ ] Обновить параметры запросов (snake_case → camelCase где нужно)
- [ ] Проверить обработку ошибок
- [ ] Удалить неиспользуемые импорты
- [ ] Протестировать функционал

## 🚀 Преимущества новой архитектуры

1. **Меньше кода** - нет промежуточных API routes
2. **Быстрее** - прямые запросы к U-code API
3. **Проще поддержка** - единая точка входа
4. **Лучше типизация** - централизованная валидация
5. **Легче расширение** - автогенерация CRUD методов

## 📚 Дополнительные ресурсы

- [Полная документация](./lib/api/ucode/README.md)
- [Быстрый старт](./lib/api/ucode/QUICK_START.md)
- [Архитектура](./ARCHITECTURE_SUMMARY.md)

## 💡 Нужна помощь?

Если возникли вопросы при миграции:
1. Проверьте примеры в обновленных API модулях
2. Посмотрите на использование в `app/operations/page.jsx`
3. Изучите новые хуки в `hooks/useDashboard.js`

---

**Дата миграции:** 2026-02-19  
**Версия:** 1.0.0
