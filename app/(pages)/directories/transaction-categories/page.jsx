'use client'

import { CategoryMenu } from '@/components/directories/CategoryMenu/CategoryMenu'
import CreateChartOfAccountsModal from '@/components/directories/CreateChartOfAccountsModal/CreateChartOfAccountsModal'
import { DeleteCategoryConfirmModal } from '@/components/directories/DeleteCategoryConfirmModal/DeleteCategoryConfirmModal'
import { PageSearchBar } from '@/components/PageSearchbar'
import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'

// Recursively convert API structure to display format
const convertToCategory = (node, level = 0) => {
	const isStatic = node.static === true

	return {
		id: node.guid || `temp-${node.nazvanie}-${level}`,
		guid: node.guid,
		name: node.nazvanie,
		hasMenu: !!node.guid, // Only show menu if item has guid
		hasLock: isStatic,
		isStatic: isStatic,
		children: node.children ? node.children.map(child => convertToCategory(child, level + 1)) : undefined,
		balans: node.balans,
		komentariy: node.komentariy,
		tip: node.tip,
		tip_operatsii: node.tip_operatsii,
		chart_of_accounts_id_2: node.chart_of_accounts_id_2,
		level: level,
	}
}

// Recursive component for rendering category tree
function CategoryTreeItem({
	category,
	level = 0,
	categoryIndex = 0,
	expandedCategories,
	closingCategories,
	selectedCategory,
	onToggleCategory,
	onSelectCategory,
	onEditCategory,
	onDeleteCategory,
	onAddChild,
	isLast = false,
	parentPath = '',
}) {
	const hasChildren = category.children && category.children.length > 0
	const isExpanded = expandedCategories.includes(category.id)
	const isClosing = closingCategories.includes(category.id)
	const isSelected = selectedCategory === category.id

	// Create unique path for this item
	const currentPath = parentPath ? `${parentPath}/${category.id}` : category.id

	return (
		<div
			className={cn(
				level === 0 ? 'mb-2 overflow-visible' : 'mb-2 overflow-visible',
				isLast && level === 0 && 'mb-4',
			)}
		>
			<div
				data-category-card
				className={cn(
					'flex items-center gap-3 p-3 px-4 border border-slate-200 rounded bg-white cursor-pointer transition-all hover:border-slate-300',
					isSelected && 'border-primary bg-slate-50',
					category.isStatic && 'bg-slate-50 border-slate-200 cursor-default hover:bg-slate-50',
				)}
				onClick={e => {
					// Don't trigger if click was on menu container or menu button
					const menuContainer = e.target.closest('[data-menu-container]')
					const menuButton = e.target.closest('button[class*="menuButton"]')
					if (menuContainer || menuButton) {
						e.stopPropagation()
						return
					}
					if (hasChildren) {
						onToggleCategory(category.id)
					} else {
						onSelectCategory(category.id)
					}
				}}
				onMouseDown={e => {
					const menuContainer = e.target.closest('[data-menu-container]')
					const menuButton = e.target.closest('button[class*="menuButton"]')
					if (menuContainer || menuButton) {
						e.stopPropagation()
					}
				}}
				style={
					level === 0
						? {
							animation: `fadeSlideUp 0.3s ease-out ${categoryIndex * 0.06}s backwards`,
						}
						: {
							animation: isClosing
								? `fadeSlideOut 0.15s ease-in ${categoryIndex * 0.03}s backwards`
								: `fadeSlideUp 0.2s ease-out ${categoryIndex * 0.05}s backwards`,
						}
				}
			>
				{hasChildren && (
					<div className="text-slate-400 shrink-0 w-4 h-4 flex items-center justify-center relative">
						<svg
							className="w-4 h-4 absolute"
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2.5'
						>
							<path strokeLinecap='round' strokeLinejoin='round' d='M20 12H4' />
						</svg>
						<svg
							className={cn(
								'w-4 h-4 absolute transition-all duration-300 ease-in-out',
								isExpanded ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
							)}
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2.5'
						>
							<path strokeLinecap='round' strokeLinejoin='round' d='M12 20V4' />
						</svg>
					</div>
				)}

				{!hasChildren && level > 0 && (
					<span className="w-3 inline-block" />
				)}

				<span className={cn('text-[15px] flex-1', category.isStatic ? 'text-slate-400' : 'text-slate-800')}>
					{category.name}
				</span>

				{category.badge && (
					<span className={level === 0 ? 'px-2 py-0.5 text-[11px] font-normal text-slate-400' : 'px-2 py-0.5 text-[11px] bg-slate-400 text-white rounded font-medium'}>
						{category.badge}
					</span>
				)}

				{category.hasLock && (
					<svg
						className="w-[18px] h-[18px] text-slate-400 shrink-0"
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth='2'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
						/>
					</svg>
				)}

				{category.hasMenu && (
					<div data-menu-container className="ml-auto shrink-0">
						<CategoryMenu
							category={category}
							onEdit={onEditCategory}
							onDelete={onDeleteCategory}
							onAddChild={onAddChild}
						/>
					</div>
				)}
			</div>

			{/* Children - recursively render */}
			{hasChildren && (isExpanded || isClosing) && (
				<div
					className={cn(
						'block overflow-visible',
						isClosing ? 'animate-[collapseUp_0.25s_ease-in-out_forwards]' : 'animate-[expandDown_0.3s_ease-out_forwards]'
					)}
				>
					<div className="ml-8 mt-2">
						{category.children.map((child, childIndex) => (
							<CategoryTreeItem
								key={`${currentPath}/${childIndex}/${child.id}`}
								category={child}
								level={level + 1}
								categoryIndex={childIndex}
								expandedCategories={expandedCategories}
								closingCategories={closingCategories}
								selectedCategory={selectedCategory}
								onToggleCategory={onToggleCategory}
								onSelectCategory={onSelectCategory}
								onEditCategory={onEditCategory}
								onDeleteCategory={onDeleteCategory}
								onAddChild={onAddChild}
								isLast={childIndex === category.children.length - 1 && !child.children}
								parentPath={currentPath}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default observer(function TransactionCategoriesPage() {
	const t = useTranslations('TransactionCategories')
	const [activeTab, setActiveTab] = useState('income')
	const [expandedCategories, setExpandedCategories] = useState([])
	const [closingCategories, setClosingCategories] = useState([])
	const [selectedCategory, setSelectedCategory] = useState(null)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [categoryToEdit, setCategoryToEdit] = useState(null)
	const [isEditMode, setIsEditMode] = useState(false)
	const [categoryToDelete, setCategoryToDelete] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const contentRef = useRef(null);

	// get_chart_of_accounts
	const { data: chartOfAccountsData, isLoading: isLoadingChartOfAccounts, error: chartOfAccountsError } = useQuery({
		queryKey: ['get_chart_of_accounts'],
		queryFn: () => apiClient.invokeFunction({
			method: 'get_chart_of_accounts', data: {
				page: 1,
				limit: 100,
				search: searchQuery.trim() || undefined,
			}
		}),
		placeholderData: keepPreviousData,
		select: (response) => response?.data?.data
	})

	const isLoadingChartOfAccountsV2 = isLoadingChartOfAccounts
	const chartOfAccountsErrorV2 = chartOfAccountsError

	const chartOfAccountsTree = chartOfAccountsData || []

	const categoriesPermissions = appStore.permission.directories.transactionCategories


	// Hardcoded mapping for API filtering (API returns Russian names)
	const TAB_TO_API_NAME = {
		income: 'Доходы',
		expense: 'Расходы',
		assets: 'Актив',
		liabilities: 'Обязательства',
		capital: 'Капитал',
	}

	const categories = (() => {
		if (!Array.isArray(chartOfAccountsTree) || chartOfAccountsTree.length === 0) {
			return []
		}

		const rootName = TAB_TO_API_NAME[activeTab]
		if (!rootName) return []

		// Find the root node for this tab (e.g., "Доходы", "Расходы")
		const rootNode = chartOfAccountsTree.find(node => node.nazvanie === rootName)
		if (!rootNode || !rootNode.children) {
			return []
		}

		// Return children of root node (hide root itself as per documentation)
		return rootNode.children.map(child => convertToCategory(child, 0))
	})()

	const deleteMutation = useMutation({
		mutationKey: ['delete_chartofaccount'],
		mutationFn: (data) => apiClient.invokeFunction({ method: "delete_chart_of_account", data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsV2'] })
		},
		onError: (err) => {
			console.log('eror', err)
			// showErrorNotification(err?.data?.error)
		}
	})

	const toggleCategory = useCallback(
		id => {
			if (expandedCategories.includes(id)) {
				// Find all children that are also expanded
				const findAllChildren = parentId => {
					const children = []
					const parent = categories.find(c => c.id === parentId)
					if (parent?.children) {
						parent.children.forEach(child => {
							if (expandedCategories.includes(child.id)) {
								children.push(child.id)
								if (child.children) {
									children.push(...findAllChildren(child.id))
								}
							}
						})
					}
					return children
				}

				const allToClose = [id, ...findAllChildren(id)]

				// Start closing animation for parent and all children
				setClosingCategories(prev => [...prev, ...allToClose])
				setTimeout(() => {
					setExpandedCategories(prev => prev.filter(cid => !allToClose.includes(cid)))
					setClosingCategories(prev => prev.filter(cid => !allToClose.includes(cid)))
				}, 250) // Match animation duration (0.25s)
			} else {
				setExpandedCategories(prev => [...prev, id])
			}
		},
		[expandedCategories, categories],
	)

	const tabs = [
		{ key: 'income', label: t('tabs.income'), name: 'Доходы' },
		{ key: 'expense', label: t('tabs.expense'), name: "Расходы" },
		{ key: 'assets', label: t('tabs.assets'), name: "Актив" },
		{ key: 'liabilities', label: t('tabs.liabilities'), name: "Обязательства" },
		{ key: 'capital', label: t('tabs.capital'), name: "Капитал" },
	]

	const handleTabChange = tabKey => {
		setActiveTab(tabKey)
		setExpandedCategories([])
		setClosingCategories([])
		setSelectedCategory(null)
		setSearchQuery('') // Clear search when changing tabs
	}

	return (
		<div className="flex overflow-y-auto flex-col bg-slate-50  fixed left-[80px] top-[60px] w-[calc(100%-80px)] h-[calc(100%-60px)]">

			{/* Header */}
			<div className="bg-white h-[120px] border-b sticky top-0 z-50 border-gray-200 p-4 px-6 shrink-0">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-semibold text-slate-900">{t('pageTitle')}</h1>
						{categoriesPermissions.add && <button onClick={() => setIsCreateModalOpen(true)} className="primary-btn px-5 py-2 text-sm font-medium">
							{t('create')}
						</button>}
					</div>
					<div className="relative">
						{/* <Input
							leftIcon={<Search size={16} />}
							value={searchQuery}
							className='bg-white w-64'
							placeholder={t('searchPlaceholder')}
							onChange={(e) => setSearchQuery(e.target.value)}
						/> */}
						<PageSearchBar
							contentRef={contentRef}
							placeholder="Прочие"
						/>
					</div>
				</div>

				<div className="flex items-center">
					{tabs.map((tab, index) => (
						<button
							key={tab.key}
							onClick={() => handleTabChange(tab.key)}
							className={cn(
								"px-4 py-2 text-xs border bg-white transition-colors",
								index === 0 && "rounded-l",
								index === tabs.length - 1 && "rounded-r -ml-px",
								index > 0 && "-ml-px",
								activeTab === tab.key ? "text-primary border-primary z-10" : "text-slate-600 border-gray-300 hover:text-slate-900",
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
				<div className=" w-1/2 h-full stiky top-[120px] bg-white border-r border-gray-200 p-4 pb-6 " key={activeTab}>
					{isLoadingChartOfAccountsV2 && (
						<div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}...</div>
					)}
					{chartOfAccountsErrorV2 && (
						<div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
							{t('error')}: {chartOfAccountsErrorV2.message || t('errorLoading')}
						</div>
					)}
					{!isLoadingChartOfAccountsV2 &&
						!chartOfAccountsErrorV2 &&
						categories.length === 0 && (
							<div className="p-8 text-center bg-gray-100 text-slate-400 pointer-events-none select-none rounded-md my-4">
							{searchQuery ? t('noResults') : t('noData')}
							</div>
						)}
					{categories.map((category, categoryIndex) => (
						<CategoryTreeItem
							key={`${activeTab}/${categoryIndex}/${category.id}`}
							category={category}
							level={0}
							categoryIndex={categoryIndex}
							expandedCategories={expandedCategories}
							closingCategories={closingCategories}
							selectedCategory={selectedCategory}
							onToggleCategory={toggleCategory}
							onSelectCategory={setSelectedCategory}
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
							isLast={categoryIndex === categories.length - 1}
							parentPath={activeTab}
						/>
					))}
				</div>

				{/* Right Content - Cards */}
				<div className="w-1/2 px-6 pt-6 mx-auto">
					<p className="text-sm text-slate-500 mb-6 text-center">
						{t('info.title')}
					</p>

					<div className="flex gap-4">
						{/* Left Column - 2 cards vertically */}
						<div className="flex-1">
							<div className="flex flex-col gap-4">
								{/* Cash Flow */}
								<div className="bg-white rounded-lg border border-primary p-4">
									<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.cashFlow.title')}</h3>

									<div className="flex flex-col gap-3">
										<div className="flex flex-col">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">{t('reports.cashFlow.operational')}</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">{t('reports.cashFlow.receipts')}</div>
												<div className="text-sm text-slate-700">{t('reports.cashFlow.payments')}</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">{t('reports.cashFlow.investment')}</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">{t('reports.cashFlow.receipts')}</div>
												<div className="text-sm text-slate-700">{t('reports.cashFlow.payments')}</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">{t('reports.cashFlow.financial')}</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">{t('reports.cashFlow.receipts')}</div>
												<div className="text-sm text-slate-700">{t('reports.cashFlow.payments')}</div>
											</div>
										</div>

										<div className="flex flex-col pt-3 border-t border-gray-300">
											<div className="text-[15px] font-bold text-slate-900">{t('reports.cashFlow.total')}</div>
										</div>
									</div>
								</div>

								{/* P&L */}
								<div className="bg-white rounded-lg border border-primary p-4">
									<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.pAndL.title')}</h3>

									<div className="flex flex-col gap-3">
										<div className="flex flex-col">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
												<span>{t('reports.pAndL.income')}</span>
												<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
											</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.goodsSales')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.services')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.other')}</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="text-xs text-red-500">{t('reports.pAndL.minus')}</span>
													<span>{t('reports.pAndL.expenses')}</span>
												</div>
												<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
											</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">{t('reports.pAndL.expenseItems.productionStaff')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.expenseItems.goodsPurchase')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.expenseItems.adminStaff')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.expenseItems.rent')}</div>
												<div className="text-sm text-slate-700">{t('reports.pAndL.expenseItems.other')}</div>
												<div className="text-sm text-slate-700 ml-4">
													{t('reports.pAndL.expenseItems.bankServices')}
												</div>
												<div
													className="text-sm text-slate-700 ml-4 flex items-center gap-2"
												>
													<span className="px-2 py-0.5 text-[10px] bg-slate-400 text-white rounded">{t('reports.pAndL.expenseItems.soon')}</span>
													<span>{t('reports.pAndL.expenseItems.exchangeDiff')}</span>
												</div>
												<div className="text-sm text-slate-700 ml-4">
													{t('reports.pAndL.expenseItems.depreciation')}
												</div>
												<div className="text-sm text-slate-700 ml-4">
													{t('reports.pAndL.expenseItems.interest')}
												</div>
												<div className="text-sm text-slate-700 ml-4">
													{t('reports.pAndL.expenseItems.incomeTax')}
												</div>
											</div>
										</div>

										<div className="flex flex-col pt-3 border-t border-gray-300">
											<div className="text-[15px] font-bold text-slate-900">{t('reports.pAndL.undistributedProfit')}</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column - 1 big card */}
						<div className="flex-1 pb-10">
							{/* Balance */}
							<div className="bg-white rounded-lg border border-primary p-4 h-full">
								<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.balance.title')}</h3>

								<div className="flex flex-col gap-3">
									<div className="flex flex-col">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<span>{t('reports.balance.currentAssets.title')}</span>
											<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">{t('reports.balance.currentAssets.receivables')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.currentAssets.cash')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.currentAssets.inventory')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.currentAssets.other')}</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.currentAssets.advancePayments')}
											</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.currentAssets.loansShort')}
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>{t('reports.balance.nonCurrentAssets.title')}</span>
												<span className="px-2 py-0.5 text-[11px] bg-slate-600 text-white rounded font-medium">{t('reports.balance.nonCurrentAssets.and')}</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">{t('reports.balance.nonCurrentAssets.fixedAssets')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.nonCurrentAssets.equipment')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.nonCurrentAssets.transport')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.nonCurrentAssets.other')}</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.nonCurrentAssets.loansLong')}
											</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.nonCurrentAssets.financialInvestments')}
											</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.nonCurrentAssets.intangible')}
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalAssets')}</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<span>{t('reports.balance.currentLiabilities.title')}</span>
											<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">{t('reports.balance.currentLiabilities.payables')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.currentLiabilities.other')}</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.currentLiabilities.thirdParty')}
											</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.currentLiabilities.loansShort')}
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>{t('reports.balance.longTermLiabilities.title')}</span>
												<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">{t('reports.balance.longTermLiabilities.fin')}</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">{t('reports.balance.longTermLiabilities.credits')}</div>
											<div className="text-sm text-slate-700">{t('reports.balance.longTermLiabilities.other')}</div>
											<div className="text-sm text-slate-700 ml-4">
												{t('reports.balance.longTermLiabilities.loansLong')}
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalLiabilities')}</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>{t('reports.balance.capital.title')}</span>
												<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">{t('reports.balance.capital.fin')}</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">{t('reports.balance.capital.founderInvestments')}</div>
											<div className="text-sm text-slate-700 flex items-center gap-2">
												<span className="text-xs text-green-500">{t('reports.balance.capital.plus')}</span>
												<span>{t('reports.balance.capital.undistributedProfit')}</span>
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalCapital')}</div>
									</div>

									<div className="flex flex-col pt-3 border-t-2 border-slate-900">
										<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.balanceEquation')}</div>
									</div>
								</div>
							</div>

						</div>

					</div>
				</div>
			</div>

			{/* Create / Edit Modal */}
			<CreateChartOfAccountsModal
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false)
					setCategoryToEdit(null)
					setIsEditMode(false)
				}}
				initialTab={activeTab}
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
							await deleteMutation.mutateAsync({ guid: categoryToDelete.guid })
							setIsDeleteModalOpen(false)
							setCategoryToDelete(null)
							queryClient.invalidateQueries({ queryKey: ['get_chart_of_accounts'] })
						} catch (error) {
							// Close modal first
							setIsDeleteModalOpen(false)
							setCategoryToDelete(null)

							// Extract error message from API response
							let errorMessage = t('deleteError')
							if (error.data?.error) {
								errorMessage = error.data?.error
							} else if (error.message) {
								errorMessage = error.message
							}

							// Show error notification at top center
							showErrorNotification(errorMessage, { position: 'top-center' })
						}
					}
				}}
				onCancel={() => {
					setIsDeleteModalOpen(false)
					setCategoryToDelete(null)
				}}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	)
})
