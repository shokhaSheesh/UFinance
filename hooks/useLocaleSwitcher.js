"use client"

import { RusFlag, UzbFlag } from '@/constants/icons'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

const COOKIE_NAME = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365


const LOCALES = [
  { code: 'ru', label: 'РУ', image: RusFlag, name: 'Русский' },
  { code: 'uz', label: "UZ", image: UzbFlag, name: "Uzbek" },
]


export function useLocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [pendingLocale, setPendingLocale] = useState(null)
  const containerRef = useRef(null)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  // Apply locale change via cookie + router refresh
  useEffect(() => {
    if (!pendingLocale || pendingLocale === locale) return
    document.cookie = `${COOKIE_NAME}=${pendingLocale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
    startTransition(() => {
      router.refresh()
    })
  }, [pendingLocale, locale, router])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLocale = (next) => {
    setOpen(false)
    if (next === locale) return
    setPendingLocale(next)
  }

  const toggleOpen = () => setOpen((prev) => !prev)

  return {
    locale,
    current,
    locales: LOCALES,
    open,
    isLoading: isPending,
    containerRef,
    toggleOpen,
    changeLocale,
  }
}