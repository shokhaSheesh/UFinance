'use client'

import { X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useState } from 'react'
import { indicators } from '../../../store/indicatos.store'
import MultiSelectZdelka from '../../ReadyComponents/MultiZdelka'
import SelectMyAccounts from "../../ReadyComponents/SelectMyAccounts"
import CustomRangeMonthPicker from '../../shared/CustomRangeMonthPicker'
import SingleSelect from "../../shared/Selects/SingleSelect"
import './style.scss'

const IndicatorsNavbar = () => {
    const [displayMode, setDisplayMode] = useState('monthly')
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [selectedDeal, setSelectedDeal] = useState(null)

    const { setState, rangeMonth } = indicators

    const displayOptions = [
        { value: 'weekly', label: 'По неделям' },
        { value: 'monthly', label: 'По месяцам' },
        { value: 'quarterly', label: 'По кварталам' },
        { value: 'yearly', label: 'По годам' },
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
                    <h1 className='text-2xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis'>Моя компания</h1>
                    <p className='text-xs text-gray-400 whitespace-nowrap capitalize'>{moment(new Date()).format('DD MMMM YYYY dddd')}</p>
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
                        placeholder="Отображение"
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <SelectMyAccounts
                        value={indicators.accounts}
                        onChange={(value) => indicators.setState('accounts', value)}
                        placeholder="Счет"
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <MultiSelectZdelka
                        value={indicators.deals}
                        onChange={(value) => indicators.setState('deals', value)}
                        placeholder="Сделка"
                        className="bg-neutral-50/50"
                    />
                </div>

                {hasFilters && (
                    <button
                        onClick={handleReset}
                        className="p-1 px-2 hover:bg-neutral-100 rounded-md transition-colors text-neutral-400 hover:text-neutral-600 flex items-center gap-1 text-xs shrink-0"
                        title="Сбросить"
                    >
                        <X size={16} />
                        <span>Сбросить</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export default observer(IndicatorsNavbar)