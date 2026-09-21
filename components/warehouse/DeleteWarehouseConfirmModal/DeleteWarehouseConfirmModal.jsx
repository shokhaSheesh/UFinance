'use client'

import { ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteWarehouseConfirmModal({ isOpen, warehouse, onConfirm, onCancel, isDeleting }) {
  const t = useTranslations('Warehouse.deleteModal')
  const tc = useTranslations('Common')
  return (
    <ConfirmDialog
      open={isOpen}
      // пока идёт удаление, окно не закрывается
      onClose={isDeleting ? () => {} : onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title={t('title')}
      message={t('message', { name: warehouse?.name || tc('noName') })}
      confirmLabel={isDeleting ? t('deleting') : tc('delete')}
    />
  )
}
