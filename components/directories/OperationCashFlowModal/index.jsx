import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { useUcodeRequestInfinite } from '../../../hooks/useDashboard'
import operationsDto from '../../../lib/dtos/operationsDto'
import { queryClient } from '../../../lib/queryClient'
import { operationFilterStore } from '../../../store/operationFilter.store'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import CustomDialog from '../../shared/CustomDialog'
import IncomePaymentTableRow from './CashFlowTablesRows/IncomePaymentRow'

const OperationCashFlowModal = observer(({
  isOpen,
  onClose,
  filterData,
  title,
  isTransfer,
  dateRange,
  summaryData
}) => {
  const t = useTranslations('OperationCashFlowModal')
  const tableRef = useRef(null)
  const router = useRouter()


  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    isFetching,
    isPending,
    hasNextPage,
    fetchNextPage,
  } = useUcodeRequestInfinite({
    method: 'list_operations_by_query',
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

  const totalValue = useMemo(() => {
    const totals = infiniteData?.pages?.[0]?.data?.totalSummary?.by_type || null
    return infiniteData?.pages?.[0]?.data?.totalSummary?.net_cash_flow || totals?.accural?.total_summa || totals?.payment?.total_summa || totals?.receipt?.total_summa || totals?.shipment?.total_summa || totals?.supply?.total_summa || totals?.shipment?.total_summa
  }, [infiniteData])


  const operationsPeriod = useMemo(() => {
    return <p className='text-neutral-600'>
      {moment(dateRange?.start).format("DD MMM, 'YY")}
      <span className='mx-4'>-</span>
      {moment(dateRange?.end).format("DD MMM, 'YY")}
    </p>
  }, [dateRange])

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

  const handleNavigateOperations = () => {
    operationFilterStore.setAutoFilter(filterData)
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
    if (typeof window !== 'undefined') {
      window.open('/operations', '_blank')
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={onClose} contentClass=" p-0" className=" p-0">
      <div className='w-[900px]!'>
        {/* Header */}
        <div className="text-lg font-semibold p-6 border-b">
          {title || t('title')}
        </div>

        {/* Summary */}
        <div className="flex flex-col bg-neutral-50 py-4 border-b px-6 gap-2">
          <div className="flex text-sm items-center gap-10">
            <span className=" font-medium">{t('reportPeriod')}</span>
            {operationsPeriod && <span className="">{operationsPeriod}</span>}
          </div>
          <div className="flex text-sm items-center gap-10">
            <span className=" font-medium">{t('operationsSum')}</span>
            {summaryData && <div className="flex items-center gap-1">
              <span>{(title === 'Списания' || title === '') ? "-" : ""}{totalValue !== undefined ? formatNumber(formatTotalSumma(totalValue)) : ''}</span>
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
                  <th className="min-w-32! px-4 text-start">{t('date')}</th>
                  <th className=" px-4 text-center">{t('type')}</th>
                  <th className="min-w-44! px-2 text-start">{isTransfer ? t('from') : t('counterparty')}</th>
                  <th className=" px-2 text-start">{isTransfer ? t('to') : t('article')}</th>
                  <th className=" px-4 text-end">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {(!operationsList?.before?.length && !operationsList?.today?.length && !operationsList?.future?.length) ? (
                  <tr>
                    <td colSpan={5} className="">{t('noData')}</td>
                  </tr>
                ) : (
                  <>
                    {operationsList?.future?.length > 0 && (
                      <tr className=" border-y border-y-gray-100 bg-neutral-50">
                        <td colSpan='5' className=" py-1 text-xs px-4">
                          <h3 className="">{t('after')}</h3>
                        </td>
                      </tr>
                    )}
                    {operationsList?.future?.map(op => <IncomePaymentTableRow key={op.id} op={op} tip={title} />)}

                    {operationsList?.today?.length > 0 && (
                      <tr className=" border-y border-y-gray-100 bg-neutral-50">
                        <td colSpan='5' className=" py-1 text-xs px-4">
                          <h3 className="">{t('today')}</h3>
                        </td>
                      </tr>
                    )}
                    {operationsList?.today?.map(op => <IncomePaymentTableRow key={op.id} op={op} tip={title} />)}

                    {operationsList?.before?.length > 0 && (
                      <tr className=" border-y border-y-gray-100 bg-neutral-50">
                        <td colSpan='5' className=" py-1 text-xs px-4">
                          <h3 className="">{t('before')}</h3>
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
        <div className="p-2 px-4 h-20 flex justify-between gap-3 items-center border-t">
          <span onClick={handleNavigateOperations} className='text-sm cursor-pointer text-primary font-medium'>{t('openInOperations')}</span>
          <button onClick={onClose} className="primary-btn px-6! py-3!">
            {t('close')}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
})

export default OperationCashFlowModal

