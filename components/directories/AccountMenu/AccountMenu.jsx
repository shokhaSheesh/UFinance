"use client"

import RowActions from '@/components/shared/RowActions/RowActions'
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { appStore } from '../../../store/app.store'

export const AccountMenu = observer(({ account, onEdit, onDelete, onArchive }) => {
  const t = useTranslations('Common')
  const ta = useTranslations('Directories.account')
  const accountPermissions = appStore.permission.directories.accounts
  const isArchived = Boolean(account?.is_archived)

  const handleEdit = () => {
    if (onEdit) onEdit(account)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(account)
  }

  const handleArchive = () => {
    if (onArchive) onArchive(account)
  }

  if (!accountPermissions.edit && !accountPermissions.delete) {
    return null
  }

  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: handleEdit, hidden: !accountPermissions.edit },
        { key: 'archive', icon: isArchived ? ArchiveRestore : Archive, label: isArchived ? ta('archiveAction.unarchive') : ta('archiveAction.archive'), onClick: handleArchive, hidden: !(accountPermissions.edit && onArchive) },
        { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: handleDelete, hidden: !accountPermissions.delete, danger: true },
      ]}
    />
  )
})
