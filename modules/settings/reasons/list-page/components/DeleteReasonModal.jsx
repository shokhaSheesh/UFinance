'use client'

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteReasonModal({ open, onClose, onConfirm, reason, loading }) {
  const tr = useTranslations('Settings.reasons')
  const tc = useTranslations('Settings.common')
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      icon={Trash2}
      title={tc('delete')}
      message={tr('delete.confirm')}
      cancelLabel={tc('cancel')}
      confirmLabel={tc('delete')}
    >
      {reason && <ConfirmDetail label={`${tr('description')}:`}>{reason?.description || '—'}</ConfirmDetail>}
    </ConfirmDialog>
  )
}
