'use client'

import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import Input from '@/components/shared/Input'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import Segmented from '@/components/shared/Segmented/Segmented'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { cn } from '@/lib/utils'
import BudgetFormModal from '@/modules/plans/components/BudgetDetail/BudgetFormModal'
import BudgetRowMenu from '@/modules/plans/components/BudgetRowMenu'
import { useBudgetDictionaries } from '@/modules/plans/hooks/useBudgetDictionaries'
import { useBudgetList } from '@/modules/plans/hooks/useBudgetList'
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/modules/plans/hooks/useBudgets'
import { appStore } from '@/store/app.store'
import {
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  LayoutGrid,
  Loader2,
  Plus,
  Rows3,
  Search,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'
import { useMemo, useState } from 'react'

// 'YYYY-MM' → номер месяца от нуля, чтобы считать разницу в месяцах
const monthIndex = (key) => {
  if (!key) return null
  const [y, m] = key.split('-').map(Number)
  return y && m ? y * 12 + (m - 1) : null
}

/**
 * Где бюджет во времени: идёт, запланирован или завершён, и сколько месяцев
 * периода уже прошло. Считается по периоду бюджета и текущему месяцу.
 */
const getTimeline = (period) => {
  const start = monthIndex(period?.start)
  const end = monthIndex(period?.end)
  if (start == null || end == null) return { status: null, done: 0, total: 0 }
  const now = new Date()
  const current = now.getFullYear() * 12 + now.getMonth()
  const total = end - start + 1
  if (current < start) return { status: 'planned', done: 0, total }
  if (current > end) return { status: 'done', done: total, total }
  return { status: 'active', done: current - start + 1, total }
}

const STATUS_STYLE = {
  active: 'bg-[#eef4ff] text-[#0e73f6]',
  planned: 'bg-amber-50 text-amber-700',
  done: 'bg-slate-100 text-slate-600',
}

const BAR_STYLE = {
  active: 'bg-[#0e73f6]',
  planned: 'bg-amber-400',
  done: 'bg-slate-400',
}

/**
 * Список бюджетов — общий для БДР (`pnl`) и БДДС (`cashflow`).
 *
 * Раньше это были две одинаковые страницы-таблицы. Теперь сверху карточки
 * «всего / идут / запланированы / завершены» (они же — фильтр), а бюджеты
 * по умолчанию показаны карточками с полосой периода: сразу видно, какой
 * бюджет сейчас в работе и сколько месяцев из него прошло. Таблица с
 * сортировкой по колонкам осталась — переключатель «Карточки / Таблица».
 *
 * @param {'pnl'|'cashflow'} type
 * @param {string} listNamespace    переводы списка (Plans.incomeExpenseBudget …)
 * @param {string} singleNamespace  переводы бюджета (Plans.IncomeExpenseBudgetSingle …)
 * @param {string} basePath         маршрут карточки бюджета
 */
const BudgetListPage = ({ type, listNamespace, singleNamespace, basePath }) => {
  const t = useTranslations(listNamespace)
  const tf = useTranslations(singleNamespace)
  const tb = useTranslations('Plans.budgetList')
  const tc = useTranslations('Common')
  const router = useRouter()

  const [legalEntityFilter, setLegalEntityFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState('cards')

  // Права раздела «Планы» → нужный бюджет
  const permissions = appStore.permission.plans?.[type] || {}

  const monthLabels = useMemo(
    () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, tf(`monthsShort.${i + 1}`)])),
    [tf]
  )

  const { budgets, isLoading } = useBudgets(type, { legalEntityId: legalEntityFilter })
  const createBudget = useCreateBudget(type)
  const updateBudget = useUpdateBudget(type)
  const deleteBudget = useDeleteBudget(type)
  const { legalEntities, projects, currencies } = useBudgetDictionaries({ groupLabel: tf('form.projectGroup') })

  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    modalOpen,
    editing,
    openCreate,
    openEdit,
    closeModal,
    submit,
    remove,
  } = useBudgetList({
    budgets,
    monthLabels,
    onCreate: createBudget.mutateAsync,
    onUpdate: updateBudget.mutateAsync,
    onDelete: deleteBudget.mutateAsync,
  })

  const withTimeline = useMemo(
    () => filteredData.map((item) => ({ ...item, timeline: getTimeline(item.periodValue) })),
    [filteredData]
  )

  const counts = useMemo(() => {
    const result = { all: withTimeline.length, active: 0, planned: 0, done: 0 }
    withTimeline.forEach(({ timeline }) => {
      if (timeline.status) result[timeline.status] += 1
    })
    return result
  }, [withTimeline])

  const visible = statusFilter === 'all' ? withTimeline : withTimeline.filter((item) => item.timeline.status === statusFilter)

  const kpis = [
    { key: 'all', label: tb('kpi.total'), hint: tb('kpi.totalHint'), icon: FileSpreadsheet },
    { key: 'active', label: tb('kpi.active'), hint: tb('kpi.activeHint'), icon: CalendarRange },
    { key: 'planned', label: tb('kpi.planned'), hint: tb('kpi.plannedHint'), icon: CalendarClock },
    { key: 'done', label: tb('kpi.done'), hint: tb('kpi.doneHint'), icon: CalendarCheck },
  ]

  const openBudget = (id) => router.push(`${basePath}/${id}`)

  const menuFor = (item) => (
    <BudgetRowMenu
      onEdit={() => openEdit(item)}
      onDelete={() => remove(item.id)}
      editLabel={tf('actions.edit')}
      deleteLabel={tf('actions.delete')}
      canEdit={permissions.edit}
      canDelete={permissions.delete}
    />
  )

  const rowKeyHandler = (id) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openBudget(id)
    }
  }

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-60" />
    }
    return (
      <ChevronDown
        className={cn('h-3.5 w-3.5 text-slate-600 transition-transform', sortConfig.direction === 'desc' && 'rotate-180')}
      />
    )
  }

  const sortHeader = (column, className, children) => (
    <button
      type="button"
      onClick={() => handleSort(column)}
      className={cn('group flex h-10 items-center gap-1 px-3 text-left uppercase cursor-pointer hover:text-slate-900', className)}
    >
      {children}
      {renderSortIcon(column)}
    </button>
  )

  return (
    <div className="h-full overflow-auto bg-canvas px-6 pb-10">
      {/* Шапка: заголовок с количеством, справа — создание */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-canvas">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="shrink-0 text-xl font-semibold text-slate-900">{t('title')}</h1>
          <span className="truncate text-sm text-slate-500 tabular-nums">{t('footer.total', { count: counts.all })}</span>
        </div>
        {permissions.add && (
          <button onClick={openCreate} className="primary-btn gap-1.5">
            <Plus className="h-4 w-4" />
            {tc('create')}
          </button>
        )}
      </div>

      {/* Карточки-показатели — они же фильтр по состоянию бюджета */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        {kpis.map(({ key, ...kpi }) => (
          <KpiCard
            key={key}
            {...kpi}
            value={counts[key]}
            active={statusFilter === key}
            onClick={() => setStatusFilter(key)}
          />
        ))}
      </div>

      <TableCard className={cn('min-w-fit overflow-visible', view === 'cards' && 'border-0 bg-transparent')}>
        <TableToolbar
          className={cn('rounded-t-xl', view === 'cards' && 'mb-4 rounded-xl border border-slate-200')}
          search={
            <div className="w-full max-w-[420px]">
              <Input
                type="text"
                leftIcon={<Search className="h-4 w-4" />}
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          }
          actions={
            <>
              <SelectLegelEntitties
                value={legalEntityFilter}
                onChange={setLegalEntityFilter}
                placeholder={t('columns.legalEntity')}
                className="w-[220px] bg-white"
                isClearable
              />
              <Segmented
                ariaLabel={tb('view.cards')}
                value={view}
                onChange={setView}
                options={[
                  { value: 'cards', label: tb('view.cards'), icon: LayoutGrid },
                  { value: 'table', label: tb('view.table'), icon: Rows3 },
                ]}
              />
            </>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className={cn('flex flex-col items-center gap-3 py-20 text-center', view === 'cards' && 'rounded-xl border border-slate-200 bg-white')}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileSpreadsheet size={22} aria-hidden="true" />
            </span>
            <span className="text-sm text-slate-500">{t('noData')}</span>
            {statusFilter !== 'all' && (
              <button type="button" onClick={() => setStatusFilter('all')} className="text-sm font-medium text-[#0e73f6] cursor-pointer hover:underline">
                {tb('showAll')}
              </button>
            )}
          </div>
        ) : view === 'cards' ? (
          /* Карточки бюджетов */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
            {visible.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => openBudget(item.id)}
                onKeyDown={rowKeyHandler(item.id)}
                className="flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0e73f6]/50 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileSpreadsheet size={18} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-slate-900">{item.name}</span>
                    <span className="truncate text-xs text-slate-400">{item.comment || item.legalEntity || '—'}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.timeline.status && (
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[item.timeline.status])}>
                        {tb(`status.${item.timeline.status}`)}
                      </span>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>{menuFor(item)}</div>
                  </div>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-slate-500">{t('columns.legalEntity')}</dt>
                  <dd className="truncate text-slate-900">{item.legalEntity || '—'}</dd>
                  {appStore.projectActive && (
                    <>
                      <dt className="text-slate-500">{t('columns.project')}</dt>
                      <dd className="truncate text-slate-900">{item.project || '—'}</dd>
                    </>
                  )}
                  <dt className="text-slate-500">{t('columns.currency')}</dt>
                  <dd className="text-slate-900">{item.currency || '—'}</dd>
                </dl>

                {/* Период полосой: сколько месяцев уже прошло */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.period}</span>
                    {item.timeline.total > 0 && (
                      <span className="tabular-nums text-slate-500">
                        {tb('monthsProgress', { done: item.timeline.done, total: item.timeline.total })}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full', BAR_STYLE[item.timeline.status] || 'bg-slate-300')}
                      style={{ width: `${item.timeline.total ? (item.timeline.done / item.timeline.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <Clock size={12} aria-hidden="true" />
                  <span className="truncate">
                    {tb('updated', { date: item.modifiedDate || '—' })}
                    {item.modifiedBy ? ` · ${item.modifiedBy}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Таблица — прежние колонки и сортировка */
          <>
            <div className="sticky top-16 z-30 flex items-center border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500">
              {sortHeader('name', 'w-[300px] pl-4', t('columns.name'))}
              {sortHeader('currency', 'w-[90px]', t('columns.currency'))}
              {sortHeader('legalEntity', 'min-w-[140px] flex-1', t('columns.legalEntity'))}
              {/* Проект — только при включённом модуле «Проекты» */}
              {appStore.projectActive && (
                sortHeader('project', 'min-w-[140px] flex-1', t('columns.project'))
              )}
              {sortHeader('period', 'w-[220px]', t('columns.period'))}
              {sortHeader('modifiedDate', 'w-[120px]', t('columns.modifiedDate'))}
              <div className="w-[50px]" />
            </div>
            <div className="flex flex-col">
              {visible.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBudget(item.id)}
                  onKeyDown={rowKeyHandler(item.id)}
                  className="flex min-h-[52px] cursor-pointer items-center border-b border-slate-100 bg-white text-sm transition-colors hover:bg-[#f5f8ff]"
                >
                  <div className="flex w-[300px] items-center gap-2.5 pl-4 pr-3">
                    <span className="truncate font-medium text-slate-900">{item.name}</span>
                    {item.timeline.status && (
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[item.timeline.status])}>
                        {tb(`status.${item.timeline.status}`)}
                      </span>
                    )}
                  </div>
                  <div className="w-[90px] px-3 font-medium text-slate-600">{item.currency || '—'}</div>
                  <div className="min-w-[140px] flex-1 truncate px-3 text-slate-600">{item.legalEntity || '—'}</div>
                  {appStore.projectActive && (
                    <div className="min-w-[140px] flex-1 truncate px-3 text-slate-600">{item.project || '—'}</div>
                  )}
                  <div className="flex w-[220px] flex-col gap-1 px-3">
                    <span className="text-xs text-slate-700">{item.period}</span>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', BAR_STYLE[item.timeline.status] || 'bg-slate-300')}
                        style={{ width: `${item.timeline.total ? (item.timeline.done / item.timeline.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-[120px] px-3 text-xs tabular-nums text-slate-600">{item.modifiedDate || '—'}</div>
                  <div className="flex w-[50px] justify-center" onClick={(e) => e.stopPropagation()}>
                    {menuFor(item)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </TableCard>

      <BudgetFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={submit}
        budget={editing}
        t={tf}
        monthLabels={monthLabels}
        legalEntities={legalEntities}
        projects={projects}
        currencies={currencies}
        isSaving={createBudget.isPending || updateBudget.isPending}
      />
    </div>
  )
}

// observer: колонка «Проект» и права зависят от appStore
export default observer(BudgetListPage)
