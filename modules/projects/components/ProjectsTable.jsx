import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import { STATUS_COLORS } from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount } from '@/utils/helpers'
import { Pencil, Trash2 } from 'lucide-react'
import InfiniteScroll from 'react-infinite-scroll-component'
import styles from '../projects.module.scss'
import ProjectsTableHeader from './ProjectsTableHeader'

// Суммы показываем целыми — как в карточках проекта, копейки тут не нужны
const money = (v) => (v == null ? '–' : formatAmount(Math.round(Number(v) || 0)))
const percent = (v) => (v == null ? '–' : `${Number(v).toFixed(1)}%`)
const dateText = (d) => (d ? formatDateFormat(d) : '–')

export default function ProjectsTable({
  t,
  ts,
  tc,
  projects,
  isLoading,
  hasNextPage,
  fetchNextPage,
  onRowClick,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <ProjectsTableHeader t={t} />

      {projects.length === 0 && !isLoading && (
        <div className="py-20 text-center text-neutral-500 text-sm">{t('empty')}</div>
      )}

      <InfiniteScroll
        dataLength={projects.length}
        hasMore={!!hasNextPage}
        next={fetchNextPage}
        loader={null}
        scrollThreshold={0.6}
        scrollableTarget="scrollableDiv"
      >
        <div className="flex flex-col pb-16">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              ts={ts}
              tc={tc}
              onRowClick={onRowClick}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </InfiniteScroll>
    </>
  )
}

function ProjectRow({ project, ts, tc, onRowClick, onEdit, onDelete }) {
  const color = STATUS_COLORS[project.status]
  const profitPositive = project.profit > 0
  const profitNegative = project.profit < 0
  const marginPositive = project.profitability > 0
  const marginNegative = project.profitability < 0

  return (
    <div
      onClick={() => onRowClick(project)}
      className="flex items-center min-h-14 border-b border-neutral-100 hover:bg-neutral-50 group cursor-pointer text-xs"
    >
      {/* Название + комментарий */}
      <div className="flex-1 min-w-40 flex flex-col pl-4 pr-2">
        <p className="truncate font-medium text-slate-900">{project.name}</p>
        {project.comment && <p className="text-neutral-400 truncate">{project.comment}</p>}
      </div>

      {/* Группа */}
      <div className="w-40 shrink-0 px-2 truncate text-neutral-600">{project.groupName || '–'}</div>

      {/* Начало / Конец */}
      <div className="w-40 shrink-0 px-2 flex flex-col text-neutral-600">
        <span>{dateText(project.startDate)}</span>
        <span className="text-neutral-400">{dateText(project.endDate)}</span>
      </div>

      {/* Статус */}
      <div className="w-32 shrink-0 px-2 flex items-center">
        <span className={styles.status} style={{ color, backgroundColor: `${color}1A` }}>
          {ts(project.status)}
        </span>
      </div>

      {/* Доходы / Расходы / Прибыль / Рентабельность — из list_projects */}
      <div className="w-32 shrink-0 px-2 text-end text-slate-900">{money(project.income)}</div>
      <div className="w-28 shrink-0 px-2 text-end text-slate-900">{money(project.expenses)}</div>
      <div
        className={cn(
          'w-32 shrink-0 px-2 text-end font-medium',
          profitPositive && 'text-emerald-600',
          profitNegative && 'text-red-600',
          !profitPositive && !profitNegative && 'text-slate-900'
        )}
      >
        {money(project.profit)}
      </div>
      <div
        className={cn(
          'w-32 shrink-0 px-2 text-end',
          marginPositive && 'text-emerald-600',
          marginNegative && 'text-red-600',
          !marginPositive && !marginNegative && 'text-slate-900'
        )}
      >
        {percent(project.profitability)}
      </div>

      {/* Меню действий — только доступные по правам пункты */}
      <div className="w-10 shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {(onEdit || onDelete) && (
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
        )}
      </div>
    </div>
  )
}
