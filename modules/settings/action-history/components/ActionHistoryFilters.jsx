'use client'

import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { ACTIONS, TABLE_SLUGS } from '@/modules/settings/action-history/utils/constants'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ActionHistoryFilters = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  userOptions,
  activeFilterCount,
  onReset,
}) => {
  const th = useTranslations('Settings.actionHistory')

  const sectionOptions = TABLE_SLUGS.map(slug => ({ value: slug, label: th(`tables.${slug}`) }))
  const actionOptions = ACTIONS.map(action => ({ value: action, label: th(`actions.${action}`) }))

  return (
    <div className="flex flex-wrap items-end gap-3 px-6 py-4 border-b border-gray-200 bg-white">
      <div className="flex flex-col gap-1.5 w-[260px]">
        <label className="text-xs font-medium text-gray-ucode-600">{th('filters.search')}</label>
        <Input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder={th('filters.searchPlaceholder')}
          leftIcon={<Search size={16} />}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-[220px]">
        <label className="text-xs font-medium text-gray-ucode-600">{th('filters.user')}</label>
        <SingleSelect
          data={userOptions}
          value={filters.userId}
          onChange={value => onFilterChange('userId', value || '')}
          placeholder={th('filters.allUsers')}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-[220px]">
        <label className="text-xs font-medium text-gray-ucode-600">{th('filters.section')}</label>
        <SingleSelect
          data={sectionOptions}
          value={filters.tableSlug}
          onChange={value => onFilterChange('tableSlug', value || '')}
          placeholder={th('filters.allSections')}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-[180px]">
        <label className="text-xs font-medium text-gray-ucode-600">{th('filters.action')}</label>
        <SingleSelect
          data={actionOptions}
          value={filters.action}
          onChange={value => onFilterChange('action', value || '')}
          placeholder={th('filters.allActions')}
          withSearch={false}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-[280px]">
        <label className="text-xs font-medium text-gray-ucode-600">{th('filters.date')}</label>
        <NewDateRangeComponent
          value={filters.dateRange}
          onChange={range => onFilterChange('dateRange', { start: range?.start, end: range?.end })}
          present={filters.dateRangeType}
          onSetPresent={preset => onFilterChange('dateRangeType', preset)}
          onClear={() => onFilterChange('dateRangeType', '')}
        />
      </div>

      {activeFilterCount > 0 && (
        <button onClick={onReset} className="outline-btn flex items-center gap-1.5 h-9">
          <X size={14} />
          {th('filters.reset')} ({activeFilterCount})
        </button>
      )}
    </div>
  )
}

export default ActionHistoryFilters
