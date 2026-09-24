import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

// Ширины колонок — общие для шапки и строк
export const PURCHASE_COL = {
  date: 'w-28 shrink-0',
  name: 'min-w-[180px] flex-1',
  client: 'min-w-[170px] flex-1',
  status: 'w-32 shrink-0',
  amount: 'w-36 shrink-0',
  progress: 'w-32 shrink-0',
  menu: 'w-10 shrink-0',
}

/** Шапка колонок таблицы закупок. Прилипает под шапкой страницы. */
export default function PurchasesTableHeader({ t }) {
  const tp = useTranslations('Purchases')
  return (
    <div className="sticky top-16 z-30 flex h-10 items-center border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
      <div className={cn(PURCHASE_COL.date, 'px-4')}>{t('table.date')}</div>
      <div className={cn(PURCHASE_COL.name, 'px-3')}>{t('table.name')}</div>
      <div className={cn(PURCHASE_COL.client, 'px-3')}>{tp('table.client')}</div>
      <div className={cn(PURCHASE_COL.status, 'px-3')}>{t('table.status')}</div>
      <div className={cn(PURCHASE_COL.amount, 'px-3 text-right')}>
        {t('table.dealAmount')}, {GlobalCurrency?.name}
      </div>
      <div className={cn(PURCHASE_COL.progress, 'px-3')}>{tp('table.received')}</div>
      <div className={cn(PURCHASE_COL.progress, 'px-3')}>{tp('table.shipped')}</div>
      <div className={PURCHASE_COL.menu} aria-hidden="true" />
    </div>
  )
}
