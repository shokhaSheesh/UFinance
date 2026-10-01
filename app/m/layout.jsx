'use client'

import AiChatPanel from '@/components/AiChat/AiChatPanel'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { aiChatStore } from '@/store/aiChat.store'
import { appStore } from '@/store/app.store'
import { languageStore } from '@/store/language.store'
import { ArrowLeftRight, BarChart3, Home, User } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import 'moment/locale/ru'
import 'moment/locale/uz-latn'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

/**
 * Мобильное приложение — отдельная ветка `/m`, а не настольные страницы,
 * ужатые до ширины телефона.
 *
 * Внизу пять мест: главная, транзакции, ассистент, отчёты и профиль. Всё
 * остальное — планы, проекты, склад, справочники, настройки — лежит в
 * профиле: на телефоне вглубь ходят редко, а эти пять открывают каждый день.
 * Новая операция создаётся кнопкой «+» в разделе «Транзакции».
 */

const TABS = [
  { href: '/m', key: 'home', icon: Home, exact: true },
  { href: '/m/transactions', key: 'transactions', icon: ArrowLeftRight },
  { fab: true },
  { href: '/m/reports', key: 'reports', icon: BarChart3 },
  { href: '/m/profile', key: 'profile', icon: User },
]

/** Звезда ассистента — та же, что у кнопки ИИ на компьютере. */
const SparkIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
  </svg>
)

const MobileAppLayout = observer(({ children }) => {
  const t = useTranslations('Mobile')
  const tAi = useTranslations('AiChat')
  const router = useRouter()
  const pathname = usePathname()
  const mounted = useMounted()

  // Даты на телефоне — на языке интерфейса, а не «22 September»
  moment.locale(languageStore.currentLanguage === 'uz' ? 'uz-latn' : 'ru')

  // Ассистент включается флагом ia_active в общих настройках — как на компьютере
  const aiOn = mounted && appStore.isAiActive

  const isActive = (tab) => (tab.exact ? pathname === tab.href : pathname.startsWith(tab.href))
  // Экраны с собственной кнопкой внизу прячут панель разделов: иначе
  // «таблетка» ложится поверх кнопки и до неё не дотянуться
  const SELF_ACTION_ROUTES = [
    '/m/transactions/new',
    '/m/profile/account/field',
    '/m/profile/account/phone',
    '/m/profile/account/password',
  ]
  const hideTabs = SELF_ACTION_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="relative flex h-[100dvh] w-full max-w-[100vw] min-w-0 flex-col overflow-hidden bg-[#f4f5f7]">
      <main className="min-h-0 w-full min-w-0 flex-1 overflow-hidden">{children}</main>

      {/* Панель разделов «таблеткой» — отделена от края, как в современных
          финансовых приложениях: экран под ней продолжается, и панель не
          выглядит краем страницы */}
      {!hideTabs && (
      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="pointer-events-auto flex w-full max-w-[420px] items-center rounded-[28px] border border-slate-200/70 bg-white px-2 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.12)]">
          {TABS.map((tab, index) => {
            if (tab.fab) {
              if (!aiOn) return null
              // Ассистент — главная кнопка панели: крупнее остальных и приподнята над ней
              return (
                <div key="fab" className="flex w-[76px] shrink-0 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => aiChatStore.open()}
                    aria-label={tAi('buttonLabel')}
                    className="-mt-7 flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-[#4f8bff] to-[#2f5bff] text-white shadow-[0_10px_24px_rgba(47,107,255,0.45)] ring-[5px] ring-white transition-transform active:scale-95"
                  >
                    <SparkIcon />
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
                className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1"
              >
                {/* Выбранный раздел — значок в кружке: подложка по размеру
                    значка, а не во всю ячейку, поэтому рядом нет пустых
                    цветных прямоугольников */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    active ? 'bg-[#e8f1ff] text-[#0e73f6]' : 'text-slate-400'
                  )}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'max-w-full truncate text-[10px] font-semibold',
                    active ? 'text-[#0e73f6]' : 'text-slate-400'
                  )}
                >
                  {t(`tabs.${tab.key}`)}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
      )}

      {/* Ассистент на телефоне — во весь экран поверх приложения */}
      <AiChatPanel mobile />
    </div>
  )
})

export default MobileAppLayout
