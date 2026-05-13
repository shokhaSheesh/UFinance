'use client'

import useMounted from '@/hooks/useMounted'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Search } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

// Eager loaded components (critical for initial render)
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import ScreenLoader from '@/components/shared/ScreenLoader'
import {
	useDeleteOperation,
	useUcodeRequestInfinite,
	useUcodeRequestMutation,
} from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import operationsDto from '@/lib/dtos/operationsDto'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { formatDate } from '@/utils/formatDate'
import { handleDownload } from '@/utils/helpers'

// Lazy loaded components (heavy/non-critical)
const CreateShipment = React.lazy(() => import('@/components/deals/details/CreatingShipment').then(m => ({ default: m.default || m.CreateShipment || m })))
const OperationModal = React.lazy(() => import('@/components/operations/OperationModal/OperationModal').then(m => ({ default: m.default || m.OperationModal || m })))
const OperationsFiltersSidebar = React.lazy(() => import('@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar').then(m => ({ default: m.default || m.OperationsFiltersSidebar || m })))
const DeleteConfirmModal = React.lazy(() => import('@/components/operations/OperationsTable/DeleteConfirmModal').then(m => ({ default: m.default || m.DeleteConfirmModal || m })))
const OperationTableRow = React.lazy(() => import('@/components/operations/TableRow/new').then(m => ({ default: m.default || m })))
const CustomDialog = React.lazy(() => import('@/components/shared/CustomDialog').then(m => ({ default: m.default || m.CustomDialog || m })))
const OperationsFooter = React.lazy(() => import('@/components/operations/OperationsFooter/OperationsFooter').then(m => ({ default: m.default || m.OperationsFooter || m })))



const OperationsPage = observer(() => {
	const t = useTranslations('Operations')
	const isMounted = useMounted()
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
		deals,
		paymentConfirm,
		paymentNotConfirm,
		accrualConfirm,
		accrualNotConfirm
	} = operationFilterStore

	const LIMIT = 30


	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			operationFilterStore.setDebouncedSearchQuery(searchQuery)
		}, 500)

		return () => clearTimeout(timer)
	}, [searchQuery])


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

	// Build filters object without debounce (for debouncing logic)
	const immediateFilters = useMemo(() => {
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
			payment_type: appStore.isPayment ? paymentType : null,
			paymentConfirm,
			paymentNotConfirm,
			accrualConfirm,
			accrualNotConfirm,
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
		paymentConfirm,
		paymentNotConfirm,
		accrualConfirm,
		accrualNotConfirm,
		deals
	])

	// State for debounced filters
	const [requestOperationFilters, setRequestOperationFilters] = useState(immediateFilters)

	// Debounce filters with 2 seconds delay
	useEffect(() => {
		const timer = setTimeout(() => {
			setRequestOperationFilters(immediateFilters)
		}, 1000)

		return () => clearTimeout(timer)
	}, [immediateFilters])

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

	// Maximum page limit to prevent stack overflow (500 pages × 30 items = 15,000 items)
	const MAX_PAGES = 500

	// Safeguarded fetch function that respects the page limit
	const safeFetchNextPage = useMemo(() => {
		const currentPageCount = infiniteData?.pages?.length || 0
		if (currentPageCount >= MAX_PAGES) {
			console.warn(`Maximum page limit (${MAX_PAGES}) reached. Skipping fetch.`)
			return () => Promise.resolve()
		}
		return fetchNextPage
	}, [infiniteData?.pages?.length, fetchNextPage])

	// Effective hasNextPage that considers the page limit
	const effectiveHasNextPage = useMemo(() => {
		const currentPageCount = infiniteData?.pages?.length || 0
		return hasNextPage && currentPageCount < MAX_PAGES
	}, [hasNextPage, infiniteData?.pages?.length])

	const { mutate: exportOperations, isPending: isExporting } = useMutation({
		mutationKey: ['export_operations'],
		mutationFn: () => apiClient.invokeFunction({ method: 'export_operations', data: requestOperationFilters }),
		onSuccess: (uploadData) => {
			showSuccessNotification(t('page.fileDownloaded'))
			const fileLink = uploadData?.data?.link

			if (fileLink) {
				const contractFileLink = `https://cdn.u-code.io/${fileLink}`
				handleDownload(contractFileLink, 'operations.xlsx')
			}
		}
	})

	const { mutateAsync: getOperation, isPending: isPendingGetOperation } = useMutation({
		mutationKey: ['get_operation'],
		mutationFn: (data) => apiClient.invokeFunction({ method: 'get_operation', data })
	})

	const allOperations = useMemo(() => {
		return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
	}, [infiniteData])

	const totalSummary = useMemo(() => {
		return infiniteData?.pages?.[0]?.data?.totalSummary
	}, [infiniteData])


	const currentPage = useMemo(() => {
		return infiniteData?.pageParams?.length
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

	// --------------------------------

	// ─── Inside OperationsPage, replace the three useMemo operationsList
	//     and the InfiniteScroll JSX block ──────────────────────────────

	// Build a flat list with sentinel header items
	const flatItems = useMemo(() => {
		const items = []

		if (operationsList.future.length > 0) {
			items.push(...operationsList.future.map(op => ({ type: 'row', op })))
		}

		if (operationsList.today.length > 0) {
			items.push({ type: 'header', label: t('page.sectionToday') })
			items.push(...operationsList.today.map(op => ({ type: 'row', op })))
		}

		if (operationsList.before.length > 0) {
			items.push({ type: 'header', label: t('page.sectionBefore') })
			items.push(...operationsList.before.map(op => ({ type: 'row', op })))
		}

		return items
	}, [operationsList, t])

	// Ref to the scrollable container
	const scrollRef = useRef(null)

	const rowVirtualizer = useVirtualizer({
		count: flatItems.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: (index) => (flatItems[index]?.type === 'header' ? 36 : 56),
		overscan: 10,
	})

	const virtualItems = rowVirtualizer.getVirtualItems()
	const totalSize = rowVirtualizer.getTotalSize()

	// -------------------------------------





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

	const handleEditOperation = async operation => {
	// const fullOpertionData = await getOperation({ guid: operation?.guid })
	// const operatoinDto = operationDto(fullOpertionData?.data?.data)
		if (operation.tip === 'Отгрузка') {
			handleEditShipment(operation)
			return
		}
		if (operation.operationType === 'transfer') {
			setModalType('transfer')
		} else if (operation.operationType === 'pyment') {
			setModalType('payment')
		} else if (operation.operationType === 'income') {
			setModalType('income')
		} else if (operation.operationType === 'accrual') {
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

	const handleCopyOperation = async operation => {
		if (operation.tip === 'Отгрузка') {
			handleCopyShipment(operation)
			return
		}

		// const fullOpertionData = await getOperation({ guid: operation?.guid })
		// const operatoinDto = operationDto(fullOpertionData?.data?.data)
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

	const handleExportOperations = () => {
		exportOperations()
	}

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false)
		setOperationToDelete(null)
		setIsShipmentDeleting(false)
	}

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

	const handleDeleteAll = () => {

	}

	const [isImporting, setIsImporting] = useState(false)
	const [importErrorModalOpen, setImportErrorModalOpen] = useState(false)
	const [importErrorData, setImportErrorData] = useState(null)

	const handleImportOperations = () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.xlsx,.xls,.csv'
		input.onchange = async (event) => {
			const file = event.target.files?.[0]
			if (!file) return

			try {
				setIsImporting(true)

				const formData = new FormData()
				formData.append('file', file, file.name)

				const uploadResponse = await fetch(
					'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${authStore.authToken}`,
						},
						body: formData,
					},
				)

				if (!uploadResponse.ok) {
					throw new Error('Failed to upload file')
				}

				const uploadData = await uploadResponse.json()
				const fileLink = uploadData?.data?.link

				if (!fileLink) {
					throw new Error('File link not returned from upload')
				}

				const fileUrl = `https://cdn.u-code.io/${fileLink}`

				const importResult = await apiClient.invokeFunction({
					method: 'import_operations',
					data: { url: fileUrl },
				})

				const errors = importResult?.data?.errors || []
				const failedExport = importResult?.data?.failed_rows_export

				if (errors.length > 0) {
					// Show modal with error details and download option
					setImportErrorData({ errors, failedExport })
					setImportErrorModalOpen(true)
				} else {
					showSuccessNotification(t('page.importedSuccess'))
				}

				// queryClient.invalidateQueries({ queryKey: ['find_operations'] })
			} catch (error) {
				console.error('Error importing operations:', error)
				showErrorNotification(t('page.importFailed'))
			} finally {
				setIsImporting(false)
				queryClient.invalidateQueries({ queryKey: ['find_operations'] })
			}
		}
		input.click()
	}

	return (
		<div className="fixed left-[80px] top-[60px]  w-[calc(100%-80px)] flex h-[calc(100%-60px)]">
			{/* Sidebar Filters */}
			{isPendingGetOperation && <ScreenLoader />}
			<Suspense fallback={<div className="w-80 bg-white border-r border-neutral-200" />}>
				<OperationsFiltersSidebar
					isOpen={isFilterOpen}
					onClose={() => setIsFilterOpen(!isFilterOpen)}
				/>
			</Suspense>

			{/* Main Content */}
			<div className="w-full flex flex-col pb-3">
				<div className=" h-16 px-4 flex items-center justify-between bg-white ">
					<div className="flex items-center gap-4 ">
						<h1 className="text-xl font-semibold">{t('page.title')}</h1>
						{isMounted && canAdd && <button
							onClick={handleCreate}
							className="primary-btn"
						>
							{t('page.create')}
						</button>}
					</div>
					<div className=" flex items-center justify-self-center gap-2">
						<Input
							type="text"
							leftIcon={<Search size={20} />}
							placeholder={t('page.searchPlaceholder')}
							value={searchQuery}
							className="w-[300px]"
							onChange={(e) => operationFilterStore.setSearchQuery(e.target.value)}
						/>
						<button onClick={handleImportOperations} type='button' disabled={isImporting} className="primary-btn">{t('page.import')} {isImporting && <Loader2 size={16} className="animate-spin" />}</button>
						<button onClick={handleExportOperations} type='button' className="primary-btn">{t('page.export')} {isExporting && <Loader2 size={16} className="animate-spin" />}</button>
						{/* <button className=" bg-white rounded-md border  flex items-center justify-center p-2">
							<EllipsisVertical size={20} className='text-neutral-500' />
						</button> */}
					</div>
				</div>
				<div
					id="scrollableDiv"
					ref={scrollRef}
					className="overflow-auto  h-full w-full px-2 bg-white pb-10">

					<div className='flex  sticky top-0 z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
						<div className='min-w-10 py-3 flex items-center justify-center'>
							<OperationCheckbox
								checked={isAllSelected}
								onChange={toggleSelectAll}
							/>
						</div>
						{isAllSelected && selectedOperations.length > 0 && <div className="flex items-center gap-2">
							<p>{selectedOperations.length}</p>
							<button className="primary-btn">{t('page.delete')}</button>
						</div>}
						{!isAllSelected && <>
							<div className='min-w-36  pl-5 flex p-3 items-center justify-start '>
								{t('columns.date')}
							</div>
							<div className='min-w-18 max-w-52 flex-1  flex p-3 items-center justify-start '>
								{t('columns.account')}
							</div>
							{appStore.isPayment && <div className='min-w-14   flex p-3 items-center justify-center '>
								{t('columns.paymentType')}
							</div>}
							<div className='min-w-14   flex p-3 items-center justify-center '>
								{t('columns.type')}
							</div>
							<div className='min-w-20 flex-1  flex p-3 items-center justify-start '>
								{t('columns.counterparty')}
							</div>
							<div className='min-w-20 flex-1   text-start  p-3 items-center justify-start '>
								{t('columns.statya')}
							</div>
							<div className='min-w-20 flex-1  flex p-3 items-center justify-center '>
								{t('columns.deal')}
							</div>
							<div className='min-w-36  flex p-3 items-center justify-end '>
								{t('columns.amount')}
							</div>
							<div className='min-w-5  flex p-3 items-center justify-center'>
								&nbsp;
							</div>
						</>}
					</div>
					{allOperations.length === 0 && !isLoadingOperations &&
						<div className="py-20 text-center text-neutral-500 bg-white">
							{t('page.noData')}
						</div>
					}
					<InfiniteScroll
						dataLength={allOperations.length}
						hasMore={effectiveHasNextPage}
						next={safeFetchNextPage}
						scrollableTarget="scrollableDiv"
					>

						<div
							style={{ height: totalSize, position: 'relative', paddingBottom: '10px' }}
						>
							{virtualItems.map((virtualRow) => {
								const item = flatItems[virtualRow.index]

								return (
									<div
										key={virtualRow.key}
										data-index={virtualRow.index}
										ref={rowVirtualizer.measureElement}   // enables dynamic measurement
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											transform: `translateY(${virtualRow.start}px)`,
										}}
									>
										{item.type === 'header' ? (
											<div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
												<h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
													{item.label}
												</h3>
											</div>
										) : (
											<Suspense fallback={<div className="h-14 bg-white border-b border-neutral-200 animate-pulse" />}>
												<OperationTableRow
														key={item.op.guid}
														op={item.op}
														selectedOperations={selectedOperations}
														toggleOperation={toggleOperation}
														openOperationModal={openOperationModal}
														handleEditOperation={handleEditOperation}
														handleDeleteOperation={handleDeleteOperation}
														handleCopyOperation={handleCopyOperation}
													/>
											</Suspense>
										)}
									</div>
								)
							})}
						</div>
					</InfiniteScroll>

					<Suspense fallback={null}>
						<OperationsFooter totalSummary={totalSummary} isFilterOpen={isFilterOpen} />
					</Suspense>

				</div>
			</div>
			{isLoadingOperations && allOperations.length === 0 && <ScreenLoader className={'left-0!'} />}
			{(isFetchingNextPage || isFetchingOperations) && <ScreenLoader className={'left-0!'} />}


			{/* Right Side Modal */}
			{openModal && (
				<Suspense fallback={<ScreenLoader />}>
					<OperationModal
						operation={openModal}
						currentPage={currentPage}
						initialTab={modalType}
						isClosing={isModalClosing}
						isOpening={isModalOpening}
						onClose={closeOperationModal}
					/>
				</Suspense>
			)}

			{/* Delete Confirmation Modal */}
			<Suspense fallback={null}>
				<DeleteConfirmModal
					isOpen={isDeleteModalOpen}
					operation={operationToDelete}
					onConfirm={handleDeleteConfirm}
					onCancel={handleDeleteCancel}
					isDeleting={isShipmentDeleting ? isDeletingShipment : deleteOperationMutation.isPending}
				/>
			</Suspense>

			{showShipmentModal && (
				<Suspense fallback={<ScreenLoader />}>
					<CreateShipment
						open={showShipmentModal}
						onClose={() => setShowShipmentModal(false)}
						initialData={selectedShipment}
						shipmentId={selectedShipment?.guid}
						onSuccess={() => {
							setShowShipmentModal(false)
							queryClient.invalidateQueries({ queryKey: ['find_operations'] })
						}}
					/>
				</Suspense>
			)}

			{/* Import Error Modal */}
			<Suspense fallback={null}>
				<CustomDialog
					open={importErrorModalOpen}
					onClose={() => setImportErrorModalOpen(false)}
					contentClass="p-6 rounded-xl w-[400px]"
				>
					<div className="flex flex-col gap-4">
						<h2 className="text-lg font-semibold text-neutral-800">
							{t('page.importErrorTitle')}
						</h2>
						<p className="text-sm text-neutral-600">
							{t('page.importErrorDescription')}
						</p>
						{importErrorData?.errors?.length > 0 && (
							<div className="bg-red-50 p-3 rounded-md max-h-32 overflow-y-auto">
								<ul className="text-xs text-red-600 list-disc pl-4">
									{importErrorData.errors.map((error, idx) => (
										<li key={idx}>{error}</li>
									))}
								</ul>
							</div>
						)}
						<div className="flex gap-3 justify-end pt-2">
							<button
								type="button"
								onClick={() => setImportErrorModalOpen(false)}
								className="px-4 py-2 text-sm font-semibold text-sky-500 hover:bg-gray-50 rounded-md transition-colors"
							>
								{t('page.cancel')}
							</button>
							{importErrorData?.failedExport?.file_url && (
								<button
									type="button"
									onClick={() => {
										const failedFileUrl = `https://cdn.u-code.io/${importErrorData.failedExport.file_url}`
										handleDownload(failedFileUrl, importErrorData.failedExport.file_name || 'import_failed.xlsx')
									}}
									className="px-4 py-2 cursor-pointer text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
								>
									{t('page.downloadErrorFile')}
								</button>
							)}
						</div>
					</div>
				</CustomDialog>
			</Suspense>
		</div>
	)
})


export default OperationsPage