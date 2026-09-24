import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

const th =
  'sticky top-0 z-10 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500 px-3 py-2.5 border-b border-slate-200 whitespace-nowrap'

const ProductServiceTableHeader = ({ t, filters, isAllExpanded, toggleExpandAll }) => (
  <thead>
    <tr>
      <th className={cn(th, 'text-start')}>
        <div className="flex items-center gap-2">
          {filters?.group === 'group' && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 cursor-pointer hover:bg-slate-200 hover:text-slate-700"
            >
              {isAllExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          )}
          <span>{t('tableHeaders.name')}</span>
        </div>
      </th>
      <th className={cn(th, 'text-start')}>{t('tableHeaders.type')}</th>
      <th className={cn(th, 'text-start')}>{t('tableHeaders.article')}</th>
      <th className={cn(th, 'text-end')}>{t('tableHeaders.price')}</th>
      <th className={cn(th, 'text-center')}>{t('tableHeaders.unit')}</th>
      <th className={cn(th, 'text-center')}>{t('tableHeaders.vat')}</th>
      <th className={cn(th, 'text-end')}>{t('tableHeaders.priceWithVat')}</th>
      <th className={cn(th, 'text-start')}>{t('tableHeaders.comment')}</th>
      <th className={cn(th, 'w-10')}>&nbsp;</th>
    </tr>
  </thead>
)

export default ProductServiceTableHeader
