'use client'

import FixedContent from '@/layouts/FixedContent'
import { appStore } from '@/store/app.store'
import { Banknote, CalendarX, GitBranch, History, Settings as SettingsIcon, Shield, Trash2, User, Users } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TbContract } from 'react-icons/tb'


export default observer(function SettingLayouts({ children }) {
  const pathname = usePathname()
  const t = useTranslations('Settings')

  const settingsPermissions = appStore.permission.settings
  const isAttendance = appStore.isDonoSchool && appStore.attendanceActive

  const sidebarItems = [
    { id: 'general', label: t('nav.general'), icon: SettingsIcon, href: '/settings', show: settingsPermissions?.general?.read },
    { id: 'profile', label: t('nav.profile'), icon: User, href: '/settings/profile', show: settingsPermissions?.profile?.read },
    { id: 'branches', label: t('nav.branches'), icon: GitBranch, href: '/settings/branches', show: settingsPermissions?.branches?.read },
    { id: 'currencies', label: t('nav.currencies'), icon: Banknote, href: '/settings/currencies', show: settingsPermissions?.exchangerates?.read },
    { id: 'roles', label: t('nav.roles'), icon: Shield, href: '/settings/role', show: settingsPermissions?.users?.read },
    // Руководители групп и причины отсутствия нужны только давомату —
    // прячем их вместе с выключенным модулем
    { id: 'groups', label: t('nav.groups'), icon: Users, href: '/settings/groups', show: settingsPermissions?.users?.read && isAttendance },
    { id: 'reasons', label: t('nav.reasons'), icon: CalendarX, href: '/settings/reasons', show: settingsPermissions?.general?.read && isAttendance },
    { id: 'contract', label: t('nav.contract'), icon: TbContract, href: '/settings/contract', show: appStore.isDonoSchool },
    { id: 'action-history', label: t('nav.actionHistory'), icon: History, href: '/settings/action-history', show: settingsPermissions?.general?.read },
    // Удаление данных необратимо — пункт видят только те, кому разрешено удаление
    { id: 'data-deletion', label: t('nav.dataDeletion'), icon: Trash2, href: '/settings/data-deletion', show: settingsPermissions?.general?.delete },
  ]
  return (
    <FixedContent>
      {/* Sidebar */}
      <aside className="w-56 bg-white p-3  border-r border-gray-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">{t('pageTitle')}</h2>
        <nav className="flex flex-col gap-0.5 pr-2">
          {sidebarItems.filter(item => item.show).map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={[
                  'flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'text-[#0E73F6] font-semibold'
                    : 'text-[#4a4e56] hover:text-slate-900',
                ].join(' ')}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 overflow-auto">
        {children}
      </div>
    </FixedContent>
  )
})
