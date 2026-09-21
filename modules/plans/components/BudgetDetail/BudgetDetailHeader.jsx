'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import { cn } from '@/lib/utils'
import { ArrowLeft, Download, FileSpreadsheet, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'

// 'YYYY-MM' → номер месяца от нуля
const monthIndex = (key) => {
  if (!key) return null
  const [y, m] = String(key).split('-').map(Number)
  return y && m ? y * 12 + (m - 1) : null
}

/** Где бюджет во времени — как на странице-списке бюджетов. */
const getTimeline = (period) => {
  const start = monthIndex(period?.start)
  const end = monthIndex(period?.end)
  if (start == null || end == null) return null
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
 * Шапка детальной страницы бюджета: ссылка назад к списку, значок и
 * название, чипы (тип / период / валюта), состояние бюджета и полоса
 * прошедших месяцев, справа — выгрузка и меню действий.
 */
const BudgetDetailHeader = ({ t, title, pills = [], period, onExport, onEdit, onDelete, backHref, backLabel }) => {
  const router = useRouter()
  const tb = useTranslations('Plans.budgetList')
  const timeline = getTimeline(period)

  return (
    <div className="shrink-0 px-6 pt-4">
      <button
        type="button"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 cursor-pointer transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {backLabel || t('breadcrumb.list')}
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
            <FileSpreadsheet size={20} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-slate-900">{title}</h1>
              {timeline && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[timeline.status])}>
                  {tb(`status.${timeline.status}`)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {pills.map((p) => (
                <span key={p} className="inline-flex items-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                  {p}
                </span>
              ))}
              {timeline && (
                <span className="ml-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={cn('block h-full rounded-full', BAR_STYLE[timeline.status])}
                      style={{ width: `${(timeline.done / timeline.total) * 100}%` }}
                    />
                  </span>
                  <span className="tabular-nums">{tb('monthsProgress', { done: timeline.done, total: timeline.total })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onExport && (
            <button type="button" onClick={onExport} className="secondary-btn h-9 gap-2">
              <Download className="h-4 w-4" />
              {t('downloadXls')}
            </button>
          )}
          {/* Меню действий — только если есть хотя бы одно доступное */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <RowActionsTrigger />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[162px] p-1" align="end">
                {onEdit && (
                  <DropdownMenuItem asChild>
                    <button className="flex w-full cursor-pointer items-center gap-2 text-sm outline-none" onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                      <span>{t('actions.edit')}</span>
                    </button>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem asChild>
                    <button className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#ed5564] outline-none" onClick={onDelete}>
                      <Trash2 className="h-4 w-4 text-[#ed5564]" />
                      <span>{t('actions.delete')}</span>
                    </button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}

export default BudgetDetailHeader
