'use client'

import useModalPresence from '@/hooks/useModalPresence'
import { cn } from '@/lib/utils'
import { Clock, MessageSquareText, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import OperationTypeIcon from '../OperationTypeIcon/OperationTypeIcon'
import useMounted from '../../../hooks/useMounted'
import { useOperationComments } from '../../../hooks/useOperationComments'
import { appStore } from '../../../store/app.store'
import { formatDateRu } from '../../../utils/helpers'
import AccuralForm from './Forms/Accural'
import IncomeForm from './Forms/Income'
import PaymentForm from './Forms/Payment'
import TransferForm from './Forms/Transfer'
import SentMessages from './SentMessages'

const OperationModal = observer(({
	operation,
	isClosing,
	// isOpening,
	currentPage,
	onClose,
	onSuccess,
	preselectedCounterparty = null,
	defaultDealGuid = null,
	defaultPurchaseDealGuid = null,
	initialTab = 'income',
	modalType = null,
	chart_of_accounts_id = null,
	chart_of_accounts_id_2 = null
}) => {
  useModalPresence()

	const t = useTranslations('Operations')
	const mounted = useMounted()
	const isNew = operation?.isNew || false

	const operationPermissions = appStore.permission?.operations || {}

	const comments = useOperationComments({ isNew, operationId: operation?.guid })

	const handleFormSuccess = async (operationId) => {
		await comments.flushPending(operationId)
		onSuccess?.()
		onClose()
	}



	const operationData = useMemo(() => {
		if (isNew) return operation
		return operation
	}, [isNew, operation])

	// Current active tab 
	const getTabType = useCallback((op) => {
		if (op?.tip === 'Начисление') return 'accrual'
		if (op?.tip === 'Поступление') return 'income'
		if (op?.tip === 'Перемещение') return 'transfer'
		if (op?.tip === 'Выплата') return 'payment'
		return modalType || initialTab || 'income'
	}, [initialTab, modalType])

	const [activeTab, setActiveTab] = useState(() => getTabType(operationData))
	const [commentsOpen, setCommentsOpen] = useState(false)

	// Esc закрывает окно
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	// Update active tab when operationData changes (for editing)
	useEffect(() => {
		if ((!isNew || operation?.isCopy) && operationData) {
			setActiveTab(getTabType(operationData))
		}
	}, [operationData, isNew, getTabType, operation?.isCopy])

	// Block body scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = ''
		}
	}, [])


	if (!operationData && !isNew) return null

	if (!mounted) return null

	// Тип формы → tip для значка
	const TAB_TIP = { income: 'Поступление', payment: 'Выплата', transfer: 'Перемещение', accrual: 'Начисление' }

	const tabs = [
		{ id: 'income', label: t('modal.tabIncome'), canShow: operationPermissions?.income?.add && isNew || operationPermissions?.income?.edit && !isNew },
		{ id: 'payment', label: t('modal.tabPayment'), canShow: operationPermissions?.payout?.add && isNew || operationPermissions?.payout?.edit && !isNew },
		{ id: 'transfer', label: t('modal.tabTransfer'), canShow: operationPermissions?.transfer?.add && isNew || operationPermissions?.transfer?.edit && !isNew },
		{ id: 'accrual', label: t('modal.tabAccrual'), canShow: operationPermissions?.accrual?.add && isNew || operationPermissions?.accrual?.edit && !isNew },
	].filter(tab => tab.canShow)

	const commentsCount = (comments.messages?.length || 0) + (comments.attachedFiles?.length || 0)

	// Окно по центру экрана — вместо панели, выезжавшей от края. Портал в body:
	// окно должно быть над шапкой и меню, а не внутри контейнера страницы.
	return createPortal(
		<div
			className={cn(
				'fixed inset-0 z-1000 flex items-center justify-center p-4 transition-opacity duration-200',
				isClosing ? 'opacity-0' : 'opacity-100'
			)}
		>
			<div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

			<div
				role="dialog"
				aria-modal="true"
				className={cn(
					'relative flex h-[min(880px,92vh)] max-w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)] transition-[width] duration-200',
					commentsOpen ? 'w-[1140px]' : 'w-[760px]'
				)}
			>
				{/* Форма */}
				<div className="flex min-w-0 flex-1 flex-col">
					{/* Шапка: значок типа, заголовок, файлы и комментарии, закрыть */}
					<div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-8 py-5">
						<div className="flex min-w-0 items-center gap-3">
							<OperationTypeIcon tip={TAB_TIP[activeTab]} className="h-10 w-10" />
							<div className="min-w-0">
								<h2 className="text-lg font-semibold text-slate-900">
									{isNew ? t('modal.createTitle') : t('modal.editTitle')}
								</h2>
								{!isNew && (
									<div className="flex items-center gap-1 text-xs text-slate-500">
										<Clock size={13} />
										<span>{t('modal.createdAt', { date: formatDateRu(operationData?.createdAt) || '—' })}</span>
										{operationData?.updatedAt && operationData.updatedAt !== operationData.createdAt && (
											<span>· {t('modal.updatedAt', { date: formatDateRu(operationData.updatedAt) })}</span>
										)}
									</div>
								)}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<button
								type="button"
								onClick={() => setCommentsOpen(v => !v)}
								aria-pressed={commentsOpen}
								className={cn(
									'flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium cursor-pointer transition-colors',
									'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
									commentsOpen
										? 'border-[#0e73f6] bg-[#eef4ff] text-[#0e73f6]'
										: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
								)}
							>
								<MessageSquareText size={16} aria-hidden="true" />
								{t('modal.filesAndComments')}
								{commentsCount > 0 && (
									<span className="rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-700 tabular-nums">{commentsCount}</span>
								)}
							</button>
							<button
								type="button"
								onClick={onClose}
								aria-label={t('modal.close')}
								className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
							>
								<X size={18} />
							</button>
						</div>
					</div>

					{/* Тип операции — сегменты со значками вместо цветных вкладок */}
					{tabs.length > 1 && (
						<div className="shrink-0 px-8 pt-6">
							<div role="tablist" className="grid gap-1 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
								{tabs.map(tab => (
									<button
										key={tab.id}
										type="button"
										role="tab"
										aria-selected={activeTab === tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={cn(
											'flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium cursor-pointer transition-colors',
											'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e73f6]',
											activeTab === tab.id
												? 'bg-white text-slate-900 shadow-sm'
												: 'text-slate-500 hover:text-slate-900'
										)}
									>
										<OperationTypeIcon tip={TAB_TIP[tab.id]} size="sm" />
										{tab.label}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Form Content */}
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						{activeTab === 'income' && (
							<IncomeForm
								onClose={onClose}
								currentPage={currentPage}
								initialData={operationData}
								preselectedCounterparty={preselectedCounterparty}
								defaultDealGuid={defaultDealGuid}
								chart_of_accounts_id={chart_of_accounts_id}
								onSuccess={handleFormSuccess}
							/>
						)}
						{activeTab === 'payment' && (
							<PaymentForm
								onClose={onClose}
								initialData={operationData}
								currentPage={currentPage}
								preselectedCounterparty={preselectedCounterparty}
								defaultDealGuid={defaultDealGuid}
								defaultPurchaseDealGuid={defaultPurchaseDealGuid}
								chart_of_accounts_id={chart_of_accounts_id_2}
								onSuccess={handleFormSuccess}
							/>
						)}
						{activeTab === 'transfer' && (
							<TransferForm
								onClose={onClose}
								currentPage={currentPage}
								initialData={operationData}
								onSuccess={handleFormSuccess}
							/>
						)}
						{activeTab === 'accrual' && (
							<AccuralForm
								onCancel={onClose}
								currentPage={currentPage}
								onClose={onClose}
								onSuccess={handleFormSuccess}
								initialData={operationData}
							/>
						)}
					</div>
				</div>

				{/* Файлы и комментарии — колонка внутри окна, а не серая плашка сбоку */}
				{commentsOpen && (
					<div className="flex shrink-0 border-l border-slate-200">
						<SentMessages
							open
							messages={comments.messages}
							text={comments.text}
							attachedFiles={comments.attachedFiles}
							editingId={comments.editingId}
							editText={comments.editText}
							editFiles={comments.editFiles}
							deleteTargetId={comments.deleteTargetId}
							onTextChange={comments.setText}
							onFileChange={comments.handleFileChange}
							onRemoveAttach={comments.handleRemoveAttach}
							onSend={comments.handleSend}
							onKeyDown={comments.handleKeyDown}
							onEdit={comments.handleEdit}
							onEditChange={comments.setEditText}
							onEditFileChange={comments.handleEditFileChange}
							onEditConfirm={comments.handleEditConfirm}
							onEditCancel={comments.handleEditCancel}
							onDelete={comments.handleDeleteRequest}
							onDeleteConfirm={comments.handleDeleteConfirm}
							onDeleteCancel={comments.handleDeleteCancel}
						/>
					</div>
				)}
			</div>
		</div>,
		document.body
	)
})

export default OperationModal
