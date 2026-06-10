'use client'

import CreateChartOfAccountsModal from '@/components/directories/CreateChartOfAccountsModal/CreateChartOfAccountsModal'
import { DeleteCategoryConfirmModal } from '@/components/directories/DeleteCategoryConfirmModal/DeleteCategoryConfirmModal'
import { PageSearchBar } from '@/components/PageSearchbar'
import FixedContent from '@/layouts/FixedContent'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
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
		<FixedContent className="flex overflow-y-auto flex-col bg-slate-50">

			{/* Header */}
			<div className="bg-white h-[120px] border-b sticky top-0 z-50 border-gray-200 p-4 px-6 shrink-0">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-semibold text-slate-900">{t('pageTitle')}</h1>
						{data.categoriesPermissions.add && (
							<button onClick={() => setIsCreateModalOpen(true)} className="primary-btn px-5 py-2 text-sm font-medium">
								{t('create')}
							</button>
						)}
					</div>
					<div className="relative">
						<PageSearchBar
							contentRef={contentRef}
							placeholder={tc('search')}
						/>
					</div>
				</div>

				<div className="flex items-center">
					{tabs.map((tab, index) => (
						<button
							key={tab.key}
							onClick={() => { data.handleTabChange(tab.key); setSearchQuery('') }}
							className={cn(
								"px-4 py-2 text-xs border bg-white transition-colors",
								index === 0 && "rounded-l",
								index === tabs.length - 1 && "rounded-r -ml-px",
								index > 0 && "-ml-px",
								data.activeTab === tab.key ? "text-primary border-primary z-10" : "text-slate-600 border-gray-300 hover:text-slate-900",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div ref={contentRef} className="flex-1 flex">
				{/* Left Sidebar - Category Tree */}
				<div className=" w-1/2 h-full stiky top-[120px] bg-white border-r border-gray-200 p-4 pb-6 " key={data.activeTab}>
					{data.isLoading && (
						<div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}...</div>
					)}
					{data.error && (
						<div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
							{t('error')}: {data.error?.message || t('errorLoading')}
						</div>
					)}
					{!data.isLoading &&
						!data.error &&
						data.categories.length === 0 && (
							<div className="p-8 text-center bg-gray-100 text-slate-400 pointer-events-none select-none rounded-md my-4">
								{searchQuery ? t('noResults') : t('noData')}
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

				{/* Right Content - Cards */}
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
