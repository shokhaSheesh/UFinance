"use client"

import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher'
import { ChevronDown, Globe } from 'lucide-react'


export default function LocaleSwitcher({ className = '' }) {
  const { locale, open, isLoading, changeLocale, locales, containerRef, current, toggleOpen } = useLocaleSwitcher()


  // return null

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => toggleOpen()}
        className="flex items-center gap-2 px-3 py-4 rounded-md text-white text-sm font-medium hover:bg-slate-900/50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Globe size={18} strokeWidth={1.75} />
        <span>{current.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-5 top-[calc(100%+4px)] z-9999 bg-white rounded-lg shadow-lg border border-gray-100 py-1 overflow-hidden">
          {locales.map((item) => {
            const isActive = locale === item.code
            return (
              <div
                key={item.code}
                className='flex items-center gap-3 p-2'
              >
                <item.image />
                <button
                  type="button"
                  onClick={() => changeLocale(item.code)}
                  className={`w-full text-left  text-sm transition-colors cursor-pointer border-none bg-transparent ${isActive
                    ? 'text-[#0E73F6] font-semibold bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {item.name}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
