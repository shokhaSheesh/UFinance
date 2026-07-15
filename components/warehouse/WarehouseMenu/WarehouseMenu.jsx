'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function WarehouseMenu({ warehouse, onEdit, onDelete }) {
  const t = useTranslations('Common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="bg-transparent w-full shadow-none cursor-pointer h-full flex items-center justify-center">
          <EllipsisVertical size={18} className="text-neutral-600" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 p-2" align="end">
        <DropdownMenuItem asChild>
          <button
            className={cn('w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none')}
            onClick={() => onEdit?.(warehouse)}
          >
            <Pencil size={16} />
            <span>{t('tooltips.edit')}</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button
            className={cn('w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none')}
            onClick={() => onDelete?.(warehouse)}
          >
            <Trash2 size={16} className="text-red-500" />
            <span>{t('tooltips.delete')}</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
