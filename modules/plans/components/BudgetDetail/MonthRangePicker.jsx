'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BUDGET_TOKENS as T } from '@/modules/plans/utils/tokens'

const CELL_W = 51
const CELL_H = 54

const toKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`
const parse = (key) => {
  const [y, m] = key.split('-')
  return { year: parseInt(y, 10), month: parseInt(m, 10) }
}
const ord = (key) => {
  const { year, month } = parse(key)
  return year * 12 + month
}

/** Одна панель: «‹ 2026 ›» + сетка 4×3. */
const MonthPanel = ({ year, onYearChange, monthLabels, start, end, onPick }) => (
  <div style={{ padding: 8 }}>
    <div className='flex items-center justify-between' style={{ padding: '0 4px 6px' }}>
      <button
        type='button'
        onClick={() => onYearChange(year - 1)}
        className='flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-slate-100'
        style={{ color: '#667085' }}
      >
        <ChevronLeft className='h-4 w-4' />
      </button>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.textHeading }}>{year}</span>
      <button
        type='button'
        onClick={() => onYearChange(year + 1)}
        className='flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-slate-100'
        style={{ color: '#667085' }}
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>

    <div className='grid' style={{ gridTemplateColumns: `repeat(4, ${CELL_W}px)` }}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const key = toKey(year, month)
        const o = ord(key)
        const isStart = start && key === start
        const isEnd = end && key === end
        const inRange = start && end && o > ord(start) && o < ord(end)
        const selected = isStart || isEnd

        let radius = '0'
        if (isStart && isEnd) radius = '4px'
        else if (isStart) radius = '4px 0 0 4px'
        else if (isEnd) radius = '0 4px 4px 0'

        return (
          <button
            key={key}
            type='button'
            onClick={() => onPick(key)}
            className='transition-colors'
            style={{
              width: CELL_W,
              height: CELL_H,
              fontSize: 12,
              borderRadius: radius,
              color: selected ? '#fff' : T.textHeading,
              background: selected ? T.accent : inRange ? 'rgba(30,152,173,.10)' : 'transparent'
            }}
          >
            {monthLabels[month]}
          </button>
        )
      })}
    </div>
  </div>
)

/**
 * Выбор диапазона месяцев — как в модалке бюджета ПланФакт:
 * две панели (начало / конец), клик задаёт границу, при выборе конца раньше
 * начала границы меняются местами.
 *
 * @param {{start: string, end: string}} value ключи 'YYYY-MM'
 */
const MonthRangePicker = ({ value, onChange, monthLabels, hasError, width = 300 }) => {
  const [open, setOpen] = useState(false)
  const [leftYear, setLeftYear] = useState(() => parse(value.start).year)
  const [rightYear, setRightYear] = useState(() => parse(value.end).year)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (side) => (key) => {
    const next = side === 'start' ? { start: key, end: value.end } : { start: value.start, end: key }
    if (ord(next.start) > ord(next.end)) {
      onChange({ start: next.end, end: next.start })
      return
    }
    onChange(next)
  }

  const label = `${monthLabels[parse(value.start).month]} '${String(parse(value.start).year).slice(2)}—${monthLabels[
    parse(value.end).month
  ].toLowerCase()} '${String(parse(value.end).year).slice(2)}`

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex items-center gap-2 bg-white text-left'
        style={{
          width,
          height: 40,
          padding: '0 12px',
          border: `1px solid ${hasError ? '#ef4444' : open ? T.accent : '#d0d5dd'}`,
          borderRadius: 4,
          fontSize: 13,
          color: T.textHeading
        }}
      >
        <Calendar className='h-4 w-4 shrink-0' style={{ color: '#98a2b3' }} />
        <span className='truncate'>{label}</span>
      </button>

      {open && (
        <div
          className='absolute left-0 top-full z-50 mt-1 flex bg-white'
          style={{ border: '1px solid #d0d5dd', borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,.12)' }}
        >
          <MonthPanel
            year={leftYear}
            onYearChange={setLeftYear}
            monthLabels={monthLabels}
            start={value.start}
            end={value.end}
            onPick={pick('start')}
          />
          <div style={{ width: 1, background: '#eaecf0' }} />
          <MonthPanel
            year={rightYear}
            onYearChange={setRightYear}
            monthLabels={monthLabels}
            start={value.start}
            end={value.end}
            onPick={pick('end')}
          />
        </div>
      )}
    </div>
  )
}

export default MonthRangePicker
