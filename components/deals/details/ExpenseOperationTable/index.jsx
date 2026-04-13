'use client'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { formatAmount } from '@/utils/helpers'
import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import { useDeleteOperation, useUcodeRequestQuery } from '../../../../hooks/useDashboard'
import operationsDto from '../../../../lib/dtos/operationsDto'
import CustomModal from '../../../shared/CustomModal'

import { GlobalCurrency } from '../../../../constants/globalCurrency'
import { CreditIcon, DebitIcon } from '../../../../constants/icons'
import EmptyState from '../EmptyState'

/* ─── Main table component ────────────────────────────────── */
const ExpenseOperationsTable = ({ sellingDealId, onAdd }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [modalType, setModalType] = useState('income')
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [isModalOpening, setIsModalOpening] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [operationToDelete, setOperationToDelete] = useState(null)
  const deleteOperationMutation = useDeleteOperation()
  const queryClient = useQueryClient()

  const { data: operations, isLoading } = useUcodeRequestQuery({
    method: "find_operations",
    data: {
      selling_deal_ids: [sellingDealId],
      tip: ["Выплата", "Списание", "Зачисление", "Перемещение", "Отгрузка", "Дебет", "Кредит", "Начисление"],
      accrualConfirmed: true,
      accrualNotConfirmed: true,
      paymentConfirmed: true,
      paymentNotConfirmed: true,
    },
    querySetting: {
      select: (response) => response?.data,
      placeholderData: keepPreviousData,
    }
  })

  const dealOperations = useMemo(() => {
    return operationsDto(operations?.data)
  }, [operations])

  const summury = useMemo(() => {
    return operations?.totalSummary?.by_type?.payment
  }, [operations])


  if (dealOperations?.length === 0) {
    return (
      <EmptyState
        title="Добавьте расходы по сделке"
        subtitle="Учитывайте расходы по сделке, чтобы контролировать финансовый результат"
        onAdd={onAdd}
      />
    )
  }

  const handleEditOperation = (operation) => {
    setSelectedOperation(operation)
    setModalType('payment')
    setShowModal(true)
    setIsModalClosing(false)
    setIsModalOpening(true)
    setTimeout(() => setIsModalOpening(false), 50)
  }

  const handleCopyOperation = (operation) => {
    const copiedOperation = { ...operation }
    delete copiedOperation.guid
    delete copiedOperation.id
    if (copiedOperation.rawData) {
      copiedOperation.rawData = { ...copiedOperation.rawData }
      delete copiedOperation.rawData.guid
    }

    setSelectedOperation({
      ...copiedOperation,
      id: 'new',
      isNew: true,
      isCopy: true
    })
    setModalType('payment')
    setShowModal(true)
    setIsModalClosing(false)
    setIsModalOpening(true)
    setTimeout(() => setIsModalOpening(false), 50)
  }

  const handleDeleteOperation = (operation) => {
    setOperationToDelete(operation)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return
    const guid = operationToDelete.rawData?.guid || operationToDelete.guid
    if (!guid) return

    try {
      await deleteOperationMutation.mutateAsync([guid])
      setIsDeleteModalOpen(false)
      setOperationToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['find_operations'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }

  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }



  return (
    <>
      {/* emptyState div is moved to top EmptyState component */}
      {dealOperations?.length > 0 && <>
        <div className="h-96 overflow-y-auto">
          <table className="w-full">
            <thead className='sticky top-0 z-10'>
              <tr className='bg-neutral-100 text-neutral-600 font-normal text-xs w-full border-b border-gray-200'>
                <th className='px-3 py-2 text-left w-[150px]'>Дата</th>
                <th className='px-3 py-2 text-left w-[150px]'>Счет</th>
                <th className='px-3 py-2 text-left w-[150px]'>Контрагент</th>
                <th className='px-3 py-2 text-left w-[150px]'>Статья</th>
                <th className='px-3 py-2 text-right w-[150px]'>Сумма</th>
              </tr>
            </thead>
            <tbody className='w-full'>
              {dealOperations?.map((item) => {
                const isDebit = item.tip === 'Выплата' && item.payment_confirmed && !item.payment_accrual;

                const isCredit = item.tip === 'Выплата' && !item.payment_confirmed && item.payment_accrual;
                const isActive = !item?.payment_confirmed && !item?.payment_accrual
                return (
                  <tr key={item?.guid} className="bg-white hover:bg-gray-50 text-xs font-normal group text-neutral-900 cursor-pointer border-b group border-gray-200">
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.operationDate}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.my_account_name}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item?.tip === "Начисление" ? '[Начисление]' : item.counterparty}</td>
                    <td className={`p-3 text-left ${isActive ? 'active-row' : ''}`}>{item.chartOfAccounts}</td>
                    <td className={`p-3 text-right w-40`}>
                      <div className="flex items-center justify-end gap-2 h-6">
                        <div className="flex items-center gap-1">
                          <span className='flex items-center gap-1'>{isDebit && <DebitIcon />}
                            {isCredit && <CreditIcon />}</span>
                          <p className={`font-base text-red-600`}>
                            {'-'}{formatAmount(item.summa)} {item.currency}
                          </p>
                        </div>
                        <div className=' items-center  hidden group-hover:flex '>
                          <button onClick={(e) => { e.stopPropagation(); handleEditOperation(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                            <MdOutlineModeEdit size={16} className='text-gray-400' />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleCopyOperation(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                            <IoCopyOutline size={16} className='text-gray-400' />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteOperation(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                            <IoCloseOutline size={16} className='text-gray-400' />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className='flex justify-end'>
          <div className="p-4 text-right text-neutral-700 font-semibold">Итого:</div>
          <div className={`p-4 text-right font-semibold text-red-600`}>{'-'}{formatAmount(summury?.total_summa)} {GlobalCurrency.name}</div>
        </div>
      </>}

      {showModal && (
        <OperationModal
          operation={selectedOperation}
          isClosing={isModalClosing}
          isOpening={isModalOpening}
          defaultDealGuid={sellingDealId}
          onClose={() => {
            setIsModalClosing(true)
            setTimeout(() => {
              setShowModal(false)
              setIsModalClosing(false)
            }, 300)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
            setShowModal(false)
          }}
          initialTab={modalType}
        />
      )}

      {isDeleteModalOpen && (
        <CustomModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
          <div className='p-6 flex flex-col'>
            <div className='flex justify-between items-center border-b border-gray-100 pb-4'>
              <h2 className='text-xl font-bold text-neutral-800'>Удалить операцию</h2>
            </div>

            <div className='py-6 text-base text-neutral-700'>
              Вы действительно хотите удалить операцию на сумму <span className='font-bold'>{formatAmount(operationToDelete?.summa)} UZS</span>? <br />
              Восстановить её будет невозможно.
            </div>

            <div className='flex justify-end gap-4'>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className='px-4 py-2 text-sm text-primary hover:bg-gray-50 rounded-md font-semibold'
              >
                Отменить
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteOperationMutation.isPending}
                className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md flex items-center justify-center min-w-[100px]'
              >
                {deleteOperationMutation.isPending ? <Loader2 className='animate-spin h-4 w-4' /> : 'Удалить'}
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </>
  )
}

export default ExpenseOperationsTable
