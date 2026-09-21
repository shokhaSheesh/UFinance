"use client"

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { appStore } from '../../../store/app.store'

export const CounterpartyMenu = observer(({ counterparty, onEdit, onDelete }) => {
  const t = useTranslations('Common')
  const directoryPermissions = appStore.permission.directories
  const canEdit = directoryPermissions.counterparties.edit
  const canDelete = directoryPermissions.counterparties.delete
  const handleEdit = () => {
    if (onEdit) onEdit(counterparty)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(counterparty)
  }

  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: handleEdit, hidden: !canEdit },
        { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: handleDelete, hidden: !canDelete, danger: true },
      ]}
    />
  )
})

