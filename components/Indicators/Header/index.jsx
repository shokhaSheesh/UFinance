'use client'

import { X } from 'lucide-react'
import moment from 'moment/moment'
import { useState } from 'react'
import SelectMyAccounts from "../../ReadyComponents/SelectMyAccounts"
import SingleZdelka from "../../ReadyComponents/SingleZdelka"
import RangeMonthPicker from "../../shared/RangeMonthPicker"
import SingleSelect from "../../shared/Selects/SingleSelect"
import './style.scss'

const IndicatorsNavbar = () => {
    const [displayMode, setDisplayMode] = useState('monthly')
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [selectedDeal, setSelectedDeal] = useState(null)

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
                    <RangeMonthPicker className="h-9 px-3" format="MMM, 'YY" />
                </div>

                <div className="w-[140px] shrink-0">
                    <SingleSelect
                        data={displayOptions}
                        value={displayMode}
                        onChange={setDisplayMode}
                        isClearable={false}
                        withSearch={false}
                        placeholder="Отображение"
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <SelectMyAccounts
                        multi={false}
                        value={selectedAccount}
                        onChange={setSelectedAccount}
                        placeholder="Счет"
                        className="bg-neutral-50/50"
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <SingleZdelka
                        value={selectedDeal}
                        onChange={setSelectedDeal}
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

export default IndicatorsNavbar