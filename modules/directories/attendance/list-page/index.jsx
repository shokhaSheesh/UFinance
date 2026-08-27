'use client'

import SelectCounterPartyGroup from '@/components/ReadyComponents/SelectCounterPartyGroup'
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import AttendanceGrid from './components/AttendanceGrid'
import AttendanceTotals from './components/AttendanceTotals'
import { buildDays, useAttendanceReport } from './hooks/useAttendanceReport'

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const LIMIT = 100
const pad = (value) => String(value).padStart(2, '0')

const LEGEND = [
  { key: 'present', Icon: Check, className: 'bg-emerald-50 text-emerald-600', countKey: 'present_count', percentKey: 'present_percent' },
  { key: 'late', Icon: Clock, className: 'bg-amber-50 text-amber-600', countKey: 'late_count', percentKey: 'late_percent' },
  { key: 'absent', Icon: X, className: 'bg-red-50 text-red-500', countKey: 'absent_count', percentKey: 'absent_percent' },
]

const formatLegendPercent = (value) => {
  const number = Number(value)
  if (value === null || value === undefined || Number.isNaN(number)) return null
  return `${number.toFixed(number % 1 === 0 ? 0 : 2)}%`
}

// Отчёт «Посещаемость»: месяц по горизонтали, ученики по вертикали
const AttendanceReportPage = observer(() => {
  const t = useTranslations('Reports.attendance')

  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [groupIds, setGroupIds] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const days = useMemo(() => buildDays(cursor.year, cursor.month), [cursor])
  const fromDate = `${cursor.year}-${pad(cursor.month + 1)}-01`
  const toDate = `${cursor.year}-${pad(cursor.month + 1)}-${pad(days.length)}`

  const { rows, pagination, totals, isLoading, isFetching } = useAttendanceReport({
    fromDate,
    toDate,
    groupIds,
    search,
    page,
    limit: LIMIT,
  })

  // при смене периода или фильтров возвращаемся на первую страницу
  const shiftMonth = (delta) => {
    setPage(1)
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const hasMore = pagination ? pagination.page < pagination.totalPages : false

  return (
    <div className="w-[calc(100%-80px)] flex flex-col h-[calc(100%-60px)] fixed left-[80px] top-[60px] bg-gray-ucode-50">
      <div className="flex items-center justify-between gap-4 px-6 h-16 bg-white border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-semibold text-gray-ucode-800 whitespace-nowrap">
          {t('title')}
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-ucode-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-gray-ucode-200 rounded-md outline-none transition-colors placeholder:text-gray-ucode-400 focus:border-primary"
            />
          </div>

          <div className="w-56">
            <SelectCounterPartyGroup
              multi
              value={groupIds}
              onChange={(value) => {
                setGroupIds(value)
                setPage(1)
              }}
              className="bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-4">
              {LEGEND.map(({ key, Icon, className, countKey, percentKey }) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-ucode-500 whitespace-nowrap">
                  <span className={`size-5 rounded-md grid place-items-center ${className}`}>
                    <Icon size={12} strokeWidth={3} />
                  </span>
                  {t(`legend.${key}`)}
                  {totals && (
                    <span className="text-gray-ucode-800 font-semibold">
                      {Number(totals[countKey] || 0).toLocaleString('ru-RU')}
                      {formatLegendPercent(totals[percentKey]) && (
                        <span className="ml-1 font-normal text-gray-ucode-400">
                          {formatLegendPercent(totals[percentKey])}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              ))}
              {isFetching && !isLoading && (
                <Loader2 size={15} className="animate-spin text-gray-ucode-400" />
              )}
            </div>

            <AttendanceTotals totals={totals} isLoading={isLoading} />

            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label={t('prevMonth')}
                className="p-1.5 rounded-md text-gray-ucode-500 hover:bg-gray-ucode-100 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-gray-ucode-800 min-w-[130px] text-center">
                {MONTHS[cursor.month]} {cursor.year}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                aria-label={t('nextMonth')}
                className="p-1.5 rounded-md text-gray-ucode-500 hover:bg-gray-ucode-100 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <AttendanceGrid rows={rows} days={days} isLoading={isLoading} />
          </div>

          {hasMore && (
            <div className="flex justify-center py-3 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={isFetching}
                className="outline-btn"
              >
                {t('loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default AttendanceReportPage
