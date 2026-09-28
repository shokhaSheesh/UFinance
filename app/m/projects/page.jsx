'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import DirectoryScreen from '@/components/mobile/DirectoryScreen'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import {
  createProject,
  deleteProject,
  listProjectGroups,
  listProjects,
  normalizeProject,
  updateProject,
} from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Проекты: список с прибылью и рентабельностью, создание и правка.
 *
 * На большом экране у проекта ещё период и статус; на телефоне важнее
 * деньги — заработал проект или нет.
 */
const MobileProjectsPage = observer(() => {
  const t = useTranslations('Projects')
  const tm = useTranslations('Mobile')
  const mounted = useMounted()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [formFor, setFormFor] = useState(null)

  const permissions = appStore.permission?.projects || { read: true, add: true, edit: true, delete: true }

  const { data, isLoading } = useQuery({
    queryKey: ['list_projects', 'mobile'],
    queryFn: () => listProjects({ page: 1, limit: 100 }),
    select: (response) => (response?.data?.data || []).map(normalizeProject),
  })

  const deleteMutation = useMutation({
    mutationFn: (project) => deleteProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list_projects'] })
      showSuccessNotification(tm('common.deleted'))
    },
    onError: (error) => showErrorNotification(error?.message),
  })

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = data || []
    if (!query) return list
    return list.filter((project) => (project.name || '').toLowerCase().includes(query))
  }, [data, search])

  const currency = mounted ? GlobalCurrency?.name : ''

  return (
    <>
      <DirectoryScreen
        title={t('pageTitle')}
        search={search}
        onSearch={setSearch}
        items={items}
        isLoading={isLoading}
        emptyIcon={FolderTree}
        emptyTitle={t('empty')}
        permissions={permissions}
        onCreate={() => setFormFor({})}
        onEdit={(project) => setFormFor(project)}
        onDelete={(project) => deleteMutation.mutateAsync(project)}
        deleting={deleteMutation.isPending}
        renderRow={(project) => (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FolderTree size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-slate-900">{project.name}</span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                {project.groupName || project.comment}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span
                className={cn(
                  'block text-[15px] font-semibold tabular-nums',
                  (project.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                <Money value={project.profit ?? 0} currency={currency} />
              </span>
              {project.profitability != null && (
                <span className="mt-0.5 block text-[11px] text-slate-400 tabular-nums">
                  {Math.round(Number(project.profitability))}%
                </span>
              )}
            </span>
          </>
        )}
      />

      <ProjectFormSheet open={Boolean(formFor)} project={formFor?.id ? formFor : null} onClose={() => setFormFor(null)} />
    </>
  )
})

/** Проект: название, группа и комментарий. */
function ProjectFormSheet({ open, onClose, project }) {
  const t = useTranslations('Projects')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: project?.name || '',
    group: project?.groupId || '',
    comment: project?.comment || '',
  })
  const [error, setError] = useState('')

  const { data: groups = [] } = useQuery({
    queryKey: ['list_project_groups', 'mobile'],
    queryFn: () => listProjectGroups({ page: 1, limit: 100 }),
    select: (response) => response?.data?.data || [],
    enabled: open,
  })

  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group?.guid, label: group?.name || group?.nazvanie })),
    [groups]
  )

  const saveMutation = useMutation({
    mutationFn: (payload) => (project?.id ? updateProject({ guid: project.id, ...payload }) : createProject(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list_projects'] })
      showSuccessNotification(tc('saved'))
      onClose()
    },
    onError: (mutationError) => showErrorNotification(mutationError?.message || tm('form.saveFailed')),
  })

  if (!open) return null

  const submit = () => {
    if (!form.name.trim()) {
      setError(t('createModal.nameRequired'))
      return
    }
    saveMutation.mutate({
      name: form.name.trim(),
      project_groups_id: form.group || undefined,
      description: form.comment || undefined,
    })
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={t('createModal.title')}
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={saveMutation.isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {saveMutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {project?.id ? tc('save') : tc('create')}
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        <MFieldRow label={t('createModal.name')} required error={error} className="bg-slate-50">
          <input
            autoFocus
            value={form.name}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, name: event.target.value }))
              setError('')
            }}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none"
          />
        </MFieldRow>

        <MSelectField
          label={t('createModal.group')}
          placeholder={tm('form.choose')}
          value={form.group}
          onChange={(value) => setForm((prev) => ({ ...prev, group: value }))}
          options={groupOptions}
        />

        <MFieldRow label={t('createModal.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}

export default MobileProjectsPage
