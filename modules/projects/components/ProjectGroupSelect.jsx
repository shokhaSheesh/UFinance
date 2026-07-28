'use client'

import { cn } from '@/lib/utils'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Селект группы проектов с опцией «Создать новую группу».
 * value — id группы; onChange(id); onCreateNew(query) открывает модалку создания группы.
 */
export default function ProjectGroupSelect({
  data = [],
  value,
  onChange,
  onCreateNew,
  placeholder,
  createLabel,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = data.find((g) => g.value === value)
  const filtered = data.filter((g) =>
    g.label.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onCreateNew?.(query.trim())
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center justify-between w-full h-10 px-3 rounded-lg border bg-white text-sm text-left transition-colors',
          open ? 'border-primary ring-2 ring-primary/15' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <span className={cn('truncate', selected ? 'text-slate-900' : 'text-gray-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn('text-gray-400 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-gray-100">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-8 px-2 text-sm outline-none rounded-md"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => {
                onCreateNew?.(query.trim())
                setOpen(false)
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm text-primary hover:bg-primary/5 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Plus size={15} /> {createLabel}
              </span>
              <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                Enter
              </span>
            </button>

            {filtered.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  onChange?.(g.value)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm text-slate-700 hover:bg-neutral-100 cursor-pointer"
              >
                <span className="truncate">{g.label}</span>
                {g.value === value && <Check size={15} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
