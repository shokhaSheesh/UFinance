# CLAUDE.md - AI Rules for UFinance (Plan-Fact) Frontend

## Project Overview

UFinance (Plan-Fact) is a financial dashboard application for managing operations, counterparties, accounts, reports, and indicators. The app name is "UFinance". The UI language is Russian.

## Tech Stack

- **Framework:** Next.js 16.1 with App Router (React 19)
- **Language:** JavaScript/JSX (some TypeScript in UI components and config)
- **State Management:** MobX 6 with `makeAutoObservable` + localStorage hydration
- **Server State:** TanStack React Query v5
- **UI:** MUI 7 + TailwindCSS 4 + shadcn/ui + custom SCSS
- **Charts:** ECharts 6, Chart.js 4, Recharts 3
- **HTTP Client:** Axios (via `lib/axios.js`) + custom UcodeAPIClient (`lib/api/ucode/base.js`)
- **Forms:** React Hook Form 7
- **Tables:** Material React Table 3 + TanStack React Table 8
- **Icons:** Lucide React, MUI Icons, React Icons
- **Font:** Roboto (loaded via `next/font/google`)

## Project Structure

```
app/                    # Next.js App Router
  pages/                # Feature pages (auth, deals, operations, reports, etc.)
  api/                  # API routes (auth, utils)
  layout.jsx            # Root layout (Roboto font, metadata)
  ClientLayout.jsx      # Client wrapper with Sidebar/Header
  page.jsx              # Home page
components/             # React components by feature
  ui/                   # shadcn base components (button, card, chart, tooltip, etc.)
  common/               # Reusable components (DatePicker, Modal, Select, TreeSelect)
  dashboard/            # Dashboard sections
  charts/               # Chart components (AreaStockChart, BreakdownDonut, ProfitChart)
  deals/                # Deal management
  operations/           # Operations management
  reports/              # Report components
  directories/          # Directory listings
  settings/             # Settings pages
  shared/               # Cross-feature shared components
  Header/               # App header
  Sidebar/              # App sidebar navigation
  Indicators/           # Financial indicators
hooks/                  # Custom React hooks
  useAuth.js            # Authentication hook
  useDashboard.js       # Dashboard data queries (React Query wrappers)
  usePaginatedData.js   # Pagination logic
  useSentinel.js        # Intersection observer for infinite scroll
lib/                    # Libraries and API clients
  api/ucode/            # API modules (operations, counterparties, bankAccounts, etc.)
  api/ucode/base.js     # UcodeAPIClient - base API client with token refresh
  api/dashboard.js      # DEPRECATED - use lib/api/ucode/* directly
  axios.js              # Axios instance (baseURL: '/api', Bearer token)
  config/               # App configuration
  constants/            # API constants
  dtos/                 # Data Transfer Objects
  queryClient.js        # React Query client
  chartConfig.js        # Chart configuration
store/                  # MobX stores
  auth.store.js         # Auth state (token, user, isAuthenticated)
  app.store.js          # Global app state (currency, settings)
  accounts.store.js     # Accounts data
  counterparties.store.js
  operationFilter.store.js
  reports.store.js
  saleDeal.store.js
providers/              # React context providers
  AppProvider.jsx       # Root provider (loads settings, currencies)
utils/                  # Utility functions
  formatDate.js         # Date formatting
  helpers.js            # General helpers
constants/              # App-wide constants
  globalCurrency.js     # Currency constants
  icons.js              # Icon definitions
styles/                 # Global styles
  _variables.scss       # SCSS variables (auto-imported in all SCSS files)
  scss/                 # SCSS modules
```

## Architecture Patterns

### API Layer
- Backend is **U-Code platform** (`api.admin.u-code.io`)
- All API calls go through `UcodeAPIClient` in `lib/api/ucode/base.js`
- API modules are in `lib/api/ucode/` (operations, counterparties, bankAccounts, etc.)
- Each module exports an API object (e.g., `operationsAPI`, `counterpartiesAPI`)
- `lib/api/dashboard.js` is DEPRECATED - import from `lib/api/ucode/*` directly
- The `ucodeRequest()` function is the universal request method

### State Management
- MobX stores use `makeAutoObservable(this)` in constructor
- Stores hydrate from `localStorage` on init (SSR-safe with `typeof window` checks)
- Export singleton instances: `export const authStore = new AuthStore()`
- Auth state uses both `localStorage` and cookies (for middleware)

### Data Fetching
- React Query hooks are in `hooks/useDashboard.js`
- Custom `useUcodeRequestQuery` hook wraps `ucodeRequest` with React Query
- Use `keepPreviousData` for pagination queries

### Authentication
- Token stored in `localStorage` as `authToken`
- Cookie `isAuthenticated=true` for Next.js middleware redirect
- Middleware redirects unauthenticated users to `/pages/auth`
- Token refresh via `api.auth.u-code.io/v2/refresh`

### Component Patterns
- Feature components go in `components/{feature}/`
- Use `'use client'` directive for client components
- shadcn components in `components/ui/` (kebab-case filenames)
- Common reusable components in `components/common/`
- Path alias: `@/*` maps to project root

### Styling
- TailwindCSS for utility classes
- MUI components with theme customization
- SCSS modules for complex component styles
- SCSS variables in `styles/_variables.scss` (auto-imported globally)
- Use `clsx` or `cn` (tailwind-merge) for conditional classes

## Coding Conventions

### File Naming
- Components: PascalCase (`OperationModal.jsx`, `FilterBar.jsx`)
- Hooks: camelCase with `use` prefix (`useDashboard.js`, `useAuth.js`)
- Stores: camelCase with `.store.js` suffix (`auth.store.js`)
- API modules: camelCase (`operations.js`, `counterparties.js`)
- UI components (shadcn): kebab-case (`dropdown-menu.tsx`, `hover-card.tsx`)
- Styles: kebab-case or camelCase with `.module.scss`

### Code Style
- Use `const` arrow functions for components and hooks
- Default exports for page components and providers
- Named exports for API objects, hooks, and utilities
- Russian comments and labels in UI (app is Russian-language)
- No semicolons in JS files (project convention)

### Imports
- Use `@/` path alias for imports from project root
- Group imports: React/Next -> external libs -> internal modules -> styles

## Key Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Important Notes

- The app uses Next.js App Router with `output: "standalone"` for Docker deployment
- SCSS variables are globally injected via `next.config.ts` sassOptions
- Multiple chart libraries coexist (ECharts for complex charts, Chart.js for simpler ones, Recharts for dashboards)
- Currency is configurable per-user (default: UZS), managed via `appStore`
- The project deploys to GitLab CI/CD, Vercel, and Netlify
