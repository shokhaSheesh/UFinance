import PnLTableRow from './PnLTableRow'

const PnLTable = ({ t, rows, legend, expandedRows, onToggle, onCellClick }) => (
  <div className='flex flex-1 overflow-hidden'>
    <div className='overflow-x-auto'>
      <table className="w-full mb-10">
        <thead className="bg-neutral-100 sticky top-0 z-50">
          <tr>
            <th
              className="text-left text-xs font-medium sticky left-0 z-40 bg-neutral-100"
              style={{ minWidth: 420 }}
            >
              <p className='px-4 w-full border-r py-2'>{t('pnl.article')}</p>
            </th>
            {legend.map(period => (
              <th key={period?.key} className="text-right bg-neutral-100 border-none text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] text-xs text-xss! font-medium">
                <span className='line-clamp-1 border-l px-4 py-2'>{period?.title}</span>
              </th>
            ))}
            <th className="text-right bg-neutral-100 text-nowrap whitespace-nowrap lowercase min-w-[80px] max-w-[80px] shrink-0 border-l border-neutral-200 px-4 text-xs py-2 text-xss! font-medium">
              {t('common.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows?.map(row => (
            <PnLTableRow
              key={row?.id}
              item={row}
              parentExpanded={true}
              depth={0}
              legend={legend}
              expandedRows={expandedRows}
              onToggle={onToggle}
              onCellClick={onCellClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default PnLTable
