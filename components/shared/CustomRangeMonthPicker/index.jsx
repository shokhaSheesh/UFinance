'use client'
import { cn } from '@/lib/utils'
import { CalendarRange } from 'lucide-react'
import { toJS } from 'mobx'
import moment from 'moment'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MONTHS_SHORT = {
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
}

const POPOVER_WIDTH = 480

// {year, month} ni bitta tartib raqamiga aylantiramiz (taqqoslash uchun)
const ordinal = (ym) => (ym ? ym.year * 12 + ym.month : null)

// Joriy oy — qiymat bo'lmaganda panel qaysi oyni ochishini belgilaydi
const nowYM = () => {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() }
}

// Date obyekti / 'YYYY-MM-DD' / ISO string dan {year, month} olamiz.
// String'lar komponentlar bo'yicha parse qilinadi — timezone siljishi bo'lmaydi.
const parseYM = (v) => {
  if (!v) return null
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null
    return { year: v.getFullYear(), month: v.getMonth() }
  }
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})/)
    if (m) return { year: +m[1], month: +m[2] - 1 }
  }
  const d = new Date(v)
  if (isNaN(d.getTime())) return null
  return { year: d.getFullYear(), month: d.getMonth() }
}

// Bitta oy paneli (chap — "от", o'ng — "до")
const MonthPanel = ({ year, onYearChange, from, to, onPick, months }) => {
  const isEndpoint = (i) =>
    (from && from.year === year && from.month === i) ||
    (to && to.year === year && to.month === i)

  const isBetween = (i) => {
    const o = year * 12 + i
    return from && to && o > ordinal(from) && o < ordinal(to)
  }

  return (
    <div className="w-[210px] shrink-0">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          className="border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center text-lg text-gray-500 cursor-pointer hover:bg-[#e3eeff] hover:border-primary hover:text-primary transition-colors"
        >
          «
        </button>
        <span className="text-sm font-semibold text-gray-700">{year}</span>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          className="border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center text-lg text-gray-500 cursor-pointer hover:bg-[#e3eeff] hover:border-primary hover:text-primary transition-colors"
        >
          »
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {months.map((m, i) => {
          const endpoint = isEndpoint(i)
          const between = isBetween(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className={cn(
                'h-9 rounded-md text-xss font-medium cursor-pointer transition-colors',
                endpoint && 'bg-primary text-white',
                !endpoint && between && 'bg-[#e3eeff] text-primary',
                !endpoint && !between && 'text-gray-700 hover:bg-[#e3eeff] hover:text-primary'
              )}
            >
              {m}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const CustomRangeMonthPicker = ({ value, onChange: onSelect, inputClass, handleSubmit, format }) => {
  const locale = useLocale()
  const months = MONTHS_SHORT[locale] || MONTHS_SHORT.ru

  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Qo'llanilgan (committed) qiymat — trigger'da ko'rinadi
  const committed = useMemo(() => {
    const v = toJS(value)
    return { from: parseYM(v?.start), to: parseYM(v?.end) }
  }, [value])

  // Popover ichidagi qoralama (draft) tanlov
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [leftYear, setLeftYear] = useState(() => nowYM().year)
  const [rightYear, setRightYear] = useState(() => nowYM().year)

  const yearLabel = (y) => (format?.includes("'YY") ? `'${String(y).slice(-2)}` : `${y}`)
  const displayLabel =
    committed.from && committed.to
      ? `${months[committed.from.month]} ${yearLabel(committed.from.year)} — ${months[committed.to.month]} ${yearLabel(committed.to.year)}`
      : 'Выберите период'

  // Trigger'ga nisbatan popover joyini hisoblaymiz (ochiqligida scroll/resize'da qayta chaqiriladi)
  const computePosition = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.max(8, Math.min(r.left, window.innerWidth - POPOVER_WIDTH - 8))
    setPos({ top: r.bottom + 6, left })
  }, [])

  const openPicker = () => {
    const f = committed.from || nowYM()
    const t = committed.to || nowYM()
    setFrom(f)
    setTo(t)
    setLeftYear(f.year)
    setRightYear(t.year)
    computePosition()
    setOpen(true)
  }

  const close = () => setOpen(false)

  // Ochiq bo'lganda: tashqariga bosish / Escape yopadi, scroll/resize joyini yangilaydi
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popoverRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      close()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // capture=true — ichki scroll konteynerlar (indicators filter bar, students sidebar) uchun ham
    window.addEventListener('scroll', computePosition, true)
    window.addEventListener('resize', computePosition)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', computePosition, true)
      window.removeEventListener('resize', computePosition)
    }
  }, [open, computePosition])

  // Chap kalendardan oy tanlanganda: from = tanlangan, o'ng ham SHU oyga tenglashadi
  const selectFrom = (month) => {
    const picked = { year: leftYear, month }
    setFrom(picked)
    setTo(picked) // "март tanlansa — o'ngda ham март"
    setRightYear(leftYear) // o'ng kalendar ham shu yilni ko'rsatadi
  }

  // O'ng kalendardan oy tanlanganda: to = tanlangan; from'dan oldin bo'lsa from ham suriladi
  const selectTo = (month) => {
    const picked = { year: rightYear, month }
    if (ordinal(picked) < ordinal(from)) {
      setFrom(picked)
      setLeftYear(rightYear)
    }
    setTo(picked)
  }

  const handleApply = () => {
    if (from && to) {
      const startDate = new Date(from.year, from.month, 1) // Oyning 1-kuni
      const endDate = new Date(to.year, to.month + 1, 0) // Oyning oxirgi kuni
      onSelect?.({
        start: moment(startDate).format('YYYY-MM-DD'),
        end: moment(endDate).format('YYYY-MM-DD'),
      })
    }
    handleSubmit?.()
    close()
  }

  // "Отмена" = bekor qilish: qoralamani tashlab, oynani yopadi (committed qiymat o'zgarmaydi)
  const handleCancel = () => {
    close()
  }

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openPicker())}
        className={`border bg-gray-ucode-25 w-full rounded-md cursor-pointer border-gray-ucode-200 px-1.5 py-1 h-9 gap-2 flex items-center overflow-hidden ${inputClass || ''}`}
      >
        <CalendarRange className="text-neutral-400 shrink-0" size={20} strokeWidth={1} />
        <span className="pt-1 text-sm truncate">{displayLabel}</span>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1400 }}
            className="bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 p-3"
          >
            <div className="flex gap-3">
              <MonthPanel
                year={leftYear}
                onYearChange={setLeftYear}
                from={from}
                to={to}
                onPick={selectFrom}
                months={months}
              />
              <div className="w-px bg-gray-100 self-stretch" />
              <MonthPanel
                year={rightYear}
                onYearChange={setRightYear}
                from={from}
                to={to}
                onPick={selectTo}
                months={months}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 text-sm rounded-md bg-primary text-white cursor-pointer hover:bg-primary-dark transition-colors"
              >
                Применить
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default CustomRangeMonthPicker
