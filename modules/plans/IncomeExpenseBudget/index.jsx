'use client'

import SelectMyAccounts from '@/components/ReadyComponents/SelectMyAccounts'
import Input from '@/components/shared/Input'
import { ChevronDown, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

// Static data for the table
const STATIC_BUDGET_DATA = [
  {
    id: 1,
    name: 'Бюджет 2025',
    currency: 'RUB',
    legalEntity: 'ООО "Ромашка"',
    project: 'Основной бизнес',
    period: 'Янв \'25 – дек \'25',
    modifiedDate: '04.05.2026',
    modifiedBy: 'demo@planfact.io'
  },
  {
    id: 2,
    name: 'Q1 Маркетинг',
    currency: 'RUB',
    legalEntity: 'ООО "Ромашка"',
    project: 'Digital Campaign',
    period: 'Янв \'26 – мар \'26',
    modifiedDate: '03.05.2026',
    modifiedBy: 'admin@planfact.io'
  },
  {
    id: 3,
    name: 'IT Проект',
    currency: 'USD',
    legalEntity: 'ООО "ТехноСофт"',
    project: 'Cloud Migration',
    period: 'Апр \'25 – дек \'25',
    modifiedDate: '02.05.2026',
    modifiedBy: 'it@planfact.io'
  },
  {
    id: 4,
    name: 'HR Бюджет',
    currency: 'RUB',
    legalEntity: null,
    project: 'Recruitment 2025',
    period: 'Май \'25 – авг \'25',
    modifiedDate: '01.05.2026',
    modifiedBy: 'hr@planfact.io'
  },
  {
    id: 5,
    name: 'Sales Plan',
    currency: 'EUR',
    legalEntity: 'ООО "ЕвроТрейд"',
    project: 'Europe Market',
    period: 'Янв \'25 – дек \'25',
    modifiedDate: '30.04.2026',
    modifiedBy: 'sales@planfact.io'
  }
]

const IncomeExpenseBudget = () => {
  const t = useTranslations('Plans.incomeExpenseBudget')
  const tc = useTranslations('Common')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  // Filter and sort data using useMemo
  const filteredData = useMemo(() => {
    let data = [...STATIC_BUDGET_DATA]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.legalEntity && item.legalEntity.toLowerCase().includes(query)) ||
        (item.project && item.project.toLowerCase().includes(query)) ||
        item.modifiedBy.toLowerCase().includes(query)
      )
    }

    // Sort data
    data.sort((a, b) => {
      const aValue = a[sortConfig.key] || ''
      const bValue = b[sortConfig.key] || ''

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })

    return data
  }, [searchQuery, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleCreate = () => {
    // Placeholder for create action
    console.log('Create new budget')
  }

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-50" />
    }
    return (
      <ChevronDown
        className={`w-4 h-4 text-gray-600 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 ">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {t('title') || 'Бюджет доходов и расходов'}
          </h1>
          <button
            onClick={handleCreate}
            className="primary-btn flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {tc('create') || 'Создать'}
          </button>
        </div>

        {/* Right side filters */}
        <div className="flex items-center gap-3">
          <SelectMyAccounts
            value={selectedAccount}
            onChange={setSelectedAccount}
            placeholder={tc('placeholders.selectAccount') || 'Все счета'}
            multi={false}
            className="w-[220px] bg-white"
            isClearable
          />
          <Input
            type="text"
            leftIcon={<Search className="w-4 h-4" />}
            placeholder={t('searchPlaceholder') || 'Поиск по названию'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[280px]"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex mx-4 items-center bg-neutral-100 border-b border-neutral-50 text-xs font-medium text-neutral-500 sticky top-0 z-10">
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors  w-[300px] line-clamp-1"
          onClick={() => handleSort('name')}
        >
          {t('columns.name') || 'Название'}
          {renderSortIcon('name')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[80px] justify-center"
          onClick={() => handleSort('currency')}
        >
          {t('columns.currency') || 'Валюта'}
          {renderSortIcon('currency')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors flex-1 min-w-[140px]"
          onClick={() => handleSort('legalEntity')}
        >
          {t('columns.legalEntity') || 'Юрлицо'}
          {renderSortIcon('legalEntity')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors flex-1 min-w-[140px]"
          onClick={() => handleSort('project')}
        >
          {t('columns.project') || 'Проект'}
          {renderSortIcon('project')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[140px]"
          onClick={() => handleSort('period')}
        >
          {t('columns.period') || 'Период'}
          {renderSortIcon('period')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[120px]"
          onClick={() => handleSort('modifiedDate')}
        >
          {t('columns.modifiedDate') || 'Дата изменения'}
          {renderSortIcon('modifiedDate')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors flex-1 min-w-[160px]"
          onClick={() => handleSort('modifiedBy')}
        >
          {t('columns.modifiedBy') || 'Кто изменил'}
          {renderSortIcon('modifiedBy')}
        </div>
        <div className="w-[50px] flex justify-center px-3 py-2">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 mx-4 overflow-auto">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-sm">{t('noData') || 'Нет данных для отображения'}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredData.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center text-sm border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="px-4 py-3 w-[300px] line-clamp-1 font-medium text-slate-900">
                  {item.name}
                </div>
                <div className="px-4 py-3 w-[80px] text-start text-gray-600 font-medium">
                  {item.currency}
                </div>
                <div className="px-4 py-3 flex-1 min-w-[140px] text-gray-600">
                  {item.legalEntity || '—'}
                </div>
                <div className="px-4 py-3 flex-1 min-w-[140px] text-gray-600">
                  {item.project || '—'}
                </div>
                <div className="px-4 py-3 w-[140px] text-gray-600 text-xs">
                  {item.period}
                </div>
                <div className="px-4 py-3 w-[120px] text-gray-600 text-xs">
                  {item.modifiedDate}
                </div>
                <div className="px-4 py-3 flex-1 min-w-[160px] text-gray-600 text-xs">
                  {item.modifiedBy}
                </div>
                <div className="w-[50px] px-4 py-3 flex justify-center">
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <span>
          {t('footer.total', { count: filteredData.length }) || `${filteredData.length} бюджетов`}
        </span>
        <span className="text-gray-400">
          {t('footer.lastUpdated') || 'Обновлено: сегодня'}
        </span>
      </div>
    </div>
  )
}

export default IncomeExpenseBudget