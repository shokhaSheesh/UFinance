'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import ProjectGroupSelect from '@/modules/projects/components/ProjectGroupSelect'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import CreateProjectGroupModal from './CreateProjectGroupModal'

/**
 * Модалка «Создать проект» (и редактирование). API пока нет — на submit вызывает
 * onSubmit(payload). Группу можно выбрать или создать новую (onGroupCreated → id).
 */
export default function CreateProjectModal({
  isOpen,
  onClose,
  groups = [],
  project = null,
  onSubmit,
  onGroupCreated,
}) {
  const t = useTranslations('Projects.createModal')
  const tc = useTranslations('Common')
  const isEdit = !!project?.id

  const [form, setForm] = useState(() => ({
    name: project?.name || '',
    groupId: project?.groupId || '',
    comment: project?.comment || '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [groupModal, setGroupModal] = useState({ open: false, name: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: t('nameRequired') })
      return
    }
    try {
      setSubmitting(true)
      await onSubmit?.({
        id: project?.id,
        name: form.name.trim(),
        groupId: form.groupId || null,
        comment: form.comment.trim() || null,
      })
      onClose()
    } catch {
      // уведомление об ошибке показывает мутация
    } finally {
      setSubmitting(false)
    }
  }

  const handleGroupCreated = async (payload) => {
    const newId = await onGroupCreated?.(payload)
    if (newId) setForm((prev) => ({ ...prev, groupId: newId }))
  }

  return (
    <>
      <CustomDialog open={isOpen} onClose={onClose} contentClass="p-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col bg-white rounded-xl w-[620px] max-w-[92vw]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-slate-900 m-0">{t('title')}</h3>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Название */}
            <div className="flex items-start gap-4">
              <label className="w-36 text-sm text-slate-700 mt-2.5 shrink-0">
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col gap-1.5">
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value })
                    if (errors.name) setErrors({})
                  }}
                  placeholder={t('namePlaceholder')}
                  className={cn(errors.name && 'border-red-500')}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
            </div>

            {/* Группа проектов */}
            <div className="flex items-start gap-4">
              <label className="w-36 text-sm text-slate-700 mt-2.5 shrink-0">{t('group')}</label>
              <div className="flex-1">
                <ProjectGroupSelect
                  data={groups}
                  value={form.groupId}
                  onChange={(id) => setForm({ ...form, groupId: id })}
                  onCreateNew={(name) => setGroupModal({ open: true, name })}
                  placeholder={t('groupPlaceholder')}
                  createLabel={t('createNewGroup')}
                />
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex items-start gap-4">
              <label className="w-36 text-sm text-slate-700 mt-2.5 shrink-0">{t('comment')}</label>
              <div className="flex-1">
                <TextArea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder={t('commentPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 rounded-b-xl">
            <button
              type="button"
              className="text-primary text-sm font-medium px-3 cursor-pointer disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              {tc('cancel')}
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? (isEdit ? tc('saving') : tc('creating')) : isEdit ? tc('save') : tc('create')}
            </button>
          </div>
        </form>
      </CustomDialog>

      {groupModal.open && (
        <CreateProjectGroupModal
          isOpen
          initialName={groupModal.name}
          elevated
          onClose={() => setGroupModal({ open: false, name: '' })}
          onSubmit={handleGroupCreated}
        />
      )}
    </>
  )
}
