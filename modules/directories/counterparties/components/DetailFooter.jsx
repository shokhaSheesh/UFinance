import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/utils/helpers'

/**
 * Итоги по операциям контрагента — подвал таблицы операций. Прилипает к низу
 * области прокрутки, а не к окну: раньше полоса была фиксированной поверх
 * страницы и накрывала последние строки таблицы.
 */
const DetailFooter = ({ t, summary, stats }) => (
  <div className="sticky bottom-0 z-20 flex h-11 items-center justify-start rounded-b-xl border-t border-slate-200 bg-slate-50 px-5">
    <div className="flex items-center gap-5 text-xss">
      <span className="text-xs text-gray-600">
        <span className="font-semibold text-slate-900">{summary?.total}</span>{' '}
        {summary?.total === 1 ? t('footer.operations') : summary?.total < 5 ? t('footer.operationsPlural') : t('footer.operationsPluralMany')}
      </span>
      {stats.receiptsCount > 0 && (
        <span className="text-xs text-gray-600">
          {stats.receiptsCount} {stats.receiptsCount === 1 ? t('footer.receipts') : stats.receiptsCount < 5 ? t('footer.receiptsPlural') : t('footer.receiptsPluralMany')}:{' '}
          <span className="font-semibold text-slate-900">{formatAmount(summary?.incoming)} {GlobalCurrency?.name}</span>
        </span>
      )}
      {stats.paymentsCount > 0 && (
        <span className="text-xs text-gray-600">
          {stats.paymentsCount} {stats.paymentsCount === 1 ? t('footer.payments') : stats.paymentsCount < 5 ? t('footer.paymentsPlural') : t('footer.paymentsPluralMany')}:{' '}
          <span className="font-semibold text-slate-900">{formatAmount(summary?.outgoing)} {GlobalCurrency?.name}</span>
        </span>
      )}
      <span className="text-xs text-gray-600">
        {t('footer.total')}:{' '}
        <span className={cn('font-semibold', summary?.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {summary?.profit >= 0 ? '+' : ''}{formatAmount(summary?.profit || 0)} {GlobalCurrency?.name}
        </span>
      </span>
    </div>
  </div>
)

export default DetailFooter
