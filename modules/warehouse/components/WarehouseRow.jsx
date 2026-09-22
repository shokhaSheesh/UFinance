import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'
import { Package } from 'lucide-react'

const tdBase = 'px-3.5 py-3 border-b border-slate-100 whitespace-nowrap text-slate-700'
const num = 'text-right tabular-nums'

/**
 * Строка остатков: значок товара рядом с названием (раньше — отдельной
 * колонкой без заголовка между единицей и днями), нули бледные,
 * «Доступно» — жирнее: это то, что можно отгрузить.
 */
const WarehouseRow = ({ item, number }) => {
  return (
    <tr className="transition-colors hover:bg-[#f5f8ff]">
      <td className={cn(tdBase, 'text-center tabular-nums text-slate-400')}>{number}</td>
      <td className={cn(tdBase, 'font-medium text-slate-900')}>
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
            <Package size={15} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="max-w-[320px] truncate">{item.name}</span>
        </span>
      </td>
      <td className={cn(tdBase, 'text-slate-500')}>{item.artikul || '—'}</td>
      <td className={cn(tdBase, num)}>{formatNumber(item.balance)}</td>
      <td className={cn(tdBase, num, !item.waiting ? 'text-slate-300' : 'text-amber-700')}>{formatNumber(item.waiting)}</td>
      <td className={cn(tdBase, num, 'font-semibold text-slate-900', !item.available && 'text-slate-300')}>{formatNumber(item.available)}</td>
      <td className={cn(tdBase, 'text-slate-500')}>{item.unit}</td>
      <td className={cn(tdBase, num, 'text-slate-500')}>{formatNumber(item.daysInStock)}</td>
      <td className={cn(tdBase, num)}>{formatNumber(item.averageCost)}</td>
      <td className={cn(tdBase, num)}>{formatNumber(item.totalCost)}</td>
      <td className={cn(tdBase, num)}>{formatNumber(item.salePrice)}</td>
      <td className={cn(tdBase, num, 'font-medium text-slate-900')}>{formatNumber(item.saleTotal)}</td>
    </tr>
  )
}

export default WarehouseRow
