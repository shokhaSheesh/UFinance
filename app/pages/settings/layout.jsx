'use client'

import { Banknote, GitBranch, Settings as SettingsIcon, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TbContract } from 'react-icons/tb'
import { appStore } from '../../../store/app.store'

const sidebarItems = [
  { id: 'general', label: 'Общие настройки', icon: SettingsIcon, href: '/pages/settings', show: true },
  { id: 'branches', label: 'Филиалы', icon: GitBranch, href: '/pages/settings/branches', show: true },
  { id: 'currencies', label: 'Валюты', icon: Banknote, href: '/pages/settings/currencies', show: true },
  { id: 'roles', label: 'Роли', icon: Shield, href: '/pages/settings/role', show: true },
  { id: 'contract', label: 'Договор', icon: TbContract, href: '/pages/settings/contract', show: appStore.isDonoSchool },
]

export default function SettingLayouts({ children }) {
  const pathname = usePathname()

  return (
    <div className="fixed top-[60px] flex left-[80px] w-[calc(100%-80px)] h-[calc(100%-60px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-white p-3 shadow-2xl shadow-gray-200 border-r border-gray-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Настройки</h2>
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
      <div className="flex flex-1">
        {children}
      </div>
    </div>
  )
}
