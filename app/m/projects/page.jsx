'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import ProjectFormSheet from '@/components/mobile/forms/ProjectFormSheet'
import ProjectFigures from '@/components/mobile/ProjectFigures'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { STATUS_COLORS, statusToRu } from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { useDeleteProject, useProjectsList } from '@/modules/projects/hooks/useProjectsData'
import { appStore } from '@/store/app.store'
import { projectsStore } from '@/store/projects.store'
import { Briefcase, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Проекты на телефоне.
 *
 * Всё, что есть на странице проектов на компьютере: показатель для
 * анализа (прибыль кассовым методом или методом начисления), четыре итога
 * по выборке — листаются карточками, — вкладки по статусу и сами проекты:
 * статус, срок с полосой прошедшего времени, доходы, расходы, прибыль и
 * рентабельность. Данные и фильтры — те же хуки и то же хранилище, что на
 * компьютере, поэтому выборка совпадает.
 */

const STATUSES = ['planned', 'in_progress', 'completed']

/** Какая часть срока проекта уже прошла. */
const elapsedPercent = (start, end) => {
  if (!start || !end) return null
  const from = moment(start)
  const to = moment(end)
  const total = to.diff(from, 'days')
  if (total <= 0) return null
  return Math.max(0, Math.min(100, Math.round((moment().diff(from, 'days') / total) * 100)))
}

const MobileProjectsPage = observer(() => {
  const t = useTranslations('Projects')
  const ts = useTranslations('Projects.status')
  const td = useTranslations('Projects.detail')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()

  const [formFor, setFormFor] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)

  const permissions = appStore.permission?.projects || {}
  const deleteMutation = useDeleteProject()

  const { statuses, analysisMethod, search, setState } = projectsStore
  const statusesJs = useMemo(() => toJS(statuses), [statuses])
  // На телефоне одна вкладка статуса за раз; «Все» — все три
  const activeStatus = statusesJs.length === 1 ? statusesJs[0] : 'all'

  const apiFilters = useMemo(
    () => ({
      status: statusesJs.length === 1 ? statusToRu(statusesJs[0]) : undefined,
      search: search?.trim() || undefined,
      accounting_method: analysisMethod,
    }),
    [statusesJs, search, analysisMethod]
  )

  // Поиск уходит в запрос с задержкой — как на компьютере
  const [requestFilters, setRequestFilters] = useState(apiFilters)
  useEffect(() => {
    const timer = setTimeout(() => setRequestFilters(apiFilters), 500)
    return () => clearTimeout(timer)
  }, [apiFilters])

  const { projects, summary, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useProjectsList(requestFilters)
  const items = projects.filter((project) => !statusesJs.length || statusesJs.includes(project.status))

  const sentinelRef = useRef(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const currency = mounted ? GlobalCurrency?.name : ''


  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={t('pageTitle')}
        onBack={() => router.push('/m/profile')}
        action={
          permissions?.add && (
            <button
              type="button"
              onClick={() => setFormFor({})}
              aria-label={t('createProject')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
            >
              <Plus size={19} aria-hidden="true" />
            </button>
          )
        }
      />

      {/* Показатель для анализа */}
      <div className="flex rounded-2xl bg-white p-1">
        {['cash', 'accrual'].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setState('analysisMethod', value)}
            className={cn(
              'min-w-0 flex-1 truncate rounded-xl px-2 py-2.5 text-[12px] font-semibold',
              analysisMethod === value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
            )}
          >
            {t(`methods.${value}`)}
          </button>
        ))}
      </div>

      {/* Итоги по выборке — одной карточкой */}
      {mounted && (
        <div className="mt-2.5">
          <ProjectFigures
            income={summary.income}
            expenses={summary.expenses}
            profit={summary.profit}
            profitability={summary.profitability}
            currency={currency}
          />
        </div>
      )}

      {/* Поиск */}
      <div className="mt-3 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
        <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
        <input
          value={search || ''}
          onChange={(event) => setState('search', event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {search && (
          <button type="button" onClick={() => setState('search', '')} className="shrink-0 text-slate-400">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Статус */}
      <div className="-mx-4 mt-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {['all', ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setState('statuses', status === 'all' ? [...STATUSES] : [status])}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold',
                activeStatus === status ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
              )}
            >
              {status !== 'all' && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />}
              {status === 'all' ? t('statusAll') : ts(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Проекты */}
      <div className="mt-2.5 flex flex-col gap-2.5">
        {isLoading && !items.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}
        {!isLoading && !items.length && <MEmpty icon={Briefcase} title={t('empty')} />}

        {items.map((project) => {
          const elapsed = elapsedPercent(project.startDate, project.endDate)
          const color = STATUS_COLORS[project.status]
          const profit = Number(project.profit) || 0
          return (
            <MCard key={project.id} className="p-4">
              <button type="button" onClick={() => router.push(`/m/projects/${project.id}`)} className="w-full text-left">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Briefcase size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{project.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {project.groupName || project.comment || '—'}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: `${color}1a`, color }}
                  >
                    {ts(project.status)}
                  </span>
                  {(permissions?.edit || permissions?.delete) && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={tc('actions')}
                      onClick={(event) => {
                        event.stopPropagation()
                        setMenuFor(project)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.stopPropagation()
                          setMenuFor(project)
                        }
                      }}
                      className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400"
                    >
                      <MoreHorizontal size={17} aria-hidden="true" />
                    </span>
                  )}
                </div>

                {/* Срок проекта */}
                {(project.startDate || project.endDate) && (
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-slate-500">
                      <span className="truncate">
                        {[project.startDate, project.endDate]
                          .map((date) => (date ? moment(date).format('D MMM YYYY') : '…'))
                          .join(' → ')}
                      </span>
                      {elapsed != null && (
                        <span className="shrink-0 font-semibold text-slate-600">{t('termElapsed', { percent: elapsed })}</span>
                      )}
                    </div>
                    {elapsed != null && (
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${elapsed}%`, backgroundColor: color }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Деньги проекта */}
                <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3">
                  <div className="min-w-0 pr-2">
                    <div className="truncate text-[11px] text-slate-400">{td('income')}</div>
                    <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">
                      <Money value={Number(project.income) || 0} currency="" />
                    </div>
                  </div>
                  <div className="min-w-0 px-2">
                    <div className="truncate text-[11px] text-slate-400">{td('expenses')}</div>
                    <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">
                      <Money value={Number(project.expenses) || 0} currency="" />
                    </div>
                  </div>
                  <div className="min-w-0 pl-2">
                    <div className="truncate text-[11px] text-slate-400">{td('profit')}</div>
                    <div className={cn('mt-0.5 truncate text-[13px] font-bold', profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      <Money value={profit} currency="" />
                      {project.profitability != null && (
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">
                          {Math.round(Number(project.profitability) * 10) / 10}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </MCard>
          )
        })}

        <div ref={sentinelRef} className="h-6">
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Что сделать с проектом */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        <div className="flex flex-col">
          {permissions?.edit && (
            <button
              type="button"
              onClick={() => {
                setFormFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions?.delete && (
            <button
              type="button"
              onClick={() => {
                setDeleteFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setDeleteFor(null)} className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteMutation.mutateAsync(deleteFor.id)
                setDeleteFor(null)
              }}
              disabled={deleteMutation.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{deleteFor?.name}</p>
      </BottomSheet>

      <ProjectFormSheet open={Boolean(formFor)} project={formFor?.id ? formFor : null} onClose={() => setFormFor(null)} />
    </div>
  )
})

export default MobileProjectsPage
