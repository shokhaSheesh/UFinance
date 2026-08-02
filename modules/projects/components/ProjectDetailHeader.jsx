'use client'

import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronRight, EllipsisVertical, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import moment from 'moment'
import styles from '../projects.module.scss'

const fmt = (d) => (d ? moment(d).format('DD.MM.YY') : '—')

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
  onDelete,
}) {
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
            <span
              className={styles.status}
              style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
            >
              {ts(project?.status)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>
              {fmt(project?.startDate)}—{fmt(project?.endDate)}
            </span>
            <HelpCircle size={13} className="text-neutral-300" />
          </div>
        </div>

        {/* Меню действий — только доступные по правам пункты */}
        {(onEdit || onToggleStatus || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="outline-btn h-9 px-2.5">
                <EllipsisVertical size={18} className="text-neutral-500" />
              </button>
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
