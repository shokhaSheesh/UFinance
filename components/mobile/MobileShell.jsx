'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  FolderTree,
  LayoutGrid,
  Library,
  Plus,
  Scale,
  Settings,
  Users,
  Warehouse,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

/**
 * Оболочка мобильной версии: содержимое во весь экран и нижняя панель.
 *
 * На телефоне боковое меню из восьми разделов не помещается, поэтому внизу
 * стоят четыре самых частых раздела и кнопка создания операции — то, ради
 * чего программу открывают с телефона. Остальные разделы собраны в «Ещё»:
 * это полный список, а не свалка, — у каждого пункта значок и подпись.
 */

const TAB_ICON_SIZE = 21

/** Разделы нижней панели. `match` — какие маршруты подсвечивают вкладку. */
const useTabs = (t) => [
  { href: '/company', label: t('nav.company'), icon: Building2, match: ['/company', '/indicators'] },
  { href: '/operations', label: t('nav.operations'), icon: ArrowLeftRight, match: ['/operations'] },
  { fab: true },
  { href: '/deals', label: t('nav.deals'), icon: Briefcase, match: ['/deals', '/purchases'] },
  { more: true },
]

/** Разделы, которые не поместились в панель. */
const useMoreSections = (t) => [
  { href: '/indicators', label: t('nav.indicators'), icon: BarChart3, can: (p) => p?.indicators?.read },
  { href: '/directories/counterparties', label: t('nav.counterparties'), icon: Users, can: (p) => p?.directories?.counterparties?.read },
  { href: '/reports/cashflow', label: t('nav.reports'), icon: Scale, can: (p) => p?.reports?.cashflow?.read },
  { href: '/plans/cash-flow-budget', label: t('nav.plans'), icon: ClipboardList },
  { href: '/projects', label: t('nav.projects'), icon: FolderTree },
  { href: '/warehouse', label: t('nav.warehouse'), icon: Warehouse },
  { href: '/directories/accounts', label: t('nav.directories'), icon: Library },
  { href: '/settings', label: t('nav.settings'), icon: Settings, can: (p) => p?.settings?.general?.read },
]

/** Типы операции в кнопке создания — те же значки, что в списке операций. */
const CREATE_TYPES = [
  { type: 'income', label: 'modal.tabIncome', icon: ArrowDownLeft, tone: 'bg-green-50 text-green-600', permission: 'income' },
  { type: 'payment', label: 'modal.tabPayment', icon: ArrowUpRight, tone: 'bg-red-50 text-red-600', permission: 'payout' },
  { type: 'transfer', label: 'modal.tabTransfer', icon: ArrowLeftRight, tone: 'bg-slate-100 text-slate-600', permission: 'transfer' },
  { type: 'accrual', label: 'modal.tabAccrual', icon: Scale, tone: 'bg-slate-100 text-slate-600', permission: 'accrual' },
]

const MobileShell = observer(({ children }) => {
  const t = useTranslations('Sidebar')
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const tabs = useTabs(t)
  const permission = appStore.permission
  const sections = useMoreSections(t).filter((section) => !section.can || section.can(permission))
  const createTypes = CREATE_TYPES.filter(({ permission: key }) => permission?.operations?.[key]?.add)

  const isActive = (tab) => tab.match?.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  const goTo = (href) => {
    setMoreOpen(false)
    router.push(href)
  }

  // Создание из любого раздела: операции живут на своей странице, поэтому
  // переходим туда с выбранным типом в адресе
  const createOperation = (type) => {
    setCreateOpen(false)
    router.push(`/operations?new=${type}`)
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] min-w-0 flex-col overflow-hidden bg-canvas">
      <main className="min-h-0 w-full min-w-0 flex-1 overflow-hidden">{children}</main>

      <nav className="flex shrink-0 items-stretch justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab, index) => {
          if (tab.fab) {
            return (
              <button
                key="fab"
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label={tOps('page.create')}
                className="-mt-5 flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-full bg-[#0e73f6] text-white shadow-[0_8px_20px_rgba(14,115,246,0.35)] active:bg-[#0b5fd4]"
              >
                <Plus size={24} aria-hidden="true" />
              </button>
            )
          }

          const active = tab.more ? false : isActive(tab)
          const Icon = tab.more ? LayoutGrid : tab.icon
          const label = tab.more ? t('nav.more') : tab.label

          return (
            <button
              key={tab.href || index}
              type="button"
              onClick={() => (tab.more ? setMoreOpen(true) : goTo(tab.href))}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] font-medium',
                active ? 'text-[#0e73f6]' : 'text-slate-500'
              )}
            >
              <Icon size={TAB_ICON_SIZE} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Остальные разделы */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t('nav.more')}>
        <div className="grid grid-cols-3 gap-2">
          {sections.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              type="button"
              onClick={() => goTo(href)}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 px-2 py-3 text-center active:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="text-xs leading-tight font-medium text-slate-700">{label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Тип новой операции */}
      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title={tOps('page.create')}>
        <div className="flex flex-col gap-1">
          {createTypes.map(({ type, label, icon: Icon, tone }) => (
            <button
              key={type}
              type="button"
              onClick={() => createOperation(type)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-left active:bg-slate-50"
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone)}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-slate-900">{tOps(label)}</span>
            </button>
          ))}
          {createTypes.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">{tOps('page.noCreatePermission')}</p>
          )}
        </div>
      </BottomSheet>
    </div>
  )
})

export default MobileShell
