"use client"

import { ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteLegalEntityConfirmModal({ isOpen, legalEntity, onConfirm, onCancel, isDeleting }) {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title={t('deleteConfirmTitle')}
      message={t('deleteConfirmMessage', { name: legalEntity?.nazvanie || tc('noName') })}
      confirmLabel={isDeleting ? t('deleting') : tc('delete')}
    >
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('deleteWarning')}</p>
    </ConfirmDialog>
  )
}
