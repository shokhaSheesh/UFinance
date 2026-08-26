'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Check, Clock, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buildAttendanceMap } from '../hooks/useAttendanceReport'

const NAME_COL = 'w-[280px] min-w-[280px]'

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

function StatusCell({ mark }) {
  if (!mark?.status || !CELL[mark.status]) {
    return <span className="size-7 rounded-lg bg-gray-ucode-50" />
  }

  const { className, Icon } = CELL[mark.status]
  return (
    <span
      // причину показываем подсказкой — в сетке для неё нет места
      title={mark.description || undefined}
      className={`size-7 rounded-lg grid place-items-center ${className}`}
    >
      <Icon size={15} strokeWidth={3} />
    </span>
  )
}

export default function AttendanceGrid({ rows, days, isLoading }) {
  const t = useTranslations('Reports.attendance')

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
    <div className="overflow-auto">
      <div className="min-w-max">
        {/* шапка с числами и днями недели */}
        <div className="flex sticky top-0 z-20 bg-gray-ucode-25 border-b border-gray-200">
          <div
            className={`${NAME_COL} sticky left-0 z-30 bg-gray-ucode-25 border-r border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-ucode-600 flex items-center`}
          >
            {t('student')}
          </div>

          {days.map((day) => (
            <div
              key={day.iso}
              className={`w-11 shrink-0 py-1.5 text-center ${day.isWeekend ? 'bg-gray-ucode-100' : ''}`}
            >
              <div className="text-xs font-semibold text-gray-ucode-800">{day.day}</div>
              <div className="text-mini text-gray-ucode-400">{day.label}</div>
            </div>
          ))}
        </div>

        {rows.map((row) => {
          const marks = buildAttendanceMap(row.attendances)

          return (
            <div
              key={row.counterparties_id}
              className="flex border-b border-gray-100 hover:bg-gray-ucode-25 transition-colors group"
            >
              <div
                className={`${NAME_COL} sticky left-0 z-10 bg-white group-hover:bg-gray-ucode-25 border-r border-gray-200 px-4 py-2 flex items-center gap-2.5 transition-colors`}
              >
                <span
                  className="size-8 shrink-0 rounded-full grid place-items-center text-mini font-semibold text-white"
                  style={{ background: colorOf(row.counterparties_id) }}
                >
                  {initialsOf(row.nazvanie)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-ucode-800 truncate">
                    {row.nazvanie || '—'}
                  </div>
                  <div className="text-xs text-gray-ucode-400 truncate">
                    {row.counterparties_group?.nazvanie_gruppy || '—'}
                  </div>
                </div>
              </div>

              {days.map((day) => (
                <div
                  key={day.iso}
                  className={`w-11 shrink-0 py-2 grid place-items-center ${day.isWeekend ? 'bg-gray-ucode-50/60' : ''}`}
                >
                  <StatusCell mark={marks[day.iso]} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
