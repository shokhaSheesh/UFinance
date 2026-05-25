# CLAUDE.md — UFinance (Plan-Fact) Frontend

> Complete reference for AI agents. Read fully before making any changes.

---

## 1. Project Overview

**UFinance (Plan-Fact)** is a B2B financial management dashboard built for Uzbek-speaking businesses.
It manages operations (income/expense/transfer/accrual/shipment), counterparties, bank accounts, deals, reports, and indicators. **All UI text is in Russian.** The app name shown to users is **"UFinance"**.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1 — App Router, React 19 |
| Language | JavaScript/JSX (TypeScript only in `components/ui/` and config files) |
| Client State | MobX 6 — `makeAutoObservable` + `mobx-persist-store` (localStorage) |
| Server State | TanStack React Query v5 |
| UI Library | MUI 7 + TailwindCSS 4 + shadcn/ui |
| Styling | SCSS Modules + global `_variables.scss` |
| Charts | ECharts 6 (complex), Chart.js 4 (simple), Recharts 3 (dashboards) |
| HTTP | Custom `UcodeAPIClient` in `lib/api/ucode/base.js` — **primary** |
| HTTP (legacy) | Axios instance in `lib/axios.js` — used by `lib/api/dashboard.js` only |
| Forms | React Hook Form 7 |
| Tables | Material React Table 3, TanStack React Table 8 |
| Icons | Lucide React, MUI Icons, React Icons |
| i18n | `next-intl` — message files in `messages/ru.json` and `messages/uz.json` |
| Notifications | Custom DOM-injection (`utils/notifications.js`) |
| Analytics | Firebase (`lib/firebase.js`) |
| Font | Roboto via `next/font/google` |

---

## 3. Full Project Structure

```
app/
  (pages)/              # All authenticated feature pages
    layout.jsx          # Wraps pages with AppProvider + ClientLayout
    operations/         # Operations list page
    deals/
      page.jsx          # Deals list
      [id]/page.jsx     # Single deal details (tabs: products, receipts, expenses, shipments)
    directories/
      accounts/         # Bank accounts list
      counterparties/   # Counterparties list + detail
      legal-entities/   # Legal entities
      product-service/  # Products & services catalog
      transaction-categories/ # Chart of accounts
    reports/
      balance/          # Balance sheet report
      cashflow/         # Cash flow report
      profit-and-loss/  # P&L report
      students/         # Students report (education-specific)
    indicators/         # KPI indicators dashboard
    settings/
      page.jsx          # General settings (currency, accrual date method)
      profile/          # User profile
      users/            # User management
      role/             # Role & permissions management
      branches/         # Branches management
      currencies/       # Exchange rates
      contract/         # Contract settings
    (plans)/            # Planning module pages
  auth/                 # Login & register pages (unauthenticated)
  payment/              # Payment pages (unauthenticated)
  ClientLayout.jsx      # Client wrapper: renders Sidebar + Header, guards auth
  layout.jsx            # Root layout (font, metadata, QueryClientProvider)
  page.jsx              # Redirects to /operations

components/
  Header/               # App top header bar
  Sidebar/              # Left navigation sidebar (permission-aware)
  Indicators/           # KPI indicator card components
  LoadingScreen/        # Full-page loading screen
  PageLoader/           # Inline page loader
  PageSearchbar/        # Global page search bar
  ReadyComponents/      # Reusable pre-built components
  common/               # Generic UI: DatePicker, Modal, Select, TreeSelect
  ui/                   # shadcn/ui base components (TypeScript, kebab-case)
  shared/               # Cross-feature: CustomModal, Checkbox, FilterSidebar, etc.
  deals/
    FilterSidebar/      # Deals list filter panel (uses sealDeal store)
    details/            # Deal detail tab components:
      IncomeOperationsTable/   # Income operations tab table
      ExpenseOperationTable/   # Expense operations tab table
      ProductServiceTable/     # Products/services tab table
      ShipmenTable/            # Shipments tab table (note: typo in dir name)
      EmptyState/              # Empty state with conditional Add button (canAdd prop)
      CommentChat/             # Comments/attachments panel
      CreateProductService/    # Create product/service form
      CreatingShipment/        # Create shipment form
      Status/                  # Deal status badge
      TableRows/               # Shared table row components
  operations/
    OperationModal/     # Create/edit operation modal (income, payout, transfer, accrual, shipment)
    OperationsTable/    # Main operations list table
    OperationsFiltersSidebar/ # Filter sidebar for operations
    OperationsHeader/   # Operations page header
    OperationsFooter/   # Operations page footer
    TableRow/           # Single operation row
    PriceStatus/        # Payment/accrual status badge
  reports/
    balance/FilterSidebar/     # Balance report filters (balanceStore)
    cashflow/FilterSidebar/    # Cash flow report filters (cashFlowStore)
    profit-and-loss/FilterSidebar/ # P&L report filters (pnlStore)
  directories/          # Directory-specific UI (AccountMenu, CategoryMenu, etc.)

modules/
  operations/list-page/ # Operations page module (main operations logic)
  deals/                # Deals list module
  directories/          # Directory modules (accounts, counterparties, etc.)
  plans/                # Planning module
  payment/              # Payment module

hooks/
  useAuth.js            # useLogin, useRegister mutations
  useDashboard.js       # All React Query hooks (see Section 6)
  useAccountsFilter.js  # Accounts page filter state logic
  useAccountsModals.js  # Accounts page modal open/close logic
  useOperationComments.js # Operation comments & file attachments
  useSaleComments.js    # Deal (sale) comments & attachments
  usePageSearch.js      # Global search logic
  usePaginatedData.js   # Generic pagination helper
  useSentinel.js        # IntersectionObserver for infinite scroll sentinel
  useMounted.js         # SSR hydration guard (returns false until mounted)
  useLocaleSwitcher.js  # Language switcher (ru/uz)
  useReportT.js         # Report-specific translation helper

store/
  auth.store.js         # Auth: token, user, branches, isAuthenticated
  app.store.js          # Global: currency, permissions, isAccrualDate, isPayment
  operationFilter.store.js # Operations page filters (persisted)
  saleDeal.store.js     # Deals page filters + accounting method
  accounts.store.js     # Accounts directory filters
  counterparties.store.js  # Counterparties detail filters
  indicatos.store.js    # Indicators page state
  reports.store.js      # Shared reports state
  language.store.js     # UI language selection
  student.store.js      # Students report filters

lib/
  api/ucode/base.js     # UcodeAPIClient class + ucodeRequest() + apiClient singleton
  api/ucode/operations.js      # Operations API methods
  api/ucode/counterparties.js  # Counterparties API methods
  api/ucode/bankAccounts.js    # Bank accounts API methods
  api/ucode/chartOfAccounts.js # Chart of accounts API methods
  api/ucode/currencies.js      # Currencies API methods
  api/ucode/legalEntities.js   # Legal entities API methods
  api/ucode/balance.js         # Balance report API methods
  api/ucode/cashflow.js        # Cashflow report API methods
  api/ucode/profitAndLoss.js   # P&L report API methods
  api/ucode/sales.js           # Sales/deals API methods
  api/dashboard.js      # DEPRECATED — legacy Axios-based API wrappers, do not add new calls here
  axios.js              # Axios instance with baseURL=/api and Bearer token
  dtos/
    operationsDto.js    # Transforms raw operation array → normalized DTO objects
    operationDto.js     # Single operation DTO variant
    productServiceDto.js # Products/services DTO
    shipmentsDto.js     # Shipments list DTO
    shipmentDto.js      # Single shipment DTO
  config/               # API config (base URLs, project/environment IDs)
  constants/            # API endpoint constants
  queryClient.js        # React Query client instance (defaultOptions: staleTime=0)
  chartConfig.js        # Shared ECharts/Chart.js config defaults
  firebase.js           # Firebase analytics initialization

utils/
  formatDate.js         # Date utilities (see Section 9)
  helpers.js            # Number/amount/phone format utilities (see Section 9)
  notifications.js      # DOM-injected toast notifications
  accountsFieldFormatter.js # Formats account balance fields
  getZoomAwareRect.js   # Browser zoom-safe getBoundingClientRect
  randomColor.js        # Random color generation for charts

providers/
  AppProvider.jsx       # Loads general settings + currencies on app start; wraps TooltipProvider

constants/
  globalCurrency.js     # GlobalCurrency singleton (code, name, guid from appStore)
  icons.js              # SVG icon constants (CreditIcon, DebitIcon, etc.)

messages/
  ru.json               # Russian translations (primary)
  uz.json               # Uzbek translations

styles/
  _variables.scss       # SCSS variables auto-injected globally via next.config.ts sassOptions
  scss/                 # Per-feature SCSS modules
```

---

## 4. Authentication Flow

### Login (`useLogin` in `hooks/useAuth.js`)
1. Calls `auth_login` via `apiClient.invokeFunction`
2. On success: extracts `access_token`, `refresh_token`, `user_data` from `data.data.data`
3. Calls `authStore.setAuthentication()` — stores tokens in MobX + `localStorage` + sets cookie `isAuthenticated=true`
4. Fetches branches via `get_my_branches`
5. If `branches.length > 0`: sets `authStore.branches`, `authStore.branch_id`, calls `appStore.setBranchIsAccrualDate(branchId)`
6. If role is `employees`: fetches `get_user_role_permissions` → calls `appStore.setNewPermission()`
7. If role is `plan_fakt_admins`: calls `appStore.setEmployerPermission()` (full access)
8. Redirects to `/operations`

### Register (`useRegister` in `hooks/useAuth.js`)
- Same flow as login but calls `auth_register_legal_entity`
- Skips permission fetch (new account = admin by default)

### Middleware (`middleware.js`)
- Reads cookie `isAuthenticated`
- Unauthenticated → redirect to `/auth`
- Authenticated on `/auth` → redirect to `/operations`
- Public paths: `/auth`, `/payment`

### Token Refresh (`UcodeAPIClient.refreshAccessToken`)
- Called automatically when a request fails with 401
- Uses `authStore.refreshToken` to call `api.auth.u-code.io/v2/refresh`
- Deduplicates concurrent refreshes with `_isRefreshing` + `_refreshPromise` pattern
- Updates `authStore.authToken` and `localStorage.authToken` on success

---

## 5. API Layer

### `UcodeAPIClient` (`lib/api/ucode/base.js`)
The central API client. One exported singleton: `export const apiClient = new UcodeAPIClient()`.

**Key properties:**
- `baseURL`: `https://api.admin.u-code.io`
- `invokeFunctionEndpoint`: `/v2/invoke_function/planfact-plan-fact/v2`
- `projectId`: `3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed`
- `environmentId`: `fc258dff-47c0-4ab1-9beb-91a045b4847c`

**Key methods:**
- `invokeFunction({ method, data, type? })` — main entry point for all backend calls
  - Builds body via `buildInvokeFunctionBody(method, data)`
  - Auth methods (`auth_*`) omit the `auth` block and `branch_id`
  - All other methods include `branch_id` from `authStore.branch_id`
  - Body structure: `{ data: { auth: { data:{}, type:'apikey' }, method, object_data: { ...data, branch_id } } }`
- `refreshAccessToken()` — refreshes access token using refresh token
- `getAuthToken()` — reads from `authStore` or `localStorage`
- `buildHeaders(token)` — builds `{ Authorization: Bearer ... }` headers
- `handleResponse(response, method)` — parses response, throws on `status === 'ERROR'`
- `getSinglePageBody(id)` — fetches payment page data (used in payment module)

### `ucodeRequest({ method, data })` (named export from `base.js`)
Thin wrapper around `apiClient.invokeFunction`. Use this in `useDashboard.js` hooks.

### `defaultUcodeApiRequest({ urlMethod, urlParams, data })` (named export from `base.js`)
Calls the default U-Code API endpoint (not planfact-specific). Used rarely.

### API Modules (`lib/api/ucode/*.js`)
Each module exports a named object with methods:
- `operationsAPI` — CRUD for operations
- `counterpartiesAPI` — CRUD + groups for counterparties
- `bankAccountsAPI` — CRUD for bank accounts
- `chartOfAccountsAPI` — chart of accounts management
- `currenciesAPI` — currencies list
- `legalEntitiesAPI` — legal entities CRUD
- `balanceAPI` — balance report data
- `cashflowAPI` — cashflow report data
- `profitAndLossAPI` — P&L report data
- `salesAPI` — deals/sales transactions

### `lib/api/dashboard.js` — DEPRECATED
Legacy file using Axios. Still referenced by some `useDashboard.js` hooks. Do **not** add new methods here; use `ucodeRequest` instead.

---

## 6. Hooks

### `hooks/useDashboard.js`
Central export file for all React Query hooks. All hooks are named exports.

**Universal hooks (use these for new code):**
- `useUcodeRequestQuery({ method, data, queryKey?, skip?, querySetting? })` — wraps `ucodeRequest` in `useQuery`; `staleTime: 0`, always refetches on mount
- `useUcodeRequestMutation({ mutationSetting? })` — wraps `ucodeRequest` in `useMutation`; shows error notification on failure
- `useUcodeRequestInfinite({ method, data, skip?, querySetting? })` — `useInfiniteQuery` wrapper; supports both `data.data.pagination` and `data.pagination` response shapes
- `useUcodeDefaultApiMutation` / `useUcodeDefaultApiQuery` — same but calls `defaultUcodeApiRequest`

**Specific mutation hooks:**
- `useDeleteOperation()` — deletes operation; optimistic cache update on `operationsList`
- `useCreateCounterparty()` / `useUpdateCounterparty()` / `useDeleteCounterparties()`
- `useCreateCounterpartiesGroup()` / `useUpdateCounterpartiesGroup()` / `useDeleteCounterpartiesGroups()`
- `useCreateMyAccount()` / `useUpdateMyAccount()` / `useDeleteMyAccounts()`
- `useCreateLegalEntity()` / `useUpdateLegalEntity()` / `useDeleteLegalEntities()`
- `useUpdateChartOfAccounts()`

**Specific query hooks:**
- `useChartOfAccountsV2(params)` — chart of accounts list
- `useBankAccountsPlanFact(params)` — bank accounts via invoke_function
- `useCounterparties(params)` — counterparties list
- `useCounterpartiesGroupsPlanFact(params)` — counterparty groups
- `useLegalEntitiesPlanFact(params)` — legal entities list

### `hooks/useAuth.js`
- `useLogin()` — login mutation (see Section 4)
- `useRegister()` — register mutation (see Section 4)

### `hooks/useOperationComments.js`
Manages comments + file attachments for operations.
- File upload: POST to `https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png`
- CDN base: `https://cdn.u-code.io`
- Max files: 10, max size: 5MB per file
- API methods used: `list_operation_files_and_comments`, `add_operation_files_and_comments`, `update_operation_files_and_comments`, `delete_operation_files_and_comments`

### `hooks/useSaleComments.js`
Same pattern as `useOperationComments` but for deal (sale transaction) comments.

### `hooks/useSentinel.js`
`IntersectionObserver`-based hook for infinite scroll. Observes a sentinel DOM element at the bottom of a list; calls `fetchNextPage` when visible.

### `hooks/useMounted.js`
Returns `false` until the component is mounted on the client. Use to prevent hydration mismatch on SSR-incompatible code.

### `hooks/usePageSearch.js`
Global search bar logic: debounced query, navigation to search results page.

### `hooks/usePaginatedData.js`
Generic hook that manages page state and fetches paginated data.

### `hooks/useAccountsFilter.js`
Filter state logic specific to the accounts list page.

### `hooks/useAccountsModals.js`
Create/edit/delete modal state management for accounts directory.

### `hooks/useLocaleSwitcher.js`
Handles switching between `ru` and `uz` locales using `next-intl`.

### `hooks/useReportT.js`
Thin hook that returns `useTranslations('Reports')` — shortcut for report components.

---

## 7. MobX Stores

All stores use `makeAutoObservable(this)` and export a singleton. All are persisted via `mobx-persist-store` to `localStorage` (SSR-safe with `typeof window !== 'undefined'` guard).

### `auth.store.js` — `authStore`
| Field | Type | Purpose |
|---|---|---|
| `isAuthenticated` | boolean | Whether user is logged in |
| `authToken` | string | JWT access token |
| `refreshToken` | string | JWT refresh token |
| `userData` | object | User profile data |
| `userEmail` | string | User email |
| `branches` | array | Available branches |
| `branch_id` | string | Active branch GUID |
| `selectBranch` | object | Active branch object |

Key methods: `setAuthentication(data)`, `logout()`, `setBranchId(id)`, `setBranches(branches)`, `setToken(name, val)`

### `app.store.js` — `appStore`
| Field | Type | Purpose |
|---|---|---|
| `permission` | object | Full role-based permission tree |
| `currency` | `{name, guid, code}` | Active display currency |
| `currencies` | array | All available currencies |
| `isAccrualDate` | boolean | Whether accrual date mode is active |
| `isPayment` | boolean | Payment mode flag |
| `isDonoSchool` | boolean | Education feature flag |

**Permission tree structure:**
```js
permission = {
  indicators: { read },
  operations: {
    income: { read, add, edit, delete },
    payout: { read, add, edit, delete },
    transfer: { read, add, edit, delete },
    accrual: { read, add, edit, delete },
    shipment: { read, add, edit, delete },
  },
  deals: { read, add, edit, delete },
  reports: {
    cashflow: { read }, pnl: { read }, balance: { read }
  },
  directories: {
    counterparties: { read, add, edit, delete },
    transactionCategories: { read, add, edit, delete },
    accounts: { read, add, edit, delete },
    legalentities: { read, add, edit, delete },
    productsServices: { read, add, edit, delete },
  },
  settings: {
    general: { read, add, edit, delete },
    users: { read, add, edit, delete },
    profile: { read, add, edit, delete },
    branches: { read, add, edit, delete },
    exchangerates: { read, add, edit, delete },
  }
}
```

**Permission setters:**
- `setEmployerPermission()` — sets all permissions to `true` (admin/owner)
- `setPlanfactPermission()` — sets all `add/edit/delete` to `false` (read-only base)
- `setNewPermission(permArray)` — maps API role permissions array to the tree above

### `operationFilter.store.js` — `operationFilterStore`
Operations list page filters. Persisted.
- `selectedFilters`: array of operation types (`tip`) — respects `allowedTip` permissions
- `selectedCounterAgents`, `selectedLegalEntities`, `selectedChartOfAccounts`: arrays
- `amountRange`: `{ min, max }`
- `selectedDatePaymentRange`, `selectedDateStartRange`: `{ start, end }`
- `paymentConfirm`, `paymentNotConfirm`, `accrualConfirm`, `accrualNotConfirm`: booleans
- `paymentDateStart/End`, `accrualDateStart/End`: string dates
- `deals`: array of deal GUIDs
- `toggleFilter(key)` — handles parent/child relationships: `Перемещение` ↔ `[Списание, Зачисление]`, `Начисление` ↔ `[Дебет, Кредит]`
- `resetFilters()` — resets all to defaults

**`allowedTip`** (module-level constant): maps permission flags from `appStore.permission.operations.*` to filter display logic.

### `saleDeal.store.js` — `sealDeal`
Deals list page state.
- `accounting`: `'accrual'` | `'cash'` — accounting method for the deal detail view
- `dealsMethod`: `'accrual_method'` | `'cash_method'`
- `selectedCounterparties`, `status`: arrays
- `dateRange`, `amountFrom/To`, `profitFrom/To`, `operationDateStart/End`: filter fields
- `setState(field, value)` — generic setter
- `resetFilters()` — resets all

### `accounts.store.js` — `accountsStore`
Accounts directory filters.
- `isCash`, `isNonCash`, `isCard`, `isElectronic`: boolean type toggles
- `selectedEntity`, `selectedAccounts`: arrays
- `selectedGrouping`: `'none'` | grouping type
- `accountingMethod`: `'cash'` | `'accrual'`
- `toggleType(typeName)` — toggles one of the 4 boolean account types

### `counterparties.store.js` — `counterpartiesStore` (default export)
Counterparty detail page filters.
- `filters`: `{ debitPaymentTypes, creditPaymentTypes, selectedGroups, selectedCounterparties, selectedChartOfAccounts, dateRange, calculationMethod, deals, selectedLegalEntities }`
- `operationFilters`: pagination + sub-filters for counterparty operations
- `activeFilterCount` (MobX computed getter) — counts active filters for badge display

### `student.store.js` — `student`
Students report filters.
- `accounting`, `rangeMonth`, `selectedCounterParties`, `selectedCounterPartiesGroups`, `status`
- `setState(field, value)` — generic setter

### `indicatos.store.js` — `indicatosStore`
KPI indicators page state.

### `reports.store.js`
Shared state used across report pages.

### `language.store.js` — `languageStore`
Active locale (`'ru'` | `'uz'`).

---

## 8. Pages

### `/operations` — Operations List
Module: `modules/operations/list-page/`
- Infinite-scroll table of all operations
- Filters via `operationFilterStore` (sidebar)
- Calls `list_operations_by_query` via `apiClient.invokeFunction`
- Permission-gated: respects `allowedTip` and `appStore.permission.operations.*`
- `get_operation` mutation (mutationKey `['get_operation']`) fetches single operation before opening edit modal

### `/deals` — Deals List
Module: `modules/deals/deals-list/`
- List of sales transactions
- Filters via `sealDeal` store

### `/deals/[id]` — Deal Detail
Page: `app/(pages)/deals/[id]/page.jsx`
- Fetches deal by `get_sales_transaction_by_guid`
- Four tabs: **products**, **receipts**, **expenses**, **shipments**
- Permission-controlled Add button per tab:
  - products → `appStore.permission.directories.productsServices.add`
  - receipts → `operations.income.add`
  - expenses → `operations.payout.add`
  - shipments → `operations.shipment.add`
- Passes `canAdd` prop down to all detail table components

### `/directories/accounts` — Bank Accounts
Module: `modules/directories/accounts/list-page/`
- List of bank accounts grouped/filtered by `accountsStore`
- FilterSidebar with `clearCount` and `onClear` wired to `accountsStore.resetFilters()`

### `/directories/counterparties` — Counterparties
- List + detail page (`/counterparties/[id]`)

### `/directories/legal-entities` — Legal Entities
### `/directories/transaction-categories` — Chart of Accounts
### `/directories/product-service` — Products & Services

### `/reports/balance` — Balance Sheet
- FilterSidebar: `balanceStore` (date range, accounts, counterparties)
- `clearCount` compares dates using `new Date(a).toDateString() === new Date(b).toDateString()`
- `onClear` calls `balanceStore.resetFilters()` + invalidates `['balance_report']`

### `/reports/cashflow` — Cash Flow
- FilterSidebar: `cashFlowStore` (dates, accounts, counterparties, deals)
- Same `clearCount`/`onClear` pattern

### `/reports/profit-and-loss` — P&L Report
- FilterSidebar: `pnlStore` (dates, accounts, counterparties, deals, legal entities, profit type checkboxes: operational/EBITDA/EBIT/EBT)

### `/reports/students` — Students Report
- Education-specific report
- FilterSidebar includes `status` filter (active/passive) mapped to `contract_status` boolean in API

### `/indicators` — KPI Dashboard
### `/settings` — Settings (general, users, roles, branches, currencies, profile, contract)

---

## 9. Data Transformation (DTOs)

### `lib/dtos/operationsDto.js` — `operationsDto(operations, type?)`
Transforms raw API operation records to normalized DTO objects.
- Optional `type` filter: `'today'` | `'before'` | `'future'` — filters by `data_operatsii` date
- Key field mappings:
  - `tip[0]` → `tip` (operation type string)
  - `data_operatsii` → `operationDate` (formatted via `FormatDateRu`)
  - `data_nachisleniya` → `accrualDate`
  - `counterparties_name` → `counterparty`
  - `chart_of_accounts_name` → `chartOfAccounts`
  - `currenies_symbol` / `currenies_kod` → `currency`
  - `tip[0]` → `operationType`: `'income'|'payment'|'transfer'|'shipment'|'accrual'`
  - `operationParts` → recursively mapped child operations

### `lib/dtos/productServiceDto.js` — `productServiceDto(items)`
Transforms product/service list items.

### `lib/dtos/shipmentsDto.js` — `shipmentsDto(items)`
Transforms shipment list items.

---

## 10. Utility Functions

### `utils/formatDate.js`
| Function | Purpose |
|---|---|
| `formatDate(date)` | → `'YYYY-MM-DD'` string; accepts Date or string |
| `formatDateTime(date)` | → `'DD.MM.YYYY \| HH:mm'` |
| `formatedToday()` | → today as `'YYYY-MM-DD'` |
| `formatDateFormat(dateString)` | → `'D мес YYYY'` in Russian |
| `isToday(dateString)` | boolean — is date today |
| `isFuture(dateString)` | boolean — is date in the future |
| `isBefore(dateString)` | boolean — is date before today |
| `isPastDate(date)` | boolean — date < today (calendar comparison) |
| `formatStudentTableDate(monthString)` | `'MM.YYYY'` → `'Месяц YYYY'` |
| `toISOStringFromDate(dateStr)` | → ISO 8601 string |

### `utils/helpers.js`
| Function | Purpose |
|---|---|
| `formatAmount(v)` | Number → Russian locale string `'1 234 567'` |
| `formatDateRu(dateStr)` | → `'D месяца YYYY'` (full month name) |
| `FormatDateRu(dateStr)` | → `'D мес, YYYY'` (short month name) |
| `formatPeriod(start, end)` | → `'DD мес – DD мес 'YY'` range string |
| `formatPercent(total, min)` | Calculates and formats percentage |
| `calculatePercent(total, received)` | Returns `'XX%'` string |
| `formatNumber(value)` | Formats number with space thousand separators |
| `formatDecimal(num, places?)` | Rounds to decimal places |
| `returnNumber(text)` | Strips non-numeric chars, returns float |
| `StringtoNumber(text)` | Same but returns number or `''` |
| `formatPhoneNumber(value)` | Formats Uzbek phone `+998 XX XXX XX XX` |
| `getCleanPhoneNumber(formatted)` | Strips formatting, returns digit string |
| `getCurrencyIcon(currencyGuid)` | Finds currency object from `appStore.currencies` |
| `getMonthPeriods(start, end)` | Returns array of monthly period objects `{ key, title, startDate, endDate }` |
| `getPeriodLength(from, to, unit)` | Period difference in ms/seconds/minutes/hours/days/weeks/months/years |
| `isUUID(str)` | Validates UUID format |
| `formatValueLength(val, b, m, k)` | Abbreviates large numbers with billion/million/thousand suffix |
| `handleDownload(pdfUrl, name)` | Triggers browser file download |
| `handleInput(e)` | Input event handler that formats number with thousand separators |

### `utils/notifications.js`
DOM-injected toast notifications (no library dependency):
- `showSuccessNotification(message)` — green toast, auto-removes after 3s
- `showErrorNotification(message)` — red toast, auto-removes after 5s
- Also exported from `lib/utils/notifications.js` (re-export path)

---

## 11. Deal Detail Tab Components

All located in `components/deals/details/`.

### `IncomeOperationsTable`
- Props: `sellingDealId`, `onAdd`, `canAdd`
- Fetches income operations via `list_operations_by_query` with `tip: ['Поступление']`
- Infinite scroll (10 per page)
- Edit: calls `get_operation` mutation to fetch full data → transforms via `operationsDto` → opens `OperationModal`
- Edit button shows `Loader2` spinner while `getOperationMutation.isPending`
- Empty list → `EmptyState` with `canAdd` prop

### `ExpenseOperationsTable`
- Props: `sellingDealId`, `onAdd`, `canAdd`
- Same as income but `tip: ["Выплата", "Начисление"]`, `modalType: 'payment'`

### `ProductServiceTable`
- Props: `handleSelect`, `sellingDealId`, `onAdd`, `canAdd`
- Fetches via `list_products_and_services`
- Multi-select with bulk delete
- Edit/copy triggers `handleSelect(item, 'edit'|'copy')`

### `ShipmenTable` (note: typo in directory name — `ShipmenTable` not `ShipmentTable`)
- Props: `dealName`, `dealGuid`, `onAdd`, `canAdd`
- Fetches via `list_sales_operations` with `tab: 'shipment'`
- IntersectionObserver sentinel for infinite scroll (20 per page)
- Edit/copy opens `CreateShipment` inline

### `EmptyState`
- Props: `title`, `subtitle`, `onAdd`, `buttonLabel`, `canAdd` (default: `true`)
- Only renders the Add button when both `onAdd` is provided AND `canAdd` is true

---

## 12. Permissions System

### How permissions are loaded
1. On login, role is checked: `plan_fakt_admins` → `setEmployerPermission()` (all true); `employees` → fetch `get_user_role_permissions` → `setNewPermission()`
2. `setNewPermission()` maps API slugs to `appStore.permission` tree:
   - `income` → `operations.income`
   - `expense` → `operations.payout`
   - `products_and_services` → `directories.productsServices`
   - etc.
3. Persisted in `localStorage` via `makePersistable`

### How permissions are consumed
- `appStore.permission.operations.income.add` → boolean
- `operationFilterStore` reads `allowedTip` at module init to build allowed operation type list
- Deal detail page (`/deals/[id]`) extracts per-tab permission:
  ```js
  const incomePermission = operations.income.add
  const paymentPermission = operations.payout.add
  const shipmentPermission = operations.shipment.add
  const productsPermission = appStore.permission.directories.productsServices.add
  ```
- Header Add button conditionally rendered per active tab + permission
- `canAdd` prop passed down to table components → `EmptyState`

---

## 13. Filter Sidebar Pattern

All filter sidebars share a common pattern:

1. **`FilterSidebar` component** (`components/directories/FilterSidebar/FilterSidebar.jsx` or `components/shared/`) — accepts `isOpen`, `onClose`, `clearCount`, `onClear`
2. **`clearCount`** — computed number of active non-default filters:
   - Date comparison uses `new Date(a).toDateString() === new Date(b).toDateString()` to normalize strings/Date objects
3. **`handleClear`** — calls `store.resetFilters()` + `queryClient.invalidateQueries()`

Example pattern used across balance, cashflow, P&L, accounts, operations:
```js
const datesEqual = (a, b) =>
  a && b ? new Date(a).toDateString() === new Date(b).toDateString() : a === b

const clearCount =
  (!datesEqual(dateRange.start, defaultDate.start) || !datesEqual(dateRange.end, defaultDate.end) ? 1 : 0) +
  selectedAccount.length +
  selectedCounterparties.length
```

---

## 14. Coding Conventions

### File Naming
- Components: PascalCase (`OperationModal.jsx`, `FilterBar.jsx`)
- Page components in `app/`: lowercase directories with `page.jsx`
- Hooks: camelCase `use` prefix (`useDashboard.js`)
- Stores: camelCase `.store.js` suffix (`auth.store.js`)
- API modules: camelCase (`operations.js`)
- shadcn/ui components: kebab-case TypeScript (`dropdown-menu.tsx`)
- SCSS modules: camelCase or kebab-case `.module.scss`

### Code Style
- **No semicolons** in `.js`/`.jsx` files
- Arrow function components: `const MyComponent = () => { ... }`
- Default exports for pages and providers; named exports for hooks, stores, utilities
- `'use client'` directive at top of all interactive components
- Russian strings in UI labels and API `tip` values (e.g. `'Поступление'`, `'Выплата'`)
- Path alias: `@/` maps to project root

### Imports Order
1. React / Next.js
2. External libraries (MobX, React Query, etc.)
3. Internal modules (`@/hooks`, `@/store`, `@/lib`, `@/components`)
4. Styles

### React Query Keys (important — keep consistent)
| Key | Used for |
|---|---|
| `['list_operations_by_query', dealId, 'income']` | Income ops in deal detail |
| `['list_operations_by_query', dealId, 'expense']` | Expense ops in deal detail |
| `['products_services_list', dealId]` | Products in deal detail |
| `['list_sales_operations', dealId, 'shipment']` | Shipments in deal detail |
| `['get_sales_transaction_by_guid']` | Single deal data |
| `['counterpartiesPlanFact']` | Counterparties list |
| `['bankAccountsPlanFact']` | Bank accounts list |
| `['legalEntitiesPlanFact']` | Legal entities list |
| `['balance_report']` | Balance report |
| `['operationsList']` | Operations list (optimistic updates) |

---

## 15. Key Commands

```bash
npm run dev      # Dev server on port 3000
npm run build    # Production build
npm run lint     # ESLint
```

---

## 16. Important Notes & Gotchas

- **`lib/api/dashboard.js` is DEPRECATED** — never add new API calls there; use `ucodeRequest` or `apiClient.invokeFunction` directly
- **SSR guards** — always wrap `localStorage`/`document`/`window` access in `typeof window !== 'undefined'`; use `useMounted()` hook in components to prevent hydration mismatch
- **Branch ID** — every non-auth API call automatically includes `branch_id` from `authStore.branch_id` (injected in `buildInvokeFunctionBody`)
- **Date comparison** — never compare date strings with `===`; use `new Date(a).toDateString() === new Date(b).toDateString()`
- **`ShipmenTable` typo** — the directory is `components/deals/details/ShipmenTable/` (one 't') — do not rename it
- **Chart libraries** — ECharts for complex interactive charts; Chart.js for simpler static ones; Recharts for dashboards
- **Currency** — display currency comes from `appStore.currency`; `GlobalCurrency` (`constants/globalCurrency.js`) is a convenience re-export
- **`get_operation` pattern** — before opening edit modal, always call `get_operation` mutation to fetch full data, then transform through `operationsDto`
- **`canAdd` prop** — all four deal detail table components (`IncomeOperationsTable`, `ExpenseOperationsTable`, `ProductServiceTable`, `ShipmenTable`) accept `canAdd: boolean` and pass it to `EmptyState`
- **Deployment** — GitLab CI/CD, Docker (`output: 'standalone'`), Vercel, Netlify
- **SCSS variables** — auto-injected globally via `next.config.ts` `sassOptions.additionalData`
