'use client'

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function WarehouseMenu({ warehouse, onEdit, onDelete, canEdit = true, canDelete = true }) {
  const t = useTranslations('Common')

  // No allowed actions → don't render the row menu at all
  if (!canEdit && !canDelete) return null

  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: () => onEdit?.(warehouse), hidden: !canEdit },
        { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: () => onDelete?.(warehouse), hidden: !canDelete, danger: true },
      ]}
    />
  )
}
