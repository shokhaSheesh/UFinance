'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU')

// Проценты приходят с бэка (доля от expected_count); marked_percent считаем сами
const formatPercent = (value) => {
  if (value === null || value === undefined) return null
  const number = Number(value)
  if (Number.isNaN(number)) return null
  return `${number.toFixed(number % 1 === 0 ? 0 : 2)}%`
}

function Stat({ label, value, percent, valueClassName = 'text-gray-ucode-800' }) {
  return (
    <div className="flex flex-col leading-tight whitespace-nowrap">
      <span className="text-[11px] text-gray-ucode-400">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
        {percent && <span className="text-[11px] text-gray-ucode-400">{percent}</span>}
      </span>
    </div>
  )
}

/** Сводка по периоду: сколько учеников, рабочих дней и как закрыты отметки */
const AttendanceTotals = ({ totals, isLoading }) => {
  const t = useTranslations('Reports.attendance.totals')

  if (isLoading) {
    return (
      <div className="flex items-center gap-6">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (!totals) return null

  const markedPercent =
    totals.not_marked_percent !== undefined && totals.not_marked_percent !== null
      ? 100 - Number(totals.not_marked_percent)
      : null

  return (
    <div className="flex items-center gap-5 overflow-x-auto">
      <Stat label={t('students')} value={formatNumber(totals.counterparties_count)} />
      <Stat label={t('workingDays')} value={formatNumber(totals.working_days)} />

      <span className="h-7 w-px bg-gray-ucode-200 shrink-0" />

      <Stat
        label={t('marked')}
        value={`${formatNumber(totals.marked_count)} / ${formatNumber(totals.expected_count)}`}
        percent={formatPercent(markedPercent)}
      />
      <Stat
        label={t('notMarked')}
        value={formatNumber(totals.not_marked_count)}
        percent={formatPercent(totals.not_marked_percent)}
        valueClassName="text-gray-ucode-500"
      />
    </div>
  )
}

export default AttendanceTotals
