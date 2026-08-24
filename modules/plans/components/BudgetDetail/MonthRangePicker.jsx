'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BUDGET_TOKENS as T } from '@/modules/plans/utils/tokens'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'

const CELL_W = 51
const CELL_H = 54
// Ширина попапа: две панели (сетка 4×CELL_W + padding 8+8) и разделитель 1px
const PANEL_W = 2 * (4 * CELL_W + 16) + 1

const toKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`
const parse = (key) => {
  const [y, m] = String(key ?? '').split('-')
  const year = parseInt(y, 10)
  const month = parseInt(m, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  return { year, month }
}
const ord = (key) => {
  const parsed = parse(key)
  return parsed ? parsed.year * 12 + parsed.month : 0
}

// У бюджета может не быть дат (start_date/end_date приходят null) — тогда
// показываем текущий год целиком, вместо падения на разборе пустого ключа.
const normalizeRange = (value) => {
  const fallbackYear = new Date().getFullYear()
  return {
    start: parse(value?.start) ? value.start : toKey(fallbackYear, 1),
    end: parse(value?.end) ? value.end : toKey(fallbackYear, 12)
  }
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
  const range = normalizeRange(value)
  const [open, setOpen] = useState(false)
  const [leftYear, setLeftYear] = useState(() => parse(range.start).year)
  const [rightYear, setRightYear] = useState(() => parse(range.end).year)
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        (!panelRef.current || !panelRef.current.contains(e.target))
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Попап рендерится в портале (position: fixed), чтобы его не резал
  // overflow-hidden модалки — пересчитываем координаты при скролле/ресайзе
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (!ref.current) return
      const rect = getZoomAwareRect(ref.current)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_W - 8))
      setPortalPos({ top: rect.bottom + 4, left })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const pick = (side) => (key) => {
    const next = side === 'start' ? { start: key, end: range.end } : { start: range.start, end: key }
    if (ord(next.start) > ord(next.end)) {
      onChange({ start: next.end, end: next.start })
      return
    }
    onChange(next)
  }

  const from = parse(range.start)
  const to = parse(range.end)
  const label = `${monthLabels[from.month]} '${String(from.year).slice(2)}—${monthLabels[
    to.month
  ].toLowerCase()} '${String(to.year).slice(2)}`

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

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className='z-99999 flex bg-white'
          style={{
            position: 'fixed',
            top: portalPos.top,
            left: portalPos.left,
            border: '1px solid #d0d5dd',
            borderRadius: 4,
            boxShadow: '0 6px 20px rgba(0,0,0,.12)'
          }}
        >
          <MonthPanel
            year={leftYear}
            onYearChange={setLeftYear}
            monthLabels={monthLabels}
            start={range.start}
            end={range.end}
            onPick={pick('start')}
          />
          <div style={{ width: 1, background: '#eaecf0' }} />
          <MonthPanel
            year={rightYear}
            onYearChange={setRightYear}
            monthLabels={monthLabels}
            start={range.start}
            end={range.end}
            onPick={pick('end')}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

export default MonthRangePicker
