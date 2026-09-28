'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard, MRow, MScreenHeader, SectionHead } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { useMutation } from '@tanstack/react-query'
import {
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Coins,
  FolderTree,
  Landmark,
  Languages,
  ListTree,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Профиль — те же разделы, что в прототипе мобильного приложения:
 * карточка пользователя, аккаунт, разделы, справочник, настройки и выход.
 *
 * Здесь же переключатели, которых на телефоне не хватает больше всего:
 * филиал, валюта отображения и язык. Разделы, у которых мобильного экрана
 * ещё нет, помечены «скоро» и не открываются: лучше честная пометка, чем
 * страница, свёрстанная под большой экран.
 */

const LOCALES = [
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: 'Oʻzbekcha' },
  { code: 'en', label: 'English' },
]

const MobileProfilePage = observer(() => {
  const t = useTranslations('Mobile')
  const tNav = useTranslations('Sidebar')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()
  const locale = useLocale()

  const [sheet, setSheet] = useState(null)

  const user = authStore.userData || {}
  const name = user.name || user.login || ''
  const permission = appStore.permission

  // Смена филиала перезабирает права роли — как в шапке большого экрана
  const { mutateAsync: getMyPermissions } = useMutation({
    mutationKey: ['get_my_permissions'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_user_role_permissions', data, type: 'role' }),
  })

  const { data: branchesData } = useUcodeRequestQuery({
    method: 'get_my_branches',
    data: { page: 1, limit: 200 },
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const branches = branchesData || authStore.branches || []

  const selectBranch = async (branch) => {
    setSheet(null)
    if (branch.guid === authStore.branch_id) return

    authStore.setBranchId(branch.guid)
    appStore.setBranchIsAccrualDate(branch.guid)
    authStore.setSelectBranch(branch)

    if (user?.role === 'plan_fakt_admins' && branch?.is_employee) {
      appStore.setEmployerPermission()
    } else if (user?.role === 'employees') {
      const permissions = await getMyPermissions({ branches_id: branch?.guid })
      appStore.setNewPermission(permissions?.data?.data?.role_permissions)
      appStore.setDataEditingRestriction(permissions?.data?.data)
      appStore.setAccountPermissions(permissions?.data?.data)
    } else if (user?.role === 'plan_fakt_admins' && !branch?.is_employee) {
      appStore.setPlanfactPermission()
    }

    // Права, закрытый период и кэш запросов завязаны на филиал, поэтому
    // после смены приложение перезагружается целиком
    window.location.href = '/m'
  }

  const selectCurrency = (currency) => {
    setSheet(null)
    const found = appStore.currencies?.find((item) => item.kod === currency.value)
    appStore.setCurrency({ name: found?.icon || currency.value, guid: found?.guid, code: currency.value })
  }

  const selectLocale = (code) => {
    setSheet(null)
    if (code === locale) return
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    window.location.reload()
  }

  const logout = () => {
    authStore.logout()
    router.push('/auth')
  }

  const soon = t('profile.soon')

  const sections = [
    {
      key: 'sections',
      title: t('profile.sections'),
      rows: [
        { key: 'deals', icon: Briefcase, label: tNav('nav.deals'), can: permission?.deals?.read, href: '/m/deals' },
        {
          key: 'counterparties',
          icon: Users,
          label: tNav('nav.counterparties'),
          can: permission?.directories?.counterparties?.read,
        },
        { key: 'plans', icon: ClipboardList, label: tNav('nav.plans'), can: true },
        { key: 'projects', icon: FolderTree, label: tNav('nav.projects'), can: appStore.projectActive },
        { key: 'warehouse', icon: Warehouse, label: tNav('nav.warehouse'), can: appStore.warehouseActive },
      ],
    },
    {
      key: 'directory',
      title: t('profile.directory'),
      rows: [
        {
          key: 'accounts',
          icon: Landmark,
          label: tNav('directories.accounts'),
          can: permission?.directories?.accounts?.read,
        },
        {
          key: 'articles',
          icon: ListTree,
          label: tNav('directories.transactionCategories'),
          can: permission?.directories?.transactionCategories?.read,
        },
        {
          key: 'entities',
          icon: Building2,
          label: tNav('directories.legalEntities'),
          can: permission?.directories?.legalentities?.read,
        },
        {
          key: 'products',
          icon: Package,
          label: tNav('directories.productsServices'),
          can: permission?.directories?.productsServices?.read,
        },
      ],
    },
    {
      key: 'settings',
      title: tNav('nav.settings'),
      rows: [
        { key: 'settings', icon: Settings, label: t('profile.appSettings'), can: permission?.settings?.general?.read },
        { key: 'security', icon: ShieldCheck, label: t('profile.security'), can: true },
      ],
    },
  ]

  const currencyLabel = mounted ? appStore.currency?.code || appStore.currency?.name : ''
  const localeLabel = LOCALES.find((item) => item.code === locale)?.label

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('tabs.profile')} />

      {/* Кто вошёл — нажатие открывает «Мой профиль» */}
      <button
        type="button"
        onClick={() => router.push('/m/profile/edit')}
        className="flex w-full items-center gap-3.5 rounded-[24px] bg-gradient-to-br from-[#0e73f6] via-[#0b5fd4] to-[#0a49a8] px-5 py-5 text-left text-white active:opacity-95"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">
          {(mounted && name ? name : 'U').slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold">{mounted ? name : ''}</div>
          {user.email && <div className="mt-0.5 truncate text-xs text-white/75">{user.email}</div>}
          {user.phone && <div className="mt-0.5 truncate text-xs text-white/75">{user.phone}</div>}
        </div>
        <ChevronRight size={18} className="shrink-0 text-white/70" aria-hidden="true" />
      </button>

      {/* Аккаунт: то, что переключают прямо с телефона */}
      <SectionHead title={t('profile.account')} />
      <MCard list>
        {branches.length > 1 && (
          <MRow
            icon={Building2}
            title={t('profile.branch')}
            value={<span className="text-[13px] text-slate-500">{authStore.selectBranch?.name}</span>}
            onClick={() => setSheet('branch')}
          />
        )}
        <MRow
          icon={Coins}
          title={t('profile.currency')}
          value={<span className="text-[13px] text-slate-500">{currencyLabel}</span>}
          onClick={() => setSheet('currency')}
        />
        <MRow
          icon={Languages}
          title={t('profile.language')}
          value={<span className="text-[13px] text-slate-500">{localeLabel}</span>}
          onClick={() => setSheet('locale')}
        />
      </MCard>

      {/* Разделы, справочник, настройки */}
      {sections.map((section) => {
        const rows = section.rows.filter((row) => row.can)
        if (!rows.length) return null
        return (
          <div key={section.key}>
            <SectionHead title={section.title} />
            <MCard list>
              {rows.map((row) => (
                <MRow
                  key={row.key}
                  icon={row.icon}
                  title={row.label}
                  subtitle={row.href ? undefined : soon}
                  chevron={Boolean(row.href)}
                  onClick={row.href ? () => router.push(row.href) : undefined}
                />
              ))}
            </MCard>
          </div>
        )
      })}

      {/* Выход */}
      <div className="pt-6">
        <MCard list>
          <MRow icon={LogOut} tone="out" title={t('profile.logout')} onClick={() => setSheet('logout')} />
        </MCard>
      </div>

      <p className="pt-5 text-center text-[11px] text-slate-400">UFinance · {t('profile.mobileVersion')}</p>

      {/* Филиал */}
      <BottomSheet open={sheet === 'branch'} onClose={() => setSheet(null)} title={t('profile.branch')}>
        <div className="flex flex-col">
          {branches.map((branch) => (
            <button
              key={branch.guid}
              type="button"
              onClick={() => selectBranch(branch)}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">{branch.name}</span>
              {branch.guid === authStore.branch_id && (
                <Check size={17} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Валюта отображения */}
      <BottomSheet open={sheet === 'currency'} onClose={() => setSheet(null)} title={t('profile.currency')}>
        <div className="flex flex-col">
          {(appStore.myCurrencies || []).map((currency) => (
            <button
              key={currency.value}
              type="button"
              onClick={() => selectCurrency(currency)}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">{currency.label}</span>
              {currency.value === appStore.currency?.code && (
                <Check size={17} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Язык */}
      <BottomSheet open={sheet === 'locale'} onClose={() => setSheet(null)} title={t('profile.language')}>
        <div className="flex flex-col">
          {LOCALES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => selectLocale(item.code)}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[15px] font-semibold',
                  item.code === locale ? 'text-[#0e73f6]' : 'text-slate-900'
                )}
              >
                {item.label}
              </span>
              {item.code === locale && <Check size={17} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Выход */}
      <BottomSheet
        open={sheet === 'logout'}
        onClose={() => setSheet(null)}
        title={t('profile.logoutTitle')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={logout}
              className="h-12 flex-1 rounded-full bg-red-600 text-[15px] font-semibold text-white"
            >
              {t('profile.logout')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{t('profile.logoutHint')}</p>
      </BottomSheet>
    </div>
  )
})

export default MobileProfilePage
