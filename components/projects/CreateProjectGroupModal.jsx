'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Модалка «Создать группу проектов». На submit вызывает onSubmit(payload).
 * elevated — когда открыта поверх модалки создания проекта.
 * Монтируется по факту открытия (состояние формы инициализируется лениво).
 */
export default function CreateProjectGroupModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  elevated = false,
}) {
  const t = useTranslations('Projects.createGroupModal')
  const tc = useTranslations('Common')

  const [form, setForm] = useState(() => ({ name: initialName || '', comment: '' }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: t('nameRequired') })
      return
    }
    try {
      setSubmitting(true)
      await onSubmit?.({ name: form.name.trim(), comment: form.comment.trim() || null })
      onClose()
    } catch {
      // уведомление об ошибке показывает мутация
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[560px]" elevated={elevated}>
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
            {submitting ? tc('creating') : tc('create')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}
