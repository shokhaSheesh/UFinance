import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { useUcodeRequestInfinite } from '../../../hooks/useDashboard'
import operationsDto from '../../../lib/dtos/operationsDto'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import CustomModal from '../../shared/CustomModal'
import IncomePaymentTableRow from './CashFlowTablesRows/IncomePaymentRow'

const OperationCashFlowModal = observer(({
  isOpen,
  onClose,
  filterData,
  title,
  isTransfer,
  summaryData
}) => {
  const tableRef = useRef(null)


  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    isFetching,
    isPending,
    hasNextPage,
    fetchNextPage,
  } = useUcodeRequestInfinite({
    method: 'find_operations',
    data: filterData, 
    querySetting: {
      enabled: isOpen,
      select: (response) => response,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  })

  // Flatten all pages into a single array
  const allOperations = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
  }, [infiniteData])

  const operationsList = useMemo(() => {
    return {
      future: operationsDto(allOperations, 'future'),
      today: operationsDto(allOperations, 'today'),
      before: operationsDto(allOperations, 'before'),
    }
  }, [allOperations])

  const operationsPeriod = useMemo(() => {
    if (filterData?.paymentDateStart && filterData?.paymentDateEnd) {
      return <p className='text-neutral-600'>
        {moment(filterData?.paymentDateStart).format("DD MMM, 'YY")}
        <span className='mx-4'>-</span>
        {moment(filterData?.paymentDateEnd).format("DD MMM, 'YY")}
      </p>
    }
    return ''
  }, [filterData])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = tableRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  console.log('allOperations', allOperations)

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} className="w-[800px] p-0">

      {/* Header */}
      <div className="text-lg font-semibold p-6 border-b">
        {title || 'Операции'}
      </div>

      {/* Summary */}
      <div className="flex flex-col bg-neutral-50 py-4 border-b px-6 gap-2">
        <div className="flex text-sm items-center gap-10">
          <span className=" font-medium">Период отчета</span>
          {operationsPeriod && <span className="">{operationsPeriod}</span>}
        </div>
        <div className="flex text-sm items-center gap-10">
          <span className=" font-medium">Сумма операций</span>
          {summaryData && <div className="flex items-center gap-1">
            <span>{title === 'Списания' ? "-" : ""}{summaryData?.totalAmount !== undefined ? formatNumber(formatTotalSumma(summaryData?.totalAmount)) : ''}</span>
            <span>{summaryData?.currencyCode || GlobalCurrency.code}</span>
          </div>}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto h-[400px]" ref={tableRef}>
        {(isLoading || isFetching || isPending) && (
          <div className='w-full h-full flex items-center justify-center'>
            <Loader2 className='animate-spin text-primary' size={30} />
          </div>
        )
        }
        {allOperations?.length > 0 && (
          <table className="w-full relative">
            <thead className="sticky top-0 z-10 h-10 bg-neutral-50 border-b box-content border-gray-300">
              <tr className='text-xs text-neutral-600 '>
                <th className=" px-4 text-start">Дата ▾</th>
                <th className=" px-4 text-center">Тип</th>
                <th className=" px-2 text-start">{isTransfer ? 'Откуда' : 'Контрагент'}</th>
                <th className=" px-2 text-start">{isTransfer ? 'Куда' : 'Статья'}</th>
                <th className=" px-4 text-end">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {(!operationsList?.before?.length && !operationsList?.today?.length && !operationsList?.future?.length) ? (
                <tr>
                  <td colSpan={5} className="">Нет данных</td>
                </tr>
              ) : (
                <>
                  {operationsList?.future?.length > 0 && (
                    <tr className=" border-y border-y-gray-100 bg-neutral-50">
                      <td colSpan='5' className=" py-1 text-xs px-4">
                        <h3 className="">После</h3>
                      </td>
                    </tr>
                  )}
                  {operationsList?.future?.map(op => <IncomePaymentTableRow key={op.id} op={op} tip={title} />)}

                    {operationsList?.today?.length > 0 && (
                      <tr className=" border-y border-y-gray-100 bg-neutral-50">
                        <td colSpan='5' className=" py-1 text-xs px-4">
                          <h3 className="">Сегодня</h3>
                        </td>
                      </tr>
                    )}
                    {operationsList?.today?.map(op => <IncomePaymentTableRow key={op.id} op={op} tip={title} />)}

                    {operationsList?.before?.length > 0 && (
                      <tr className=" border-y border-y-gray-100 bg-neutral-50">
                        <td colSpan='5' className=" py-1 text-xs px-4">
                          <h3 className="">До</h3>
                        </td>
                      </tr>
                    )}
                    {operationsList?.before?.map(op => <IncomePaymentTableRow key={op.id} op={op} tip={title} />)}

                  {/* Bottom loader for next page */}
                  {isFetchingNextPage && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center">
                        <Loader2 className='animate-spin text-primary inline-block' size={22} />
                      </td>
                    </tr>
                  )}
                </>
              )}

            </tbody>
          </table>
        )}

      </div>

      {/* Footer */}
      <div className="p-2 h-20 flex justify-end gap-3 items-center border-t">
        <button onClick={onClose} className="primary-btn px-6! py-3!">
          Закрыть
        </button>
      </div>
    </CustomModal>
  )
})

export default OperationCashFlowModal

