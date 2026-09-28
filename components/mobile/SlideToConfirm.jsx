'use client'

import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'

/**
 * Ползунок подтверждения: действие срабатывает, когда кнопку дотянули до
 * правого края.
 *
 * Для необратимых действий одно нажатие — слишком мало: палец задевает
 * кнопку случайно, особенно в списке. Здесь нужно осознанное движение.
 * Пока ползунок не трогали, он сам подталкивается вправо и стрелки бегут
 * в ту же сторону — иначе не догадаться, что его надо тянуть.
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
        'relative flex h-[60px] w-full items-center overflow-hidden rounded-full px-1',
        danger ? 'bg-red-50' : 'bg-slate-100',
        className
      )}
    >
      {/* Подпись гаснет по мере того, как ползунок едет вправо */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-[15px] font-semibold',
          danger ? 'text-red-600' : 'text-slate-700'
        )}
        style={{ opacity: 1 - progress * 1.4 }}
      >
        {label}
        <ChevronRight size={16} className="opacity-40" aria-hidden="true" />
        <ChevronRight size={16} className="-ml-2.5 opacity-70" aria-hidden="true" />
      </span>

      <button
        type="button"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label={label}
        className={cn(
          'relative z-10 flex h-[52px] w-[52px] shrink-0 touch-none items-center justify-center rounded-full text-white shadow-sm',
          danger ? 'bg-red-600' : 'bg-[#0e73f6]',
          !touched && 'm-nudge',
          !dragging && 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  )
}
