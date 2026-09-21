import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { STATUS_COLORS } from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount } from '@/utils/helpers'
import { FolderKanban, Pencil, Trash2 } from 'lucide-react'
import InfiniteScroll from 'react-infinite-scroll-component'

// Суммы показываем целыми — как в карточках проекта, копейки тут не нужны
const money = (v) => (v == null ? '–' : formatAmount(Math.round(Number(v) || 0)))
const percent = (v) => (v == null ? '–' : `${Number(v).toFixed(1)}%`)
const dateText = (d) => (d ? formatDateFormat(d) : '–')

// Цвет суммы по знаку; ноль — бледный
const signTone = (v) => {
  const n = Number(v) || 0
  return n > 0 ? 'text-emerald-700' : n < 0 ? 'text-red-600' : 'text-slate-400'
}

// Ширины колонок таблицы — общие для шапки и строк
const COL = {
  name: 'min-w-[220px] flex-1',
  group: 'w-40 shrink-0',
  period: 'w-52 shrink-0',
  status: 'w-32 shrink-0',
  money: 'w-32 shrink-0',
  margin: 'w-28 shrink-0',
  menu: 'w-10 shrink-0',
}

/** Какая доля срока проекта уже прошла, 0–100; null — если дат нет. */
const elapsedPercent = (start, end) => {
  if (!start || !end) return null
  const from = new Date(start).getTime()
  const to = new Date(end).getTime()
  if (!(to > from)) return null
  return Math.round(Math.max(0, Math.min(1, (Date.now() - from) / (to - from))) * 100)
}

/**
 * Список проектов: таблица или карточки (переключатель над списком).
 * Колонки и данные таблицы прежние.
 */
export default function ProjectsTable({
  t,
  ts,
  tc,
  view = 'list',
  projects,
  isLoading,
  hasNextPage,
  fetchNextPage,
  onRowClick,
  onEdit,
  onDelete,
}) {
  const symbol = GlobalCurrency?.name
  const isCards = view === 'cards'

  const rowProps = { t, ts, tc, onRowClick, onEdit, onDelete }

  return (
    <>
      {!isCards && (
        <div className="sticky top-16 z-30 flex h-10 items-center border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          <div className={cn(COL.name, 'pl-4 pr-3')}>{t('table.name')}</div>
          <div className={cn(COL.group, 'px-3')}>{t('table.group')}</div>
          <div className={cn(COL.period, 'px-3')}>{t('table.start')} / {t('table.end')}</div>
          <div className={cn(COL.status, 'px-3')}>{t('table.status')}</div>
          <div className={cn(COL.money, 'px-3 text-right')}>{t('table.income')}, {symbol}</div>
          <div className={cn(COL.money, 'px-3 text-right')}>{t('table.expenses')}, {symbol}</div>
          <div className={cn(COL.money, 'px-3 text-right')}>{t('table.profit')}, {symbol}</div>
          <div className={cn(COL.margin, 'px-3 text-right')}>{t('table.profitability')}</div>
          <div className={COL.menu} />
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className={cn('flex flex-col items-center gap-2 py-20 text-center', isCards && 'rounded-xl border border-slate-200 bg-white')}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FolderKanban size={22} aria-hidden="true" />
          </span>
          <span className="text-sm text-slate-500">{t('empty')}</span>
        </div>
      )}

      <InfiniteScroll
        dataLength={projects.length}
        hasMore={!!hasNextPage}
        next={fetchNextPage}
        loader={null}
        scrollThreshold={0.6}
        scrollableTarget="scrollableDiv"
      >
        {isCards ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} symbol={symbol} {...rowProps} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} {...rowProps} />
            ))}
          </div>
        )}
      </InfiniteScroll>
    </>
  )
}

// ─── Части строки ───────────────────────────────────────────────────────────

function StatusPill({ status, ts }) {
  const color = STATUS_COLORS[status] || '#64748b'
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{ts(status)}</span>
    </span>
  )
}

/** Полоса срока проекта цветом статуса. */
function TermBar({ project, className }) {
  const value = elapsedPercent(project.startDate, project.endDate)
  if (value == null) return null
  const color = STATUS_COLORS[project.status] || '#94a3b8'
  return (
    <div className={cn('h-1 overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  )
}

function ProjectMenu({ project, tc, onEdit, onDelete }) {
  if (!onEdit && !onDelete) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RowActionsTrigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 p-1.5" align="end">
        {onEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(project)}
            className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
          >
            <Pencil size={15} /> <span>{tc('edit')}</span>
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(project)}
            className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none text-red-600"
          >
            <Trash2 size={15} /> <span>{tc('delete')}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProjectRow({ project, ts, tc, onRowClick, onEdit, onDelete }) {
  return (
    <div
      onClick={() => onRowClick(project)}
      className="flex min-h-[56px] cursor-pointer items-center border-b border-slate-100 bg-white text-sm transition-colors hover:bg-[#f5f8ff]"
    >
      {/* Название + комментарий */}
      <div className={cn(COL.name, 'flex min-w-0 items-center gap-3 pl-4 pr-3')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FolderKanban size={16} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-slate-900">{project.name}</span>
          {project.comment && <span className="truncate text-xs text-slate-400">{project.comment}</span>}
        </div>
      </div>

      {/* Группа */}
      <div className={cn(COL.group, 'px-3')}>
        {project.groupName ? (
          <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {project.groupName}
          </span>
        ) : (
          <span className="text-slate-300">–</span>
        )}
      </div>

      {/* Начало → конец и полоса срока */}
      <div className={cn(COL.period, 'flex flex-col gap-1 px-3')}>
        <span className="text-xs tabular-nums text-slate-600">
          {dateText(project.startDate)} → {dateText(project.endDate)}
        </span>
        <TermBar project={project} />
      </div>

      {/* Статус */}
      <div className={cn(COL.status, 'px-3')}>
        <StatusPill status={project.status} ts={ts} />
      </div>

      {/* Доходы / Расходы / Прибыль / Рентабельность — из list_projects */}
      <div className={cn(COL.money, 'px-3 text-right tabular-nums text-slate-900')}>{money(project.income)}</div>
      <div className={cn(COL.money, 'px-3 text-right tabular-nums text-slate-900')}>{money(project.expenses)}</div>
      <div className={cn(COL.money, 'px-3 text-right font-medium tabular-nums', signTone(project.profit))}>{money(project.profit)}</div>
      <div className={cn(COL.margin, 'px-3 text-right tabular-nums', signTone(project.profitability))}>{percent(project.profitability)}</div>

      {/* Меню действий — только доступные по правам пункты */}
      <div className={cn(COL.menu, 'flex items-center justify-center')} onClick={(e) => e.stopPropagation()}>
        <ProjectMenu project={project} tc={tc} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

function ProjectCard({ project, symbol, t, ts, tc, onRowClick, onEdit, onDelete }) {
  const elapsed = elapsedPercent(project.startDate, project.endDate)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRowClick(project)
        }
      }}
      className="flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0e73f6]/50 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FolderKanban size={18} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-slate-900">{project.name}</span>
          <span className="truncate text-xs text-slate-400">{project.groupName || project.comment || '–'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <StatusPill status={project.status} ts={ts} />
          <ProjectMenu project={project} tc={tc} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Деньги проекта */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-slate-500">{t('table.income')}</span>
          <span className="truncate text-sm font-medium tabular-nums text-slate-900">{money(project.income)}</span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-slate-500">{t('table.expenses')}</span>
          <span className="truncate text-sm font-medium tabular-nums text-slate-900">{money(project.expenses)}</span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-slate-500">{t('table.profit')}, {symbol}</span>
          <span className={cn('truncate text-sm font-semibold tabular-nums', signTone(project.profit))}>{money(project.profit)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{t('table.profitability')}</span>
        <span className={cn('font-semibold tabular-nums', signTone(project.profitability))}>{percent(project.profitability)}</span>
      </div>

      {/* Срок проекта */}
      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="tabular-nums text-slate-600">
            {dateText(project.startDate)} → {dateText(project.endDate)}
          </span>
          {elapsed != null && <span className="tabular-nums text-slate-500">{t('termElapsed', { percent: elapsed })}</span>}
        </div>
        <TermBar project={project} className="h-1.5" />
      </div>
    </div>
  )
}
