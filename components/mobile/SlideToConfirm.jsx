'use client'

import { cn } from '@/lib/utils'
import { ChevronsRight } from 'lucide-react'
import { useRef, useState } from 'react'

/**
 * Ползунок подтверждения: действие срабатывает, когда кнопку дотянули до
 * правого края.
 *
 * Для необратимых действий одного нажатия мало: палец задевает кнопку
 * случайно, особенно в конце длинного списка. Здесь нужно осознанное
 * движение. Что элемент тянут, а не жмут, показывает сама кнопка: пока её
 * не трогали, она покачивается вправо и обратно. Объяснять это надписью
 * не нужно — подпись оставлена короткой, только про действие.
 */
export default function SlideToConfirm({ label, onConfirm, tone = 'danger', className }) {
  const trackRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(false)
  // Ширину дорожки держим в состоянии: во время отрисовки к ref обращаться нельзя
  const [maxOffset, setMaxOffset] = useState(0)

  const KNOB = 52

  const measure = () => {
    const width = Math.max((trackRef.current?.offsetWidth || 0) - KNOB - 8, 0)
    setMaxOffset(width)
    return width
  }

  const start = (event) => {
    measure()
    setDragging(true)
    setTouched(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const move = (event) => {
    if (!dragging) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = Math.min(Math.max(event.clientX - rect.left - KNOB / 2, 0), maxOffset || measure())
    setOffset(next)
  }

  const end = () => {
    if (!dragging) return
    setDragging(false)
    // Дотянули почти до конца — считаем подтверждением
    if (offset > maxOffset * 0.82) {
      setOffset(maxOffset)
      onConfirm?.()
      setTimeout(() => setOffset(0), 400)
    } else {
      setOffset(0)
    }
  }

  const progress = maxOffset ? offset / maxOffset : 0
  const danger = tone === 'danger'

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative flex h-[62px] w-full items-center overflow-hidden rounded-full border p-[5px]',
        danger ? 'border-red-200 bg-white' : 'border-slate-200 bg-white',
        className
      )}
    >
      {/* Пройденный путь закрашивается — видно, сколько осталось дотянуть */}
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 rounded-full', danger ? 'bg-red-50' : 'bg-[#eaf2ff]')}
        style={{ width: `${Math.min(offset + KNOB + 10, 10000)}px`, transition: dragging ? 'none' : 'width .2s ease' }}
      />

      {/* Подпись короткая: что делает, объясняет само движение кнопки */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center text-[15px] font-semibold',
          danger ? 'text-red-600' : 'text-slate-700'
        )}
        style={{ opacity: 1 - progress * 1.6 }}
      >
        {label}
      </span>

      <button
        type="button"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label={label}
        className={cn(
          'relative z-10 flex h-[52px] w-[52px] shrink-0 touch-none items-center justify-center rounded-full text-white',
          danger ? 'bg-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.35)]' : 'bg-[#0e73f6] shadow-[0_4px_12px_rgba(14,115,246,0.35)]',
          !touched && !dragging && 'm-nudge',
          !dragging && 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <ChevronsRight size={22} aria-hidden="true" />
      </button>
    </div>
  )
}
