"use client"

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function DeleteConfirmModal({ isOpen, operation, onConfirm, onCancel, isDeleting = false }) {
  const t = useTranslations('Operations')
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title={t('deleteModal.title')}
      message={t('deleteModal.confirmation')}
      cancelLabel={t('deleteModal.cancel')}
      confirmLabel={t('deleteModal.delete')}
    >
      {operation && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label={t('deleteModal.description')}>{operation.opisanie || '—'}</ConfirmDetail>
          <ConfirmDetail label={t('deleteModal.amount')}>{operation.summa || '—'}</ConfirmDetail>
          <ConfirmDetail label={t('deleteModal.date')}>{operation.operationDate || '—'}</ConfirmDetail>
        </div>
      )}
    </ConfirmDialog>
  )
}
