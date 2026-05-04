"use client"

import { cn } from '@/app/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { appStore } from '../../../store/app.store'

export const AccountMenu = observer(({ account, onEdit, onDelete }) => {
  const t = useTranslations('Common')
  const accountPermissions = appStore.permission.directories.accounts

  const handleEdit = () => {
    if (onEdit) onEdit(account)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(account)
  }

  if (!accountPermissions.edit && !accountPermissions.delete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="bg-transparent w-full shadow-none cursor-pointer h-full flex items-center justify-center">
          <EllipsisVertical size={18} className='text-neutral-600' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 p-2" align="end">
        {accountPermissions.edit && <DropdownMenuItem asChild>
          <button
            className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
            onClick={handleEdit}
          >
            <Pencil size={16} />
            <span>{t('tooltips.edit')}</span>
          </button>
        </DropdownMenuItem>}
        {accountPermissions.delete && <DropdownMenuItem asChild>
          <button
            className={cn("w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none")}
            onClick={handleDelete}
          >
            <Trash2 size={16} className='text-red-500' />
            <span>{t('tooltips.delete')}</span>
          </button>
        </DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
