'use client'

import { CATEGORY_TYPES, CategoryTypeIcon, CategoryTypeTabs } from '@/components/directories/CategoryTypes'
import CreateChartOfAccountsModal from '@/components/directories/CreateChartOfAccountsModal/CreateChartOfAccountsModal'
import { DeleteCategoryConfirmModal } from '@/components/directories/DeleteCategoryConfirmModal/DeleteCategoryConfirmModal'
import { PageSearchBar } from '@/components/PageSearchbar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useMounted from '@/hooks/useMounted'
import FixedContent from '@/layouts/FixedContent'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification } from '@/lib/utils/notifications'
import { ChevronDown, ListTree, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import CategoryTreeItem from '../components/CategoryTreeItem'
import ReportsInfoPanel from '../components/ReportsInfoPanel'
import { useCategoriesData } from '../hooks/useCategoriesData'

const TransactionCategoriesListPage = observer(() => {
	const t = useTranslations('TransactionCategories')
	const tc = useTranslations('Common')
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [categoryToEdit, setCategoryToEdit] = useState(null)
	const [isEditMode, setIsEditMode] = useState(false)
	const [categoryToDelete, setCategoryToDelete] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	// Раздел, выбранный в меню «Создать»: статью можно завести не только в том
	// разделе, который сейчас открыт
	const [createTab, setCreateTab] = useState(null)
	const contentRef = useRef(null)
	const isMounted = useMounted()

	const data = useCategoriesData(searchQuery)

	return (
		<FixedContent className="flex flex-col overflow-y-auto bg-canvas">
			{/* Шапка: заголовок, создание и поиск; ниже — вкладки разделов учёта */}
			<div className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white px-6">
				<div className="flex h-16 items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-semibold text-slate-900">{t('pageTitle')}</h1>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-[280px]">
							<PageSearchBar contentRef={contentRef} placeholder={tc('search')} />
						</div>
						{/* «Создать» сразу спрашивает раздел: доход, расход, актив,
						    обязательство или капитал — как выбор типа операции */}
						{isMounted && data.categoriesPermissions.add && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button type="button" className="primary-btn gap-1.5">
										<Plus size={16} />
										{t('create')}
										<ChevronDown size={16} />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-60 rounded-xl p-1.5" align="end" sideOffset={6}>
									{CATEGORY_TYPES.map(({ key }) => (
										<DropdownMenuItem
											key={key}
											onClick={() => {
												setCreateTab(key)
												setCategoryToEdit(null)
												setIsEditMode(false)
												setIsCreateModalOpen(true)
											}}
											className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
										>
											<CategoryTypeIcon type={key} size="sm" />
											<span className="text-sm font-medium text-slate-900">{t(`createType.${key}`)}</span>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Разделы учёта — значок в цвете раздела и название, как типы
				    операций: раньше это были одинаковые подчёркнутые надписи */}
				<div className="pb-3">
					<CategoryTypeTabs
						value={data.activeTab}
						onChange={(key) => { data.handleTabChange(key); setSearchQuery('') }}
						label={(key) => t(`tabs.${key}`)}
						ariaLabel={t('pageTitle')}
						className="max-w-full overflow-x-auto"
					/>
				</div>
			</div>

			{/* Содержимое: дерево статей и подсказка, как они попадают в отчёты */}
			<div ref={contentRef} className="flex flex-1 gap-4 p-6">
				<div className="w-1/2 rounded-xl border border-slate-200 bg-white p-4" key={data.activeTab}>
					{data.isLoading && (
						<div className="py-8 text-center text-sm text-slate-400">{t('loading')}...</div>
					)}
					{data.error && (
						<div className="py-8 text-center text-sm text-red-600">
							{t('error')}: {data.error?.message || t('errorLoading')}
						</div>
					)}
					{!data.isLoading && !data.error && data.categories.length === 0 && (
						<div className="flex flex-col items-center gap-2 py-16 text-center">
							<span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
								<ListTree size={22} aria-hidden="true" />
							</span>
							<span className="text-sm text-slate-500">{searchQuery ? t('noResults') : t('noData')}</span>
						</div>
					)}
					{data.categories.map((category, categoryIndex) => (
						<CategoryTreeItem
							key={`${data.activeTab}/${categoryIndex}/${category?.id}`}
							category={category}
							level={0}
							categoryIndex={categoryIndex}
							expandedCategories={data.expandedCategories}
							closingCategories={data.closingCategories}
							selectedCategory={data.selectedCategory}
							onToggleCategory={data.toggleCategory}
							onSelectCategory={data.setSelectedCategory}
							onEditCategory={cat => {
								setCategoryToEdit(cat)
								setIsEditMode(true)
								setIsCreateModalOpen(true)
							}}
							onDeleteCategory={cat => {
								setCategoryToDelete(cat)
								setIsDeleteModalOpen(true)
							}}
							onAddChild={cat => {
								setCategoryToEdit(cat)
								setIsEditMode(false)
								setIsCreateModalOpen(true)
							}}
							isLast={categoryIndex === data.categories.length - 1}
							parentPath={data.activeTab}
						/>
					))}
				</div>

				<ReportsInfoPanel t={t} />
			</div>

			{/* Create / Edit Modal */}
			<CreateChartOfAccountsModal
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false)
					setCategoryToEdit(null)
					setIsEditMode(false)
					setCreateTab(null)
				}}
				initialTab={createTab ?? data.activeTab}
				parentCategory={!isEditMode ? categoryToEdit : null}
				category={isEditMode ? categoryToEdit : null}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteCategoryConfirmModal
				isOpen={isDeleteModalOpen}
				category={categoryToDelete}
				onConfirm={async () => {
					if (categoryToDelete?.guid) {
						try {
							await data.deleteMutation.mutateAsync({ guid: categoryToDelete.guid })
							setIsDeleteModalOpen(false)
							setCategoryToDelete(null)
							queryClient.invalidateQueries({ queryKey: ['get_chart_of_accounts'] })
						} catch (error) {
							setIsDeleteModalOpen(false)
							setCategoryToDelete(null)

							let errorMessage = t('deleteError')
							if (error?.data?.error) {
								errorMessage = error.data.error
							} else if (error?.message) {
								errorMessage = error.message
							}

							showErrorNotification(errorMessage, { position: 'top-center' })
						}
					}
				}}
				onCancel={() => {
					setIsDeleteModalOpen(false)
					setCategoryToDelete(null)
				}}
				isDeleting={data.deleteMutation.isPending}
			/>
		</FixedContent>
	)
})

export default TransactionCategoriesListPage
