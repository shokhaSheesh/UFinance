'use client'

import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import {
  Banknote,
  GitBranch,
  History,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { authStore } from '../../../store/auth.store'
import { clearAllSiteData, clearWebStorageSync } from '../../../utils/clearSiteData'

export const Profile = observer(() => {
  const t = useTranslations('Header.profile')
  const tSettings = useTranslations('Settings')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Esc закрывает меню и возвращает фокус на кнопку — иначе с клавиатуры
  // из открытого меню было не выйти
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleLogout = () => {
    // Сбрасываем стор и синхронно чистим storage с куками — этого достаточно,
    // чтобы сессии больше не было. Остальное (IndexedDB, Cache Storage, кеш
    // React Query) чистим в фоне: раньше выход ждал этих операций и, если они
    // подвисали, кнопка «Выйти» визуально не срабатывала вовсе.
    authStore.logout()
    clearWebStorageSync()

    let left = false
    const leave = () => {
      if (left) return
      left = true
      window.location.replace('/auth')
    }
    // страховка: уходим, даже если фоновая очистка не ответила
    const guard = setTimeout(leave, 700)
    clearAllSiteData()
      .catch(() => {})
      .finally(() => {
        clearTimeout(guard)
        leave()
      })
  }

  const settingsPermissions = appStore.permission.settings

  // Те же пункты и те же права, что и в боковом меню настроек
  // (app/(pages)/settings/layout.jsx) — список здесь сокращён до тех,
  // за которыми пользователь чаще всего идёт из шапки
  const settingsItems = [
    {
      id: 'general',
      label: tSettings('nav.general'),
      icon: SettingsIcon,
      href: '/settings',
      show: settingsPermissions?.general?.read,
    },
    {
      id: 'profile',
      label: tSettings('nav.profile'),
      icon: User,
      href: '/settings/profile',
      show: settingsPermissions?.profile?.read,
    },
    {
      id: 'branches',
      label: tSettings('nav.branches'),
      icon: GitBranch,
      href: '/settings/branches',
      show: settingsPermissions?.branches?.read,
    },
    {
      id: 'currencies',
      label: tSettings('nav.currencies'),
      icon: Banknote,
      href: '/settings/currencies',
      show: settingsPermissions?.exchangerates?.read,
    },
    {
      id: 'roles',
      label: tSettings('nav.roles'),
      icon: Shield,
      href: '/settings/role',
      show: settingsPermissions?.users?.read,
    },
    {
      id: 'action-history',
      label: tSettings('nav.actionHistory'),
      icon: History,
      href: '/settings/action-history',
      show: settingsPermissions?.general?.read,
    },
  ].filter((item) => item.show)

  const email = mounted ? authStore.userEmail || t('fallbackName') : t('fallbackName')

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('menuLabel')}
        title={email}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer',
          'bg-white/10 text-white transition-colors hover:bg-white/20',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          isOpen && 'bg-white/20'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <User size={18} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 w-72 bg-white rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-gray-200 py-1.5 z-100 animate-[slideDown_0.2s_ease-out_forwards]"
        >
          {/* Кто вошёл — почта больше не занимает место в шапке,
              но остаётся видимой здесь */}
          <div className="px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs text-gray-500">{t('signedInAs')}</p>
            <p className="text-sm font-medium text-slate-900 truncate" title={email}>
              {email}
            </p>
          </div>

          {settingsItems.length > 0 && (
            <div className="flex flex-col py-1 border-b border-gray-200">
              {settingsItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    role="menuitem"
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none"
                  >
                    <Icon size={16} className="shrink-0 text-gray-500" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="flex flex-col py-1">
            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-3 w-full px-4 py-2 bg-transparent border-0 cursor-pointer text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
              onClick={handleLogout}
            >
              <LogOut size={16} className="shrink-0" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
