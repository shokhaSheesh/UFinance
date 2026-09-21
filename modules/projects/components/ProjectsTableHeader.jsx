import { GlobalCurrency } from '@/constants/globalCurrency'
import { ChevronDown } from 'lucide-react'

/**
 * Строка заголовков таблицы проектов.
 */
export default function ProjectsTableHeader({ t }) {
  const symbol = GlobalCurrency?.name || '₽'

  return (
    <div className="flex h-11 sticky top-[60px] z-10 text-xs font-medium text-neutral-500 items-center bg-white border-b border-neutral-200">
      <div className="flex-1 min-w-40 flex pl-4 pr-2 items-center justify-start gap-1 cursor-pointer">
        <span className="text-neutral-700 font-semibold">{t('table.name')}</span>
        <ChevronDown size={14} />
      </div>
      <div className="w-40 shrink-0 flex px-2 items-center justify-start">{t('table.group')}</div>
      <div className="w-40 shrink-0 flex px-2 items-center justify-start gap-1">
        <span>{t('table.start')}</span>
        <span className="text-neutral-300">/</span>
        <span>{t('table.end')}</span>
      </div>
      <div className="w-32 shrink-0 flex px-2 items-center justify-start">{t('table.status')}</div>
      <div className="w-32 shrink-0 flex px-2 items-center justify-end gap-1">
        <span>{t('table.income')}</span>
        <span>{symbol}</span>
      </div>
      <div className="w-28 shrink-0 flex px-2 items-center justify-end gap-1">
        <span>{t('table.expenses')}</span>
        <span>{symbol}</span>
      </div>
      <div className="w-32 shrink-0 flex px-2 items-center justify-end gap-1">
        <span>{t('table.profit')}</span>
        <span>{symbol}</span>
      </div>
      <div className="w-32 shrink-0 flex px-2 items-center justify-end">{t('table.profitability')}</div>
      <div className="w-[80px] shrink-0" />
    </div>
  )
}
