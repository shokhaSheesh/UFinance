"use client"

import { cn } from '@/app/lib/utils'
import { keepPreviousData } from '@tanstack/react-query'
import { ChevronDown, Maximize2, MoreVertical } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { appStore } from '../../../store/app.store'
import { formatDateTime } from '../../../utils/formatDate'
import { formatAmount, formatNumber, formatTotalSumma } from '../../../utils/helpers'
import styles from '../Header.module.scss'

const TotalPrice = observer(() => {
    const [isBalanceOpen, setIsBalanceOpen] = useState(false)

    const [expandedGroups, setExpandedGroups] = useState(['unallocated'])
    const [activeGroupMenu, setActiveGroupMenu] = useState(null)
    const [modalMode, setModalMode] = useState('compact')
    const [today, setToday] = useState('')
    const [mounted, setMounted] = useState(false)

    const balanceRef = useRef(null)
    const groupMenuRef = useRef(null)

    const { data: myaccounts } = useUcodeRequestQuery({
        method: 'get_my_accounts',
        data: {
            groupBy: "legal_entities",
            page: 1,
            limit: 100,
            beznalichnye: true,
            elektronnye: true,
            kartaFizlica: true,
            nalichnye: true,
        },
        querySetting: {
            select: (response) => response?.data?.data,
            placeholderData: keepPreviousData
        }
    })


    useMemo(() => {
        const result = new Map()
        myaccounts?.data?.map(item => item?.children).flat()?.forEach(item => {
            result.set(item?.currenies_id, item?.currenies_kod)
        })
        const all = Array.from(result.entries()).map(([, label]) => ({ value: label, label }))
        appStore.setMyCurrencies(all)
    }, [myaccounts])



    const Summary = myaccounts?.summary
    const Compactlist = useMemo(() => {
        return myaccounts?.data?.map((item) => {
            return [...item.children]?.map((child) => ({
                name: child?.nazvanie,
                balance: child?.balans_val,
                currency: child?.currenies_kod,
                color: child?.balans_val > 0 ? 'green' : 'red'
            }))
        }).flat()
    }, [myaccounts])



    // Set date only on client side to avoid hydration mismatch
    useEffect(() => {
        setToday(formatDateTime(new Date()))
        setMounted(true)
    }, [])

    useEffect(() => {
        function handleClickOutside(event) {
            if (balanceRef.current && !balanceRef.current.contains(event.target)) {
                setIsBalanceOpen(false)
                setActiveGroupMenu(null)
            }
            if (groupMenuRef.current && !groupMenuRef.current.contains(event.target)) {
                setActiveGroupMenu(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (isBalanceOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        // Cleanup on unmount too
        return () => { document.body.style.overflow = 'auto' }
    }, [isBalanceOpen])

    const legalEntitiesData = useMemo(() => {
        return myaccounts?.data?.map((item) => {
            return {
                id: item?.legal_entity_id,
                name: item?.legal_entity_name,
                balance: item?.current_balance,
                total_items: item?.items_count,
                accounts: (item?.children || [])?.map((child) => {
                    return {
                        id: child?.guid,
                        name: child?.nazvanie,
                        balance: child?.balans_val,
                        currency: child?.currenies_kod,
                        color: child?.balans_val > 0 ? 'green' : 'red'
                    }
                })
            }
        })
    }, [myaccounts])


    const totalBalance = useMemo(() => {
        return legalEntitiesData?.reduce((sum, item) => sum + (item.balance || 0), 0) || 0;
    }, [legalEntitiesData]);

    const viewOptions = [
        { value: 'compact', label: 'Компактный' },
        { value: 'full', label: 'Полный' }
    ];


    const toggleExpandGroup = (id) => {
        setExpandedGroups(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        )
        setActiveGroupMenu(null)
    }

    return (
        <div ref={balanceRef} style={{ position: 'relative', zIndex: 10000 }}>
            <div className={styles.balanceSection}>
                <div
                    onClick={() => {
                        setIsBalanceOpen(!isBalanceOpen)
                    }}
                    className={""}
                >
                    <div>
                        <div className='text-sm font-medium font-roboto cursor-pointer flex items-center gap-2'>
                            <div className="" />
                            <div className="flex items-center gap-2">
                                <p className="text-white">
                                    На счетах {mounted ? `${formatNumber(Summary?.current_balance)} ${GlobalCurrency?.name}` : '0'}
                                </p>
                            </div>
                            <ChevronDown size={14} className={cn(styles.balanceChevron, isBalanceOpen && styles.open)} />
                        </div>
                        <div className={styles.balanceSubtext} style={{ marginLeft: '17px', color: '#fbbf24' }}>
                            {today}
                        </div>
                    </div>
                </div>

                {/* Balance Modal */}
                {isBalanceOpen && modalMode === 'compact' && (
                    <div className={cn(styles.balanceModal, styles.compact)}>
                        <div className={styles.balanceModalFull}>
                            {/* Modal Header */}
                            <div className={styles.balanceModalFullHeader}>
                                <div className={styles.balanceModalFullTitleContainer}>
                                    <div className={styles.balanceModalFullTitle}>
                                        <div className={styles.balanceModalFullTitleDot} />
                                        <div className={styles.balanceModalFullTitleContent}>
                                            <h2 className="text-black text-xl font-semibold">{mounted ? formatNumber(formatTotalSumma(Summary?.current_balance)) : '0'} {mounted ? GlobalCurrency?.name : ''}</h2>
                                            <p className={styles.balanceModalFullTitleDate}>{today}</p>
                                        </div>
                                    </div>

                                </div>

                                <div className={styles.balanceModalFullControls}>
                                    <div style={{ minWidth: '150px' }}>
                                        <div className={styles.balanceViewToggle}>
                                            {viewOptions.map(opt => {
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setModalMode(opt.value)}
                                                        className={cn(
                                                            styles.balanceViewButton,
                                                            modalMode === opt.value ? styles.active : styles.inactive
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.balanceModalContent}>
                                <div className={styles.balanceGroupContent}>
                                    {Compactlist?.map((acc, idx) => (
                                        <div key={idx} className={styles.balanceAccount}>
                                            <div className={styles.balanceAccountLeft}>
                                                <div className={cn(styles.balanceAccountDot, acc?.color === 'red' && styles.red, acc?.color === 'green' && styles.green, acc?.color === 'blue' && styles.blue)} style={{ marginTop: '6px' }}></div>
                                                <div className={styles.balanceAccountInfo} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className={styles.balanceAccountName} style={{ fontSize: '14px', color: '#334155' }}>{acc?.name}</span>
                                                    {acc?.status && (
                                                        <span className={styles.balanceAccountStatus} style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>{acc?.status}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {acc?.balance && (
                                                <span className={styles.balanceAccountValue} style={{ fontSize: '14px', color: '#334155' }}>
                                                    {formatAmount(acc?.balance)} <span className={styles.balanceAccountCurrency} style={{ color: '#94a3b8' }}>{acc?.currency?.toLocaleString('ru-RU')}</span>
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
            {isBalanceOpen && modalMode === 'full' && (
                <div className={cn(styles.balanceModal, styles.full)}>
                    <div className={styles.balanceModalFull}>
                        {/* Modal Header */}
                        <div className={styles.balanceModalFullHeader}>
                            <div className={styles.balanceModalFullTitleContainer}>
                                <div className={styles.balanceModalFullTitle}>
                                    <div className={styles.balanceModalFullTitleDot} />
                                    <div className={styles.balanceModalFullTitleContent}>
                                        <h2 className={styles.balanceModalFullTitleValue}>{totalBalance.toLocaleString('ru-RU')} {GlobalCurrency?.name}</h2>
                                        <p className={styles.balanceModalFullTitleDate}>{today}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.balanceModalFullControls}>
                                <div style={{ minWidth: '150px' }}>
                                    <div className={styles.balanceViewToggle}>
                                        {viewOptions.map(opt => {
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setModalMode(opt.value)}
                                                    className={cn(
                                                        styles.balanceViewButton,
                                                        modalMode === opt.value ? styles.active : styles.inactive
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.balanceModalContent}>
                            <div className={styles.balanceGrid}>
                                {legalEntitiesData?.map((group) => (
                                    <div key={group.id} className={styles.balanceGroup}>
                                        <div className={styles.balanceGroupHeader}>
                                            <div className={styles.balanceGroupHeaderInner}>
                                                <span className={styles.balanceGroupName}>{group?.name} ({group?.total_items})</span>
                                                <div className={styles.balanceGroupValue}>
                                                    <span className={styles.balanceGroupValueText}>{formatAmount(group?.balance)} <span className={styles.balanceGroupValueCurrency}>{GlobalCurrency?.name}</span></span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveGroupMenu(activeGroupMenu === group.id ? null : group.id);
                                                        }}
                                                        className={styles.balanceGroupMenuButton}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Group Actions Dropdown */}
                                            {activeGroupMenu === group.id && (
                                                <div ref={groupMenuRef} className={styles.balanceGroupMenu}>
                                                    <button
                                                        onClick={() => toggleExpandGroup(group.id)}
                                                        className={styles.balanceGroupMenuItem}
                                                    >
                                                        <Maximize2 size={16} className={styles.balanceGroupMenuIcon} />
                                                        <span>{expandedGroups.includes(group.id) ? 'Свернуть' : 'Развернуть'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Content or Placeholder */}
                                        {expandedGroups?.includes(group.id) && group?.accounts?.length > 0 && (
                                            <div className={styles.balanceGroupContent}>
                                                {group?.accounts?.map((acc, idx) => (
                                                    <div key={idx} className={styles.balanceAccount}>
                                                        <div className={styles.balanceAccountLeft} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                            <div className={cn(styles.balanceAccountDot, acc?.color === 'red' && styles.red, acc?.color === 'green' && styles.green, acc?.color === 'blue' && styles.blue)} style={{ marginTop: '6px' }}></div>
                                                            <div className={styles.balanceAccountInfo} style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span className={styles.balanceAccountName} style={{ fontSize: '14px', color: '#334155' }}>{acc?.name}</span>
                                                                {acc?.status && (
                                                                    <span className={styles.balanceAccountStatus} style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>{acc?.status}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {acc?.balance && (
                                                            <span className={styles.balanceAccountValue} style={{ fontSize: '14px', color: '#334155' }}>
                                                                {formatAmount(acc?.balance)} <span className={styles.balanceAccountCurrency} style={{ color: '#94a3b8' }}>{acc?.currency?.toLocaleString('ru-RU')}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {group?.total_items === 0 && (
                                            <div className={styles.balanceGroupEmpty} style={{ padding: '24px', textAlign: 'center' }}>
                                                <span className={styles.balanceGroupEmptyText} style={{ color: '#94a3b8', fontSize: '14px' }}>Переместите счета в эту группу</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

export default TotalPrice
