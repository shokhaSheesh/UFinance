'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { useCreateProject, useProjectGroups, useUpdateProject } from '@/modules/projects/hooks/useProjectsData'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Проект: создание и правка — название, группа и комментарий, как в окне
 * на компьютере. Мутации и список групп — те же хуки, что у страницы
 * проектов, поэтому новый проект сразу виден и там, и здесь.
 */
export default function ProjectFormSheet({ open, onClose, project }) {
  if (!open) return null
  return <ProjectForm onClose={onClose} project={project} />
}

function ProjectForm({ onClose, project }) {
  const t = useTranslations('Projects')
  const tc = useTranslations('Common')

  const isEdit = Boolean(project?.id)
  const [form, setForm] = useState({
    name: project?.name || '',
    group: project?.groupId || '',
    comment: project?.comment || '',
  })
  const [error, setError] = useState('')

  // группы уже в виде { value, label }
  const { groups = [] } = useProjectGroups()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const saving = createMutation.isPending || updateMutation.isPending


  const submit = async () => {
    if (!form.name.trim()) {
      setError(t('createModal.nameRequired'))
      return
    }
    const payload = {
      name: form.name.trim(),
      project_groups_id: form.group || (isEdit ? '' : undefined),
      description: form.comment || (isEdit ? '' : undefined),
    }
    if (isEdit) await updateMutation.mutateAsync({ guid: project.id, ...payload })
    else await createMutation.mutateAsync(payload)
    showSuccessNotification(tc('saved'))
    onClose()
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? project.name : t('createModal.title')}
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isEdit ? tc('save') : tc('create')}
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
            placeholder={t('createModal.namePlaceholder')}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MSelectField
          label={t('createModal.group')}
          placeholder={t('createModal.groupPlaceholder')}
          value={form.group}
          onChange={(value) => setForm((prev) => ({ ...prev, group: value }))}
          options={groups}
        />

        <MFieldRow label={t('createModal.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            placeholder={t('createModal.commentPlaceholder')}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
