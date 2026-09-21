"use client"

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { appStore } from '../../../store/app.store'

export default observer(function LegalEntityMenu({ legalEntity, onEdit, onDelete }) {
  const t = useTranslations('Common')
  const legalEntityPermissions = appStore.permission.directories.legalentities

  const handleEdit = () => {
    if (onEdit) onEdit(legalEntity)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(legalEntity)
  }

  if (!legalEntityPermissions.edit && !legalEntityPermissions.delete) {
    return null
  }

  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: handleEdit, hidden: !legalEntityPermissions.edit },
        { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: handleDelete, hidden: !legalEntityPermissions.delete, danger: true },
      ]}
    />
  )
})
