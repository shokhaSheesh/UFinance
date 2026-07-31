'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, LogOut } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { authStore } from '../../../store/auth.store'
import { clearAllSiteData } from '../../../utils/clearSiteData'

export const Profile = observer(() => {
  const t = useTranslations('Header.profile')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    // Сбрасываем состояние стора, затем полностью чистим данные сайта
    // (localStorage, sessionStorage, cookies, IndexedDB, Cache Storage, кеш React
    // Query) и жёстко перезагружаемся — чтобы не осталось данных прошлой сессии.
    authStore.logout()
    await clearAllSiteData()
    window.location.replace('/auth')
  }

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button
        className={cn(
          'flex items-center gap-2 px-2.5 py-5 border border-transparent  cursor-pointer text-white transition-all duration-200 text-left hover:bg-slate-900/50',
          (isOpen) && 'bg-black/30'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold leading-[1.2]">
              {mounted ? (authStore.userEmail || t('fallbackName')) : t('fallbackName')}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform duration-200 opacity-80',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-gray-200 py-2 z-100 animate-[slideDown_0.2s_ease-out_forwards]">
          <div className="flex flex-col py-1">
            <button
              className={cn(
                'flex items-center gap-3 w-full px-5 py-2.5 bg-transparent border-0 cursor-pointer text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100',
                'text-red-500 hover:bg-red-50'
              )}
              onClick={handleLogout}
            >
              <LogOut size={18} className="text-red-500 shrink-0" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
