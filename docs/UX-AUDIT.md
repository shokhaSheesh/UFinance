# UFinance — UX Audit

> Written for the UFinance product owner and the developers who will implement
> the fixes. Findings are from reading the `staging` codebase; anything not yet
> confirmed against the running app is marked **[unverified]**.
>
> Design principle for every recommendation below: **the user is a career
> accountant who has used Excel for twenty years.** Fixes make the product
> denser, more predictable and more keyboard-driven — not more colorful.

Grounded against the `ui-ux-pro-max` guideline database where noted.

---

## Tier 1 — Fix first

These cost little and remove daily friction or real risk of error.

### 1.1 No column sorting anywhere in the ledger

`modules/operations/components/OperationsTableHeader.jsx`

The operations table header is static text. There is no sort control on Date,
Counterparty, Article or Amount — confirmed by grep across
`modules/operations/` and `components/operations/`.

For a user coming from Excel this is the single most jarring absence in the
product. "Show me the largest expenses" is a one-click operation in a
spreadsheet and impossible here; the workaround is filtering by amount range in
a sidebar, which is far slower.

**Fix:** clickable headers with a three-state cycle (none → asc → desc) and a
persistent arrow. Sort server-side via the existing
`list_operations_by_query` call. Date and Amount are the high-value columns.

### 1.2 Keyboard focus is invisible across the entire application

`app/globals.css:291,295,299,303,311`

Every shared button class applies `outline-none` and **none of them define a
`:focus-visible` replacement.** A user tabbing through a form has no idea where
they are.

> ui-ux-pro-max, `ux` domain — *Interaction / Focus States*, **severity High**:
> "Do: Use a visible focus ring on every interactive control. Don't: Remove
> focus outline without replacement."

This matters disproportionately here: accountants enter data by keyboard, tabbing
field to field, precisely as they do in Excel.

**Fix:** add one rule — `@apply focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-primary` — to each button class. Roughly a five-line
change with the largest usability return in this document.

### 1.3 Toasts stack on top of each other and errors self-destruct

`utils/notifications.js`

Notifications are hand-built DOM injection. Every toast is
`position: fixed; top: 20px; right: 20px` — **two simultaneous toasts render
exactly on top of one another**, so the first is unreadable. There is no queue,
no stacking offset, no dismiss button, and no `role="status"` / `aria-live`.

Worse for this product: **error toasts auto-remove after 5 seconds.** If saving
an operation fails, the reason vanishes before a user reading in their second
language can finish it. In a financial ledger, "did my entry save?" must never
be ambiguous.

`sonner` is already in `package.json` and entirely unused; the custom
implementation is referenced from 54 files.

**Fix:** replace with `sonner` (stacking, dismissible, accessible, already paid
for). Keep success at ~3s auto-dismiss per the guideline database; make **errors
persist until dismissed**, which is the deliberate exception.

### 1.4 Collapsed filter sidebar hides the fact that filters are active

`components/directories/FilterSidebar/FilterSidebar.jsx:16-40`

Collapsed, the sidebar is a 30px sliver showing only a chevron. The active-filter
count (`clearCount`) renders **only in the expanded state**.

So: a user filters to one counterparty, collapses the panel for screen room,
scrolls the ledger — and is now looking at a filtered subset with no visible
indication. They may read a partial total as the real total. This is the one
finding in Tier 1 that can cause a *wrong business conclusion* rather than just
annoyance.

**Fix:** two parts. (a) Show the count badge on the collapsed rail. (b) Better —
render active filters as removable chips in a strip above the table, always
visible regardless of sidebar state. Chips also solve "which filters are on?"
without reopening the panel.

### 1.5 Clicking anywhere on a row opens the edit modal

`components/operations/TableRow/new.jsx:180-187`

The entire row has `onClick → handleEditOperation`, excluded only for `input`
and `button` descendants. Selecting text to copy an amount, or clicking to
orient yourself while scrolling, throws you into an edit modal.

**Fix:** open edit from an explicit affordance — the row's action menu, a
double-click, or a dedicated first cell. If single-click-to-open is kept for
parity with PlanFact, at minimum suppress it when the user has a text selection
(`window.getSelection().toString()` non-empty).

---

## Tier 2 — Structural, worth doing properly

### 2.1 Expanded child rows do not line up with their parent columns

`components/operations/TableRow/new.jsx:524-585` vs. the header at
`OperationsTableHeader.jsx`

The table is built from flexbox `div`s, not `<table>`. Header and parent rows
size their columns with `min-w-* + flex-1`, which distributes leftover space.
Child rows (operation parts) use **fixed widths** — `w-32`, `w-40`, `w-15`,
`w-52`.

These two systems cannot agree at any viewport width. Expand a split operation
and its child rows' dates, counterparties and articles sit **visually offset
from the columns they belong to**. The Project column is conditionally rendered
in both, which compounds the drift.

For a ledger this is close to a correctness bug: the entire value of a table is
that a column means one thing top to bottom.

**Fix:** move to a real `<table>` with `<colgroup>`, or drive both rows from a
single shared column-definition array. The `<table>` route additionally gives
semantics, sortable `<th scope="col">` and screen-reader support for free.

### 2.2 Two contradictory design-token systems

`styles/_variables.scss` and `app/globals.css:135-210`

The SCSS tokens and the CSS custom properties **use the same names for different
values**:

| Token | SCSS | CSS variable |
|---|---|---|
| `sm` | `$text-sm: 12px` | `--font-size-sm: 14px` |
| `md` | `$text-md: 13px` | `--font-size-md: 16px` |
| `lg` | `$text-lg: 15px` | `--font-size-lg: 18px` |

Whether "small text" means 12px or 14px depends on which file a component
happens to be styled in. The scale is also over-granular — 10/12/13/14/15/16px
gives five steps inside a 6px range, which is not a hierarchy, it is noise. The
symptom is visible in a single row of `TableRow/new.jsx`, which mixes
`text-mini` (10px), `text-xs`, `text-sm` and `text-[11px]`.

**Fix:** collapse to one scale with real steps — 12 / 14 / 16 / 20 / 24 — defined
once as CSS custom properties, with the SCSS file importing from them rather
than redeclaring. Retire `text-mini` (10px) entirely; see 2.3.

### 2.3 Body text below the legible minimum

10px (`--font-size-mini`, `--text-mini`) is used for sidebar navigation labels
(`Sidebar.jsx:348`) and as the base class on operation rows.

> ui-ux-pro-max priority table, *Typography & Color*: anti-pattern —
> **"Text < 12px body"**.

Compounding it, `components/shared/Money/index.jsx:33` renders the decimal part
at `text-[0.78em] font-light opacity-60`. On a 14px amount that is **~11px,
weight 300, at 60% opacity** — the kopeck digits are the least legible thing on
screen, and this is an accounting product. **[unverified]** — the exact contrast
ratio needs measuring against the real background, but it will not pass 4.5:1.

**Fix:** 12px floor for anything a user must read. Keep the decimal part
visually de-emphasised (smaller is fine, it aids scanning of the integer part)
but raise it to ~12px and drop the opacity in favour of a solid muted color that
actually passes contrast.

### 2.4 Numbers do not align vertically

`components/operations/PriceStatus/index.jsx:56-60`

`PriceStatus` correctly sets `font-variant-numeric: tabular-nums` in its SCSS —
good. But the cell renders `{amount} {currency} {percent}` as inline content,
so with mixed currencies and optional percentages **the digits end at different
horizontal positions row to row**. Tabular figures only help if the column has a
common right edge.

Excel users scan a column of numbers by digit position — that is how you spot an
extra zero. This breaks it.

**Fix:** give the amount cell a fixed-width numeric sub-column right-aligned to a
common edge, with currency code and percentage in their own narrow columns after
it. Apply `tabular-nums` globally to `Money`, not only inside `PriceStatus`.

### 2.5 Navigation state is nearly invisible, and submenus are inaccessible

`components/Sidebar/Sidebar.jsx:340-410`

- The active item is indicated **only** by text going from `white/60` to
  `white` — no background, no indicator bar. At a glance you cannot tell which
  section you are in.
- Submenu triggers are `<a href="#">` with `onClick → preventDefault`, no
  `aria-expanded`, no `role`. They are **unreachable by keyboard** in any
  meaningful way and unannounced to screen readers.
- The flyout is positioned `fixed` at the trigger's `rect.top` with no
  viewport-collision handling — for items low in the sidebar it can render
  partly offscreen. **[unverified]**, needs checking at ~768px viewport height.
- `toggleSubmenu` has a hardcoded 500ms debounce (`Sidebar.jsx:62-65`) which
  swallows legitimate quick clicks; it feels broken rather than protective.
- Labels sit at 10px (see 2.3) in an 80px rail.

**Fix:** solid active background plus a left indicator bar; `<button
aria-expanded>` for submenu triggers; collision-aware positioning; drop the
debounce.

---

## Tier 3 — Cleanups

### 3.1 A developer backdoor ships to production

`components/Sidebar/Sidebar.jsx:423-427` — an invisible full-width button
(`opacity-0`, `aria-hidden="true"`) at the bottom of the sidebar opens a modal
for overriding the API base URL. A user who clicks near the bottom-left of the
screen gets an unexplained dialog. **Its text is in Uzbek** (`API URL
sozlamalari`, `Bekor qilish`) while the entire rest of the app is Russian, and
the value persists to the store.

**Fix:** gate behind `NODE_ENV !== 'production'`, or a keyboard chord.

### 3.2 Magic-number layout offsets

`components/operations/OperationsFooter/index.jsx:24` positions the fixed totals
bar with `left-[320px]` / `left-[110px]`. The sidebar is `w-[80px]`
(`Sidebar.jsx:310`) and the filter panel `240px` — so `110` and `320` are each
off by 30px of unexplained slack. The table above reserves only `pb-10` (40px)
of bottom padding against a footer that is taller than that, so **the last rows
can sit underneath the totals bar. [unverified]** — needs a visual check.

**Fix:** derive both from shared layout constants; reserve footer height as
padding rather than guessing.

### 3.3 Meaning carried by opacity alone

`TableRow/new.jsx:330-365` and `PriceStatus/index.jsx` dim debit/credit and
write-off/enrollment lines to `opacity-50` to show they are filtered out. Reduced
opacity reads as "disabled" or simply "hard to see", not "excluded by your
filter", and it degrades contrast on text that is already small.

**Fix:** convey it with an explicit marker — a struck-through style, a muted
label, or simply omitting the line — rather than transparency.

### 3.4 Hover-only disclosure

`TableRow/new.jsx:450-462` reveals the list of deals behind a counter via
`group-hover` on an absolutely positioned div. Not keyboard reachable, not
touch reachable, and liable to clip inside the scroll container.

> ui-ux-pro-max priority table, *Touch & Interaction*: anti-pattern —
> **"Reliance on hover only"**.

### 3.5 Dead code

`components/operations/OperationsTable/OperationsTable.jsx` (a full `<table>`
implementation) is imported nowhere — the live ledger is
`modules/operations/list-page/` + `components/operations/TableRow/new.jsx`.
Likewise `app/(pages)/directories/accounts/page.backup.jsx` (676 lines). Both
mislead anyone navigating the codebase.

### 3.6 Accessibility baseline

38 `aria-label` attributes across 379 `.jsx` files. Icon-only controls —
the filter clear button (`FilterSidebar.jsx:32-40`), the row action menus, the
expand chevrons — carry no accessible name.

---

## Proposed visual direction

From `ui-ux-pro-max` `--domain color`, the **Banking / Traditional Finance**
palette — the only returned match that is light-mode and conservative:

| Role | Hex | Use |
|---|---|---|
| Primary | `#0F172A` | navy — headers, primary buttons, active nav |
| Secondary | `#1E3A8A` | links, secondary emphasis |
| Accent | `#A16207` | restrained gold — used **sparingly**, for warnings/attention |
| Background | `#F8FAFC` | app canvas |
| Card | `#FFFFFF` | table surface |
| Muted fg | `#475569` | secondary text — passes contrast, unlike today's `opacity-60` |
| Border | `#E2E8F0` | rules and dividers |
| Destructive | `#DC2626` | delete, negative amounts |

This is close to what the app already uses (`$primary: #0e73f6` is the main
divergence — a brighter, more consumer blue than `#1E3A8A`). The move is
**toward navy and away from bright blue**, which suits the audience and costs
almost nothing to apply since the tokens are centralised.

Style direction from the same source: **Minimalism / Swiss** — grid-based, high
contrast, functional, explicitly listed as *"best for: enterprise apps,
dashboards, professional tools."* Green stays reserved for confirmed income and
red for expenses; no other decorative color.

Type stays a single grotesque (Roboto today is fine — no need to change it) with
the collapsed scale from 2.2 and tabular figures everywhere a number appears.

---

## Suggested order of work

1. **Tier 1** — sorting, focus rings, toasts, filter visibility, row-click.
   Small, independent, immediately felt.
2. **2.2 + 2.3** — unify tokens and fix the type scale. Everything else depends
   on it.
3. **2.1** — rebuild the operations table properly. Largest single task; also
   the one that most improves the primary screen.
4. **2.4 + 2.5** — number alignment and navigation.
5. **Tier 3** — cleanups, opportunistically.

Nothing here requires a backend change.
