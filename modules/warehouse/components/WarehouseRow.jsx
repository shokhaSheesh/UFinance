import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'
import { Package } from 'lucide-react'

const tdBase =
  'px-3.5 py-3 border-b border-gray-100 whitespace-nowrap text-neutral-700'

const WarehouseRow = ({ item, number }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className={cn(tdBase, 'text-center text-neutral-400')}>{number}</td>
      <td className={cn(tdBase, 'font-medium')}>{item.name}</td>
      <td className={cn(tdBase, 'text-neutral-400')}>{item.artikul || '—'}</td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.balance)}</td>
      <td className={cn(tdBase, 'text-right', !item.waiting && 'text-neutral-300')}>
        {formatNumber(item.waiting)}
      </td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.available)}</td>
      <td className={cn(tdBase, 'text-neutral-400')}>{item.unit}</td>
      <td className={cn(tdBase, 'text-center')}>
        <Package size={20} className="inline text-neutral-400" strokeWidth={1.5} />
      </td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.daysInStock)}</td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.averageCost)}</td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.totalCost)}</td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.salePrice)}</td>
      <td className={cn(tdBase, 'text-right')}>{formatNumber(item.saleTotal)}</td>
    </tr>
  )
}

export default WarehouseRow
