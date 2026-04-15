'use client'

import { cn } from '@/app/lib/utils'
import { CategoryMenu } from '@/components/directories/CategoryMenu/CategoryMenu'
import CreateChartOfAccountsModal from '@/components/directories/CreateChartOfAccountsModal/CreateChartOfAccountsModal'
import { DeleteCategoryConfirmModal } from '@/components/directories/DeleteCategoryConfirmModal/DeleteCategoryConfirmModal'
import { useDeleteChartOfAccounts } from '@/hooks/useDashboard'
import { showErrorNotification } from '@/lib/utils/notifications'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import Input from '../../../../components/shared/Input'
import { apiClient } from '../../../../lib/api/ucode/base'
import { appStore } from '../../../../store/app.store'

// Map tab keys to root category names from API
const TABS_TO_ROOT_NAME = {
	income: 'Доходы',
	expense: 'Расходы',
	assets: 'Актив',
	liabilities: 'Обязательства',
	capital: 'Капитал',
}

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


	const categories = (() => {
		if (!Array.isArray(chartOfAccountsTree) || chartOfAccountsTree.length === 0) {
			return []
		}

		const rootName = TABS_TO_ROOT_NAME[activeTab]
		if (!rootName) return []

		// Find the root node for this tab (e.g., "Доходы", "Расходы")
		const rootNode = chartOfAccountsTree.find(node => node.nazvanie === rootName)
		if (!rootNode || !rootNode.children) {
			return []
		}

		// Return children of root node (hide root itself as per documentation)
		return rootNode.children.map(child => convertToCategory(child, 0))
	})()

	const deleteMutation = useDeleteChartOfAccounts()

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
		{ key: 'income', label: 'Доходы' },
		{ key: 'expense', label: 'Расходы' },
		{ key: 'assets', label: 'Актив' },
		{ key: 'liabilities', label: 'Обязательства' },
		{ key: 'capital', label: 'Капитал' },
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
						<h1 className="text-xl font-semibold text-slate-900">Учетные статьи</h1>
						{categoriesPermissions.add && <button onClick={() => setIsCreateModalOpen(true)} className="primary-btn px-5 py-2 text-sm font-medium">
							Создать
						</button>}
					</div>
					<div className="relative">
						<Input
							leftIcon={<Search size={16} />}
							value={searchQuery}
							className='bg-white w-64'
							placeholder='Поиск по названию'
							onChange={(e) => setSearchQuery(e.target.value)}
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
			<div className="flex-1 flex">
				{/* Left Sidebar - Category Tree */}
				<div className=" w-1/2 h-full stiky top-[120px] bg-white border-r border-gray-200 p-4 pb-6 " key={activeTab}>
					{isLoadingChartOfAccountsV2 && (
						<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
					)}
					{chartOfAccountsErrorV2 && (
						<div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
							Ошибка: {chartOfAccountsErrorV2.message || 'Не удалось загрузить данные'}
						</div>
					)}
					{!isLoadingChartOfAccountsV2 &&
						!chartOfAccountsErrorV2 &&
						categories.length === 0 && (
							<div className="p-8 text-center bg-gray-100 text-slate-400 pointer-events-none select-none rounded-md my-4">
								{searchQuery ? 'Ничего не найдено' : 'Нет данных для отображения'}
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
						Эта схема наглядно показывает, как статьи участвуют в формировании отчета Баланс
					</p>

					<div className="flex gap-4">
						{/* Left Column - 2 cards vertically */}
						<div className="flex-1">
							<div className="flex flex-col gap-4">
								{/* Движение денег */}
								<div className="bg-white rounded-lg border border-primary p-4">
									<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">Движение денег</h3>

									<div className="flex flex-col gap-3">
										<div className="flex flex-col">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">Операционный поток</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">Поступления</div>
												<div className="text-sm text-slate-700">Выплаты</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">Инвестиционный поток</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">Поступления</div>
												<div className="text-sm text-slate-700">Выплаты</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">Финансовый поток</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">Поступления</div>
												<div className="text-sm text-slate-700">Выплаты</div>
											</div>
										</div>

										<div className="flex flex-col pt-3 border-t border-gray-300">
											<div className="text-[15px] font-bold text-slate-900">ОБЩИЙ ДЕНЕЖНЫЙ ПОТОК</div>
										</div>
									</div>
								</div>

								{/* Прибыли и убытки */}
								<div className="bg-white rounded-lg border border-primary p-4">
									<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">Прибыли и убытки</h3>

									<div className="flex flex-col gap-3">
										<div className="flex flex-col">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
												<span>Доходы</span>
												<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
											</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">Продажа товаров</div>
												<div className="text-sm text-slate-700">Оказание услуг</div>
												<div className="text-sm text-slate-700">Прочие доходы</div>
											</div>
										</div>

										<div className="flex flex-col pt-2 border-t border-gray-200">
											<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="text-xs text-red-500">минус</span>
													<span>Расходы</span>
												</div>
												<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
											</div>
											<div className="flex flex-col gap-0.5 ml-4">
												<div className="text-sm text-slate-700">Производственный персонал</div>
												<div className="text-sm text-slate-700">Покупка товаров</div>
												<div className="text-sm text-slate-700">Административный персонал</div>
												<div className="text-sm text-slate-700">Аренда</div>
												<div className="text-sm text-slate-700">Прочие расходы</div>
												<div className="text-sm text-slate-700 ml-4">
													Банковские услуги
												</div>
												<div
													className="text-sm text-slate-700 ml-4 flex items-center gap-2"
												>
													<span className="px-2 py-0.5 text-[10px] bg-slate-400 text-white rounded">скоро</span>
													<span>Курсовая разница минус</span>
												</div>
												<div className="text-sm text-slate-700 ml-4">
													Амортизация
												</div>
												<div className="text-sm text-slate-700 ml-4">
													Проценты
												</div>
												<div className="text-sm text-slate-700 ml-4">
													Налог на прибыль (доходы)
												</div>
											</div>
										</div>

										<div className="flex flex-col pt-3 border-t border-gray-300">
											<div className="text-[15px] font-bold text-slate-900">НЕРАСПРЕДЕЛЕННАЯ ПРИБЫЛЬ</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column - 1 big card */}
						<div className="flex-1 pb-10">
							{/* Баланс */}
							<div className="bg-white rounded-lg border border-primary p-4 h-full">
								<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">Баланс</h3>

								<div className="flex flex-col gap-3">
									<div className="flex flex-col">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<span>Оборотные активы</span>
											<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">Дебиторская задолженность</div>
											<div className="text-sm text-slate-700">Денежные средства</div>
											<div className="text-sm text-slate-700">Запасы</div>
											<div className="text-sm text-slate-700">Другие оборотные</div>
											<div className="text-sm text-slate-700 ml-4">
												Заготовые платежи
											</div>
											<div className="text-sm text-slate-700 ml-4">
												Выданные займы (до 1 года)
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>Внеоборотные активы</span>
												<span className="px-2 py-0.5 text-[11px] bg-slate-600 text-white rounded font-medium">И</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">Основные средства</div>
											<div className="text-sm text-slate-700">Оборудование</div>
											<div className="text-sm text-slate-700">Транспорт</div>
											<div className="text-sm text-slate-700">Другие внеоборотные</div>
											<div className="text-sm text-slate-700 ml-4">
												Выданные займы (от 1 года)
											</div>
											<div className="text-sm text-slate-700 ml-4">
												Финансовые вложения
											</div>
											<div className="text-sm text-slate-700 ml-4">
												Нематериальные активы
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">ИТОГО АКТИВЫ</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<span>Краткосрочные обязательства</span>
											<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">Кредиторская задолженность</div>
											<div className="text-sm text-slate-700">Другие краткосрочные</div>
											<div className="text-sm text-slate-700 ml-4">
												Платежи третьим лицам
											</div>
											<div className="text-sm text-slate-700 ml-4">
												Полученные займы (до 1 года)
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>Долгосрочные обязательства</span>
												<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">Ф</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">Кредиты</div>
											<div className="text-sm text-slate-700">Другие долгосрочные</div>
											<div className="text-sm text-slate-700 ml-4">
												Полученные займы (от 1 года)
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">ИТОГО ОБЯЗАТЕЛЬСТВА</div>
									</div>

									<div className="flex flex-col pt-2 border-t border-gray-200">
										<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>Капитал</span>
												<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">Ф</span>
											</div>
										</div>
										<div className="flex flex-col gap-0.5 ml-4">
											<div className="text-sm text-slate-700">Вложения учредителей</div>
											<div className="text-sm text-slate-700 flex items-center gap-2">
												<span className="text-xs text-green-500">плюс</span>
												<span>Нераспределенная прибыль</span>
											</div>
										</div>
									</div>

									<div className="flex flex-col pt-3 border-t border-gray-300">
										<div className="text-[15px] font-bold text-slate-900">ИТОГО КАПИТАЛ</div>
									</div>

									<div className="flex flex-col pt-3 border-t-2 border-slate-900">
										<div className="text-[15px] font-bold text-slate-900">АКТИВЫ = ОБЯЗАТЕЛЬСТВА + КАПИТАЛ</div>
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
						} catch (error) {
							// Close modal first
							setIsDeleteModalOpen(false)
							setCategoryToDelete(null)

							// Extract error message from API response
							let errorMessage = 'Не удалось удалить учетную статью'
							if (error.response?.data?.data) {
								errorMessage = error.response.data.data
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
