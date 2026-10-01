'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from '@/components/mobile/icons'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Выбор даты панелью снизу.
 *
 * Родное поле `input[type=date]` на телефоне открывает системный барабан:
 * он закрывает пол-экрана, его внешний вид зависит от прошивки, и по нему
 * не видно ни дня недели, ни соседних месяцев. Здесь обычный месяц сеткой,
 * как в банковских приложениях: понятно, куда попадает дата, и одним
 * касанием можно уйти на месяц назад или вперёд.
 */
export default function CalendarSheet({ open, onClose, value, onChange, title }) {
  const t = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const [cursor, setCursor] = useState(() => moment(value || undefined).startOf('month'))
  const [selected, setSelected] = useState(() => (value ? moment(value) : moment()))

  // Недели месяца с «хвостами» соседних месяцев, чтобы сетка была ровной
  const weeks = useMemo(() => {
    const start = cursor.clone().startOf('month').startOf('isoWeek')
    const end = cursor.clone().endOf('month').endOf('isoWeek')
    const days = []
    const day = start.clone()
    while (day.isSameOrBefore(end, 'day')) {
      days.push(day.clone())
      day.add(1, 'day')
    }
    return days.reduce((rows, item, index) => {
      if (index % 7 === 0) rows.push([])
      rows[rows.length - 1].push(item)
      return rows
    }, [])
  }, [cursor])

  const weekdays = useMemo(() => {
    const start = moment().startOf('isoWeek')
    return Array.from({ length: 7 }, (_, index) => start.clone().add(index, 'day').format('dd'))
  }, [])

  const apply = () => {
    onChange(selected.format('YYYY-MM-DD'))
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelected(moment())
              setCursor(moment().startOf('month'))
            }}
            className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700 active:bg-slate-200"
          >
            {t('form.today')}
          </button>
          <button
            type="button"
            onClick={apply}
            className="h-12 flex-1 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4]"
          >
            {tc('save')}
          </button>
        </div>
      }
    >
      {/* Месяц и переходы по месяцам */}
      <div className="flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={() => setCursor(cursor.clone().subtract(1, 'month'))}
          aria-label={t('form.prevMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className="text-[15px] font-bold text-slate-900">{cursor.format('MMMM YYYY')}</span>
        <button
          type="button"
          onClick={() => setCursor(cursor.clone().add(1, 'month'))}
          aria-label={t('form.nextMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold text-slate-400 uppercase">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week) => (
          <div key={week[0].format('YYYY-MM-DD')} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const isCurrentMonth = day.isSame(cursor, 'month')
              const isSelected = day.isSame(selected, 'day')
              const isToday = day.isSame(moment(), 'day')
              return (
                <button
                  key={day.format('YYYY-MM-DD')}
                  type="button"
                  onClick={() => {
                    setSelected(day.clone())
                    if (!isCurrentMonth) setCursor(day.clone().startOf('month'))
                  }}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-full text-[15px] tabular-nums',
                    isSelected
                      ? 'bg-[#0e73f6] font-bold text-white'
                      : isCurrentMonth
                        ? 'text-slate-900 active:bg-slate-100'
                        : 'text-slate-300',
                    !isSelected && isToday && 'font-bold text-[#0e73f6]'
                  )}
                >
                  {day.date()}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
