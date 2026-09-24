'use client'

import PageHeader from '@/components/shared/PageHeader/PageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useMounted from '@/hooks/useMounted'
import { ChevronDown, FolderPlus, Package, Plus, Wrench } from 'lucide-react'

/**
 * Шапка справочника товаров и услуг: заголовок с количеством позиций и
 * «Создать» — меню из трёх пунктов (товар / услуга / группа). Раньше меню было
 * собрано вручную и закрывалось только повторным кликом по кнопке; фильтры
 * и поиск переехали в панель над таблицей.
 */
const ProductServiceHeader = ({ t, tc, canAdd, count, onCreateSingle, onCreateGroup }) => {
  const isMounted = useMounted()

  return (
    <PageHeader
      className="px-0"
      title={t('pageTitle')}
      search={count != null && <span className="text-sm tabular-nums text-slate-500">{t('itemsCount', { count })}</span>}
      actions={
        isMounted && canAdd ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="primary-btn gap-1.5">
                <Plus size={16} />
                {tc('create')}
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl p-1.5" align="end" sideOffset={6}>
              <DropdownMenuItem
                onClick={() => onCreateSingle('product')}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Package size={15} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-900">{t('createProduct')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onCreateSingle('service')}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Wrench size={15} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-900">{t('createService')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onCreateGroup}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <FolderPlus size={15} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-900">{t('createGroupTitle')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    />
  )
}

export default ProductServiceHeader
