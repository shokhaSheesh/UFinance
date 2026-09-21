"use client"

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { appStore } from "../../../store/app.store"

export const CategoryMenu = observer(({ category, onEdit, onDelete, onAddChild }) => {
  const t = useTranslations('Common')
  const isStatic = category?.isStatic === true

  const categoriesPermissions = appStore.permission.directories.transactionCategories

  const handleEdit = () => {
    // DropdownMenuItem handles click and close automatically if propagation is not stopped
    if (!category?.guid) {
      console.error('CategoryMenu: category.guid is missing!', category)
    }
    onEdit(category)
  }

  const handleDelete = () => {
    if (!category?.guid) {
      console.error('CategoryMenu: category.guid is missing!', category)
    }
    onDelete(category)
  }

  const handleAddChild = () => {
    if (!category?.guid) {
      console.error('CategoryMenu: category.guid is missing!', category)
    }
    if (onAddChild) {
      onAddChild(category)
    }
  }

  if (!categoriesPermissions.add && !categoriesPermissions.delete && !categoriesPermissions.edit) {
    return null
  }

  if (!categoriesPermissions.add && isStatic) {
    return null
  }

  return (
    <RowActions
      actions={[
        { key: 'add', icon: Plus, label: t('tooltips.createChild'), onClick: handleAddChild, hidden: !isStatic && !categoriesPermissions.add },
        { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: handleEdit, hidden: isStatic || !categoriesPermissions.edit },
        { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: handleDelete, hidden: isStatic || !categoriesPermissions.delete, danger: true },
      ]}
    />
  )
})
