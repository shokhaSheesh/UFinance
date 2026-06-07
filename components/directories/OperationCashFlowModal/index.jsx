import { useScrollDetector } from '@/hooks/useScrollDetector'
import { apiClient } from '@/lib/api/ucode/base'
import { buildFlatItems } from '@/modules/operations/utils/operationsUtils'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useTranslations } from 'next-intl'
import { Suspense, useMemo } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
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
  dateRange,
}) => {
  const t = useTranslations('OperationCashFlowModal')
  const to = useTranslations('Operations')


  const {
    data: infiniteData,
    isLoading: isLoadingOperations,
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

  const { data: operationsTotal } = useQuery({
    queryKey: ['get_operations_total', filterData],
    queryFn: () => apiClient.invokeFunction({ method: "summary_operations", data: filterData, }),
    select: (response) => response?.data?.data
  })

  const operationsSummary = useMemo(() => {
    return {
      display_currency_code: operationsTotal?.display_currency_code,
      net_cash_flow: operationsTotal?.net_cash_flow
    }
  }, [operationsTotal])


  // Flatten all pages into a single array
  const allOperations = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
  }, [infiniteData])



  const operationsPeriod = useMemo(() => {
    return <p className='text-neutral-600'>
      {moment.parseZone(dateRange?.start).format("DD MMM, 'YY")}
      <span className='mx-4'>-</span>
      {moment.parseZone(dateRange?.end).format("DD MMM, 'YY")}
    </p>
  }, [dateRange])

  const { handleScroll, scrollRef } = useScrollDetector(2000)


  // ── Virtualizer ────────────────────────────────────────────────────────────
  const operationsList = useMemo(() => ({
    future: operationsDto(allOperations, 'future'),
    today: operationsDto(allOperations, 'today'),
    before: operationsDto(allOperations, 'before'),
  }), [allOperations])

  const flatItems = useMemo(
    () => buildFlatItems(operationsList, to),
    [operationsList, to]
  )


  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (flatItems[i]?.type === 'header' ? 36 : 56),
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()



  const handleNavigateOperations = () => {
    operationFilterStore.setAutoFilter(filterData)
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
    if (typeof window !== 'undefined') {
      window.open('/operations', '_blank')
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={onClose} contentClass=" p-0" className=" p-0">
      <div className='w-[900px]! '>
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
            {operationsSummary && <div className="flex items-center gap-1">
              <span>{(title === 'Списания' || title === '') ? "-" : ""}{operationsSummary?.net_cash_flow !== undefined ? formatNumber(formatTotalSumma(operationsSummary?.net_cash_flow)) : ''}</span>
              <span>{operationsSummary?.display_currency_code || GlobalCurrency.code}</span>
            </div>}
          </div>
        </div>

        {/* Table */}
        <div
          id="scrollableDiv"
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-auto w-full px-2 bg-white max-h-[400px]"
        >

          <div className="flex sticky top-0 z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200">
            <div className="min-w-36 pl-5 flex p-3 items-center justify-start">
              {to('columns.date')}
            </div>
            <div className="min-w-18 max-w-52 flex-1 flex p-3 items-center justify-start">
              {to('columns.account')}
            </div>
            <div className="min-w-14 flex p-3 items-center justify-center">
              {to('columns.type')}
            </div>
            <div className="min-w-20 flex-1 flex p-3 items-center justify-start">
              {to('columns.counterparty')}
            </div>
            <div className="min-w-20 flex-1 text-start p-3 items-center justify-start">
              {to('columns.statya')}
            </div>
            <div className="min-w-36 flex p-3 items-center justify-end">
              {to('columns.amount')}
            </div>
          </div>

          {allOperations.length === 0 && !isLoadingOperations && (
            <div className="py-20 text-center text-neutral-500 bg-white">
              {to('page.noData')}
            </div>
          )}

          <InfiniteScroll
            dataLength={allOperations.length}
            hasMore={hasNextPage}
            next={fetchNextPage}
            scrollThreshold={0.5}
            scrollableTarget="scrollableDiv"
          >
            <div style={{ height: totalSize, position: 'relative', paddingBottom: 10 }}>
              {virtualItems.map((virtualRow) => {
                const item = flatItems[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
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
                        <IncomePaymentTableRow op={item.op} />
                      </Suspense>
                    )}
                  </div>
                )
              })}
            </div>
          </InfiniteScroll>


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

