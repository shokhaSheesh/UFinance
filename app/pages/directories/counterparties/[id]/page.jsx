"use client"

import { cn } from '@/app/lib/utils'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { DeleteConfirmModal } from '@/components/operations/OperationsTable/DeleteConfirmModal'
import { useDeleteOperation, useUcodeRequestMutation } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, MoreHorizontal, PenLine, Trash2, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import OperationTableRow from '@/components/operations/TableRow/new'
import ScreenLoader from '@/components/shared/ScreenLoader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import CreateShipment from '../../../../../components/deals/details/CreatingShipment'
import OperationModal from '../../../../../components/operations/OperationModal/OperationModal'
import MultiSelectStatiya from '../../../../../components/ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '../../../../../components/ReadyComponents/MultiZdelka'
import SelectMyAccounts from '../../../../../components/ReadyComponents/SelectMyAccounts'
import { GlobalCurrency } from '../../../../../constants/globalCurrency'
import { useUcodeRequestQuery } from '../../../../../hooks/useDashboard'
import operationsDto from '../../../../../lib/dtos/operationsDto'
import { appStore } from '../../../../../store/app.store'
import { formatDate } from '../../../../../utils/formatDate'
import { formatAmount, formatNumber, formatTotalSumma } from '../../../../../utils/helpers'



const KontragentDetailPage = observer(() => {
  const t = useTranslations('Directories.counterparty.detail')
  const tc = useTranslations('Common')
  const params = useParams()
  const router = useRouter()
  const counterpartyGuid = params?.id
  const ucodeRequestMutation = useUcodeRequestMutation()

  const [filters, setFilters] = useState({
    operationDateStart: "",
    operationDateEnd: "",
    calculationMethod: "Cashflow",
    dateRange: null,
    deals: []
  })

  const getCalculationOptions = [
    { value: "Cashflow", label: t('calculationOptions.cashflow') },
    { value: "Cash", label: t('calculationOptions.cash') },
    { value: "Calculation", label: t('calculationOptions.calculation') },
  ]

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)


  const [activePopover, setActivePopover] = useState(null)
  const [isRequisitesModalOpen, setIsRequisitesModalOpen] = useState(false)
  const [isDeletingCounterparty, setIsDeletingCounterparty] = useState(false)

  // Handle click outside for dropdown and popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (!event.target.closest('.popover-container')) {
        setActivePopover(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [selectedLegalEntities, setSelectedLegalEntities] = useState([])
  const [selectedChartOfAccounts, setSelectedChartOfAccounts] = useState([])
  const [isCreateOperationModalOpen, setIsCreateOperationModalOpen] = useState(false)
  const [creatingOperation, setCreatingOperation] = useState({ isNew: true })
  const [createModalType, setCreateModalType] = useState('income')
  const [isCreateModalClosing, setIsCreateModalClosing] = useState(false)
  const [isCreateModalOpening, setIsCreateModalOpening] = useState(false)
  const [selectedOperations, setSelectedOperations] = useState([])
  const [editingOperation, setEditingOperation] = useState(null)
  const [isEditModalClosing, setIsEditModalClosing] = useState(false)
  const [isEditModalOpening, setIsEditModalOpening] = useState(false)
  const [deletingOperation, setDeletingOperation] = useState(null)
  const [isEditCounterpartyModalOpen, setIsEditCounterpartyModalOpen] = useState(false)
  const deleteOperationMutation = useDeleteOperation()


  // shipment states
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [isShipmentEditing, setIsShipmentEditing] = useState(false)
  const [isShipmentCopying, setIsShipmentCopying] = useState(false)
  const [isShipmentDeleting, setIsShipmentDeleting] = useState(false)
  const queryClient = useQueryClient()

  const filterCounterParty = useMemo(() => {
    return {
      guid: counterpartyGuid,
      operationDateStart: filters.operationDateStart,
      operationDateEnd: filters.operationDateEnd,
      calculationMethod: filters.calculationMethod,
      legal_entity_ids: selectedLegalEntities,
      chartOfAccountsIds: selectedChartOfAccounts,
      sellingDealId: filters.deals,
      page: 1
    }
  }, [counterpartyGuid, filters.operationDateStart, filters.operationDateEnd, filters.calculationMethod, selectedLegalEntities, selectedChartOfAccounts, filters.deals])

  const directoryPermissions = appStore.permission.directories
  const canEdit = directoryPermissions.counterparties.edit
  const canDelete = directoryPermissions.counterparties.delete


  // Fetch counterparty data by GUID using get_counterparty_by_id
  const { data: counterpartyData, isPending: isLoadingCounterparty } = useUcodeRequestQuery({
    method: 'get_counterparty_by_id',
    data: filterCounterParty,
    skip: !counterpartyGuid,
    querySetting: {
      refetchOnWindowFocus: false,
      staleTime: 0,
      cacheTime: 0
    }
  })

  // Response structure: { data: { data: { data: { counterparty: {...}, operations: [...] } } } }
  const responseData = counterpartyData?.data?.data
  const counterparty = responseData?.counterparty || null
  const summary = responseData?.summary || null
  const counterpartyOperations = useMemo(() => {
    return responseData?.operations || []
  }, [responseData])
  // Unified operations data from find_operations
  const operations = useMemo(() => {
    return operationsDto(counterpartyOperations || [], 'all')
  }, [counterpartyOperations])


  const operationsList = useMemo(() => {
    return {
      future: operationsDto(counterpartyOperations || [], 'future'),
      today: operationsDto(counterpartyOperations || [], 'today'),
      before: operationsDto(counterpartyOperations || [], 'before'),
    }
  }, [counterpartyOperations])


  // Format counterparty info - DECLARE FIRST
  const counterpartyInfo = useMemo(() => {
    if (!counterparty) return null


    return {
      name: counterparty.nazvanie || tc('noName'),
      fullName: counterparty.polnoe_imya || '',
      inn: counterparty.inn && counterparty.inn !== 0 ? counterparty.inn : null,
      kpp: (Array.isArray(counterparty.kpp) ? counterparty.kpp.filter(v => v !== null && v !== '') : (counterparty.kpp && counterparty.kpp !== 0 ? [counterparty.kpp] : [])),
      accountNumber: (Array.isArray(counterparty.account_number) ? counterparty.account_number.filter(v => v !== null && v !== '') : (counterparty.account_number && counterparty.account_number !== 0 ? [counterparty.account_number] : [])),
      receiptArticle: counterparty.chart_of_accounts_name || (counterparty.chart_of_accounts_id ? '-' : null),
      paymentArticle: counterparty.chart_of_accounts_name_2 || (counterparty.chart_of_accounts_id_2 ? '-' : null),
      comment: counterparty.komentariy || null,
      type: counterparty.tip || tc('noName'),
      income: counterparty.income || 0,
      expense: counterparty.expense || 0,
      difference: counterparty.difference || 0,
      guid: counterparty.guid || null,
      kreditorka: counterparty.kreditorka || 0,
      debitorka: counterparty.debitorka || 0,
      receivables: counterparty.receivables || counterparty.debitorka || 0,
      payables: counterparty.payables || counterparty.kreditorka || 0,
      operationsCount: counterparty.operations_count || 0
    }
  }, [counterparty])

  // Calculate stats from operations
  const stats = useMemo(() => {
    let receipts = 0
    let payments = 0
    let receiptsCount = 0
    let paymentsCount = 0

    operations.forEach(op => {
      const amount = op.summa || 0
      if (op.tip === 'Поступление') {
        receipts += amount
        receiptsCount++
      } else if (op.tip === 'Выплата') {
        payments += amount
        paymentsCount++
      }
    })

    const difference = receipts - payments

    return {
      receipts,
      payments,
      difference,
      receiptsCount,
      paymentsCount,
      totalCount: operations.length
    }
  }, [operations])

  const renderMultiValue = (values, type) => {
    if (!values || values.length === 0) return '–';
    if (values.length === 1) return values[0];

    return (
      <div className="relative inline-flex items-center gap-1">
        <span>{values[0]}</span>
        <button
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setActivePopover(activePopover === type ? null : type);
          }}
        >
          +{values.length - 1}
        </button>
        {activePopover === type && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">{type === 'kpp' ? t('info.additionalKpp') : t('info.additionalAccounts')}</span>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {values.slice(1).map((val, idx) => (
                <div key={idx} className="text-sm text-gray-600 py-1">{val}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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

  const handleEditOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      handleEditShipment(operation)
      return
    }
    setEditingOperation(operation)
    setIsEditModalClosing(false)
    setIsEditModalOpening(true)
    setTimeout(() => {
      setIsEditModalOpening(false)
    }, 50)
  }

  const handleCopyOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      handleCopyShipment(operation)
      return
    }
    const copiedOperation = { ...operation };

    delete copiedOperation.guid;
    delete copiedOperation.id;

    if (copiedOperation.rawData) {
      copiedOperation.rawData = { ...copiedOperation.rawData };
      delete copiedOperation.rawData.guid;
    }

    setCreatingOperation({
      ...operation,
      id: 'new',
      isNew: true,
      isCopy: true
    })

    let modalType = 'payment'
    if (operation.tip === 'Перемещение') {
      modalType = 'transfer'
    } else if (operation.tip === 'Выплата') {
      modalType = 'payment'
    } else if (operation.tip === 'Поступление') {
      modalType = 'income'
    } else if (operation.tip === 'Начисление') {
      modalType = 'accrual'
    }

    setCreateModalType(modalType)
    setIsCreateOperationModalOpen(true)
    setIsCreateModalClosing(false)
    setIsCreateModalOpening(true)

    setTimeout(() => {
      setIsCreateModalOpening(false)
    }, 50)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalClosing(true)
    setTimeout(() => {
      setIsCreateOperationModalOpen(false)
      setIsCreateModalClosing(false)
      setIsCreateModalOpening(false)
      setCreatingOperation({ isNew: true })
      setCreateModalType('income')
    }, 300)
  }

  const handleCloseEditModal = () => {
    setIsEditModalClosing(true)
    setTimeout(() => {
      setEditingOperation(null)
      setIsEditModalClosing(false)
      setIsEditModalOpening(false)
    }, 300)
  }

  const handleDeleteOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      handleDeleteShipment(operation)
      return
    }
    setDeletingOperation(operation)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOperation) return

    try {
      const guid = deletingOperation.rawData?.guid || deletingOperation.guid
      if (!guid) {
        throw new Error('GUID операции не найден')
      }

      await deleteOperationMutation.mutateAsync([guid])
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      setDeletingOperation(null)
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }

  const handleDeleteCounterparty = async () => {
    setIsDropdownOpen(false)
    try {
      setIsDeletingCounterparty(true)
      await ucodeRequestMutation.mutateAsync({
        method: 'delete_counterparty',
        data: { guid: counterpartyGuid }
      })
      router.push('/pages/directories/counterparties')
    } catch (error) {
      console.error('Error deleting counterparty:', error)
      setIsDeletingCounterparty(false)
    }
  }



  // Close modals when clicking on page header
  useEffect(() => {
    const handleHeaderClick = (e) => {
      const header = document.querySelector('header')
      if (header && header.contains(e.target)) {
        if (isCreateOperationModalOpen) {
          handleCloseCreateModal()
        }
        if (editingOperation) {
          handleCloseEditModal()
        }
      }
    }

    document.addEventListener('click', handleHeaderClick)
    return () => document.removeEventListener('click', handleHeaderClick)
  }, [isCreateOperationModalOpen, editingOperation])



  const hasInfo = counterpartyInfo?.inn === null && counterpartyInfo?.kpp?.length === 0 && counterpartyInfo?.accountNumber?.length === 0 && counterpartyInfo?.receiptArticle === null && counterpartyInfo?.paymentArticle === null && counterpartyInfo?.comment === null

  return (
    <div className="fixed h-[calc(100vh-60px)]  top-[60px] left-[80px] right-0 bottom-0 overflow-y-auto">

      {isLoadingCounterparty && <ScreenLoader />}
      {!counterparty && <div className="fixed h-[calc(100vh-60px)] top-[60px] left-[80px] right-0 bottom-0 overflow-y-auto">
        <div className="flex-1 h-full flex flex-col">
          <div className="p-8 text-center text-gray-500">{t('notFound')}</div>
        </div>
      </div>}

      {isDeletingCounterparty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-white font-medium">{t('actions.deleting')}</span>
          </div>
        </div>
      )}
      <div className="flex-1 h-full flex flex-col">
        {/* Breadcrumbs */}
        <div className="flex items-center px-3 bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center text-xs h-10">
            <Link href="/pages/directories/counterparties" className="text-gray-500 hover:text-gray-700 transition-colors">
              {t('backToList')}
            </Link>
            <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
            <span className="text-neutral-900 text-sm font-medium">{counterpartyInfo?.name || tc('noName')}</span>
          </div>
        </div>

        {/* Header with kontragent info */}
        <div className="bg-slate-50 px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-6 mb-5">
            <h1 className="text-2xl font-bold text-slate-900">{counterpartyInfo?.name || 'Контрагент'}</h1>
            <div className="flex items-center gap-3 flex-1">
              <div style={{ width: '250px' }}>
                <NewDateRangeComponent
                  value={filters.dateRange}
                  onChange={(range) => {
                    const startDate = range?.start ? formatDate(new Date(range.start)) : ''
                    const endDate = range?.end ? formatDate(new Date(range.end)) : ''
                    setFilters((prev) => ({
                      ...prev,
                      operationDateStart: startDate,
                      operationDateEnd: endDate,
                      dateRange: range,
                    }))
                  }}
                />
              </div >
              <div style={{ width: '250px' }}>
                <SingleSelect
                  data={getCalculationOptions}
                  value={filters?.calculationMethod || 'Cashflow'}
                  onChange={(selected) =>
                    setFilters(prev => ({ ...prev, calculationMethod: selected }))}
                  placeholder={tc('placeholders.select')}
                  isClearable={false}
                  withSearch={false}
                />
              </div>
            </div>
            {/* dots button */}
            <div className="relative" ref={dropdownRef}>
              {canEdit && canDelete && <button
                className={cn(
                  'flex items-center justify-center w-[38px] h-[38px] rounded-md border border-gray-300 bg-white text-slate-500 cursor-pointer transition-all hover:bg-slate-100 hover:border-gray-400',
                  isDropdownOpen && 'bg-slate-100 border-gray-400'
                )}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <MoreHorizontal size={20} />
              </button>}

              {isDropdownOpen && (
                <div className="absolute top-full right-0 w-[220px] bg-white border border-gray-300 rounded shadow-md z-50 py-1 flex flex-col">
                  {canEdit && <button className="flex items-center px-4 py-3 text-sm text-slate-900 bg-none border-none cursor-pointer w-full text-left transition-colors hover:bg-slate-100" onClick={() => {
                    setIsDropdownOpen(false)
                    setIsEditCounterpartyModalOpen(true)
                  }}>
                    <PenLine size={18} className="mr-3 text-slate-700 cursor-pointer" />
                    {tc('edit')}
                  </button>}
                  <button className="flex items-center px-4 py-3 text-sm text-red-500 bg-none border-none cursor-pointer w-full text-left transition-colors hover:bg-red-50" onClick={handleDeleteCounterparty}>
                    <Trash2 size={18} className="mr-3 text-red-500" />
                    {tc('delete')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex gap-4">
            {/* Left Card - Financial Stats */}
            <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 min-w-[200px]">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                    <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.receipts') : t('stats.income')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {formatAmount(counterpartyInfo?.income)}
                    <span className="text-base ml-2 text-slate-500">{GlobalCurrency.name}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.payments') : t('stats.expenses')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {formatAmount(counterpartyInfo?.expense)}
                    <span className="text-base ml-2 text-slate-500">{GlobalCurrency.name}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", stats.difference >= 0 ? 'bg-emerald-500' : 'bg-red-500')}></div>
                    <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.difference') : t('stats.profit')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {formatAmount(counterpartyInfo?.difference)}
                    <span className="text-base ml-2 text-slate-500">{GlobalCurrency.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Debit and Credit stacked */}
            <div className="flex flex-col gap-4 min-w-[180px]">
              {/* Debit Card */}
              <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 flex-1">
                <div className="text-sm text-slate-700 font-medium mb-1.5">{t('stats.receivables')}</div>
                <div className="text-xs text-slate-500">
                  {counterpartyInfo?.debitorka ? formatNumber(formatTotalSumma(counterpartyInfo.debitorka)) : t('stats.noDebt')}
                </div>
              </div>

              {/* Credit Card */}
              <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 flex-1">
                <div className="text-sm text-slate-700 font-medium mb-1.5">{t('stats.payables')}</div>
                <div className="text-xs text-slate-500">
                  {counterpartyInfo?.kreditorka ? formatNumber(formatTotalSumma(counterpartyInfo.kreditorka)) : t('stats.noDebt')}
                </div>
              </div>
            </div>

            {/* Right Card - Additional Info in two-column format */}
            <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-base font-semibold text-slate-900">{counterpartyInfo?.name || tc('noName')}</h1>
                <PenLine size={12} className="text-slate-700 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setIsEditCounterpartyModalOpen(true)} />
              </div>
              <div className="h-px bg-gray-200 mb-4"></div>
              {hasInfo ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                  <span className="text-xs text-slate-400 text-center">{t('info.noRequisites')}</span>
                  <button className="flex items-center gap-2 px-5 py-2 text-xs text-slate-600 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm" onClick={() => setIsEditCounterpartyModalOpen(true)}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="9" r="8" stroke="#6b7280" strokeWidth="1.2" />
                      <path d="M9 5.5V12.5M5.5 9H12.5" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    {t('info.addRequisites')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.inn')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{counterpartyInfo?.inn || '–'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.receiptArticle')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{counterpartyInfo?.receiptArticle || '–'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.kpp')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{renderMultiValue(counterpartyInfo?.kpp, 'kpp')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.paymentArticle')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{counterpartyInfo?.paymentArticle || '–'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.accountNumber')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{renderMultiValue(counterpartyInfo?.accountNumber, 'accountNumber')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-normal flex-shrink-0">{t('info.comment')}</span>
                      <span className="text-sm text-slate-900 font-normal flex items-center">{counterpartyInfo?.comment || '–'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Operations Section */}
        <div className="flex-1 bg-white">
          <div className="p-4">
            <div id='operation_filter_section' className={"mb-3 sticky min-h-14  max-h-28 top-10 z-20 bg-white "}>
              <div className="flex py-3 items-center gap-3">
                <h2 className="text-xl font-medium">{t('operationsTitle')}</h2>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setCreatingOperation({ isNew: true })
                    setCreateModalType('income')
                    setIsCreateOperationModalOpen(true)
                    setIsCreateModalClosing(false)
                    setIsCreateModalOpening(true)
                    setTimeout(() => {
                      setIsCreateModalOpening(false)
                    }, 50)
                  }}
                >
                  {t('createOperation')}
                </button>
                <button
                  className="secondary-btn flex items-center gap-2 text-primary!"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                  {t('filters')}
                  <ChevronDown className='w-4 h-4' />
                </button>
              </div>
              {/* Filters Panel */}
              {isFiltersOpen && (
                <div className='flex items-center gap-3 mb-3 pb-2'>
                  <div className="w-48">
                    <SelectMyAccounts
                      value={selectedLegalEntities}
                      onChange={setSelectedLegalEntities}
                      placeholder={tc('placeholders.selectLegalEntity')}
                      className={'bg-white'}
                      dropdownClassName={'w-64'}
                    />
                  </div>
                  <div className="w-48 flex items-center">
                    <MultiSelectStatiya
                      value={selectedChartOfAccounts}
                      onChange={setSelectedChartOfAccounts}
                      placeholder={tc('placeholders.selectStatii')}
                      className={'bg-white'}
                      dropdownClassName={'w-64'}
                    />
                  </div>
                  <div className="w-48 flex items-center">
                    <MultiSelectZdelka
                      value={filters.deals}
                      onChange={(values) => setFilters(prev => ({ ...prev, deals: values }))}
                      placeholder={tc('placeholders.selectDeals')}
                      className={'bg-white'}
                    />
                  </div>
                </div>
              )}
              <div>
                <div className='flex z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
                  <div className='min-w-36 pl-5 flex p-3 items-center justify-start'>
                    {t('table.date')}
                  </div>
                  <div className='min-w-18 max-w-52 flex-1 flex p-3 items-center justify-start'>
                    {t('table.account')}
                  </div>
                  <div className='min-w-14 flex p-3 items-center justify-center'>
                    {t('table.type')}
                  </div>
                  <div className='min-w-20 flex-1 flex p-3 items-center justify-start'>
                    {t('table.counterparty')}
                  </div>
                  <div className='min-w-20 flex-1 text-start p-3 items-center justify-start'>
                    {t('table.article')}
                  </div>
                  <div className='min-w-20 flex-1 flex p-3 items-center justify-center'>
                    {t('table.deal')}
                  </div>
                  <div className='min-w-36 flex p-3 items-center justify-end'>
                    {t('table.amount')}
                  </div>
                  <div className='min-w-5 flex p-3 items-center justify-center'>
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>



            {!isLoadingCounterparty && operations.length === 0 ? (
              <div className="">
                <div className="">
                  <div className="text-center">
                    <div className="text-2xl font-medium">{t('empty.title')}</div>
                    <div className="text-lg text-gray-500">{t('empty.description')}</div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="pb-56">
                  {/* Table Header */}


                  <div className="pb-4">
                    {operationsList?.future?.length > 0 && (
                      <div className="border-y border-y-gray-100 bg-white py-2 text-sm px-4">
                        <h3 className="font-medium">{t('sections.future')}</h3>
                      </div>
                    )}

                    {operationsList?.future?.map((op) => (
                      <OperationTableRow
                        key={op.guid}
                        op={op}
                        selectedOperations={selectedOperations}
                        openOperationModal={handleEditOperation}
                        counterpartyGuid={counterpartyInfo?.guid}
                        handleEditOperation={handleEditOperation}
                        handleDeleteOperation={handleDeleteOperation}
                        handleCopyOperation={handleCopyOperation}
                      />
                    ))}

                    {/* Today — Section Header */}
                    {operationsList?.today?.length > 0 && (
                      <div className="border-y border-y-gray-100 bg-white py-2 text-sm px-4">
                        <h3 className="font-medium">{t('sections.today')}</h3>
                      </div>
                    )}

                    {operationsList?.today?.map((op) => (
                      <OperationTableRow
                        key={op.guid}
                        op={op}
                        selectedOperations={selectedOperations}
                        openOperationModal={handleEditOperation}
                        counterpartyGuid={counterpartyInfo?.guid}
                        handleEditOperation={handleEditOperation}
                        handleDeleteOperation={handleDeleteOperation}
                        handleCopyOperation={handleCopyOperation}
                      />
                    ))}

                    {/* Вчера и ранее - Section Header */}
                    {operationsList?.before?.length > 0 && (
                      <div className="border-y border-y-gray-100 bg-white py-2 text-sm px-4">
                        <h3 className="font-medium">{t('sections.before')}</h3>
                      </div>
                    )}
                    {operationsList?.before?.map((op) => (
                      <OperationTableRow
                        key={op.guid}
                        op={op}
                        selectedOperations={selectedOperations}
                        openOperationModal={handleEditOperation}
                        counterpartyGuid={counterpartyInfo?.guid}
                        handleEditOperation={handleEditOperation}
                        handleDeleteOperation={handleDeleteOperation}
                        handleCopyOperation={handleCopyOperation}
                      />
                    ))}
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 w-full h-10 bg-neutral-100 border-t border-gray-200 flex items-center justify-start px-6">
          <div className="flex items-center gap-4 text-xss">
            <span className="text-xs text-gray-600">
              <span className="font-semibold text-slate-900">{summary?.total}</span> {summary?.total === 1 ? t('footer.operations') : summary?.total < 5 ? t('footer.operationsPlural') : t('footer.operationsPluralMany')}
            </span>
            {stats.receiptsCount > 0 && (
              <span className="text-xs text-gray-600">
                {stats.receiptsCount} {stats.receiptsCount === 1 ? t('footer.receipts') : stats.receiptsCount < 5 ? t('footer.receiptsPlural') : t('footer.receiptsPluralMany')}: <span className="font-semibold text-slate-900">{formatAmount(summary?.incoming)} {GlobalCurrency.name}</span>
              </span>
            )}
            {stats.paymentsCount > 0 && (
              <span className="text-xs text-gray-600">
                {stats.paymentsCount} {stats.paymentsCount === 1 ? t('footer.payments') : stats.paymentsCount < 5 ? t('footer.paymentsPlural') : t('footer.paymentsPluralMany')}: <span className="font-semibold text-slate-900">{formatAmount(summary?.outgoing)} {GlobalCurrency.name}</span>
              </span>
            )}
            <span className="text-xs text-gray-600">
              {t('footer.total')}: <span className={cn('font-semibold', summary?.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {summary?.profit >= 0 ? '+' : ''}{formatAmount(summary?.profit || 0)} {GlobalCurrency.name}
              </span>
            </span>
          </div>
        </div>
      </div>



      {/* Create Operation Modal */}
      {isCreateOperationModalOpen && (
        <OperationModal
          operation={creatingOperation}
          initialTab={createModalType}
          isClosing={isCreateModalClosing}
          isOpening={isCreateModalOpening}
          chart_of_accounts_id={counterparty?.chart_of_accounts_id}
          chart_of_accounts_id_2={counterparty?.chart_of_accounts_id_2}
          onClose={handleCloseCreateModal}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })}
          preselectedCounterparty={counterpartyGuid}
          disableCounterpartySelect={true}
        />
      )}

      {/* Edit Operation Modal */}
      {editingOperation && (
        <OperationModal
          operation={editingOperation}
          initialTab={editingOperation?.tip === 'Поступление' ? 'income' : editingOperation?.tip === 'Выплата' ? 'payment' : editingOperation?.tip === 'Перемещение' ? 'transfer' : 'accrual'}
          isClosing={isEditModalClosing}
          isOpening={isEditModalOpening}
          chart_of_accounts_id={counterparty?.chart_of_accounts_id}
          chart_of_accounts_id_2={counterparty?.chart_of_accounts_id_2}
          onClose={handleCloseEditModal}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })}
          preselectedCounterparty={counterpartyGuid}
          disableCounterpartySelect={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOperation && (
        <DeleteConfirmModal
          isOpen={!!deletingOperation}
          operation={deletingOperation}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingOperation(null)}
          isDeleting={deleteOperationMutation.isPending}
        />
      )}

      {/* Requisites Modal */}
      {isRequisitesModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsRequisitesModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-slate-900">{t('info.title')} «{counterpartyInfo?.name}»</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsRequisitesModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 font-medium">{tc('placeholders.selectCounterparty')}</div>
                <div className="text-sm text-slate-900">{counterpartyInfo?.fullName || ''}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 font-medium">{t('info.inn')}</div>
                <div className="text-sm text-slate-900">{counterpartyInfo?.inn || ''}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-slate-500 font-medium">{t('info.kpp')}</div>
                  <div className="text-sm text-slate-900">
                    {counterpartyInfo?.kpp?.length > 0 ? counterpartyInfo.kpp[0] : ''}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-slate-500 font-medium">{t('info.additionalKpp')}</div>
                  <div className="space-y-1">
                    {counterpartyInfo?.kpp?.length > 1 ? counterpartyInfo.kpp.slice(1).map((val, i) => (
                      <div key={i} className="text-sm text-slate-900">{val}</div>
                    )) : ''}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-slate-500 font-medium">{t('info.accountNumber')}</div>
                  <div className="text-sm text-slate-900">
                    {counterpartyInfo?.accountNumber?.length > 0 ? counterpartyInfo.accountNumber[0] : ''}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-slate-500 font-medium">{t('info.additionalAccounts')}</div>
                  <div className="space-y-1">
                    {counterpartyInfo?.accountNumber?.length > 1 ? counterpartyInfo.accountNumber.slice(1).map((val, i) => (
                      <div key={i} className="text-sm text-slate-900">{val}</div>
                    )) : '–'}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors" onClick={() => setIsRequisitesModalOpen(false)}>
                {tc('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShipmentModal && (
        <CreateShipment
          open={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          initialData={selectedShipment}
          isEditing={isShipmentEditing}
          isCopying={isShipmentCopying}
          dealName={selectedShipment?.selling_deal_name}
          dealGuid={selectedShipment?.selling_deal_id}
          kontragentId={counterparty?.guid}
        />
      )}

      {/* Unified Create/Edit Modal */}
      <CreateCounterpartyModal
        isOpen={isEditCounterpartyModalOpen}
        onClose={() => setIsEditCounterpartyModalOpen(false)}
        onSuccess={() => {
          setIsEditCounterpartyModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })
        }}
        counterpartyData={counterparty}
      />
    </div>
  )
})

export default KontragentDetailPage
