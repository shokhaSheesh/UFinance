'use client'

import { X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { indicators } from '../../../store/indicatos.store'
import MultiSelectZdelka from '../../ReadyComponents/MultiZdelka'
import SelectMyAccounts from "../../ReadyComponents/SelectMyAccounts"
import CustomRangeMonthPicker from '../../shared/CustomRangeMonthPicker'
import SingleSelect from "../../shared/Selects/SingleSelect"
import './style.scss'

const IndicatorsNavbar = () => {
    const t = useTranslations('Indicators')
    const [displayMode, setDisplayMode] = useState('monthly')
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [selectedDeal, setSelectedDeal] = useState(null)

    const { setState, rangeMonth } = indicators

    const monthsFull = t('common.monthNamesFull').split(',')
    const weekdayNames = t('common.weekdayNames').split(',')
    const today = new Date()
    const dateText = `${String(today.getDate()).padStart(2, '0')} ${monthsFull[today.getMonth()]} ${today.getFullYear()} ${weekdayNames[today.getDay()]}`

    const displayOptions = [
        { value: 'weekly', label: t('header.displayOptions.weekly') },
        { value: 'monthly', label: t('header.displayOptions.monthly') },
        { value: 'quarterly', label: t('header.displayOptions.quarterly') },
        { value: 'yearly', label: t('header.displayOptions.yearly') },
    ]

    const handleReset = () => {
        setDisplayMode('monthly')
        setSelectedAccount(null)
        setSelectedDeal(null)
    }

    const hasFilters = selectedAccount || selectedDeal || displayMode !== 'monthly'

    return (
        <div id="indicator_header" className="flex items-center justify-between bg-white h-18 px-4 border-b border-neutral-200">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                <div>
                    <h1 className='text-2xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis'>{t('header.title')}</h1>
                    <p className='text-xs text-gray-400 whitespace-nowrap capitalize'>{dateText}</p>
                </div>
                <div className="w-[180px] shrink-0">
                    <CustomRangeMonthPicker
                        value={rangeMonth}
                        onChange={(months) => setState('rangeMonth', months)}
                        format="MMM, 'YY"
                        range
                    />
                </div>

                <div className="w-[140px] shrink-0">
                    <SingleSelect
                        data={displayOptions}
                        value={indicators.periodType}
                        onChange={(value) => indicators.setState('periodType', value)}
                        isClearable={false}
                        withSearch={false}
                        placeholder={t('header.placeholders.display')}
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <SelectMyAccounts
                        value={indicators.accounts}
                        onChange={(value) => indicators.setState('accounts', value)}
                        placeholder={t('header.placeholders.account')}
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <MultiSelectZdelka
                        value={indicators.deals}
                        onChange={(value) => indicators.setState('deals', value)}
                        placeholder={t('header.placeholders.deal')}
                        className="bg-neutral-50/50"
                    />
                </div>

                {hasFilters && (
                    <button
                        onClick={handleReset}
                        className="p-1 px-2 hover:bg-neutral-100 rounded-md transition-colors text-neutral-400 hover:text-neutral-600 flex items-center gap-1 text-xs shrink-0"
                        title={t('header.reset')}
                    >
                        <X size={16} />
                        <span>{t('header.reset')}</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export default observer(IndicatorsNavbar)