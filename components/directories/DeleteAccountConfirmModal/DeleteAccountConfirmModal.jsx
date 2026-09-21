"use client"

import { ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function DeleteAccountConfirmModal({ isOpen, account, onConfirm, onCancel, isDeleting = false }) {
  const tc = useTranslations('Common')
  const t = useTranslations('Directories.account')
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title={tc('deleteConfirmTitle')}
      message={t('deleteConfirmMessage', { name: account?.nazvanie || '—' })}
    />
  )
}
