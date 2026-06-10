import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

const ProductServiceTableHeader = ({
  t, tc, filters,
  selectedItems, totalItemsCount,
  onSelectAll, canDelete,
  isAllExpanded, toggleExpandAll,
  onBulkDelete
}) => (
  <thead className="sticky top-16">
    <tr className={cn('bg-neutral-100 text-neutral-500 font-normal py-4 text-xs w-full border-b border-gray-300', selectedItems.size > 0 && 'bg-neutral-50')}>
      <th className='w-10'>
        <div className='flex items-center justify-center'>
          <OperationCheckbox
            checked={selectedItems.size === totalItemsCount && totalItemsCount > 0}
            onChange={onSelectAll}
          />
        </div>
      </th>
      {selectedItems.size > 0 ? (
        <th colSpan={9} className='py-1 px-2'>
          <div className='flex items-center gap-6'>
            <span className='font-semibold text-sm text-neutral-700'>{t('selected')}: {selectedItems.size}</span>
            <div className='flex items-center gap-4'>
              {canDelete && (
                <button onClick={onBulkDelete} className='flex items-center gap-1.5 text-red-500 hover:text-red-600 font-medium cursor-pointer'>
                  <Trash2 size={16} />
                  <span>{tc('delete')}</span>
                </button>
              )}
            </div>
          </div>
        </th>
      ) : (
        <>
          <th className='p-2 text-start'>
            <div className="flex items-center gap-2">
              {filters?.group === 'group' && (
                <button onClick={toggleExpandAll} className="p-1 hover:bg-neutral-200 rounded cursor-pointer">
                  {isAllExpanded ? <ExpendClose /> : <ExpendOpen />}
                </button>
              )}
              <span>{t('tableHeaders.name')}</span>
            </div>
          </th>
          <th className='p-2 text-start'>{t('tableHeaders.type')}</th>
          <th className='p-2 text-start'>{t('tableHeaders.article')}</th>
          <th className='p-2 text-end'>{t('tableHeaders.price')}</th>
          <th className='p-2 text-center'>{t('tableHeaders.unit')}</th>
          <th className='p-2 text-center'>{t('tableHeaders.vat')}</th>
          <th className='p-2 text-end'>{t('tableHeaders.priceWithVat')}</th>
          <th className='p-2 text-start'>{t('tableHeaders.comment')}</th>
          <th className='p-2 text-start w-10'>&nbsp;</th>
        </>
      )}
    </tr>
  </thead>
)

export default ProductServiceTableHeader
