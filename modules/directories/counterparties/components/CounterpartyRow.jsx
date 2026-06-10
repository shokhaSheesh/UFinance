import { CounterpartyMenu } from '@/components/directories/CounterpartyMenu/CounterpartyMenu'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { cn } from '@/lib/utils'
import { safeCompare, safeFormatNumber } from '../utils/counterpartiesUtils'

const CounterpartyRow = ({
  item, isNested = false, isSelected, onToggleSelect, onNavigate,
  filters, onEdit, onDelete
}) => {
  const diffStyle = safeCompare(item?.difference)
  const profitStyle = safeCompare(item?.profit)
  const styleDifference = diffStyle === 'positive' ? 'text-emerald-500' : diffStyle === 'negative' ? 'text-red-500' : 'text-neutral-500'
  const styleProfit = profitStyle === 'positive' ? 'text-emerald-500' : profitStyle === 'negative' ? 'text-red-500' : 'text-neutral-500'

  return (
    <div
      className={cn(
        "flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm",
        isSelected && "bg-blue-50/50"
      )}
      onClick={() => onNavigate(item.guid)}
    >
      <div className={cn("flex items-center justify-center", isNested ? "w-10 pl-4" : "w-12")} onClick={(e) => e.stopPropagation()}>
        <OperationCheckbox checked={isSelected} onChange={() => onToggleSelect(item.id)} />
      </div>
      <div className={cn("flex-1 min-w-[200px] flex flex-col justify-center", isNested ? "px-3 pl-8" : "px-2")}>
        <span className="text-slate-900 font-medium truncate">{item.nazvanie}</span>
        {item.komentariy && <span className="text-neutral-400 text-mini truncate">{item.komentariy}</span>}
      </div>
      {!isNested && (
        <div className="w-40 flex px-2 items-center text-neutral-500 truncate">{item.gruppa || '–'}</div>
      )}
      {filters.calculationMethod !== 'Cashflow' && (
        <div className="w-32 flex px-2 items-center text-neutral-500 truncate">{item.inn || '–'}</div>
      )}
      <div className="w-24 flex px-2 items-center justify-center text-neutral-500">{item?.operationCount ?? 0}</div>
      <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
        {safeFormatNumber(item?.debitorka)}
      </div>
      <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
        {safeFormatNumber(item?.kreditorka)}
      </div>
      <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
        {safeFormatNumber(item?.income)}
      </div>
      <div className="w-32 flex px-2 items-center justify-end text-neutral-500">
        {safeFormatNumber(item?.expenses)}
      </div>
      <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
        {safeFormatNumber(filters.calculationMethod === 'Cashflow' ? item?.difference : item?.profit)}
      </div>
      <div className="w-10 flex px-2 items-center justify-center group" onClick={(e) => e.stopPropagation()}>
        <CounterpartyMenu counterparty={item} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

export default CounterpartyRow
