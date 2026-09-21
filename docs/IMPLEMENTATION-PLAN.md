# UFinance — Redesign Implementation Plan

> Written for the developers doing the redesign and the product owner
> approving it. For each change: what it is, which files it touches, and in
> what order. The *why* for each item lives in `docs/DESIGN-REFERENCES.md` §3
> (reference patterns) and `docs/UX-AUDIT.md` (original findings). This
> document is only the how.
>
> **Before starting a phase**, tick its items in DESIGN-REFERENCES.md §6
> against the Mobbin screens. If an item fails the check, drop it here too.

---

## Ground rules

These apply to every phase. Each comes from something that has already gone
wrong once in this redesign.

1. **Edit the live file.** Before touching a page, find which file its route in
   `app/(pages)/…/page.jsx` actually imports. The known dead copies (reports,
   counterparties) were deleted in Phase 0, but check anyway.
2. **Every page in one pass.** A change meant for all list pages goes to all
   of them in the same phase, not a pilot subset.
3. **Check the rendered output, not just the source.** Load each route with
   `curl -b 'isAuthenticated=true' http://localhost:3000/<route>` and check the
   HTML and the dev-server log. Two layout bugs in this redesign were only
   visible there (a `w-full` select wrapper, two `margin-left:auto` in one row).
4. **Change the shared component, not the page.** `PageHeader`, `TableCard`,
   `TableToolbar`, `FilterButton`, `FilterDrawer`, `FilterChips`,
   `RowActionsTrigger` and `IconButton` exist so each change is made once.
5. **Lint stays at baseline: 2 errors** (`set-state-in-effect`, both
   pre-existing). It was 5 until Phase 0 deleted the dead report hooks that
   held three of them. A phase ends with 2, not more.

---

## Phase 0 — Clear the ground ✅ done (`d483335`)

Small, and it removes the two things most likely to derail later phases.

**0.1 Delete the dead page copies.**
- `modules/directories/counterparties/list-page/` → nothing imports it. Delete.
- `modules/reports/*` → **not entirely dead.**
  `app/(pages)/reports/balance-test/page.jsx` imports
  `modules/reports/balance/utils/balancePeriods`. Move that one util somewhere
  shared (e.g. `utils/balancePeriods.js`), update the import, then delete the
  rest of `modules/reports/`.
- `components/operations/OperationsTable/OperationsTable.jsx` → unused (live
  ledger is `TableRow/new.jsx`). Delete.
- `app/(pages)/directories/accounts/page.backup.jsx` → delete.

**0.2 One sidebar-width value.** Needed before Phase 4, and harmless on its
own. **28 files** hardcode the 80px rail (`left-[80px]`, `left-20`,
`w-[calc(100%-80px)]`, `left: 80px` in SCSS). The list below was the first 12;
the search behind it had been cut off by a result limit. All 28 are migrated.
Table column widths that happen to be 80px are unrelated and were left as they are:

`components/Sidebar/Sidebar.jsx`, `components/Header/Header.jsx`,
`components/operations/OperationModal/OperationModal.jsx`,
`components/operations/OperationsFooter/OperationsFooter.jsx`,
`components/deals/details/CreatingShipment/index.jsx`,
`modules/warehouse/components/InventoryModal.jsx`,
`modules/warehouse/components/TransferModal.jsx`,
`modules/projects/components/ProjectOpsFooter.jsx`,
`modules/directories/attendance/list-page/index.jsx`,
`modules/directories/product-service/list-page/index.jsx`,
`modules/directories/counterparties/CounterpartiesListPage.jsx`,
`modules/directories/counterparties/detail-page/index.jsx`.

Define `--sidebar-w: 80px` on `:root` in `app/globals.css` and replace each
hardcoded value with `var(--sidebar-w)`. Nothing looks different until Phase 4
changes the variable.

**Done when:** every route compiles, lint is at baseline, nothing looks
different.

---

## Phase 1 — Operations ledger

Where about 90% of time is spent. It also tests every shared component the
other pages reuse. Items are in the order to build them.

**1.1 Status badge instead of blue row text** · *DESIGN-REFERENCES 3.2*
- `components/operations/TableRow/new.jsx`: remove the `textPrimary` logic
  that turns unconfirmed rows blue, and the `isActive && styles.activeRow`
  background.
- `components/operations/PriceStatus/index.jsx`: add a small neutral badge
  (*Не подтв.*) beside the amount when the operation is unconfirmed. Keep the
  existing Д/К and warning icons.
- Payouts **stay red**, income stays green (decision in 3.6).

**1.2 Quieter currency code, legible decimals** · *3.6, UX-AUDIT 2.3*
- `components/shared/Money/index.jsx`: the decimal/currency tail is
  `text-[0.78em] font-light opacity-60`, which is about 11px at 60% opacity.
  Change it to a solid muted colour at 12px minimum. Add `tabular-nums` here so
  every amount in the app gets it, not just the ones inside `PriceStatus`.

**1.3 Skeleton rows instead of a full-screen loader** · *3.7*
- New `components/shared/Table/TableSkeleton.jsx`: N grey rows, sized to the
  table's columns.
- `modules/operations/list-page/index.jsx`: show the skeleton inside the
  `TableCard` on first load, instead of `<ScreenLoader />` over the whole
  screen. The header and toolbar stay usable.

**1.4 Inline filters in the toolbar** · *3.3*
- New `components/shared/Filters/InlineFilter.jsx`: a dropdown button that
  shows its current value (`Период: Сентябрь ▾`), with a ✕ when set.
- Operations toolbar, in order: **period** · search · **account** ·
  **operation type** · «Ещё фильтры».
- `FilterButton`: add a `label` prop so it can read «Ещё фильтры».
- `modules/operations/list-page/useOperationFilterChips.js`: leave out the
  three inline filters. They show their own state, and chips for them would
  duplicate it.
- `components/operations/OperationsFiltersSidebar/…`: remove the three moved
  filters from the drawer.
- Store: `operationFilterStore` already has the setters
  (`setSelectedDatePaymentRange`, `setSelectedFilters`, …). No store changes.

**1.5 Row click opens a detail panel** · *3.2, UX-AUDIT 1.5*
Largest item in the phase, so it's last.
- New `components/shared/DetailPanel/DetailPanel.jsx`, reusing the
  `FilterDrawer` shell (right side, backdrop, Esc, focus handling,
  `useModalPresence` so the AI button hides).
- New `components/operations/OperationDetail/`: read-only view with both
  dates, both confirmation flags, split parts, counterparty, article, project,
  deal, and the files and comments. Buttons: **Edit**, **Copy**, **Delete**.
- `TableRow/new.jsx`: row `onClick` opens the detail panel instead of
  `handleEditOperation`. The ⋮ menu keeps Edit as the direct path.
- Data: the page already calls the `get_operation` mutation before opening
  the editor. Reuse it for the detail panel.

**1.6 Sortable columns** · *UX-AUDIT 1.1 — not from the references*
The top finding in the original audit. It's here because it touches the same
header as 1.4.
- **Blocked on the backend.** `lib/api/ucode/operations.js` and
  `modules/operations/hooks/useOperationsFilters.js` send no sort parameter.
  Confirm with the backend that `list_operations_by_query` accepts a sort field
  and direction before building the UI.
- Once confirmed: clickable headers in
  `modules/operations/components/OperationsTableHeader.jsx` cycling none → asc
  → desc, for Date and Amount first.

**Done when:** the Operations route compiles, the detail panel opens and closes
with mouse and keyboard, inline filters update the ledger and the count on
«Ещё фильтры», and lint is at baseline.

---

## Phase 2 — Create / edit operation form

**2.1 Split the form into sections** · *DESIGN-REFERENCES 3.5*
All four forms:
`components/operations/OperationModal/Forms/{Income,Payment,Transfer,Accural}/index.jsx`.
- Sections: **Оплата** (date, account, amount, split) · **Классификация**
  (counterparty, article) · **Привязки** (project, deal) · **Назначение**.
- Labels stay on the left. The sticky Cancel / Create footer stays.
- Add a small shared `FormSection` component (heading + divider) so all four
  forms use the same one.
- Transfer and Accrual have different fields. Map them to the same four
  sections where they fit, and skip a section that would be empty.

**Done when:** all four forms render with sections, and create and edit still
save (check one of each type against the live backend).

---

## Phase 3 — Roll the Phase 1 patterns out to every list page

In one pass, per ground rule 2.

| Page | Live file | 1.3 skeleton | 1.4 inline filters | Empty state |
|---|---|---|---|---|
| Deals (selling) | `modules/deals/deals-list/index.jsx` | ✓ | period, status | ✓ |
| Purchases | `modules/purchases/purchases-list/index.jsx` | ✓ | period, status | ✓ |
| Counterparties | `modules/directories/counterparties/CounterpartiesListPage.jsx` | ✓ | group | ✓ |
| Accounts | `modules/directories/accounts/list-page/index.jsx` | ✓ | account type | ✓ |
| Projects | `modules/projects/list-page/index.jsx` | ✓ | period, status | ✓ |
| Warehouse | `modules/warehouse/list-page/index.jsx` | ✓ | — | ✓ |
| Cash flow | `app/(pages)/reports/cashflow/page.jsx` | ✓ | period | ✓ |
| P&L | `app/(pages)/reports/profit-and-loss/page.jsx` | ✓ | period | ✓ |
| Balance | `app/(pages)/reports/balance/page.jsx` | ✓ | period | ✓ |
| Income/expense budget | `modules/plans/IncomeExpenseBudget/list-page/index.jsx` | ✓ | legal entity (already inline) | ✓ |
| Cash-flow budget | `modules/plans/CashFlowBudget/list-page/index.jsx` | ✓ | legal entity (already inline) | ✓ |

- Which filters go inline is a first proposal: the most-used one or two per
  page. Adjust per page after Phase 1 is reviewed.
- **Empty states:** one line saying why it's empty, one button to fix it. Fix
  the P&L text *«Используйте фильтры слева»*; filters no longer open from the
  left.
- **Report filter chips:** reports have a count on the Filters button but no
  chips. Add chips once they have an active-filter list, like the one built for
  Operations in `useOperationFilterChips.js`.

**Done when:** all 11 routes compile and render, lint is at baseline.

---

## Phase 4 — Navigation

**4.1 Collapsible sidebar, collapsed by default** · *DESIGN-REFERENCES 3.1*
- `components/Sidebar/Sidebar.jsx`:
  - **Collapsed (default):** today's icon rail. Labels up to at least 12px.
    Fly-out submenus become real `<button aria-expanded>`, keyboard-operable,
    repositioned so they're not clipped at the screen bottom. Remove the 500ms
    click debounce.
  - **Expanded:** ~240px with full labels, submenus expanding inline.
  - A toggle at the bottom of the rail, with the state saved per user. Use a
    persisted MobX store like the existing ones, not bare `localStorage`.
  - Active item: solid background plus a left indicator bar.
- Changing mode updates `--sidebar-w` (80px / 240px). Phase 0.2 makes every
  offset follow it.
- **Remove the hidden API-URL button** at the bottom of the rail
  (UX-AUDIT 3.1). The new toggle needs that spot, and it shouldn't be in
  production anyway. Gate it behind `NODE_ENV !== 'production'`.

**Done when:** both modes work with mouse and keyboard, the choice survives a
reload, and every panel, modal and footer lines up in both modes.

---

## Phase 5 — Colour pass

**5.1 One accent, used only for action and state** · *DESIGN-REFERENCES 3.8*
- Sweep for decorative uses of the brand blue that aren't a button, link,
  focus ring, active nav item or active filter, and move them to neutral ink.
- Fold this into the token cleanup from UX-AUDIT 2.2 (SCSS and CSS variables
  with the same names but different values). Colour changes are simplest once
  tokens have one source.

---

## Order and dependencies

```
Phase 0 ──┬── Phase 1 ── Phase 3
          │      │
          │      └── Phase 2   (independent of 3; can run in parallel)
          │
          └── Phase 4          (needs 0.2)
Phase 5 last
```

- **Phase 1 before 3:** Phase 3 copies what Phase 1 proves out on Operations.
- **0.2 before 4:** without the shared width, expanding the sidebar breaks 28
  layouts.
- **1.6 (sorting)** can land any time once the backend confirms sort support.

## Open questions

1. **Backend: sorting.** Does `list_operations_by_query` accept a sort field
   and direction? Blocks 1.6.
2. **Verification.** DESIGN-REFERENCES §6 still has to be checked against the
   Mobbin screens. Any item that fails comes out of this plan.
