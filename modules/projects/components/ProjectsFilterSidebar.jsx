'use client'

import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { projectsStore } from '@/store/projects.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useProjectOptions } from '../hooks/useProjectsData'

const STATUS_KEYS = ['planned', 'in_progress', 'completed']

const ProjectsFilterSidebar = observer(({ onOpenChange }) => {
  const t = useTranslations('Projects.filters')
  const ts = useTranslations('Projects.status')
  const [isOpen, setIsOpen] = useState(true)

  const {
    statuses,
    dateRange,
    dateRangeType,
    selectedProjects,
    showActive,
    showArchived,
    setState,
    toggleStatus,
  } = projectsStore

  const { options: projectOptions } = useProjectOptions()

  const toggleOpen = (val) => {
    setIsOpen(val)
    onOpenChange?.(val)
  }

  // Количество активных (не дефолтных) фильтров — для кнопки очистки
  const clearCount = useMemo(() => {
    let count = 0
    if (statuses.length !== STATUS_KEYS.length) count++
    if (dateRange?.start || dateRange?.end) count++
    if (selectedProjects?.length > 0) count++
    if (!showActive || !showArchived) count++
    return count
  }, [statuses, dateRange, selectedProjects, showActive, showArchived])

  return (
    <FilterSidebar
      isOpen={isOpen}
      onClose={() => toggleOpen(!isOpen)}
      clearCount={clearCount}
      onClear={() => projectsStore.resetFilters()}
    >
      {/* Статус проекта */}
      <FilterSection title={t('projectStatus')} className="mb-5">
        <div className="flex flex-col gap-3 justify-start items-start">
          {STATUS_KEYS.map((key) => (
            <OperationCheckbox
              key={key}
              checked={statuses.includes(key)}
              onChange={() => toggleStatus(key)}
              label={ts(key)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Период проекта */}
      <FilterSection title={t('period')} className="mb-5">
        <NewDateRangeComponent
          value={dateRange}
          onChange={(range) => setState('dateRange', { start: range.start, end: range.end })}
          present={dateRangeType}
          onSetPresent={(present) => setState('dateRangeType', present)}
          onClear={() => setState('dateRangeType', '')}
        />
      </FilterSection>

      {/* Параметры */}
      <FilterSection title={t('parameters')} className="mb-5">
        <div className="flex flex-col gap-2">
          <MultiSelect
            data={projectOptions}
            value={selectedProjects || []}
            onChange={(val) => setState('selectedProjects', val)}
            placeholder={t('projects')}
            className="bg-gray-ucode-25"
          />
        </div>
      </FilterSection>

      {/* Архив */}
      <FilterSection title={t('archive')} className="mb-5">
        <div className="space-y-3 flex items-start flex-col">
          <OperationCheckbox
            checked={showActive}
            onChange={(e) => setState('showActive', e.target?.checked)}
            label={t('showActive')}
          />
          <OperationCheckbox
            checked={showArchived}
            onChange={(e) => setState('showArchived', e.target?.checked)}
            label={t('showArchived')}
          />
        </div>
      </FilterSection>
    </FilterSidebar>
  )
})

export default ProjectsFilterSidebar
