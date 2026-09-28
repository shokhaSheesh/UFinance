'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Оболочка справочника на телефоне.
 *
 * Все справочники устроены одинаково: заголовок с «плюсом», поиск, список
 * строк и у каждой строки «…» с правкой и удалением. Раньше это
 * повторялось в каждом экране; здесь одно место, а экран передаёт только
 * свои строки и свою форму.
 *
 * @param {(item: any) => React.ReactNode} renderRow  содержимое строки
 */
export default function DirectoryScreen({
  title,
  backHref = '/m/profile',
  search,
  onSearch,
  searchPlaceholder,
  items = [],
  isLoading,
  emptyIcon,
  emptyTitle,
  permissions = {},
  onCreate,
  onEdit,
  onDelete,
  deleteTitle,
  deleteMessage,
  deleting = false,
  renderRow,
  onOpen,
  children,
}) {
  const tc = useTranslations('Common')
  const router = useRouter()

  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)

  const canManage = Boolean((permissions.edit && onEdit) || (permissions.delete && onDelete))

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={title}
          onBack={() => router.push(backHref)}
          action={
            permissions.add &&
            onCreate && (
              <button
                type="button"
                onClick={onCreate}
                aria-label={tc('create')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            )
          }
        />

        {onSearch && (
          <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
            <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={searchPlaceholder || tc('search')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => onSearch('')} className="shrink-0 text-slate-400">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !items.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !items.length && <MEmpty icon={emptyIcon} title={emptyTitle} />}

        {items.length > 0 && (
          <MCard list>
            {items.map((item) => (
              <div key={item.id || item.guid} className="flex items-center border-b border-slate-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onOpen?.(item)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left',
                    onOpen && 'active:bg-slate-50'
                  )}
                >
                  {renderRow(item)}
                </button>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setMenuFor(item)}
                    aria-label={tc('edit')}
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100"
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </MCard>
        )}
      </div>

      {/* Что сделать со строкой */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        <div className="flex flex-col">
          {permissions.edit && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions.delete && onDelete && (
            <button
              type="button"
              onClick={() => {
                setDeleteFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={deleteTitle || tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteFor(null)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await onDelete(deleteFor)
                setDeleteFor(null)
              }}
              disabled={deleting}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{deleteMessage || deleteFor?.name}</p>
      </BottomSheet>
    </div>
  )
}
