"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className='p-2 cursor-pointer hover:bg-neutral-50 rounded-full transition-colors'>
          <EllipsisVertical size={16} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        {isStatic ? (
          <DropdownMenuItem asChild>
            <button
              className="flex w-full gap-2 items-center p-2 cursor-pointer hover:bg-neutral-100 rounded-md outline-none"
              onClick={handleAddChild}
            >
              <Plus size={16} />
              <span>{t('tooltips.createChild')}</span>
            </button>
          </DropdownMenuItem>
        ) : (
            <>
              {categoriesPermissions.add && <DropdownMenuItem asChild>
              <button
                  className="flex w-full gap-2 items-center p-2 cursor-pointer hover:bg-neutral-100 rounded-md outline-none"
                onClick={handleAddChild}
              >
                  <Plus size={16} />
                  <span className='flex-1 text-left'>{t('tooltips.createChild')}</span>
              </button>
              </DropdownMenuItem>}
              {categoriesPermissions.edit && <DropdownMenuItem asChild>
              <button
                  className="flex w-full gap-2 items-center p-2 cursor-pointer hover:bg-neutral-100 rounded-md outline-none"
                onClick={handleEdit}
              >
                  <Pencil size={16} />
                  <span className='flex-1 text-left'>{t('tooltips.edit')}</span>
              </button>
              </DropdownMenuItem>}
              {categoriesPermissions.delete && <DropdownMenuItem asChild>
              <button
                  className="flex w-full gap-2 items-center p-2 text-red-500 cursor-pointer hover:bg-neutral-100 rounded-md outline-none"
                onClick={handleDelete}
              >
                  <Trash2 size={16} />
                  <span className='flex-1 text-left'>{t('tooltips.delete')}</span>
              </button>
              </DropdownMenuItem>}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
