"use client"

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function DeleteCategoryConfirmModal({ isOpen, category, onConfirm, onCancel, isDeleting = false }) {
  const tc = useTranslations('Common')
  const t = useTranslations('Directories.chartOfAccounts')
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title={tc('deleteConfirmTitle')}
      message={t('deleteConfirmMessage', { name: category?.name || '—' })}
    >
      {category && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label="Название:">{category.name || '—'}</ConfirmDetail>
          {category.tip && category.tip.length > 0 && (
            <ConfirmDetail label="Тип:">{category.tip.join(', ')}</ConfirmDetail>
          )}
        </div>
      )}
    </ConfirmDialog>
  )
}
