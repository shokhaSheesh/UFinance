// components/DealsTableHeader.jsx
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'

// Ширины колонок — общие для шапки и строк
export const DEAL_COL = {
  date: 'w-28 shrink-0',
  name: 'min-w-[180px] flex-1',
  client: 'min-w-[170px] flex-1',
  status: 'w-32 shrink-0',
  amount: 'w-36 shrink-0',
  progress: 'w-32 shrink-0',
  profit: 'w-36 shrink-0',
  menu: 'w-10 shrink-0',
}

/**
 * Шапка колонок таблицы сделок. Прилипает под шапкой страницы.
 */
export default function DealsTableHeader({ t }) {
  return (
    <div className="sticky top-16 z-30 flex h-10 items-center border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
      <div className={cn(DEAL_COL.date, 'px-4')}>{t('table.date')}</div>
      <div className={cn(DEAL_COL.name, 'px-3')}>{t('table.name')}</div>
      <div className={cn(DEAL_COL.client, 'px-3')}>{t('table.client')}</div>
      <div className={cn(DEAL_COL.status, 'px-3')}>{t('table.status')}</div>
      <div className={cn(DEAL_COL.amount, 'px-3 text-right')}>
        {t('table.dealAmount')}, {GlobalCurrency?.name}
      </div>
      <div className={cn(DEAL_COL.progress, 'px-3')}>{t('table.received')}</div>
      <div className={cn(DEAL_COL.progress, 'px-3')}>{t('table.shipped')}</div>
      <div className={cn(DEAL_COL.profit, 'px-3 text-right')}>
        {t('table.profit')}, {GlobalCurrency?.name}
      </div>
      <div className={DEAL_COL.menu} aria-hidden="true" />
    </div>
  )
}
