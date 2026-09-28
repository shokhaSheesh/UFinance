'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { TileIcon } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, Home, Plus, Scale, User } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

/**
 * Мобильное приложение — отдельная ветка `/m`, а не настольные страницы,
 * ужатые до ширины телефона.
 *
 * Внизу пять мест: главная, транзакции, создание, отчёты и профиль. Всё
 * остальное — планы, проекты, склад, справочники, настройки — лежит в
 * профиле: на телефоне вглубь ходят редко, а эти пять открывают каждый день.
 */

const TABS = [
  { href: '/m', key: 'home', icon: Home, exact: true },
  { href: '/m/transactions', key: 'transactions', icon: ArrowLeftRight },
  { fab: true },
  { href: '/m/reports', key: 'reports', icon: BarChart3 },
  { href: '/m/profile', key: 'profile', icon: User },
]

/** Типы операции в кнопке «плюс». */
const CREATE_TYPES = [
  { type: 'income', label: 'modal.tabIncome', icon: ArrowDownLeft, tone: 'in', permission: 'income' },
  { type: 'payment', label: 'modal.tabPayment', icon: ArrowUpRight, tone: 'out', permission: 'payout' },
  { type: 'transfer', label: 'modal.tabTransfer', icon: ArrowLeftRight, tone: 'neutral', permission: 'transfer' },
  { type: 'accrual', label: 'modal.tabAccrual', icon: Scale, tone: 'neutral', permission: 'accrual' },
]

const MobileAppLayout = observer(({ children }) => {
  const t = useTranslations('Mobile')
  const tOps = useTranslations('Operations')
  const router = useRouter()
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)

  const permission = appStore.permission
  const createTypes = CREATE_TYPES.filter(({ permission: key }) => permission?.operations?.[key]?.add)

  const isActive = (tab) => (tab.exact ? pathname === tab.href : pathname.startsWith(tab.href))
  // Экраны с собственной кнопкой внизу прячут панель разделов: иначе
  // «таблетка» ложится поверх кнопки и до неё не дотянуться
  const SELF_ACTION_ROUTES = ['/m/transactions/new', '/m/profile/edit']
  const hideTabs = SELF_ACTION_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="relative flex h-[100dvh] w-full max-w-[100vw] min-w-0 flex-col overflow-hidden bg-[#f4f5f7]">
      <main className="min-h-0 w-full min-w-0 flex-1 overflow-hidden">{children}</main>

      {/* Панель разделов «таблеткой» — отделена от края, как в современных
          финансовых приложениях: экран под ней продолжается, и панель не
          выглядит краем страницы */}
      {!hideTabs && (
      <nav className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="pointer-events-auto flex w-full max-w-[420px] items-stretch rounded-[26px] bg-white/95 px-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.16)] backdrop-blur">
          {TABS.map((tab, index) => {
            if (tab.fab) {
              return (
                <div key="fab" className="flex w-14 shrink-0 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    aria-label={tOps('page.create')}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0e73f6] text-white shadow-[0_6px_16px_rgba(14,115,246,0.4)] active:bg-[#0b5fd4]"
                  >
                    <Plus size={23} aria-hidden="true" />
                  </button>
                </div>
              )
            }

            const active = isActive(tab)
            const Icon = tab.icon

            return (
              <button
                key={tab.href || index}
                type="button"
                onClick={() => router.push(tab.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[20px] px-1 py-2.5 text-[10px] font-semibold transition-colors',
                  active ? 'bg-[#eaf2ff] text-[#0e73f6]' : 'text-slate-400'
                )}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="max-w-full truncate">{t(`tabs.${tab.key}`)}</span>
              </button>
            )
          })}
        </div>
      </nav>
      )}

      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title={tOps('page.create')}>
        <div className="flex flex-col">
          {createTypes.map(({ type, label, icon, tone }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setCreateOpen(false)
                router.push(`/m/transactions/new?type=${type}`)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <TileIcon icon={icon} tone={tone} />
              <span className="text-sm font-semibold text-slate-900">{tOps(label)}</span>
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

export default MobileAppLayout
