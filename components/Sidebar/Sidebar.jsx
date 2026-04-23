"use client"

import { cn } from '@/app/lib/utils'
import { DealIcon, UsersIcon } from '@/constants/icons'
import { ChartLine, ClipboardList, Library, RefreshCw } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { IoSettingsOutline } from 'react-icons/io5'
import { AppLogo } from '../../constants/icons'
import { appStore } from '../../store/app.store'



export const Sidebar = observer(() => {
    const pathname = usePathname()
    const sidebarRef = useRef(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [apiUrl, setApiUrl] = useState(appStore.localApiUrl || '')

    const handleSaveApiUrl = () => {
        if (apiUrl.trim()) {
            appStore.setLocalApiUrl(apiUrl.trim())
            setModalOpen(false)
        }
    }

    const hasSavedUrl = !!appStore.localApiUrl

    const handleClearApiUrl = () => {
        appStore.setLocalApiUrl('')
        setApiUrl('')
    }

    const permissions = toJS(appStore.permission)

    const navItems = [
        { icon: ChartLine, label: 'Показатели', href: '/pages/indicators', hasPage: true, canShow: permissions?.indicators?.read },
        {
            icon: RefreshCw,
            label: 'Операции',
            href: '/pages/operations',
            hasPage: true,
            canShow: permissions?.operations?.income?.read || permissions?.operations?.payout?.read || permissions?.operations?.transfer?.read || permissions?.operations?.accrual?.read || permissions?.operations?.shipment?.read
        },
        {
            icon: UsersIcon,
            label: 'Контрагенты',
            href: '/pages/directories/counterparties',
            hasPage: true,
            canShow: permissions?.directories?.counterparties?.read
        },
        {
            icon: DealIcon,
            label: 'Сделки',
            href: '/pages/deals',
            hasPage: true,
            canShow: permissions?.deals?.read
        },
        {
            icon: ClipboardList,
            label: 'Отчёты',
            href: '/pages/reports',
            hasPage: true,
            canShow: (permissions?.reports?.cashflow?.read || permissions?.reports?.pnl?.read || permissions?.reports?.balance?.read),
            submenu: [
                {
                    label: 'Движение денег (ДДС)',
                    href: '/pages/reports/cashflow',
                    hasPage: true,
                    canShow: permissions?.reports?.cashflow?.read
                },
                {
                    label: 'Прибыли и убытки (ОПУ)',
                    href: '/pages/reports/profit-and-loss',
                    hasPage: true,
                    canShow: permissions?.reports?.pnl?.read
                },
                {
                    label: 'Баланс',
                    href: '/pages/reports/balance',
                    hasPage: true,
                    canShow: permissions?.reports?.balance?.read
                },
                {
                    label: 'Студенты',
                    href: '/pages/reports/students',
                    hasPage: true,
                    canShow: appStore.isDonoSchool
                },
            ]
        },
        {
            icon: Library,
            label: 'Справочники',
            href: '/pages/directories',
            hasPage: true,
            canShow: (permissions?.directories?.counterparties?.read || permissions?.directories?.transactionCategories?.read || permissions?.directories?.accounts?.read || permissions?.directories?.legalentities?.read || permissions?.directories?.productsServices?.read),
            submenu: [
                {
                    label: 'Контрагенты',
                    href: '/pages/directories/counterparties',
                    hasPage: true,
                    canShow: permissions?.directories?.counterparties?.read
                },
                {
                    label: 'Учетные статьи',
                    href: '/pages/directories/transaction-categories',
                    hasPage: true,
                    canShow: permissions?.directories?.transactionCategories?.read
                },
                {
                    label: 'Мои счета',
                    href: '/pages/directories/accounts',
                    hasPage: true,
                    canShow: permissions?.directories?.accounts?.read
                },
                {
                    label: 'Мои юрлица',
                    href: '/pages/directories/legal-entities',
                    hasPage: true,
                    canShow: permissions?.directories?.legalentities?.read
                },
                {
                    label: 'Товары & Услуги',
                    href: '/pages/directories/product-service',
                    hasPage: true,
                    canShow: permissions?.directories?.productsServices?.read
                }
            ]
        },
        {
            icon: IoSettingsOutline,
            label: 'Настройки',
            href: '/pages/settings',
            hasPage: true,
            canShow: (permissions?.settings?.general?.read || permissions?.settings?.users?.read || permissions?.settings?.profile?.read || permissions?.settings?.exchangerates?.read),
        },
    ]


    return (
        <aside className="bg-blue-950 w-[80px] flex flex-col gap-2 h-full z-10! items-center justify-start fixed left-0" ref={sidebarRef}> 
            <nav className="flex flex-col   w-full">
                <AppLogo size={44} strokeWidth={1.5} className='mt-2 mx-auto ml-5 mb-4' />
                {navItems.filter(item => item.hasPage && item.canShow)
                    .map((item, index) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                        const hasSubmenu = item.submenu && item.submenu.length > 0
                        const isSubmenuActive = hasSubmenu && item.submenu.some(sub => pathname === sub.href)

                        const LinkContent = (
                            <div className={cn(
                                "flex flex-col h-[65px] items-center justify-center w-full rounded-md transition-all cursor-pointer text-white/60 hover:text-white ",
                                (isActive || isSubmenuActive) && " text-white"
                            )}>
                                <div className="mb-1">
                                    <item.icon size={22} strokeWidth={1.5} />
                                </div>
                                <span className="text-mini text-center font-medium leading-tight">
                                    {item.label}
                                </span>
                            </div>
                        )

                        if (hasSubmenu) {
                            return (
                                <div key={index} className='relative  group'>
                                    <div className='relative'>
                                        {LinkContent}
                                    </div>
                                    <div className="bg-blue-950 -top-1/2 left-[80px] z-30! absolute hidden group-hover:block rounded-none text-white min-w-[180px] shadow-none rounded-tr-lg rounded-br-lg p-2">
                                        <div className="flex flex-col gap-1">
                                            {(item.submenu || [])
                                                .filter(sub => sub.hasPage && sub.canShow !== false)
                                                .map((sub, subIndex) => {
                                                    const isSubActive = pathname === sub.href
                                                    return (
                                                        <Link
                                                            key={subIndex}
                                                            href={sub.href}
                                                            className={cn(
                                                                "block p-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors",
                                                                isSubActive && "bg-white/20 text-white"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <Link className='w-full' key={index} href={item.href || '/'}>
                                {LinkContent}
                            </Link>
                        )
                    })}
            </nav> 

            {/* Modal for setting local API URL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
                    <div className="bg-white rounded-lg p-6 w-[500px] max-w-[95vw]">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Настройка локального API
                        </h2>

                        <div className="flex flex-col gap-1.5 mb-4">
                            <label className="text-sm font-medium text-slate-500">URL локального API</label>
                            <textarea
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                disabled={hasSavedUrl}
                                placeholder="https://your-local-api-url.com"
                                className={cn(
                                    "w-full p-3 border border-gray-300 rounded-lg text-sm resize-none",
                                    hasSavedUrl && "bg-gray-100 cursor-not-allowed"
                                )}
                                rows={4}
                            />
                            {hasSavedUrl && (
                                <p className="text-xs text-gray-500">
                                    URL уже сохранен и не может быть изменен
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                            {apiUrl && <button
                                onClick={handleClearApiUrl}
                                className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Clear
                            </button>}
                            {!hasSavedUrl && (
                                <button
                                    onClick={handleSaveApiUrl}
                                    disabled={!apiUrl.trim()}
                                    className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Сохранить
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
})
