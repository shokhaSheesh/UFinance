# UFinance — What This Platform Is

> Orientation document. Written for a developer or designer joining the UFinance
> redesign who has never used the product. Covers the domain, the users, and how
> the screens fit together — not the code architecture (see `CLAUDE.md` for that).

---

## 1. The one-paragraph version

UFinance is a **B2B financial management platform for Uzbek small and mid-size
businesses** — a near 1:1 functional clone of the Russian SaaS product
[PlanFact](https://planfact.io). It answers three questions an owner or
accountant asks daily: *how much money moved, where does it stand now, and what
is it going to look like next month.* Every screen is in Russian (Uzbek locale
exists but Russian is the working language). The product replaces the
spreadsheet a company's accountant currently keeps by hand.

## 2. Who actually uses it

This matters more than any technical detail, because it constrains every design
decision downstream.

| User | What they do here | What they bring with them |
|---|---|---|
| **Business owner / director** | Opens Indicators and Reports. Wants a number, fast. | Low patience, low tolerance for ambiguity. Checks on mobile sometimes. |
| **Accountant / бухгалтер** | Lives in Operations all day. Enters and reconciles hundreds of rows. | **20+ years of Excel.** Expects sorting, column alignment, keyboard entry, totals at the bottom, and to never lose work. |
| **Manager / sales** | Works inside Deals. Tracks what a customer owes. | Moderate; uses a handful of screens repeatedly. |

**The accountant is the primary persona and the design target.** They are not
impressed by visual novelty; they are measuring the product against Excel, and
Excel wins on density, alignment, sorting and predictability. Anything that
makes the product *prettier but slower to scan* is a regression to them.

## 3. The domain model

Five concepts, everything else hangs off them.

```
Legal Entity (юр. лицо)        the company doing business
   └── Account (счёт)          where money physically sits: cash, bank, card, e-wallet
        └── Operation          a single movement of money  ◄── the heart of the product
              ├── Counterparty (контрагент)   who it was with
              ├── Chart of Accounts (статья)  what budget line it belongs to
              └── Deal (сделка)               optional: which transaction it belongs to
```

### Operations — the core object

Everything in UFinance is ultimately an operation. There are **five types**
(`tip`, stored as Russian strings, which is why they leak into the code):

| `tip` | Meaning | Money effect |
|---|---|---|
| `Поступление` | Income / receipt | + into an account |
| `Выплата` | Payout / expense | − out of an account |
| `Перемещение` | Transfer between own accounts | − from one, + to another |
| `Начисление` | Accrual (double-entry: debit + credit) | no cash moves |
| `Отгрузка` / `Поставка` | Shipment / supply | goods move, not cash |

An operation can be **split into parts** (`operationParts`) — one payment of
10,000,000 UZS divided across three counterparties or three budget lines. In the
table these render as expandable child rows.

### The two accounting methods

This is the single most important concept in the product, and the one most
likely to confuse a user:

- **Cash method (кассовый)** — a transaction counts when money actually moves.
- **Accrual method (начисления)** — a transaction counts when the obligation
  arises, regardless of payment.

The same operation carries **two dates** (`operationDate` and `accrualDate`) and
**two confirmation flags** (`payment_confirmed`, `payment_accrual`). Reports
change their numbers entirely depending on which method is selected. A user
looking at the wrong method sees wrong numbers and has no obvious way to tell.

## 4. Module map

What each section of the app is for, in the sidebar's own order:

| Route | Russian name | Purpose |
|---|---|---|
| `/indicators` | Показатели | KPI dashboard — the "how are we doing" screen |
| `/operations` | Операции | **The main workspace.** Infinite-scroll ledger of every money movement |
| `/directories/counterparties` | Контрагенты | Customers and suppliers, with per-counterparty balance |
| `/deals/selling`, `/deals/purchase` | Сделки | Sales and purchase transactions; a deal aggregates its own receipts, expenses, products and shipments |
| `/income_expense_budget`, `/cash_flow_budget` | Планы | Budgeting — planned vs. actual, pivot-table style |
| `/projects` | Проекты | Optional module: tag operations by project for per-project P&L |
| `/reports/cashflow` | ОДДС | Cash flow statement |
| `/reports/profit-and-loss` | ОПиУ | Profit & loss |
| `/reports/balance` | Баланс | Balance sheet |
| `/directories/*` | Справочники | Reference data: accounts, legal entities, chart of accounts, products & services |
| `/warehouse` | Склад | Optional module: inventory |
| `/settings/*` | Настройки | Users, roles, branches, exchange rates, general settings |

### Feature flags

Several modules are conditionally visible, driven by company settings. Expect
any given customer to see a *subset* of the above:

- `appStore.isDonoSchool` → students directory, attendance, students report
- `appStore.warehouseActive` → warehouse
- `appStore.projectActive` → projects module + a Project column in the ledger
- `appStore.isPayment` → payment-type column
- `BALANCE_TEST_COMPANY_ID` → a balance-test report hardcoded to one company

### Permissions

A role-based tree (`appStore.permission`) gates every module down to
`read/add/edit/delete` per operation type. Two shortcuts exist:
`plan_fakt_admins` get everything; `employees` get a fetched role. **The UI is
permission-shaped**: menu items, Add buttons and row actions all disappear
rather than disable, so two users can see structurally different apps.

## 5. How a typical day flows

1. Accountant opens **Operations**. It loads the full ledger, newest first,
   infinite scroll.
2. They open the **filter sidebar** and narrow by date range, account,
   counterparty, or budget line.
3. They add operations — via the header Add button, which opens a **type-specific
   modal** (income / payout / transfer / accrual each have their own form).
4. Amounts get **confirmed** (payment confirmed / accrual confirmed) as the bank
   statement comes in. Unconfirmed rows render in the primary blue.
5. At month end they open **Reports**, pick cash or accrual method, and export.
6. Owner opens **Indicators** to see the summary.

Steps 1–4 are ~90% of total time in product. **Operations is the screen that
matters.**

## 6. Technical shape (short version)

Next.js 16 App Router, React 19, mostly `.jsx` (TypeScript only in
`components/ui/`). MobX for client state and filters (persisted to
localStorage), TanStack Query for server state. Backend is **uCode** — a
low-code platform reached almost entirely through one RPC-ish endpoint,
`apiClient.invokeFunction`, rather than REST resources. Styling is a mix of
Tailwind 4, SCSS modules and shadcn/ui. See `CLAUDE.md` for the full reference.

## 7. Constraints on any redesign

Established with the product owner:

1. **Conservative, not trendy.** The audience is career finance staff. No
   playful color, no large rounded cards, no decorative illustration, no dark
   mode as the default.
2. **Density is a feature.** Do not add whitespace that reduces rows-per-screen
   in the ledger. Excel shows ~40 rows; so should we.
3. **Familiarity beats novelty.** Where Excel has a convention (right-aligned
   numbers, sortable headers, frozen header row, totals at the bottom), match
   it rather than invent.
4. **PlanFact parity is the baseline, not the ceiling.** We cloned its
   behaviour; where PlanFact's own UX is poor we are free to improve, but we
   should not gratuitously diverge on things users already learned.
