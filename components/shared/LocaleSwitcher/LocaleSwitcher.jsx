"use client"

import { ChevronDown, Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { RusFlag, UzbFlag } from '../../../constants/icons'

const LOCALES = [
  { code: 'ru', label: 'РУ', image: RusFlag, name: 'Русский' },
  { code: 'uz', label: "UZ", image: UzbFlag, name: "Uzbek" },
]

const COOKIE_NAME = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365

export default function LocaleSwitcher({ className = '' }) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [pendingLocale, setPendingLocale] = useState(null)
  const containerRef = useRef(null)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  useEffect(() => {
    if (!pendingLocale || pendingLocale === locale) return
    document.cookie = `${COOKIE_NAME}=${pendingLocale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
    startTransition(() => {
      router.refresh()
    })
  }, [pendingLocale, locale, router])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const change = (next) => {
    setOpen(false)
    if (next === locale) return
    setPendingLocale(next)
  }

  const isLoading = isPending


  return null

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
          {LOCALES.map((item) => {
            const isActive = locale === item.code
            return (
              <div
                key={item.code}
                className='flex items-center gap-3 p-2'
              >
                <item.image />
                <button
                  type="button"
                  onClick={() => change(item.code)}
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
