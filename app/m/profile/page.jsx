'use client'

import { MCard, MRow, SectionHead } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FolderTree,
  Library,
  LogOut,
  Settings,
  Users,
  Warehouse,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Профиль — вход во всё, что не поместилось в нижнюю панель.
 *
 * Разделы, у которых мобильного экрана ещё нет, показаны с пометкой «скоро»
 * и не открываются: лучше честная пометка, чем переход на страницу,
 * свёрстанную под большой экран.
 */
const MobileProfilePage = observer(() => {
  const t = useTranslations('Mobile')
  const tNav = useTranslations('Sidebar')
  const router = useRouter()
  const mounted = useMounted()

  const user = authStore.userData || {}
  const name = user.name || user.login || ''
  const permission = appStore.permission

  const sections = [
    { key: 'indicators', icon: BarChart3, label: tNav('nav.indicators'), can: permission?.indicators?.read },
    { key: 'deals', icon: Briefcase, label: tNav('nav.deals'), can: permission?.deals?.read },
    { key: 'counterparties', icon: Users, label: tNav('nav.counterparties'), can: permission?.directories?.counterparties?.read },
    { key: 'plans', icon: ClipboardList, label: tNav('nav.plans'), can: true },
    { key: 'projects', icon: FolderTree, label: tNav('nav.projects'), can: true },
    { key: 'warehouse', icon: Warehouse, label: tNav('nav.warehouse'), can: appStore.warehouseActive },
    { key: 'directories', icon: Library, label: tNav('nav.directories'), can: true },
    { key: 'settings', icon: Settings, label: tNav('nav.settings'), can: permission?.settings?.general?.read },
  ].filter((section) => section.can)

  const logout = () => {
    authStore.logout()
    router.push('/auth')
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[env(safe-area-inset-top)] pb-6">
      <h1 className="py-4 text-[21px] font-bold text-slate-900">{t('tabs.profile')}</h1>

      {/* Карточка пользователя */}
      <div className="flex items-center gap-3.5 rounded-[24px] bg-gradient-to-br from-[#0e73f6] via-[#0b5fd4] to-[#0a49a8] px-5 py-5 text-white">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">
          {(name || 'U').slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate text-base font-bold">{mounted ? name : ''}</div>
          {user.email && <div className="mt-0.5 truncate text-xs text-white/75">{user.email}</div>}
          {authStore.selectBranch?.name && (
            <div className="mt-0.5 truncate text-xs text-white/75">{authStore.selectBranch.name}</div>
          )}
        </div>
      </div>

      {/* Разделы */}
      <SectionHead title={t('profile.sections')} />
      <MCard list>
        {sections.map((section) => (
          <MRow
            key={section.key}
            icon={section.icon}
            title={section.label}
            subtitle={t('profile.soon')}
          />
        ))}
      </MCard>

      <SectionHead title={t('profile.account')} />
      <MCard list>
        <MRow icon={LogOut} tone="out" title={t('profile.logout')} onClick={logout} />
      </MCard>
    </div>
  )
})

export default MobileProfilePage
