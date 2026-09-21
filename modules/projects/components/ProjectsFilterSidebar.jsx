'use client'

import { FilterField } from '@/components/shared/Filters/FilterDrawer'
import ToggleChip from '@/components/shared/Filters/ToggleChip'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { projectsStore } from '@/store/projects.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useProjectOptions } from '../hooks/useProjectsData'

const STATUS_KEYS = ['planned', 'in_progress', 'completed']

const ProjectsFilterSidebar = observer(({ isOpen = false, onClose }) => {
  const t = useTranslations('Projects.filters')
  const tf = useTranslations('filters')
  const ts = useTranslations('Projects.status')

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
      onClose={onClose}
      clearCount={clearCount}
      onClear={() => projectsStore.resetFilters()}
    >
      {/* Статус проекта */}
      <FilterSection title={t('projectStatus')}>
        <FilterField full>
          <div className="flex flex-wrap gap-2">
            {STATUS_KEYS.map((key) => (
              <ToggleChip key={key} checked={statuses.includes(key)} onChange={() => toggleStatus(key)}>
                {ts(key)}
              </ToggleChip>
            ))}
          </div>
        </FilterField>
      </FilterSection>

      {/* Период проекта */}
      <FilterSection title={t('period')}>
        <FilterField full>
          <NewDateRangeComponent
            value={dateRange}
            onChange={(range) => setState('dateRange', { start: range.start, end: range.end })}
            present={dateRangeType}
            onSetPresent={(present) => setState('dateRangeType', present)}
            onClear={() => setState('dateRangeType', '')}
          />
        </FilterField>
      </FilterSection>

      {/* Параметры и архив */}
      <FilterSection title={t('parameters')}>
        <FilterField label={t('projects')}>
          <MultiSelect
            data={projectOptions}
            value={selectedProjects || []}
            onChange={(val) => setState('selectedProjects', val)}
            placeholder={tf('all')}
          />
        </FilterField>
        <FilterField label={t('archive')}>
          <div className="flex flex-wrap gap-2">
            <ToggleChip checked={showActive} onChange={(v) => setState('showActive', v)}>{t('showActive')}</ToggleChip>
            <ToggleChip checked={showArchived} onChange={(v) => setState('showArchived', v)}>{t('showArchived')}</ToggleChip>
          </div>
        </FilterField>
      </FilterSection>
    </FilterSidebar>
  )
})

export default ProjectsFilterSidebar
