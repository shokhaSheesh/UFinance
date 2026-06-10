import { CategoryMenu } from '@/components/directories/CategoryMenu/CategoryMenu'
import { cn } from '@/lib/utils'

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
	const hasChildren = category?.children && category.children.length > 0
	const isExpanded = expandedCategories.includes(category?.id)
	const isClosing = closingCategories.includes(category?.id)
	const isSelected = selectedCategory === category?.id

	const currentPath = parentPath ? `${parentPath}/${category?.id}` : category?.id

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
					category?.isStatic && 'bg-slate-50 border-slate-200 cursor-default hover:bg-slate-50',
				)}
				onClick={e => {
					const menuContainer = e.target.closest('[data-menu-container]')
					const menuButton = e.target.closest('button[class*="menuButton"]')
					if (menuContainer || menuButton) {
						e.stopPropagation()
						return
					}
					if (hasChildren) {
						onToggleCategory(category?.id)
					} else {
						onSelectCategory(category?.id)
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

				<span className={cn('text-[15px] flex-1', category?.isStatic ? 'text-slate-400' : 'text-slate-800')}>
					{category?.name}
				</span>

				{category?.badge && (
					<span className={level === 0 ? 'px-2 py-0.5 text-[11px] font-normal text-slate-400' : 'px-2 py-0.5 text-[11px] bg-slate-400 text-white rounded font-medium'}>
						{category.badge}
					</span>
				)}

				{category?.hasLock && (
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

				{category?.hasMenu && (
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
								key={`${currentPath}/${childIndex}/${child?.id}`}
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
								isLast={childIndex === category.children.length - 1 && !child?.children}
								parentPath={currentPath}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default CategoryTreeItem
