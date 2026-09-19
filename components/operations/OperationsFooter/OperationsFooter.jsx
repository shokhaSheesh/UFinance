"use client"
import { cn } from '@/lib/utils'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import useMounted from '../../../hooks/useMounted'
import Money from '../../shared/Money'
import styles from './OperationsFooter.module.scss'

// Суммы в футере — тем же форматом, что и в строках таблицы:
// копейки печатаются мелким шрифтом и только при включённой настройке
const sum = value => <Money value={value ?? 0} />
const count = value => value ?? 0

// left-20 — ширина бокового меню (Sidebar, w-[80px]). Панель фильтров
// стала оверлеем и ширину контента больше не меняет, так что смещение
// под неё больше не нужно.
export const OperationsFooter = observer(({ totalSummary }) => {


  const t = useTranslations('Operations')
  const mounted = useMounted()

  if (!mounted) return null

  return (
    <div className={cn('fixed bg-neutral-100 p-2  border-neutral-200 border-t items-center justify-center bottom-0 left-0 right-0 py-1 z-30 transition-all duration-300', 'left-20')}>
      <div className="flex items-center">
        <div className="flex items-center text-sm">
          <div className='flex flex-col border-r border-neutral-400 px-4'>
            <p className=' capitalize'>{t('footer.operations')}</p>
            <strong className={styles.footerText}>
              {count(totalSummary?.count)}
            </strong>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'>{t('footer.receipts')}</p>
              <strong className={styles.footerText}>
                {count(totalSummary?.by_type?.receipt?.count)}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {sum(totalSummary?.by_type?.receipt?.total_summa)}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'>{t('footer.payments')}</p>
              <strong className={styles.footerText}>
                {count(totalSummary?.by_type?.payment?.count)}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {sum(totalSummary?.by_type?.payment?.total_summa)}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>

          <div className="flex flex-col border-r border-neutral-400 px-4">
            <div className="flex gap-2">
              <p className=' capitalize'>{t('footer.transfers')}</p>
              <strong className={styles.footerText}>
                {count(totalSummary?.by_type?.transfer?.count)}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <strong className={styles.footerText}>
                {sum(totalSummary?.by_type?.transfer?.total_summa)}
              </strong>
              <span>{GlobalCurrency?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex text-sm flex-col border-r border-neutral-400 px-4">
          <div className="flex gap-2">
            <p className=' capitalize'>{t('footer.total')}</p>
          </div>
          <div className={cn("flex items-center gap-2", totalSummary?.net_cash_flow >= 0 ? "text-green-600" : "text-red-600")}>
            <strong>
              {totalSummary?.net_cash_flow > 0 ? '+' : ''}
              {sum(totalSummary?.net_cash_flow)}
            </strong>
            <span>{GlobalCurrency?.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
})
