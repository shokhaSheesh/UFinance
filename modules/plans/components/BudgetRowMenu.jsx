'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

/** Меню строки списка бюджетов: «Редактировать» / «Удалить». */
const BudgetRowMenu = ({ onEdit, onDelete, editLabel, deleteLabel }) => {
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn?.()
  }

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
        <DropdownMenuContent className="w-44 p-2" align="end">
          <DropdownMenuItem asChild>
            <button
              className="flex w-full cursor-pointer items-center gap-2 pb-2 text-sm outline-none"
              onClick={stop(onEdit)}
            >
              <Pencil className="h-4 w-4" />
              <span>{editLabel}</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button
              className="flex w-full cursor-pointer items-center gap-2 text-sm text-red-500 outline-none"
              onClick={stop(onDelete)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>{deleteLabel}</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default BudgetRowMenu
