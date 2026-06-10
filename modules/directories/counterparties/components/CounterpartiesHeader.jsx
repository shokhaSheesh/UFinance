import { SearchBar } from '@/components/directories/SearchBar/SearchBar'
import ReturnPermissionContent from '@/components/shared/ReturnPermissionContent'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { BsList } from 'react-icons/bs'
import { LuListTree } from 'react-icons/lu'
import { getCalculationOptions } from '../utils/counterpartiesUtils'

const CounterpartiesHeader = ({
  t, tc, canAdd, onCreateClick,
  filters, setFilters,
  viewMode, setViewMode,
  searchQuery, setSearchQuery,
  exportCounterparties, isExporting
}) => (
  <div className="sticky top-0 z-40 bg-white flex items-center justify-between h-16">
    <div className='flex items-center gap-4'>
      <h1 className="text-xl font-semibold">{t('list.title')}</h1>
      <ReturnPermissionContent
        canPermission={canAdd}
        content={<button onClick={onCreateClick} className="primary-btn">{t('list.createButton')}</button>}
      />
    </div>
    <div className="flex items-center justify-self-center gap-2">
      <div className='w-[250px]'>
        <SingleSelect
          data={getCalculationOptions(t)}
          value={filters.calculationMethod}
          onChange={(selected) => setFilters(prev => ({ ...prev, calculationMethod: selected }))}
          className={'bg-white'}
          placeholder={tc('placeholders.select')}
          withSearch={false}
          isClearable={false}
        />
      </div>
      <div className="flex items-center">
        <button
          className={cn("border-l border-t border-b border-neutral-200 cursor-pointer rounded-l-md py-2 px-2", viewMode === 'list' && 'border-primary border-r')}
          onClick={() => setViewMode('list')}
          title={t('list.viewModes.list')}
        >
          <BsList size={18} strokeWidth={.5} />
        </button>
        <button
          className={cn("border-neutral-200 border-r border-t border-b cursor-pointer rounded-r-md py-2 px-2", viewMode === 'nested' && 'border-primary border-l')}
          onClick={() => setViewMode('nested')}
          title={t('list.viewModes.nested')}
        >
          <LuListTree size={18} />
        </button>
      </div>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <button onClick={exportCounterparties} type='button' className="primary-btn">
        {t('list.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    </div>
  </div>
)

export default CounterpartiesHeader
