'use client'

import CreateShipment from '@/components/deals/details/CreatingShipment'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { OperationsFiltersSidebar } from '@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar'
import { DeleteConfirmModal } from '@/components/operations/OperationsTable/DeleteConfirmModal'
import OperationTableRow from '@/components/operations/TableRow/new'
import {
	useDeleteOperation,
	useUcodeRequestInfinite,
	useUcodeRequestMutation,
} from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { EllipsisVertical, Search } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { OperationsFooter } from '../../../components/operations/OperationsFooter/OperationsFooter'
import OperationCheckbox from '../../../components/shared/Checkbox/operationCheckbox'
import Input from '../../../components/shared/Input'
import ScreenLoader from '../../../components/shared/ScreenLoader'
import operationsDto from '../../../lib/dtos/operationsDto'
import { appStore } from '../../../store/app.store'
import { operationFilterStore } from '../../../store/operationFilter.store'
import { formatDate } from '../../../utils/formatDate'



const OperationsPage = observer(() => {
	const [isModalClosing, setIsModalClosing] = useState(false)
	const [isModalOpening, setIsModalOpening] = useState(false)

	const [selectedOperations, setSelectedOperations] = useState([])
	const [openModal, setOpenModal] = useState(false)
	const [modalType, setModalType] = useState(null)
	const [operationToDelete, setOperationToDelete] = useState(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const queryClient = useQueryClient()

	// Shipment state
	const [showShipmentModal, setShowShipmentModal] = useState(false)
	const [selectedShipment, setSelectedShipment] = useState(null)
	const [isShipmentEditing, setIsShipmentEditing] = useState(false)
	const [isShipmentCopying, setIsShipmentCopying] = useState(false)
	const [isShipmentDeleting, setIsShipmentDeleting] = useState(false)
	// Block body scroll for this page only
	useEffect(() => {
		document.body.style.overflow = 'hidden'
		document.body.style.height = '100vh'

		return () => {
			document.body.style.overflow = ''
			document.body.style.height = ''
		}
	}, [])

	// Filter states
	const [isFilterOpen, setIsFilterOpen] = useState(true)

	const {
		searchQuery,
		debouncedSearchQuery,
		selectedDatePaymentRange,
		selectedDateStartRange,
		selectedCounterAgents,
		selectedLegalEntities,
		selectedFilters,
		amountRange,
		selectedChartOfAccounts,
		paymentType,
		deals
	} = operationFilterStore

	const LIMIT = 50

	// Destructure scalar booleans directly so each one is a reactive useMemo dependency
	const paymentConfirmed = operationFilterStore.dateFilters.podtverzhdena
	const paymentNotConfirmed = operationFilterStore.dateFilters.nePodtverzhdena
	const accrualConfirmed = operationFilterStore.dateStartFilters.podtverzhdena
	const accrualNotConfirmed = operationFilterStore.dateStartFilters.nePodtverzhdena

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			operationFilterStore.setDebouncedSearchQuery(searchQuery)
		}, 500)

		return () => clearTimeout(timer)
	}, [searchQuery])



	// Scrollable container id for InfiniteScroll: "operations-scrollable-container"


	const safeFormatDate = (date) => {
		if (!date) return undefined
		try {
			const d = date instanceof Date ? date : new Date(date)
			if (isNaN(d.getTime())) return undefined
			return formatDate(d)
		} catch {
			return undefined
		}
	}

	const paymentStartDate = safeFormatDate(selectedDatePaymentRange?.start)
	const paymentEndDate = safeFormatDate(selectedDatePaymentRange?.end)
	const accrualStartDate = safeFormatDate(selectedDateStartRange?.start)
	const accrualEndDate = safeFormatDate(selectedDateStartRange?.end)

	const requestOperationFilters = useMemo(() => {
		const filters = {
			limit: LIMIT,
			search: debouncedSearchQuery.toLowerCase(),
			paymentDateStart: paymentStartDate,
			paymentDateEnd: paymentEndDate,
			accrualDateStart: accrualStartDate,
			accrualDateEnd: accrualEndDate,
			counterparties_ids: toJS(selectedCounterAgents),
			my_accounts_ids: toJS(selectedLegalEntities),
			tip: toJS(selectedFilters),
			amount_range: {
				min: Number(amountRange.min),
				max: Number(amountRange.max),
			},
			chart_of_accounts_ids: toJS(selectedChartOfAccounts),
			payment_type: paymentType,
			paymentConfirmed,
			paymentNotConfirmed,
			accrualConfirmed,
			accrualNotConfirmed,
			sellingDealId: deals
		}

		return filters
	}, [
		LIMIT,
		debouncedSearchQuery,
		paymentStartDate,
		paymentEndDate,
		accrualStartDate,
		accrualEndDate,
		selectedCounterAgents,
		selectedLegalEntities,
		selectedFilters,
		amountRange,
		selectedChartOfAccounts,
		paymentType,
		paymentConfirmed,
		paymentNotConfirmed,
		accrualConfirmed,
		accrualNotConfirmed,
		deals
	])

	const {
		data: infiniteData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isFetching: isFetchingOperations,
		isLoading: isLoadingOperations,
	} = useUcodeRequestInfinite({
		method: 'find_operations',
		data: requestOperationFilters,
		querySetting: {
			select: (response) => response,
			staleTime: 1000 * 60,
			gcTime: 1000 * 60,
		}
	})

	const allOperations = useMemo(() => {
		return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
	}, [infiniteData])

	const totalSummary = useMemo(() => {
		return infiniteData?.pages?.[0]?.data?.totalSummary
	}, [infiniteData])


	const operationPermissions = appStore.permission.operations


	const isAllSelected = allOperations.length > 0 && selectedOperations.length === allOperations.length
	const canAdd = operationPermissions.income.add || operationPermissions.payout.add || operationPermissions.transfer.add || operationPermissions.accrual.add || operationPermissions.shipment.add


	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedOperations([])
		} else {
			setSelectedOperations(allOperations.map(op => op.id))
		}
	}



	const operationsList = useMemo(() => {
		return {
			future: operationsDto(allOperations, 'future'),
			today: operationsDto(allOperations, 'today'),
			before: operationsDto(allOperations, 'before'),
		}
	}, [allOperations])



	const { mutateAsync: deleteShipmentMutationForShipment, isPending: isDeletingShipment } = useUcodeRequestMutation()

	// Close modal when clicking on header
	useEffect(() => {
		if (!openModal) return

		const handleHeaderClick = e => {
			// Check if click is on header element
			const header = document.querySelector('header')
			if (header && header.contains(e.target)) {
				// closeOperationModal()
			}
		}

		document.addEventListener('click', handleHeaderClick)
		return () => document.removeEventListener('click', handleHeaderClick)
	}, [openModal])

	// Delete operation mutation
	const deleteOperationMutation = useDeleteOperation()

	const toggleOperation = id => {
		setSelectedOperations(prev =>
			prev.includes(id) ? prev.filter(opId => opId !== id) : [...prev, id],
		)
	}

	const openOperationModal = operation => {
		const canEdit = operationPermissions.income.edit && operation.tip === 'Поступление' || operationPermissions.payout.edit && operation.tip === 'Выплата' || operationPermissions.transfer.edit && operation.tip === 'Перемещение' || operationPermissions.accrual.edit && operation.tip === 'Начисление' || operationPermissions.shipment.edit && operation.tip === 'Отгрузка'
		if (!canEdit) {
			return
		}
		if (operation.tip === 'Отгрузка') {
			handleEditShipment(operation)
			return
		}
		setOpenModal(operation)
		setIsModalClosing(false)
		setIsModalOpening(true)
		if (operation.typeCategory === 'transfer') {
			setModalType('transfer')
		} else if (operation.typeCategory === 'out') {
			setModalType('payment')
		} else if (operation.typeCategory === 'in') {
			setModalType('income')
		} else {
			setModalType('accrual')
		}
		// Запускаем анимацию появления
		setTimeout(() => {
			setIsModalOpening(false)
		}, 50)
	}

	const handleEditShipment = (shipment) => {
		setSelectedShipment(shipment)
		setIsShipmentEditing(true)
		setIsShipmentCopying(false)
		setShowShipmentModal(true)
	}

	const handleCopyShipment = (shipment) => {
		setSelectedShipment(shipment)
		setIsShipmentEditing(false)
		setIsShipmentCopying(true)
		setShowShipmentModal(true)
	}

	const handleDeleteShipment = (shipment) => {
		setOperationToDelete(shipment)
		setIsShipmentDeleting(true)
		setIsDeleteModalOpen(true)
	}

	const closeOperationModal = () => {
		setIsModalClosing(true)
		// Разблокируем скролл страницы
		document.body.style.overflow = 'auto'
		setTimeout(() => {
			setOpenModal(null)
			setIsModalClosing(false)
		}, 300) // Длительность анимации
	}

	const handleEditOperation = operation => {
		if (operation.tip === 'Отгрузка') {
			handleEditShipment(operation)
			return
		}
		if (operation.typeCategory === 'transfer') {
			setModalType('transfer')
		} else if (operation.typeCategory === 'out') {
			setModalType('payment')
		} else if (operation.typeCategory === 'in') {
			setModalType('income')
		} else {
			setModalType('accrual')
		}
		openOperationModal(operation)
		setOpenModal({
			...operation,
			isNew: false,
		})
	}

	const handleDeleteOperation = operation => {
		if (operation.tip === 'Отгрузка') {
			handleDeleteShipment(operation)
			return
		}
		setOperationToDelete(operation)
		setIsDeleteModalOpen(true)
	}

	const handleCopyOperation = operation => {
		if (operation.tip === 'Отгрузка') {
			handleCopyShipment(operation)
			return
		}
		// Open modal as "new" but with the copied operation's data
		const copiedOperation = { ...operation };

		// Strip the primary GUIDs completely
		delete copiedOperation.guid;
		delete copiedOperation.id;

		if (copiedOperation.rawData) {
			copiedOperation.rawData = { ...copiedOperation.rawData };
			delete copiedOperation.rawData.guid;
		}


		setOpenModal({
			...copiedOperation,
			id: 'new',
			isNew: true,
			isCopy: true
		})

		setIsModalClosing(false)
		// setIsModalOpening(true)


		if (operation.typeCategory === 'transfer') {
			setModalType('accrual')
		} else if (operation.typeCategory === 'out') {
			setModalType('payment')
		} else if (operation.typeCategory === 'in') {
			setModalType('income')
		} else {
			setModalType('payment')
		}

		setTimeout(() => {
			setIsModalOpening(false)
		}, 50)
	}

	const handleDeleteConfirm = async () => {
		if (!operationToDelete) return

		const guid = operationToDelete.rawData?.guid || operationToDelete.guid
		if (!guid) {
			console.error('GUID операции не найден')
			return
		}

		try {
			if (isShipmentDeleting) {
				await deleteShipmentMutationForShipment({
					"method": "delete_shipment_transaction",
					"data": {
						"guid": guid
					}
				})
			} else {
				await deleteOperationMutation.mutateAsync([guid])
			}
			setIsDeleteModalOpen(false)
			setOperationToDelete(null)
			setIsShipmentDeleting(false)
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
			queryClient.invalidateQueries({ queryKey: ['operationsList'] })
			queryClient.invalidateQueries({ queryKey: ['find_operations'] })
			queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
			queryClient.invalidateQueries({ queryKey: ["list_sales_operations"] })
			queryClient.invalidateQueries({ queryKey: ["get_sales_transaction"] })
			queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
		} catch (error) {
			console.error('Error deleting operation:', error)
		}
	}

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false)
		setOperationToDelete(null)
		setIsShipmentDeleting(false)
	}

	const selectedTotal = useMemo(() => {
		return allOperations
			.filter(op => selectedOperations.includes(op.id))
			.reduce((sum, op) => {
				const amount = op.rawData?.summa || 0
				return sum + amount
			}, 0)
	}, [allOperations, selectedOperations])

	const handleCreate = () => {
		setOpenModal({ id: 'new', isNew: true })
		setModalType('income')
		setIsModalClosing(false)
		setIsModalOpening(true)
		document.body.style.overflow = 'hidden'
		setTimeout(() => {
			setIsModalOpening(false)
		}, 50)
	}


	return (
		<div className="fixed left-[80px] top-[60px]  w-[calc(100%-80px)] flex h-[calc(100%-60px)]">
			{/* Sidebar Filters */}
			<OperationsFiltersSidebar
				isOpen={isFilterOpen}
				onClose={() => setIsFilterOpen(!isFilterOpen)}
			/>

			{/* Main Content */}
			<div className="w-full flex flex-col">
				<div className=" h-16 px-4 flex items-center justify-between bg-white ">
					<div className="flex items-center gap-4 ">
						<h1 className="text-xl font-semibold">Операции</h1>
						{canAdd && <button
							onClick={handleCreate}
							className="primary-btn"
						>
							Создать
						</button>}
					</div>
					<div className=" flex items-center justify-self-center gap-2">
						<Input
							type="text"
							leftIcon={<Search size={20} />}
							placeholder="По счету, контрагенту, или статья"
							value={searchQuery}
							className="w-[300px]"
							onChange={(e) => operationFilterStore.setSearchQuery(e.target.value)}
						/>
						<button className=" bg-white rounded-md border  flex items-center justify-center p-2">
							<EllipsisVertical size={20} className='text-neutral-500' />
						</button>
					</div>
				</div>
				<div id="scrollableDiv" className="overflow-auto  h-full w-full px-2 bg-white">
					<div className='flex  sticky top-0 z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
						<div className='min-w-10 py-3 flex items-center justify-center'>
							<OperationCheckbox
								checked={isAllSelected}
								onChange={toggleSelectAll}
							/>
						</div>
						{isAllSelected && selectedOperations.length > 0 && <div className="flex items-center gap-2">
							<p>{selectedOperations.length}</p>
							<button className="primary-btn">Удалить</button>
							<button className="primary-btn">Экспорт</button>
						</div>}
						{!isAllSelected && <>
							<div className='min-w-36  pl-5 flex p-3 items-center justify-start '>
								Дата
							</div>
							<div className='min-w-24 max-w-52 flex-1  flex p-3 items-center justify-start '>
								Счет
							</div>
							<div className='min-w-14   flex p-3 items-center justify-center '>
								Тип
							</div>
							<div className='min-w-36 flex-1  flex p-3 items-center justify-start '>
								Контрагент
							</div>
							<div className='min-w-32 flex-1   text-start  p-3 items-center justify-start '>
								Статья
							</div>
							<div className='min-w-20 flex-1  flex p-3 items-center justify-center '>
								Сделка
							</div>
							<div className='min-w-40  flex p-3 items-center justify-end '>
								Сумма
							</div>
							<div className='min-w-5  flex p-3 items-center justify-center'>
								&nbsp;
							</div>
						</>}
					</div>
					{allOperations.length === 0 && !isLoadingOperations &&
						<div className="py-20 text-center text-neutral-500 bg-white">
							Нет данных
						</div>
					}
					<InfiniteScroll
						dataLength={allOperations.length}
						hasMore={hasNextPage}
						next={fetchNextPage}
						scrollableTarget="scrollableDiv"
					>

						{<div className="flex flex-col overflow-auto pb-10">
							{operationsList?.future?.map(op => (
								<OperationTableRow
									key={op.guid}
									op={op}
									selectedOperations={selectedOperations}
									toggleOperation={toggleOperation}
									openOperationModal={openOperationModal}
									handleEditOperation={handleEditOperation}
									handleDeleteOperation={handleDeleteOperation}
									handleCopyOperation={handleCopyOperation}
								/>
							))}

							{/* Сегодня - Section Header */}
							{operationsList?.today?.length > 0 && (
								<div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
									<h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Сегодня</h3>
								</div>
							)}

							{operationsList?.today?.map(op => (
								<OperationTableRow
									key={op.guid}
									op={op}
									selectedOperations={selectedOperations}
									toggleOperation={toggleOperation}
									openOperationModal={openOperationModal}
									handleEditOperation={handleEditOperation}
									handleDeleteOperation={handleDeleteOperation}
									handleCopyOperation={handleCopyOperation}
								/>
							))}

							{/* Вчера и ранее - Section Header */}
							{operationsList?.before?.length > 0 && (
								<div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
									<h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Вчера и ранее</h3>
								</div>
							)}
							{operationsList?.before?.map(op => (
								<OperationTableRow
									key={op.guid}
									op={op}
									selectedOperations={selectedOperations}
									toggleOperation={toggleOperation}
									openOperationModal={openOperationModal}
									handleEditOperation={handleEditOperation}
									handleDeleteOperation={handleDeleteOperation}
									handleCopyOperation={handleCopyOperation}
								/>
							))}
						</div>
						}
					</InfiniteScroll>

					<OperationsFooter totalSummary={totalSummary} isFilterOpen={isFilterOpen} />

				</div>
			</div>
			{isLoadingOperations && allOperations.length === 0 && <ScreenLoader className={'left-0!'} />}
			{(isFetchingNextPage || isFetchingOperations) && <ScreenLoader className={'left-0!'} />}


			{/* Right Side Modal */}
			{openModal && (
				<OperationModal
					operation={openModal}
					initialTab={modalType}
					isClosing={isModalClosing}
					isOpening={isModalOpening}
					onClose={closeOperationModal}
					onSuccess={() => {
						queryClient.invalidateQueries({ queryKey: ['find_operations'] })
						queryClient.invalidateQueries({ queryKey: ['dashboard'] })
					}}
				/>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteConfirmModal
				isOpen={isDeleteModalOpen}
				operation={operationToDelete}
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
				isDeleting={isShipmentDeleting ? isDeletingShipment : deleteOperationMutation.isPending}
			/>

			{showShipmentModal && (
				<CreateShipment
					open={showShipmentModal}
					onClose={() => setShowShipmentModal(false)}
					initialData={selectedShipment}
					isEditing={isShipmentEditing}
					isCopying={isShipmentCopying}
					dealName={selectedShipment?.selling_deal_name}
					dealGuid={selectedShipment?.selling_deal_id}
					kontragentId={selectedShipment?.counterparties_id}
				/>
			)}
		</div>
	)
})


export default OperationsPage