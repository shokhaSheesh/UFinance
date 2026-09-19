"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import { cn } from '@/lib/utils'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <RowActionsTrigger />
        </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 p-2" align="end">
        {legalEntityPermissions.edit && <DropdownMenuItem asChild>
          <button
            className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
            onClick={handleEdit}
          >
            <Pencil size={16} />
            <span>{t('tooltips.edit')}</span>
          </button>
        </DropdownMenuItem>}
        {legalEntityPermissions.delete && <DropdownMenuItem asChild>
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
