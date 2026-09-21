# UFinance — Design References

> Written for the UFinance product owner and the developers doing the
> redesign. Records which reference designs we borrow from, what exactly we
> take from each, and what we deliberately leave behind.
>
> **Status: DRAFT — template findings not yet verified.** The two reference
> screen sets are on Mobbin, which requires a login. They have not been
> reviewed yet. Section 3 is empty on purpose until they are; do not plan
> implementation off this document until it is filled in.

---

## 1. The references

| # | Product | Mobbin screen set |
|---|---|---|
| A | Square — web dashboard | [square-web / 68aba88b…](https://mobbin.com/apps/square-web-27dbb23c-0771-4959-b035-674d5726eab3/68aba88b-fa98-4d7f-98ee-2ef35b1c91dd/screens) |
| B | Revolut Business — web | [revolut-business-web / f865db22…](https://mobbin.com/apps/revolut-business-web-687d165e-97d0-46ad-864b-a8ad3ccd7d60/f865db22-cab3-4d6f-94f9-e17e8fa5b3de/screens) |

Both are money-movement products for businesses, which makes them closer to
UFinance than most of Mobbin. That is the reason they were chosen over consumer
apps.

## 2. The filter we apply to everything we take

Every element borrowed from A or B has to pass these, in order. These come
from the constraints agreed at the start of the redesign (see
`docs/PLATFORM.md` §7).

1. **Does it keep the ledger dense?** Operations should still show roughly 40
   rows per screen, like Excel. Anything that adds air between rows is out,
   however good it looks in the reference.
2. **Is it conservative enough?** The users are career accountants. Bright
   gradients, big rounded cards and decorative illustration are out. Revolut
   in particular leans on these in its consumer app. We take its *structure*,
   not its skin.
3. **Does it follow an Excel convention?** Numbers right-aligned in tabular
   figures, sortable headers, a frozen header row, totals at the bottom. When
   a reference and Excel disagree, Excel wins.
4. **Does it fit what we have already built?** The shared pieces are in place:
   `PageHeader`, `TableCard`, `TableToolbar`, `FilterButton` + `FilterDrawer`,
   `FilterChips`, `RowActionsTrigger`, `IconButton`. A reference pattern should
   change those components, not create a second, competing version.

A pattern that fails 1 or 2 is rejected even if it is the best thing in the
reference.

## 3. What we take from each reference

> **Not filled in yet.** Needs the screens to be reviewed first (see §6).

For each element, record: what it is, which screen it appears on, which
UFinance screen it maps to, and which shared component it changes.

### 3.1 Navigation and page shell
*(pending)*

### 3.2 Data tables
*(pending)*

### 3.3 Search, filters and active-filter display
*(pending)*

### 3.4 Page header and primary actions
*(pending)*

### 3.5 Forms and side panels (create / edit)
*(pending)*

### 3.6 Numbers, amounts and currency display
*(pending)*

### 3.7 Empty, loading and error states
*(pending)*

### 3.8 Colour, type and spacing
*(pending)*

## 4. What we deliberately do not take

*(pending — filled in alongside §3)*

## 5. Where UFinance needs a reference most

This part does not depend on the templates. It is what we are looking for
when we open them, ranked by how much each screen matters to the user.

| Priority | UFinance area | The open question a reference should answer |
|---|---|---|
| 1 | **Operations ledger** — about 90% of time in product | How a dense transaction list shows the type, confirmation status and split rows without turning into a wall of colour. How sorting shows up in the header. |
| 2 | **Create / edit operation panel** | How a long money-entry form (account, amount, split, counterparty, article, project, deal) stays scannable. Where secondary actions like "split amount" and "add accrual" go. |
| 3 | **Reports** (cash flow, P&L, balance) | How a period-by-period financial table handles expandable row groups, subtotals and a totals column. |
| 4 | **Active filters** | How the reference shows what is filtered. We already have chips on Operations; we want to know whether a better pattern exists before rolling chips out to the rest. |
| 5 | **Amount display** | Handling of sign, currency code and decimals, so a column of numbers lines up by digit. |
| 6 | **Navigation** | Our 80px icon rail with 10px labels. Whether a labelled or expandable sidebar reads better for a menu of 10 sections. |

## 6. How to finish this document

The screens have to be reviewed through a logged-in Mobbin session. Either:

- **Mobbin MCP (preferred).** The server is added to the user-scope config.
  Authenticate it with `/mcp` → **mobbin**, then start a new Claude Code
  session so its tools load. Then walk both screen sets and fill §3 and §4.
- **Screenshots.** Export the relevant screens from Mobbin and add them to
  the conversation.

Once §3 is filled in, the next document is the implementation plan: for each
element taken, which files change and in what order.
