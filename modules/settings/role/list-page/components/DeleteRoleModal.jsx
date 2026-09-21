'use client'

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteRoleModal({ open, onClose, onConfirm, role, loading }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      icon={Trash2}
      title={tc('delete')}
      message={tr('delete.confirm') || 'Вы уверены, что хотите удалить роль?'}
      cancelLabel={tc('cancel')}
      confirmLabel={tc('delete')}
    >
      {role && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label={`${tr('name')}:`}>{role?.name || '—'}</ConfirmDetail>
          {role?.description && <ConfirmDetail label={`${tr('description')}:`}>{role.description}</ConfirmDetail>}
        </div>
      )}
    </ConfirmDialog>
  )
}
