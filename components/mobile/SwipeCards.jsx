'use client'

import { cn } from '@/lib/utils'
import { Children, useRef, useState } from 'react'

/**
 * Карточки, которые листают пальцем вправо-влево.
 *
 * Карточка уже экрана, поэтому по краям видны соседние — по ним понятно,
 * что ряд листается, без подсказок словами. Листание с привязкой: карточка
 * всегда встаёт по центру, а точки снизу показывают, какая открыта.
 */
export default function SwipeCards({ children, className }) {
  const items = Children.toArray(children)
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    if (max <= 0) return
    setActive(Math.round((track.scrollLeft / max) * (items.length - 1)))
  }

  const scrollTo = (index) => {
    const card = trackRef.current?.children?.[index]
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto px-[8%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div key={item.key ?? index} className="w-[84%] shrink-0 snap-center">
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {items.map((item, index) => (
            <button
              key={item.key ?? index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={String(index + 1)}
              aria-current={active === index ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all',
                active === index ? 'w-5 bg-[#0e73f6]' : 'w-1.5 bg-slate-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
