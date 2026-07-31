import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const SummaryItem = ({ label, value, cur, green }) => (
  <span className="flex items-center gap-1.5">
    <span className="text-neutral-400">{label}:</span>
    <b className={cn('font-bold', green ? 'text-green-600' : 'text-neutral-800')}>{value}</b>
    {cur ? <span className="text-neutral-400">{cur}</span> : null}
  </span>
)

const PagerButton = ({ disabled, onClick, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex items-center justify-center border border-gray-200 rounded px-1.5 py-0.5 bg-white text-neutral-400 transition-colors enabled:hover:text-neutral-700 enabled:hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
  >
    {children}
  </button>
)

// currency приходит из list_stock_balances — суммы считаются в валюте остатков,
// а не в валюте, выбранной в шапке приложения
const WarehouseFooter = ({ t, totals, page, totalPages, total, limit, onPageChange, currency }) => {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-gray-200 bg-neutral-100 px-6 py-3 text-sm">
      <SummaryItem label={t('footer.positions')} value={totals.positions} />
      <SummaryItem label={t('footer.totalBalance')} value={formatNumber(totals.balance)} />
      <SummaryItem label={t('footer.waitingBalance')} value={formatNumber(totals.waiting)} />
      <SummaryItem label={t('footer.availableBalance')} value={formatNumber(totals.available)} />
      <SummaryItem label={t('footer.totalCost')} value={formatNumber(totals.totalCost)} cur={currency} />
      <SummaryItem label={t('footer.totalSale')} value={formatNumber(totals.totalSale)} cur={currency} green />

      <div className="ml-auto flex items-center gap-2 text-neutral-400">
        <PagerButton disabled={page <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft size={16} />
        </PagerButton>
        <PagerButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={16} />
        </PagerButton>
        <span className="min-w-max px-1">{t('footer.pageInfo', { from, to, total })}</span>
        <PagerButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={16} />
        </PagerButton>
        <PagerButton disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight size={16} />
        </PagerButton>
      </div>
    </div>
  )
}

export default WarehouseFooter
