'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
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
      <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[620px]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <DialogHeader title={t('title')} onClose={onClose} />
          <DialogBody className="flex flex-col gap-5">
            <FormRow label={t('name')} required error={errors.name}>
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
            </FormRow>
            <FormRow label={t('group')}>
              <ProjectGroupSelect
                data={groups}
                value={form.groupId}
                onChange={(id) => setForm({ ...form, groupId: id })}
                onCreateNew={(name) => setGroupModal({ open: true, name })}
                placeholder={t('groupPlaceholder')}
                createLabel={t('createNewGroup')}
              />
            </FormRow>
            <FormRow label={t('comment')} align="start">
              <TextArea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder={t('commentPlaceholder')}
                rows={3}
              />
            </FormRow>
          </DialogBody>
          <DialogFooter>
            <button type="button" className="secondary-btn h-9" onClick={onClose} disabled={submitting}>
              {tc('cancel')}
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? (isEdit ? tc('saving') : tc('creating')) : isEdit ? tc('save') : tc('create')}
            </button>
          </DialogFooter>
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
