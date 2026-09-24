'use client'

import CreateChartOfAccountsModal from '@/components/directories/CreateChartOfAccountsModal/CreateChartOfAccountsModal'
import { DeleteCategoryConfirmModal } from '@/components/directories/DeleteCategoryConfirmModal/DeleteCategoryConfirmModal'
import { PageSearchBar } from '@/components/PageSearchbar'
import FixedContent from '@/layouts/FixedContent'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { ListTree, Plus } from 'lucide-react'
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
	const contentRef = useRef(null)

	const data = useCategoriesData(searchQuery)

	const tabs = [
		{ key: 'income', label: t('tabs.income') },
		{ key: 'expense', label: t('tabs.expense') },
		{ key: 'assets', label: t('tabs.assets') },
		{ key: 'liabilities', label: t('tabs.liabilities') },
		{ key: 'capital', label: t('tabs.capital') },
	]

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
						{data.categoriesPermissions.add && (
							<button onClick={() => setIsCreateModalOpen(true)} className="primary-btn gap-1.5">
								<Plus size={16} />
								{t('create')}
							</button>
						)}
					</div>
				</div>

				{/* Вкладки — подчёркиванием, как на других страницах (раньше — серые кнопки в ряд) */}
				<div className="flex items-center gap-1 overflow-x-auto" role="tablist">
					{tabs.map((tab) => {
						const active = data.activeTab === tab.key
						return (
							<button
								key={tab.key}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => { data.handleTabChange(tab.key); setSearchQuery('') }}
								className={cn(
									'-mb-px flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium cursor-pointer transition-colors',
									'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0e73f6]',
									active ? 'border-[#0e73f6] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900',
								)}
							>
								{tab.label}
							</button>
						)
					})}
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
				}}
				initialTab={data.activeTab}
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
