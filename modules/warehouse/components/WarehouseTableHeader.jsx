import { cn } from '@/lib/utils'
import { Settings2 } from 'lucide-react'

const thBase =
  'sticky top-0 z-10 bg-white text-left font-medium text-neutral-400 text-xs px-3.5 py-3 border-b border-gray-200 whitespace-nowrap'

const WarehouseTableHeader = ({ t }) => {
  return (
    <thead>
      <tr>
        <th className={thBase}>{t('columns.name')}</th>
        <th className={thBase}>{t('columns.artikul')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.balance')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.waiting')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.available')}</th>
        <th className={thBase}>{t('columns.unit')}</th>
        <th className={cn(thBase, 'text-center')} aria-hidden="true"></th>
        <th className={cn(thBase, 'text-right')}>{t('columns.daysInStock')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.cost')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.totalCost')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.salePrice')}</th>
        <th className={cn(thBase, 'text-right')}>{t('columns.saleTotal')}</th>
        <th className={cn(thBase, 'text-center')}>
          <Settings2 size={16} className="inline text-neutral-400" />
        </th>
      </tr>
    </thead>
  )
}

export default WarehouseTableHeader
