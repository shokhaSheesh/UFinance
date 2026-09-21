'use client'

import { cn } from '@/lib/utils'
import styles from '../projects.module.scss'
import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { LayoutList, List, Search } from 'lucide-react'
import CreateProjectGroupModal from '@/components/projects/CreateProjectGroupModal'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import ScreenLoader from '@/components/shared/ScreenLoader'
import useMounted from '@/hooks/useMounted'
import FixedContent from '@/layouts/FixedContent'
import { statusToRu } from '@/lib/api/ucode/projects'
import { appStore } from '@/store/app.store'
import { projectsStore } from '@/store/projects.store'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import ProjectsFilterSidebar from '../components/ProjectsFilterSidebar'
import ProjectsFooter from '../components/ProjectsFooter'
import ProjectsHeader from '../components/ProjectsHeader'
import ProjectsTable from '../components/ProjectsTable'
import {
  useCreateProject,
  useCreateProjectGroup,
  useDeleteProject,
  useProjectGroups,
  useProjectsList,
  useUpdateProject,
} from '../hooks/useProjectsData'

export default observer(function ProjectsListPage() {
  const t = useTranslations('Projects')
  const ts = useTranslations('Projects.status')
  const tc = useTranslations('Common')
  const mounted = useMounted()
  const router = useRouter()

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Права раздела «Проекты»
  const permissions = appStore.permission.projects || {}
  const [projectModal, setProjectModal] = useState({ open: false, project: null })
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const {
    statuses,
    dateRange,
    selectedProjects,
    showActive,
    analysisMethod,
    viewMode,
    search,
    setState,
  } = projectsStore

  const statusesJs = useMemo(() => toJS(statuses), [statuses])
  const selectedProjectsJs = useMemo(() => toJS(selectedProjects), [selectedProjects])
  const dateRangeJs = useMemo(() => toJS(dateRange), [dateRange])

  // ── Параметры для API (status — только когда выбран ровно один) ──
  const apiFilters = useMemo(
    () => ({
      status: statusesJs.length === 1 ? statusToRu(statusesJs[0]) : undefined,
      search: search?.trim() || undefined,
      project_ids: selectedProjectsJs?.length ? selectedProjectsJs : undefined,
      start_from_date: dateRangeJs?.start
        ? moment(dateRangeJs.start).format('YYYY-MM-DD')
        : undefined,
      end_to_date: dateRangeJs?.end ? moment(dateRangeJs.end).format('YYYY-MM-DD') : undefined,
      // Метод учёта — от него зависят доходы, расходы и прибыль в списке.
      // Имя поля как в дашборде проекта (profit_and_loss).
      accounting_method: analysisMethod,
    }),
    [statusesJs, search, selectedProjectsJs, dateRangeJs, analysisMethod]
  )

  // Дебаунс запроса (поиск/фильтры)
  const [debouncedFilters, setDebouncedFilters] = useState(apiFilters)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedFilters(apiFilters), 500)
    return () => clearTimeout(id)
  }, [apiFilters])

  const {
    projects,
    summary,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectsList(debouncedFilters)

  const { groups } = useProjectGroups()

  // Клиентская доводка фильтров, которые API не покрывает напрямую
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusesJs.length && !statusesJs.includes(p.status)) return false
      if (!showActive) return false // архивных нет в API — всё активно
      return true
    })
  }, [projects, statusesJs, showActive])

  const methodOptions = useMemo(
    () => [
      { value: 'cash', label: t('methods.cash') },
      { value: 'accrual', label: t('methods.accrual') },
    ],
    [t]
  )

  // ── Мутации ──
  const createProjectMut = useCreateProject()
  const updateProjectMut = useUpdateProject()
  const deleteProjectMut = useDeleteProject()
  const createGroupMut = useCreateProjectGroup()

  const submitProject = async (payload) => {
    if (payload.id) {
      await updateProjectMut.mutateAsync({
        guid: payload.id,
        name: payload.name,
        project_groups_id: payload.groupId ?? '',
        description: payload.comment ?? '',
      })
    } else {
      await createProjectMut.mutateAsync({
        name: payload.name,
        project_groups_id: payload.groupId || undefined,
        description: payload.comment || undefined,
      })
    }
  }

  const addGroup = async (payload) => {
    const res = await createGroupMut.mutateAsync({
      name: payload.name,
      description: payload.comment,
    })
    return res?.data?.guid || null
  }

  if (!mounted) return null

  const showInitialLoader = isLoading && projects.length === 0

  return (
    <FixedContent>
      <ProjectsFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      <main id="scrollableDiv" className="w-full relative overflow-y-auto scroll-smooth bg-canvas px-6 pb-6">
        <ProjectsHeader
          t={t}
          canAdd={permissions.add}
          onCreateProject={() => setProjectModal({ open: true, project: null })}
          onCreateGroup={() => setGroupModalOpen(true)}
          onExport={() => {}}
        />

        <TableCard>
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setState('search', e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            }
            actions={
              <>
                <div className="w-60">
                  <SingleSelect
                    data={methodOptions}
                    withSearch={false}
                    value={analysisMethod}
                    isClearable={false}
                    onChange={(v) => setState('analysisMethod', v)}
                    className="bg-white"
                  />
                </div>
                {/* Переключатель вида списка */}
                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={cn(styles.viewToggleBtn, viewMode === 'list' && styles.active)}
                    onClick={() => setState('viewMode', 'list')}
                    aria-label="list view"
                  >
                    <List size={18} />
                  </button>
                  <button
                    type="button"
                    className={cn(styles.viewToggleBtn, viewMode === 'compact' && styles.active)}
                    onClick={() => setState('viewMode', 'compact')}
                    aria-label="compact view"
                  >
                    <LayoutList size={18} />
                  </button>
                </div>
                <FilterButton onClick={() => setIsFilterOpen(true)} />
              </>
            }
          />

        <ProjectsTable
          t={t}
          ts={ts}
          tc={tc}
          projects={filtered}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          onRowClick={(project) => router.push(`/projects/${project.id}`)}
          onEdit={permissions.edit ? (project) => setProjectModal({ open: true, project }) : undefined}
          onDelete={permissions.delete ? (project) => deleteProjectMut.mutate(project.id) : undefined}
        />
        </TableCard>

        {showInitialLoader && <ScreenLoader className="left-0!" />}
        {(isFetchingNextPage || isFetching) && !showInitialLoader && <ScreenLoader className="left-0!" />}
      </main>

      <ProjectsFooter t={t} summary={summary} isFilterOpen={isFilterOpen} />

      {projectModal.open && (
        <CreateProjectModal
          isOpen
          project={projectModal.project}
          groups={groups}
          onClose={() => setProjectModal({ open: false, project: null })}
          onSubmit={submitProject}
          onGroupCreated={addGroup}
        />
      )}

      {groupModalOpen && (
        <CreateProjectGroupModal
          isOpen
          onClose={() => setGroupModalOpen(false)}
          onSubmit={(payload) => addGroup(payload)}
        />
      )}
    </FixedContent>
  )
})
