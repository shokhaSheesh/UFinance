'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[162px] p-1" align="end">
          {canEdit && (
            <DropdownMenuItem asChild>
              <button
                className="flex w-full cursor-pointer items-center gap-2 text-sm outline-none"
                onClick={stop(onEdit)}
              >
                <Pencil className="h-4 w-4" />
                <span>{editLabel}</span>
              </button>
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem asChild>
              <button
                className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#ed5564] outline-none"
                onClick={stop(onDelete)}
              >
                <Trash2 className="h-4 w-4 text-[#ed5564]" />
                <span>{deleteLabel}</span>
              </button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default BudgetRowMenu
