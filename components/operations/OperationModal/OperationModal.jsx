'use client'

import useModalPresence from '@/hooks/useModalPresence'
import { cn } from '@/lib/utils'
import { Clock, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

	return (
		<>
			{/* Overlay and Modal Container */}
			<div className={cn('fixed top-[60px] left-[80px] w-[calc(100%-80px)]  h-[calc(100%-60px)] right-0 bottom-0 flex justify-end bg-black/50 z-1000 transition-opacity duration-300', isClosing ? 'opacity-0' : 'opacity-100')}>
				<SentMessages
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
				<div className="min-w-[600px]! max-w-[900px]! h-full bg-white p-4 flex flex-col transition-transform duration-300">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-bold text-neutral-900">
								{isNew ? t('modal.createTitle') : t('modal.editTitle')}
							</h2>
							{!isNew && (
								<div className="flex items-center gap-1 text-sm text-neutral-600">
									<Clock size={15} />
									<span>{t('modal.createdAt', { date: formatDateRu(operationData?.createdAt) || '—' })}</span>
								</div>
							)}
						</div>
						<button onClick={onClose} className="text-neutral-500 cursor-pointer hover:text-neutral-700 transition-colors">
							<X />
						</button>
					</div>

					{/* Tabs */}
					<div className="pb-3 pt-1 border-b mb-4 flex gap-3 border-neutral-200">
						{[
							{ id: 'income', label: t('modal.tabIncome'), color: 'bg-green-600', canShow: operationPermissions?.income?.add && isNew || operationPermissions?.income?.edit && !isNew },
							{ id: 'payment', label: t('modal.tabPayment'), color: 'bg-red-600', canShow: operationPermissions?.payout?.add && isNew || operationPermissions?.payout?.edit && !isNew },
							{ id: 'transfer', label: t('modal.tabTransfer'), color: 'bg-slate-600', canShow: operationPermissions?.transfer?.add && isNew || operationPermissions?.transfer?.edit && !isNew },
							{ id: 'accrual', label: t('modal.tabAccrual'), color: 'bg-zinc-500', canShow: operationPermissions?.accrual?.add && isNew || operationPermissions?.accrual?.edit && !isNew }
						].filter(tab => tab.canShow).map(tab => (
							<button
								key={tab.id}
								className={cn(
									"px-3 py-2 rounded-sm text-neutral-700 cursor-pointer text-sm transition-all",
									activeTab === tab.id ? `${tab.color} text-white` : "hover:bg-neutral-100"
								)}
								onClick={() => setActiveTab(tab.id)}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Form Content */}
					<div className="flex-1 overflow-hidden">
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
			</div>
		</>
	)
})

export default OperationModal
