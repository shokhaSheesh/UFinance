'use client'

import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import { STATUS_COLORS } from '@/lib/api/ucode/projects'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import HintQuestion from '@/components/shared/HintQuestion'
import Link from 'next/link'
import moment from 'moment'
import styles from '../projects.module.scss'

const fmt = (d) => (d ? moment(d).format('DD.MM.YY') : '—')

// Статусы, которые переключаются прямо из бейджа: «В работе» ↔ «Завершен».
// Плановый проект так не переводится — для него остаётся пункт в меню «⋮».
const SWITCHABLE_STATUSES = ['in_progress', 'completed']

/**
 * Шапка детальной страницы проекта: хлебные крошки, название + статус,
 * период действия и панель фильтров анализа.
 */
export default function ProjectDetailHeader({
  td,
  ts,
  tc,
  project,
  groupName,
  statusColor,
  analysisMethod,
  methodOptions,
  planSource,
  planSourceOptions,
  dateRange,
  dateRangeType,
  onMethodChange,
  onPlanSourceChange,
  onDateRangeChange,
  onDateRangeTypeChange,
  onEdit,
  onToggleStatus,
  onStatusChange,
  isStatusPending = false,
  onDelete,
}) {
  const canSwitchStatus = !!onStatusChange && SWITCHABLE_STATUSES.includes(project?.status)

  const statusBadge = (
    <span
      className={styles.status}
      style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
    >
      {ts(project?.status)}
    </span>
  )

  return (
    <div className="px-6 pt-4 bg-white">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
        <Link href="/projects" className="hover:text-primary transition-colors">
          {td('allProjects')}
        </Link>
        {groupName && (
          <>
            <ChevronRight size={13} className="text-neutral-300" />
            <span className="text-neutral-600">{groupName}</span>
          </>
        )}
      </div>

      {/* Название + статус + меню */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 m-0">{project?.name}</h1>

            {/* Статус — меню смены «В работе» ↔ «Завершен» */}
            {canSwitchStatus ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isStatusPending}
                    className="group flex items-center gap-1 rounded-[10px] border-none bg-transparent p-0 cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {statusBadge}
                    <ChevronDown
                      size={14}
                      className="transition-transform duration-200 group-data-popup-open:rotate-180"
                      style={{ color: statusColor }}
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" sideOffset={6} className="w-44! rounded-lg border border-neutral-200 p-1.5">
                  {SWITCHABLE_STATUSES.map((key) => {
                    const isCurrent = key === project?.status
                    return (
                      <DropdownMenuItem
                        key={key}
                        disabled={isCurrent}
                        onClick={() => onStatusChange(key)}
                        className="h-9 justify-between rounded-md px-2.5 text-neutral-700 data-disabled:opacity-100!"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[key] }}
                          />
                          {ts(key)}
                        </span>
                        {isCurrent && <Check size={15} className="text-emerald-500" />}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              statusBadge
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>
              {fmt(project?.startDate)}—{fmt(project?.endDate)}
            </span>
            <HintQuestion size={13} className="text-neutral-300" />
          </div>
        </div>

        {/* Меню действий — только доступные по правам пункты */}
        {(onEdit || onToggleStatus || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
          <RowActionsTrigger />
        </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 p-1.5" align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none">
                  {tc('edit')}
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={onToggleStatus} className="cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none">
                  {td('toggleStatus')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none text-red-600">
                  {tc('delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Панель фильтров */}
      <div className="flex items-end gap-3 mt-5">
        <div className="w-64">
          <label className="block text-[11px] text-neutral-400 mb-1">{td('period')}</label>
          <NewDateRangeComponent
            value={dateRange}
            onChange={(range) => onDateRangeChange({ start: range.start, end: range.end })}
            present={dateRangeType}
            onSetPresent={onDateRangeTypeChange}
            onClear={() => onDateRangeTypeChange('')}
          />
        </div>
        <div className="w-60">
          <label className="block text-[11px] text-neutral-400 mb-1">{td('analysisIndicator')}</label>
          <SingleSelect
            data={methodOptions}
            value={analysisMethod}
            withSearch={false}
            isClearable={false}
            onChange={onMethodChange}
            className="bg-white"
          />
        </div>
        <div className="w-52">
          <label className="block text-[11px] text-neutral-400 mb-1">{td('planSource')}</label>
          <SingleSelect
            data={planSourceOptions}
            value={planSource}
            withSearch={false}
            isClearable={false}
            onChange={onPlanSourceChange}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  )
}
