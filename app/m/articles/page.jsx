'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import ArticleFormSheet from '@/components/mobile/forms/ArticleFormSheet'
import { CATEGORY_TYPES, CategoryTypeIcon } from '@/components/directories/CategoryTypes'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { ChevronRight, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Учётные статьи на телефоне.
 *
 * Раздел плана счетов выбирается чипами со значками — теми же, что на
 * большом экране. Внутри раздела статьи показаны деревом: у родительской
 * статьи стрелка, вложенные раскрываются по нажатию. Создание, правка и
 * удаление — здесь же.
 */

/** Ветка дерева статей. */
const ArticleNode = ({ node, depth = 0, onMenu, canManage }) => {
  const [open, setOpen] = useState(depth === 0)
  const children = node?.children || []
  const hasChildren = children.length > 0

  return (
    <>
      <div className="flex items-center border-b border-slate-100 last:border-b-0">
        <button
          type="button"
          onClick={() => hasChildren && setOpen((prev) => !prev)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 py-3.5 text-left',
            hasChildren ? 'active:bg-slate-50' : 'cursor-default'
          )}
          style={{ paddingLeft: depth * 16 }}
        >
          {hasChildren ? (
            <ChevronRight
              size={16}
              aria-hidden="true"
              className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-90')}
            />
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              depth === 0 ? 'text-[15px] font-semibold text-slate-900' : 'text-[14px] text-slate-700'
            )}
          >
            {node.nazvanie}
          </span>
        </button>

        {canManage && !node.static && (
          <button
            type="button"
            onClick={() => onMenu(node)}
            aria-label={node.nazvanie}
            className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {open &&
        children.map((child) => (
          <ArticleNode
            key={child.guid || child.nazvanie}
            node={child}
            depth={depth + 1}
            onMenu={onMenu}
            canManage={canManage}
          />
        ))}
    </>
  )
}

/** Все статьи раздела одним списком — для выбора родителя. */
const flatten = (nodes = [], depth = 0, acc = []) => {
  nodes.forEach((node) => {
    if (node?.guid) acc.push({ value: node.guid, label: `${'— '.repeat(depth)}${node.nazvanie}` })
    flatten(node?.children || [], depth + 1, acc)
  })
  return acc
}

/** Дерево, отфильтрованное по названию: родитель остаётся, если нашёлся потомок. */
const filterTree = (nodes = [], query) => {
  if (!query) return nodes
  return nodes
    .map((node) => {
      const children = filterTree(node?.children || [], query)
      const matches = String(node?.nazvanie || '').toLowerCase().includes(query)
      if (!matches && children.length === 0) return null
      return { ...node, children }
    })
    .filter(Boolean)
}

const SECTION_TIP = {
  income: 'Доходы',
  expense: 'Расходы',
  assets: 'Актив',
  liabilities: 'Обязательства',
  capital: 'Капитал',
}

const MobileArticlesPage = observer(() => {
  const t = useTranslations('Directories.chartOfAccounts')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')
  const tNav = useTranslations('Sidebar')
  const router = useRouter()

  const [section, setSection] = useState('income')
  const [search, setSearch] = useState('')
  const [formFor, setFormFor] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)

  const permissions = appStore.permission?.directories?.transactionCategories || {}
  const { mutateAsync: removeArticle, isPending: deleting } = useUcodeRequestMutation()

  const { data: tree = [], isLoading } = useUcodeRequestQuery({
    method: 'get_chart_of_accounts',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 5 },
  })

  // Раздел плана счетов — корневой узел с этим названием
  const sectionNodes = useMemo(() => {
    const root = tree.find((node) => node?.nazvanie === SECTION_TIP[section])
    return root?.children || []
  }, [tree, section])

  const visible = useMemo(() => filterTree(sectionNodes, search.trim().toLowerCase()), [sectionNodes, search])
  const parentOptions = useMemo(() => flatten(sectionNodes), [sectionNodes])

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={tNav('directories.transactionCategories')}
          onBack={() => router.push('/m/profile')}
          action={
            permissions?.add && (
              <button
                type="button"
                onClick={() => setFormFor({})}
                aria-label={t('createTitle')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            )
          }
        />

        {/* Разделы плана счетов */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {CATEGORY_TYPES.map(({ key }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-[13px] font-semibold',
                section === key ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.1)]' : 'bg-white/60 text-slate-500'
              )}
            >
              <CategoryTypeIcon type={key} size="sm" calm />
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5">
          <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tc('search')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !visible.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !visible.length && <MEmpty icon={Search} title={tm('articles.empty')} />}

        {visible.length > 0 && (
          <MCard list>
            {visible.map((node) => (
              <ArticleNode
                key={node.guid || node.nazvanie}
                node={node}
                onMenu={setMenuFor}
                canManage={permissions?.edit || permissions?.delete}
              />
            ))}
          </MCard>
        )}
      </div>

      {/* Что сделать со статьёй */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.nazvanie}>
        <div className="flex flex-col">
          {permissions?.edit && (
            <button
              type="button"
              onClick={() => {
                setFormFor(menuFor)
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
          {permissions?.delete && (
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

      <ArticleFormSheet
        open={Boolean(formFor)}
        article={formFor?.guid ? formFor : null}
        section={section}
        parentOptions={parentOptions}
        onClose={() => setFormFor(null)}
      />

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={tc('delete')}
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
                await removeArticle({ method: 'delete_chart_of_account', data: { guid: deleteFor.guid } })
                queryClient.invalidateQueries({ queryKey: ['get_chart_of_accounts'] })
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
        <p className="text-sm text-slate-600">{deleteFor?.nazvanie}</p>
      </BottomSheet>
    </div>
  )
})

export default MobileArticlesPage
