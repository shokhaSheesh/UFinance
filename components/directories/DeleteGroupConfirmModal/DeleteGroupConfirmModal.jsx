"use client"

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Открывается поверх окна контрагента — поэтому elevated
export function DeleteGroupConfirmModal({ isOpen, group, onConfirm, onCancel, isDeleting = false }) {
  const t = useTranslations('Directories.counterparty')
  const tc = useTranslations('Common')
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      elevated
      icon={Trash2}
      title={t('deleteConfirmTitle')}
      message={t('deleteConfirmMessage')}
      confirmLabel={isDeleting ? tc('deleting') : tc('delete')}
    >
      {group && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label={t('groupNameLabel')}>{group.nazvanie_gruppy || '—'}</ConfirmDetail>
          {group.opisanie_gruppy && (
            <ConfirmDetail label={t('groupDescriptionLabel')}>{group.opisanie_gruppy}</ConfirmDetail>
          )}
        </div>
      )}
    </ConfirmDialog>
  )
}
