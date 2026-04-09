'use client'
import { cn } from '@/app/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
// import styles from './OperationModal.module.scss'
import { Clock, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { formatDateRu } from '../../../utils/helpers'
import AccuralForm from './Forms/Accural'
import IncomeForm from './Forms/Income'
import PaymentForm from './Forms/Payment'
import TransferForm from './Forms/Transfer'

const OperationModal = observer(({
	operation,
	isClosing,
	isOpening,
	onClose,
	onSuccess,
	preselectedCounterparty = null,
	defaultDealGuid = null,
	initialTab = 'income',
	modalType = null,
	chart_of_accounts_id = null,
	chart_of_accounts_id_2 = null
}) => {
	const isNew = operation?.isNew || false

	const operationGuid = useMemo(() => {
		if (isNew) return null
		return operation?.guid || null
	}, [isNew, operation])

	// Fetch full operation data if editing existing operation
	// const { data: fullOperationData, isLoading: isLoadingOperation, refetch } = useOperation(operationGuid, {
	// 	enabled: !isNew && !!operationGuid
	// })

	// Refetch operation data when modal opens
	// useEffect(() => {
	// 	if (!isNew && operationGuid && isOpening) {
	// 		refetch()
	// 	}
	// }, [isOpening, operationGuid, isNew, refetch])

	// Use full operation data if available, otherwise use passed operation
	const operationData = useMemo(() => {
		if (isNew) return operation
		// if (fullOperationData?.data?.data?.data) {
		// 	return {
		// 		...operation,
		// 		// rawData: fullOperationData.data.data.data
		// 	}
		// }
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

	// if (!isNew && isLoadingOperation) {
	// 	return (
	// 		<div className={styles.loadingOverlay}>
	// 			<div className={styles.loadingSpinner}></div>
	// 			<span>Загрузка операции...</span>
	// 		</div>
	// 	)
	// }

	if (!operationData && !isNew) return null

	return (
		<>
			{/* Overlay and Modal Container */}
			<div className={cn('fixed top-[60px] left-[80px] w-[calc(100%-80px)]  h-[calc(100%-60px)] right-0 bottom-0 flex bg-black/50 z-1000 transition-opacity duration-300', isClosing ? 'opacity-0' : 'opacity-100')}>
				<div className="min-w-[600px] max-w-[700px]! h-full bg-white p-4 flex flex-col transition-transform duration-300">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-bold text-neutral-900">
								{isNew ? 'Создание операции' : 'Редактирование операции'}
							</h2>
							{!isNew && (
								<div className="flex items-center gap-1 text-sm text-neutral-600">
									<Clock size={15} />
									<span>Создана {formatDateRu(operationData?.createdAt) || '—'}</span>
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
							{ id: 'income', label: 'Поступление', color: 'bg-green-600' },
							{ id: 'payment', label: 'Выплата', color: 'bg-red-600' },
							{ id: 'transfer', label: 'Перемещение', color: 'bg-slate-600' },
							{ id: 'accrual', label: 'Начисление', color: 'bg-zinc-500' }
						].map(tab => (
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
								initialData={operationData}
								preselectedCounterparty={preselectedCounterparty}
								defaultDealGuid={defaultDealGuid}
								chart_of_accounts_id={chart_of_accounts_id}
								onSuccess={onSuccess}
							/>
						)}
						{activeTab === 'payment' && (
							<PaymentForm
								onClose={onClose}
								initialData={operationData}
								preselectedCounterparty={preselectedCounterparty}
								defaultDealGuid={defaultDealGuid}
								chart_of_accounts_id={chart_of_accounts_id_2}
								onSuccess={onSuccess}
							/>
						)}
						{activeTab === 'transfer' && (
							<TransferForm
								onClose={onClose}
								initialData={operationData}
								onSuccess={onSuccess}
							/>
						)}
						{activeTab === 'accrual' && (
							<AccuralForm
								onCancel={onClose}
								onClose={onClose}
								onSuccess={onSuccess}
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
