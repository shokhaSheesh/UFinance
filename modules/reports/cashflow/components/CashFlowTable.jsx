import { cn } from '@/lib/utils'
import CashFlowTableRow from './CashFlowTableRow'

const CashFlowTable = ({ t, data, months, legend, expandedMap, onToggle, onCellClick }) => (
  <div className='flex flex-1 overflow-hidden'>
    <div className="overflow-x-auto">
      <table className="w-full mb-10">
        <thead className="bg-neutral-100 sticky top-0 z-50">
          <tr>
            <th
              className={cn("text-left text-xs font-medium sticky left-0 z-40 bg-neutral-100 transition-shadow duration-300")}
              style={{ minWidth: 420 }}
            >
              <p className='px-4 w-full border-r py-2'>{t('cashflow.articleHeader')}</p>
            </th>
            {legend.map(col => (
              <th key={col?.key} className="text-right bg-neutral-100 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] text-xs border-r border-neutral-200 text-xss! font-medium">
                <span className='line-clamp-1 border-l px-4 py-2'>{col?.title}</span>
              </th>
            ))}
            <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium">
              {t('common.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <CashFlowTableRow
              key={row?.uniquePath}
              row={row}
              months={months}
              legend={legend}
              depth={0}
              expandedMap={expandedMap}
              onToggle={onToggle}
              onCellClick={onCellClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default CashFlowTable
