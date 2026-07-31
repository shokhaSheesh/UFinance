'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const Pill = ({ children }) => (
  <span className="inline-flex items-center whitespace-nowrap rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
    {children}
  </span>
)

const HeaderButton = ({ icon, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-9 items-center gap-2 rounded-md border border-gray-200 px-3.5 text-sm text-slate-700 transition-colors hover:bg-gray-50"
  >
    {icon}
    <span className="whitespace-nowrap">{children}</span>
  </button>
)

/**
 * Шапка детальной страницы бюджета: хлебная крошка, название, чипы
 * (тип / период / валюта) и действия.
 */
const BudgetDetailHeader = ({ t, title, pills = [], onExport, onEdit, onDelete, backHref }) => {
  const router = useRouter()

  return (
    <div className="bg-white px-6">
      <div className="border-b border-gray-200 py-3.5">
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="text-xs text-gray-500 transition-colors hover:text-slate-700"
        >
          {t('breadcrumb.list')}
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="truncate text-2xl font-bold text-slate-900">{title}</h1>
          {pills.map((p) => (
            <Pill key={p}>{p}</Pill>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {onExport && (
            <HeaderButton icon={<Download className="h-4 w-4" />} onClick={onExport}>
              {t('downloadXls')}
            </HeaderButton>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-11 items-center justify-center rounded-md border border-gray-200 text-slate-700 transition-colors hover:bg-gray-50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[162px] p-1" align="end">
              <DropdownMenuItem asChild>
                <button
                  className="flex w-full cursor-pointer items-center gap-2 text-sm outline-none"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4" />
                  <span>{t('actions.edit')}</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#ed5564] outline-none"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 text-[#ed5564]" />
                  <span>{t('actions.delete')}</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default BudgetDetailHeader
