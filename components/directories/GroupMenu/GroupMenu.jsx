"use client"

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function GroupMenu({ group, onEdit, onDelete, onCreateCounterparty }) {
  const t = useTranslations('Common')
  const handleEdit = () => {
    if (onEdit) onEdit(group)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(group)
  }

  const handleCreateCounterparty = () => {
    if (onCreateCounterparty) onCreateCounterparty(group)
  }

  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: t('tooltips.editGroup'), onClick: handleEdit },
        { key: 'add', icon: Plus, label: t('tooltips.createCounterparty'), onClick: handleCreateCounterparty },
        { key: 'delete', icon: Trash2, label: t('tooltips.deleteGroup'), onClick: handleDelete, danger: true },
      ]}
    />
  )
}
