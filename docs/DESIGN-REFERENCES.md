# UFinance — Design References

> Written for the UFinance product owner and the developers doing the
> redesign. Records which reference designs we borrow from, what exactly we
> take from each, and what we deliberately leave behind.
>
> **Status: filled from general knowledge, not yet verified.** §3 and §4
> describe the well-known patterns of the Square Dashboard and Revolut
> Business web apps. They were written without access to the two specific
> Mobbin screen sets below, which need a Mobbin login. Before an item is
> implemented, check it against the actual screens. The checklist is in §6.
> Items marked **⚑ decision** need the product owner's call.

---

## 1. The references

| # | Product | Mobbin screen set |
|---|---|---|
| A | Square — web dashboard | [square-web / 68aba88b…](https://mobbin.com/apps/square-web-27dbb23c-0771-4959-b035-674d5726eab3/68aba88b-fa98-4d7f-98ee-2ef35b1c91dd/screens) |
| B | Revolut Business — web | [revolut-business-web / f865db22…](https://mobbin.com/apps/revolut-business-web-687d165e-97d0-46ad-864b-a8ad3ccd7d60/f865db22-cab3-4d6f-94f9-e17e8fa5b3de/screens) |

Both are money-movement products for businesses, which makes them closer to
UFinance than most of Mobbin. That is why they were chosen over consumer apps.

In one line each:
- **Square** is the calmer of the two: near-monochrome, black and white,
  colour kept for links and status. Its strength is **reporting and
  filtering**.
- **Revolut Business** is the more structured one for **transactions**: rows
  grouped by date, clear status, a detail panel per transaction, and
  step-by-step payment forms.

## 2. The filter we apply to everything we take

Every element borrowed from A or B has to pass these, in order. They come from
the constraints agreed at the start of the redesign (`docs/PLATFORM.md` §7).

1. **Does it keep the ledger dense?** Operations should still show roughly 40
   rows per screen, like Excel. Anything that adds air between rows is out,
   however good it looks in the reference.
2. **Is it conservative enough?** The users are career accountants.
   Gradients, large rounded cards and decorative illustration are out.
3. **Does it follow an Excel convention?** Numbers right-aligned in tabular
   figures, sortable headers, a frozen header row, totals at the bottom. When
   a reference and Excel disagree, Excel wins.
4. **Does it extend what we already built?** `PageHeader`, `TableCard`,
   `TableToolbar`, `FilterButton` + `FilterDrawer`, `FilterChips`,
   `RowActionsTrigger` and `IconButton` are in place. A reference pattern
   should change those, not create a competing second version.

A pattern that fails test 1 or 2 is rejected even if it is the best thing in
the reference.

## 3. What we take

Each item: what it is → where it comes from → which UFinance screen it lands
on → which shared component changes.

### 3.1 Navigation and page shell

**Take — a labelled sidebar that collapses to icons.** *(A, B)*
Both use a left sidebar with full text labels (about 220–240px) that
collapses to an icon rail. UFinance has only the rail: 80px wide, 10px labels,
and submenus that open as floating flyouts.
- Default to the labelled sidebar and let the user collapse it. Remember the
  choice per user.
- Submenus (Reports, Directories, Deals, Plans) **expand inline**, like an
  accordion, instead of flying out. Flyouts are the part of today's nav that
  is hard to use with a keyboard and gets clipped at the bottom of the screen
  (UX-AUDIT 2.5).
- Active section: a solid background plus a left indicator bar.
- **Changes:** `components/Sidebar/Sidebar.jsx`.
- **⚑ decision:** the labelled sidebar takes about 150px from the ledger. With
  collapse available, we recommend labelled as the default. Say if you'd
  rather default to collapsed.

### 3.2 Data tables

**Take — row click opens a read-only detail panel, not the edit form.** *(B)*
Revolut opens a side panel with the full transaction when you click a row.
Editing is an explicit button inside that panel. In UFinance, clicking a row
goes straight into the edit form, which is the open issue UX-AUDIT 1.5
(select text to copy an amount → the edit form opens).
- Row click → right-side **detail panel**: amounts, dates, both confirmation
  flags, split parts, comments and files. Buttons inside: Edit, Copy, Delete.
- The ⋮ row menu stays as the fast path for anyone who wants to edit
  directly.
- **Changes:** new `components/shared/DetailPanel`, reusing the
  `FilterDrawer` shell (right side, backdrop, Esc, focus handling). Wire it
  into `components/operations/TableRow/new.jsx`.

**Take — status as a small badge instead of recolouring the row.** *(B)*
Revolut shows *Pending* / *Declined* as a small label next to the amount.
UFinance paints the whole row's text blue when an operation is unconfirmed.
That's hard to read, and it overloads blue, which already means "link" and
"primary button".
- Unconfirmed → a small neutral badge in the amount cell (e.g. *Не подтв.*),
  and the row text stays normal ink.
- **Changes:** `components/operations/TableRow/new.jsx`,
  `components/operations/PriceStatus/`.

**Take — date-group headers, as we already have them.** *(A, B)*
Both group transactions under date headers. UFinance already does this
(*Сегодня* / *Вчера и ранее*). Keep it; no change needed.

### 3.3 Search, filters and active-filter display

**Take — the most-used filters as inline dropdowns in the toolbar.** *(A, B)*
Both put the main filters directly above the list as dropdown buttons that
show their current value, e.g. `Период: Сентябрь ▾`, `Счёт: Все ▾`. That makes
filters visible and their state readable at a glance, without opening a
panel. It's better than our single "Фильтры" button, which hides everything.
- In `TableToolbar`, put the 2–3 most-used filters inline. For Operations:
  **period**, **account**, **operation type**.
- Everything else stays in the drawer, and the button becomes **«Ещё
  фильтры»** with the count of the filters inside it.
- An inline filter that is set shows its value and a small ✕.
- **Changes:** new `components/shared/Filters/InlineFilter.jsx`, plus
  `TableToolbar` and `FilterButton`, applied page by page.

**Take — period as the first control.** *(A)*
Square leads every report and list with the date range. For finance it's the
filter that matters most. Put it first in the toolbar, before search.

**Keep — our filter chips row**, but only for the filters that live inside the
drawer. The inline filters already show their own state.

### 3.4 Page header and primary actions

**Take — nothing new; this confirms the current direction.** *(A, B)*
Both put the title on the left, the primary action at the top right, and
export as an outlined button next to it. That is what `PageHeader` already
does.

### 3.5 Forms and side panels (create / edit)

**Take — the long form split into labelled sections.** *(B)*
Revolut's payment forms group their fields under small section headings.
UFinance's operation form is one long column of about 10 fields.
- Sections: **Оплата** (date, account, amount, split) · **Классификация**
  (counterparty, article) · **Привязки** (project, deal) · **Назначение**.
- Keep the **labels on the left**, not above the field (see §4).
- Keep the sticky footer with Cancel / Create.
- **Changes:** `components/operations/OperationModal/Forms/*`.

**Take — the right-side panel for create and edit.** *(A, B)* Already done.

### 3.6 Numbers, amounts and currency

**Take — the currency code smaller and muted after the amount.** *(A, B)*
Both show `1 250 000 UZS` with the code visibly quieter than the number, so
the eye reads the number first. Combine this with tabular figures and a common
right edge (UX-AUDIT 2.4).
- **Changes:** `components/shared/Money/`, `PriceStatus`.

**⚑ decision — colour of negative amounts.** *(B)*
Revolut shows outgoing amounts in normal ink with a `−`, and only incoming in
green. UFinance shows every payout in red. On a ledger that is mostly
expenses, the screen turns red, and red reads as "error".
- Option 1: keep red for payouts (familiar to accountants).
- Option 2: payouts in normal ink with `−`, income in green, and red only for
  a real problem such as a negative balance.
- We lean towards **option 2**, but accountants are used to red for money
  going out. This is your call.

### 3.7 Empty, loading and error states

**Take — skeleton rows instead of a full-screen loader.** *(A, B)*
Both show grey placeholder rows while data loads. UFinance covers the whole
screen with `ScreenLoader`, so nothing else can be used while it waits.
- Skeleton rows inside `TableCard`. The header and toolbar stay usable.
- **Changes:** `components/shared/Table/` (new `TableSkeleton`), then remove
  `ScreenLoader` from list pages.

**Take — short empty states with one action.** *(A)*
One line saying why it's empty, and one button that fixes it. Today's P&L
empty state still says *«Используйте фильтры слева»*, which is wrong now that
filters open from a button.

### 3.8 Colour, type and spacing

**Take — one accent colour, used only for action and state.** *(A)*
Square is almost monochrome. Colour means "you can click this" or "this needs
attention", and nothing else. Keep UFinance's blue for primary buttons, links,
focus and active state. Strip it from everywhere else: whole-row colouring,
decorative icons, headings.

**Keep:** Roboto; 14px table text; tabular figures; the navy header and
sidebar; modest corner radius (6–8px).

## 4. What we deliberately do not take

| Pattern | From | Why not |
|---|---|---|
| Tall two-line rows with an avatar or logo per transaction | B | Halves rows per screen. Fails test 1. |
| Big metric cards above list pages | A, B | Pushes the table down. Totals belong at the bottom, as in Excel (test 3). |
| Moving totals from the footer to the top | A | Same reason: Excel puts totals at the bottom. |
| Labels above form fields | B | On a long form, left labels are denser and scan faster for people who fill it in all day. |
| Dark mode or gradient cards | B (consumer app) | Fails test 2. Revolut Business web is lighter than the consumer app, but this is the part of Revolut's style to avoid. |
| Round quick-action icon buttons (Send, Exchange, …) | B | A banking home-screen pattern with no equivalent in a ledger product. |
| Illustrations in empty states | A | Decorative. Fails test 2. |

## 5. Where UFinance needs a reference most

What we were looking for, ranked by time spent in the product, and where §3
answers it.

| Priority | UFinance area | Answered by |
|---|---|---|
| 1 | Operations ledger | 3.2 detail panel, status badge · 3.3 inline filters · 3.6 amounts |
| 2 | Create / edit operation panel | 3.5 sectioned form |
| 3 | Reports | 3.3 period first · 3.7 skeletons and empty states |
| 4 | Active filters | 3.3 inline filters plus drawer |
| 5 | Amount display | 3.6 |
| 6 | Navigation | 3.1 |

## 6. Verification checklist

Check these against the two Mobbin screen sets before implementing. Each one
is a claim in §3 that could be wrong for the specific screens you picked.

- [ ] B: row click opens a **detail panel**, not an edit form (3.2)
- [ ] B: status shows as a **badge**, not as coloured row text (3.2)
- [ ] A, B: main filters are **inline dropdowns showing their value** (3.3)
- [ ] A: the **period** control comes first (3.3)
- [ ] B: long forms are grouped into **labelled sections** (3.5)
- [ ] B: outgoing amounts are in **normal ink**, not red (3.6)
- [ ] A, B: loading uses **skeleton rows** (3.7)
- [ ] A, B: sidebar is **labelled and collapsible**, with **inline** submenus (3.1)

If an item fails the check, strike it from §3, don't adapt it. The point of a
reference is that it's real.

**To run the check:** authenticate the Mobbin MCP (`/mcp` → **mobbin**) and
start a new session so its tools load, or add screenshots of the screens to
the conversation.

## 7. Next document

The implementation plan: for each item in §3, which files change and in what
order. Start with the Operations ledger (3.2, 3.3, 3.6), because that is where
the time goes and because it tests the shared components that every other page
reuses.
