'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Clock, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { buildAttendanceMap } from '../hooks/useAttendanceReport'

const NAME_COL = 'w-[280px] min-w-[280px]'
// Ограничиваем каскад, иначе большая группа раскрывается заметно дольше анимации
const STAGGER_LIMIT = 12

// Оформление ячейки по статусу бэкенда: present / late / absent
const CELL = {
  present: { className: 'bg-emerald-50 text-emerald-600', Icon: Check },
  late: { className: 'bg-amber-50 text-amber-600', Icon: Clock },
  absent: { className: 'bg-red-50 text-red-500', Icon: X },
}

const AVATAR_COLORS = ['#f0956a', '#7bc47f', '#6aa9f0', '#c58ae0', '#e0b45c', '#5fc4c0', '#e08a9c', '#8f9bd6']

const initialsOf = (name) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()

const colorOf = (key) => {
  let hash = 0
  for (let i = 0; i < String(key).length; i += 1) hash += String(key).charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** Ученики, сгруппированные по группе контрагентов, с сохранением порядка от API */
const groupRows = (rows, noGroupLabel) => {
  const groups = []
  const index = {}

  rows.forEach((row) => {
    const group = row.counterparties_group
    const key = group?.guid || group?.id || group?.nazvanie_gruppy || '__none__'

    if (!index[key]) {
      index[key] = { key, title: group?.nazvanie_gruppy || noGroupLabel, items: [] }
      groups.push(index[key])
    }

    index[key].items.push(row)
  })

  return groups
}

function StatusCell({ mark, t }) {
  if (!mark?.status || !CELL[mark.status]) {
    return <span className="size-7 rounded-lg bg-gray-ucode-50/80" />
  }

  const { className, Icon } = CELL[mark.status]
  const cellClassName = `size-7 rounded-lg grid place-items-center transition-transform duration-250 group-hover/row:scale-110 ${className}`
  const description = mark.description?.trim()

  // У отсутствия причина важнее всего: показываем её подсказкой, а если
  // причину не указали — хотя бы сам статус. В сетке для текста места нет.
  const tip =
    mark.status === 'absent' ? description || t('legend.absent') : description

  if (!tip) {
    return (
      <span className={cellClassName}>
        <Icon size={15} strokeWidth={3} />
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={`${cellClassName} cursor-default`} />}>
        <Icon size={15} strokeWidth={3} />
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] whitespace-pre-line">{tip}</TooltipContent>
    </Tooltip>
  )
}

function StudentRow({ row, days, t, index, isLast, isClosing }) {
  const marks = useMemo(() => buildAttendanceMap(row.attendances), [row.attendances])
  const delay = Math.min(index, STAGGER_LIMIT) * 0.025

  return (
    <div
      className="flex h-12 border-b border-gray-ucode-100 last:border-b-0 hover:bg-gray-ucode-25 transition-colors group/row"
      style={{
        animation: isClosing
          ? 'fadeSlideOut 0.18s ease-in forwards'
          : `fadeSlideUp 0.24s ease-out ${delay}s backwards`,
      }}
    >
      <div
        className={cn(
          NAME_COL,
          'relative sticky left-0 z-10 flex items-center gap-2.5 border-r border-l-2 border-l-transparent border-gray-ucode-200 bg-white pl-11 pr-4 transition-colors group-hover/row:bg-gray-ucode-25',
        )}
      >
        {/* направляющие линии дерева: у последнего ученика ветка обрывается */}
        <span
          className={cn(
            'absolute left-[25px] w-px bg-gray-ucode-200',
            isLast ? 'top-0 h-1/2' : 'inset-y-0',
          )}
        />
        <span className="absolute left-[25px] top-1/2 h-px w-2.5 bg-gray-ucode-200" />

        <span
          className="size-8 shrink-0 rounded-full grid place-items-center text-mini font-semibold text-white shadow-sm"
          style={{ background: colorOf(row.counterparties_id) }}
        >
          {initialsOf(row.nazvanie)}
        </span>
        <span className="min-w-0 truncate text-sm font-medium text-gray-ucode-800">
          {row.nazvanie || '—'}
        </span>
      </div>

      {days.map((day) => (
        <div
          key={day.iso}
          className={cn(
            'w-11 shrink-0 grid place-items-center',
            day.isWeekend && 'bg-gray-ucode-50/60',
          )}
        >
          <StatusCell mark={marks[day.iso]} t={t} />
        </div>
      ))}
    </div>
  )
}

function GroupSection({ group, days, t, index, state, onToggle }) {
  const isClosing = state === 'closing'
  const isOpen = state !== 'collapsed'
  const isAnimating = state === 'opening' || isClosing

  return (
    <div style={{ animation: `fadeSlideUp 0.3s ease-out ${Math.min(index, STAGGER_LIMIT) * 0.05}s backwards` }}>
      <div
        onClick={() => onToggle(group.key)}
        className="flex h-11 bg-gray-ucode-50 border-b border-gray-ucode-200 cursor-pointer group/head"
      >
        <button
          type="button"
          aria-expanded={isOpen}
          className={cn(
            NAME_COL,
            'sticky left-0 z-10 flex items-center gap-2 border-r border-gray-ucode-200 border-l-2 bg-gray-ucode-50 px-3 text-left cursor-pointer transition-colors duration-250 hover:bg-gray-ucode-100 group-hover/head:bg-gray-ucode-100',
            isOpen ? 'border-l-primary' : 'border-l-transparent',
          )}
        >
          <span
            className={cn(
              'size-5 shrink-0 grid place-items-center rounded-md text-gray-ucode-400 transition-all duration-250',
              isOpen ? 'rotate-90 text-primary bg-primary/10' : 'rotate-0',
            )}
          >
            <ChevronRight size={15} strokeWidth={2.5} />
          </span>

          <span className="truncate text-sm font-semibold text-gray-ucode-800">
            {group.title}
          </span>

          <span className="ml-auto shrink-0 rounded-full bg-gray-ucode-200/70 px-2 py-0.5 text-mini font-semibold text-gray-ucode-600 tabular-nums">
            {group.items.length}
          </span>
        </button>

        {days.map((day) => (
          <div
            key={day.iso}
            className={cn('w-11 shrink-0', day.isWeekend && 'bg-gray-ucode-100/70')}
          />
        ))}
      </div>

      {isOpen && (
        <div
          className={cn(
            'grid',
            isAnimating &&
              (isClosing
                ? 'animate-[collapseUp_0.25s_ease-in-out_forwards]'
                : 'animate-[expandDown_0.3s_ease-out_forwards]'),
          )}
          onAnimationEnd={(event) => {
            // анимации строк всплывают сюда же — реагируем только на свою
            if (event.target === event.currentTarget) onToggle(group.key, 'settle')
          }}
        >
          {/* overflow-hidden нужен только на время анимации: постоянный клип
              сломал бы sticky-колонку с именами при горизонтальном скролле */}
          <div className={cn('min-h-0', isAnimating && 'overflow-hidden')}>
            {group.items.map((row, rowIndex) => (
              <StudentRow
                key={row.counterparties_id}
                row={row}
                days={days}
                t={t}
                index={rowIndex}
                isLast={rowIndex === group.items.length - 1}
                isClosing={isClosing}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AttendanceGrid({ rows, days, isLoading }) {
  const t = useTranslations('Reports.attendance')

  // В стейте держим только группы, состояние которых отличается от «раскрыта»,
  // поэтому новые группы после смены фильтра приходят раскрытыми
  const [states, setStates] = useState({})

  const groups = useMemo(() => groupRows(rows, t('noGroup')), [rows, t])

  const handleToggle = (key, action) => {
    setStates((prev) => {
      const current = prev[key] || 'open'

      if (action === 'settle') {
        if (current === 'closing') return { ...prev, [key]: 'collapsed' }
        if (current === 'opening') return { ...prev, [key]: 'open' }
        return prev
      }

      return { ...prev, [key]: current === 'collapsed' ? 'opening' : 'closing' }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-7 flex-1 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return <div className="py-16 text-center text-sm text-gray-ucode-400">{t('empty')}</div>
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-max">
        {/* шапка с числами и днями недели */}
        <div className="flex sticky top-0 z-20 bg-gray-ucode-25 border-b border-gray-ucode-200">
          <div
            className={cn(
              NAME_COL,
              'sticky left-0 z-30 flex items-center border-r border-gray-ucode-200 bg-gray-ucode-25 px-4 py-2.5 text-xs font-medium text-gray-ucode-600',
            )}
          >
            {t('student')}
          </div>

          {days.map((day) => (
            <div
              key={day.iso}
              className={cn('w-11 shrink-0 py-1.5 text-center', day.isWeekend && 'bg-gray-ucode-100')}
            >
              <div className="text-xs font-semibold text-gray-ucode-800">{day.day}</div>
              <div className="text-mini text-gray-ucode-400">{day.label}</div>
            </div>
          ))}
        </div>

        {groups.map((group, index) => (
          <GroupSection
            key={group.key}
            group={group}
            days={days}
            t={t}
            index={index}
            state={states[group.key] || 'open'}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
