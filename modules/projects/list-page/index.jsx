'use client'

import { cn } from '@/lib/utils'
import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import Segmented from '@/components/shared/Segmented/Segmented'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { LayoutGrid, Percent, Rows3, Search, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import CreateProjectGroupModal from '@/components/projects/CreateProjectGroupModal'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import ScreenLoader from '@/components/shared/ScreenLoader'
import useMounted from '@/hooks/useMounted'
import FixedContent from '@/layouts/FixedContent'
import { STATUS_COLORS, statusToRu } from '@/lib/api/ucode/projects'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { appStore } from '@/store/app.store'
import { projectsStore } from '@/store/projects.store'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import ProjectsFilterSidebar from '../components/ProjectsFilterSidebar'
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

  // Итоги выборки — раньше мелкой полосой внизу экрана
  const methodHint = analysisMethod === 'accrual' ? t('methods.accrual') : t('methods.cash')
  const kpis = [
    { key: 'income', label: t('table.income'), value: summary?.income, currency: GlobalCurrency?.name, hint: t('kpi.incomeHint'), icon: TrendingUp },
    { key: 'expenses', label: t('table.expenses'), value: summary?.expenses, currency: GlobalCurrency?.name, hint: t('kpi.expensesHint'), icon: TrendingDown },
    { key: 'profit', label: t('table.profit'), value: Math.round(Number(summary?.profit) || 0), currency: GlobalCurrency?.name, hint: methodHint, icon: Wallet, tone: 'signed' },
    {
      key: 'profitability',
      label: t('table.profitability'),
      value: summary?.profitability == null ? 0 : Number(Number(summary.profitability).toFixed(1)),
      currency: '%',
      hint: methodHint,
      icon: Percent,
      tone: 'signed',
    },
  ]

  // Вкладки статусов: «Все» — все три статуса, как по умолчанию в фильтре
  const allStatuses = ['planned', 'in_progress', 'completed']
  const activeStatusTab = statusesJs.length === allStatuses.length ? 'all' : statusesJs.length === 1 ? statusesJs[0] : null
  const statusTabs = [
    { value: 'all', label: t('statusAll') },
    ...allStatuses.map((value) => ({ value, label: ts(value), color: STATUS_COLORS[value] })),
  ]
  const view = viewMode === 'cards' ? 'cards' : 'list'

  const showInitialLoader = isLoading && projects.length === 0

  return (
    <FixedContent>
      <ProjectsFilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      <main id="scrollableDiv" className="w-full relative overflow-auto scroll-smooth bg-canvas px-6 pb-10">
        <ProjectsHeader
          t={t}
          canAdd={permissions.add}
          onCreateProject={() => setProjectModal({ open: true, project: null })}
          onCreateGroup={() => setGroupModalOpen(true)}
          onExport={() => {}}
          countLabel={t('footer.count', { count: summary?.count || 0 })}
        />

        {/* Показатель для анализа — от него зависят прибыль и рентабельность */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('analysisIndicator')}</span>
          <Segmented
            ariaLabel={t('analysisIndicator')}
            options={methodOptions}
            value={analysisMethod}
            onChange={(v) => setState('analysisMethod', v)}
          />
        </div>

        <div className="mb-4 grid grid-cols-4 gap-3">
          {kpis.map(({ key, ...kpi }) => (
            <KpiCard key={key} {...kpi} />
          ))}
        </div>

        <TableCard className={cn('min-w-fit overflow-visible', view === 'cards' && 'border-0 bg-transparent')}>
          <TableToolbar
            className={cn('rounded-t-xl', view === 'cards' && 'rounded-xl border border-slate-200')}
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
                <Segmented
                  ariaLabel={t('view.table')}
                  value={view}
                  onChange={(v) => setState('viewMode', v)}
                  options={[
                    { value: 'list', label: t('view.table'), icon: Rows3 },
                    { value: 'cards', label: t('view.cards'), icon: LayoutGrid },
                  ]}
                />
                <FilterButton onClick={() => setIsFilterOpen(true)} />
              </>
            }
          />

          {/* Вкладки статусов — быстрый фильтр; в окне фильтров можно выбрать несколько */}
          <div
            role="tablist"
            className={cn(
              'flex items-center gap-1 overflow-x-auto px-3',
              view === 'cards' ? 'mb-3' : 'border-b border-slate-200'
            )}
          >
            {statusTabs.map((tab) => {
              const active = activeStatusTab === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setState('statuses', tab.value === 'all' ? [...allStatuses] : [tab.value])}
                  className={cn(
                    '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium cursor-pointer transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0e73f6]',
                    active ? 'border-[#0e73f6] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                  )}
                >
                  {tab.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />}
                  {tab.label}
                </button>
              )
            })}
          </div>

        <ProjectsTable
          t={t}
          ts={ts}
          tc={tc}
          view={view}
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
