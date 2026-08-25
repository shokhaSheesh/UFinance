"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { Archive, ArchiveRestore, EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="bg-transparent w-full shadow-none cursor-pointer h-full flex items-center justify-center">
          <EllipsisVertical size={18} className='text-neutral-600' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2" align="end">
        {accountPermissions.edit && <DropdownMenuItem asChild>
          <button
            className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
            onClick={handleEdit}
          >
            <Pencil size={16} />
            <span>{t('tooltips.edit')}</span>
          </button>
        </DropdownMenuItem>}
        {accountPermissions.edit && onArchive && <DropdownMenuItem asChild>
          <button
            className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
            onClick={handleArchive}
          >
            {isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            <span>{isArchived ? ta('archiveAction.unarchive') : ta('archiveAction.archive')}</span>
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
