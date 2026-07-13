import { GlobalCurrency } from '@/constants/globalCurrency'
import { useTranslations } from 'next-intl'

export default function PurchasesTableHeader({ t }) {
  const tp = useTranslations('Purchases')
  return (
    <div className="flex h-12 sticky top-[60px] z-10 text-xs font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200">
      <div className="w-32 flex px-2 items-center justify-start">{t('table.date')}</div>
      <div className="flex-1 min-w-24  flex px-2 items-center justify-start">{t('table.name')}</div>
      <div className="flex-1 min-w-32 flex px-2 items-center justify-start">{tp('table.client')}</div>
      <div className="w-28 flex px-2 items-center justify-center">{t('table.status')}</div>
      <div className="w-36 flex px-2 items-center justify-end gap-1">
        <span>{t('table.dealAmount')}</span>
          <span>{GlobalCurrency?.name}</span>
      </div>
      <div className="w-24 flex px-2 items-center justify-end">{tp('table.received')}</div>
      <div className="w-24 flex px-2 items-center justify-end">{tp('table.shipped')}</div>
      <div className="w-20 shrink-0" aria-hidden="true"></div>
    </div>
  )
}
