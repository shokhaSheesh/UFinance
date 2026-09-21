'use client'

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Trash2 } from 'lucide-react'

/** Меню строки списка бюджетов: «Редактировать» / «Удалить». */
const BudgetRowMenu = ({ onEdit, onDelete, editLabel, deleteLabel, canEdit = true, canDelete = true }) => {
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn?.()
  }

  // Нет ни одного доступного действия — меню не показываем
  if (!canEdit && !canDelete) return null

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <RowActions
        actions={[
          { key: 'edit', icon: Pencil, label: editLabel, onClick: stop(onEdit), hidden: !(canEdit) },
          { key: 'delete', icon: Trash2, label: deleteLabel, onClick: stop(onDelete), hidden: !(canDelete), danger: true },
        ]}
      />
    </div>
  )
}

export default BudgetRowMenu
