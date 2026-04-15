"use client"
import { cn } from '@/app/lib/utils'
import styles from './OperationsFooter.module.scss'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { observer } from 'mobx-react-lite'
import useMounted from '../../../hooks/useMounted'

export const OperationsFooter = observer(({ isFilterOpen = false, totalSummary }) => {
  const mounted = useMounted()

  if (!mounted) return null

  return (
    <div className={cn('fixed bg-neutral-100 p-2  border-neutral-200 border-t items-center justify-center bottom-0 left-0 right-0 py-1 z-30 transition-all duration-300', isFilterOpen ? 'left-[320px]' : 'left-[110px]')}>
      <div className="flex items-center">
        <div className="flex items-center text-sm">
          <div className='flex flex-col border-r border-neutral-400 px-4'>
            <p className=' capitalize'>операций</p>
            <strong className={styles.footerText}>
              {totalSummary?.count}
            </strong>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'> поступлений:</p>
              <strong className={styles.footerText}>
                {totalSummary?.by_type?.receipt?.count}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {formatNumber(formatTotalSumma(totalSummary?.by_type?.receipt?.total_summa))}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'>выплат:</p>
              <strong className={styles.footerText}>
                {totalSummary?.by_type?.payment?.count}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {formatNumber(formatTotalSumma(totalSummary?.by_type?.payment?.total_summa))}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'>перемещения:</p>
              <strong className={styles.footerText}>
                {totalSummary?.by_type?.transfer?.count}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {formatNumber(formatTotalSumma(totalSummary?.by_type?.transfer?.total_summa))}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex text-sm flex-col border-r border-neutral-400 px-4">
          <div className="flex gap-2">
            <p className=' capitalize'>Итого:</p>
          </div>
          <div className={cn("flex items-center gap-2", totalSummary?.net_cash_flow >= 0 ? "text-green-600" : "text-red-600")}>
            <strong>
              {formatNumber(formatTotalSumma(totalSummary?.net_cash_flow))}
            </strong>
            <span>{GlobalCurrency?.name}</span>
          </div>
        </div> 
      </div>
    </div>
  )
})
