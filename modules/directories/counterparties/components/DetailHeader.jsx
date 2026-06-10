import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { ChevronRight, MoreHorizontal, PenLine, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getDetailCalculationOptions } from '../utils/counterpartiesUtils'

const DetailHeader = ({
  t, tc, counterpartyInfo,
  filters, setFilters,
  canEdit, canDelete,
  onEdit, onDelete
}) => (
  <>
    {/* Breadcrumbs */}
    <div className="flex items-center px-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center text-xs h-10">
        <Link href="/directories/counterparties" className="text-gray-500 hover:text-gray-700 transition-colors">
          {t('backToList')}
        </Link>
        <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
        <span className="text-neutral-900 text-sm font-medium">{counterpartyInfo?.name || tc('noName')}</span>
      </div>
    </div>

    {/* Header */}
    <div className="bg-slate-50 px-6 py-5 shrink-0">
      <div className="flex items-center gap-6 mb-5">
        <h1 className="text-2xl font-bold text-slate-900">{counterpartyInfo?.name || 'Контрагент'}</h1>
        <div className="flex items-center gap-3 flex-1">
          <div style={{ width: '250px' }}>
            <NewDateRangeComponent
              value={filters.dateRange}
              onChange={(range) => {
                const startDate = range?.start ? formatDate(new Date(range.start)) : ''
                const endDate = range?.end ? formatDate(new Date(range.end)) : ''
                setFilters((prev) => ({ ...prev, operationDateStart: startDate, operationDateEnd: endDate, dateRange: range }))
              }}
              present={counterpartiesStore.singePageDateRangeType}
              onSetPresent={present => counterpartiesStore.setState('singePageDateRangeType', present)}
              onClear={() => counterpartiesStore.setState('singePageDateRangeType', '')}
            />
          </div>
          <div style={{ width: '250px' }}>
            <SingleSelect
              data={getDetailCalculationOptions(t)}
              value={filters?.calculationMethod || 'Cashflow'}
              onChange={(selected) => setFilters(prev => ({ ...prev, calculationMethod: selected }))}
              placeholder={tc('placeholders.select')}
              isClearable={false}
              withSearch={false}
            />
          </div>
        </div>
        {(canEdit || canDelete) && (
          <Popover>
            <PopoverTrigger asChild>
              <span className="flex items-center justify-center w-[38px] h-[38px] rounded-md border border-gray-200 bg-white text-slate-500 cursor-pointer transition-all hover:bg-slate-100 hover:border-gray-400">
                <MoreHorizontal size={20} />
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 rounded-md overflow-hidden p-0 border border-gray-50! ring ring-neutral-100 bg-white shadow-md mt-1">
              <div className="flex flex-col">
                {canEdit && (
                  <span className="flex items-center px-4 py-3 text-sm text-slate-900 cursor-pointer transition-colors hover:bg-slate-100" onClick={onEdit}>
                    <PenLine size={18} className="mr-3 text-slate-700 cursor-pointer" />
                    {tc('edit')}
                  </span>
                )}
                {canDelete && (
                  <span className="flex items-center px-4 py-3 text-sm text-red-500 cursor-pointer transition-colors hover:bg-red-50" onClick={onDelete}>
                    <Trash2 size={18} className="mr-3 text-red-500" />
                    {tc('delete')}
                  </span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  </>
)

export default DetailHeader
